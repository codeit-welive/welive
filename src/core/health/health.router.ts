import { Router } from 'express';
import { getHealthStatus } from './health.controller';

const router = Router();

/**
 * @route GET /api
 * @description 서버 및 DB 헬스체크
 * @returns { status, uptime, db, timestamp }
 */
router.get('/', getHealthStatus);

export default router;
