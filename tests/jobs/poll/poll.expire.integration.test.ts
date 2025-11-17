/**
 * @file tests/jobs/poll/poll.expire.integration.test.ts
 * @description Poll 만료 통합 테스트 (Prisma + 실제 예약 로직)
 */

import { describe, it, beforeAll, afterAll, beforeEach, expect, jest } from '@jest/globals';
import prisma from '#core/prisma';
import { closeExpiredPolls } from '#jobs/poll/poll.expire.handler';
import { sendSseNotification } from '#core/sse/sseEmitter';
import { PollStatus, BoardType, UserRole } from '@prisma/client';
process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'true';

jest.mock('#core/sse/sseEmitter', () => ({
  sendSseNotification: jest.fn(),
}));

jest.mock('#core/logger', () => ({
  logger: { polls: { debug: jest.fn(), error: jest.fn() } },
}));

const TEST_APARTMENT_NAME = 'ExpireTestAPT';
const TEST_USER_EMAIL = 'expire_user@test.com';
const TEST_USER_CONTACT = '01000000071';

const cleanupTestData = async () => {
  await prisma.$transaction([
    prisma.event.deleteMany({
      where: { apartment: { apartmentName: TEST_APARTMENT_NAME } },
    }),
    prisma.notification.deleteMany({
      where: { recipient: { email: TEST_USER_EMAIL } },
    }),
    prisma.comment.deleteMany({
      where: { board: { apartment: { apartmentName: TEST_APARTMENT_NAME } } },
    }),
    prisma.pollVote.deleteMany({
      where: { poll: { board: { apartment: { apartmentName: TEST_APARTMENT_NAME } } } },
    }),
    prisma.pollOption.deleteMany({
      where: { poll: { board: { apartment: { apartmentName: TEST_APARTMENT_NAME } } } },
    }),
    prisma.poll.deleteMany({
      where: { board: { apartment: { apartmentName: TEST_APARTMENT_NAME } } },
    }),
    prisma.board.deleteMany({
      where: {
        apartment: { apartmentName: TEST_APARTMENT_NAME },
        type: BoardType.POLL,
      },
    }),
    prisma.user.deleteMany({
      where: {
        OR: [{ email: TEST_USER_EMAIL }, { contact: TEST_USER_CONTACT }, { username: 'expire_user' }],
      },
    }),
    prisma.apartment.deleteMany({
      where: { apartmentName: TEST_APARTMENT_NAME },
    }),
  ]);
};

beforeAll(async () => {
  await cleanupTestData();
});

beforeEach(async () => {
  jest.clearAllMocks();
  jest.useFakeTimers({ legacyFakeTimers: true });
  jest.clearAllTimers();

  await cleanupTestData();
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

describe('[PollExpireHandler] Integration', () => {
  const createBaseEnv = async () => {
    const apt = await prisma.apartment.create({
      data: {
        apartmentName: TEST_APARTMENT_NAME,
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
        username: 'expire_user',
        password: 'pw',
        contact: TEST_USER_CONTACT,
        name: '만료유저',
        email: TEST_USER_EMAIL,
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

    return { user, board };
  };

  it('endDate가 지난 Poll은 즉시 CLOSED로 변경되어야 함', async () => {
    const { user, board } = await createBaseEnv();

    const poll = await prisma.poll.create({
      data: {
        title: '즉시 만료 테스트',
        content: '이미 종료된 투표입니다.',
        startDate: new Date(Date.now() - 600_000),
        endDate: new Date(Date.now() - 1_000),
        status: PollStatus.IN_PROGRESS,
        user: { connect: { id: user.id } },
        board: { connect: { id: board.id } },
      },
    });

    await closeExpiredPolls();

    const updated = await prisma.poll.findUnique({ where: { id: poll.id } });
    expect(updated?.status).toBe(PollStatus.CLOSED);
    expect(sendSseNotification).toHaveBeenCalledTimes(1);
  });

  it('endDate가 충분히 남은 Poll은 변경되지 않아야 함', async () => {
    const { user, board } = await createBaseEnv();

    const poll = await prisma.poll.create({
      data: {
        title: '유효한 투표 테스트',
        content: '아직 종료되지 않음',
        startDate: new Date(Date.now() - 1_000),
        endDate: new Date(Date.now() + 60 * 60 * 1_000),
        status: PollStatus.IN_PROGRESS,
        user: { connect: { id: user.id } },
        board: { connect: { id: board.id } },
      },
    });

    await closeExpiredPolls();

    const unchanged = await prisma.poll.findUnique({ where: { id: poll.id } });
    expect(unchanged?.status).toBe(PollStatus.IN_PROGRESS);
    expect(sendSseNotification).not.toHaveBeenCalled();
  });

  it('endDate가 3초 내 도래하면 setTimeout 예약이 생성되고, 만료 시 CLOSED로 변경되어야 함', async () => {
    const { user, board } = await createBaseEnv();

    await prisma.poll.create({
      data: {
        title: '단기 만료 투표',
        content: '3초 내 만료 예정',
        startDate: new Date(Date.now() - 10_000),
        endDate: new Date(Date.now() + 3000),
        status: PollStatus.IN_PROGRESS,
        user: { connect: { id: user.id } },
        board: { connect: { id: board.id } },
      },
    });

    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    await closeExpiredPolls();

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    const [fn, delay] = setTimeoutSpy.mock.calls[0] as [() => void, number];

    expect(typeof fn).toBe('function');
    expect(delay).toBeGreaterThanOrEqual(2500);
    expect(delay).toBeLessThanOrEqual(3500);

    // 예약된 타이머 콜백을 직접 실행해서 실제 만료 로직까지 확인
    await (fn as any)();
    await new Promise(setImmediate);

    const updated = await prisma.poll.findFirst({
      where: { title: '단기 만료 투표' },
    });

    expect(updated?.status).toBe(PollStatus.CLOSED);
    expect(sendSseNotification).toHaveBeenCalledTimes(1);
  });
});
