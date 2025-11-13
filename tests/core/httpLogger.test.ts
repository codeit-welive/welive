import path from 'path';
import request from 'supertest';
import { describe, it, expect, beforeAll } from '@jest/globals';
import express from 'express';
import { logger } from '#core/logger';

// 테스트 환경에서 로그 생성 허용
process.env.TEST_ALLOW_ACCESS_LOG = 'true';

describe('[Core] HTTP Logger (morgan + pino)', () => {
  const logPath = path.resolve(process.cwd(), 'logs/access.log');
  let app: express.Express;

  beforeAll(() => {
    // logger.http.info를 spy로 감싸서 호출 여부 검증
    jest.spyOn(logger.http, 'info').mockImplementation(() => {});

    const httpLogger = require('#core/httpLogger').default;

    app = express();
    app.use(httpLogger);
    app.get('/ping', (_req, res) => res.status(200).json({ ok: true }));
  });

  it('HTTP 요청 시 logger.http.info가 호출되어야 함', async () => {
    await request(app).get('/ping');

    // logger.http.info가 로그 메시지를 남겼는지 검증
    expect(logger.http.info).toHaveBeenCalled();

    const callArg = (logger.http.info as jest.Mock).mock.calls[0][0];
    expect(callArg).toMatch(/\[HTTP\] GET \/ping 200/);
  });
});
