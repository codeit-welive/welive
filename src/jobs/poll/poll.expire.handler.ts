/**
 * @file jobs/poll/poll.expire.handler.ts
 * @description Poll 만료 처리 로직
 *
 * - endDate <= now() 인 Poll을 CLOSED 상태로 변경
 * - 관련 Notification을 생성
 */

import { createLimit } from '#core/utils/Limiter';
import prisma from '#core/prisma';
import { logger } from '#core/logger';
import { sendSseNotification } from '#sse/sseEmitter';
import type { NotificationPayload } from '#core/sse/types';
import { isPast, isWithinInterval, getDelayMs } from './poll.time.utils';

const limit = createLimit(5);

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
 * 만료 가능한 Poll 전체 처리
 */
export const closeExpiredPolls = async (): Promise<void> => {
  try {
    const polls = await prisma.poll.findMany({
      where: { status: { not: 'CLOSED' } },
      select: { id: true, endDate: true },
    });

    if (polls.length === 0) {
      logger.polls.debug('만료 대상 투표 없음');
      return;
    }

    const tasks = polls.map((poll) => {
      limit(async () => {
        if (isPast(poll.endDate)) {
          await closePoll(poll.id);
        } else if (isWithinInterval(poll.endDate)) {
          const delay = getDelayMs(poll.endDate);
          setTimeout(async () => {
            try {
              await closePoll(poll.id);
            } catch (err) {
              logger.polls.error(err as Error, `예약된 투표 ${poll.id} 만료 실패`);
            }
          }, delay);
        }
      });
    });

    await Promise.all(tasks);
    logger.polls.debug(`투표 만료 처리 완료 (${polls.length}건 검사)`);
  } catch (error) {
    logger.polls.error(error as Error, '투표 만료 처리 중 오류 발생');
  }
};
