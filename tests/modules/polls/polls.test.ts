/**
 * @file tests/modules/polls/polls.test.ts
 * @description Polls 모듈 통합 테스트
 */

import request from 'supertest';
import app from '#core/app';
import prisma from '#core/prisma';
import { generateAccessToken } from '#modules/auth/utils/tokenUtils';
import { UserRole, JoinStatus, PollStatus } from '@prisma/client';

process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'true';

const TEST_APARTMENT_NAME = 'PollAPT';
const ADMIN_EMAIL = 'poll_admin@test.com';
const USER_EMAIL = 'poll_user@test.com';

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
        email: { in: [ADMIN_EMAIL, USER_EMAIL] },
      },
    }),
    prisma.apartment.deleteMany({
      where: {
        apartmentName: TEST_APARTMENT_NAME,
      },
    }),
  ]);
};

describe('[Polls] 통합 테스트', () => {
  let adminToken: string;
  let userToken: string;
  let apartmentId: string;
  let boardPollId: string;

  let pendingPollId: string;
  let nonPendingPollIdForPatch: string;
  let nonPendingPollIdForDelete: string;

  beforeAll(async () => {
    await cleanupScope();

    const apt = await prisma.apartment.create({
      data: {
        apartmentName: TEST_APARTMENT_NAME,
        apartmentAddress: 'Poll_Seoul',
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
        username: 'poll_admin',
        password: 'pw',
        contact: '01000000081',
        name: '투표관리자',
        email: ADMIN_EMAIL,
        role: UserRole.ADMIN,
        avatar: 'a',
      },
    });

    await prisma.apartment.update({
      where: { id: apartmentId },
      data: { admin: { connect: { id: admin.id } } },
    });

    const resident = await prisma.resident.create({
      data: {
        name: '투표유저',
        contact: '01000000082',
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
        username: 'poll_user',
        password: 'pw',
        contact: '01000000083',
        name: '투표유저',
        email: USER_EMAIL,
        role: UserRole.USER,
        avatar: 'u',
        resident: { connect: { id: resident.id } },
      },
    });

    adminToken = generateAccessToken({
      id: admin.id,
      role: UserRole.ADMIN,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });

    userToken = generateAccessToken({
      id: user.id,
      role: UserRole.USER,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });

    // PATCH/DELETE 시 PENDING이 아닌 투표용 더미 데이터 생성
    const now = new Date();

    const nonPendingPoll = await prisma.poll.create({
      data: {
        title: 'IN_PROGRESS 상태의 투표',
        content: '이미 진행 중인 투표입니다.',
        startDate: new Date(now.getTime() - 60_000),
        endDate: new Date(now.getTime() + 60_000),
        status: PollStatus.IN_PROGRESS,
        buildingPermission: 0,
        user: { connect: { id: admin.id } },
        board: { connect: { id: boardPollId } },
        apartment: { connect: { id: apartmentId } },
        options: {
          create: [{ title: '찬성' }, { title: '반대' }],
        },
      },
    });
    nonPendingPollIdForPatch = nonPendingPoll.id;

    const closedPoll = await prisma.poll.create({
      data: {
        title: 'CLOSED 상태의 투표',
        content: '이미 종료된 투표입니다.',
        startDate: new Date(now.getTime() - 3600_000),
        endDate: new Date(now.getTime() - 1800_000),
        status: PollStatus.CLOSED,
        buildingPermission: 0,
        user: { connect: { id: admin.id } },
        board: { connect: { id: boardPollId } },
        apartment: { connect: { id: apartmentId } },
        options: {
          create: [{ title: '찬성' }, { title: '반대' }],
        },
      },
    });
    nonPendingPollIdForDelete = closedPoll.id;
  });

  /**
   * 1. POST /api/polls
   */
  it('ADMIN이 투표를 생성하면 201과 성공 메시지를 반환해야 함', async () => {
    const now = new Date();

    const res = await request(app)
      .post('/api/polls')
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        boardId: boardPollId,
        status: PollStatus.PENDING,
        title: '주차장 CCTV 설치 찬반 투표',
        content: 'CCTV 설치에 대한 의견을 모읍니다.',
        buildingPermission: 0,
        startDate: new Date(now.getTime() + 60_000).toISOString(),
        endDate: new Date(now.getTime() + 3_600_000).toISOString(),
        options: [{ title: '찬성' }, { title: '반대' }],
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: '정상적으로 등록 처리되었습니다.' });

    const created = await prisma.poll.findFirst({
      where: { title: '주차장 CCTV 설치 찬반 투표', apartmentId },
      include: { options: true },
    });

    expect(created).not.toBeNull();
    expect(created!.options.length).toBe(2);
    pendingPollId = created!.id;
  });

  it('USER가 투표를 생성하려 하면 403을 반환해야 함', async () => {
    const now = new Date();

    const res = await request(app)
      .post('/api/polls')
      .set('Cookie', [`access_token=${userToken}`])
      .send({
        boardId: boardPollId,
        status: PollStatus.PENDING,
        title: '사용자 생성 투표',
        content: '권한이 없어야 함',
        buildingPermission: 0,
        startDate: new Date(now.getTime() + 60_000).toISOString(),
        endDate: new Date(now.getTime() + 3_600_000).toISOString(),
        options: [{ title: '찬성' }, { title: '반대' }],
      });

    expect(res.status).toBe(403);
  });

  it('투표 생성 시 title 누락 등 유효하지 않은 요청이면 400을 반환해야 함', async () => {
    const now = new Date();

    const res = await request(app)
      .post('/api/polls')
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        boardId: boardPollId,
        status: PollStatus.PENDING,
        // title 누락
        content: '잘못된 요청',
        buildingPermission: 0,
        startDate: new Date(now.getTime() + 60_000).toISOString(),
        endDate: new Date(now.getTime() + 3_600_000).toISOString(),
        options: [{ title: '' }], // 옵션 제목 invalid
      });

    expect(res.status).toBe(400);
  });

  /**
   * 2. GET /api/polls
   */
  it('ADMIN이 투표 목록을 조회하면 polls 배열과 totalCount를 반환해야 함', async () => {
    const res = await request(app)
      .get('/api/polls?page=1&limit=10')
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('polls');
    expect(Array.isArray(res.body.polls)).toBe(true);
    expect(res.body).toHaveProperty('totalCount');
  });

  it('USER도 자신의 아파트 투표 목록을 조회할 수 있어야 함', async () => {
    const res = await request(app)
      .get('/api/polls?page=1&limit=10')
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('polls');
    expect(Array.isArray(res.body.polls)).toBe(true);
    expect(res.body).toHaveProperty('totalCount');
  });

  it('투표 목록 조회 시 page가 0 이하이면 400을 반환해야 함', async () => {
    const res = await request(app)
      .get('/api/polls?page=0&limit=10')
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(400);
  });

  /**
   * 3. GET /api/polls/:pollId
   */
  it('USER가 단일 투표를 조회하면 200과 상세 데이터를 반환해야 함', async () => {
    const res = await request(app)
      .get(`/api/polls/${pendingPollId}`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pollId', pendingPollId);
    expect(res.body).toHaveProperty('title', '주차장 CCTV 설치 찬반 투표');
    expect(res.body).toHaveProperty('options');
    expect(Array.isArray(res.body.options)).toBe(true);
  });

  it('존재하지 않는 투표를 조회하면 404를 반환해야 함', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const res = await request(app)
      .get(`/api/polls/${fakeId}`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(404);
  });

  /**
   * 4. PATCH /api/polls/:pollId
   */
  it('ADMIN이 PENDING 상태의 투표를 수정하면 200을 반환하고 DB가 갱신되어야 함', async () => {
    const now = new Date();

    const res = await request(app)
      .patch(`/api/polls/${pendingPollId}`)
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        title: '수정된 CCTV 설치 투표',
        content: '내용도 수정되었습니다.',
        buildingPermission: 0,
        startDate: new Date(now.getTime() + 120_000).toISOString(),
        endDate: new Date(now.getTime() + 3_600_000).toISOString(),
        status: PollStatus.PENDING, // PENDING
        options: [{ title: '찬성(수정)' }, { title: '반대(수정)' }],
      });

    expect(res.status).toBe(200);

    const updated = await prisma.poll.findUnique({
      where: { id: pendingPollId },
      include: { options: true },
    });

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('수정된 CCTV 설치 투표');
    expect(updated!.status).toBe(PollStatus.PENDING);
    expect(updated!.options.length).toBe(2);
  });

  it('USER가 투표를 수정하려 하면 403을 반환해야 함', async () => {
    const now = new Date();

    const res = await request(app)
      .patch(`/api/polls/${pendingPollId}`)
      .set('Cookie', [`access_token=${userToken}`])
      .send({
        title: '사용자가 수정 시도',
        content: '수정하면 안 됨',
        buildingPermission: 0,
        startDate: new Date(now.getTime() + 120_000).toISOString(),
        endDate: new Date(now.getTime() + 3_600_000).toISOString(),
        status: PollStatus.PENDING,
        options: [{ title: '1' }],
      });

    expect(res.status).toBe(403);
  });

  it('ADMIN이 IN_PROGRESS/CLOSED 상태의 투표를 수정하려 하면 422를 반환해야 함', async () => {
    const now = new Date();

    const res = await request(app)
      .patch(`/api/polls/${nonPendingPollIdForPatch}`)
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        title: '상태 변경 불가 테스트',
        content: '이미 진행 중이므로 수정 불가',
        buildingPermission: 0,
        startDate: new Date(now.getTime() - 60_000).toISOString(),
        endDate: new Date(now.getTime() + 60_000).toISOString(),
        status: PollStatus.IN_PROGRESS,
        options: [{ title: '그냥 값' }],
      });

    expect(res.status).toBe(422);
  });

  /**
   * 5. DELETE /api/polls/:pollId
   */
  it('ADMIN이 PENDING 상태의 투표를 삭제하면 200을 반환하고 DB에서 삭제되어야 함', async () => {
    const res = await request(app)
      .delete(`/api/polls/${pendingPollId}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);

    const exists = await prisma.poll.findUnique({ where: { id: pendingPollId } });
    expect(exists).toBeNull();
  });

  it('ADMIN이 IN_PROGRESS/CLOSED 상태의 투표를 삭제하려 하면 422를 반환해야 함', async () => {
    const res = await request(app)
      .delete(`/api/polls/${nonPendingPollIdForDelete}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(422);
  });

  afterAll(async () => {
    process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'false';
    await cleanupScope();
    await prisma.$disconnect();
  });
});
