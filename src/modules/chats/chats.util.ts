import { getByIdWithUserAuth, getByIdWithAdminAuth } from '#modules/chats/chats.repo';
import ApiError from '#errors/ApiError';
import type { ChatUserRole } from '#modules/chats/dto/chats.dto';
import { CHAT_ERROR_MESSAGES } from '#constants/chat.constant';

/**
 * 채팅방 접근 권한 확인 유틸
 * @description Socket.io 이벤트 & HTTP API에서 공통으로 사용
 * @param chatRoomId - 채팅방 ID
 * @param user - 인증된 사용자 정보
 * @returns 권한이 있으면 채팅방 정보 반환
 * @throws {ApiError} 권한이 없으면 403 에러
 */
export const verifyChatRoomAccess = async (chatRoomId: string, userId: string, role: ChatUserRole) => {
  const chatRoom =
    role === 'ADMIN' ? await getByIdWithAdminAuth(chatRoomId, userId) : await getByIdWithUserAuth(chatRoomId, userId);

  if (!chatRoom) {
    throw ApiError.forbidden(CHAT_ERROR_MESSAGES.NO_CHAT_ROOM_ACCESS);
  }

  return chatRoom;
};
