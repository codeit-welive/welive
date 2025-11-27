/**
 * @file tests/jobs/poll/poll.expire.integration.test.ts
 * @description Poll 만료 통합 테스트 (Prisma + 실제 예약 로직)
 */

import { describe, it, beforeAll, afterAll, beforeEach, afterEach, expect, jest } from '@jest/globals';
import prisma from '#core/prisma';
import { closeExpiredPolls } from '#jobs/poll/poll.expire.handler';
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

const TEST_APT = 'ExpireTestAPT';
const USER_EMAIL = 'expire_user@test.com';
const ADMIN_EMAIL = 'expire_admin@test.com';

const sseMock = sendSseToUser as unknown as jest.Mock;

/**
 * SSE payload에서 notification id를 최대한 안전하게 뽑아내는 함수
 * - 케이스1) { notificationId: '...' }
 * - 케이스2) { id: '...', notificationType: ..., isChecked: ... } (DB row 그대로 보내는 타입)
 * - 케이스3) { data: { ... } } 같은 nested
 */
const extractNotificationId = (v: any): string | undefined => {
  if (!v) return undefined;

  if (Array.isArray(v)) {
    for (const item of v) {
      const found = extractNotificationId(item);
      if (found) return found;
    }
    return undefined;
  }

  if (typeof v !== 'object') return undefined;

  if (typeof (v as any).notificationId === 'string') return (v as any).notificationId;

  // notification row로 보이는 경우에만 id를 인정 (userId 같은 string 혼동 방지)
  if (
    typeof (v as any).id === 'string' &&
    ('notificationType' in v || 'isChecked' in v || 'notifiedAt' in v || 'recipientId' in v)
  ) {
    return (v as any).id;
  }

  for (const key of Object.keys(v)) {
    const found = extractNotificationId((v as any)[key]);
    if (found) return found;
  }

  return undefined;
};

const flushMicrotasks = async (ticks = 2) => {
  for (let i = 0; i < ticks; i++) {
    await new Promise(setImmediate);
  }
};

const waitForNotificationCount = async (pollId: string, expected: number, maxTicks = 20) => {
  for (let i = 0; i < maxTicks; i++) {
    const count = await prisma.notification.count({ where: { pollId } });
    if (count === expected) return;
    await new Promise(setImmediate);
  }
};

const getSseCallsForPoll = async (pollId: string) => {
  const notifIds = (
    await prisma.notification.findMany({
      where: { pollId },
      select: { id: true },
    })
  ).map((n) => n.id);

  if (notifIds.length === 0) return [];

  const calls = sseMock.mock.calls as any[][];
  return calls.filter((call) => {
    const nid = extractNotificationId(call);
    return typeof nid === 'string' && notifIds.includes(nid);
  });
};

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
  await cleanupTestScope();
});

afterEach(async () => {
  await flushMicrotasks();
});

afterAll(async () => {
  process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'false';
  await prisma.$disconnect();
});

describe('[PollExpireHandler] Integration', () => {
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
        name: '만료유저',
        contact: '01000000071',
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
        username: 'expire_user',
        password: 'pw',
        contact: '01000000071',
        name: '만료유저',
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
        username: 'expire_admin',
        password: 'pw',
        contact: '01000000072',
        name: '관리자',
        email: ADMIN_EMAIL,
        role: UserRole.ADMIN,
        avatar: 'https://test.com/admin.png',
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

  it('endDate가 지난 Poll은 즉시 CLOSED + SSE 2회', async () => {
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
    await flushMicrotasks();

    const updated = await prisma.poll.findUnique({ where: { id: poll.id } });
    expect(updated?.status).toBe(PollStatus.CLOSED);

    // DB에 알림 2개가 생길 때까지 잠깐 기다린 뒤, 그 알림 id로 SSE를 매칭
    await waitForNotificationCount(poll.id, 2);

    const calls = await getSseCallsForPoll(poll.id);
    expect(calls).toHaveLength(2);
  });

  it('endDate가 충분히 남으면 변경 X + SSE 없음', async () => {
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
    await flushMicrotasks();

    const unchanged = await prisma.poll.findUnique({ where: { id: poll.id } });
    expect(unchanged?.status).toBe(PollStatus.IN_PROGRESS);

    const notifCount = await prisma.notification.count({ where: { pollId: poll.id } });
    expect(notifCount).toBe(0);

    const calls = await getSseCallsForPoll(poll.id);
    expect(calls).toHaveLength(0);
  });

  it('endDate가 3초 내면 setTimeout 예약 + 실행 완료 후 CLOSED + SSE 2회', async () => {
    const { user, board } = await createBaseEnv();

    const poll = await prisma.poll.create({
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

    const pending: Promise<any>[] = [];
    const scheduled: Array<{ fn: (...args: any[]) => any; delay: number; args: any[] }> = [];

    const originalSetTimeout = globalThis.setTimeout;

    (globalThis as any).setTimeout = ((fn: any, delay?: any, ...args: any[]) => {
      scheduled.push({ fn, delay: Number(delay), args });
      return 0 as unknown as NodeJS.Timeout;
    }) as typeof setTimeout;

    try {
      await closeExpiredPolls();

      // 3초대 후보만 (다른 poll 타이머 오염 방지)
      const candidates = scheduled.filter((t) => t.delay >= 2500 && t.delay <= 3500);
      expect(candidates.length).toBeGreaterThanOrEqual(1);

      for (const t of candidates) {
        const ret = t.fn(...t.args);
        if (ret && typeof ret.then === 'function') pending.push(ret);

        await Promise.all(pending);
        await flushMicrotasks();

        const updatedMid = await prisma.poll.findUnique({ where: { id: poll.id } });
        if (updatedMid?.status === PollStatus.CLOSED) break;
      }

      const updated = await prisma.poll.findUnique({ where: { id: poll.id } });
      expect(updated?.status).toBe(PollStatus.CLOSED);

      await waitForNotificationCount(poll.id, 2);

      const calls = await getSseCallsForPoll(poll.id);
      expect(calls).toHaveLength(2);
    } finally {
      globalThis.setTimeout = originalSetTimeout;
    }
  });
});
