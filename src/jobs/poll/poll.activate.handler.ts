/**
 * @file jobs/poll/poll.activate.handler.ts
 * @description Poll 활성화 처리 로직
 *
 * - startDate <= now() 인 Poll을 IN_PROGRESS 상태로 변경
 * - 관련 Notification 생성 및 SSE 전송
 */

import prisma from '#core/prisma';
import { logger } from '#core/logger';
import { sendSseNotification } from '#sse/sseEmitter';
import type { NotificationPayload } from '#sse/types';

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
    const readyPolls = await prisma.poll.findMany({
      where: {
        startDate: { lte: new Date() },
        status: 'PENDING',
      },
      select: { id: true, userId: true },
    });

    if (readyPolls.length === 0) {
      logger.polls.debug('활성화할 투표 없음');
      return;
    }

    await Promise.all(readyPolls.map(({ id, userId }) => activatePoll(id, userId)));

    logger.polls.debug(`활성화된 투표 ${readyPolls.length}건 일괄 처리 완료`);
  } catch (error) {
    logger.polls.error(error as Error, '투표 활성화 일괄 처리 중 오류 발생');
  }
};
