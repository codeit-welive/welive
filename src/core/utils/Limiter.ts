/**
 * @file Limiter.ts
 * @description 비동기 동시 실행 제한 + 재시도(backoff) 유틸리티
 *
 * - Concurrency 제한 (`limit`)
 * - 429 응답 또는 일시적 오류에 대한 재시도 (`withRetry`)
 * - Jitter(랜덤 백오프) 포함
 * - Jest, Node.js, ESM/CJS 환경 모두 호환
 */

export class Limiter {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(private readonly limit: number) {}

  /**
   * 주어진 비동기 함수를 동시 실행 제한 내에서 실행
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

/**
 * p-limit과 동일한 형태의 래퍼
 *
 * @example
 * const limit = createLimit(5);
 * await Promise.all([
 *   limit(() => task1()),
 *   limit(() => task2()),
 * ]);
 */
export const createLimit = (limit: number) => {
  const limiter = new Limiter(limit);
  return async <T>(fn: () => Promise<T>): Promise<T> => limiter.run(fn);
};

/**
 * 지정된 시간(ms)만큼 대기
 */
export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 재시도 로직 (429, 임시 오류 등 처리)
 */
export const withRetry = async <T>(
  task: () => Promise<T>,
  options: { retries?: number; base?: number; cap?: number } = {}
): Promise<T> => {
  const { retries = 2, base = 200, cap = 2000 } = options;
  let attempt = 0;

  for (;;) {
    try {
      return await task();
    } catch (e: any) {
      const status = e?.response?.status ?? e?.status ?? e?.code;
      const retryAfter =
        e?.response?.data?.retry_after ??
        e?.rawError?.retry_after ??
        e?.data?.retry_after ??
        e?.response?.headers?.['retry-after'];

      // 429 Too Many Requests — Retry-After 헤더 처리
      if (status === 429 && retryAfter != null) {
        let waitMs = 1000;
        const parsed = parseFloat(retryAfter);

        if (Number.isFinite(parsed)) {
          waitMs = parsed < 100 ? parsed * 1000 : parsed;
        } else if (typeof retryAfter === 'string') {
          const t = Date.parse(retryAfter);
          if (Number.isFinite(t)) waitMs = Math.max(0, t - Date.now());
        }

        if (waitMs < 250) waitMs = 250;
        await sleep(waitMs);
        continue;
      }

      if (++attempt > retries) throw e;

      const backoff = Math.min(cap, base * 2 ** (attempt - 1));
      await sleep(Math.random() * backoff);
    }
  }
};
