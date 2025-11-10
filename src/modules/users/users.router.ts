import { Router } from 'express';
import multer from 'multer';
import { validateUserUpdate } from './users.validator';
import { updateUserController } from './users.controller';
import authMiddleware from '#core/middlewares/authMiddleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * PATCH /api/users/me
 */
router.patch('/me', authMiddleware, upload.single('file'), validateUserUpdate, updateUserController);

export default router;
