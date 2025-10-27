import { Router } from 'express';
import authMiddleware from '#middlewares/authMiddleware';
import requireRole from '#middlewares/requireRole';
import { validateCommentCreate } from './comments.validator';
import { createCommentHandler } from './comments.controller';

const router = Router();

router.route('/').post(authMiddleware, requireRole(['ADMIN', 'USER']), validateCommentCreate, createCommentHandler);
