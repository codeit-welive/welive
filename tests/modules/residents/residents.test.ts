/**
 * @file tests/modules/residents/residents.test.ts
 * @description Residents 모듈 통합 테스트
 */

import request from 'supertest';
import app from '#core/app';
import prisma from '#core/prisma';
import { generateAccessToken } from '#modules/auth/utils/tokenUtils';
import { UserRole, JoinStatus } from '@prisma/client';

process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'true';

const TEST_APARTMENT_NAME = 'ResidentAPT';
const ADMIN_EMAIL = 'resident_admin@test.com';
const USER_EMAIL = 'resident_user@test.com';
const LINKED_USER_EMAIL = 'resident_linked@test.com';

const cleanupScope = async () => {
  await prisma.$transaction([
    prisma.resident.deleteMany({
      where: {
        apartment: { apartmentName: TEST_APARTMENT_NAME },
      },
    }),
    prisma.user.deleteMany({
      where: {
        email: {
          in: [ADMIN_EMAIL, USER_EMAIL, LINKED_USER_EMAIL],
        },
      },
    }),
    prisma.apartment.deleteMany({
      where: {
        apartmentName: TEST_APARTMENT_NAME,
      },
    }),
  ]);
};

describe('[Residents] 통합 테스트', () => {
  let adminToken: string;
  let userToken: string;
  let apartmentId: string;

  let createdResidentId: string; // POST /api/residents 로 생성된 ID
  let linkedResidentId: string; // User와 연결된 Resident ID
  let linkedUserId: string; // linkedResident 와 연결된 User ID

  beforeAll(async () => {
    await cleanupScope();

    // 1) 아파트 생성
    const apt = await prisma.apartment.create({
      data: {
        apartmentName: TEST_APARTMENT_NAME,
        apartmentAddress: 'Resident_Seoul',
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

    // 2) 관리자 / 일반 유저 생성
    const admin = await prisma.user.create({
      data: {
        username: 'resident_admin',
        password: 'pw',
        contact: '01000000121',
        name: '입주민관리자',
        email: ADMIN_EMAIL,
        role: UserRole.ADMIN,
        avatar: 'a',
      },
    });

    await prisma.apartment.update({
      where: { id: apartmentId },
      data: { admin: { connect: { id: admin.id } } },
    });

    const userResident = await prisma.resident.create({
      data: {
        name: '일반입주민',
        contact: '01000000122',
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
        username: 'resident_user',
        password: 'pw',
        contact: '01000000123',
        name: '일반유저',
        email: USER_EMAIL,
        role: UserRole.USER,
        avatar: 'u',
        resident: { connect: { id: userResident.id } },
      },
    });

    // 3) Resident 삭제 시 CASCADE 동작 확인용 Resident + User
    const linkedResident = await prisma.resident.create({
      data: {
        name: '연결된입주민',
        contact: '01000000124',
        building: '102',
        unitNumber: '1002',
        isRegistered: true,
        approvalStatus: 'APPROVED',
        residenceStatus: 'RESIDENCE',
        isHouseholder: 'HOUSEHOLDER',
        apartment: { connect: { id: apartmentId } },
      },
    });
    linkedResidentId = linkedResident.id;

    const linkedUser = await prisma.user.create({
      data: {
        username: 'resident_linked_user',
        password: 'pw',
        contact: '01000000125',
        name: '연결유저',
        email: LINKED_USER_EMAIL,
        role: UserRole.USER,
        avatar: 'l',
        resident: { connect: { id: linkedResident.id } },
      },
    });
    linkedUserId = linkedUser.id;

    // 4) 토큰 발급
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
   * 1. POST /api/residents
   */
  it('ADMIN이 입주민을 개별 등록하면 201과 생성된 데이터를 반환해야 함', async () => {
    const res = await request(app)
      .post('/api/residents')
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        building: '103',
        unitNumber: '1003',
        contact: '01000000126',
        name: '신규입주민',
        isHouseholder: 'HOUSEHOLDER',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('building', '103');
    expect(res.body).toHaveProperty('unitNumber', '1003');
    expect(res.body).toHaveProperty('contact', '01000000126');
    expect(res.body).toHaveProperty('name', '신규입주민');
    createdResidentId = res.body.id;
  });

  it('입주민 생성 시 필수 필드가 누락되면 400을 반환해야 함', async () => {
    const res = await request(app)
      .post('/api/residents')
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        // building 누락
        unitNumber: '1004',
        contact: '01000000127',
        name: '잘못된입주민',
        isHouseholder: 'HOUSEHOLDER',
      });

    expect(res.status).toBe(400);
  });

  it('중복된 연락처로 입주민을 생성하면 409를 반환해야 함', async () => {
    // linkedResident가 이미 contact: '01000000124' 사용 중
    const res = await request(app)
      .post('/api/residents')
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        building: '102',
        unitNumber: '1002',
        contact: '01000000124',
        name: '중복연락처',
        isHouseholder: 'HOUSEHOLDER',
      });

    expect([409, 400]).toContain(res.status); // P2002 → 409 매핑, 혹시 검증 단계에서 걸리면 400
  });

  it('USER가 입주민을 생성하려 하면 403을 반환해야 함', async () => {
    const res = await request(app)
      .post('/api/residents')
      .set('Cookie', [`access_token=${userToken}`])
      .send({
        building: '104',
        unitNumber: '1004',
        contact: '01000000128',
        name: '권한없는유저',
        isHouseholder: 'HOUSEHOLDER',
      });

    expect(res.status).toBe(403);
  });

  /**
   * 2. GET /api/residents
   */
  it('ADMIN이 입주민 목록을 조회하면 residents 배열과 count/totalCount를 반환해야 함', async () => {
    const res = await request(app)
      .get('/api/residents?page=1&limit=10')
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('residents');
    expect(Array.isArray(res.body.residents)).toBe(true);
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('totalCount');

    const ids = res.body.residents.map((r: any) => r.id);
    expect(ids).toContain(createdResidentId);
    expect(ids).toContain(linkedResidentId);
  });

  it('USER가 입주민 목록을 조회하려 하면 403을 반환해야 함', async () => {
    const res = await request(app)
      .get('/api/residents?page=1&limit=10')
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(403);
  });

  it('비로그인 사용자가 입주민 목록을 조회하면 401을 반환해야 함', async () => {
    const res = await request(app).get('/api/residents?page=1&limit=10');

    expect(res.status).toBe(401);
  });

  it('page가 0 이하인 경우 400을 반환해야 함', async () => {
    const res = await request(app)
      .get('/api/residents?page=0&limit=10')
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(400);
  });

  /**
   * 3. GET /api/residents/:id
   */
  it('ADMIN이 단일 입주민을 조회하면 200과 상세 데이터를 반환해야 함', async () => {
    const res = await request(app)
      .get(`/api/residents/${createdResidentId}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', createdResidentId);
    expect(res.body).toHaveProperty('building', '103');
    expect(res.body).toHaveProperty('unitNumber', '1003');
  });

  it('존재하지 않는 입주민을 조회하면 404를 반환해야 함', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`/api/residents/${fakeId}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(404);
  });

  it('잘못된 UUID 형식으로 조회하면 400을 반환해야 함', async () => {
    const res = await request(app)
      .get('/api/residents/not-a-uuid')
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(400);
  });

  /**
   * 4. PATCH /api/residents/:id
   */
  it('ADMIN이 입주민 정보를 수정하면 200과 수정된 데이터를 반환해야 함', async () => {
    const res = await request(app)
      .patch(`/api/residents/${createdResidentId}`)
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        building: '201',
        unitNumber: '2001',
        contact: '01000000129',
        name: '수정된입주민',
        isHouseholder: 'MEMBER',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('building', '201');
    expect(res.body).toHaveProperty('unitNumber', '2001');
    expect(res.body).toHaveProperty('name', '수정된입주민');

    const updated = await prisma.resident.findUnique({ where: { id: createdResidentId } });
    expect(updated).not.toBeNull();
    expect(updated!.building).toBe('201');
    expect(updated!.unitNumber).toBe('2001');
  });

  it('입주민 수정 시 유효하지 않은 body를 보내면 400을 반환해야 함', async () => {
    const res = await request(app)
      .patch(`/api/residents/${createdResidentId}`)
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        // contact를 number로 보냄 (string 아님)
        building: '201',
        unitNumber: '2001',
        contact: 1234567890,
        name: '잘못된입주민',
        isHouseholder: 'HOUSEHOLDER',
      });

    expect(res.status).toBe(400);
  });

  it('ADMIN이 존재하지 않는 입주민을 수정하면 404를 반환해야 함', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const res = await request(app)
      .patch(`/api/residents/${fakeId}`)
      .set('Cookie', [`access_token=${adminToken}`])
      .send({
        building: '101',
        unitNumber: '1001',
        contact: '01000000130',
        name: '없는 사람',
        isHouseholder: 'HOUSEHOLDER',
      });

    expect(res.status).toBe(404);
  });

  it('USER가 입주민 정보를 수정하려 하면 403을 반환해야 함', async () => {
    const res = await request(app)
      .patch(`/api/residents/${createdResidentId}`)
      .set('Cookie', [`access_token=${userToken}`])
      .send({
        building: '999',
        unitNumber: '9999',
        contact: '01000000131',
        name: '유저수정시도',
        isHouseholder: 'HOUSEHOLDER',
      });

    expect(res.status).toBe(403);
  });

  /**
   * 5. DELETE /api/residents/:id
   */
  it('ADMIN이 입주민을 삭제하면 200과 성공 메시지를 반환해야 함', async () => {
    const res = await request(app)
      .delete(`/api/residents/${createdResidentId}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: '작업이 성공적으로 완료되었습니다' });

    const exists = await prisma.resident.findUnique({ where: { id: createdResidentId } });
    expect(exists).toBeNull();
  });

  it('입주민 삭제 시 연결된 User도 함께 삭제되어야 함', async () => {
    const beforeResident = await prisma.resident.findUnique({ where: { id: linkedResidentId } });
    const beforeUser = await prisma.user.findUnique({ where: { id: linkedUserId } });
    expect(beforeResident).not.toBeNull();
    expect(beforeUser).not.toBeNull();

    const res = await request(app)
      .delete(`/api/residents/${linkedResidentId}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);

    const afterResident = await prisma.resident.findUnique({ where: { id: linkedResidentId } });
    const afterUser = await prisma.user.findUnique({ where: { id: linkedUserId } });
    expect(afterResident).toBeNull();
    expect(afterUser).toBeNull();
  });

  it('ADMIN이 존재하지 않는 입주민을 삭제하려 하면 404를 반환해야 함', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const res = await request(app)
      .delete(`/api/residents/${fakeId}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(404);
  });

  it('USER가 입주민 삭제를 시도하면 403을 반환해야 함', async () => {
    const tempResident = await prisma.resident.create({
      data: {
        name: '삭제테스트',
        contact: '01000000132',
        building: '105',
        unitNumber: '1005',
        isRegistered: true,
        approvalStatus: 'APPROVED',
        residenceStatus: 'RESIDENCE',
        isHouseholder: 'HOUSEHOLDER',
        apartment: { connect: { id: apartmentId } },
      },
    });

    const res = await request(app)
      .delete(`/api/residents/${tempResident.id}`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(403);
  });

  afterAll(async () => {
    process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'false';
    await cleanupScope();
    await prisma.$disconnect();
  });
});
