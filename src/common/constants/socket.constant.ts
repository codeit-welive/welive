/**
 * Socket.io 이벤트명 상수
 * @description 클라이언트-서버 간 Socket 이벤트명을 중앙 관리
 */

/**
 * 서버가 수신하는 이벤트 (클라이언트 → 서버)
 */
export const SOCKET_EVENTS_RECEIVE = {
  /** 채팅방 입장 */
  JOIN_ROOM: 'join_room',
  /** 채팅방 퇴장 */
  LEAVE_ROOM: 'leave_room',
  /** 메시지 전송 */
  SEND_MESSAGE: 'send_message',
  /** 읽음 처리 */
  MARK_AS_READ: 'mark_as_read',
} as const;

/**
 * 서버가 전송하는 이벤트 (서버 → 클라이언트)
 */
export const SOCKET_EVENTS_SEND = {
  /** 채팅방 입장 성공 */
  JOIN_ROOM_SUCCESS: 'join_room_success',
  /** 채팅방 퇴장 성공 */
  LEAVE_ROOM_SUCCESS: 'leave_room_success',
  /** 새 메시지 (브로드캐스트) */
  NEW_MESSAGE: 'new_message',
  /** 메시지 읽음 처리 (브로드캐스트) */
  MESSAGES_READ: 'messages_read',
  /** 에러 이벤트 */
  ERROR_EVENT: 'error_event',
} as const;

/**
 * 기본 Socket.io 이벤트
 */
export const SOCKET_EVENTS_DEFAULT = {
  /** 클라이언트 연결 */
  CONNECTION: 'connection',
  /** 클라이언트 연결 해제 */
  DISCONNECT: 'disconnect',
} as const;
