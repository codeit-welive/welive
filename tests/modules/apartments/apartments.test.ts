/**
 * @file tests/modules/apartments/apartments.test.ts
 * @description Apartments 모듈 통합 테스트
 */

import request from 'supertest';
import app from '#core/app';
import prisma from '#core/prisma';
import { generateAccessToken } from '#modules/auth/utils/tokenUtils';
import { UserRole, JoinStatus } from '@prisma/client';

process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'true';

const PUBLIC_APT_NAME = 'ApartmentPublicAPT';
const ADMIN_APT_NAME = 'ApartmentAdminAPT';
const SEARCH_APT_NAME = 'ApartmentSearchTarget_OnlyThisTest';

const ADMIN_EMAIL = 'apartment_admin@test.com';
const SUPER_ADMIN_EMAIL = 'apartment_super_admin@test.com';
const USER_EMAIL = 'apartment_user@test.com';

const cleanupScope = async () => {
  await prisma.$transaction([
    prisma.apartment.deleteMany({
      where: {
        apartmentName: {
          in: [PUBLIC_APT_NAME, ADMIN_APT_NAME, SEARCH_APT_NAME],
        },
      },
    }),
    prisma.user.deleteMany({
      where: {
        email: {
          in: [ADMIN_EMAIL, SUPER_ADMIN_EMAIL, USER_EMAIL],
        },
      },
    }),
  ]);
};

describe('[Apartments] 통합 테스트', () => {
  let adminToken: string;
  let superAdminToken: string;
  let userToken: string;

  let publicApartmentId: string;
  let adminApartmentId: string;
  let searchApartmentId: string;

  beforeAll(async () => {
    await cleanupScope();

    // 공개용 아파트 (public)
    const publicApt = await prisma.apartment.create({
      data: {
        apartmentName: PUBLIC_APT_NAME,
        apartmentAddress: 'Seoul_Public',
        startComplexNumber: '1',
        endComplexNumber: '1',
        startDongNumber: '101',
        endDongNumber: '105',
        startFloorNumber: '1',
        endFloorNumber: '15',
        startHoNumber: '1',
        endHoNumber: '10',
      },
    });
    publicApartmentId = publicApt.id;

    // 관리자용 아파트
    const adminApt = await prisma.apartment.create({
      data: {
        apartmentName: ADMIN_APT_NAME,
        apartmentAddress: 'Seoul_Admin',
        apartmentManagementNumber: '0200000001',
        startComplexNumber: '2',
        endComplexNumber: '2',
        startDongNumber: '201',
        endDongNumber: '205',
        startFloorNumber: '2',
        endFloorNumber: '20',
        startHoNumber: '3',
        endHoNumber: '12',
      },
    });
    adminApartmentId = adminApt.id;

    // 검색용 아파트 (searchKeyword)
    const searchApt = await prisma.apartment.create({
      data: {
        apartmentName: SEARCH_APT_NAME,
        apartmentAddress: 'Seoul_Search',
        apartmentManagementNumber: '0200000002',
        startComplexNumber: '3',
        endComplexNumber: '3',
        startDongNumber: '301',
        endDongNumber: '305',
        startFloorNumber: '3',
        endFloorNumber: '25',
        startHoNumber: '1',
        endHoNumber: '20',
      },
    });
    searchApartmentId = searchApt.id;

    const admin = await prisma.user.create({
      data: {
        username: 'apartment_admin',
        password: 'pw',
        contact: '01000000101',
        name: '아파트관리자',
        email: ADMIN_EMAIL,
        role: UserRole.ADMIN,
        avatar: 'admin',
        joinStatus: JoinStatus.APPROVED,
      },
    });

    const superAdmin = await prisma.user.create({
      data: {
        username: 'apartment_super_admin',
        password: 'pw',
        contact: '01000000102',
        name: '슈퍼관리자',
        email: SUPER_ADMIN_EMAIL,
        role: UserRole.SUPER_ADMIN,
        avatar: 'super',
        joinStatus: JoinStatus.APPROVED,
      },
    });

    const resident = await prisma.resident.create({
      data: {
        name: '일반유저',
        contact: '01000000103',
        building: '201',
        unitNumber: '2001',
        isRegistered: true,
        approvalStatus: 'APPROVED',
        residenceStatus: 'RESIDENCE',
        isHouseholder: 'HOUSEHOLDER',
        apartment: { connect: { id: adminApartmentId } },
      },
    });

    const user = await prisma.user.create({
      data: {
        username: 'apartment_user',
        password: 'pw',
        contact: '01000000103',
        name: '일반유저',
        email: USER_EMAIL,
        role: UserRole.USER,
        avatar: 'user',
        joinStatus: JoinStatus.APPROVED,
        resident: { connect: { id: resident.id } },
      },
    });

    await prisma.apartment.update({
      where: { id: adminApartmentId },
      data: { admin: { connect: { id: admin.id } } },
    });

    adminToken = generateAccessToken({
      id: admin.id,
      role: UserRole.ADMIN,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });

    superAdminToken = generateAccessToken({
      id: superAdmin.id,
      role: UserRole.SUPER_ADMIN,
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
   * 1. GET /api/apartments/public
   */
  it('비로그인 사용자가 /public에서 아파트 목록을 조회하면 공개 필드만 포함한 apartments와 totalCount를 반환해야 함', async () => {
    const res = await request(app).get('/api/apartments/public');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('apartments');
    expect(Array.isArray(res.body.apartments)).toBe(true);
    expect(res.body).toHaveProperty('totalCount');

    const target = res.body.apartments.find((apt: any) => apt.name === PUBLIC_APT_NAME);
    expect(target).toBeDefined();
    expect(target).toHaveProperty('id', publicApartmentId);
    expect(target).toHaveProperty('address', 'Seoul_Public');
    expect(target).not.toHaveProperty('officeNumber');
    expect(target).not.toHaveProperty('adminName');
  });

  it('공개 목록 조회 시 limit가 0 이하인 경우 400을 반환해야 함', async () => {
    const res = await request(app).get('/api/apartments/public?page=1&limit=0');
    expect(res.status).toBe(400);
  });

  /**
   * 2. GET /api/apartments/public/:id
   */
  it('비로그인 사용자가 /public/:id로 상세를 조회하면 범위 정보와 기본 필드만 반환해야 함', async () => {
    const res = await request(app).get(`/api/apartments/public/${publicApartmentId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', publicApartmentId);
    expect(res.body).toHaveProperty('name', PUBLIC_APT_NAME);
    expect(res.body).toHaveProperty('address', 'Seoul_Public');

    expect(res.body).toHaveProperty('dongRange');
    expect(res.body.dongRange).toHaveProperty('start');
    expect(res.body.dongRange).toHaveProperty('end');

    expect(res.body).toHaveProperty('hoRange');
    expect(res.body.hoRange).toHaveProperty('start');
    expect(res.body.hoRange).toHaveProperty('end');

    // PUBLIC에서는 관리자 관련 정보 비공개
    expect(res.body).not.toHaveProperty('officeNumber');
    expect(res.body).not.toHaveProperty('adminName');
    expect(res.body).not.toHaveProperty('adminEmail');
  });

  it('공개 상세 조회 시 잘못된 UUID 형식이면 400을 반환해야 함', async () => {
    const res = await request(app).get('/api/apartments/public/not-a-uuid');
    expect(res.status).toBe(400);
  });

  it('공개 상세 조회 시 존재하지 않는 아파트 ID면 404를 반환해야 함', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app).get(`/api/apartments/public/${fakeId}`);
    expect(res.status).toBe(404);
  });

  /**
   * 3. GET /api/apartments (권한 필요)
   */
  it('토큰 없이 /api/apartments를 호출하면 401을 반환해야 함', async () => {
    const res = await request(app).get('/api/apartments');
    expect(res.status).toBe(401);
  });

  it('USER가 /api/apartments를 호출하면 403을 반환해야 함', async () => {
    const res = await request(app)
      .get('/api/apartments?page=1&limit=10')
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(403);
  });

  it('ADMIN이 /api/apartments를 조회하면 관리자용 필드가 포함된 apartments와 totalCount를 반환해야 함', async () => {
    const res = await request(app)
      .get(`/api/apartments?page=1&limit=10&searchKeyword=${ADMIN_APT_NAME}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('apartments');
    expect(Array.isArray(res.body.apartments)).toBe(true);
    expect(res.body).toHaveProperty('totalCount');

    const target = res.body.apartments.find((apt: any) => apt.id === adminApartmentId);
    expect(target).toBeDefined();

    expect(target).toHaveProperty('name', ADMIN_APT_NAME);
    expect(target).toHaveProperty('address', 'Seoul_Admin');
    expect(target).toHaveProperty('officeNumber', '0200000001');
    expect(target).toHaveProperty('startComplexNumber', '2');
    expect(target).toHaveProperty('endComplexNumber', '2');
    expect(target).toHaveProperty('adminName');
    expect(target).toHaveProperty('adminEmail');
    expect(target).toHaveProperty('apartmentStatus');
  });

  it('SUPER_ADMIN도 /api/apartments를 조회할 수 있어야 하며 200을 반환해야 함', async () => {
    const res = await request(app)
      .get('/api/apartments?page=1&limit=10')
      .set('Cookie', [`access_token=${superAdminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('apartments');
    expect(Array.isArray(res.body.apartments)).toBe(true);
  });

  it('ADMIN이 searchKeyword로 아파트 이름을 검색하면 해당 아파트가 결과에 포함되어야 함', async () => {
    const keyword = 'OnlyThisTest';
    const res = await request(app)
      .get(`/api/apartments?page=1&limit=10&searchKeyword=${keyword}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);
    const exists = res.body.apartments.some((apt: any) => apt.id === searchApartmentId);
    expect(exists).toBe(true);
  });

  it('ADMIN이 apartmentStatus=APPROVED로 필터링하면 APPROVED 상태의 관리 아파트가 포함되어야 함', async () => {
    const res = await request(app)
      .get(`/api/apartments?page=1&limit=10&apartmentStatus=${JoinStatus.APPROVED}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);
    const exists = res.body.apartments.some(
      (apt: any) => apt.id === adminApartmentId && apt.apartmentStatus === JoinStatus.APPROVED
    );
    expect(exists).toBe(true);
  });

  /**
   * 4. GET /api/apartments/:id (권한별 상세)
   */
  it('ADMIN이 /api/apartments/:id로 상세를 조회하면 관리자용 필드가 포함되어야 함', async () => {
    const res = await request(app)
      .get(`/api/apartments/${adminApartmentId}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', adminApartmentId);
    expect(res.body).toHaveProperty('name', ADMIN_APT_NAME);
    expect(res.body).toHaveProperty('address', 'Seoul_Admin');

    // 범위 정보
    expect(res.body).toHaveProperty('dongRange');
    expect(res.body.dongRange).toHaveProperty('start');
    expect(res.body.dongRange).toHaveProperty('end');
    expect(res.body).toHaveProperty('hoRange');
    expect(res.body.hoRange).toHaveProperty('start');
    expect(res.body.hoRange).toHaveProperty('end');

    // 관리자용 필드
    expect(res.body).toHaveProperty('officeNumber', '0200000001');
    expect(res.body).toHaveProperty('apartmentStatus');
    expect(res.body).toHaveProperty('adminId');
    expect(res.body).toHaveProperty('adminName');
    expect(res.body).toHaveProperty('adminContact');
    expect(res.body).toHaveProperty('adminEmail');
  });

  it('USER가 /api/apartments/:id로 상세를 조회하면 관리자용 필드는 보이지 않아야 함', async () => {
    const res = await request(app)
      .get(`/api/apartments/${adminApartmentId}`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', adminApartmentId);
    expect(res.body).toHaveProperty('name', ADMIN_APT_NAME);

    // 범위 정보(동일)
    expect(res.body).toHaveProperty('dongRange');
    expect(res.body).toHaveProperty('hoRange');

    // 관리자용 필드 비공개
    expect(res.body).not.toHaveProperty('officeNumber');
    expect(res.body).not.toHaveProperty('apartmentStatus');
    expect(res.body).not.toHaveProperty('adminID');
    expect(res.body).not.toHaveProperty('adminName');
    expect(res.body).not.toHaveProperty('adminContact');
    expect(res.body).not.toHaveProperty('adminEmail');
  });

  it('ADMIN이 상세 조회 시 잘못된 UUID 형식을 전달하면 400을 반환해야 함', async () => {
    const res = await request(app)
      .get('/api/apartments/not-a-uuid')
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(400);
  });

  it('ADMIN이 존재하지 않는 아파트 ID로 상세를 조회하면 404를 반환해야 함', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`/api/apartments/${fakeId}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(404);
  });

  afterAll(async () => {
    await cleanupScope();
    process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'false';
    await prisma.$disconnect();
  });
});
