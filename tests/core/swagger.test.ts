import request from 'supertest';
import app from '#core/app';

describe('[Swagger] 문서 접근', () => {
  it('GET /docs - Swagger UI가 정상적으로 노출되어야 함.', async () => {
    const res = await request(app).get('/api/docs').redirects(1);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });
});
