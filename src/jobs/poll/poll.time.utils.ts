/**
 * @file jobs/poll/poll.time.utils.ts
 * @description Poll 만료 작업에서 사용하는 시간 계산 유틸
 *
 * - Date 객체만 사용 (UTC 기준)
 * 크론 주기(default: 10분) 내 만료 예정 Poll을 탐지하는 로직 포함
 * - setTimeout 딜레이(ms) 계산 지원
 */

/**
 * 현재 시각을 UTC 기준으로 반환
 */
export const now = (): Date => new Date();

/**
 * 주어진 시각이 현재 시각 기준으로 이미 지난 상태인지 여부
 * @param targetDate - 비교 대상 시각 (UTC)
 */
export const isPast = (targetDate: Date): boolean => targetDate.getTime() <= Date.now();

/**
 * Poll이 다음 주기 내에 만료되는지 판단
 * @param targetDate - 투표 종료 시각 (UTC)
 * @param intervalMinutes 크론 주기 (기본값: 10분)
 */
export const isWithinInterval = (targetDate: Date, intervalMinutes = 10): boolean => {
  const nowTime = Date.now();
  const targetTime = targetDate.getTime();
  const intervalMs = intervalMinutes * 60 * 1_000;

  return targetTime > nowTime && targetTime <= nowTime + intervalMs;
};

/**
 * setTimeout용 지연 시간 계산(ms)
 * @params endDate - 투표 종료 시각(UTC)
 * @returns endDate까지 남은 ms
 */
export const getDelayMs = (endDate: Date): number => {
  const delay = endDate.getTime() - Date.now();
  return delay > 0 ? delay : 0;
};
