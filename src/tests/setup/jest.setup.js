const prisma = require('#core/prisma.ts').default;

afterEach(async () => {
  //await prisma.().deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});
