/**
 * ChatMessageList 컴포넌트
 * @description 채팅 메시지 목록을 표시하는 컴포넌트
 */

import { useEffect, useRef, useState } from 'react';
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
   * 현재 사용자 역할
   */
  userRole?: 'ADMIN' | 'USER';

  /**
   * 로딩 상태
   */
  isLoading?: boolean;

  /**
   * 이전 메시지 불러오기 함수
   */
  onLoadMore?: () => Promise<void>;

  /**
   * 더 불러올 메시지가 있는지 여부
   */
  hasMore?: boolean;
}

export function ChatMessageList({
  messages,
  currentUserId,
  userRole,
  isLoading = false,
  onLoadMore,
  hasMore = false,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  // 새 메시지가 오면 자동으로 스크롤 아래로 (초기 로딩 또는 새 메시지 수신 시)
  useEffect(() => {
    if (scrollRef.current && shouldScrollToBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, shouldScrollToBottom]);

  // 스크롤 이벤트 핸들러: 맨 위로 스크롤 시 이전 메시지 로드
  const handleScroll = async () => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || !onLoadMore || !hasMore || isLoadingMore) {
      return;
    }

    // 스크롤이 맨 위에 도달했는지 확인 (여유 50px)
    if (scrollElement.scrollTop < 50) {
      setIsLoadingMore(true);
      setShouldScrollToBottom(false); // 이전 메시지 로드 시에는 스크롤 위치 유지

      // 현재 스크롤 높이 저장 (새 메시지 추가 후 위치 유지용)
      const previousScrollHeight = scrollElement.scrollHeight;

      try {
        await onLoadMore();

        // 새 메시지가 추가된 후 스크롤 위치 조정 (사용자가 보던 위치 유지)
        setTimeout(() => {
          if (scrollElement) {
            const newScrollHeight = scrollElement.scrollHeight;
            scrollElement.scrollTop = newScrollHeight - previousScrollHeight;
          }
        }, 0);
      } catch (error) {
        console.error('❌ 이전 메시지 로딩 실패:', error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

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
      onScroll={handleScroll}
    >
      {/* 이전 메시지 로딩 인디케이터 */}
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <div className="text-sm text-gray-500">이전 메시지를 불러오는 중...</div>
        </div>
      )}

      {/* 더 이상 불러올 메시지가 없을 때 */}
      {!hasMore && messages.length > 0 && (
        <div className="flex justify-center py-2">
          <div className="text-xs text-gray-400">대화의 시작입니다</div>
        </div>
      )}

      {/* 메시지를 오래된 순서대로 표시 (백엔드는 최신순으로 주므로 reverse) */}
      {[...messages].reverse().map((message) => (
        <ChatMessageItem
          key={message.id}
          message={message}
          currentUserId={currentUserId}
          userRole={userRole}
        />
      ))}
    </div>
  );
}
