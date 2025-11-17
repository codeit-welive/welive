/**
 * @file tests/modules/polls/pollsVote.test.ts
 * @description PollsVote(Options) 모듈 통합 테스트
 */

import request from 'supertest';
import app from '#core/app';
import prisma from '#core/prisma';
import { generateAccessToken } from '#modules/auth/utils/tokenUtils';
import { UserRole, JoinStatus, PollStatus } from '@prisma/client';

process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'true';

const TEST_APARTMENT_NAME = 'PollVoteAPT';

const TEST_EMAILS = ['pollvote_admin@test.com', 'pollvote_user@test.com', 'pollvote_user2@test.com'];

const cleanupScope = async () => {
  await prisma.$transaction([
    prisma.pollVote.deleteMany({
      where: {
        poll: {
          apartment: { apartmentName: TEST_APARTMENT_NAME },
        },
      },
    }),
    prisma.pollOption.deleteMany({
      where: {
        poll: {
          apartment: { apartmentName: TEST_APARTMENT_NAME },
        },
      },
    }),
    prisma.poll.deleteMany({
      where: {
        apartment: { apartmentName: TEST_APARTMENT_NAME },
      },
    }),
    prisma.board.deleteMany({
      where: {
        apartment: { apartmentName: TEST_APARTMENT_NAME },
        type: 'POLL',
      },
    }),
    prisma.resident.deleteMany({
      where: {
        apartment: { apartmentName: TEST_APARTMENT_NAME },
      },
    }),
    prisma.user.deleteMany({
      where: {
        email: { in: TEST_EMAILS },
      },
    }),
    prisma.apartment.deleteMany({
      where: {
        apartmentName: TEST_APARTMENT_NAME,
      },
    }),
  ]);
};

describe('[PollsVote] 통합 테스트', () => {
  let userToken: string;
  let adminId: string;
  let userId: string;
  let apartmentId: string;
  let boardPollId: string;

  let optionAll1Id: string;
  let optionRestrictedId: string;
  let optionPendingId: string;
  let optionPeriodOverId: string;

  beforeAll(async () => {
    await cleanupScope();

    const apt = await prisma.apartment.create({
      data: {
        apartmentName: TEST_APARTMENT_NAME,
        apartmentAddress: 'PollVote_Seoul',
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
    apartmentId = apt.id;

    const boardPoll = await prisma.board.create({
      data: {
        type: 'POLL',
        apartment: { connect: { id: apartmentId } },
      },
    });
    boardPollId = boardPoll.id;

    const admin = await prisma.user.create({
      data: {
        username: 'pollvote_admin',
        password: 'pw',
        contact: '01000000091',
        name: '투표관리자',
        email: 'pollvote_admin@test.com',
        role: UserRole.ADMIN,
        avatar: 'a',
      },
    });
    adminId = admin.id;

    await prisma.apartment.update({
      where: { id: apartmentId },
      data: { admin: { connect: { id: adminId } } },
    });

    const resident = await prisma.resident.create({
      data: {
        name: '투표유저',
        contact: '01000000092',
        building: '101',
        unitNumber: '1001',
        isRegistered: true,
        approvalStatus: 'APPROVED',
        residenceStatus: 'RESIDENCE',
        isHouseholder: 'HOUSEHOLDER',
        apartment: { connect: { id: apartmentId } },
      },
    });

    const user = await prisma.user.create({
      data: {
        username: 'pollvote_user',
        password: 'pw',
        contact: '01000000093',
        name: '투표유저',
        email: 'pollvote_user@test.com',
        role: UserRole.USER,
        avatar: 'u',
        resident: { connect: { id: resident.id } },
      },
    });
    userId = user.id;

    userToken = generateAccessToken({
      id: user.id,
      role: UserRole.USER,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });

    const now = new Date();

    // buildingPermission = 0, IN_PROGRESS, 기간 정상 (성공 케이스용)
    const pollAll = await prisma.poll.create({
      data: {
        title: '전체 동 투표',
        content: 'buildingPermission = 0',
        startDate: new Date(now.getTime() - 60_000),
        endDate: new Date(now.getTime() + 60_000),
        status: PollStatus.IN_PROGRESS,
        buildingPermission: 0,
        user: { connect: { id: adminId } },
        board: { connect: { id: boardPollId } },
        apartment: { connect: { id: apartmentId } },
        options: {
          create: [{ title: '찬성' }, { title: '반대' }],
        },
      },
      include: { options: true },
    });
    optionAll1Id = pollAll.options[0].id;

    // buildingPermission = 102, IN_PROGRESS, 기간 정상 (동 불일치 403 테스트용)
    const pollRestricted = await prisma.poll.create({
      data: {
        title: '102동 한정 투표',
        content: '동 불일치 테스트',
        startDate: new Date(now.getTime() - 60_000),
        endDate: new Date(now.getTime() + 60_000),
        status: PollStatus.IN_PROGRESS,
        buildingPermission: 102,
        user: { connect: { id: adminId } },
        board: { connect: { id: boardPollId } },
        apartment: { connect: { id: apartmentId } },
        options: {
          create: [{ title: '102동 전용 옵션' }],
        },
      },
      include: { options: true },
    });
    optionRestrictedId = pollRestricted.options[0].id;

    // 3) status = PENDING, 기간 정상 (상태 검증 403용)
    const pollPending = await prisma.poll.create({
      data: {
        title: 'PENDING 상태 투표',
        content: '상태 검증 테스트',
        startDate: new Date(now.getTime() - 60_000),
        endDate: new Date(now.getTime() + 60_000),
        status: PollStatus.PENDING,
        buildingPermission: 0,
        user: { connect: { id: adminId } },
        board: { connect: { id: boardPollId } },
        apartment: { connect: { id: apartmentId } },
        options: {
          create: [{ title: '옵션1' }],
        },
      },
      include: { options: true },
    });
    optionPendingId = pollPending.options[0].id;

    // 기간 만료 (날짜 검증 403용)
    const pollPeriodOver = await prisma.poll.create({
      data: {
        title: '기간 만료 투표',
        content: '기간 검증 테스트',
        startDate: new Date(now.getTime() - 3_600_000),
        endDate: new Date(now.getTime() - 1_800_000),
        status: PollStatus.IN_PROGRESS,
        buildingPermission: 0,
        user: { connect: { id: adminId } },
        board: { connect: { id: boardPollId } },
        apartment: { connect: { id: apartmentId } },
        options: {
          create: [{ title: '기간만료 옵션' }],
        },
      },
      include: { options: true },
    });
    optionPeriodOverId = pollPeriodOver.options[0].id;
  });

  /**
   * 1. POST /api/options/:optionId/vote - 성공 케이스
   */
  it('USER가 조건을 만족하는 옵션에 투표하면 200과 message/updatedOption/winnerOption/options를 반환해야 함', async () => {
    const res = await request(app)
      .post(`/api/options/${optionAll1Id}/vote`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('updatedOption');
    expect(res.body.updatedOption).toHaveProperty('id', optionAll1Id);
    expect(res.body.updatedOption).toHaveProperty('title');
    expect(res.body.updatedOption).toHaveProperty('votes');
    expect(res.body).toHaveProperty('winnerOption');
    expect(res.body).toHaveProperty('options');
    expect(Array.isArray(res.body.options)).toBe(true);

    // DB 상 득표수 증가 확인
    const option = await prisma.pollOption.findUnique({
      where: { id: optionAll1Id },
      include: { _count: { select: { votes: true } } },
    });
    expect(option!._count.votes).toBe(1);
  });

  /**
   * 2. DELETE /api/options/:optionId/vote - 성공 케이스
   */
  it('USER가 자신의 투표를 취소하면 200과 message/updatedOption을 반환해야 함', async () => {
    const res = await request(app)
      .delete(`/api/options/${optionAll1Id}/vote`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '투표가 취소되었습니다.');
    expect(res.body).toHaveProperty('updatedOption');
    expect(res.body.updatedOption).toHaveProperty('id', optionAll1Id);
    expect(res.body.updatedOption).toHaveProperty('votes');

    const option = await prisma.pollOption.findUnique({
      where: { id: optionAll1Id },
      include: { _count: { select: { votes: true } } },
    });
    expect(option!._count.votes).toBe(0);
  });

  /**
   * 3. 권한/검증 케이스
   */
  it('buildingPermission이 0이 아니고, USER의 동이 일치하지 않으면 403을 반환해야 함', async () => {
    const res = await request(app)
      .post(`/api/options/${optionRestrictedId}/vote`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(403);
  });

  it('아파트 동 정보가 없는 USER는 401을 반환해야 함', async () => {
    const noResidentUser = await prisma.user.create({
      data: {
        username: 'pollvote_user2',
        password: 'pw',
        contact: '01000000094',
        name: '동 미설정 유저',
        email: 'pollvote_user2@test.com',
        role: UserRole.USER,
        avatar: 'nr',
        // resident 연결 없음
      },
    });

    const noResidentToken = generateAccessToken({
      id: noResidentUser.id,
      role: UserRole.USER,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });

    const res = await request(app)
      .post(`/api/options/${optionAll1Id}/vote`)
      .set('Cookie', [`access_token=${noResidentToken}`]);

    expect(res.status).toBe(401);
  });

  it('PENDING 상태 투표에 투표하면 403을 반환해야 함', async () => {
    const res = await request(app)
      .post(`/api/options/${optionPendingId}/vote`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(403);
  });

  it('기간이 지난 투표에 투표하면 403을 반환해야 함', async () => {
    const res = await request(app)
      .post(`/api/options/${optionPeriodOverId}/vote`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(403);
  });

  it('존재하지 않는 optionId로 투표하면 400을 반환해야 함', async () => {
    const fakeOptionId = '00000000-0000-0000-0000-000000000000';

    const res = await request(app)
      .post(`/api/options/${fakeOptionId}/vote`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(400);
  });

  it('존재하지 않는 optionId로 투표 취소를 시도하면 400을 반환해야 함', async () => {
    const fakeOptionId = '00000000-0000-0000-0000-000000000001';

    const res = await request(app)
      .delete(`/api/options/${fakeOptionId}/vote`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(400);
  });

  afterAll(async () => {
    process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'false';
    await cleanupScope();
    await prisma.$disconnect();
  });
});
