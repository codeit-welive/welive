import request from 'supertest';
import app from '#core/app';
import prisma from '#core/prisma';
import { generateAccessToken } from '#modules/auth/utils/tokenUtils';
import { UserRole, ComplaintStatus, JoinStatus } from '@prisma/client';
process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'true';

describe('[Complaints] 통합 테스트', () => {
  let adminToken: string;
  let userToken: string;
  let boardComplaintId: string;
  let apartmentId: string;
  let complaintId: string;

  beforeAll(async () => {
    await prisma.$transaction([
      prisma.event.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.comment.deleteMany(),
      prisma.pollVote.deleteMany(),
      prisma.pollOption.deleteMany(),
      prisma.poll.deleteMany(),
      prisma.complaint.deleteMany(),
      prisma.notice.deleteMany(),
      prisma.board.deleteMany(),
      prisma.resident.deleteMany(),
      prisma.user.deleteMany(),
      prisma.apartment.deleteMany(),
    ]);

    const apt = await prisma.apartment.create({
      data: {
        apartmentName: 'ComplaintTest',
        apartmentAddress: 'Seoul',
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

    const boardComplaint = await prisma.board.create({
      data: {
        type: 'COMPLAINT',
        apartment: { connect: { id: apartmentId } },
      },
    });
    boardComplaintId = boardComplaint.id;

    // 승인 및 등록된 resi 생성
    const resident = await prisma.resident.create({
      data: {
        name: '일반유저',
        contact: '01033334444',
        building: '101',
        unitNumber: '1001',
        apartment: { connect: { id: apartmentId } },
        isRegistered: true,
        approvalStatus: 'APPROVED',
        residentStatus: 'RESIDENCE',
        isHouseholder: 'HOUSEHOLDER',
      },
    });

    const user = await prisma.user.create({
      data: {
        username: 'normal_user',
        password: 'pw',
        contact: '01033334444',
        name: '일반유저',
        email: 'user@test.com',
        role: 'USER',
        avatar: 'https://test.com/user.png',
        resident: { connect: { id: resident.id } },
      },
    });

    const admin = await prisma.user.create({
      data: {
        username: 'admin_user',
        password: 'pw',
        contact: '01011112222',
        name: '관리자',
        email: 'admin@test.com',
        role: 'ADMIN',
        avatar: 'https://test.com/admin.png',
      },
    });

    // 관리자 연결
    await prisma.apartment.update({
      where: { id: apartmentId },
      data: { admin: { connect: { id: admin.id } } },
    });

    // 토큰
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
   * POST
   */
  it('USER가 민원을 등록하면 201과 성공 메시지를 반환해야 함', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Cookie', [`access_token=${userToken}`])
      .send({
        title: '202호 내쫓아주세요',
        content: '202호 안 내쫓으면 제가 직접 손보겠습니다.',
        isPublic: true,
        boardId: boardComplaintId,
        status: 'PENDING',
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: '정상적으로 등록 처리되었습니다.' });

    const created = await prisma.complaint.findFirst({ where: { title: '202호 내쫓아주세요' } });
    expect(created).not.toBeNull();
    complaintId = created!.id;
  });

  /**
   * 2. GET /api/complaints
   */
  it('ADMIN이 전체 민원 목록을 조회하면 complaints 배열을 반환해야 함', async () => {
    const res = await request(app)
      .get('/api/complaints?page=1&limit=10')
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('complaints');
    expect(Array.isArray(res.body.complaints)).toBe(true);
    expect(res.body).toHaveProperty('totalCount');
  });

  /**
   * 3. GET /api/complaints/:id
   */
  it('USER가 본인 민원 상세를 조회하면 200과 상세 데이터를 반환해야 함', async () => {
    const res = await request(app)
      .get(`/api/complaints/${complaintId}`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('complaintId', complaintId);
    expect(res.body).toHaveProperty('title', '202호 내쫓아주세요');
    expect(res.body).toHaveProperty('status');
  });

  /**
   * 4. PATCH /api/complaints/:id
   */
  it('USER가 민원을 수정하면 200과 수정된 정보를 반환해야 함', async () => {
    const res = await request(app)
      .patch(`/api/complaints/${complaintId}`)
      .set('Cookie', [`access_token=${userToken}`])
      .send({
        title: '엘리베이터 고장 신고',
        content: '2층 엘리베이터가 작동하지 않습니다.',
        isPublic: true,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title', '엘리베이터 고장 신고');
  });

  /**
   * 5. PATCH /api/complaints/:id/status
   */
  it('ADMIN이 민원 상태를 변경하면 200과 수정된 상태를 반환해야 함', async () => {
    const res = await request(app)
      .patch(`/api/complaints/${complaintId}/status`)
      .set('Cookie', [`access_token=${adminToken}`])
      .send({ status: ComplaintStatus.RESOLVED });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', ComplaintStatus.RESOLVED);
  });

  /**
   * 6. DELETE /api/complaints/:id
   */
  it('ADMIN이 민원을 삭제하면 200과 성공 메시지를 반환해야 함', async () => {
    const res = await request(app)
      .delete(`/api/complaints/${complaintId}`)
      .set('Cookie', [`access_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: '정상적으로 삭제 처리되었습니다.' });

    // DB 확인
    const exists = await prisma.complaint.findUnique({ where: { id: complaintId } });
    expect(exists).toBeNull();
  });

  /**
   * 7. 기타
   */
  it('USER가 다른 아파트의 게시판에 민원 등록 시 403을 반환해야 함', async () => {
    // 잘못된 boardId 사용
    const fakeBoard = await prisma.board.create({
      data: {
        type: 'COMPLAINT',
        apartment: {
          create: {
            apartmentName: 'OtherAPT',
            apartmentAddress: 'Busan',
            startComplexNumber: '1',
            endComplexNumber: '10',
            startDongNumber: '101',
            endDongNumber: '110',
            startFloorNumber: '1',
            endFloorNumber: '15',
            startHoNumber: '1',
            endHoNumber: '10',
          },
        },
      },
    });

    const res = await request(app)
      .post('/api/complaints')
      .set('Cookie', [`access_token=${userToken}`])
      .send({
        title: '다른 아파트 민원',
        content: '다른 아파트에 민원 등록 시도',
        isPublic: true,
        boardId: fakeBoard.id,
      });

    expect(res.status).toBe(403);
  });

  it('USER가 본인이 아닌 민원을 수정하면 403을 반환해야 함', async () => {
    // 다른 사용자 민원 생성
    const otherUser = await prisma.user.create({
      data: {
        username: 'other_user',
        password: 'pw',
        contact: '01055556666',
        name: '다른유저',
        email: 'other@test.com',
        role: 'USER',
        avatar: 'd',
      },
    });

    const otherComplaint = await prisma.complaint.create({
      data: {
        title: '타유저 민원',
        content: '타유저 전용',
        isPublic: true,
        status: 'PENDING',
        user: { connect: { id: otherUser.id } },
        board: { connect: { id: boardComplaintId } },
      },
    });

    const res = await request(app)
      .patch(`/api/complaints/${otherComplaint.id}`)
      .set('Cookie', [`access_token=${userToken}`])
      .send({ title: '수정 시도' });

    expect(res.status).toBe(403);
  });

  it('USER가 PENDING이 아닌 민원을 삭제하려 하면 403을 반환해야 함', async () => {
    const nonPending = await prisma.complaint.create({
      data: {
        title: '완료된 민원',
        content: '이미 해결됨',
        isPublic: true,
        status: 'IN_PROGRESS',
        user: {
          connect: {
            username: 'normal_user',
          },
        },
        board: {
          connect: { id: boardComplaintId },
        },
      },
    });

    const res = await request(app)
      .delete(`/api/complaints/${nonPending.id}`)
      .set('Cookie', [`access_token=${userToken}`]);

    expect(res.status).toBe(403);
  });

  it('ADMIN이 관리 아파트가 아닌 민원을 수정하려 하면 403을 반환해야 함', async () => {
    const anotherAdmin = await prisma.user.create({
      data: {
        username: 'other_admin',
        password: 'pw',
        contact: '01077778888',
        name: '다른관리자',
        email: 'otheradmin@test.com',
        role: 'ADMIN',
        avatar: 'd',
      },
    });

    const otherApt = await prisma.apartment.create({
      data: {
        apartmentName: 'AnotherAPT',
        apartmentAddress: 'Incheon',
        startComplexNumber: '1',
        endComplexNumber: '10',
        startDongNumber: '101',
        endDongNumber: '110',
        startFloorNumber: '1',
        endFloorNumber: '15',
        startHoNumber: '1',
        endHoNumber: '10',
        admin: { connect: { id: anotherAdmin.id } },
      },
    });

    const otherBoard = await prisma.board.create({
      data: { type: 'COMPLAINT', apartment: { connect: { id: otherApt.id } } },
    });

    const otherComplaint = await prisma.complaint.create({
      data: {
        title: '타 아파트 민원',
        content: '관리 권한 없음',
        isPublic: true,
        status: 'PENDING',
        board: { connect: { id: otherBoard.id } },
        user: {
          create: {
            username: 'temp_user',
            password: 'pw',
            contact: '01099998888',
            name: '임시유저',
            email: 'temp@test.com',
            role: 'USER',
            avatar: 'a',
          },
        },
      },
    });

    const res = await request(app)
      .patch(`/api/complaints/${otherComplaint.id}/status`)
      .set('Cookie', [`access_token=${adminToken}`])
      .send({ status: ComplaintStatus.RESOLVED });

    expect(res.status).toBe(403);
  });

  afterAll(async () => {
    process.env.__SKIP_GLOBAL_DB_CLEANUP__ = 'false';
    await prisma.$disconnect();
  });
});
