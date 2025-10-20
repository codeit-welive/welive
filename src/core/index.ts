import http from 'http';
import app from '#core/app';
import env from '#core/env';
import prisma from '#core/prisma';
//import pollScheduler from '#crons/pollScheduler';

const PORT = env.PORT || 3000;
const server = http.createServer(app);

/**
 * DB 연결 확인
 */
(async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Failed to connect to database', err);
    process.exit(1);
  }
})();

/**
 * 스케줄러 실행
 */
//pollScheduler.start();

/**
 * 서버 시작
 */
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

/**
 * 비동기 예외 처리
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

/**
 * 미처리 예외 처리
 */
process.on('uncaughtException', (err) => {
  console.error('🚫 Uncaught Exception thrown:', err);
  process.exit(1);
});
