import { describe, it, expect, jest, beforeEach, afterAll } from '@jest/globals';
import * as SSE from '#sse/index';
import { sendSseNotification, sendSseToUser } from '#sse/sseEmitter';
import { logger } from '#core/logger';
import { NotificationType } from '@prisma/client';

describe('[SSE Emitter] 브리지 기능 검증', () => {
  beforeEach(() => {
    jest.spyOn(logger.sse, 'warn').mockImplementation(() => {});
    jest.spyOn(logger.sse, 'debug').mockImplementation(() => {});
  });

  it('sendSseNotification()이 broadcast 호출 후 debug 로그를 남겨야 함', () => {
    const spy = jest.spyOn(logger.sse, 'debug');
    const payload = {
      notificationId: 'n4',
      content: '브로드캐스트 테스트',
      notificationType: NotificationType.POLL_REG,
      notifiedAt: new Date().toISOString(),
      isChecked: false,
    };
    sendSseNotification(payload);
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/broadcast 전송 성공/));
  });

  it('sendSseToUser()이 정상 동작 시 debug 로그를 남겨야 함', () => {
    const spy = jest.spyOn(logger.sse, 'debug');
    const payload = {
      notificationId: 'n5',
      content: '개별 알림',
      notificationType: NotificationType.NOTICE_REG,
      notifiedAt: new Date().toISOString(),
      isChecked: false,
    };
    sendSseToUser('user1', payload);
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/개별 전송 성공/));
  });

  it('SSE 라우터 미초기화 상태에서 전송 시 경고 로그 출력', () => {
    const spy = jest.spyOn(logger.sse, 'warn');
    (SSE as any).broadcast = undefined;

    const payload = {
      notificationId: 'n6',
      content: '초기화 오류',
      notificationType: NotificationType.COMPLAINT_RESOLVED,
      notifiedAt: new Date().toISOString(),
      isChecked: false,
    };

    sendSseNotification(payload);
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/SSE 라우터가 초기화되지 않아/));
  });

  it('sendSseNotification() 실패 시 warn 로그를 남겨야 함', () => {
    const spy = jest.spyOn(logger.sse, 'warn');
    (SSE as any).broadcast = () => {
      throw new Error('mock fail');
    };

    const payload = {
      notificationId: 'n7',
      content: '에러 테스트',
      notificationType: NotificationType.POLL_REG,
      notifiedAt: new Date().toISOString(),
      isChecked: false,
    };
    sendSseNotification(payload);
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/broadcast 실패/));
  });

  afterAll(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
  });
});
