import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import express from 'express';

// 테스트 환경에서 로그 생성 허용
process.env.TEST_ALLOW_ACCESS_LOG = 'true';

describe('[Core] HTTP Logger (morgan + pino)', () => {
  const logPath = path.resolve(process.cwd(), 'logs/access.log');
  let app: express.Express;

  beforeAll(() => {
    // logs 디렉터리 강제 생성
    fs.mkdirSync(path.dirname(logPath), { recursive: true });

    // real writeStream 사용하도록 강제 (mock 충돌 방지)
    const realFs = jest.requireActual('fs');
    (fs as any).createWriteStream = realFs.createWriteStream;

    // 기존 로그 제거
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);

    const httpLogger = require('#core/httpLogger').default;

    app = express();
    app.use(httpLogger);
    app.get('/ping', (_req, res) => res.status(200).json({ ok: true }));
  });

  it('HTTP 요청 시 로그 파일에 기록되어야 함', async () => {
    await request(app).get('/ping');

    // 로그 파일 생성 대기 (최대 3초)
    for (let i = 0; i < 60; i++) {
      if (fs.existsSync(logPath)) break;
      await new Promise((r) => setTimeout(r, 50));
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
