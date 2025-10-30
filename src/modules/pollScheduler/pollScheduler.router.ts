/**
 * @file modules/pollScheduler/pollScheduler.router.ts
 * @description Poll 스케줄러 라우트 정의
 */

import { Router } from 'express';
import { pingPollScheduler } from './pollScheduler.controller';

const router = Router();

router.get('/ping', pingPollScheduler);

export default router;
