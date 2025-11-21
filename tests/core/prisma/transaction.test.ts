/**
 * @file tests/core/prisma/transaction.test.ts
 * @description Prisma Transaction 커밋/롤백 검증 테스트
 */

import prisma from '#core/prisma';

describe('[Prisma][Transaction] 복합 생성 커밋/롤백', () => {
  const TEST_APARTMENT_NAMES = ['Transaction', 'Transaction-Rollback'];
  const TEST_USER_EMAILS = ['transaction1@test.com', 'transaction2@test.com'];

  const cleanupTestData = async () => {
    await prisma.$transaction([
      prisma.user.deleteMany({
        where: {
          email: { in: TEST_USER_EMAILS },
        },
      }),
      prisma.resident.deleteMany({
        where: {
          apartment: {
            apartmentName: { in: TEST_APARTMENT_NAMES },
          },
        },
      }),
      prisma.apartment.deleteMany({
        where: {
          apartmentName: { in: TEST_APARTMENT_NAMES },
        },
      }),
    ]);
  };

  beforeAll(async () => {
    await cleanupTestData();
  });

  it('정상 트랜잭션 시 모두 커밋되어야 함', async () => {
    await prisma.$transaction(async (tx) => {
      const apt = await tx.apartment.create({
        data: {
          apartmentName: 'Transaction',
          apartmentAddress: 'Seoul',
          startComplexNumber: '1',
          endComplexNumber: '1',
          startDongNumber: '101',
          endDongNumber: '101',
          startFloorNumber: '1',
          endFloorNumber: '10',
          startHoNumber: '1',
          endHoNumber: '10',
        },
      });

      // FK user.residentID → user.create에서 resident 중첩 생성
      await tx.user.create({
        data: {
          username: 'user_transaction_success',
          password: 'pw',
          contact: '01000000011',
          name: '이아무개',
          email: 'transaction1@test.com',
          avatar: 'img',
          resident: {
            create: {
              name: '이아무개',
              contact: '01000000011',
              building: '101',
              unitNumber: '101',
              apartment: { connect: { id: apt.id } },
            },
          },
        },
      });
    });

    const result = await Promise.all([
      prisma.user.count({ where: { username: 'user_transaction_success' } }),
      prisma.resident.count({ where: { building: '101', unitNumber: '101' } }),
      prisma.apartment.count({ where: { apartmentName: 'Transaction' } }),
    ]);
    expect(result).toEqual([1, 1, 1]);
  });

  it('트랜잭션 내부 오류 발생 시 전체 롤백되어야 함', async () => {
    try {
      await prisma.$transaction(async (tx) => {
        const apt = await tx.apartment.create({
          data: {
            apartmentName: 'Transaction-Rollback',
            apartmentAddress: 'TX_Seoul',
            startComplexNumber: '1',
            endComplexNumber: '1',
            startDongNumber: '101',
            endDongNumber: '101',
            startFloorNumber: '1',
            endFloorNumber: '10',
            startHoNumber: '1',
            endHoNumber: '10',
          },
        });

        // 1. 정상 유저 생성
        await tx.user.create({
          data: {
            username: 'user_transaction_fail1',
            password: 'pw',
            contact: '01000000012',
            name: '정상',
            email: 'transaction2@test.com',
            avatar: 'img',
            resident: {
              create: {
                name: '정상',
                contact: '01000000012',
                building: '201',
                unitNumber: '101',
                apartment: { connect: { id: apt.id } },
              },
            },
          },
        });

        // 2. 이메일 재사용 → 에러
        await tx.user.create({
          data: {
            username: 'user_transaction_fail2',
            password: 'pw',
            contact: '01000000013',
            name: '실패',
            email: 'transaction2@test.com',
            avatar: 'img',
          },
        });
      });
    } catch {
      // swallow
    }
    const result = await Promise.all([
      prisma.user.count({
        where: { OR: [{ username: 'user_transaction_fail1' }, { username: 'user_transaction_fail2' }] },
      }),
      prisma.resident.count({ where: { OR: [{ building: '201', unitNumber: '101' }] } }),
      prisma.apartment.count({ where: { apartmentName: 'Transaction-Rollback' } }),
    ]);
    expect(result).toEqual([0, 0, 0]);
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });
});
