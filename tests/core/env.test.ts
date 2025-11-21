import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const originalEnv = { ...process.env };

describe('[Core] 환경 변수 검증', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv }; // 초기 상태로 복원
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('환경 변수 누락 시 예외를 발생시켜야 함', () => {
    process.env.SKIP_DOTENV = 'true';

    // 필수값 제거로 실패 유도
    delete process.env.DATABASE_URL;

    expect(() => {
      require('#core/env');
    }).toThrow();
  });

  it('필수 환경 변수가 모두 존재하면 정상적으로 통과해야 함', () => {
    process.env.SKIP_DOTENV = 'true';

    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    process.env.PORT = '3001';
    process.env.BASE_URL = 'http://localhost:3001';
    process.env.FRONT_URL = 'http://localhost:3000';
    process.env.CORS_ORIGIN = '*';
    process.env.ACCESS_TOKEN_SECRET = 'abcdefghij';
    process.env.REFRESH_TOKEN_SECRET = 'abcdefghijk';
    process.env.PASSWORD_PEPPER = 'abcdefghijkl';
    process.env.DEFAULT_AVATAR_URL = 'https://test.com';

    expect(() => {
      const env = require('#core/env').default;
      expect(env.PORT).toBe(3001);
    }).not.toThrow();
  });
});
