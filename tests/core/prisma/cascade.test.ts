/**
 * @file tests/core/prisma/cascade.test.ts
 * @description Prisma Cascade 동작 검증 테스트
 */

import prisma from '#core/prisma';

describe('[Prisma][Cascade] Apartment 삭제 시 종속 데이터 자동 삭제', () => {
  const APT_NAME = 'CascadeTestAPT';

  const cleanupScope = async () => {
    await prisma.$transaction([
      prisma.complaint.deleteMany({
        where: { apartment: { apartmentName: APT_NAME } },
      }),
      prisma.notice.deleteMany({
        where: { apartment: { apartmentName: APT_NAME } },
      }),
      prisma.board.deleteMany({
        where: { apartment: { apartmentName: APT_NAME } },
      }),
      prisma.resident.deleteMany({
        where: { apartment: { apartmentName: APT_NAME } },
      }),
      prisma.user.deleteMany({
        where: {
          email: {
            in: ['cascade_notice@test.com', 'cascade_complaint@test.com'],
          },
        },
      }),
      prisma.apartment.deleteMany({
        where: { apartmentName: APT_NAME },
      }),
    ]);
  };

  beforeAll(async () => {
    await cleanupScope();
  });

  it('Apartment 삭제 시 Resident/Notice/Complaint가 0건이어야 함', async () => {
    // 1. apartment 생성
    const apt = await prisma.apartment.create({
      data: {
        apartmentName: APT_NAME,
        apartmentAddress: 'Cascade_Seoul',
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
    const apartmentId = apt.id;

    // 2. 연동 Board 생성 (Notice/Complaint)
    const [boardNotice, boardComplaint] = await prisma.$transaction([
      prisma.board.create({
        data: {
          type: 'NOTICE',
          apartment: { connect: { id: apartmentId } },
        },
      }),
      prisma.board.create({
        data: {
          type: 'COMPLAINT',
          apartment: { connect: { id: apartmentId } },
        },
      }),
    ]);

    // 3. Resident/Notice/Complaint 생성
    await prisma.$transaction(async (tx) => {
      await tx.resident.create({
        data: {
          name: '김아무개',
          contact: '01000000001',
          building: '101',
          unitNumber: '101',
          apartment: { connect: { id: apartmentId } },
        },
      });

      await tx.notice.create({
        data: {
          title: '승강기 점검 안내',
          content: '10월 29일 10~13시 승강기 점검이 있습니다.',
          category: 'COMMUNITY',
          board: { connect: { id: boardNotice.id } },
          apartment: { connect: { id: apartmentId } },
          user: {
            create: {
              username: 'user_notice',
              password: 'password1!',
              contact: '01000000002',
              name: '공지관리자',
              email: 'cascade_notice@test.com',
              avatar: 'https://test.com/avatar/notice.png',
            },
          },
        },
      });

      await tx.complaint.create({
        data: {
          title: '골반이 멈추지 않아요',
          content: '제 골반이 멈추지 않는 탓이 뭘까요? ㅜ.ㅜ',
          board: { connect: { id: boardComplaint.id } },
          apartment: { connect: { id: apartmentId } },
          user: {
            create: {
              username: 'user_complaint',
              password: 'password2@',
              contact: '01000000003',
              name: '민원작성자',
              email: 'cascade_complaint@test.com',
              avatar: 'https://test.com/avatar/complaint.png',
            },
          },
        },
      });
    });

    // 삭제 전 검증
    const [residentsBefore, noticesBefore, complaintsBefore] = await Promise.all([
      prisma.resident.count({ where: { apartmentId } }),
      prisma.notice.count({ where: { apartmentId } }),
      prisma.complaint.count({ where: { apartmentId } }),
    ]);

    expect(residentsBefore).toBe(1);
    expect(noticesBefore).toBe(1);
    expect(complaintsBefore).toBe(1);

    // 4. Apartment 삭제 (cascade 트리거)
    await prisma.apartment.delete({ where: { id: apartmentId } });

    // Cascade 확인
    const [residentsAfter, noticesAfter, complaintsAfter] = await Promise.all([
      prisma.resident.count({ where: { apartmentId } }),
      prisma.notice.count({ where: { apartmentId } }),
      prisma.complaint.count({ where: { apartmentId } }),
    ]);

    expect(residentsAfter).toBe(0);
    expect(noticesAfter).toBe(0);
    expect(complaintsAfter).toBe(0);
  });

  afterAll(async () => {
    await cleanupScope();
    await prisma.$disconnect();
  });
});
