/**
 * @file modules/pollScheduler/pollScheduler.router.ts
 * @description Poll 스케줄러 라우트 정의
 */

import { Router } from 'express';
import { pingPollScheduler } from './poll-scheduler.controller';

const router = Router();

/**
 * 개발/운영용 스케줄러 상태 확인용 API
 * 프론트에서는 사용하지 않음
 */
router.get(
  '/ping',
  //#swagger.tags = ['Poll-scheduler']
  //#swagger.summary = 'Poll 스케줄러 상태 확인'
  //#swagger.description = '서버에 스케줄러가 정상 작동 중인지 확인하기 위한 개발/운영용 엔드포인트입니다. 프론트에서는 사용하지 않습니다.'
  //#swagger.responses[200] = { description: '정상적으로 동작하는 경우', content: { "application/json": { example: { message: "Poll scheduler is running." } } } }
  //#swagger.responses[500] = { description: '스케줄러 비정상 응답', content: { "application/json": { example: { error: "Scheduler not responding" } } } }
  pingPollScheduler
);

export default router;
