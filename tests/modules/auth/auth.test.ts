/**
 * @file tests/modules/auth/auth.test.ts
 * @description Auth 모듈 통합 테스트
 */

import request from 'supertest';
import app from '#core/app';
import prisma from '#core/prisma';
import { generateAccessToken, generateRefreshToken } from '#modules/auth/utils/tokenUtils';
import { UserRole, JoinStatus } from '@prisma/client';

process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'true';

const TEST_APARTMENT_NAMES = ['AuthAPT'];

const TEST_EMAILS = [
  'auth_super@gmail.com',
  'auth_admin@gmail.com',
  'auth_user@gmail.com',
  'auth_user2@gmail.com',
  'auth_dup@gmail.com',
  'auth_user_pending@gmail.com',
  'auth_rejected_admin@gmail.com',
  'auth_rejected_user@gmail.com',
];

const cleanupScope = async () => {
  await prisma.$transaction([
    prisma.resident.deleteMany({
      where: {
        apartment: { apartmentName: { in: TEST_APARTMENT_NAMES } },
      },
    }),
    prisma.board.deleteMany({
      where: {
        apartment: { apartmentName: { in: TEST_APARTMENT_NAMES } },
      },
    }),
    prisma.user.deleteMany({
      where: {
        email: { in: TEST_EMAILS },
      },
    }),
    prisma.apartment.deleteMany({
      where: {
        apartmentName: { in: TEST_APARTMENT_NAMES },
      },
    }),
  ]);
};

describe('[Auth] 통합 테스트', () => {
  let superAdminId: string;
  let adminId: string;
  let userId: string;
  let residentId: string;

  let superAdminToken: string;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    await cleanupScope();
  });

  /**
   * 1. POST /api/auth/signup/super-admin
   */
  it('슈퍼관리자를 회원가입하면 201과 사용자 정보를 반환해야 함', async () => {
    const res = await request(app).post('/api/auth/signup/super-admin').send({
      username: 'auth_super',
      password: 'Test!@1234', // 소문자 + 숫자 + 특수문자 포함
      contact: '01000000701',
      name: '슈퍼관리자',
      email: 'auth_super@gmail.com', // MX 존재 도메인
      role: UserRole.SUPER_ADMIN,
      avatar: 'https://test.com/super.png',
      joinStatus: JoinStatus.APPROVED,
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', 'auth_super@gmail.com');
    expect(res.body).toHaveProperty('role', UserRole.SUPER_ADMIN);

    superAdminId = res.body.id;

    superAdminToken = generateAccessToken({
      id: superAdminId,
      role: UserRole.SUPER_ADMIN,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });
  });

  /**
   * 2. POST /api/auth/signup/admin
   */
  it('관리자를 회원가입하면 201과 아파트 정보가 생성되어야 함', async () => {
    const res = await request(app).post('/api/auth/signup/admin').send({
      username: 'auth_admin',
      password: 'Test!@1234',
      contact: '01000000702',
      name: '관리자',
      email: 'auth_admin@gmail.com',
      role: UserRole.ADMIN,
      avatar: 'https://test.com/admin.png',

      apartmentName: 'AuthAPT',
      description: 'Auth 테스트 아파트',
      startComplexNumber: '1',
      endComplexNumber: '10',
      startDongNumber: '1',
      endDongNumber: '10',
      startFloorNumber: '1',
      endFloorNumber: '15',
      startHoNumber: '1',
      endHoNumber: '10',
      apartmentAddress: '서울 AuthAPT',
      apartmentManagementNumber: '0212345678',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', 'auth_admin@gmail.com');
    expect(res.body).toHaveProperty('role', UserRole.ADMIN);

    adminId = res.body.id;

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      include: { apartment: true },
    });

    expect(admin).not.toBeNull();
    expect(admin?.apartment).not.toBeNull();
    expect(admin?.apartment?.apartmentName).toBe('AuthAPT');

    adminToken = generateAccessToken({
      id: adminId,
      role: UserRole.ADMIN,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });
  });

  /**
   * 3. POST /api/auth/signup (USER)
   */
  it('일반 유저가 아파트에 회원가입하면 201과 사용자 정보를 반환해야 함', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      username: 'auth_user',
      password: 'Test!@1234',
      contact: '01000000703',
      name: '일반유저',
      email: 'auth_user@gmail.com',
      role: UserRole.USER,
      avatar: 'https://test.com/user.png',
      apartmentName: 'AuthAPT',
      apartmentDong: '101',
      apartmentHo: '1001',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', 'auth_user@gmail.com');
    expect(res.body).toHaveProperty('role', UserRole.USER);

    userId = res.body.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { resident: true },
    });

    expect(user).not.toBeNull();
    expect(user?.resident).not.toBeNull();

    residentId = user!.resident!.id;

    userToken = generateAccessToken({
      id: userId,
      role: UserRole.USER,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });
  });

  /**
   * 4. POST /api/auth/login
   */
  it('회원이 올바른 계정 정보로 로그인하면 200과 유저 정보를 반환해야 함', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'auth_user',
      password: 'Test!@1234',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', userId);
    expect(res.body).toHaveProperty('email', 'auth_user@gmail.com');
  });

  it('잘못된 비밀번호로 로그인하면 401을 반환해야 함', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'auth_user',
      password: 'Wrong!@1234',
    });

    expect(res.status).toBe(401);
  });

  /**
   * 5. POST /api/auth/refresh
   */
  it('유효한 refresh_token 쿠키로 토큰 재발급을 요청하면 200과 메시지를 반환해야 함', async () => {
    const refreshToken = generateRefreshToken({
      id: userId,
      role: UserRole.USER,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refresh_token=${refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', '작업이 성공적으로 완료되었습니다');
  });

  /**
   * 6. POST /api/auth/signup (존재하지 않는 아파트)
   */
  it('존재하지 않는 아파트명으로 회원가입하면 404를 반환해야 함', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      username: 'auth_user2',
      password: 'Test!@1234',
      contact: '01000000704',
      name: '다른유저',
      email: 'auth_user2@gmail.com',
      role: UserRole.USER,
      avatar: 'https://test.com/user2.png',
      apartmentName: 'NotExistAPT',
      apartmentDong: '101', // 형식은 유효하지만 아파트가 없으므로 404
      apartmentHo: '1001',
    });

    expect(res.status).toBe(404);
  });

  /**
   * 7. POST /api/auth/signup (중복 계정)
   */
  it('동일한 username/email/contact로 두 번 회원가입하면 400를 반환해야 함', async () => {
    const body = {
      username: 'auth_dup',
      password: 'Test!@1234',
      contact: '01000000705',
      name: '중복유저',
      email: 'auth_dup@gmail.com',
      role: UserRole.USER,
      avatar: 'https://test.com/dup.png',
      apartmentName: 'AuthAPT',
      apartmentDong: '102', // 1 < 10, 2 < 10
      apartmentHo: '1002', // 10 < 15, 2 <= 10
    };

    const first = await request(app).post('/api/auth/signup').send(body);
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/auth/signup').send(body);
    expect(second.status).toBe(400);
  });

  /**
   * 8. PATCH /api/auth/admins/:adminId/status
   */
  it('SUPER_ADMIN이 관리자의 가입 상태를 변경하면 200과 성공 메시지를 반환해야 함', async () => {
    const res = await request(app)
      .patch(`/api/auth/admins/${adminId}/status`)
      .set('Cookie', [`access_token=${superAdminToken}`])
      .send({
        status: JoinStatus.APPROVED,
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: '작업이 성공적으로 완료되었습니다',
    });

    const updated = await prisma.user.findUnique({
      where: { id: adminId },
    });

    expect(updated?.joinStatus).toBe(JoinStatus.APPROVED);
  });

  /**
   * 9. PATCH /api/auth/residents/:residentId/status
   */
  it('ADMIN이 입주민의 가입 상태를 APPROVED로 변경하면 200과 성공 메시지를 반환해야 함', async () => {
    const res = await request(app)
      .patch(`/api/auth/residents/${residentId}/status`)
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        status: JoinStatus.APPROVED,
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: '작업이 성공적으로 완료되었습니다',
    });

    const updated = await prisma.user.findUnique({
      where: { id: userId },
      include: { resident: true },
    });

    expect(updated?.joinStatus).toBe(JoinStatus.APPROVED);
    expect(updated?.resident?.approvalStatus).toBe('APPROVED');
  });

  /**
   * 10. PATCH /api/auth/residents/status (일괄 승인)
   */
  it('ADMIN이 자신의 아파트의 PENDING 입주민들을 일괄 승인하면 200을 반환해야 함', async () => {
    // PENDING 상태의 유저/거주자 생성 (AuthAPT)
    const pendingResident = await prisma.resident.create({
      data: {
        name: '대기입주민',
        contact: '01000000706',
        building: '101',
        unitNumber: '1002',
        isRegistered: true,
        approvalStatus: 'PENDING',
        residenceStatus: 'RESIDENCE',
        isHouseholder: 'HOUSEHOLDER',
        apartment: {
          connect: { apartmentName: 'AuthAPT' },
        },
      },
    });

    const pendingUser = await prisma.user.create({
      data: {
        username: 'auth_user_pending',
        password: 'pw',
        contact: '01000000706',
        name: '대기유저',
        email: 'auth_user_pending@gmail.com',
        role: UserRole.USER,
        avatar: 'https://test.com/pending.png',
        joinStatus: JoinStatus.PENDING,
        resident: {
          connect: { id: pendingResident.id },
        },
      },
    });

    const res = await request(app)
      .patch('/api/auth/residents/status')
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        status: JoinStatus.APPROVED,
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: '작업이 성공적으로 완료되었습니다',
    });

    const updated = await prisma.user.findUnique({
      where: { id: pendingUser.id },
      include: { resident: true },
    });

    expect(updated?.joinStatus).toBe(JoinStatus.APPROVED);
    expect(updated?.resident?.approvalStatus).toBe('APPROVED');
  });

  /**
   * 11. POST /api/auth/cleanup (SUPER_ADMIN → ADMIN)
   */
  it('SUPER_ADMIN이 cleanup을 호출하면 REJECTED 상태의 ADMIN 계정이 삭제되어야 함', async () => {
    const rejectedAdmin = await prisma.user.create({
      data: {
        username: 'auth_rejected_admin',
        password: 'pw',
        contact: '01000000707',
        name: '거절관리자',
        email: 'auth_rejected_admin@gmail.com',
        role: UserRole.ADMIN,
        avatar: 'https://test.com/rejected-admin.png',
        joinStatus: JoinStatus.REJECTED,
      },
    });

    const res = await request(app)
      .post('/api/auth/cleanup')
      .set('Cookie', [`access_token=${superAdminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: '작업이 성공적으로 완료되었습니다',
    });

    const exists = await prisma.user.findUnique({
      where: { id: rejectedAdmin.id },
    });

    expect(exists).toBeNull();
  });

  /**
   * 12. POST /api/auth/cleanup (ADMIN → USER)
   */
  it('ADMIN이 cleanup을 호출하면 REJECTED 상태의 USER 계정이 삭제되어야 함', async () => {
    const rejectedUser = await prisma.user.create({
      data: {
        username: 'auth_rejected_user',
        password: 'pw',
        contact: '01000000708',
        name: '거절유저',
        email: 'auth_rejected_user@gmail.com',
        role: UserRole.USER,
        avatar: 'https://test.com/rejected-user.png',
        joinStatus: JoinStatus.REJECTED,
        resident: {
          create: {
            name: '거절유저',
            contact: '01000000708',
            building: '102',
            unitNumber: '1003',
            apartment: { connect: { apartmentName: 'AuthAPT' } },
          },
        },
      },
    });

    const res = await request(app)
      .post('/api/auth/cleanup')
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: '작업이 성공적으로 완료되었습니다',
    });

    const exists = await prisma.user.findUnique({
      where: { id: rejectedUser.id },
    });

    expect(exists).toBeNull();
  });

  /**
   * 13. POST /api/auth/cleanup (USER 권한 없음)
   */
  it('USER가 cleanup을 호출하면 403을 반환해야 함', async () => {
    const res = await request(app)
      .post('/api/auth/cleanup')
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(403);
  });

  afterAll(async () => {
    process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'false';
    await cleanupScope();
    await prisma.$disconnect();
  });
});
