/**
 * 에러 코드 타입 정의
 */
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR';

/**
 * API 에러 클래스
 * - 모든 커스텀 에러는 이 클래스를 사용합니다.
 * - 정적 팩토리 메서드를 통해 에러 객체를 쉽게 생성할 수 있습니다.
 *
 * @example
 * import { RequestHandler } from 'express';
 * import ApiError from '#errors/ApiError';
 * import prisma from '#core/prisma';
 *
 * export const getProject: RequestHandler = async (req, res, next) => {
 *   const projectId = Number(req.params.projectId);
 *
 *   // 잘못된 요청
 *   if (isNaN(projectId)) return next(ApiError.badRequest('projectId가 유효하지 않습니다.'));
 *   const project = await prisma.project.findUnique({
 *     where: { id: projectId },
 *   });
 *
 *   // 리소스 없음
 *   if (!project) return next(ApiError.notFound('해당 프로젝트를 찾을 수 없습니다.'));
 *   res.json({ success: true, data: project });
 * };
 */
export default class ApiError extends Error {
  // HTTP 상태 코드
  statusCode: number;
  // 클라이언트/프론트에서 분기할 수 있는 에러 코드
  code: ErrorCode;
  // 검증 오류 등 추가 디테일 정보 (로그/클라이언트 용)
  details?: unknown;
  // 예상 가능한 비즈니스 에러 여부 (true: 운영상 정상, false: 버그성)
  isOperational: boolean;

  /**
   * ApiError 생성자
   * @param statusCode HTTP 상태 코드
   * @param message 사용자에게 전달할 메시지
   * @param code 기계가 읽을 수 있는 에러 코드
   * @param details 선택적 상세 정보
   * @param isOperational 비즈니스 로직에서 발생한 정상 범위의 에러 여부
   */

  constructor(statusCode: number, message: string, code?: ErrorCode, details?: unknown, isOperational = true) {
    super(message);

    // 상태 코드 자동 매핑
    const fallbackCodeMap: Record<number, ErrorCode> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
    };

    this.statusCode = statusCode;
    this.code = code ?? fallbackCodeMap[statusCode] ?? 'INTERNAL_ERROR';
    this.details = details;
    this.isOperational = isOperational;
    this.name = 'ApiError';

    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * 정적 팩토리 메서드
   */

  static badRequest = (msg = '잘못된 요청입니다.', details?: unknown) => new ApiError(400, msg, 'BAD_REQUEST', details);

  static unauthorized = (msg = '인증이 필요합니다.', details?: unknown) =>
    new ApiError(401, msg, 'UNAUTHORIZED', details);

  static forbidden = (msg = '접근 권한이 없습니다.', details?: unknown) => new ApiError(403, msg, 'FORBIDDEN', details);

  static notFound = (msg = '리소스를 찾을 수 없습니다.', details?: unknown) =>
    new ApiError(404, msg, 'NOT_FOUND', details);

  static conflict = (msg = '리소스 충돌이 발생했습니다.', details?: unknown) =>
    new ApiError(409, msg, 'CONFLICT', details);

  static unprocessable = (msg = '처리할 수 없는 요청입니다.', details?: unknown) =>
    new ApiError(422, msg, 'UNPROCESSABLE', details);

  static tooMany = (msg = '요청이 너무 많습니다.', details?: unknown) =>
    new ApiError(429, msg, 'TOO_MANY_REQUESTS', details);

  static internal = (msg = '서버 내부 오류가 발생했습니다.', details?: unknown) =>
    new ApiError(500, msg, 'INTERNAL_ERROR', details, /* isOperational */ false);
}
