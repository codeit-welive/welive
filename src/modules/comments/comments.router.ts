import { Router } from 'express';
import authMiddleware from '#middlewares/authMiddleware';
import requireRole from '#middlewares/requireRole';
import { validateCommentCreate, validateCommentPatch } from './comments.validator';
import { createCommentHandler, patchCommentHandler } from './comments.controller';

const router = Router();

router.route('/').post(authMiddleware, requireRole(['ADMIN', 'USER']), validateCommentCreate, createCommentHandler);

router
  .route('/:commentId')
  .patch(authMiddleware, requireRole(['ADMIN', 'USER']), validateCommentPatch, patchCommentHandler);
