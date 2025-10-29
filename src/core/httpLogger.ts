/**
 * @file #core/httpLogger.ts
 * @description HTTP 요청 로깅용 모듈 (morgan + pino)
 */

import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import { logger } from '#core/logger';

/**
 * 로그 파일 경로 설정
 */
const logDir = path.resolve('logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });

/**
 * 로그 포맷 정의
 * @example
 * 2025-10-29 11:03:01 [HTTP] GET /api/users 200 45ms - 123b
 */
const format = ':date[iso] [HTTP] :method :url :status :response-time ms - :res[content-length]';

/**
 * Morgan 미들웨어 생성
 * - 콘솔: Pino logger와 함께 출력
 * - 파일: logs/access.log에 저장
 */
const httpLogger = morgan(format, {
  stream: {
    write: (message: string) => {
      // 콘솔
      logger.http.info(message.trim());

      // 파일
      accessLogStream.write(message);
    },
  },
});

export default httpLogger;
