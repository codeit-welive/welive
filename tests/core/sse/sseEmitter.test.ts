import { describe, it, expect, jest, beforeEach, afterAll } from '@jest/globals';
import * as SSE from '#sse/index';
import { sendSseNotification, sendSseToUser } from '#sse/sseEmitter';
import { logger } from '#core/logger';
import { NotificationType } from '@prisma/client';

process.env.TEST_ALLOW_ACCESS_LOG = 'true';
process.env.__ALLOW_SSE_TEST__ = 'true';

jest.mock('#core/logger', () => {
  const mock = {
    sse: {
      debug: jest.fn(),
      warn: jest.fn(),
    },
    system: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    http: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  };
  return { logger: mock };
});

describe('[SSE Emitter] 브리지 기능 검증', () => {
  beforeEach(() => {
    jest.restoreAllMocks();

    (SSE as any).broadcast = jest.fn();
    (SSE as any).sendToUser = jest.fn();
  });

  it('sendSseNotification()이 broadcast 호출 후 debug 로그를 남겨야 함', () => {
    const payload = {
      notificationId: 'n4',
      content: '브로드캐스트 테스트',
      notificationType: NotificationType.POLL_REG,
      notifiedAt: new Date().toISOString(),
      isChecked: false,
    };

    sendSseNotification(payload);

    expect(SSE.broadcast).toHaveBeenCalledWith(payload);
    expect(logger.sse.debug).toHaveBeenCalledWith(expect.stringMatching(/broadcast 전송 성공/));
  });

  it('sendSseToUser()이 정상 동작 시 debug 로그를 남겨야 함', () => {
    const payload = {
      notificationId: 'n5',
      content: '개별 알림',
      notificationType: NotificationType.NOTICE_REG,
      notifiedAt: new Date().toISOString(),
      isChecked: false,
    };

    sendSseToUser('user1', payload);

    expect(SSE.sendToUser).toHaveBeenCalledWith('user1', payload);
    expect(logger.sse.debug).toHaveBeenCalledWith(expect.stringMatching(/개별 전송 성공/));
  });

  it('SSE 라우터 미초기화 상태에서 전송 시 경고 로그 출력', () => {
    (SSE as any).broadcast = undefined;

    const payload = {
      notificationId: 'n6',
      content: '초기화 오류',
      notificationType: NotificationType.COMPLAINT_RESOLVED,
      notifiedAt: new Date().toISOString(),
      isChecked: false,
    };

    sendSseNotification(payload);

    expect(logger.sse.warn).toHaveBeenCalledWith(expect.stringMatching(/초기화되지/));
  });

  afterAll(() => {
    delete process.env.TEST_ALLOW_ACCESS_LOG;
    delete process.env.__ALLOW_SSE_TEST__;
  });
});
