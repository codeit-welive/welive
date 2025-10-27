/**
 * @file jobs/poll/poll.activate.job.ts
 * @description 10분마다 투표 시작 여부를 확인하여 자동 활성화 처리
 * - 부하 분산을 위하여 10분 30초에 처리
 */

import { CronJob } from 'cron';
import { activateReadyPolls } from './poll.activate.handler';
import { logger } from '#core/logger';

/**
 * 10분 단위 Poll 활성화 검사 Job
 */
export const startPollActivateJob = (): void => {
  const job = new CronJob(
    '30 */10 * * * *', // 매 10분 30초마다
    async () => {
      logger.system.debug('Poll 활성화 검사 시작');
      await activateReadyPolls();
      logger.system.debug('Poll 활성화 검사 완료');
    },
    null, // onComplete,
    false, // start 수동 제어
    'Asia/Seoul' // 타임존
  );

  job.fireOnTick();
  job.start();
  logger.system.info('Poll 활성화 스케줄러 시작 (매 10분)');
};
