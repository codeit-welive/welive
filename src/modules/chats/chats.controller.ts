import type { Request, Response, NextFunction } from 'express';
import * as ChatService from './chats.service';
import type { GetChatRoomListDto, GetChatRoomByIdDto, GetMessagesDto } from './dto/chats.dto';

/**
 * 내 채팅방 조회 (입주민)
 * @route GET /api/chats/my-room
 * @access USER only
 */
export const getMyRoomHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const result = await ChatService.getMyRoom(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * 채팅방 목록 조회 (관리자)
 * @route GET /api/chats/rooms
 * @access ADMIN only
 */
export const getChatRoomListHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = res.locals.validatedData as GetChatRoomListDto;

    const result = await ChatService.getChatRoomList(validatedData);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * 채팅방 상세 조회 (초기 로드, 자동 읽음 처리)
 * @route GET /api/chats/rooms/:roomId
 * @access ADMIN, USER
 */
export const getChatRoomHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = res.locals.validatedData as GetChatRoomByIdDto;

    const result = await ChatService.getChatRoom(validatedData);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * 메시지 목록 조회 (과거 메시지 로드, 무한 스크롤)
 * @route GET /api/chats/rooms/:roomId/messages
 * @access ADMIN, USER
 */
export const getMessageListHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = res.locals.validatedData as GetMessagesDto;

    const result = await ChatService.getMessageList(validatedData);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
