import { Router } from 'express';
import authMiddleware from '#middlewares/authMiddleware';
import requireRole from '#middlewares/requireRole';
import sanitizeMiddleware from '#core/sanitize';
import { validateCommentCreate, validateCommentPatch, validateCommentDelete } from './comments.validator';
import { createCommentHandler, patchCommentHandler, deleteCommentHandler } from './comments.controller';

const commentRouter = Router();

/**
 * POST /comments
 * 댓글 생성 (ADMIN, USER)
 */
commentRouter.route('/').post(
  //#swagger.tags = ['Comments']
  //#swagger.summary = '[댓글] 댓글 생성'
  //#swagger.description = '입주민(USER) 또는 관리자(ADMIN)가 민원 또는 공지사항에 새로운 댓글을 작성합니다.<br><br>**Request Body:**<br>- content (string, 필수): 댓글 내용 (1-500자)<br>- boardType (string, 필수): 게시판 타입 (COMPLAINT 또는 NOTICE)<br>- boardId (string, 필수): 게시글 ID (UUID)'
  //#swagger.requestBody = { required: true, content: { "application/json": { example: { content: "빠른 조치 부탁드립니다.", boardType: "COMPLAINT", boardId: "complaint-uuid-5678" } } } }
  //#swagger.responses[201] = { description: '댓글 생성 성공', content: { "application/json": { example: { comment: { id: "comment-uuid-1234", userId: "user-uuid-1234", content: "빠른 조치 부탁드립니다.", createdAt: "2025-06-13T10:30:00.000Z", updatedAt: "2025-06-13T10:30:00.000Z", writerName: "홍길동" }, board: { id: "complaint-uuid-5678", boardType: "COMPLAINT" } } } } }
  //#swagger.responses[400] = { description: '잘못된 요청 (필수 필드 누락, 유효성 검증 실패 등)' }
  //#swagger.responses[401] = { description: '인증 필요' }
  //#swagger.responses[403] = { description: '권한 없음 (해당 게시글에 댓글 작성 권한 없음)' }
  authMiddleware,
  requireRole(['ADMIN', 'USER']),
  validateCommentCreate,
  sanitizeMiddleware('comments'),
  createCommentHandler
);

/**
 * PATCH /comments/:commentId
 * 댓글 수정 - 본인이 작성한 댓글만 수정 가능
 *
 * DELETE /comments/:commentId
 * 댓글 삭제 - USER: 본인 댓글만, ADMIN: 관리 아파트 모든 댓글
 */
commentRouter
  .route('/:commentId')
  .patch(
    //#swagger.tags = ['Comments']
    //#swagger.summary = '[댓글] 댓글 수정'
    //#swagger.description = '사용자가 본인이 작성한 댓글을 수정합니다. 다른 사용자의 댓글은 수정할 수 없습니다.<br><br>**Request Body:**<br>- content (string, 필수): 댓글 내용 (1-500자)<br>- boardType (string, 필수): 게시판 타입 (COMPLAINT 또는 NOTICE)<br>- boardId (string, 필수): 게시글 ID (UUID)'
    //#swagger.parameters['commentId'] = { in: 'path', description: '수정할 댓글의 UUID', required: true, type: 'string' }
    //#swagger.requestBody = { required: true, content: { "application/json": { example: { content: "내용을 수정합니다.", boardType: "COMPLAINT", boardId: "complaint-uuid-5678" } } } }
    //#swagger.responses[200] = { description: '댓글 수정 성공', content: { "application/json": { example: { comment: { id: "comment-uuid-1234", userId: "user-uuid-1234", content: "내용을 수정합니다.", createdAt: "2025-06-13T10:30:00.000Z", updatedAt: "2025-06-13T10:35:00.000Z", writerName: "홍길동" }, board: { id: "complaint-uuid-5678", boardType: "COMPLAINT" } } } } }
    //#swagger.responses[400] = { description: '잘못된 요청 (필수 필드 누락, 유효성 검증 실패 등)' }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음 (본인이 작성한 댓글이 아님)' }
    //#swagger.responses[404] = { description: '댓글을 찾을 수 없음' }
    authMiddleware,
    requireRole(['ADMIN', 'USER']),
    validateCommentPatch,
    sanitizeMiddleware('comments'),
    patchCommentHandler
  )
  .delete(
    //#swagger.tags = ['Comments']
    //#swagger.summary = '[댓글] 댓글 삭제'
    //#swagger.description = '댓글을 삭제합니다. USER는 본인이 작성한 댓글만 삭제할 수 있으며, ADMIN은 관리하는 아파트의 모든 댓글을 삭제할 수 있습니다.'
    //#swagger.parameters['commentId'] = { in: 'path', description: '삭제할 댓글의 UUID', required: true, type: 'string' }
    //#swagger.responses[200] = { description: '댓글 삭제 성공', content: { "application/json": { example: { message: "정상적으로 삭제 처리되었습니다." } } } }
    //#swagger.responses[400] = { description: '잘못된 요청 (필수 필드 누락, 유효성 검증 실패 등)' }
    //#swagger.responses[401] = { description: '인증 필요' }
    //#swagger.responses[403] = { description: '권한 없음 (USER: 본인 댓글이 아님, ADMIN: 관리하는 아파트의 댓글이 아님)' }
    //#swagger.responses[404] = { description: '댓글을 찾을 수 없음' }
    authMiddleware,
    requireRole(['ADMIN', 'USER']),
    validateCommentDelete,
    deleteCommentHandler
  );

export default commentRouter;
