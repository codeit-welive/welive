/**
 * @file modules/pollScheduler/pollScheduler.controller.ts
 * @description Poll 스케줄러 상태 확인 (개발용)
 */

import { RequestHandler } from 'express';
import { getPollSchedulerStatus } from '#jobs/poll/status';

export const pingPollScheduler: RequestHandler = (_req, res) => {
  if (getPollSchedulerStatus()) return res.status(200).json({ message: 'Poll scheduler is running.' });

  return res.status(503).json({ message: 'Poll scheduler is not running.' });
};
