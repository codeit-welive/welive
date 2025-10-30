import { Router } from 'express';
import authMiddleware from '#middlewares/authMiddleware';
import requireRole from '#middlewares/requireRole';
import { validateCommentCreate, validateCommentPatch, validateCommentDelete } from './comments.validator';
import { createCommentHandler, patchCommentHandler, deleteCommentHandler } from './comments.controller';

const commentRouter = Router();

/**
 * POST /comments
 * 댓글 생성 (ADMIN, USER)
 */
commentRouter
  .route('/')
  .post(authMiddleware, requireRole(['ADMIN', 'USER']), validateCommentCreate, createCommentHandler);

/**
 * PATCH /comments/:commentId
 * 댓글 수정 - 본인이 작성한 댓글만 수정 가능
 *
 * DELETE /comments/:commentId
 * 댓글 삭제 - USER: 본인 댓글만, ADMIN: 관리 아파트 모든 댓글
 */
commentRouter
  .route('/:commentId')
  .patch(authMiddleware, requireRole(['ADMIN', 'USER']), validateCommentPatch, patchCommentHandler)
  .delete(authMiddleware, requireRole(['ADMIN', 'USER']), validateCommentDelete, deleteCommentHandler);

export default commentRouter;
