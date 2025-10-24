import express from 'express';
import { createNotice, deleteNotice, getNotice, getNoticeList, updateNotice } from './notices.controller';
import {
  validateNoticeCreate,
  validateNoticeParams,
  validateNoticeQuery,
  validateNoticeUpdate,
} from './notices.validator';
import requireRole from '#core/middlewares/requireRole';
import authMiddleware from '#core/middlewares/authMiddleware';

const noticeRouter = express.Router();

noticeRouter
  .route('/')
  .post(authMiddleware, requireRole(['ADMIN']), validateNoticeCreate, createNotice)
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), validateNoticeQuery, getNoticeList);
noticeRouter
  .route('/:noticeId')
  .get(authMiddleware, requireRole(['ADMIN', 'USER']), validateNoticeParams, getNotice)
  .patch(authMiddleware, requireRole(['ADMIN']), validateNoticeParams, validateNoticeUpdate, updateNotice)
  .delete(authMiddleware, requireRole(['ADMIN']), deleteNotice);

export default noticeRouter;
