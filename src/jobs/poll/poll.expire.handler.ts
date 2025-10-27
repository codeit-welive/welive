/**
 * @file jobs/poll/poll.expire.handler.ts
 * @description Poll 만료 처리 로직
 *
 * - endDate <= now() 인 Poll을 CLOSED 상태로 변경
 * - 관련 Notification을 생성
 */

import prisma from '#core/prisma';
import { logger } from '#core/logger';
import { sendSseNotification } from '#sse/sseEmitter';
import type { NotificationPayload } from '#core/sse/types';

/**
 * 개별 Poll 만료 처리
 * @param pollId - 만료 처리 대상 Poll ID
 */
export const closePoll = async (pollId: string): Promise<void> => {
  try {
    // 상태 변경
    const updated = await prisma.poll.update({
      where: { id: pollId },
      data: { status: 'CLOSED' },
    });

    // Notification 생성
    const notification = await prisma.notification.create({
      data: {
        content: '투표가 종료되었습니다.',
        notificationType: 'POLL_CLOSED',
        pollId,
        recipientId: updated.userId,
      },
    });

    // SSE 전송
    const payload: NotificationPayload = {
      notificationId: notification.id,
      content: notification.content,
      notificationType: notification.notificationType,
      notifiedAt: notification.notifiedAt.toISOString(),
      isChecked: notification.isChecked,
      complaintId: notification.complaintId,
      noticeId: notification.noticeId,
      pollId: notification.pollId,
    };

    sendSseNotification(payload);

    logger.polls.debug(`투표 ${pollId} 만료 처리 완료`);
  } catch (error) {
    logger.polls.error(error as Error, `투표 ${pollId} 만료 처리 중 오류 발생`);
  }
};

/**
 * 이미 종료된 Poll 전체 처리 (서버 시작 시 1회 실행)
 */
export const closeExpiredPolls = async (): Promise<void> => {
  try {
    const expiredPolls = await prisma.poll.findMany({
      where: {
        endDate: { lte: new Date() },
        status: { not: 'CLOSED' },
      },
      select: { id: true },
    });

    if (expiredPolls.length === 0) {
      logger.polls.debug('만료된 투표 없음');
      return;
    }

    await Promise.all(expiredPolls.map(({ id }) => closePoll(id)));

    logger.polls.debug(`만료된 투표 ${expiredPolls.length}건 일괄 처리 완료`);
  } catch (error) {
    logger.polls.error(error as Error, '만료 투표 일괄 처리 중 오류 발생');
  }
};
