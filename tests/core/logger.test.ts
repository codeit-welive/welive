import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { logger } from '#core/logger';

describe('[Core] Logger 시스템', () => {
  beforeEach(() => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  it('system.info() 호출 시 로그가 출력되어야 함', () => {
    const spy = jest.spyOn(logger, 'info');
    logger.system.info('서버 실행 완료');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[system] 서버 실행 완료'));
  });

  it('system.debug(), warn()도 정상 호출되어야 함', () => {
    const debugSpy = jest.spyOn(logger, 'debug');
    const warnSpy = jest.spyOn(logger, 'warn');

    logger.system.debug('디버그');
    logger.system.warn('경고');

    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('[system] 디버그'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[system] 경고'));
  });

  it('system.error()가 문자열을 받을 경우 단순 메시지로 출력되어야 함', () => {
    const spy = jest.spyOn(logger, 'error');
    logger.system.error('문자열 오류');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[system] 문자열 오류'));
  });

  it('system.error()가 Error 객체를 받을 경우 내부 로직이 정상 동작해야 함', () => {
    const spy = jest.spyOn(logger.system, 'error');
    const err = new Error('DB 연결 실패');
    logger.system.error(err, '초기화 중');
    expect(spy).toHaveBeenCalledWith(expect.any(Error), '초기화 중');
  });

  it('도메인별 로거(auth, notices)가 동일하게 동작해야 함', () => {
    const spy = jest.spyOn(logger, 'info');
    logger.auth.info('인증 로깅 테스트');
    logger.notices.info('공지 로깅 테스트');

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[auth] 인증 로깅 테스트'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[notices] 공지 로깅 테스트'));
  });
});
