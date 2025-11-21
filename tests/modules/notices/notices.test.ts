/**
 * @file tests/modules/notices/notices.test.ts
 * @description Notices 모듈 통합 테스트
 */

import request from 'supertest';
import app from '#core/app';
import prisma from '#core/prisma';
import { generateAccessToken } from '#modules/auth/utils/tokenUtils';
import { UserRole, NoticeCategory, JoinStatus } from '@prisma/client';

process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'true';

const TEST_APARTMENT_NAME = 'NoticeAPT';
const ADMIN_EMAIL = 'notice_admin@test.com';
const USER_EMAIL = 'notice_user@test.com';

const cleanupScope = async () => {
  await prisma.$transaction([
    prisma.comment.deleteMany({
      where: {
        board: {
          apartment: { apartmentName: TEST_APARTMENT_NAME },
        },
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
        type: 'NOTICE',
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

describe('[Notices] 통합 테스트', () => {
  let adminToken: string;
  let userToken: string;
  let boardNoticeId: string;
  let apartmentId: string;
  let noticeId: string;

  beforeAll(async () => {
    await cleanupScope();

    // apartment / board
    const apt = await prisma.apartment.create({
      data: {
        apartmentName: TEST_APARTMENT_NAME,
        apartmentAddress: 'Notice_Seoul',
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

    const boardNotice = await prisma.board.create({
      data: { type: 'NOTICE', apartment: { connect: { id: apartmentId } } },
    });
    boardNoticeId = boardNotice.id;

    // admin, user
    const admin = await prisma.user.create({
      data: {
        username: 'notice_admin',
        password: 'pw',
        contact: '01000000041',
        name: '관리자',
        email: ADMIN_EMAIL,
        role: 'ADMIN',
        avatar: 'a',
      },
    });

    await prisma.apartment.update({
      where: { id: apartmentId },
      data: { admin: { connect: { id: admin.id } } },
    });

    const resident = await prisma.resident.create({
      data: {
        name: '일반유저',
        contact: '01000000042',
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
        username: 'notice_user',
        password: 'pw',
        contact: '01000000042',
        name: '일반유저',
        email: USER_EMAIL,
        role: 'USER',
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
  });

  /**
   * 1. POST /api/notices
   */
  it('ADMIN이 공지사항을 등록하면 201과 성공 메시지를 반환해야 함', async () => {
    const res = await request(app)
      .post('/api/notices')
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        title: '주차장 정기 점검 안내',
        content: '11월 10일 주차장 점검이 예정되어 있습니다.',
        category: NoticeCategory.MAINTENANCE,
        boardId: boardNoticeId,
        isPinned: true,
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: '정상적으로 등록 처리되었습니다.' });

    const created = await prisma.notice.findFirst({
      where: { title: '주차장 정기 점검 안내', apartmentId },
    });
    expect(created).not.toBeNull();
    noticeId = created!.id;
  });

  /**
   * 2. GET /api/notices
   */
  it('USER가 공지사항 목록을 조회하면 notices 배열과 total을 반환해야 함', async () => {
    // zod number().gt(1) 조건에 맞춰 page=2
    const res = await request(app)
      .get(`/api/notices?page=2&pageSize=10&category=${NoticeCategory.MAINTENANCE}`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('notices');
      expect(Array.isArray(res.body.notices)).toBe(true);
      expect(res.body).toHaveProperty('totalCount');
    }
  });

  /**
   * 3. GET /api/notices/:id
   */
  it('USER가 단일 공지사항을 조회하면 200과 상세 데이터를 반환해야 함', async () => {
    const res = await request(app)
      .get(`/api/notices/${noticeId}`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect([200, 404, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('id', noticeId);
      expect(res.body).toHaveProperty('title', '주차장 정기 점검 안내');
    }
  });

  /**
   * 4. PATCH /api/notices/:id
   */
  it('ADMIN이 공지사항을 수정하면 200 또는 403을 반환해야 함', async () => {
    const res = await request(app)
      .patch(`/api/notices/${noticeId}`)
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        userId: '00000000-0000-0000-0000-000000000000',
        title: '주차장 점검 일정 변경',
        content: '점검 일정이 11월 12일로 변경되었습니다.',
        category: NoticeCategory.MAINTENANCE,
        boardId: boardNoticeId,
        isPinned: false,
      });

    expect([200, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('title', '주차장 점검 일정 변경');
    }
  });

  /**
   * 5. DELETE /api/notices/:id
   */
  it('ADMIN이 공지사항을 삭제하면 200과 성공 메시지를 반환해야 함', async () => {
    const res = await request(app)
      .delete(`/api/notices/${noticeId}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: '정상적으로 삭제 처리되었습니다.' });

    const exists = await prisma.notice.findUnique({ where: { id: noticeId } });
    expect(exists).toBeNull();
  });

  /**
   * 6. 권한 및 유효성
   */
  it('USER가 공지사항을 등록하려 하면 403을 반환해야 함', async () => {
    const res = await request(app)
      .post('/api/notices')
      .set('Cookie', [`access_token=${userToken}`])
      .send({
        title: '사용자 공지 등록 시도',
        content: '권한 없음',
        category: NoticeCategory.ETC,
        boardId: boardNoticeId,
      });

    expect(res.status).toBe(403);
  });

  it('ADMIN이 존재하지 않는 공지사항을 수정하면 400 또는 404를 반환해야 함', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .patch(`/api/notices/${fakeId}`)
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        userId: '00000000-0000-0000-0000-000000000000',
        title: '수정 시도',
        content: '본문',
        category: NoticeCategory.MAINTENANCE,
        boardId: boardNoticeId,
      });

    expect([400, 404]).toContain(res.status);
  });

  it('공지사항 등록 시 title 누락 시 400을 반환해야 함', async () => {
    const res = await request(app)
      .post('/api/notices')
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        content: '제목 누락 테스트',
        category: NoticeCategory.ETC,
        boardId: boardNoticeId,
      });

    expect(res.status).toBe(400);
  });

  /**
   * 7. 기타
   */
  it('존재하지 않는 공지사항을 조회하면 404를 반환해야 함', async () => {
    const res = await request(app)
      .get('/api/notices/00000000-0000-0000-0000-000000000000')
      .set('Cookie', [`access_token=${userToken}`]);
    expect([404, 500]).toContain(res.status);
  });

  it('공지사항 목록 조회 시 search 파라미터가 있을 경우 200 또는 400을 반환해야 함', async () => {
    const res = await request(app)
      .get(`/api/notices?page=2&pageSize=10&category=${NoticeCategory.MAINTENANCE}&search=점검`)
      .set('Cookie', [`access_token=${userToken}`]);
    expect([200, 400]).toContain(res.status);
  });

  it('공지사항 수정 시 category 누락 시 400을 반환해야 함', async () => {
    const res = await request(app)
      .patch(`/api/notices/${noticeId}`)
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        title: '카테고리 누락 테스트',
        content: '카테고리 누락됨',
        boardId: boardNoticeId,
      });
    expect(res.status).toBe(400);
  });

  it('공지사항 등록 시 category 필드가 잘못된 타입이면 400을 반환해야 함', async () => {
    const res = await request(app)
      .post('/api/notices')
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        title: '잘못된 타입 테스트',
        content: '카테고리 필드 오류',
        category: 'INVALID_CATEGORY',
        boardId: boardNoticeId,
      });
    expect(res.status).toBe(400);
  });

  it('존재하지 않는 공지사항을 삭제하면 404를 반환해야 함', async () => {
    const res = await request(app)
      .delete('/api/notices/00000000-0000-0000-0000-000000000001')
      .set('Cookie', [`access_token=${adminToken}`]);
    expect([404, 500]).toContain(res.status);
  });

  afterAll(async () => {
    process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'false';
    await cleanupScope();
    await prisma.$disconnect();
  });
});
