import http from 'http';
import { execSync } from 'child_process';
import app from '#core/app';
import env from '#core/env';
import prisma from '#core/prisma';
import { logger } from '#core/logger';
import { startAllJobs } from '#jobs/index';

const PORT = env.PORT || 3000;
const server = http.createServer(app);

/**
 * Windows 환경에서만 UTF-8 코드페이지 설정
 */
if (process.platform === 'win32') {
  try {
    execSync('chcp 65001 >NUL', { stdio: 'ignore' });
  } catch (err) {
    console.warn('[WARN] Failed to set code page 65001:', (err as Error).message);
  }
}

/**
 * 유틸
 */
const shutdown = async (code = 0) => {
  await prisma.$disconnect();
  process.exit(code);
};

/**
 * DB 연결 확인
 */
void (async () => {
  try {
    await prisma.$connect();
    logger.system.info('✅ Database connected');
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.system.error(err, '❌ Database connection failed');
    } else {
      logger.system.error(`❌ Database connection failed: ${String(err)}`);
    }
    shutdown(1);
  }
})();

/**
 * 스케줄러 실행
 */
startAllJobs();

/**
 * 서버 시작
 */
server.listen(PORT, () => {
  logger.system.info(`✅ Server running on http://localhost:${PORT}`);
});

server.on('error', async (err) => {
  logger.system.error(err, '❌ Server failed to start');
  shutdown(1);
});

/**
 * 비동기 예외 처리
 */
process.on('unhandledRejection', (reason, promise) => {
  if (reason instanceof Error) {
    logger.system.error(reason, '❌ Unhandled Promise Rejection');
  } else {
    logger.system.error(`❌ Unhandled Promise Rejection: ${String(reason)}`);
  }
});

/**
 * 미처리 예외 처리
 */
process.on('uncaughtException', async (err) => {
  logger.system.error(err, '❌ Uncaught Exception thrown');
  shutdown(1);
});
