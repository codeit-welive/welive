import { PrismaClient } from '@prisma/client';

describe('[Core] Prisma 연결 테스트', () => {
  const VALID_URL = process.env.DATABASE_URL!;
  const INVALID_URL = 'postgresql://invalid:invalid@localhost:9999/fake';

  it('✅ 유효한 DATABASE_URL로 연결 성공', async () => {
    const prisma = new PrismaClient({
      datasources: { db: { url: VALID_URL } },
    });

    await expect(prisma.$connect()).resolves.not.toThrow();
    await prisma.$disconnect();
  });

  it('❌ 잘못된 DATABASE_URL로 예외 발생', async () => {
    const prisma = new PrismaClient({
      datasources: { db: { url: INVALID_URL } },
    });

    await expect(prisma.$connect()).rejects.toThrow();
  });
});
