/**
 * @file tests/modules/residents/residents.file.test.ts
 * @description Residents 파일 관련 통합 테스트 (템플릿/CSV 업로드/다운로드)
 */

import request from 'supertest';
import app from '#core/app';
import prisma from '#core/prisma';
import { generateAccessToken } from '#modules/auth/utils/tokenUtils';
import { UserRole, JoinStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'true';

const TEST_APARTMENT_NAME = 'ResidentFileAPT';
const ADMIN_EMAIL = 'resident_file_admin@test.com';
const USER_EMAIL = 'resident_file_user@test.com';
const NO_APT_ADMIN_EMAIL = 'resident_file_noapt_admin@test.com';

const TEMPLATE_DIR = path.resolve(process.cwd(), 'public', 'templates');
const TEMPLATE_FILENAME = 'residents_template.csv';
const TEMPLATE_PATH = path.join(TEMPLATE_DIR, TEMPLATE_FILENAME);

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
          in: [ADMIN_EMAIL, USER_EMAIL, NO_APT_ADMIN_EMAIL],
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

describe('[Residents-File] 통합 테스트', () => {
  let adminToken: string;
  let userToken: string;
  let noAptAdminToken: string;
  let apartmentId: string;

  // 테스트를 위해 직접 템플릿 파일을 생성했는지 여부 (기존 파일 보호용)
  let createdTemplateForTest = false;

  beforeAll(async () => {
    await cleanupScope();

    // 템플릿 파일 보장
    if (!fs.existsSync(TEMPLATE_DIR)) {
      fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
    }
    if (!fs.existsSync(TEMPLATE_PATH)) {
      fs.writeFileSync(TEMPLATE_PATH, '동,호수,이름,연락처,세대주여부\r\n', { encoding: 'utf-8' });
      createdTemplateForTest = true;
    }

    // 아파트 생성
    const apt = await prisma.apartment.create({
      data: {
        apartmentName: TEST_APARTMENT_NAME,
        apartmentAddress: 'Resident_File_Seoul',
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

    // ADMIN 생성
    const admin = await prisma.user.create({
      data: {
        username: 'resident_file_admin',
        password: 'pw',
        contact: '01000000141',
        name: '파일관리자',
        email: ADMIN_EMAIL,
        role: UserRole.ADMIN,
        avatar: 'fa',
      },
    });

    await prisma.apartment.update({
      where: { id: apartmentId },
      data: { admin: { connect: { id: admin.id } } },
    });

    // USER + Resident (파일 권한 테스트용)
    const residentForUser = await prisma.resident.create({
      data: {
        name: '파일유저',
        contact: '01000000142',
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
        username: 'resident_file_user',
        password: 'pw',
        contact: '01000000143',
        name: '파일유저',
        email: USER_EMAIL,
        role: UserRole.USER,
        avatar: 'fu',
        resident: { connect: { id: residentForUser.id } },
      },
    });

    // CSV 다운로드 시 실제 데이터가 있도록 추가 Resident 생성
    await prisma.resident.create({
      data: {
        name: 'CSV대상입주민',
        contact: '01000000144',
        building: '102',
        unitNumber: '1002',
        isRegistered: true,
        approvalStatus: 'APPROVED',
        residenceStatus: 'RESIDENCE',
        isHouseholder: 'HOUSEHOLDER',
        apartment: { connect: { id: apartmentId } },
      },
    });

    // 관리 아파트 없는 ADMIN
    const noAptAdmin = await prisma.user.create({
      data: {
        username: 'resident_file_noapt_admin',
        password: 'pw',
        contact: '01000000145',
        name: '무아파트관리자',
        email: NO_APT_ADMIN_EMAIL,
        role: UserRole.ADMIN,
        avatar: 'na',
      },
    });

    // 토큰 발급
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

    noAptAdminToken = generateAccessToken({
      id: noAptAdmin.id,
      role: UserRole.ADMIN,
      joinStatus: JoinStatus.APPROVED,
      isActive: true,
    });
  });

  /**
   * 1. GET /api/residents/file/template
   */
  it('ADMIN이 입주민 템플릿 CSV를 다운로드하면 200과 적절한 헤더를 반환해야 함', async () => {
    const res = await request(app)
      .get('/api/residents/file/template')
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain(encodeURIComponent('입주민명부_템플릿.csv'));
  });

  it('USER가 템플릿 파일 다운로드를 시도하면 403을 반환해야 함', async () => {
    const res = await request(app)
      .get('/api/residents/file/template')
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(403);
  });

  it('비로그인 사용자가 템플릿 파일 다운로드를 시도하면 401을 반환해야 함', async () => {
    const res = await request(app).get('/api/residents/file/template');

    expect(res.status).toBe(401);
  });

  /**
   * 2. GET /api/residents/file (CSV 다운로드)
   */
  it('ADMIN이 입주민 목록 CSV를 다운로드하면 200과 text/csv 헤더 및 데이터가 포함되어야 함', async () => {
    const res = await request(app)
      .get('/api/residents/file?page=1&limit=10')
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');

    const text = res.text.replace(/^\uFEFF/, '');
    const lines = text.split('\r\n').filter(Boolean);

    // 헤더 확인
    expect(lines[0]).toBe('동,호수,이름,연락처,세대주여부');
    // 최소 1명 이상 존재해야 함
    expect(lines.length).toBeGreaterThan(1);
  });

  it('ADMIN이 결과가 없는 조건(building 필터)으로 CSV를 다운로드하면 헤더만 포함해야 함', async () => {
    const res = await request(app)
      .get('/api/residents/file?page=1&limit=10&building=999')
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);

    const text = res.text.replace(/^\uFEFF/, '');
    const lines = text.split('\r\n').filter(Boolean);

    expect(lines[0]).toBe('동,호수,이름,연락처,세대주여부');
    expect(lines.length).toBe(1); // 헤더만
  });

  it('USER가 입주민 목록 CSV를 다운로드하면 403을 반환해야 함', async () => {
    const res = await request(app)
      .get('/api/residents/file?page=1&limit=10')
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(403);
  });

  /**
   * 3. POST /api/residents/from-file (CSV 업로드)
   */
  it('ADMIN이 헤더만 있는 CSV를 업로드해도 201과 count=0을 반환해야 함', async () => {
    const csvHeaderOnly = '동,호수,이름,연락처,세대주여부\r\n';

    const res = await request(app)
      .post('/api/residents/from-file')
      .set('Cookie', [`access_token=${adminToken}`])
      .attach('file', Buffer.from(csvHeaderOnly, 'utf-8'), 'residents.csv');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('count');
    expect(typeof res.body.count).toBe('number');
  });

  it('ADMIN이 유효한 CSV(1명)를 업로드하면 201과 count>=1을 반환하고 DB에 반영되어야 함', async () => {
    const csv = ['동,호수,이름,연락처,세대주여부', '109,1901,CSV신규,01000000146,세대주'].join('\r\n');

    const res = await request(app)
      .post('/api/residents/from-file')
      .set('Cookie', [`access_token=${adminToken}`])
      .attach('file', Buffer.from(csv, 'utf-8'), 'residents.csv');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('count');
    expect(res.body.count).toBeGreaterThanOrEqual(1);

    const created = await prisma.resident.findFirst({
      where: {
        apartmentId,
        building: '109',
        unitNumber: '1901',
        contact: '01000000146',
      },
    });
    expect(created).not.toBeNull();
  });

  it('CSV 업로드 시 파일이 첨부되지 않으면 400을 반환해야 함', async () => {
    const res = await request(app)
      .post('/api/residents/from-file')
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(400);
  });

  it('CSV 업로드 시 확장자가 csv가 아니면 400을 반환해야 함', async () => {
    const csvHeaderOnly = '동,호수,이름,연락처,세대주여부\r\n';

    const res = await request(app)
      .post('/api/residents/from-file')
      .set('Cookie', [`access_token=${adminToken}`])
      .attach('file', Buffer.from(csvHeaderOnly, 'utf-8'), 'residents.txt');

    expect(res.status).toBe(400);
  });

  it('CSV 업로드 시 헤더 개수가 부족하면 400을 반환해야 함', async () => {
    const wrongCsv = '잘못된1,잘못된2\r\n';

    const res = await request(app)
      .post('/api/residents/from-file')
      .set('Cookie', [`access_token=${adminToken}`])
      .attach('file', Buffer.from(wrongCsv, 'utf-8'), 'residents.csv');

    expect(res.status).toBe(400);
  });

  it('CSV 업로드 시 헤더 개수는 맞지만 일부 필드가 누락되면 400을 반환해야 함', async () => {
    // CSV_HEADERS 길이는 맞추고, 세대주여부 대신 잘못된 헤더를 넣음
    const wrongHeaderSameLength = '동,호수,이름,연락처,잘못된헤더\r\n109,1902,헤더오류,01000000147,세대주\r\n';

    const res = await request(app)
      .post('/api/residents/from-file')
      .set('Cookie', [`access_token=${adminToken}`])
      .attach('file', Buffer.from(wrongHeaderSameLength, 'utf-8'), 'residents.csv');

    expect(res.status).toBe(400);
  });

  it('USER가 CSV 업로드를 시도하면 403을 반환해야 함', async () => {
    const csvHeaderOnly = '동,호수,이름,연락처,세대주여부\r\n';

    const res = await request(app)
      .post('/api/residents/from-file')
      .set('Cookie', [`access_token=${userToken}`])
      .attach('file', Buffer.from(csvHeaderOnly, 'utf-8'), 'residents.csv');

    expect(res.status).toBe(403);
  });

  it('관리 아파트가 없는 ADMIN이 CSV 업로드를 시도하면 404를 반환해야 함', async () => {
    const csvHeaderOnly = '동,호수,이름,연락처,세대주여부\r\n';

    const res = await request(app)
      .post('/api/residents/from-file')
      .set('Cookie', [`access_token=${noAptAdminToken}`])
      .attach('file', Buffer.from(csvHeaderOnly, 'utf-8'), 'residents.csv');

    expect(res.status).toBe(404);
  });

  afterAll(async () => {
    process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'false';
    await cleanupScope();
    await prisma.$disconnect();

    // 테스트로 생성한 템플릿 정리 (기존 템플릿은 건드리지 않음)
    if (createdTemplateForTest && fs.existsSync(TEMPLATE_PATH)) {
      fs.unlinkSync(TEMPLATE_PATH);
    }
  });
});
