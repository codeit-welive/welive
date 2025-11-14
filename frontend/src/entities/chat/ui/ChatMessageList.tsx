/**
 * ChatMessageList 컴포넌트
 * @description 채팅 메시지 목록을 표시하는 컴포넌트
 */

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../api/chat.types';
import { ChatMessageItem } from './ChatMessageItem';

interface ChatMessageListProps {
  /**
   * 메시지 목록
   */
  messages: ChatMessage[];

  /**
   * 현재 로그인한 사용자 ID
   */
  currentUserId: string;

  /**
   * 로딩 상태
   */
  isLoading?: boolean;
}

export function ChatMessageList({
  messages,
  currentUserId,
  isLoading = false,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 오면 자동으로 스크롤 아래로
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">메시지를 불러오는 중...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <p>아직 메시지가 없습니다.</p>
          <p className="text-sm mt-2">첫 메시지를 보내보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50"
    >
      {messages.map((message) => (
        <ChatMessageItem
          key={message.id}
          message={message}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}
