/**
 * ResidentChatPage
 * @description 입주민(USER)이 관리자와 채팅하는 페이지
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/shared/store/auth.store';
import { getMyChatRoom, getMessageList, createMyChatRoom } from '../api/chat.api';
import type { ChatMessage, ChatRoom } from '../api/chat.types';
import { useChatSocket } from '../model/useChatSocket';
import { ChatMessageList, ChatInput } from '../ui';

export function ResidentChatPage() {
  const { user } = useAuthStore();

  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==================== 채팅방 & 메시지 불러오기 ====================

  useEffect(() => {
    const loadChatData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // 1. 내 채팅방 조회 (없으면 생성)
        let room: ChatRoom;
        try {
          room = await getMyChatRoom();
        } catch (err) {
          if (err instanceof Error && 'response' in err) {
            const axiosError = err as { response?: { status?: number } };
            if (axiosError.response?.status === 404) {
              // 채팅방 없음 → 생성
              room = await createMyChatRoom();
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }

        setChatRoom(room);

        // 2. 메시지 목록 조회
        const messageData = await getMessageList({
          chatRoomId: room.id,
          page: 1,
          limit: 50,
        });

        setMessages(messageData.data);
      } catch (err) {
        console.error('채팅 데이터 로드 실패:', err);
        const errorMessage =
          err instanceof Error && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        setError(errorMessage || '채팅을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadChatData();
  }, [user]);

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
      chatRoomId: chatRoom?.id || null,
      token: getAccessToken(),
    },
    {
      // 새 메시지 수신
      onNewMessage: (message) => {
        setMessages((prev) => [...prev, message]);
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

  // ==================== 렌더링 ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">채팅방을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">채팅방을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 헤더 */}
      <div className="bg-blue-500 text-white px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">관리자 채팅</h1>
            <p className="text-sm text-blue-100">
              {chatRoom.apartment?.apartmentName || '아파트'} 관리사무소
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected && isJoinedRoom ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <span className="text-sm">
              {isConnected && isJoinedRoom ? '연결됨' : '연결 중...'}
            </span>
          </div>
        </div>
      </div>

      {/* 메시지 목록 */}
      <ChatMessageList
        messages={messages}
        currentUserId={user?.id || ''}
        isLoading={false}
      />

      {/* 입력창 */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={!isConnected || !isJoinedRoom}
        placeholder={
          isConnected && isJoinedRoom
            ? '메시지를 입력하세요...'
            : '연결 중입니다...'
        }
      />
    </div>
  );
}
