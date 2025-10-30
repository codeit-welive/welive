import { Router } from 'express';

/**
 * 시스템 레벨 (core, infra)
 */
import healthRouter from '#core/health/health.router';
import sseRouter from '#sse/index';

/**
 * 도메인 레벨 (modules)
 */
import authRouter from '#modules/auth/auth.router';
import complaintRouter from '#modules/complaints/complaints.router';
import noticeRouter from '#modules/notices/notices.router';

const router = Router();

/**
 * 시스템 계층 라우트
 */
router.use('/', healthRouter);
router.use('/notifications', sseRouter);

/**
 * 도메인 계층 라우트
 */
router.use('/auth', authRouter);
router.use('/complaints', complaintRouter);
router.use('/notices', noticeRouter);

export default router;
