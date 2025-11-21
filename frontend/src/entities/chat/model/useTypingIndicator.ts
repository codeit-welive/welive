import { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import type { SocketUserTypingData } from '../api/chat.types';

interface UseTypingIndicatorProps {
  socket: Socket | null;
  chatRoomId?: string;
  currentUserId?: string;
}

interface UseTypingIndicatorReturn {
  isOtherUserTyping: boolean;
  emitTyping: (isTyping: boolean) => void;
}

/**
 * 타이핑 인디케이터 관리 커스텀 훅
 *
 * @description
 * - 상대방의 타이핑 상태 감지 및 표시
 * - 내 타이핑 상태 전송 (디바운싱 적용)
 * - 자동 타임아웃 (3초 후 자동 해제)
 */
export function useTypingIndicator({
  socket,
  chatRoomId,
  currentUserId,
}: UseTypingIndicatorProps): UseTypingIndicatorReturn {
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 타이핑 이벤트 전송 (디바운싱 적용)
   * @param isTyping - true: 타이핑 시작, false: 타이핑 중지
   */
  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !chatRoomId) {
        return;
      }

      // 디바운싱: 300ms 대기 후 전송
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', {
          chatRoomId,
          isTyping,
        });
      }, 300);
    },
    [socket, chatRoomId]
  );

  /**
   * 상대방의 타이핑 상태 수신
   */
  useEffect(() => {
    if (!socket || !chatRoomId) {
      return;
    }

    const handleUserTyping = (data: SocketUserTypingData) => {
      // 같은 채팅방이고, 내가 아닌 사용자의 타이핑일 때만 표시
      if (data.chatRoomId === chatRoomId && data.userId !== currentUserId) {
        setIsOtherUserTyping(data.isTyping);

        // 타이핑 시작일 때만 3초 타임아웃 설정
        if (data.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          // 3초 후 자동으로 타이핑 상태 해제
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherUserTyping(false);
          }, 3000);
        } else {
          // 타이핑 중지 이벤트 받으면 즉시 해제
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          setIsOtherUserTyping(false);
        }
      }
    };

    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('user_typing', handleUserTyping);

      // cleanup 시 타이머 정리
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [socket, chatRoomId, currentUserId]);

  /**
   * 채팅방이 바뀔 때 상태 초기화
   */
  useEffect(() => {
    setIsOtherUserTyping(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [chatRoomId]);

  return {
    isOtherUserTyping,
    emitTyping,
  };
}
