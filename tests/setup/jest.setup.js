// Mock
const fs = require('fs');
const { Writable } = require('stream');

if (!global.__FS_PATCHED__) {
  global.__FS_PATCHED__ = true;

  const origCWS = fs.createWriteStream;

  try {
    fs.mkdirSync('logs', { recursive: true });
  } catch {}

  fs.createWriteStream = function (filePath, options) {
    const target = String(filePath);
    const isAccessLog = /[\\/]logs[\\/]access\.log$/i.test(target);
    const allow = process.env.TEST_ALLOW_ACCESS_LOG === 'true';

    if (isAccessLog && !allow) {
      return new Writable({
        write(_chunk, _enc, cb) {
          cb();
        },
        final(cb) {
          cb();
        },
      });
    }
    return origCWS.call(fs, filePath, options);
  };
}

beforeAll(() => {
  jest.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit called (${code})`);
  });
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

// Prisma
const prisma = require('#core/prisma.ts').default;

afterEach(async () => {
  if (process.env.__SKIP_GLOBAL_DB_CLEANUP__ === 'true') return;

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
});

afterAll(async () => {
  await prisma.$disconnect();
});
