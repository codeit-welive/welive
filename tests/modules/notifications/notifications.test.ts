/**
 * @file test/modules/notifications/notification.test.ts
 * @description Notifications 모듈 통합 테스트
 */

import request from 'supertest';
import app from '#core/app';
import prisma from '#core/prisma';
import { generateAccessToken } from '#modules/auth/utils/tokenUtils';
import { UserRole, JoinStatus } from '@prisma/client';

process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'true';

describe('[Notifications] 통합 테스트', () => {
  let userToken: string;
  let otherUserToken: string;
  let notificationId: string;

  const TEST_EMAILS = ['notification_user@test.com', 'notification_other@test.com'];

  const cleanupScope = async () => {
    await prisma.$transaction([
      prisma.notification.deleteMany({
        where: {
          recipient: {
            email: {
              in: TEST_EMAILS,
            },
          },
        },
      }),
      prisma.user.deleteMany({
        where: {
          email: {
            in: TEST_EMAILS,
          },
        },
      }),
    ]);
  };

  beforeAll(async () => {
    await cleanupScope();

    const [user, otherUser] = await prisma.$transaction([
      prisma.user.create({
        data: {
          username: 'notification_user',
          password: 'pw',
          contact: '01000001061',
          name: '알림유저',
          email: TEST_EMAILS[0],
          role: 'USER',
          avatar: 'u',
        },
      }),
      prisma.user.create({
        data: {
          username: 'notification_other',
          password: 'pw',
          contact: '01000001062',
          name: '다른유저',
          email: TEST_EMAILS[1],
          role: 'USER',
          avatar: 'o',
        },
      }),
    ]);

    userToken = generateAccessToken({
      id: user.id,
      role: UserRole.USER,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });

    otherUserToken = generateAccessToken({
      id: otherUser.id,
      role: UserRole.USER,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });

    const notification = await prisma.notification.create({
      data: {
        content: '테스트 알림입니다.',
        notificationType: 'GENERAL',
        recipient: { connect: { id: user.id } },
      },
    });

    notificationId = notification.id;
  });

  /**
   * 1. PATCH /api/notifications/:id/read
   */
  it('USER가 자신의 알림을 읽음 처리하면 200과 성공 메시지를 반환해야 함', async () => {
    const res = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: '알림을 읽음 처리했습니다.',
      notificationId,
    });

    const updated = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    expect(updated).not.toBeNull();
    expect(updated!.isChecked).toBe(true);
  });

  /**
   * 2. 이미 읽은 알림을 다시 읽음 처리 시도
   */
  it('이미 읽은 알림을 다시 읽음 처리하면 404를 반환해야 함', async () => {
    const res = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(404);
  });

  /**
   * 3. 다른 유저가 남의 알림을 읽음 처리 시도
   */
  it('다른 유저가 남의 알림을 읽음 처리하려 하면 404를 반환해야 하고, isChecked는 변경되지 않아야 함', async () => {
    const anotherNotification = await prisma.notification.create({
      data: {
        content: '권한 테스트용 알림입니다.',
        notificationType: 'GENERAL',
        recipient: {
          connect: { email: TEST_EMAILS[0] },
        },
      },
    });

    const res = await request(app)
      .patch(`/api/notifications/${anotherNotification.id}/read`)
      .set('Cookie', [`access_token=${otherUserToken}`]);

    expect(res.status).toBe(404);

    const found = await prisma.notification.findUnique({
      where: { id: anotherNotification.id },
    });

    expect(found).not.toBeNull();
    expect(found!.isChecked).toBe(false);
  });

  /**
   * 4. 존재하지 않는 알림 ID로 요청
   */
  it('존재하지 않는 알림을 읽음 처리하면 404를 반환해야 함', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const res = await request(app)
      .patch(`/api/notifications/${fakeId}/read`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(404);
  });

  afterAll(async () => {
    process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'false';
    await cleanupScope();
    await prisma.$disconnect();
  });
});
