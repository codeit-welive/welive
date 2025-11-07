import { Router } from 'express';
import { validateUserUpdate } from './users.validator';
import { updateUserController } from './users.controller';
import authMiddleware from '#core/middlewares/authMiddleware';

const router = Router();

/**
 * PATCH /api/users/me
 */
router.patch('/me', authMiddleware, validateUserUpdate, updateUserController);

export default router;
