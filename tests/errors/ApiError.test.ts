import { describe, it, expect } from '@jest/globals';
import ApiError from '#errors/ApiError';

describe('[Errors] ApiError 클래스', () => {
  it('badRequest()는 400과 BAD_REQUEST 코드를 반환해야 함', () => {
    const err = ApiError.badRequest('잘못된 요청');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.message).toBe('잘못된 요청');
    expect(err.isOperational).toBe(true);
  });

  it('unauthorized()는 401과 UNAUTHORIZED 코드를 반환해야 함', () => {
    const err = ApiError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('internal()은 500, INTERNAL_ERROR 코드 및 isOperational=false여야 함', () => {
    const err = ApiError.internal('서버 오류');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.isOperational).toBe(false);
  });

  it('details 인자가 전달되면 포함되어야 함', () => {
    const detail = { field: 'email' };
    const err = ApiError.badRequest('검증 실패', detail);
    expect(err.details).toEqual(detail);
  });
});
