/**
 * Socket.io 클라이언트 설정
 * 백엔드 WebSocket 서버와 실시간 통신
 */

import { io, Socket } from 'socket.io-client';

// ==================== Socket 이벤트 상수 ====================

/**
 * 서버가 수신하는 이벤트 (클라이언트 → 서버)
 * 백엔드 socket.constant.ts의 SOCKET_EVENTS_RECEIVE와 일치
 */
export const SOCKET_EVENTS_RECEIVE = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  SEND_MESSAGE: 'send_message',
  MARK_AS_READ: 'mark_as_read',
} as const;

/**
 * 서버가 전송하는 이벤트 (서버 → 클라이언트)
 * 백엔드 socket.constant.ts의 SOCKET_EVENTS_SEND와 일치
 */
export const SOCKET_EVENTS_SEND = {
  JOIN_ROOM_SUCCESS: 'join_room_success',
  LEAVE_ROOM_SUCCESS: 'leave_room_success',
  NEW_MESSAGE: 'new_message',
  MESSAGES_READ: 'messages_read',
  ERROR_EVENT: 'error_event',
} as const;

/**
 * 기본 Socket.io 이벤트
 */
export const SOCKET_EVENTS_DEFAULT = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  CONNECT: 'connect',
  CONNECT_ERROR: 'connect_error',
} as const;

// ==================== Socket 인스턴스 ====================

let socket: Socket | null = null;

/**
 * Socket.io 연결 생성 및 반환
 * @param token - JWT 액세스 토큰
 * @returns Socket.io 클라이언트 인스턴스
 * @description
 * - 싱글톤 패턴: 한 번만 생성됨
 * - JWT 토큰으로 인증
 * - 자동 재연결 활성화
 */
export const getSocket = (token: string): Socket => {
  // 이미 연결되어 있으면 기존 소켓 반환
  if (socket && socket.connected) {
    return socket;
  }

  // Socket.io 클라이언트 생성
  socket = io(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9000', {
    auth: {
      token, // JWT 토큰 전달
    },
    transports: ['websocket', 'polling'], // WebSocket 우선, 실패 시 polling
    reconnection: true, // 자동 재연결
    reconnectionAttempts: 5, // 재연결 시도 횟수
    reconnectionDelay: 1000, // 재연결 대기 시간 (ms)
  });

  // 연결 성공 로그
  socket.on(SOCKET_EVENTS_DEFAULT.CONNECT, () => {
    console.log('✅ Socket.io 연결 성공:', socket?.id);
  });

  // 연결 실패 로그
  socket.on(SOCKET_EVENTS_DEFAULT.CONNECT_ERROR, (error) => {
    console.error('❌ Socket.io 연결 실패:', error.message);
  });

  // 연결 해제 로그
  socket.on(SOCKET_EVENTS_DEFAULT.DISCONNECT, (reason) => {
    console.log('👋 Socket.io 연결 해제:', reason);
  });

  return socket;
};

/**
 * Socket 연결 해제
 * @description 페이지 언마운트 시 호출
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket.io 연결 종료');
  }
};

/**
 * 현재 Socket 인스턴스 반환 (연결 여부 무관)
 * @returns Socket 인스턴스 또는 null
 */
export const getCurrentSocket = (): Socket | null => {
  return socket;
};
