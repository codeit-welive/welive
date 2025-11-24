import type { ErrorRequestHandler } from 'express';
import ApiError from '#errors/ApiError';

const ENV = process.env.NODE_ENV ?? 'development';

/**
 * Express 전역 에러 핸들러
 *
 * - 환경별로 에러 응답 및 로깅 방식을 다르게 처리합니다.
 * - ApiError 인스턴스일 경우, 명시적인 상태 코드와 메시지를 반환합니다.
 * - 그 외 예외는 500 내부 서버 오류로 통일합니다.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const isAPI = err instanceof ApiError;
  const status = isAPI ? err.statusCode : 500;

  /**
   * 응답 페이로드 구성
   * - production: 내부 에러 메시지 노출 방지
   * - development/test: 실제 에러 메시지 그대로 출력
   */
  const payload = {
    code: isAPI ? err.code : 'INTERNAL_ERROR',
    message:
      ENV === 'production'
        ? isAPI
          ? err.message
          : '서버 내부 오류가 발생했습니다.'
        : (err as Error).message || 'Internal server error',
    details: ENV !== 'production' && isAPI ? err.details : undefined, // 개발 환경에서만 상세 정보 포함
  };

  /**
   * 환경별 로깅 정책
   *
   * - development: 모든 에러 스택 로그 출력
   * - production: 시스템 예외만 로깅 (비즈니스 예외 제외)
   * - test: 콘솔 로그 비활성화
   */
  if (ENV === 'development') {
    if (err instanceof Error) {
      console.error(`\n[${status}] ${err.stack}`);
    } else {
      console.error(`\n[${status}] ${String(err)}`);
    }
  } else if (ENV === 'production') {
    // 운영 환경에서는 시스템 오류만 로깅
    if (!isAPI || !(err as { isOperational?: boolean }).isOperational) {
      if (err instanceof Error) {
        console.error('[Unexpected Error]', err);
      } else {
        console.error('[Unexpected Error]', String(err));
      }
    }
  } else if (ENV === 'test') {
    // fallback, 테스트 환경에서는 로그 출력 생략
  }

  return res.status(status).json(payload);
};
