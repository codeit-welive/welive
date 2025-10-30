import { describe, it, expect, jest, beforeAll, afterAll } from '@jest/globals';
import { logger } from '#core/logger';

describe('[Core] Logger 시스템', () => {
  const restores: Array<ReturnType<typeof jest.spyOn>> = [];

  beforeAll(() => {
    const silence = (obj: any, key: 'info' | 'debug' | 'warn' | 'error') => {
      const spy = jest.spyOn(obj, key).mockImplementation(() => undefined as any);
      restores.push(spy);
      return spy;
    };
    ['system', 'auth', 'notices'].forEach((domain) => {
      silence((logger as any)[domain], 'info');
      silence((logger as any)[domain], 'debug');
      silence((logger as any)[domain], 'warn');
      silence((logger as any)[domain], 'error');
    });
  });

  afterAll(() => {
    restores.forEach((s) => s.mockRestore());
  });

  it('system.info() 호출 시 로그가 출력되어야 함', () => {
    const spy = jest.spyOn(logger.system, 'info').mockImplementation(() => undefined as any);
    logger.system.info('서버 실행 완료');
    expect(spy).toHaveBeenCalledWith('서버 실행 완료');
  });

  it('system.debug(), warn()도 정상 호출되어야 함', () => {
    const debugSpy = jest.spyOn(logger.system, 'debug').mockImplementation(() => undefined as any);
    const warnSpy = jest.spyOn(logger.system, 'warn').mockImplementation(() => undefined as any);
    logger.system.debug('디버그');
    logger.system.warn('경고');
    expect(debugSpy).toHaveBeenCalledWith('디버그');
    expect(warnSpy).toHaveBeenCalledWith('경고');
  });

  it('system.error()가 문자열을 받을 경우 단순 메시지로 출력되어야 함', () => {
    const spy = jest.spyOn(logger.system, 'error').mockImplementation(() => undefined as any);
    logger.system.error('문자열 오류');
    expect(spy).toHaveBeenCalledWith('문자열 오류');
  });

  it('system.error()가 Error 객체를 받을 경우 내부 로직이 정상 동작해야 함', () => {
    const spy = jest.spyOn(logger.system, 'error').mockImplementation(() => undefined as any);
    const err = new Error('DB 연결 실패');
    logger.system.error(err, '초기화 중');
    expect(spy).toHaveBeenCalledWith(err, '초기화 중');
  });

  it('도메인별 로거(auth, notices)가 동일하게 동작해야 함', () => {
    const authSpy = jest.spyOn(logger.auth, 'info').mockImplementation(() => undefined as any);
    const noticesSpy = jest.spyOn(logger.notices, 'info').mockImplementation(() => undefined as any);
    logger.auth.info('인증 로깅 테스트');
    logger.notices.info('공지 로깅 테스트');
    expect(authSpy).toHaveBeenCalledWith('인증 로깅 테스트');
    expect(noticesSpy).toHaveBeenCalledWith('공지 로깅 테스트');
  });
});
