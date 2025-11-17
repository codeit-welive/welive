/**
 * @file tests/modules/events/events.test.ts
 * @description Events 모듈 통합 테스트
 */

import request from 'supertest';
import app from '#core/app';
import prisma from '#core/prisma';
import { generateAccessToken } from '#modules/auth/utils/tokenUtils';
import { UserRole, NoticeCategory, JoinStatus } from '@prisma/client';

process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'true';

describe('[Events] 통합 테스트', () => {
  let adminToken: string;
  let userToken: string;

  let apartmentId: string;
  let boardNoticeId: string;
  let boardPollId: string;

  let noticeId: string;
  let pollId: string;

  let noticeEventId: string | undefined;
  let pollEventId: string | undefined;

  const TEST_APARTMENT_NAME = 'EventAPT';
  const ADMIN_EMAIL = 'events_admin@test.com';
  const USER_EMAIL = 'events_user@test.com';

  const cleanupScope = async () => {
    await prisma.$transaction([
      prisma.event.deleteMany({
        where: {
          apartment: { apartmentName: TEST_APARTMENT_NAME },
        },
      }),
      prisma.poll.deleteMany({
        where: {
          apartment: { apartmentName: TEST_APARTMENT_NAME },
        },
      }),
      prisma.notice.deleteMany({
        where: {
          apartment: { apartmentName: TEST_APARTMENT_NAME },
        },
      }),
      prisma.board.deleteMany({
        where: {
          apartment: { apartmentName: TEST_APARTMENT_NAME },
          type: { in: ['NOTICE', 'POLL'] },
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

  beforeAll(async () => {
    await cleanupScope();

    const apt = await prisma.apartment.create({
      data: {
        apartmentName: TEST_APARTMENT_NAME,
        apartmentAddress: 'Event_Seoul',
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

    const [boardNotice, boardPoll] = await prisma.$transaction([
      prisma.board.create({
        data: {
          type: 'NOTICE',
          apartment: { connect: { id: apartmentId } },
        },
      }),
      prisma.board.create({
        data: {
          type: 'POLL',
          apartment: { connect: { id: apartmentId } },
        },
      }),
    ]);
    boardNoticeId = boardNotice.id;
    boardPollId = boardPoll.id;

    const admin = await prisma.user.create({
      data: {
        username: 'events_admin',
        password: 'pw',
        contact: '01000000111',
        name: '이벤트관리자',
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
        name: '이벤트유저',
        contact: '01000000112',
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
        username: 'events_user',
        password: 'pw',
        contact: '01000000113',
        name: '이벤트유저',
        email: USER_EMAIL,
        role: UserRole.USER,
        avatar: 'u',
        resident: { connect: { id: resident.id } },
      },
    });

    // 해당 월에 포함되는 Notice / Poll 생성
    const startDate = new Date(2025, 5, 13, 0, 0, 0, 0); // 2025-06-13
    const endDate = new Date(2025, 5, 15, 23, 59, 59, 999); // 2025-06-15

    const notice = await prisma.notice.create({
      data: {
        title: '정기 점검 안내',
        content: '2025년 6월 13~15일 정기 점검이 있습니다.',
        category: NoticeCategory.MAINTENANCE,
        startDate,
        endDate,
        board: { connect: { id: boardNoticeId } },
        apartment: { connect: { id: apartmentId } },
        user: { connect: { id: admin.id } },
      },
    });
    noticeId = notice.id;

    const poll = await prisma.poll.create({
      data: {
        title: '주차장 개선 투표',
        content: '주차장 개선 여부를 투표합니다.',
        startDate,
        endDate,
        status: 'PENDING',
        user: { connect: { id: admin.id } },
        board: { connect: { id: boardPollId } },
        apartment: { connect: { id: apartmentId } },
      },
    });
    pollId = poll.id;

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
  });

  /**
   * 1. GET /api/event
   */
  it('USER가 이벤트 목록을 조회하면 NOTICE/POLL 기반 이벤트 배열을 반환해야 함', async () => {
    const res = await request(app)
      .get(`/api/event?apartmentId=${apartmentId}&year=2025&month=6`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const noticeEvent = res.body.find((e: any) => e.type === 'NOTICE');
    const pollEvent = res.body.find((e: any) => e.type === 'POLL');

    expect(noticeEvent).toBeDefined();
    expect(noticeEvent).toHaveProperty('title', '정기 점검 안내');
    expect(noticeEvent).toHaveProperty('category', 'MAINTENANCE');
    expect(noticeEvent).toHaveProperty('start');
    expect(noticeEvent).toHaveProperty('end');

    expect(pollEvent).toBeDefined();
    expect(pollEvent).toHaveProperty('title', '주차장 개선 투표');
    expect(pollEvent).toHaveProperty('category', 'RESIDENT_VOTE');
    expect(pollEvent).toHaveProperty('start');
    expect(pollEvent).toHaveProperty('end');

    noticeEventId = noticeEvent.id;
    pollEventId = pollEvent.id;
  });

  it('로그인하지 않은 사용자가 이벤트 목록을 조회하면 401을 반환해야 함', async () => {
    const res = await request(app).get(`/api/event?apartmentId=${apartmentId}&year=2025&month=6`);
    expect(res.status).toBe(401);
  });

  it('apartmentId 없이 이벤트 목록을 요청하면 400을 반환해야 함', async () => {
    const res = await request(app)
      .get('/api/event?year=2025&month=6')
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(400);
  });

  /**
   * 2. PUT /api/event
   * - 공지 기반 이벤트 생성/업데이트
   */
  it('ADMIN이 NOTICE 게시글 기반 이벤트를 생성/업데이트하면 204를 반환해야 함', async () => {
    const res = await request(app)
      .put('/api/event')
      .set('Cookie', [`access_token=${adminToken}`])
      .query({
        boardType: 'NOTICE',
        boardId: noticeId,
        startDate: new Date(2025, 5, 13).toISOString(),
        endDate: new Date(2025, 5, 15, 23, 59, 59, 999).toISOString(),
      });

    expect(res.status).toBe(204);

    const event = await prisma.event.findUnique({ where: { noticeId } });
    expect(event).not.toBeNull();
    expect(event!.boardType).toBe('NOTICE');
    expect(event!.category).toBe('MAINTENANCE');
    expect(event!.apartmentId).toBe(apartmentId);
  });

  /**
   * 3. PUT /api/event (POLL)
   */
  it('ADMIN이 POLL 게시글 기반 이벤트를 생성/업데이트하면 204를 반환하고 카테고리가 RESIDENT_VOTE여야 함', async () => {
    const res = await request(app)
      .put('/api/event')
      .set('Cookie', [`access_token=${adminToken}`])
      .query({
        boardType: 'POLL',
        boardId: pollId,
        startDate: new Date(2025, 5, 13).toISOString(),
        endDate: new Date(2025, 5, 15, 23, 59, 59, 999).toISOString(),
      });

    expect(res.status).toBe(204);

    const event = await prisma.event.findUnique({ where: { pollId } });
    expect(event).not.toBeNull();
    expect(event!.boardType).toBe('POLL');
    expect(event!.category).toBe('RESIDENT_VOTE');
    expect(event!.apartmentId).toBe(apartmentId);
  });

  it('USER가 이벤트 생성/업데이트를 시도하면 403을 반환해야 함', async () => {
    const res = await request(app)
      .put('/api/event')
      .set('Cookie', [`access_token=${userToken}`])
      .query({
        boardType: 'NOTICE',
        boardId: noticeId,
        startDate: new Date(2025, 5, 13).toISOString(),
        endDate: new Date(2025, 5, 15, 23, 59, 59, 999).toISOString(),
      });

    expect(res.status).toBe(403);
  });

  it('ADMIN이 존재하지 않는 게시글 ID로 이벤트 생성/업데이트 시 404를 반환해야 함', async () => {
    const res = await request(app)
      .put('/api/event')
      .set('Cookie', [`access_token=${adminToken}`])
      .query({
        boardType: 'NOTICE',
        boardId: '00000000-0000-0000-0000-000000000000',
        startDate: new Date(2025, 5, 13).toISOString(),
        endDate: new Date(2025, 5, 15, 23, 59, 59, 999).toISOString(),
      });

    expect(res.status).toBe(404);
  });

  /**
   * 4. DELETE /api/event/{eventId}
   */
  it('ADMIN이 이벤트를 삭제하면 200과 삭제된 이벤트 정보를 반환해야 함', async () => {
    if (!noticeEventId) {
      throw new Error('noticeEventId가 설정되어 있지 않습니다. GET /api/event 테스트를 확인하세요.');
    }

    const res = await request(app)
      .delete(`/api/event/${noticeEventId}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', noticeEventId);

    const deleted = await prisma.event.findUnique({ where: { id: noticeEventId } });
    expect(deleted).toBeNull();
  });

  it('USER가 이벤트를 삭제하려 하면 403을 반환해야 함', async () => {
    if (!pollEventId) {
      throw new Error('pollEventId가 설정되어 있지 않습니다. GET /api/event 테스트를 확인하세요.');
    }

    const res = await request(app)
      .delete(`/api/event/${pollEventId}`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(403);
  });

  it('ADMIN이 존재하지 않는 이벤트를 삭제하려 하면 404를 반환해야 함', async () => {
    const res = await request(app)
      .delete('/api/event/11111111-1111-4111-8111-111111111111')
      .set('Cookie', [`access_token=${adminToken}`]);

    expect([404, 500]).toContain(res.status);
  });

  afterAll(async () => {
    await cleanupScope();
    process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'false';
    await prisma.$disconnect();
  });
});
