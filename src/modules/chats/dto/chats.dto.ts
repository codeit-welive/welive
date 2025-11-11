import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { CHAT_VALIDATION } from '#constants/chat.constant';
import { PAGINATION } from '#constants/pagination.constant';

// ==================== HTTP API 요청 DTO ====================

/**
 * 채팅방 목록 조회 스키마 (관리자용)
 * @description GET /api/chats/rooms - Validator에서 사용
 */
export const getChatRoomListSchema = z.object({
  adminId: z.uuid({ message: '유효한 관리자 ID가 아닙니다.' }),
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  unreadOnly: z.coerce.boolean().optional(),
});

/**
 * 채팅방 상세 조회 스키마
 * @description GET /api/chats/rooms/:roomId - Validator에서 사용
 */
export const getChatRoomByIdSchema = z.object({
  userId: z.uuid({ message: '유효한 사용자 ID가 아닙니다.' }),
  role: z.enum([UserRole.ADMIN, UserRole.USER], { message: '유효한 역할이 아닙니다.' }),
  chatRoomId: z.uuid({ message: '유효한 채팅방 ID가 아닙니다.' }),
});

/**
 * 메시지 목록 조회 스키마
 * @description GET /api/chats/rooms/:roomId/messages - Validator에서 사용
 */
export const getMessagesSchema = z.object({
  chatRoomId: z.uuid({ message: '유효한 채팅방 ID가 아닙니다.' }),
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(50),
});

// ==================== Socket.io 메시지 DTO ====================

/**
 * 메시지 생성 스키마 (Socket.io용)
 * @description Socket.io에서 메시지 전송 시 Service로 전달할 데이터
 */
export const createMessageSchema = z.object({
  chatRoomId: z.uuid({ message: '유효한 채팅방 ID가 아닙니다.' }),
  senderId: z.uuid({ message: '유효한 발신자 ID가 아닙니다.' }),
  content: z
    .string()
    .min(CHAT_VALIDATION.MESSAGE_MIN_LENGTH, `메시지는 최소 ${CHAT_VALIDATION.MESSAGE_MIN_LENGTH}자 이상이어야 합니다.`)
    .max(CHAT_VALIDATION.MESSAGE_MAX_LENGTH, `메시지는 최대 ${CHAT_VALIDATION.MESSAGE_MAX_LENGTH}자까지 가능합니다.`),
  role: z.enum([UserRole.ADMIN, UserRole.USER], { message: '유효한 역할이 아닙니다.' }),
});

// ==================== Type Exports ====================

/**
 * 채팅 기능에서 사용하는 역할
 * @description SUPER_ADMIN은 채팅방이 없으므로 제외
 */
export type ChatUserRole = Extract<UserRole, 'ADMIN' | 'USER'>;

export type GetChatRoomListDto = z.infer<typeof getChatRoomListSchema>;
export type GetChatRoomByIdDto = z.infer<typeof getChatRoomByIdSchema>;
export type GetMessagesDto = z.infer<typeof getMessagesSchema>;
export type CreateMessageDto = z.infer<typeof createMessageSchema>;
