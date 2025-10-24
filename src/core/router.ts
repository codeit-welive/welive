import { Router } from 'express';
import noticeRouter from '#modules/notices/notices.router';

//import authRoutes from '#modules/auth/auth.router';

const router = Router();
router.use('/notices', noticeRouter);

//router.use('/auth', authRoutes);

export default router;
