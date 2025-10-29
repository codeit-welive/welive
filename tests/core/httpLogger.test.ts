import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import express from 'express';
import httpLogger from '#core/httpLogger';

describe('[Core] HTTP Logger (morgan + pino)', () => {
  const logPath = path.resolve('logs', 'access.log');
  let app: express.Express;

  beforeAll(() => {
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
    app = express();
    app.use(httpLogger);
    app.get('/ping', (_req, res) => res.status(200).json({ ok: true }));
  });

  it('HTTP 요청 시 로그 파일에 기록되어야 함', async () => {
    await request(app).get('/ping');
    const exists = fs.existsSync(logPath);
    expect(exists).toBe(true);

    const content = fs.readFileSync(logPath, 'utf-8');
    expect(content).toMatch(/\[HTTP\] GET \/ping 200/);
  });

  afterAll(() => {
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
  });
});
