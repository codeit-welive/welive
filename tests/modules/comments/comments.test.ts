/**
 * @file tests/modules/comments/comments.test.ts
 * @description Comments 통합 테스트
 */

import request from 'supertest';
import app from '#core/app';
import prisma from '#core/prisma';
import { generateAccessToken } from '#modules/auth/utils/tokenUtils';
import { UserRole, JoinStatus, BoardType } from '@prisma/client';

process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'true';

describe('[Comments] 통합 테스트', () => {
  let userToken: string;
  let adminToken: string;
  let apartmentId: string;
  let boardNoticeId: string;
  let noticeId: string;
  let commentId: string;

  const TEST_APT = 'CommentAPT';
  const TEST_APT_OTHER = 'OtherAPT';

  const TEST_EMAILS = [
    'comment_admin@test.com',
    'comment_user@test.com',
    'other_admin@test.com',
    'temp_user@test.com',
    'del_user@test.com',
    'foreign@test.com',
  ];

  const cleanupScope = async () => {
    await prisma.$transaction([
      prisma.event.deleteMany({
        where: { apartment: { apartmentName: { in: [TEST_APT, TEST_APT_OTHER] } } },
      }),
      prisma.notification.deleteMany({
        where: { recipient: { email: { in: TEST_EMAILS } } },
      }),
      prisma.comment.deleteMany({
        where: {
          OR: [{ board: { apartment: { apartmentName: TEST_APT } } }, { user: { email: { in: TEST_EMAILS } } }],
        },
      }),
      prisma.notice.deleteMany({
        where: { apartment: { apartmentName: TEST_APT } },
      }),
      prisma.board.deleteMany({
        where: { apartment: { apartmentName: { in: [TEST_APT, TEST_APT_OTHER] } } },
      }),
      prisma.resident.deleteMany({
        where: { apartment: { apartmentName: TEST_APT } },
      }),
      prisma.apartment.deleteMany({
        where: { apartmentName: { in: [TEST_APT, TEST_APT_OTHER] } },
      }),
      prisma.user.deleteMany({
        where: { email: { in: TEST_EMAILS } },
      }),
    ]);
  };

  beforeAll(async () => {
    await cleanupScope();

    // apartment / board
    const apt = await prisma.apartment.create({
      data: {
        apartmentName: TEST_APT,
        apartmentAddress: 'Comments_Seoul',
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

    const [boardNotice] = await prisma.$transaction([
      prisma.board.create({
        data: { type: 'NOTICE', apartment: { connect: { id: apartmentId } } },
      }),
      prisma.board.create({
        data: { type: 'COMPLAINT', apartment: { connect: { id: apartmentId } } },
      }),
    ]);
    boardNoticeId = boardNotice.id;

    // admin, User
    const admin = await prisma.user.create({
      data: {
        username: 'comment_admin',
        password: 'pw',
        contact: '01000000021',
        name: '관리자',
        email: 'comment_admin@test.com',
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
        contact: '01000000022',
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
        username: 'comment_user',
        password: 'pw',
        contact: '01000000023',
        name: '일반유저',
        email: 'comment_user@test.com',
        role: 'USER',
        avatar: 'u',
        resident: { connect: { id: resident.id } },
      },
    });

    const otherAdmin = await prisma.user.create({
      data: {
        username: 'other_admin',
        password: 'pw',
        contact: '01000000024',
        name: '다른관리자',
        email: 'other_admin@test.com',
        role: 'ADMIN',
        avatar: 'o',
      },
    });

    // 다른 아파트 생성
    await prisma.apartment.create({
      data: {
        apartmentName: TEST_APT_OTHER,
        apartmentAddress: 'Busan',
        startComplexNumber: '1',
        endComplexNumber: '10',
        startDongNumber: '101',
        endDongNumber: '110',
        startFloorNumber: '1',
        endFloorNumber: '15',
        startHoNumber: '1',
        endHoNumber: '10',
        admin: { connect: { id: otherAdmin.id } },
      },
    });

    // Notice 생성
    const notice = await prisma.notice.create({
      data: {
        title: '엘리베이터 점검 안내',
        content: '10월 30일 10~12시 점검이 있습니다.',
        category: 'COMMUNITY',
        board: { connect: { id: boardNoticeId } },
        apartment: { connect: { id: apartmentId } },
        user: { connect: { id: admin.id } },
      },
    });
    noticeId = notice.id;

    // Token 생성
    userToken = generateAccessToken({
      id: user.id,
      role: UserRole.USER,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });
    adminToken = generateAccessToken({
      id: admin.id,
      role: UserRole.ADMIN,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });
  });

  /**
   * 1. POST /api/comments
   */
  it('USER가 자신의 NOTICE 게시글에 댓글을 작성하면 201을 반환해야 함', async () => {
    const res = await request(app)
      .post('/api/comments')
      .set('Cookie', [`access_token=${userToken}`])
      .send({
        content: '이 공지 정말 도움이 됩니다!',
        boardType: 'NOTICE',
        boardId: noticeId,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('comment');
    expect(res.body.comment.content).toBe('이 공지 정말 도움이 됩니다!');
    commentId = res.body.comment.id;
  });

  /**
   * 2. PATCH /api/comments/:id
   */
  it('USER가 자신의 댓글을 수정하면 200과 수정된 내용을 반환해야 함', async () => {
    const res = await request(app)
      .patch(`/api/comments/${commentId}`)
      .set('Cookie', [`access_token=${userToken}`])
      .send({
        content: '수정된 댓글 내용입니다.',
        boardType: 'NOTICE',
        boardId: noticeId,
      });

    expect(res.status).toBe(200);
    expect(res.body.comment).toHaveProperty('content', '수정된 댓글 내용입니다.');
  });

  /**
   * 3. DELETE /api/comments/:id
   */
  it('USER가 자신의 댓글을 삭제하면 200과 성공 메시지를 반환해야 함', async () => {
    const res = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: '정상적으로 삭제 처리되었습니다.' });

    const exists = await prisma.comment.findUnique({ where: { id: commentId } });
    expect(exists).toBeNull();
  });

  /**
   * 4. 기타 (권한 테스트)
   */
  it('USER가 다른 사람 댓글을 수정하려 하면 403을 반환해야 함', async () => {
    const otherComment = await prisma.comment.create({
      data: {
        content: '타인의 댓글입니다.',
        boardType: 'NOTICE',
        board: { connect: { id: boardNoticeId } },
        user: {
          create: {
            username: 'temp_user',
            password: 'pw',
            contact: '01000000025',
            name: '임시유저',
            email: 'temp_user@test.com',
            role: 'USER',
            avatar: 't',
          },
        },
      },
    });

    const res = await request(app)
      .patch(`/api/comments/${otherComment.id}`)
      .set('Cookie', [`access_token=${userToken}`])
      .send({
        content: '수정 시도',
        boardType: 'NOTICE',
        boardId: noticeId,
      });

    expect(res.status).toBe(403);
  });

  it('USER가 다른 사람 댓글을 삭제하려 하면 403을 반환해야 함', async () => {
    const another = await prisma.comment.create({
      data: {
        content: '삭제 불가 댓글',
        boardType: 'NOTICE',
        board: { connect: { id: boardNoticeId } },
        user: {
          create: {
            username: 'del_user',
            password: 'pw',
            contact: '01000000026',
            name: '삭제유저',
            email: 'del_user@test.com',
            role: 'USER',
            avatar: 'x',
          },
        },
      },
    });

    const res = await request(app)
      .delete(`/api/comments/${another.id}`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(403);
  });

  it('ADMIN이 다른 아파트의 댓글을 삭제하려 하면 403을 반환해야 함', async () => {
    const foreignApt = await prisma.apartment.findFirst({ where: { apartmentName: TEST_APT_OTHER } });

    const foreignBoard = await prisma.board.create({
      data: { type: BoardType.NOTICE, apartment: { connect: { id: foreignApt!.id } } },
    });

    const foreignComment = await prisma.comment.create({
      data: {
        content: '다른 아파트 댓글',
        boardType: 'NOTICE',
        board: { connect: { id: foreignBoard.id } },
        user: {
          create: {
            username: 'foreign_user',
            password: 'pw',
            contact: '01000000027',
            name: '외부유저',
            email: 'foreign@test.com',
            role: 'USER',
            avatar: 'f',
          },
        },
      },
    });

    const res = await request(app)
      .delete(`/api/comments/${foreignComment.id}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(403);
  });

  it('존재하지 않는 댓글을 수정하려 하면 404를 반환해야 함', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .patch(`/api/comments/${fakeId}`)
      .set('Cookie', [`access_token=${userToken}`])
      .send({
        content: '없는 댓글 수정',
        boardType: 'NOTICE',
        boardId: noticeId,
      });

    expect(res.status).toBe(404);
  });

  it('content가 누락된 상태로 댓글 작성 시 400을 반환해야 함', async () => {
    const res = await request(app)
      .post('/api/comments')
      .set('Cookie', [`access_token=${userToken}`])
      .send({
        boardType: 'NOTICE',
        boardId: noticeId,
      });

    expect(res.status).toBe(400);
  });

  afterAll(async () => {
    await cleanupScope();
    process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'false';
    await prisma.$disconnect();
  });
});
