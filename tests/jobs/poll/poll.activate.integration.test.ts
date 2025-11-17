/**
 * @file tests/jobs/poll/poll.activate.integration.test.ts
 * @description Poll 활성화 통합 테스트 (Prisma + 실제 예약 로직)
 */

import { describe, it, beforeAll, afterAll, beforeEach, expect, jest } from '@jest/globals';
import prisma from '#core/prisma';
import { activateReadyPolls } from '#jobs/poll/poll.activate.handler';
import { sendSseNotification } from '#sse/sseEmitter';
import { PollStatus, BoardType, UserRole } from '@prisma/client';
process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'true';

jest.mock('#sse/sseEmitter', () => ({
  sendSseNotification: jest.fn(),
}));

jest.mock('#core/logger', () => ({
  logger: { polls: { debug: jest.fn(), error: jest.fn() } },
}));

const TEST_APT = 'PollActivateAPT';
const TEST_USER = 'poll_user@test.com';

const cleanupTestScope = async () => {
  await prisma.$transaction([
    prisma.event.deleteMany({
      where: { apartment: { apartmentName: TEST_APT } },
    }),
    prisma.notification.deleteMany({
      where: { recipient: { email: TEST_USER } },
    }),
    prisma.comment.deleteMany({
      where: { board: { apartment: { apartmentName: TEST_APT } } },
    }),
    prisma.pollVote.deleteMany({
      where: { poll: { board: { apartment: { apartmentName: TEST_APT } } } },
    }),
    prisma.pollOption.deleteMany({
      where: { poll: { board: { apartment: { apartmentName: TEST_APT } } } },
    }),
    prisma.poll.deleteMany({
      where: { board: { apartment: { apartmentName: TEST_APT } } },
    }),
    prisma.board.deleteMany({
      where: { apartment: { apartmentName: TEST_APT }, type: BoardType.POLL },
    }),
    prisma.apartment.deleteMany({
      where: { apartmentName: TEST_APT },
    }),
    prisma.user.deleteMany({
      where: { email: TEST_USER },
    }),
  ]);
};

beforeAll(async () => {
  await cleanupTestScope();
});

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useFakeTimers({ legacyFakeTimers: true });
  await cleanupTestScope();
});

afterEach(async () => {
  jest.runOnlyPendingTimers();
  await new Promise(setImmediate);
  jest.useRealTimers();
});

afterAll(async () => {
  process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'false';
  await prisma.$disconnect();
});

describe('[PollActivateHandler] Integration', () => {
  const createBaseEnv = async () => {
    const apt = await prisma.apartment.create({
      data: {
        apartmentName: TEST_APT,
        apartmentAddress: 'Seoul',
        startComplexNumber: '1',
        endComplexNumber: '10',
        startDongNumber: '101',
        endDongNumber: '110',
        startFloorNumber: '1',
        endFloorNumber: '15',
        startHoNumber: '1',
        endHoNumber: '10',
      },
    });

    const user = await prisma.user.create({
      data: {
        username: 'poll_user',
        password: 'pw',
        contact: '01000000061',
        name: '테스트유저',
        email: TEST_USER,
        role: UserRole.USER,
        avatar: 'https://test.com/avatar.png',
      },
    });

    const board = await prisma.board.create({
      data: {
        type: BoardType.POLL,
        apartment: { connect: { id: apt.id } },
      },
    });

    return { user, board, apt };
  };

  it('startDate가 이미 지난 Poll은 즉시 IN_PROGRESS로 변경되어야 함', async () => {
    const { user, board } = await createBaseEnv();

    const poll = await prisma.poll.create({
      data: {
        title: '즉시 활성화 테스트',
        content: '시작 시간이 이미 지난 투표',
        startDate: new Date(Date.now() - 60_000),
        endDate: new Date(Date.now() + 5 * 60_000),
        status: PollStatus.PENDING,
        user: { connect: { id: user.id } },
        board: { connect: { id: board.id } },
      },
    });

    await activateReadyPolls();
    const updated = await prisma.poll.findUnique({ where: { id: poll.id } });

    expect(updated?.status).toBe(PollStatus.IN_PROGRESS);
    expect(sendSseNotification).toHaveBeenCalledTimes(1);
  });

  it('startDate가 미래인 Poll은 변경되지 않아야 함', async () => {
    const { user, board } = await createBaseEnv();

    const poll = await prisma.poll.create({
      data: {
        title: '활성화 안 되는 테스트',
        content: '시작 전인 투표',
        startDate: new Date(Date.now() + 10 * 60_000),
        endDate: new Date(Date.now() + 20 * 60_000),
        status: PollStatus.PENDING,
        user: { connect: { id: user.id } },
        board: { connect: { id: board.id } },
      },
    });

    await activateReadyPolls();
    const unchanged = await prisma.poll.findUnique({ where: { id: poll.id } });

    expect(unchanged?.status).toBe(PollStatus.PENDING);
    expect(sendSseNotification).not.toHaveBeenCalled();
  });

  it('startDate가 3초 내라면 setTimeout 예약이 생성되어야 함', async () => {
    const { user, board } = await createBaseEnv();

    await prisma.poll.create({
      data: {
        title: '직후 예약 투표',
        content: '3초 내 시작되는 투표',
        startDate: new Date(Date.now() + 3000),
        endDate: new Date(Date.now() + 60_000),
        status: PollStatus.PENDING,
        user: { connect: { id: user.id } },
        board: { connect: { id: board.id } },
      },
    });

    let capturedDelay: number | undefined;

    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(((
      fn: (...args: any[]) => void,
      delay?: number,
      ...args: any[]
    ) => {
      capturedDelay = delay as number;

      // 타이머 즉시 실행
      fn(...args);

      // fake timer id 반환
      return 0 as unknown as NodeJS.Timeout;
    }) as unknown as typeof setTimeout);

    await activateReadyPolls();

    expect(setTimeoutSpy).toHaveBeenCalled();
    expect(typeof capturedDelay).toBe('number');
    expect(capturedDelay!).toBeGreaterThanOrEqual(2500);
    expect(capturedDelay!).toBeLessThanOrEqual(3500);

    const updated = await prisma.poll.findFirst({ where: { title: '직후 예약 투표' } });
    expect(updated?.status).toBe(PollStatus.IN_PROGRESS);

    setTimeoutSpy.mockRestore();
  });
});
