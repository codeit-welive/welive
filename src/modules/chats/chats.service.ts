import * as ChatRepo from './chats.repo';
import ApiError from '#errors/ApiError';
import { CHAT_ERROR_MESSAGES } from '#constants/chat.constant';
import { ChatRoomListQueryDto, ChatMessageListQueryDto } from './dto/querys.dto';

/**
 * 내 채팅방 조회 (입주민)
 * @description 입주민이 자신의 채팅방 조회
 * @param userId - 사용자 ID
 * @returns 채팅방 정보
 * @throws ApiError.notFound - 채팅방이 없을 때
 */
export const getMyRoom = async (userId: string) => {
  // 1. 채팅방 조회
  const chatRoom = await ChatRepo.getByUserId(userId);

  // 2. 없으면 404 에러
  if (!chatRoom) {
    throw ApiError.notFound(CHAT_ERROR_MESSAGES.CHAT_ROOM_NOT_FOUND);
  }

  // 3. 반환
  return chatRoom;
};

/**
 * 채팅방 목록 조회 (관리자)
 * @description 관리자가 관리하는 아파트의 채팅방 목록 (페이지네이션 + 필터링)
 * @param adminId - 관리자 ID
 * @param query - 목록 조회 쿼리 (page, limit, unreadOnly)
 * @returns 채팅방 목록 + 페이지네이션 정보
 */
export const getChatRoomList = async (adminId: string, query: ChatRoomListQueryDto) => {
  // 1. 목록 + 개수 병렬 조회
  const [chatRooms, totalCount] = await Promise.all([
    ChatRepo.getListByAdminId(adminId, query),
    ChatRepo.getCountByAdminId(adminId, query),
  ]);

  // 2. 페이지네이션 계산
  const totalPages = Math.ceil(totalCount / query.limit);

  // 3. 응답 포맷
  return {
    data: chatRooms,
    pagination: {
      page: query.page,
      limit: query.limit,
      totalCount,
      totalPages,
    },
  };
};

/**
 * 채팅방 상세 조회
 * @description 특정 채팅방의 상세 정보 조회 (권한 검증 포함)
 * @param userId - 사용자 ID
 * @param role - 사용자 역할
 * @param chatRoomId - 채팅방 ID
 * @returns 채팅방 상세 정보
 * @throws ApiError.notFound - 채팅방을 찾을 수 없거나 권한이 없을 때
 */
export const getChatRoomById = async (userId: string, role: 'ADMIN' | 'USER', chatRoomId: string) => {
  // 권한 포함 조회 (1번 쿼리)
  const chatRoom =
    role === 'USER'
      ? await ChatRepo.getByIdWithUserAuth(chatRoomId, userId)
      : await ChatRepo.getByIdWithAdminAuth(chatRoomId, userId);

  // 찾을 수 없음
  if (!chatRoom) {
    throw ApiError.notFound(CHAT_ERROR_MESSAGES.CHAT_ROOM_NOT_FOUND);
  }

  return chatRoom;
};

/**
 * 메시지 저장 (Socket.io용)
 * @description WebSocket으로 받은 메시지를 DB에 저장
 * @param data - 메시지 데이터
 * @param data.chatRoomId - 채팅방 ID
 * @param data.senderId - 발신자 ID
 * @param data.content - 메시지 내용
 * @param data.role - 발신자 역할
 * @returns 저장된 메시지 정보
 */
export const createMessage = async (data: {
  chatRoomId: string;
  senderId: string;
  content: string;
  role: 'ADMIN' | 'USER';
}) => {
  // 1. 읽음 상태 결정
  const isReadByAdmin = data.role === 'ADMIN';
  const isReadByResident = data.role === 'USER';

  // 2. 메시지 저장
  const message = await ChatRepo.createMessage({
    chatRoomId: data.chatRoomId,
    senderId: data.senderId,
    content: data.content,
    isReadByAdmin,
    isReadByResident,
  });

  // 3. 반환
  return message;
};

/**
 * 메시지 목록 조회
 * @description 채팅방의 과거 메시지 목록 조회 (페이지네이션)
 * @param userId - 사용자 ID
 * @param role - 사용자 역할
 * @param chatRoomId - 채팅방 ID
 * @param query - 목록 조회 쿼리 (page, limit)
 * @returns 메시지 목록 + 페이지네이션 정보
 * @throws ApiError.notFound - 채팅방이 없을 때
 * @throws ApiError.forbidden - 권한이 없을 때
 */
export const getMessages = async (chatRoomId: string, query: ChatMessageListQueryDto) => {
  // 1. 메시지 목록 + 개수 병렬 조회
  const [messages, totalCount] = await Promise.all([
    ChatRepo.getMessagesByChatRoomId(chatRoomId, query),
    ChatRepo.getMessageCountByChatRoomId(chatRoomId),
  ]);

  // 2. 페이지네이션 계산
  const totalPages = Math.ceil(totalCount / query.limit);
  const hasNext = query.page < totalPages;
  const nextCursor = messages.length > 0 ? messages[messages.length - 1].id : null;

  // 3. 응답 포맷
  return {
    data: messages,
    pagination: {
      page: query.page,
      limit: query.limit,
      totalCount,
      totalPages,
      hasNext,
      nextCursor,
    },
  };
};

/**
 * 읽음 처리
 * @description 채팅방의 읽지 않은 메시지를 모두 읽음 처리
 * @param chatRoomId - 채팅방 ID
 * @param role - 사용자 역할
 * @returns 읽음 처리된 메시지 개수
 */
export const markAsRead = async (chatRoomId: string, role: 'ADMIN' | 'USER') => {
  // Repository 호출
  const readCount = await ChatRepo.patchMessagesAsRead(chatRoomId, role);

  // 응답 포맷
  return {
    readCount,
    unreadCount: 0,
  };
};
