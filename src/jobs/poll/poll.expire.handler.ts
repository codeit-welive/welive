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
import { isPast, isWithinInterval, getDelayMs } from './poll.time.utils';

import { getUserIdsForApartment } from '#modules/auth/auth.service';
import { getAdminIdByApartmentName } from '#modules/auth/auth.repo';
import { createAndSendNotification } from '#core/utils/notificationHelper';

const limit = createLimit(5);

/**
 * @description Poll 종료 시 주민 + 관리자에게 종료 알림 전송
 */
export const sendPollCloseNotifications = async (pollId: string) => {
  // Poll → Board → Apartment 정보 조회
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: {
      board: {
        select: {
          apartment: {
            select: { apartmentName: true },
          },
        },
      },
    },
  });

  if (!poll?.board?.apartment?.apartmentName) {
    logger.polls.warn(`Poll ${pollId}: 알림 전송 실패 — apartmentName 조회 실패`);
    return;
  }

  const apartmentName = poll.board.apartment.apartmentName;

  // 주민 ID 조회 (service → repo 경유)
  const residentUserIds = (await getUserIdsForApartment(apartmentName)).map((u) => u.id);

  // 관리자 조회 (아파트의 adminId 기반)
  const aptAdmin = await getAdminIdByApartmentName(apartmentName);
  const adminId =
    (aptAdmin as unknown as { adminId?: string | null }).adminId ??
    (aptAdmin as unknown as { admin?: { id: string } | null }).admin?.id ??
    null;

  const adminIds = adminId ? [adminId] : [];

  // 중복 제거
  const targetIds = Array.from(new Set([...residentUserIds, ...adminIds]));

  if (targetIds.length === 0) {
    logger.polls.debug(`Poll ${pollId}: 종료 알림 대상 없음`);
    return;
  }

  const content = '투표가 종료되었습니다.';

  // 동시성 제한 비동기 병렬 전송 (best-effort)
  const tasks = targetIds.map((uid) =>
    limit(async () => {
      try {
        await createAndSendNotification(
          {
            content,
            notificationType: 'POLL_CLOSED',
            recipientId: uid,
            pollId,
          },
          uid
        );
      } catch {
        // 전송 실패 무시 (best-effort)
      }
    })
  );

  // 전체 흐름 깨지 않도록 allSettled
  await Promise.allSettled(tasks);

  await Promise.all(tasks);

  logger.polls.debug(`Poll ${pollId}: 종료 알림 전송 완료 (총 ${targetIds.length}명)`);
};

/**
 * 개별 Poll 만료 처리
 * @param pollId - 만료 처리 대상 Poll ID
 */
export const closePoll = async (pollId: string): Promise<void> => {
  try {
    // 상태 변경
    await prisma.poll.update({
      where: { id: pollId },
      data: { status: 'CLOSED' },
    });

    // 알림 함수 호출
    await sendPollCloseNotifications(pollId);

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

    const tasks = polls.map((poll) =>
      limit(async () => {
        if (isPast(poll.endDate)) {
          await closePoll(poll.id);
          return;
        }

        if (isWithinInterval(poll.endDate)) {
          const delay = getDelayMs(poll.endDate);
          setTimeout(async () => {
            try {
              await closePoll(poll.id);
            } catch (err) {
              logger.polls.error(err as Error, `예약된 투표 ${poll.id} 만료 실패`);
            }
          }, delay);
        }
      })
    );

    await Promise.all(tasks);
    logger.polls.debug(`투표 만료 처리 완료 (${polls.length}건 검사)`);
  } catch (error) {
    logger.polls.error(error as Error, '투표 만료 처리 중 오류 발생');
  }
};
