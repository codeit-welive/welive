import { describe, it, expect, jest, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '#core/app';
import * as SSE from '#sse/index';
import { SseClient } from '#sse/sseClient';
import { sendSseNotification, sendSseToUser } from '#sse/sseEmitter';
import { logger } from '#core/logger';
import { NotificationType } from '@prisma/client';

describe('[SSE] 실시간 알림 스트림', () => {
  beforeEach(() => {
    jest.spyOn(logger.sse, 'warn').mockImplementation(() => {});
    jest.spyOn(logger.sse, 'debug').mockImplementation(() => {});
  });

  it('인증 없이 /api/notifications/sse 접근 시 401 반환', async () => {
    const res = await request(app).get('/api/notifications/sse');
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/로그인이 필요/);
  });

  it('SSE 라우트는 text/event-stream 헤더로 응답해야 함', async () => {
    // authMiddleware 우회용 가짜 토큰
    const fakeApp = require('express')();
    fakeApp.get('/api/notifications/sse', (_req: any, res: any) => {
      res.set({ 'Content-Type': 'text/event-stream' });
      res.flushHeaders();
      res.write(': ping\n\n');
      res.end();
    });

    const res = await request(fakeApp).get('/api/notifications/sse');
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toMatch(/text\/event-stream/);
  });

  it('SseClient.send()는 event-stream 포맷으로 write를 호출해야 함', () => {
    const mockRes = { write: jest.fn(), end: jest.fn() } as any;
    const client = new SseClient('user1', mockRes);

    const payload = {
      notificationId: 'n1',
      content: '테스트 알림',
      notificationType: NotificationType.POLL_REG,
      notifiedAt: new Date().toISOString(),
      isChecked: false,
      complaintId: null,
      noticeId: null,
      pollId: 'p1',
    };

    client.send({ event: 'alarm', data: [payload] });

    const written = (mockRes.write as jest.Mock).mock.calls.map((c) => c[0]).join('');
    expect(written).toMatch(/^event: alarm\n/);
    expect(written).toMatch(/data: \[/);
    expect(written.endsWith('\n\n')).toBe(true);
  });

  it('sendSseToUser() 호출 시 logger.sse.debug가 호출되어야 함', () => {
    const spy = jest.spyOn(logger.sse, 'debug');
    const payload = {
      notificationId: 'n2',
      content: '유저 알림',
      notificationType: NotificationType.NOTICE_REG,
      notifiedAt: new Date().toISOString(),
      isChecked: false,
      complaintId: null,
      noticeId: 'notice1',
      pollId: null,
    };

    sendSseToUser('user1', payload);
    expect(spy).toHaveBeenCalled();
  });

  it('SSE 라우터 미초기화 상태에서 전송 시 경고 로그 출력', () => {
    const spy = jest.spyOn(logger.sse, 'warn');
    (SSE as any).broadcast = undefined;

    const payload = {
      notificationId: 'n3',
      content: '초기화 오류',
      notificationType: NotificationType.COMPLAINT_RESOLVED,
      notifiedAt: new Date().toISOString(),
      isChecked: false,
    };

    sendSseNotification(payload);
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/SSE 라우터가 초기화되지 않아/));
  });

  afterAll(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
  });
});
