/**
 * @file jobs/poll/status.ts
 * @description Poll 스케줄러 상태 전역 관리
 */

let pollSchedulerRunning = false;

export const setPollSchedulerStatus = (status: boolean): void => {
  pollSchedulerRunning = status;
};

export const getPollSchedulerStatus = (): boolean => pollSchedulerRunning;
