/**
 * @file jobs/poll/poll.activate.handler.ts
 * @description Poll 활성화 처리 로직
 *
 * - startDate <= now() 인 Poll을 IN_PROGRESS 상태로 변경
 * - 관련 Notification 생성 및 SSE 전송
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
 * @description Poll 시작 시 주민 + 관리자에게 종료 알림 전송
 */
export const sendPollStartNotifications = async (pollId: string) => {
  // Poll → Board → Apartment 정보 조회
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: {
      board: {
        select: {
          apartment: { select: { apartmentName: true } },
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
  let adminIds: string[] = [];
  try {
    const aptAdmin = await getAdminIdByApartmentName(apartmentName);
    const adminId = aptAdmin?.adminId ? String(aptAdmin.adminId) : null;
    adminIds = adminId ? [adminId] : [];
  } catch (e) {
    logger.polls.warn(`Poll ${pollId}: 관리자 조회 실패 — ${e instanceof Error ? e.message : String(e)}`);
  }

  // 중복 제거
  const targetIds = Array.from(new Set([...residentUserIds, ...adminIds]));

  if (targetIds.length === 0) {
    logger.polls.debug(`Poll ${pollId}: 알림 전송 대상 없음`);
    return;
  }

  const content = '새로운 투표가 시작되었습니다.';

  // 동시성 제한 비동기 병렬 전송 (best-effort)
  const tasks = targetIds.map((uid) =>
    limit(async () => {
      try {
        await createAndSendNotification(
          {
            content,
            notificationType: 'POLL_REG',
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

  // limit 내부에서 실패가 발생해도 전체 흐름을 깨지 않도록 allSettled
  await Promise.allSettled(tasks);

  logger.polls.debug(`Poll ${pollId}: 알림 전송 완료 (총 ${targetIds.length}명)`);
};

/**
 * 개별 Poll 활성화 처리
 * @param pollId - 활성화 대상 Poll ID
 * @param userId - Poll 작성자 ID
 */
export const activatePoll = async (pollId: string): Promise<void> => {
  try {
    // 상태 변경
    await prisma.poll.update({
      where: { id: pollId },
      data: { status: 'IN_PROGRESS' },
    });

    // 알림 함수 호출
    await sendPollStartNotifications(pollId);

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
      select: { id: true, startDate: true },
    });

    if (polls.length === 0) {
      logger.polls.debug('활성화할 투표 없음');
      return;
    }

    const tasks = polls.map((poll) =>
      limit(async () => {
        if (isPast(poll.startDate)) {
          await activatePoll(poll.id);
        } else if (isWithinInterval(poll.startDate)) {
          const delay = getDelayMs(poll.startDate);
          setTimeout(async () => {
            try {
              await activatePoll(poll.id);
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
