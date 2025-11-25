/**
 * 플로팅 채팅 패널
 * @description 우측에서 슬라이드되는 채팅 패널
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/shared/store/auth.store';
import { useChatStore } from '@/shared/store/chat.store';
import {
  getMyChatRoom,
  createMyChatRoom,
  getChatRoomList,
  createChatRoomByAdmin,
  getMessageList,
  getChatRoom,
} from '../api/chat.api';
import type { ChatMessage, ChatRoom } from '../api/chat.types';
import { useChatSocket } from '../model/useChatSocket';
import { useTypingIndicator } from '../model/useTypingIndicator';
import { ChatMessageList, ChatInput } from '../ui';
import axios from '@/shared/lib/axios';
import type { residentInfoType } from '@/entities/resident-info/type';
import { getSocket, getCurrentSocket } from '../lib/socket';

export function FloatingChatPanel() {
  const { user } = useAuthStore();
  const { isOpen, closeChat, setUnreadCount } = useChatStore();

  // Admin용 상태
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [residents, setResidents] = useState<residentInfoType[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Resident용 상태
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);

  // 공통 상태
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  // 초기 읽음 상태 스냅샷 (markAsRead 실행 전 상태)
  const [initialReadStates, setInitialReadStates] = useState<Map<string, boolean>>(new Map());

  // 메시지 전송 시간 추적 (자동 스크롤용)
  const [lastMessageSentTime, setLastMessageSentTime] = useState<number>(0);

  const isAdmin = user?.role === 'ADMIN';
  const isResident = user?.role === 'USER';

  // ==================== Socket 재연결 시도 ====================

  // 채팅 패널이 열릴 때 Socket 재연결 시도 (인증된 사용자만)
  useEffect(() => {
    // 인증 초기화 완료 및 로그인 사용자만 Socket 연결
    if (!user?.id || !isOpen) return;

    // getSocket()은 Socket이 disconnect 상태면 자동으로 재연결 시도
    getSocket();
  }, [user?.id, isOpen]);

  // ==================== Socket.io 연결 ====================

  const { sendMessage, markAsRead, isConnected, isJoinedRoom } = useChatSocket(
    {
      chatRoomId: isAdmin ? selectedRoom?.id || null : chatRoom?.id || null,
    },
    {
      onNewMessage: (message) => {
        setMessages((prev) => [message, ...prev]);

        // Admin: 채팅방 목록 업데이트 + 읽지 않은 메시지 수 증가 + 상단으로 이동
        if (isAdmin) {
          setChatRooms((prev) => {
            const updatedRooms = prev.map((room) => {
              if (room.id === message.chatRoomId) {
                const isMyMessage = message.senderId === user?.id;
                const newUnreadCount = isMyMessage ? 0 : room.unreadCountAdmin + 1;
                return {
                  ...room,
                  lastMessage: message.content,
                  lastMessageAt: message.createdAt,
                  unreadCountAdmin: newUnreadCount,
                };
              }
              return room;
            });

            // 최신 메시지가 온 채팅방을 맨 위로 정렬
            return updatedRooms.sort((a, b) => {
              const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
              const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
              return bTime - aTime;
            });
          });
        }

        // Resident: 채팅방 정보 업데이트 + 읽지 않은 메시지 수 증가
        if (isResident && chatRoom && message.chatRoomId === chatRoom.id) {
          const isMyMessage = message.senderId === user?.id;
          const newUnreadCount = isMyMessage ? 0 : chatRoom.unreadCountResident + 1;

          setChatRoom((prev) =>
            prev
              ? {
                  ...prev,
                  lastMessage: message.content,
                  lastMessageAt: message.createdAt,
                  unreadCountResident: newUnreadCount,
                }
              : prev,
          );
        }
      },
      onMessagesRead: (data) => {
        // 상대방이 읽었을 때만 내 안읽음 표시 제거

        // Admin이 받는 경우: Resident가 읽었다는 알림 → Admin의 안읽음 표시 제거
        if (isAdmin && data.role === 'USER') {
          setChatRooms((prev) =>
            prev.map((room) =>
              room.id === data.chatRoomId ? { ...room, unreadCountAdmin: 0 } : room,
            ),
          );

          // 현재 화면에 표시된 메시지들의 읽음 상태 업데이트
          setMessages((prev) =>
            prev.map((msg) =>
              msg.chatRoomId === data.chatRoomId ? { ...msg, isReadByResident: true } : msg,
            ),
          );
        }

        // Resident가 받는 경우: Admin이 읽었다는 알림 → Resident의 안읽음 표시 제거
        if (isResident && data.role === 'ADMIN' && chatRoom?.id === data.chatRoomId) {
          setChatRoom((prev) => (prev ? { ...prev, unreadCountResident: 0 } : prev));

          // 현재 화면에 표시된 메시지들의 읽음 상태 업데이트
          setMessages((prev) =>
            prev.map((msg) =>
              msg.chatRoomId === data.chatRoomId ? { ...msg, isReadByAdmin: true } : msg,
            ),
          );
        }
      },
      onError: (error) => {
        console.error('Socket 에러:', error);
        alert(error.message);
      },
    },
  );

  // ==================== 타이핑 인디케이터 ====================

  const { isOtherUserTyping, emitTyping } = useTypingIndicator({
    socket: getCurrentSocket(), // 이미 생성된 socket만 사용 (없으면 null)
    chatRoomId: isAdmin ? selectedRoom?.id : chatRoom?.id,
    currentUserId: user?.id,
  });

  // ==================== Admin: 채팅방 목록 불러오기 ====================

  // Admin 로그인 시 채팅방 목록 로드 (읽지 않은 메시지 카운트 계산용)
  useEffect(() => {
    if (!isAdmin) return;

    const loadChatRooms = async () => {
      try {
        setIsLoading(true);
        const response = await getChatRoomList({ page: 1, limit: 50 });
        setChatRooms(response.data);
      } catch (err) {
        console.error('채팅방 목록 로드 실패:', err);
        setError('채팅방 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadChatRooms();
  }, [isAdmin]); // isOpen 제거 - 로그인 시 즉시 로드

  // ==================== 읽지 않은 메시지 수 업데이트 ====================

  // Admin: 전체 채팅방의 읽지 않은 메시지 수 합계 계산
  useEffect(() => {
    if (isAdmin) {
      const totalUnread = chatRooms.reduce((sum, room) => sum + room.unreadCountAdmin, 0);
      setUnreadCount(totalUnread);
    }
  }, [isAdmin, chatRooms, setUnreadCount]);

  // Resident: 내 채팅방의 읽지 않은 메시지 수 업데이트
  useEffect(() => {
    if (isResident && chatRoom) {
      setUnreadCount(chatRoom.unreadCountResident);
    }
  }, [isResident, chatRoom, setUnreadCount]);

  // ==================== selectedRoom 동기화 (Admin용) ====================

  useEffect(() => {
    // Admin: chatRooms가 업데이트되면 selectedRoom도 동기화
    if (isAdmin && selectedRoom) {
      const updatedRoom = chatRooms.find((room) => room.id === selectedRoom.id);
      if (updatedRoom && updatedRoom !== selectedRoom) {
        setSelectedRoom(updatedRoom);
      }
    }
  }, [isAdmin, chatRooms, selectedRoom]);

  // ==================== Socket 읽음 처리 ====================

  useEffect(() => {
    // 패널이 열리고, 채팅방에 입장했을 때만 읽음 처리
    if (!isOpen || !isJoinedRoom) return;

    // Admin: 선택된 채팅방에 읽지 않은 메시지가 있을 때
    if (isAdmin && selectedRoom && selectedRoom.unreadCountAdmin > 0) {
      markAsRead();
      setChatRooms((prev) =>
        prev.map((room) => (room.id === selectedRoom.id ? { ...room, unreadCountAdmin: 0 } : room)),
      );
      return;
    }

    // Resident: 내 채팅방에 읽지 않은 메시지가 있을 때
    if (isResident && chatRoom && chatRoom.unreadCountResident > 0) {
      markAsRead();
      setChatRoom((prev) => (prev ? { ...prev, unreadCountResident: 0 } : prev));

      // initialReadStates를 모두 읽음(true)으로 업데이트하여 "여기까지 읽었습니다" 마커 제거
      setInitialReadStates((prev) => {
        const newStates = new Map(prev);
        messages.forEach((msg) => {
          newStates.set(msg.id, true);
        });
        return newStates;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    isJoinedRoom,
    isAdmin,
    isResident,
    selectedRoom?.id,
    selectedRoom?.unreadCountAdmin,
    chatRoom?.unreadCountResident,
    messages.length,
  ]);

  // ==================== Admin: 채팅방 선택 시 메시지 로드 ====================

  const handleSelectRoom = async (room: ChatRoom) => {
    try {
      setSelectedRoom(room);

      // 페이지네이션 상태 초기화 (채팅방 변경 시 중요!)
      setMessages([]);
      setCurrentPage(1);
      setHasMoreMessages(false);

      const roomDetail = await getChatRoom(room.id);

      // 초기 읽음 상태 스냅샷 생성
      const snapshot = new Map<string, boolean>();
      const unreadCount = room.unreadCountAdmin;

      roomDetail.recentMessages.forEach((message, index) => {
        const shouldBeUnread = index < unreadCount;
        snapshot.set(message.id, !shouldBeUnread);
      });

      setInitialReadStates(snapshot);

      setMessages(roomDetail.recentMessages);
      setCurrentPage(1); // 이미 1페이지를 로드했음
      // 메시지가 50개(페이지 크기) 이상이면 더 있을 수 있음, 미만이면 더 이상 없음
      setHasMoreMessages(roomDetail.recentMessages.length >= 50);

      // ✅ unreadCountAdmin을 0으로 리셋하지 않음 - markAsRead useEffect에서 처리
    } catch (err) {
      console.error('메시지 로드 실패:', err);
      alert('메시지를 불러오는데 실패했습니다.');
    }
  };

  // ==================== Admin: 입주민 목록 불러오기 (채팅방 생성용) ====================

  useEffect(() => {
    if (!showCreateModal) return;

    const loadResidents = async () => {
      try {
        const res = await axios.get('/residents', {
          params: {
            isRegistered: true,
            keyword: searchKeyword || undefined,
          },
        });
        setResidents(res.data.residents);
      } catch (err) {
        console.error('입주민 목록 로드 실패:', err);
      }
    };

    loadResidents();
  }, [showCreateModal, searchKeyword]);

  // ==================== Admin: 채팅방 생성 ====================

  const handleCreateChatRoom = async (residentId: string) => {
    try {
      const newRoom = await createChatRoomByAdmin({ residentId });
      setChatRooms((prev) => [newRoom, ...prev]);

      // 채팅방 생성 후 목록 화면으로 돌아가기 (바로 입장하지 않음)
      setShowCreateModal(false);
      setSearchKeyword('');
    } catch (err) {
      console.error('채팅방 생성 실패:', err);
      alert('채팅방 생성에 실패했습니다.');
    }
  };

  // ==================== Resident: 채팅방 조회/생성 (로그인 시) ====================

  useEffect(() => {
    // 인증 초기화 완료 및 로그인 사용자만 Socket 연결
    if (!user?.id || !isResident) return;

    const initChatRoom = async () => {
      try {
        // 채팅방 조회 (없으면 생성)
        let room: ChatRoom;
        try {
          room = await getMyChatRoom();
        } catch {
          room = await createMyChatRoom();
        }

        setChatRoom(room);
      } catch (err) {
        console.error('❌ Resident 채팅방 준비 실패:', err);
      }
    };

    initChatRoom();
  }, [isResident, user?.id]);

  // ==================== Resident: 메시지 불러오기 (패널 열 때) ====================

  useEffect(() => {
    if (!isOpen || !isResident || !chatRoom) return;

    const loadMessages = async () => {
      try {
        setIsLoading(true);

        // 페이지네이션 상태 초기화
        setMessages([]);
        setCurrentPage(1);
        setHasMoreMessages(false);

        const roomDetail = await getChatRoom(chatRoom.id);

        // 초기 읽음 상태 스냅샷 생성
        const snapshot = new Map<string, boolean>();
        const unreadCount = chatRoom.unreadCountResident;

        roomDetail.recentMessages.forEach((message, index) => {
          const shouldBeUnread = index < unreadCount;
          snapshot.set(message.id, !shouldBeUnread);
        });

        setInitialReadStates(snapshot);

        setMessages(roomDetail.recentMessages);
        setCurrentPage(1); // 이미 1페이지를 로드했음
        // 메시지가 50개(페이지 크기) 이상이면 더 있을 수 있음, 미만이면 더 이상 없음
        setHasMoreMessages(roomDetail.recentMessages.length >= 50);
      } catch (err) {
        console.error('메시지 로드 실패:', err);
        setError('메시지를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
    // ✅ chatRoom 대신 chatRoom.id를 dependency로 사용하여 불필요한 리로드 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isResident, chatRoom?.id]);

  // ==================== 이전 메시지 불러오기 (무한 스크롤) ====================

  const handleLoadMoreMessages = async () => {
    // Admin과 Resident 모두 현재 채팅방 ID 확인
    const currentChatRoomId = isAdmin ? selectedRoom?.id : chatRoom?.id;

    if (!currentChatRoomId) {
      console.warn('⚠️ 채팅방이 선택되지 않았습니다.');
      return;
    }

    try {
      const nextPage = currentPage + 1;

      // 다음 페이지 메시지 가져오기
      const messageResponse = await getMessageList({
        chatRoomId: currentChatRoomId,
        page: nextPage,
        limit: 50,
      });

      // 백엔드는 최신순으로 메시지를 주므로 (인덱스 0 = 최신)
      // 기존 메시지(prev)도 최신순이므로, 새 메시지를 뒤에 추가해야 함
      // [1페이지(최신50개), 2페이지(그다음50개), 3페이지(더오래된50개)...]
      setMessages((prev) => [...prev, ...messageResponse.data]);
      setCurrentPage(nextPage);

      // 백엔드 API는 'page'를 사용 (currentPage 아님)
      const hasMore = messageResponse.pagination.page < messageResponse.pagination.totalPages;
      setHasMoreMessages(hasMore);
    } catch (error) {
      console.error('❌ 이전 메시지 로딩 실패:', error);
      throw error; // ChatMessageList에서 에러 처리
    }
  };

  // ==================== 메시지 전송 ====================

  const handleSendMessage = (content: string) => {
    sendMessage(content);
    setLastMessageSentTime(Date.now());
  };

  // ==================== 렌더링 ====================

  return (
    <>
      {/* 슬라이드 패널 */}
      <div
        className={`fixed top-20 right-6 bottom-6 z-50 w-full max-w-md origin-bottom-right rounded-lg bg-white shadow-2xl transition-all duration-300 ease-out ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        }`}
      >
        {/* Admin UI */}
        {isAdmin && (
          <div className='flex h-full overflow-hidden rounded-lg bg-white'>
            {/* 채팅방 목록 화면 */}
            {!selectedRoom && (
              <div className='flex w-full flex-col'>
                {/* 헤더 */}
                <div className='flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4'>
                  <h2 className='text-base font-semibold text-gray-900'>입주민 채팅</h2>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className='rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600'
                    >
                      + 새 채팅
                    </button>
                    <button
                      onClick={closeChat}
                      className='flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'
                    >
                      <svg
                        className='h-5 w-5'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M6 18L18 6M6 6l12 12'
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 채팅방 목록 */}
                <div className='flex-1 overflow-y-auto bg-gray-50'>
                  {isLoading ? (
                    <div className='flex items-center justify-center p-8 text-sm text-gray-500'>
                      로딩 중...
                    </div>
                  ) : chatRooms.length === 0 ? (
                    <div className='flex h-full flex-col items-center justify-center text-gray-400'>
                      <svg
                        className='mb-4 h-16 w-16'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={1.5}
                          d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                        />
                      </svg>
                      <p className='mb-1 text-sm font-medium'>채팅방이 없습니다</p>
                      <p className='text-xs text-gray-400'>새 채팅을 시작해보세요</p>
                    </div>
                  ) : (
                    chatRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => handleSelectRoom(room)}
                        className='mb-1 w-full border-b border-gray-200 bg-white px-5 py-4 text-left transition-all hover:bg-white'
                      >
                        <div className='mb-1 flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <div className='text-sm font-semibold text-gray-900'>
                              {room.resident.name}
                            </div>
                            {room.unreadCountAdmin > 0 && (
                              <span className='inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white'>
                                {room.unreadCountAdmin > 99 ? '99+' : room.unreadCountAdmin}
                              </span>
                            )}
                          </div>
                          {room.lastMessageAt && (
                            <div className='text-xs text-gray-400'>
                              {new Date(room.lastMessageAt).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          )}
                        </div>
                        <div className='mb-1.5 text-xs text-gray-600'>
                          {room.resident.building}동 {room.resident.unitNumber}호
                        </div>
                        {room.lastMessage && (
                          <div className='truncate text-xs text-gray-500'>{room.lastMessage}</div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 채팅 화면 */}
            {selectedRoom && (
              <div className='flex h-full w-full flex-col bg-white'>
                {/* 헤더 */}
                <div className='flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3.5'>
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className='flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100'
                  >
                    <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 19l-7-7 7-7'
                      />
                    </svg>
                  </button>
                  <div className='flex-1'>
                    <div className='mb-0.5 text-sm font-semibold text-gray-900'>
                      {selectedRoom.resident.name}
                    </div>
                    <div className='text-xs text-gray-600'>
                      {selectedRoom.resident.building}동 {selectedRoom.resident.unitNumber}호
                    </div>
                  </div>
                  <button
                    onClick={closeChat}
                    className='flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'
                  >
                    <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                  </button>
                </div>

                {/* 메시지 목록 */}
                <ChatMessageList
                  messages={messages}
                  currentUserId={user?.id || ''}
                  userRole={user?.role === 'ADMIN' || user?.role === 'USER' ? user.role : undefined}
                  isLoading={false}
                  onLoadMore={handleLoadMoreMessages}
                  hasMore={hasMoreMessages}
                  chatRoomId={selectedRoom.id}
                  initialReadStates={initialReadStates}
                  lastMessageSentTime={lastMessageSentTime}
                  isOtherUserTyping={isOtherUserTyping}
                />

                {/* 입력창 */}
                <ChatInput
                  onSend={handleSendMessage}
                  disabled={!isConnected || !isJoinedRoom}
                  placeholder={
                    isConnected && isJoinedRoom ? '메시지를 입력하세요...' : '연결 중...'
                  }
                  onTyping={emitTyping}
                />
              </div>
            )}
          </div>
        )}

        {/* Resident UI */}
        {isResident && (
          <div className='flex h-full flex-col'>
            {/* 헤더 */}
            <div className='flex items-center justify-between border-b bg-blue-500 px-4 py-3 text-white'>
              <div className='flex items-center gap-3'>
                <div>
                  <h2 className='font-bold'>관리자 채팅</h2>
                  <p className='text-xs text-blue-100'>
                    {chatRoom?.apartment?.apartmentName || '아파트'} 관리사무소
                  </p>
                </div>
                {chatRoom && chatRoom.unreadCountResident > 0 && (
                  <span className='inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white shadow-md'>
                    {chatRoom.unreadCountResident > 99 ? '99+' : chatRoom.unreadCountResident}
                  </span>
                )}
              </div>
              <button onClick={closeChat} className='text-white hover:text-blue-100'>
                ✕
              </button>
            </div>

            {/* 메시지 목록 */}
            {isLoading ? (
              <div className='flex flex-1 items-center justify-center'>로딩 중...</div>
            ) : error ? (
              <div className='flex flex-1 flex-col items-center justify-center'>
                <p className='text-red-600'>{error}</p>
                <button onClick={closeChat} className='mt-4 text-blue-500 hover:underline'>
                  닫기
                </button>
              </div>
            ) : (
              <>
                <ChatMessageList
                  messages={messages}
                  currentUserId={user?.id || ''}
                  userRole={user?.role === 'ADMIN' || user?.role === 'USER' ? user.role : undefined}
                  isLoading={false}
                  onLoadMore={handleLoadMoreMessages}
                  hasMore={hasMoreMessages}
                  chatRoomId={chatRoom?.id}
                  initialReadStates={initialReadStates}
                  lastMessageSentTime={lastMessageSentTime}
                  isOtherUserTyping={isOtherUserTyping}
                />
                <ChatInput
                  onSend={handleSendMessage}
                  disabled={!isConnected || !isJoinedRoom}
                  placeholder={
                    isConnected && isJoinedRoom ? '메시지를 입력하세요...' : '연결 중...'
                  }
                  onTyping={emitTyping}
                />
              </>
            )}
          </div>
        )}

        {/* Admin: 채팅방 생성 모달 */}
        {showCreateModal && (
          <div className='bg-opacity-50 absolute inset-0 z-10 flex items-center justify-center bg-black'>
            <div className='w-11/12 max-w-md rounded-lg bg-white p-4'>
              <div className='mb-3 flex items-center justify-between'>
                <h3 className='font-bold text-gray-800'>새 채팅방 만들기</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className='text-gray-500 hover:text-gray-700'
                >
                  ✕
                </button>
              </div>

              <input
                type='text'
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder='이름, 동/호수 검색...'
                className='mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm'
              />

              <div className='max-h-64 overflow-y-auto rounded border border-gray-200'>
                {residents.length === 0 ? (
                  <div className='p-4 text-center text-sm text-gray-500'>입주민이 없습니다</div>
                ) : (
                  residents.map((resident) => (
                    <button
                      key={resident.id}
                      onClick={() => handleCreateChatRoom(resident.id)}
                      className='w-full border-b px-3 py-2 text-left hover:bg-gray-50'
                    >
                      <div className='font-semibold text-gray-800'>{resident.name}</div>
                      <div className='text-xs text-gray-600'>
                        {resident.building}동 {resident.unitNumber}호
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
