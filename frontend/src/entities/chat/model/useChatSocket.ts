/**
 * useChatSocket Hook
 * @description React 컴포넌트에서 Socket.io 채팅 기능을 사용하기 위한 Hook
 *
 * @features
 * - Socket 연결 생성 및 정리
 * - 채팅방 자동 입장/퇴장
 * - 실시간 메시지 수신
 * - 읽음 상태 업데이트
 * - 에러 핸들링
 */

import { useEffect, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket, SOCKET_EVENTS_RECEIVE, SOCKET_EVENTS_SEND } from '../lib/socket';
import type {
  SocketNewMessageData,
  SocketMessagesReadData,
  SocketErrorData,
  SocketJoinRoomSuccessData,
  SocketLeaveRoomSuccessData,
} from '../api/chat.types';

/**
 * Hook 옵션
 */
interface UseChatSocketOptions {
  /**
   * 채팅방 ID
   * @description null이면 Room 입장하지 않음 (Socket 연결만)
   */
  chatRoomId: string | null;

  /**
   * JWT 액세스 토큰
   * @description Socket.io 인증에 사용
   */
  token: string;

  /**
   * 컴포넌트 언마운트 시 Socket 연결 해제 여부
   * @default false - 다른 페이지에서도 Socket 유지
   */
  disconnectOnUnmount?: boolean;
}

/**
 * Hook 반환 타입
 */
interface UseChatSocketReturn {
  /**
   * Socket 연결 상태
   */
  isConnected: boolean;

  /**
   * 채팅방 입장 상태
   */
  isJoinedRoom: boolean;

  /**
   * 메시지 전송 함수
   * @param content 메시지 내용
   */
  sendMessage: (content: string) => void;

  /**
   * 읽음 처리 함수
   * @description 현재 보고 있는 메시지들을 읽음 처리
   */
  markAsRead: () => void;

  /**
   * Socket 인스턴스 (고급 사용)
   * @description 직접 제어가 필요한 경우에만 사용
   */
  socket: Socket | null;
}

/**
 * 이벤트 핸들러 타입
 */
interface UseChatSocketHandlers {
  /**
   * 새 메시지 수신 시
   */
  onNewMessage?: (message: SocketNewMessageData) => void;

  /**
   * 메시지 읽음 처리 시
   */
  onMessagesRead?: (data: SocketMessagesReadData) => void;

  /**
   * 채팅방 입장 성공 시
   */
  onJoinRoomSuccess?: (data: SocketJoinRoomSuccessData) => void;

  /**
   * 채팅방 퇴장 성공 시
   */
  onLeaveRoomSuccess?: (data: SocketLeaveRoomSuccessData) => void;

  /**
   * 에러 발생 시
   */
  onError?: (error: SocketErrorData) => void;
}

/**
 * Socket.io 채팅 Hook
 *
 * @example
 * // 기본 사용
 * const { sendMessage, isConnected } = useChatSocket({
 *   chatRoomId: 'room-123',
 *   token: accessToken,
 * }, {
 *   onNewMessage: (message) => {
 *     console.log('새 메시지:', message);
 *   },
 * });
 *
 * @example
 * // Room 입장 없이 Socket만 연결
 * const { socket } = useChatSocket({
 *   chatRoomId: null,
 *   token: accessToken,
 * });
 */
export const useChatSocket = (
  options: UseChatSocketOptions,
  handlers: UseChatSocketHandlers = {},
): UseChatSocketReturn => {
  const { chatRoomId, token, disconnectOnUnmount = false } = options;
  const {
    onNewMessage,
    onMessagesRead,
    onJoinRoomSuccess,
    onLeaveRoomSuccess,
    onError,
  } = handlers;

  // ==================== State ====================

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoinedRoom, setIsJoinedRoom] = useState(false);

  // ==================== Socket 연결 ====================

  useEffect(() => {
    // Socket 생성
    const socketInstance = getSocket(token);
    setSocket(socketInstance);

    // 연결 상태 이벤트
    const handleConnect = () => {
      console.log('✅ useChatSocket: Socket 연결됨');
      setIsConnected(true);
    };

    const handleDisconnect = (reason: string) => {
      console.log('👋 useChatSocket: Socket 연결 해제:', reason);
      setIsConnected(false);
      setIsJoinedRoom(false);
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);

    // 이미 연결된 상태면 즉시 업데이트
    if (socketInstance.connected) {
      setIsConnected(true);
    }

    // 정리
    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);

      if (disconnectOnUnmount) {
        disconnectSocket();
      }
    };
  }, [token, disconnectOnUnmount]);

  // ==================== 채팅방 입장/퇴장 ====================

  useEffect(() => {
    if (!socket || !chatRoomId || !isConnected) {
      return;
    }

    console.log(`🚪 useChatSocket: 채팅방 입장 시도 [${chatRoomId}]`);

    // 채팅방 입장
    socket.emit(SOCKET_EVENTS_RECEIVE.JOIN_ROOM, { chatRoomId });

    // 정리: 채팅방 퇴장
    return () => {
      console.log(`🚪 useChatSocket: 채팅방 퇴장 [${chatRoomId}]`);
      socket.emit(SOCKET_EVENTS_RECEIVE.LEAVE_ROOM, { chatRoomId });
      setIsJoinedRoom(false);
    };
  }, [socket, chatRoomId, isConnected]);

  // ==================== 이벤트 리스너 등록 ====================

  useEffect(() => {
    if (!socket) return;

    // 채팅방 입장 성공
    const handleJoinRoomSuccess = (data: SocketJoinRoomSuccessData) => {
      console.log('✅ useChatSocket: 채팅방 입장 성공', data);
      setIsJoinedRoom(true);
      onJoinRoomSuccess?.(data);
    };

    // 채팅방 퇴장 성공
    const handleLeaveRoomSuccess = (data: SocketLeaveRoomSuccessData) => {
      console.log('👋 useChatSocket: 채팅방 퇴장 성공', data);
      setIsJoinedRoom(false);
      onLeaveRoomSuccess?.(data);
    };

    // 새 메시지 수신
    const handleNewMessage = (message: SocketNewMessageData) => {
      console.log('📨 useChatSocket: 새 메시지 수신', message);
      onNewMessage?.(message);
    };

    // 읽음 처리
    const handleMessagesRead = (data: SocketMessagesReadData) => {
      console.log('👁️ useChatSocket: 메시지 읽음 처리', data);
      onMessagesRead?.(data);
    };

    // 에러
    const handleError = (error: SocketErrorData) => {
      console.error('❌ useChatSocket: 에러 발생', error);
      onError?.(error);
    };

    // 이벤트 등록
    socket.on(SOCKET_EVENTS_SEND.JOIN_ROOM_SUCCESS, handleJoinRoomSuccess);
    socket.on(SOCKET_EVENTS_SEND.LEAVE_ROOM_SUCCESS, handleLeaveRoomSuccess);
    socket.on(SOCKET_EVENTS_SEND.NEW_MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS_SEND.MESSAGES_READ, handleMessagesRead);
    socket.on(SOCKET_EVENTS_SEND.ERROR_EVENT, handleError);

    // 정리
    return () => {
      socket.off(SOCKET_EVENTS_SEND.JOIN_ROOM_SUCCESS, handleJoinRoomSuccess);
      socket.off(SOCKET_EVENTS_SEND.LEAVE_ROOM_SUCCESS, handleLeaveRoomSuccess);
      socket.off(SOCKET_EVENTS_SEND.NEW_MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS_SEND.MESSAGES_READ, handleMessagesRead);
      socket.off(SOCKET_EVENTS_SEND.ERROR_EVENT, handleError);
    };
  }, [socket, onNewMessage, onMessagesRead, onJoinRoomSuccess, onLeaveRoomSuccess, onError]);

  // ==================== 함수 ====================

  /**
   * 메시지 전송
   */
  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !chatRoomId) {
        console.warn('⚠️ useChatSocket: Socket 또는 chatRoomId가 없습니다');
        return;
      }

      if (!isJoinedRoom) {
        console.warn('⚠️ useChatSocket: 채팅방에 입장하지 않았습니다');
        return;
      }

      socket.emit(SOCKET_EVENTS_RECEIVE.SEND_MESSAGE, {
        chatRoomId,
        content,
      });
    },
    [socket, chatRoomId, isJoinedRoom],
  );

  /**
   * 읽음 처리
   */
  const markAsRead = useCallback(() => {
    if (!socket || !chatRoomId) {
      console.warn('⚠️ useChatSocket: Socket 또는 chatRoomId가 없습니다');
      return;
    }

    if (!isJoinedRoom) {
      console.warn('⚠️ useChatSocket: 채팅방에 입장하지 않았습니다');
      return;
    }

    socket.emit(SOCKET_EVENTS_RECEIVE.MARK_AS_READ, {
      chatRoomId,
    });
  }, [socket, chatRoomId, isJoinedRoom]);

  // ==================== 반환 ====================

  return {
    isConnected,
    isJoinedRoom,
    sendMessage,
    markAsRead,
    socket,
  };
};
