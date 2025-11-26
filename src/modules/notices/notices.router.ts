import { Router } from 'express';
import { createNotice, deleteNotice, getNotice, getNoticeList, updateNotice } from './notices.controller';
import {
  validateNoticeCreate,
  validateNoticeParams,
  validateNoticeQuery,
  validateNoticeUpdate,
} from './notices.validator';
import requireRole from '#core/middlewares/requireRole';
import authMiddleware from '#core/middlewares/authMiddleware';
import sanitizeMiddleware from '#core/sanitize';

const noticeRouter = Router();

noticeRouter
  .route('/')
  .post(authMiddleware, requireRole(['ADMIN']), validateNoticeCreate, sanitizeMiddleware('notices'), createNotice)
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), validateNoticeQuery, getNoticeList);

noticeRouter
  .route('/:noticeId')
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), validateNoticeParams, getNotice)
  .patch(
    authMiddleware,
    requireRole(['ADMIN']),
    validateNoticeParams,
    validateNoticeUpdate,
    sanitizeMiddleware('notices'),
    updateNotice
  )
  .delete(authMiddleware, requireRole(['ADMIN']), deleteNotice);

export default noticeRouter;
