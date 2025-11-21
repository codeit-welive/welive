/**
 * @file jobs/poll/poll.expire.job.ts
 * @description 매 10분마다 Poll 만료 처리 실행
 */

import { CronJob } from 'cron';
import { closeExpiredPolls } from './poll.expire.handler';
import { logger } from '#core/logger';

/**
 * 10분 단위 Poll 만료 검사 Job
 */
export const startPollExpireJob = (): void => {
  const job = new CronJob(
    '*/10 * * * *',
    async () => {
      logger.system.debug('Poll 만료 검사 시작');
      await closeExpiredPolls();
      logger.system.debug('Poll 만료 검사 완료');
    },
    null, // onComplete,
    false, // start 수동 제어
    'Asia/Seoul' // 타임존
  );

  job.fireOnTick();
  job.start();
  logger.system.info('Poll 만료 스케줄러 시작 (매 10분)');
};
