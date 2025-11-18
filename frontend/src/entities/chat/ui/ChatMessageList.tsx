/**
 * ChatMessageList 컴포넌트
 * @description 채팅 메시지 목록을 표시하는 컴포넌트
 */

import { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../api/chat.types';
import { ChatMessageItem } from './ChatMessageItem';
import { useUnreadMessageScroll } from '../model/useUnreadMessageScroll';

/**
 * 날짜를 명확한 형식으로 포맷
 * @param dateString ISO 형식의 날짜 문자열
 * @returns "2025년 1월 18일" 형식
 */
function formatDateDivider(dateString: string): string {
  const date = new Date(dateString);

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

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

  /**
   * 채팅방 ID (변경 감지용)
   */
  chatRoomId?: string;

  /**
   * 초기 읽음 상태 스냅샷 (메시지 로드 직후 상태)
   * @description markAsRead()보다 먼저 캡처된 읽음 상태
   */
  initialReadStates?: Map<string, boolean>;

  /**
   * 마지막 메시지 전송 시간 (내가 보낸 메시지는 무조건 스크롤)
   */
  lastMessageSentTime?: number;

  /**
   * 상대방이 타이핑 중인지 여부
   */
  isOtherUserTyping?: boolean;
}

export function ChatMessageList({
  messages,
  currentUserId,
  userRole,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  chatRoomId,
  initialReadStates,
  lastMessageSentTime,
  isOtherUserTyping = false,
}: ChatMessageListProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 읽지 않은 메시지 스크롤 관리 커스텀 훅
  const {
    scrollRef,
    unreadMarkerRef,
    handleScroll: handleUnreadScroll,
    getUnreadMarkerInfo,
  } = useUnreadMessageScroll({
    messages,
    chatRoomId,
    initialReadStates,
    lastMessageSentTime,
  });

  // 이전 타이핑 상태 추적
  const prevTypingRef = useRef(false);

  // 타이핑 인디케이터가 나타날 때 스크롤 (false -> true 변경 시에만)
  useEffect(() => {
    // 이전에 타이핑 중이 아니었고, 지금 타이핑 중이면 스크롤
    if (!prevTypingRef.current && isOtherUserTyping) {
      const scrollElement = scrollRef.current;
      if (scrollElement) {
        // 맨 아래 근처에 있을 때만 스크롤 (스냅샷 방식)
        const scrollBottom = scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight;
        const isUserNearBottom = scrollBottom < 100;

        if (isUserNearBottom) {
          // 부드러운 스크롤로 맨 아래로 이동
          setTimeout(() => {
            const el = scrollRef.current;
            if (el) {
              el.scrollTo({
                top: el.scrollHeight,
                behavior: 'smooth',
              });
            }
          }, 100);
        }
      }
    }

    // 현재 상태를 이전 상태로 저장
    prevTypingRef.current = isOtherUserTyping;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOtherUserTyping]);

  // 스크롤 이벤트 핸들러: 맨 위로 스크롤 시 이전 메시지 로드
  const handleScroll = async () => {
    // 읽지 않은 메시지 스크롤 감지
    handleUnreadScroll();

    const scrollElement = scrollRef.current;
    if (!scrollElement || !onLoadMore || !hasMore || isLoadingMore) {
      return;
    }

    // 스크롤이 맨 위에 도달했는지 확인 (여유 50px)
    if (scrollElement.scrollTop < 50) {
      setIsLoadingMore(true);

      const previousScrollHeight = scrollElement.scrollHeight;

      try {
        await onLoadMore();

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
      {[...messages].reverse().map((message, index, reversedMessages) => {
        // 이전 메시지 가져오기
        const prevMessage = index > 0 ? reversedMessages[index - 1] : null;

        // 현재 메시지와 이전 메시지의 날짜 비교
        const currentDate = new Date(message.createdAt).toDateString();
        const prevDate = prevMessage ? new Date(prevMessage.createdAt).toDateString() : null;

        // 날짜가 바뀔 때만 구분선 표시 (첫 메시지 제외)
        const showDateDivider = prevDate !== null && currentDate !== prevDate;

        // 읽지 않은 메시지 마커 표시 여부
        const showUnreadMarker = getUnreadMarkerInfo(message, prevMessage);

        return (
          <div key={message.id}>
            {/* 날짜 구분선 */}
            {showDateDivider && (
              <div className="flex items-center justify-center my-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500 font-medium">
                  {formatDateDivider(message.createdAt.toString())}
                </span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
            )}

            {/* 읽지 않은 메시지 구분선 */}
            {showUnreadMarker && (
              <div
                ref={unreadMarkerRef}
                className="flex items-center justify-center my-6"
              >
                <div className="flex-1 border-t-2 border-blue-400"></div>
                <span className="px-4 text-sm text-blue-600 font-semibold">
                  여기까지 읽었습니다
                </span>
                <div className="flex-1 border-t-2 border-blue-400"></div>
              </div>
            )}

            {/* 메시지 */}
            <ChatMessageItem
              message={message}
              currentUserId={currentUserId}
              userRole={userRole}
            />
          </div>
        );
      })}

      {/* 타이핑 인디케이터 */}
      {isOtherUserTyping && (
        <div className="flex items-start mb-4">
          <div className="max-w-xs bg-white rounded-lg px-4 py-2 shadow-sm">
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600">상대방이 입력 중</span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
