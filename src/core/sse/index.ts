import { Router } from 'express';
import { SseClient } from './sseClient';
import type { SseEvent, NotificationPayload } from './types';

const router = Router();
const clients = new Map<string, SseClient>();

/**
 * SSE 연결 핸들러
 * @router GET /sse/events?userId=${uuid}
 */
router.get('/events', (req, res) => {
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).end('Missing userId');
    return;
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();

  const client = new SseClient(userId, res);
  clients.set(userId, client);

  req.on('close', () => {
    client.close();
    clients.delete(userId);
  });
});

/**
 * 단일 유저에게 알림 전송
 */
export const sendToUser = (userId: string, payload: NotificationPayload): void => {
  const client = clients.get(userId);
  if (client) {
    const event: SseEvent = { event: 'notification', data: payload };
    client.send(event);
  }
};

/**
 * 전체 브로드캐스트
 */
export const broadcast = (payload: NotificationPayload): void => {
  const event: SseEvent = { event: 'notification', data: payload };
  for (const client of clients.values()) {
    client.send(event);
  }
};

/**
 * keep-alive
 * - jitter 도입, 30+-5초 범위에서 전송
 */
const baseInterval = 30_000;

// prettier-ignore
setInterval(() => {
  for (const client of clients.values()) client.ping();
}, baseInterval + (Math.random() * 10_000 - 5_000));

export default router;
