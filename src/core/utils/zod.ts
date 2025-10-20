import { ZodError } from 'zod';
import type { NextFunction } from 'express';
import ApiError from '#errors/ApiError';

/**
 * 주어진 에러가 ZodError라면 에러 메시지를 포맷팅하여
 * ApiError(400)로 감싸 next()로 전달합니다.
 * ZodError가 아니라면 원본 에러를 그대로 next()로 전달합니다.
 *
 * @param {unknown} err - try/catch 블록에서 잡힌 에러 객체
 * @param {string} context - 에러 메시지에 포함할 컨텍스트
 * @param {NextFunction} next - Express의 next 함수
 *
 * @example
 * import { forwardZodError } from '#utils/zod';
 *
 * export const validateProductCreate: RequestHandler = (req, _res, next) =>
 *  const parsedBody = {
 *    ...req, body,
 *    price: req.body.price !== undefined ? Number(req.body.price) : undefined;
 *  };
 *
 *  try {
 *    productCreateSchema.parse(parsedBody);
 *    next();
 *  } catch (err) {
 *    return forwardZodError(err, '상품 등록', next);\
 *  }
 * };
 *
 */
const forwardZodError = (err: unknown, context: string, next: NextFunction) => {
  if (err instanceof ZodError) {
    const messages = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return next(new ApiError(400, `${context} 유효성 검사 실패: ${messages}`));
  }
  return next(err as Error);
};

export default forwardZodError;
