/**
 * 채팅 검증 관련 상수
 */
export const CHAT_VALIDATION = {
  /** 메시지 내용 최소 길이 */
  MESSAGE_MIN_LENGTH: 1,
  /** 메시지 내용 최대 길이 */
  MESSAGE_MAX_LENGTH: 2000,
} as const;

/**
 * 채팅 에러 메시지
 */
export const CHAT_ERROR_MESSAGES = {
  // 404 Not Found
  CHAT_ROOM_NOT_FOUND: '채팅방을 찾을 수 없습니다.',
  CHAT_MESSAGE_NOT_FOUND: '메시지를 찾을 수 없습니다.',
  APARTMENT_NOT_FOUND: '아파트를 찾을 수 없습니다.',
  RESIDENT_NOT_FOUND: '거주자 정보를 찾을 수 없습니다.',

  // 403 Forbidden - 권한
  NO_CHAT_ROOM_ACCESS: '해당 채팅방에 접근할 권한이 없습니다.',
  NO_MESSAGE_ACCESS: '해당 메시지에 접근할 권한이 없습니다.',
  NOT_CHAT_ROOM_PARTICIPANT: '채팅방 참여자만 메시지를 보낼 수 있습니다.',
  MUST_JOIN_ROOM_FIRST: '채팅방에 먼저 입장해주세요.',

  // 400 Bad Request
  CHAT_ROOM_ALREADY_EXISTS: '이미 채팅방이 존재합니다.',
  INVALID_MESSAGE_CONTENT: '메시지 내용이 유효하지 않습니다.',
} as const;
