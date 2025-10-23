const prisma = require('#core/prisma.ts').default;

afterEach(async () => {
  await prisma.event.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.pollVote.deleteMany({});
  await prisma.pollOption.deleteMany({});
  await prisma.poll.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.notice.deleteMany({});
  await prisma.board.deleteMany({});
  await prisma.resident.deleteMany({});
  await prisma.apartment.deleteMany({});
  await prisma.user.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});
