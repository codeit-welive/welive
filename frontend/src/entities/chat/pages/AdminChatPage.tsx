/**
 * AdminChatPage
 * @description 관리자(ADMIN)가 입주민들과 채팅하는 페이지
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/shared/store/auth.store';
import { getChatRoomList, getMessageList } from '../api/chat.api';
import type { ChatMessage, ChatRoom } from '../api/chat.types';
import { useChatSocket } from '../model/useChatSocket';
import { ChatMessageList, ChatInput } from '../ui';

export function AdminChatPage() {
  const { user } = useAuthStore();

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // ==================== 선택한 채팅방 메시지 불러오기 ====================

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedRoom) {
        setMessages([]);
        return;
      }

      try {
        const messageData = await getMessageList({
          chatRoomId: selectedRoom.id,
          page: 1,
          limit: 50,
        });

        setMessages(messageData.data);
      } catch (err) {
        console.error('메시지 로드 실패:', err);
        alert('메시지를 불러오는데 실패했습니다.');
      }
    };

    loadMessages();
  }, [selectedRoom]);

  // ==================== Socket.io 연결 ====================

  // 쿠키에서 access_token 가져오기
  const getAccessToken = (): string => {
    if (typeof document === 'undefined') return '';
    const cookies = document.cookie.split('; ');
    const tokenCookie = cookies.find((c) => c.startsWith('access_token='));
    return tokenCookie ? tokenCookie.split('=')[1] : '';
  };

  const { sendMessage, isConnected, isJoinedRoom } = useChatSocket(
    {
      chatRoomId: selectedRoom?.id || null,
      token: getAccessToken(),
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
          <h1 className='text-xl font-bold'>채팅 목록</h1>
          <p className='text-sm text-blue-100'>총 {chatRooms.length}개</p>
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
    </div>
  );
}
