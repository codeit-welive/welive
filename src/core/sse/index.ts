/**
 * @file core/sse/index.ts
 * @description 알림 SSE 엔드포인트 및 클라이언트 관리
 */

import { Router } from 'express';
import { SseClient } from './sseClient';
import type { SseEvent, NotificationPayload } from './types';
import authMiddleware from '#core/middlewares/authMiddleware';
import prisma from '#core/prisma';
import env from '#core/env';

const router = Router();

/**
 * 연결된 SSE 클라이언트 목록
 * - key: userId
 * - value: 해당 유저의 모든 SSE 연결(Set)
 */
const clients = new Map<string, Set<SseClient>>();

/**
 * 클라이언트 추가
 */
const addClient = (userId: string, client: SseClient): void => {
  const set = clients.get(userId);
  if (set) {
    set.add(client);
  } else {
    clients.set(userId, new Set([client]));
  }
};

/**
 * 클라이언트 제거
 */
const removeClient = (userId: string, client: SseClient): void => {
  const set = clients.get(userId);
  if (!set) return;

  set.delete(client);
  if (set.size === 0) {
    clients.delete(userId);
  }
};

/**
 * @route GET /api/notifications/sse
 * @desc 로그인한 사용자의 읽지 않은 알림을 실시간 전송
 * @access Private (JWT 쿠키 인증)
 */
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  const origin = env.CORS_ORIGINS && env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS[0] : env.FRONT_URL;

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
  });
  res.flushHeaders();

  const client = new SseClient(userId, res);
  addClient(userId, client);

  // 초기 전송: 현재 읽지 않은 알림 목록
  const unread = await prisma.notification.findMany({
    where: { recipientId: userId, isChecked: false },
    orderBy: { notifiedAt: 'desc' },
  });

  console.log('[SSE] unread count:', unread.length);
  console.log('[SSE] userId:', userId);

  if (unread.length > 0) {
    const event: SseEvent = {
      event: 'alarm',
      data: unread.map(
        (n): NotificationPayload => ({
          notificationId: n.id,
          content: n.content,
          notificationType: n.notificationType,
          notifiedAt: n.notifiedAt.toISOString(),
          isChecked: n.isChecked,
          complaintId: n.complaintId,
          noticeId: n.noticeId,
          pollId: n.pollId,
        })
      ),
    };
    client.send(event);
  }

  req.on('close', () => {
    client.close();
    removeClient(userId, client);
  });
});

/**
 * 단일 유저에게 알림 전송
 */
export const sendToUser = (userId: string, payload: NotificationPayload): void => {
  const set = clients.get(userId);
  if (!set || set.size === 0) return;

  const event: SseEvent = { event: 'alarm', data: [payload] };
  for (const client of set) {
    client.send(event);
  }
};

/**
 * 전체 브로드캐스트
 */
export const broadcast = (payload: NotificationPayload): void => {
  const event: SseEvent = { event: 'alarm', data: [payload] };
  for (const set of clients.values()) {
    for (const client of set) {
      client.send(event);
    }
  }
};

/**
 * keep-alive
 * - jitter 도입, 30+-5초 범위에서 전송
 */
const baseInterval = 30_000;

// prettier-ignore
if (env.NODE_ENV !== 'test') {
  setInterval(() => {
    for (const set of clients.values()) {
      for (const client of set) {
        client.ping();
      }
    }
  }, baseInterval + (Math.random() * 10_000 - 5_000));
}

export default router;
