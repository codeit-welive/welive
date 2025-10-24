import { Router } from 'express';

//import authRoutes from '#modules/auth/auth.router';
import healthRoutes from '#core/health';

const router = Router();

//router.use('/auth', authRoutes);
router.use('/', healthRoutes);

export default router;
