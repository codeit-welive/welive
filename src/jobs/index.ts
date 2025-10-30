/**
 * @file jobs/index.ts
 * @description 스케줄러 통합 진입점
 */

import { startPollActivateJob } from './poll/poll.activate.job';
import { startPollExpireJob } from './poll/poll.expire.job';
import { setPollSchedulerStatus } from './poll/status';
import { logger } from '#core/logger';

export const startAllJobs = (): void => {
  try {
    startPollActivateJob();
    startPollExpireJob();
    setPollSchedulerStatus(true);
    logger.system.info('✅ Poll scheduler started');
  } catch (err) {
    setPollSchedulerStatus(false);
    logger.system.error(err as Error, '❌ Failed to start poll scheduler');
  }
};
