/**
 * @file #core/logger.ts
 * @description Pino 기반의 통합 로거 설정 파일
 *
 * @usage
 * 각 도메인 및 System을 지원합니다.
 * 개발환경(dev)에서는 pino-pretty를 사용해 컬러/가독성 중심으로 출력,
 * 운영환경(prod)에서는 JSON 기반으로 로그에 최적화
 * - 각 도메인은 debug / info / warn / error 로그 레벨을 지원합니다.
 *
 * @example
 *   logger.complaint('민원 등록 성공');
 *   logger.system.debug('SSE 초기화 중');
 */

import pino from 'pino';
import env from '#core/env';

/**
 * 환경 감지
 */
const isDev = env.NODE_ENV !== 'production';

/**
 * Pino 기본 인스턴스 생성
 * - level: 로그 최소 레벨 설정 (debug: 모든 로그 / info: 요약 중심)
 * - base: pid, hostname 등의 메타 데이터 제거 후 간결하게 출력
 * - timestamp:
 *    • 모든 환경에서 UTC+9(Asia/Seoul) 기준으로 출력
 *    • 개발 환경(dev/test): HH:MM:SS 형식 (가독성 중심)
 *    • 운영 환경(prod): YYYY-MM-DD HH:MM:SS 형식 (기록 중심)
 * - transport:
 *    • 개발 환경(dev/test): pino-pretty 활성화 (컬러, 단일 라인)
 *    • 운영 환경(prod): JSON 로그로 출력 (수집/분석용)
 */
const baseLogger = pino({
  level: isDev ? 'debug' : 'info',
  base: undefined,
  timestamp: () => {
    const now = new Date();
    // UTC+9 (Asia/Seoul) 변환
    const local = new Date(now.getTime() + 9 * 60 * 60 * 1000);

    if (isDev) {
      // 개발환경: HH:MM:SS
      const hh = String(local.getUTCHours()).padStart(2, '0');
      const mm = String(local.getUTCMinutes()).padStart(2, '0');
      const ss = String(local.getUTCSeconds()).padStart(2, '0');
      return `,"time":"${hh}:${mm}:${ss}"`;
    } else {
      // 운영환경: YYYY-MM-DD HH:MM:SS
      const yyyy = local.getUTCFullYear();
      const MM = String(local.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(local.getUTCDate()).padStart(2, '0');
      const hh = String(local.getUTCHours()).padStart(2, '0');
      const mm = String(local.getUTCMinutes()).padStart(2, '0');
      const ss = String(local.getUTCSeconds()).padStart(2, '0');
      return `,"time":"${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}"`;
    }
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: false,
          ignore: 'pid,hostname',
          singleLine: true,
        },
      }
    : undefined,
});

/**
 * 도메인 로거 생성 유틸
 *
 * @description
 * 각 도메인별로 동일한 로그 레벨 함수를 생성합니다.
 * - Error 객체일 경우 자동으로 stack trace 포함해 출력
 */
const createDomainLogger = (domain: string) => ({
  /**
   * @method debug
   * @description 개발 단계에서만 포함되는 세부 로그
   * 예: 내부 상태, API 요청/응답, 캐시 정보 등
   */
  debug: (msg: string): void => {
    baseLogger.debug(`[${domain}] ${msg}`);
  },

  /**
   * @method info
   * @description 정상 동작 로그
   * 예: 서버 시작, 요청 완료 등
   */
  info: (msg: string): void => {
    baseLogger.info(`[${domain}] ${msg}`);
  },

  /**
   * @method warn
   * @description 경고 로그 (비정상 상황이지만 동작은 유지되는 상태)
   * 예: rate limit 감지, 재시도, 느린 응답 등
   */
  warn: (msg: string): void => {
    baseLogger.warn(`[${domain}] ${msg}`);
  },

  /**
   * @method error
   * @description 실제 예외나 오류 로그
   * 예: API 호출 실패, 기능 중단, 예외 발생 등
   */
  error: (msg: string | Error, context?: string): void => {
    if (msg instanceof Error) {
      baseLogger.error(
        {
          name: msg.name,
          message: msg.message,
          stack: msg.stack,
          context,
        },
        `[${domain}] ${msg.message}`
      );
    } else {
      baseLogger.error(`[${domain}] ${msg}`);
    }
  },
});

/**
 * 도메인별 로거 정의
 *
 * @description
 * Object.assign을 통해 baseLogger를 확장하여 타입 안정성을 유지합니다.
 * - pino.logger 타입은 기본적으로 closed type
 */
export const logger = Object.assign(baseLogger, {
  // 각 도메인
  auth: createDomainLogger('auth'),
  comments: createDomainLogger('comments'),
  complaints: createDomainLogger('complaints'),
  events: createDomainLogger('events'),
  notices: createDomainLogger('notices'),
  notifications: createDomainLogger('notifications'),
  polls: createDomainLogger('polls'),
  residents: createDomainLogger('residents'),
  users: createDomainLogger('users'),

  // 전체 시스템 수준 로그
  sse: createDomainLogger('sse'),
  http: createDomainLogger('http'),
  system: createDomainLogger('system'),
});

/**
 * 사용 예시
 *
 * logger.(domain).debug('요청 파싱 성공')
 * logger.(domain).info('서버 실행 완료')
 * logger.(domain).warn('Rate Limit 감지')
 * logger.(domain).error(new Error('Gateway 연결 끊김'), '재연결 시도');
 * logger.(domain).error(new Error('라우팅 처리 실패'));
 *
 * logger.system.info('3개 서비스 초기화 완료');
 * logger.system.warn('일부 모듈 응답 지연');
 * logger.system.error(new Error('auth 모듈 응답 없음'), '오케스트레이터 예외 발생');
 */

export default logger;
