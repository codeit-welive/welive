/**
 * AdminChatPage
 * @description 관리자(ADMIN)가 입주민들과 채팅하는 페이지
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/shared/store/auth.store';
import { getChatRoomList, getChatRoom, createChatRoomByAdmin } from '../api/chat.api';
import type { ChatMessage, ChatRoom } from '../api/chat.types';
import { useChatSocket } from '../model/useChatSocket';
import { ChatMessageList, ChatInput } from '../ui';
import axios from '@/shared/lib/axios';
import type { residentInfoType } from '@/entities/resident-info/type';

export function AdminChatPage() {
  const { user } = useAuthStore();

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [residents, setResidents] = useState<residentInfoType[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isLoadingResidents, setIsLoadingResidents] = useState(false);

  // ==================== 채팅방 목록 불러오기 ====================

  useEffect(() => {
    const loadChatRooms = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        const roomData = await getChatRoomList({
          page: 1,
          limit: 50,
        });

        setChatRooms(roomData.data);

        // 첫 번째 채팅방 자동 선택
        if (roomData.data.length > 0) {
          setSelectedRoom(roomData.data[0]);
        }
      } catch (err) {
        console.error('채팅방 목록 로드 실패:', err);
        const errorMessage =
          err instanceof Error && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        setError(errorMessage || '채팅방 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadChatRooms();
  }, [user]);

  // ==================== 선택한 채팅방 상세 조회 (메시지 포함) ====================

  useEffect(() => {
    const loadChatRoomDetail = async () => {
      if (!selectedRoom) {
        setMessages([]);
        return;
      }

      try {
        const roomDetail = await getChatRoom(selectedRoom.id);
        setMessages(roomDetail.recentMessages);
      } catch (err) {
        console.error('채팅방 상세 조회 실패:', err);
        alert('채팅방 정보를 불러오는데 실패했습니다.');
      }
    };

    loadChatRoomDetail();
  }, [selectedRoom]);

  // ==================== Socket.io 연결 ====================

  const { sendMessage, isConnected, isJoinedRoom } = useChatSocket(
    {
      chatRoomId: selectedRoom?.id || null,
    },
    {
      // 새 메시지 수신
      onNewMessage: (message) => {
        setMessages((prev) => [...prev, message]);

        // 채팅방 목록 업데이트 (lastMessage)
        setChatRooms((prev) =>
          prev.map((room) =>
            room.id === message.chatRoomId
              ? {
                  ...room,
                  lastMessage: message.content,
                  lastMessageAt: message.createdAt,
                }
              : room,
          ),
        );
      },

      // 에러 처리
      onError: (error) => {
        console.error('Socket 에러:', error);
        alert(error.message);
      },
    },
  );

  // ==================== 메시지 전송 ====================

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  // ==================== 채팅방 선택 ====================

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
  };

  // ==================== 입주민 목록 불러오기 ====================

  useEffect(() => {
    const loadResidents = async () => {
      if (!showCreateModal) return;

      try {
        setIsLoadingResidents(true);
        const res = await axios.get('/residents', {
          params: {
            isRegistered: true,
            keyword: searchKeyword || undefined,
          },
        });
        setResidents(res.data.residents);
      } catch (err) {
        console.error('입주민 목록 로드 실패:', err);
      } finally {
        setIsLoadingResidents(false);
      }
    };

    loadResidents();
  }, [showCreateModal, searchKeyword]);

  // ==================== 채팅방 생성 ====================

  const handleCreateChatRoom = async (selectedResidentId: string) => {
    if (!selectedResidentId.trim()) {
      alert('입주민을 선택해주세요.');
      return;
    }

    try {
      const newRoom = await createChatRoomByAdmin({ residentId: selectedResidentId.trim() });

      // 채팅방 목록에 추가
      setChatRooms((prev) => [newRoom, ...prev]);

      // 새로 생성한 채팅방 선택
      setSelectedRoom(newRoom);

      // 모달 닫기 및 초기화
      setShowCreateModal(false);
      setSearchKeyword('');
    } catch (err) {
      console.error('채팅방 생성 실패:', err);
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      alert(errorMessage || '채팅방 생성에 실패했습니다.');
    }
  };

  // ==================== 렌더링 ====================

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-gray-600'>채팅방을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <p className='mb-4 text-red-600'>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className='rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-gray-100'>
      {/* 왼쪽: 채팅방 목록 */}
      <div className='flex w-80 flex-col border-r bg-white'>
        {/* 헤더 */}
        <div className='bg-blue-500 px-6 py-4 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-xl font-bold'>채팅 목록</h1>
              <p className='text-sm text-blue-100'>총 {chatRooms.length}개</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className='bg-opacity-20 hover:bg-opacity-30 rounded-full bg-white px-3 py-1 text-sm font-medium transition-colors'
              title='새 채팅방 만들기'
            >
              + 생성
            </button>
          </div>
        </div>

        {/* 채팅방 목록 */}
        <div className='flex-1 overflow-y-auto'>
          {chatRooms.length === 0 ? (
            <div className='flex h-full items-center justify-center text-gray-500'>
              <p>채팅방이 없습니다</p>
            </div>
          ) : (
            chatRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleSelectRoom(room)}
                className={`w-full border-b px-6 py-4 text-left transition-colors hover:bg-gray-50 ${
                  selectedRoom?.id === room.id ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className='mb-1 flex items-center justify-between'>
                  <h3 className='font-semibold text-gray-800'>{room.resident.name}</h3>
                  {room.unreadCountAdmin > 0 && (
                    <span className='rounded-full bg-red-500 px-2 py-1 text-xs text-white'>
                      {room.unreadCountAdmin}
                    </span>
                  )}
                </div>
                <p className='text-sm text-gray-600'>
                  {room.resident.building}동 {room.resident.unitNumber}호
                </p>
                {room.lastMessage && (
                  <p className='mt-1 truncate text-sm text-gray-500'>{room.lastMessage}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 오른쪽: 채팅 화면 */}
      <div className='flex flex-1 flex-col'>
        {selectedRoom ? (
          <>
            {/* 헤더 */}
            <div className='border-b bg-white px-6 py-4 shadow-sm'>
              <div className='flex items-center justify-between'>
                <div>
                  <h2 className='text-xl font-bold text-gray-800'>{selectedRoom.resident.name}</h2>
                  <p className='text-sm text-gray-600'>
                    {selectedRoom.resident.building}동 {selectedRoom.resident.unitNumber}호
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isConnected && isJoinedRoom ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  />
                  <span className='text-sm text-gray-600'>
                    {isConnected && isJoinedRoom ? '연결됨' : '연결 중...'}
                  </span>
                </div>
              </div>
            </div>

            {/* 메시지 목록 */}
            <ChatMessageList messages={messages} currentUserId={user?.id || ''} isLoading={false} />

            {/* 입력창 */}
            <ChatInput
              onSend={handleSendMessage}
              disabled={!isConnected || !isJoinedRoom}
              placeholder={
                isConnected && isJoinedRoom ? '메시지를 입력하세요...' : '연결 중입니다...'
              }
            />
          </>
        ) : (
          <div className='flex flex-1 items-center justify-center text-gray-500'>
            <p>채팅방을 선택해주세요</p>
          </div>
        )}
      </div>

      {/* 채팅방 생성 모달 */}
      {showCreateModal && (
        <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black'>
          <div className='w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-bold text-gray-800'>새 채팅방 만들기</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSearchKeyword('');
                }}
                className='text-gray-400 transition-colors hover:text-gray-600'
              >
                ✕
              </button>
            </div>

            {/* 검색창 */}
            <div className='mb-4'>
              <input
                type='text'
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder='이름, 동/호수로 검색...'
                className='w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none'
                autoFocus
              />
            </div>

            {/* 입주민 목록 */}
            <div className='mb-4 max-h-96 overflow-y-auto rounded-md border border-gray-200'>
              {isLoadingResidents ? (
                <div className='flex items-center justify-center py-8 text-gray-500'>
                  <div>로딩 중...</div>
                </div>
              ) : residents.length === 0 ? (
                <div className='flex items-center justify-center py-8 text-gray-500'>
                  <div>등록된 입주민이 없습니다</div>
                </div>
              ) : (
                residents.map((resident) => (
                  <button
                    key={resident.userId}
                    onClick={() => handleCreateChatRoom(resident.id)}
                    className='w-full border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-blue-50'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='font-semibold text-gray-800'>{resident.name}</h3>
                        <p className='text-sm text-gray-600'>
                          {resident.building}동 {resident.unitNumber}호
                        </p>
                        {resident.contact && (
                          <p className='text-xs text-gray-500'>{resident.contact}</p>
                        )}
                      </div>
                      <div className='text-sm text-blue-500'>선택 →</div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className='flex justify-end'>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSearchKeyword('');
                }}
                className='rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50'
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
