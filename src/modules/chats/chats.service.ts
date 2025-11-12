import * as ChatRepo from './chats.repo';
import ApiError from '#errors/ApiError';
import { CHAT_ERROR_MESSAGES } from '#constants/chat.constant';
import { GetChatRoomListDto, GetChatRoomByIdDto, GetMessageListDto, CreateMessageDto } from './dto/chats.dto';

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
 * @param data - 채팅방 목록 조회 DTO
 * @param data.adminId - 관리자 ID
 * @param data.page - 페이지 번호
 * @param data.limit - 페이지당 항목 수
 * @param data.unreadOnly - 읽지 않은 메시지만 필터링
 * @returns 채팅방 목록 + 페이지네이션 정보
 */
export const getChatRoomList = async (data: GetChatRoomListDto) => {
  // 1. 목록 + 개수 병렬 조회
  const [chatRooms, totalCount] = await Promise.all([
    ChatRepo.getListByAdminId(data),
    ChatRepo.getCountByAdminId(data),
  ]);

  // 2. 페이지네이션 계산
  const totalPages = Math.ceil(totalCount / data.limit);

  // 3. 응답 포맷
  return {
    data: chatRooms,
    pagination: {
      page: data.page,
      limit: data.limit,
      totalCount,
      totalPages,
    },
  };
};

/**
 * 채팅방 상세 조회 (초기 로드)
 * @description 특정 채팅방의 상세 정보 + 최신 메시지 50개 조회 (권한 검증 포함 + 자동 읽음 처리)
 * @param data - 채팅방 조회 DTO
 * @param data.userId - 사용자 ID
 * @param data.role - 사용자 역할
 * @param data.chatRoomId - 채팅방 ID
 * @returns 채팅방 상세 정보 + 최신 메시지 목록
 * @throws ApiError.notFound - 채팅방을 찾을 수 없거나 권한이 없을 때
 */
export const getChatRoom = async (data: GetChatRoomByIdDto) => {
  // 1. 읽음 처리 먼저 수행
  await ChatRepo.patchMessageListAsRead(data.chatRoomId, data.role);

  // 2. 권한 포함 조회 (최신 unreadCount 반영)
  const chatRoom =
    data.role === 'USER'
      ? await ChatRepo.getByIdWithUserAuth(data.chatRoomId, data.userId)
      : await ChatRepo.getByIdWithAdminAuth(data.chatRoomId, data.userId);

  // 3. 찾을 수 없음
  if (!chatRoom) {
    throw ApiError.notFound(CHAT_ERROR_MESSAGES.CHAT_ROOM_NOT_FOUND);
  }

  // 4. 최신 메시지 50개 조회
  const recentMessages = await ChatRepo.getMessageListByChatRoomId({
    chatRoomId: data.chatRoomId,
    page: 1,
    limit: 50,
  });

  // 5. 합쳐서 반환
  return {
    ...chatRoom,
    recentMessages,
  };
};

/**
 * 메시지 저장 (Socket.io용)
 * @description WebSocket으로 받은 메시지를 DB에 저장
 * @param data - 메시지 생성 DTO
 * @param data.chatRoomId - 채팅방 ID
 * @param data.senderId - 발신자 ID
 * @param data.content - 메시지 내용
 * @param data.role - 발신자 역할
 * @returns 저장된 메시지 정보
 */
export const createMessage = async (data: CreateMessageDto) => {
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
 * 메시지 목록 조회 (과거 메시지 로드용)
 * @description 채팅방의 과거 메시지 목록 조회 (페이지네이션, 무한 스크롤용)
 * @param data - 메시지 목록 조회 DTO
 * @param data.chatRoomId - 채팅방 ID
 * @param data.page - 페이지 번호 (2부터 시작, 1은 getChatRoomById에서 제공)
 * @param data.limit - 페이지당 항목 수
 * @returns 메시지 목록 + 페이지네이션 정보
 */
export const getMessageList = async (data: GetMessageListDto) => {
  // 1. 메시지 목록 + 개수 병렬 조회
  const [messages, totalCount] = await Promise.all([
    ChatRepo.getMessageListByChatRoomId(data),
    ChatRepo.getMessageCountByChatRoomId(data.chatRoomId),
  ]);

  // 2. 페이지네이션 계산
  const totalPages = Math.ceil(totalCount / data.limit);
  const hasNext = data.page < totalPages;
  const nextCursor = messages.length > 0 ? messages[messages.length - 1].id : null;

  // 3. 응답 포맷
  return {
    data: messages,
    pagination: {
      page: data.page,
      limit: data.limit,
      totalCount,
      totalPages,
      hasNext,
      nextCursor,
    },
  };
};
