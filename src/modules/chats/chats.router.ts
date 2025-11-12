import { Router } from 'express';
import authMiddleware from '#middlewares/authMiddleware';
import requireRole from '#middlewares/requireRole';
import { validateGetChatRoomList, validateGetChatRoomById, validateGetMessageList } from './chats.validator';
import {
  getMyRoomHandler,
  getChatRoomListHandler,
  getChatRoomHandler,
  getMessageListHandler,
} from './chats.controller';

const chatRouter = Router();

/**
 * GET /chats/my-room
 * 내 채팅방 조회 (입주민)
 * @access USER only
 */
chatRouter.route('/my-room').get(authMiddleware, requireRole(['USER']), getMyRoomHandler);

/**
 * GET /chats/rooms
 * 채팅방 목록 조회 (관리자)
 * @access ADMIN only
 */
chatRouter.route('/rooms').get(authMiddleware, requireRole(['ADMIN']), validateGetChatRoomList, getChatRoomListHandler);

/**
 * GET /chats/rooms/:roomId
 * 채팅방 상세 조회 (초기 로드, 자동 읽음 처리)
 * @access ADMIN, USER
 */
chatRouter
  .route('/rooms/:roomId')
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), validateGetChatRoomById, getChatRoomHandler);

/**
 * GET /chats/rooms/:roomId/messages
 * 메시지 목록 조회 (과거 메시지 로드, 무한 스크롤)
 * @access ADMIN, USER
 */
chatRouter
  .route('/rooms/:roomId/messages')
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), validateGetMessageList, getMessageListHandler);

export default chatRouter;
