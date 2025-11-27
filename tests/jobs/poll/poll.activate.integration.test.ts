/**
 * @file tests/jobs/poll/poll.activate.integration.test.ts
 * @description Poll 활성화 통합 테스트 (Prisma + 실제 예약 로직)
 */

import { describe, it, beforeAll, afterAll, beforeEach, afterEach, expect, jest } from '@jest/globals';
import prisma from '#core/prisma';
import { activateReadyPolls } from '#jobs/poll/poll.activate.handler';
import { sendSseToUser } from '#sse/sseEmitter';
import { PollStatus, BoardType, UserRole, JoinStatus } from '@prisma/client';

process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'true';

/**
 * SSE만 mock (DB/알림 생성/대상 조회는 실제로 탐)
 */
jest.mock('#sse/sseEmitter', () => ({
  sendSseToUser: jest.fn(),
}));

jest.mock('#core/logger', () => ({
  logger: {
    polls: {
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
  },
}));

const TEST_APT = 'PollActivateAPT';
const USER_EMAIL = 'poll_user@test.com';
const ADMIN_EMAIL = 'poll_admin@test.com';

const cleanupTestScope = async () => {
  await prisma.$transaction([
    prisma.notification.deleteMany({
      where: {
        OR: [{ recipient: { email: USER_EMAIL } }, { recipient: { email: ADMIN_EMAIL } }],
      },
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
    prisma.user.deleteMany({
      where: { email: { in: [USER_EMAIL, ADMIN_EMAIL] } },
    }),
    prisma.resident.deleteMany({
      where: { apartment: { apartmentName: TEST_APT } },
    }),
    prisma.apartment.deleteMany({
      where: { apartmentName: TEST_APT },
    }),
  ]);
};

beforeAll(async () => {
  await cleanupTestScope();
});

beforeEach(async () => {
  jest.clearAllMocks();

  // timer는 fake timers로 통제 + 정리 가능하게 만든다
  jest.useFakeTimers({ legacyFakeTimers: true });
  jest.clearAllTimers();

  await cleanupTestScope();
});

afterEach(async () => {
  // 테스트 끝나고 남은 timer를 정리해서 CI hang 방지
  jest.runOnlyPendingTimers();
  await new Promise(setImmediate);
  jest.clearAllTimers();
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

    const resident = await prisma.resident.create({
      data: {
        name: '일반유저',
        contact: '01000000061',
        building: '101',
        unitNumber: '1001',
        apartment: { connect: { id: apt.id } },
        isRegistered: true,
        approvalStatus: 'APPROVED',
        residenceStatus: 'RESIDENCE',
        isHouseholder: 'HOUSEHOLDER',
      },
    });

    const user = await prisma.user.create({
      data: {
        username: 'poll_user',
        password: 'pw',
        contact: '01000000061',
        name: '테스트유저',
        email: USER_EMAIL,
        role: UserRole.USER,
        avatar: 'https://test.com/avatar.png',
        resident: { connect: { id: resident.id } },
        joinStatus: JoinStatus.APPROVED,
        isActive: true,
      },
    });

    const admin = await prisma.user.create({
      data: {
        username: 'poll_admin',
        password: 'pw',
        contact: '01000000062',
        name: '관리자',
        email: ADMIN_EMAIL,
        role: UserRole.ADMIN,
        avatar: 'https://test.com/avatar.png',
        joinStatus: JoinStatus.APPROVED,
        isActive: true,
      },
    });

    await prisma.apartment.update({
      where: { id: apt.id },
      data: { admin: { connect: { id: admin.id } } },
    });

    const board = await prisma.board.create({
      data: {
        type: BoardType.POLL,
        apartment: { connect: { id: apt.id } },
      },
    });

    return { apt, user, admin, board };
  };

  it('startDate가 이미 지난 Poll은 즉시 IN_PROGRESS로 변경 + SSE 호출됨', async () => {
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

    expect(sendSseToUser).toHaveBeenCalled();
  });

  it('startDate가 미래면 변경 X + SSE 없음', async () => {
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
    expect(sendSseToUser).not.toHaveBeenCalled();
  });

  it('startDate가 3초 내이면 setTimeout 예약 + 실행 완료 후 IN_PROGRESS + SSE 2회', async () => {
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
    const pending: Promise<any>[] = [];

    // setTimeout을 spyOn + mockImplementation으로 가로채고 즉시 실행
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(((
      fn: (...args: any[]) => any,
      delay?: number,
      ...args: any[]
    ) => {
      capturedDelay = delay as number;

      const ret = fn(...args);
      if (ret && typeof ret.then === 'function') pending.push(ret);

      // fake timer id 반환
      return 0 as unknown as NodeJS.Timeout;
    }) as unknown as typeof setTimeout);

    try {
      await activateReadyPolls();

      // 콜백이 async일 수 있으니 내부 작업까지 끝까지 대기
      await Promise.all(pending);
      await new Promise(setImmediate);

      expect(setTimeoutSpy).toHaveBeenCalled();
      expect(typeof capturedDelay).toBe('number');
      expect(capturedDelay!).toBeGreaterThanOrEqual(2500);
      expect(capturedDelay!).toBeLessThanOrEqual(3500);

      const updated = await prisma.poll.findFirst({ where: { title: '직후 예약 투표' } });
      expect(updated?.status).toBe(PollStatus.IN_PROGRESS);

      expect(sendSseToUser).toHaveBeenCalledTimes(2);
    } finally {
      setTimeoutSpy.mockRestore();
    }
  });
});
