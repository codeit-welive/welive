import { Router } from 'express';
import { SseClient } from './sseClient';
import type { SseEvent, NotificationPayload } from './types';
import authMiddleware from '#core/middlewares/authMiddleware';
import prisma from '#core/prisma';

const router = Router();
const clients = new Map<string, SseClient>();

/**
 * @route GET /api/notifications/sse
 * @desc 로그인한 사용자의 읽지 않은 알림을 30초마다 실시간 전송
 * @access Private (JWT 쿠키 인증)
 */
router.get('/sse', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();

  const client = new SseClient(userId, res);
  clients.set(userId, client);

  // 초기 전송: 현재 읽지 않은 알림 목록
  const unread = await prisma.notification.findMany({
    where: { recipientId: userId, isChecked: false },
    orderBy: { notifiedAt: 'desc' },
  });

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
    clients.delete(userId);
  });
});

/**
 * 단일 유저에게 알림 전송
 */
export const sendToUser = (userId: string, payload: NotificationPayload): void => {
  const client = clients.get(userId);
  if (client) {
    const event: SseEvent = { event: 'alarm', data: [payload] };
    client.send(event);
  }
};

/**
 * 전체 브로드캐스트
 */
export const broadcast = (payload: NotificationPayload): void => {
  const event: SseEvent = { event: 'alarm', data: [payload] };
  for (const client of clients.values()) client.send(event);
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
