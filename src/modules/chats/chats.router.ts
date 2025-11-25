import { Router } from 'express';
import authMiddleware from '#middlewares/authMiddleware';
import requireRole from '#middlewares/requireRole';
import {
  validateGetChatRoomList,
  validateGetChatRoomById,
  validateGetMessageList,
  validateCreateChatRoomByAdmin,
} from './chats.validator';
import {
  getMyRoomHandler,
  getChatRoomListHandler,
  getChatRoomHandler,
  getMessageListHandler,
  createChatRoomByUserHandler,
  createChatRoomByAdminHandler,
} from './chats.controller';

const chatRouter = Router();

/**
 * GET /chats/my-room
 * 내 채팅방 조회 (입주민)
 * @access USER only
 */
chatRouter
  .route('/my-room')
  .get(
    //#swagger.tags = ['Chats']
    //#swagger.summary = '[채팅] 내 채팅방 조회 (입주민)'
    //#swagger.description = '입주민(USER)이 자신의 채팅방 정보를 조회합니다. 채팅방이 없으면 404 에러를 반환합니다.'
    //#swagger.responses[200] = { description: '채팅방 조회 성공', content: { "application/json": { example: { id: "chatroom-uuid-1234", apartmentId: "apt-uuid-5678", residentId: "resident-uuid-9999", lastMessage: "안녕하세요", lastMessageAt: "2025-06-13T15:30:00.000Z", unreadCountAdmin: 0, unreadCountResident: 2, createdAt: "2025-06-13T09:00:00.000Z", updatedAt: "2025-06-13T15:30:00.000Z", resident: { name: "홍길동", building: "101", unitNumber: "502" }, apartment: { apartmentName: "위리브 아파트", admin: { name: "관리자" } } } } } }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음 (USER 역할 필요)' }
    //#swagger.responses[404] = { description: '채팅방을 찾을 수 없음' }
    authMiddleware,
    requireRole(['USER']),
    getMyRoomHandler
  )
  .post(
    //#swagger.tags = ['Chats']
    //#swagger.summary = '[채팅] 채팅방 생성 (입주민)'
    //#swagger.description = '입주민(USER)이 관리자와의 1:1 채팅방을 생성합니다. 이미 채팅방이 있으면 기존 채팅방을 반환합니다 (멱등성 보장).'
    //#swagger.responses[201] = { description: '채팅방 생성 성공', content: { "application/json": { example: { id: "chatroom-uuid-1234", apartmentId: "apt-uuid-5678", residentId: "resident-uuid-9999", lastMessage: null, lastMessageAt: null, unreadCountAdmin: 0, unreadCountResident: 0, createdAt: "2025-06-13T09:00:00.000Z", updatedAt: "2025-06-13T09:00:00.000Z" } } } }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음 (USER 역할 필요)' }
    //#swagger.responses[404] = { description: '입주민 정보를 찾을 수 없음' }
    authMiddleware,
    requireRole(['USER']),
    createChatRoomByUserHandler
  );

/**
 * GET /chats/rooms
 * 채팅방 목록 조회 (관리자)
 * @access ADMIN only
 */
chatRouter
  .route('/rooms')
  .get(
    //#swagger.tags = ['Chats']
    //#swagger.summary = '[채팅] 채팅방 목록 조회 (관리자)'
    //#swagger.description = '관리자(ADMIN)가 관리하는 아파트의 채팅방 목록을 조회합니다. 페이지네이션 및 읽지 않은 메시지 필터링을 지원합니다.'
    //#swagger.parameters['page'] = { in: 'query', description: '페이지 번호 (기본값: 1)', type: 'integer' }
    //#swagger.parameters['limit'] = { in: 'query', description: '페이지당 항목 수 (기본값: 10, 최대: 100)', type: 'integer' }
    //#swagger.parameters['unreadOnly'] = { in: 'query', description: '읽지 않은 메시지가 있는 채팅방만 조회', type: 'boolean' }
    //#swagger.responses[200] = { description: '채팅방 목록 조회 성공', content: { "application/json": { example: { data: [{ id: "chatroom-uuid-1234", apartmentId: "apt-uuid-5678", residentId: "resident-uuid-9999", lastMessage: "안녕하세요", lastMessageAt: "2025-06-13T15:30:00.000Z", unreadCountAdmin: 2, unreadCountResident: 0, createdAt: "2025-06-13T09:00:00.000Z", updatedAt: "2025-06-13T15:30:00.000Z", resident: { name: "홍길동", building: "101", unitNumber: "502" } }], pagination: { page: 1, limit: 10, totalCount: 1, totalPages: 1 } } } } }
    //#swagger.responses[400] = { description: '잘못된 요청 (유효하지 않은 쿼리 파라미터)' }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음 (ADMIN 역할 필요)' }
    authMiddleware,
    requireRole(['ADMIN']),
    validateGetChatRoomList,
    getChatRoomListHandler
  )
  .post(
    //#swagger.tags = ['Chats']
    //#swagger.summary = '[채팅] 채팅방 생성 (관리자)'
    //#swagger.description = '관리자(ADMIN)가 특정 입주민과의 1:1 채팅방을 생성합니다. 이미 채팅방이 있으면 기존 채팅방을 반환합니다 (멱등성 보장). 관리하는 아파트의 입주민만 채팅방 생성 가능합니다.<br><br>**Request Body:**<br>- residentId (string, 필수): 입주민 ID (UUID)'
    //#swagger.requestBody = { required: true, content: { "application/json": { example: { residentId: "resident-uuid-9999" } } } }
    //#swagger.responses[201] = { description: '채팅방 생성 성공', content: { "application/json": { example: { id: "chatroom-uuid-1234", apartmentId: "apt-uuid-5678", residentId: "resident-uuid-9999", lastMessage: null, lastMessageAt: null, unreadCountAdmin: 0, unreadCountResident: 0, createdAt: "2025-06-13T09:00:00.000Z", updatedAt: "2025-06-13T09:00:00.000Z" } } } }
    //#swagger.responses[400] = { description: '잘못된 요청 (필수 필드 누락, 유효성 검증 실패 등)' }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음 (ADMIN 역할 필요, 또는 관리하는 아파트의 입주민이 아님)' }
    //#swagger.responses[404] = { description: '입주민을 찾을 수 없음' }
    authMiddleware,
    requireRole(['ADMIN']),
    validateCreateChatRoomByAdmin,
    createChatRoomByAdminHandler
  );

/**
 * GET /chats/rooms/:roomId
 * 채팅방 상세 조회 (초기 로드, 자동 읽음 처리)
 * @access ADMIN, USER
 */
chatRouter
  .route('/rooms/:roomId')
  .get(
    //#swagger.tags = ['Chats']
    //#swagger.summary = '[채팅] 채팅방 상세 조회 (초기 로드)'
    //#swagger.description = '채팅방 상세 정보와 최신 메시지 50개를 조회합니다. 조회 시 자동으로 읽음 처리됩니다. ADMIN은 관리하는 아파트의 채팅방만, USER는 본인의 채팅방만 조회 가능합니다.'
    //#swagger.parameters['roomId'] = { in: 'path', description: '채팅방 ID (UUID)', required: true, type: 'string' }
    //#swagger.responses[200] = { description: '채팅방 상세 조회 성공', content: { "application/json": { example: { id: "chatroom-uuid-1234", apartmentId: "apt-uuid-5678", residentId: "resident-uuid-9999", lastMessage: "안녕하세요", lastMessageAt: "2025-06-13T15:30:00.000Z", unreadCountAdmin: 0, unreadCountResident: 0, createdAt: "2025-06-13T09:00:00.000Z", updatedAt: "2025-06-13T15:30:00.000Z", resident: { name: "홍길동", building: "101", unitNumber: "502" }, apartment: { apartmentName: "위리브 아파트", admin: { name: "관리자" } }, recentMessages: [{ id: "msg-uuid-1111", chatRoomId: "chatroom-uuid-1234", senderId: "user-uuid-2222", content: "안녕하세요", isReadByAdmin: true, isReadByResident: true, createdAt: "2025-06-13T15:30:00.000Z", sender: { id: "user-uuid-2222", name: "홍길동", role: "USER" } }] } } } }
    //#swagger.responses[400] = { description: '잘못된 요청 (채팅방 ID 형식 오류)' }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음 (해당 채팅방에 접근 권한 없음)' }
    //#swagger.responses[404] = { description: '채팅방을 찾을 수 없음' }
    authMiddleware,
    requireRole(['ADMIN', 'USER']),
    validateGetChatRoomById,
    getChatRoomHandler
  );

/**
 * GET /chats/rooms/:roomId/messages
 * 메시지 목록 조회 (과거 메시지 로드, 무한 스크롤)
 * @access ADMIN, USER
 */
chatRouter
  .route('/rooms/:roomId/messages')
  .get(
    //#swagger.tags = ['Chats']
    //#swagger.summary = '[채팅] 메시지 목록 조회 (과거 메시지)'
    //#swagger.description = '채팅방의 과거 메시지를 페이지네이션으로 조회합니다. 무한 스크롤 구현을 위해 사용됩니다. page는 2부터 시작합니다 (1페이지는 채팅방 상세 조회의 recentMessages에서 제공).'
    //#swagger.parameters['roomId'] = { in: 'path', description: '채팅방 ID (UUID)', required: true, type: 'string' }
    //#swagger.parameters['page'] = { in: 'query', description: '페이지 번호 (최소값: 2, 기본값: 2)', type: 'integer' }
    //#swagger.parameters['limit'] = { in: 'query', description: '페이지당 메시지 수 (기본값: 50, 최대: 100)', type: 'integer' }
    //#swagger.responses[200] = { description: '메시지 목록 조회 성공', content: { "application/json": { example: [{ id: "msg-uuid-1111", chatRoomId: "chatroom-uuid-1234", senderId: "user-uuid-2222", content: "안녕하세요", isReadByAdmin: true, isReadByResident: true, createdAt: "2025-06-13T15:30:00.000Z", sender: { id: "user-uuid-2222", name: "홍길동", role: "USER" } }, { id: "msg-uuid-2222", chatRoomId: "chatroom-uuid-1234", senderId: "admin-uuid-3333", content: "네, 안녕하세요", isReadByAdmin: true, isReadByResident: true, createdAt: "2025-06-13T15:31:00.000Z", sender: { id: "admin-uuid-3333", name: "관리자", role: "ADMIN" } }] } } }
    //#swagger.responses[400] = { description: '잘못된 요청 (채팅방 ID 형식 오류, 유효하지 않은 쿼리 파라미터)' }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음 (해당 채팅방에 접근 권한 없음)' }
    authMiddleware,
    requireRole(['ADMIN', 'USER']),
    validateGetMessageList,
    getMessageListHandler
  );

export default chatRouter;
