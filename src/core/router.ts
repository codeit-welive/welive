import { Router } from 'express';
import noticeRouter from '#modules/notices/notices.router';

//import authRoutes from '#modules/auth/auth.router';
import healthRoutes from '#core/health';

const router = Router();
router.use('/notices', noticeRouter);

//router.use('/auth', authRoutes);
router.use('/', healthRoutes);

export default router;
