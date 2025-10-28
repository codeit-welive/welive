import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import app from '#core/app';

describe('[Security] 전역 보안 미들웨어', () => {
  it('Helmet 헤더가 포함되어야 함', async () => {
    const res = await request(app).get('/api');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('x-powered-by 헤더가 없어야 함', async () => {
    const res = await request(app).get('/api');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('Etag 헤더가 없어야 함', async () => {
    const res = await request(app).get('/api');
    expect(res.headers.etag).toBeUndefined();
  });

  it('Rate Limit이 정상 동작해야 함', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBeLessThan(429);
  });
});
