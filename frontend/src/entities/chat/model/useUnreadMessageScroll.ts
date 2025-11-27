import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../api/chat.types';

interface UseUnreadMessageScrollProps {
  messages: ChatMessage[];
  chatRoomId?: string;
  initialReadStates?: Map<string, boolean>;
  lastMessageSentTime?: number;
}

interface UseUnreadMessageScrollReturn {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  unreadMarkerRef: React.RefObject<HTMLDivElement | null>;
  hasScrolledToUnread: boolean;
  isNearBottom: boolean;
  initialReadStateRef: React.MutableRefObject<Map<string, boolean>>;
  handleScroll: () => void;
  getUnreadMarkerInfo: (message: ChatMessage, prevMessage: ChatMessage | null) => boolean;
}

/**
 * 읽지 않은 메시지 스크롤 관리 커스텀 훅
 *
 * @description
 * - 초기 로딩 시 읽지 않은 첫 메시지로 자동 스크롤
 * - 내가 보낸 메시지는 무조건 맨 아래로 스크롤
 * - 상대방 메시지는 맨 아래 근처에 있을 때만 자동 스크롤
 * - 읽은/읽지 않은 메시지 경계에 구분선 표시
 */
export function useUnreadMessageScroll({
  messages,
  chatRoomId,
  initialReadStates,
  lastMessageSentTime,
}: UseUnreadMessageScrollProps): UseUnreadMessageScrollReturn {
  const scrollRef = useRef<HTMLDivElement>(null);
  const unreadMarkerRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToUnread, setHasScrolledToUnread] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  const initialReadStateRef = useRef<Map<string, boolean>>(new Map());
  const lastChatRoomIdRef = useRef<string | undefined>(undefined);

  // 채팅방이 바뀔 때마다 초기 읽음 상태 업데이트
  useEffect(() => {
    const chatRoomChanged = lastChatRoomIdRef.current !== chatRoomId;

    if (chatRoomChanged && initialReadStates && initialReadStates.size > 0) {
      initialReadStateRef.current = new Map(initialReadStates);
      setHasScrolledToUnread(false);

      let unreadCount = 0;
      initialReadStates.forEach((isRead) => {
        if (!isRead) unreadCount++;
      });

      // 읽지 않은 메시지가 있으면 맨 아래 스크롤 비활성화
      if (unreadCount > 0) {
        setShouldScrollToBottom(false);
        setIsNearBottom(false);
      } else {
        setShouldScrollToBottom(true);
        setIsNearBottom(true);
      }

      lastChatRoomIdRef.current = chatRoomId;
    }
  }, [chatRoomId, initialReadStates]);

  // 읽지 않은 첫 메시지로 스크롤 (초기 로딩 시 1회만)
  useEffect(() => {
    if (hasScrolledToUnread || messages.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      if (unreadMarkerRef.current && scrollRef.current) {
        const markerElement = unreadMarkerRef.current;
        const scrollContainer = scrollRef.current;

        const markerTop = markerElement.offsetTop;
        const containerHeight = scrollContainer.clientHeight;
        const scrollPosition = markerTop - containerHeight / 2;

        scrollContainer.scrollTop = scrollPosition;
        setHasScrolledToUnread(true);
      } else if (scrollRef.current && shouldScrollToBottom) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        setHasScrolledToUnread(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [messages.length, hasScrolledToUnread, shouldScrollToBottom]);

  // 내가 메시지를 보냈을 때 무조건 맨 아래로 스크롤
  useEffect(() => {
    if (!lastMessageSentTime || lastMessageSentTime === 0 || !hasScrolledToUnread) {
      return;
    }

    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lastMessageSentTime, hasScrolledToUnread]);

  // 새 메시지가 오면 자동으로 스크롤 아래로 (새 메시지 수신 시)
  useEffect(() => {
    if (!hasScrolledToUnread) {
      return;
    }

    if (scrollRef.current && (shouldScrollToBottom || isNearBottom)) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, shouldScrollToBottom, hasScrolledToUnread, isNearBottom]);

  // 스크롤 이벤트 핸들러: 사용자가 맨 아래 근처에 있는지 확인
  const handleScroll = () => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) {
      return;
    }

    // 사용자가 맨 아래 근처에 있는지 확인 (여유 100px)
    const scrollBottom =
      scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight;
    const isUserNearBottom = scrollBottom < 100;

    setIsNearBottom(isUserNearBottom);

    // ✅ 사용자가 위로 스크롤하면 자동 스크롤 비활성화
    if (!isUserNearBottom) {
      setShouldScrollToBottom(false);
    }
  };

  // 읽지 않은 메시지 마커를 표시할지 결정
  const getUnreadMarkerInfo = (message: ChatMessage, prevMessage: ChatMessage | null): boolean => {
    const initialIsRead = initialReadStateRef.current.get(message.id);
    const isUnread = initialIsRead === false;

    const prevInitialIsRead = prevMessage
      ? initialReadStateRef.current.get(prevMessage.id)
      : undefined;
    const prevIsRead = prevInitialIsRead !== false;

    return prevIsRead && isUnread;
  };

  return {
    scrollRef,
    unreadMarkerRef,
    hasScrolledToUnread,
    isNearBottom,
    initialReadStateRef,
    handleScroll,
    getUnreadMarkerInfo,
  };
}
