import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import express from 'express';

describe('[Core] HTTP Logger (morgan + pino)', () => {
  const logPath = path.resolve('logs', 'access.log');
  let app: express.Express;

  beforeAll(() => {
    const realFs = jest.requireActual('fs');
    (fs as any).createWriteStream = realFs.createWriteStream;
    process.env.TEST_ALLOW_ACCESS_LOG = 'true';

    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);

    const httpLogger = require('#core/httpLogger').default;

    app = express();
    app.use(httpLogger);
    app.get('/ping', (_req, res) => res.status(200).json({ ok: true }));
  });

  it('HTTP 요청 시 로그 파일에 기록되어야 함', async () => {
    await request(app).get('/ping');

    // 로그 파일 생성 대기 (최대 1초)
    for (let i = 0; i < 10; i++) {
      if (fs.existsSync(logPath)) break;
      await new Promise((r) => setTimeout(r, 100));
    }

    expect(fs.existsSync(logPath)).toBe(true);

    const content = fs.readFileSync(logPath, 'utf-8');
    expect(content).toMatch(/\[HTTP\] GET \/ping 200/);
  });

  afterAll(() => {
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
    delete process.env.TEST_ALLOW_ACCESS_LOG;
  });
});
