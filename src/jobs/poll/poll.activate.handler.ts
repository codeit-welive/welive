/**
 * @file jobs/poll/poll.activate.handler.ts
 * @description Poll 활성화 처리 로직
 *
 * - startDate <= now() 인 Poll을 IN_PROGRESS 상태로 변경
 * - 관련 Notification 생성 및 SSE 전송
 */

import pLimit from 'p-limit';
import prisma from '#core/prisma';
import { logger } from '#core/logger';
import { sendSseNotification } from '#sse/sseEmitter';
import type { NotificationPayload } from '#sse/types';
import { isPast, isWithinInterval, getDelayMs } from './poll.time.utils';

const limit = pLimit(5);

/**
 * 개별 Poll 활성화 처리
 * @param pollId - 활성화 대상 Poll ID
 * @param userId - Poll 작성자 ID
 */
export const activatePoll = async (pollId: string, userId: string): Promise<void> => {
  try {
    // 상태 변경
    const updated = await prisma.poll.update({
      where: { id: pollId },
      data: { status: 'IN_PROGRESS' },
    });

    // Notification 생성
    const notification = await prisma.notification.create({
      data: {
        content: '새로운 투표가 시작되었습니다.',
        notificationType: 'POLL_REG',
        pollId: updated.id,
        recipientId: userId,
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

    logger.polls.debug(`투표 ${pollId} 활성화 완료`);
  } catch (error) {
    logger.polls.error(error as Error, `투표 ${pollId} 활성화 중 오류 발생`);
  }
};

/**
 * 활성화 가능한 Poll 전체 처리
 */
export const activateReadyPolls = async (): Promise<void> => {
  try {
    const polls = await prisma.poll.findMany({
      where: { status: 'PENDING' },
      select: { id: true, userId: true, startDate: true },
    });

    if (polls.length === 0) {
      logger.polls.debug('활성화할 투표 없음');
      return;
    }

    const tasks = polls.map((poll) =>
      limit(async () => {
        if (isPast(poll.startDate)) {
          await activatePoll(poll.id, poll.userId);
        } else if (isWithinInterval(poll.startDate)) {
          const delay = getDelayMs(poll.startDate);
          setTimeout(async () => {
            try {
              await activatePoll(poll.id, poll.userId);
            } catch (err) {
              logger.polls.error(err as Error, `예약된 투표 ${poll.id} 활성화 실패`);
            }
          }, delay);
        }
      })
    );

    await Promise.all(tasks);

    logger.polls.debug(`투표 활성화 처리 완료 (${polls.length}건 검사)`);
  } catch (error) {
    logger.polls.error(error as Error, '투표 활성화 처리 중 오류 발생');
  }
};
