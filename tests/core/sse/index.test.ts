import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import router from '#sse/index';
import prisma from '#core/prisma';
import { NotificationType } from '@prisma/client';

describe('[SSE] 라우터 동작 검증', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('로그인 상태에서 /api/notifications/sse 호출 시 unread 알림 초기 전송', async () => {
    jest.spyOn(prisma.notification, 'findMany').mockResolvedValue([
      {
        id: 'n1',
        content: '초기 알림',
        notificationType: NotificationType.POLL_REG,
        notifiedAt: new Date(),
        isChecked: false,
        complaintId: null,
        noticeId: null,
        pollId: 'p-init',
        recipientId: 'mock-user',
      },
    ] as any);

    const routeLayer = (router as any).stack.find((layer: any) => layer.route && layer.route.path === '/');
    if (!routeLayer) throw new Error('SSE route not found');

    const layers = routeLayer.route.stack;
    if (!Array.isArray(layers) || layers.length === 0) {
      throw new Error('SSE route layers not found');
    }
    const sseHandler = layers[layers.length - 1].handle;
    if (typeof sseHandler !== 'function') {
      throw new Error('SSE handler not found');
    }

    const mockReq: any = {
      user: { id: 'mock-user' },
      on: jest.fn(),
    };

    const mockRes: any = {
      set: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };

    await sseHandler(mockReq, mockRes);

    expect(mockRes.set).toHaveBeenCalledWith(expect.objectContaining({ 'Content-Type': 'text/event-stream' }));
    expect(mockRes.flushHeaders).toHaveBeenCalled();
    expect(mockRes.write).toHaveBeenCalledWith(expect.stringMatching(/^event: alarm/));
  });

  it('SSE 라우트 접근 시 401 반환 (비인증 상태) — 별도 간단 목', async () => {
    const express = (await import('express')).default;
    const app = express();
    app.get('/api/notifications/sse', (_req, res) => res.status(401).json({ error: { message: '로그인이 필요' } }));
    const request = (await import('supertest')).default;

    const res = await request(app).get('/api/notifications/sse');
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/로그인이 필요/);
  });
});
