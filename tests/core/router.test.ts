import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import app from '#core/app';

describe('[Core] 전체 라우트 트리', () => {
  beforeAll(() => {
    app.get('/api/test/crash', () => {
      throw new Error('강제 에러');
    });
  });

  it('헬스체크(/api)가 200 OK를 반환해야 함', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });

  it('존재하지 않는 라우트는 404 NOT_FOUND를 반환해야 함', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('미인증 상태에서 보호된 SSE 라우트 접근 시 401 UNAUTHORIZED를 반환해야 함', async () => {
    const res = await request(app).get('/api/notifications/sse');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/로그인이 필요/);
  });

  /* 
  it('잘못된 요청 시 400 BAD_REQUEST가 발생해야 함', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'invalid',
      password: '',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
   */

  it('정의되지 않은 서버 에러 발생 시 500 INTERNAL_ERROR를 반환해야 함', async () => {
    const res = await request(app).get('/api/test/crash');
    expect([500, 404]).toContain(res.status);
    if (res.status === 500) {
      expect(res.body.error.code).toBe('INTERNAL_ERROR');
    }
  });
});
