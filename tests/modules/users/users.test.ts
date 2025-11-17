/**
 * @file tests/modules/users/users.test.ts
 * @description Users PATCH /api/users/me 통합 테스트
 */

import request from 'supertest';
import app from '#core/app';
import prisma from '#core/prisma';
import { generateAccessToken } from '#modules/auth/utils/tokenUtils';
import { UserRole, JoinStatus } from '@prisma/client';
import ApiError from '#errors/ApiError';

import { assertAllowedByMagic } from '#core/files/assertAllowedByMagic';
import { processImageBeforeUpload } from '#core/files/processImageBeforeUpload';
import { uploadImageToS3 } from '#core/aws/uploadImageToS3';
import { isPasswordValid, hashPassword } from '#helpers/passwordUtils';

// mock
jest.mock('#core/files/assertAllowedByMagic');
jest.mock('#core/files/processImageBeforeUpload');
jest.mock('#core/aws/uploadImageToS3');
jest.mock('#core/aws/deleteImageFromS3');
jest.mock('#helpers/passwordUtils');

process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'true';

const USER_EMAIL = 'update@test.com';
const USERNAME = 'update_test_user';
const APT_NAME = 'UsersTestAPT';

const cleanupScope = async () => {
  await prisma.$transaction([
    prisma.comment.deleteMany({
      where: { user: { email: USER_EMAIL } },
    }),
    prisma.notification.deleteMany({
      where: { recipient: { email: USER_EMAIL } },
    }),

    prisma.user.deleteMany({
      where: {
        OR: [{ email: USER_EMAIL }, { username: USERNAME }],
      },
    }),

    prisma.apartment.deleteMany({
      where: { apartmentName: APT_NAME },
    }),
  ]);
};

describe('[Users] PATCH /api/users/me', () => {
  let user: any;
  let userToken: string;

  beforeAll(async () => {
    await cleanupScope();

    const apt = await prisma.apartment.create({
      data: {
        apartmentName: APT_NAME,
        apartmentAddress: 'Users_Seoul',
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

    user = await prisma.user.create({
      data: {
        username: USERNAME,
        password: 'hashed_pw',
        contact: '01000000051',
        name: '유우저',
        email: USER_EMAIL,
        role: 'USER',
        avatar: 'image',
        apartment: { connect: { id: apt.id } },
      },
    });

    userToken = generateAccessToken({
      id: user.id,
      role: UserRole.USER,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 1. 아바타만 업로드
   */
  it('아바타만 업로드하면 200을 반환해야 함', async () => {
    (assertAllowedByMagic as jest.Mock).mockResolvedValue(undefined);
    (processImageBeforeUpload as jest.Mock).mockResolvedValue(Buffer.from('processed'));
    (uploadImageToS3 as jest.Mock).mockResolvedValue('https://test.com/new_avatar.png');

    const res = await request(app)
      .patch('/api/users/me')
      .set('Cookie', [`access_token=${userToken}`])
      .attach('file', Buffer.from('avatar'), 'avatar.png');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(uploadImageToS3).toHaveBeenCalled();
  });

  /**
   * 2. 비밀번호만 변경
   */
  it('비밀번호 변경 시 200을 반환해야 함', async () => {
    (isPasswordValid as jest.Mock).mockResolvedValue(true);
    (hashPassword as jest.Mock).mockResolvedValue('hashed_new_pw');

    const res = await request(app)
      .patch('/api/users/me')
      .set('Cookie', [`access_token=${userToken}`])
      .field('currentPassword', 'oldpw')
      .field('newPassword', 'newpw123!');

    expect(res.status).toBe(200);
    expect(hashPassword).toHaveBeenCalled();
  });

  /**
   * 3. currentPassword 불일치
   */
  it('currentPassword가 틀리면 403을 반환해야 함', async () => {
    (isPasswordValid as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .patch('/api/users/me')
      .set('Cookie', [`access_token=${userToken}`])
      .field('currentPassword', 'wrongpw')
      .field('newPassword', 'newpw123!');

    expect(res.status).toBe(403);
  });

  /**
   * 4. 업데이트할 내용 없음
   */
  it('업데이트할 내용이 없으면 422를 반환해야 함', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Cookie', [`access_token=${userToken}`])
      .field('noop', '');

    expect(res.status).toBe(422);
  });

  /**
   * 5. MIME 체크 실패
   */
  it('파일 MIME 체크 실패 시 400을 반환해야 함', async () => {
    (assertAllowedByMagic as jest.Mock).mockRejectedValue(ApiError.badRequest('허용되지 않은 이미지'));

    const res = await request(app)
      .patch('/api/users/me')
      .set('Cookie', [`access_token=${userToken}`])
      .attach('file', Buffer.from('bad'), 'avatar.gif');

    expect(res.status).toBe(400);
  });

  afterAll(async () => {
    await cleanupScope();
    await prisma.$disconnect();
  });
});
