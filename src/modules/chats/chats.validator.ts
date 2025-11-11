import type { Request, Response, NextFunction } from 'express';
import forwardZodError from '#utils/zod';
import { getChatRoomListSchema, getChatRoomByIdSchema, getMessagesSchema } from './dto/chats.dto';

/**
 * 채팅방 목록 조회 검증 (관리자용)
 * @description GET /api/chats/rooms - 전체 요청 검증
 */
export const validateGetChatRoomList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = await getChatRoomListSchema.parseAsync({
      adminId: req.user.id,
      ...req.query,
    });
    res.locals.validatedData = validatedData;
    next();
  } catch (err) {
    forwardZodError(err, '채팅방 목록 조회', next);
  }
};

/**
 * 채팅방 상세 조회 요청 검증
 * @description GET /api/chats/rooms/:roomId - params와 user 결합 검증
 */
export const validateGetChatRoomById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const validatedData = await getChatRoomByIdSchema.parseAsync({
      userId: req.user.id,
      role: req.user.role,
      chatRoomId: roomId,
    });

    res.locals.validatedData = validatedData;
    next();
  } catch (err) {
    forwardZodError(err, '채팅방 상세 조회', next);
  }
};

/**
 * 메시지 목록 조회 검증
 * @description GET /api/chats/rooms/:roomId/messages - 전체 요청 검증
 */
export const validateGetMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const validatedData = await getMessagesSchema.parseAsync({
      chatRoomId: roomId,
      ...req.query,
    });
    res.locals.validatedData = validatedData;
    next();
  } catch (err) {
    forwardZodError(err, '메시지 목록 조회', next);
  }
};
