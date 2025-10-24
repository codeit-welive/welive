import express from 'express';
import { createNotice, deleteNotice, getNotice, getNoticeList, updateNotice } from './notices.controller';
import { validateNoticeCreate, validateNoticeUpdate } from './notices.validator';
import requireRole from '#core/middlewares/requireRole';

const noticeRouter = express.Router();

noticeRouter
  .route('/')
  .post(requireRole(['ADMIN']), validateNoticeCreate, createNotice)
  .get(requireRole(['ADMIN', 'USER']), getNoticeList);
noticeRouter
  .route('/:noticeId')
  .get(requireRole(['ADMIN', 'USER']), getNotice)
  .patch(requireRole(['ADMIN']), validateNoticeUpdate, updateNotice)
  .delete(requireRole(['ADMIN']), deleteNotice);

export default noticeRouter;
