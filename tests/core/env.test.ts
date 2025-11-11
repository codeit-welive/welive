import { describe, it, expect } from '@jest/globals';

describe('[Core] 환경 변수 검증', () => {
  it('환경 변수 누락 시 예외를 발생시켜야 함', async () => {
    jest.resetModules();
    process.env = { SKIP_DOTENV: 'true' }; // 강제로 dotenv 비활성화

    expect(() => {
      require('#core/env');
    }).toThrow();
  });

  it('필수 환경 변수가 모두 존재하면 정상적으로 통과해야 함', async () => {
    jest.resetModules();

    // 최소한의 유효 env 세트 구성
    process.env = {
      DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
      PORT: '3001',
      BASE_URL: 'http://localhost:3001',
      FRONT_URL: 'http://localhost:3000',
      NODE_ENV: 'test',
      CORS_ORIGIN: '*',
      ACCESS_TOKEN_SECRET: 'abcdefghij', // zod에서 최소 길이 10 이상
      REFRESH_TOKEN_SECRET: 'abcdefghijk',
      PASSWORD_PEPPER: 'abcdefghijkl',
      DEFAULT_AVATAR_URL: 'https://test.com',

      SKIP_DOTENV: 'true',
    };

    expect(() => {
      const env = require('../../src/core/env').default;
      expect(env.PORT).toBe(3001);
    }).not.toThrow();
  });
});
