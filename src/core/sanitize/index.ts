import type { RequestHandler } from 'express';
import { JSDOM } from 'jsdom';
import createDOMPurifyModule from 'isomorphic-dompurify';
import { sanitizeTargets, type SanitizeDomain } from './sanitizeTargets';

const window = new JSDOM('').window as unknown as Window;

const createDOMPurify: any = (createDOMPurifyModule as any).default || createDOMPurifyModule;
const DOMPurify = createDOMPurify(window);

/**
 * 개별 값(문자열, 배열, 객체 등)을 정화(sanitize)하는 재귀 함수
 * - 문자열: DOMPurify로 HTML 태그 및 속성 제거
 * - 배열: 각 요소에 재귀 적용
 * - 객체: 모든 키-값 쌍에 재귀 적용
 *
 * @param {unknown} v - 정화할 값 (str, arr, obj, primitive 등)
 * @returns {unknown} 정화된 값
 */
const sanitizeValue = (v: unknown): unknown => {
  if (typeof v === 'string') return DOMPurify.sanitize(v, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  if (Array.isArray(v)) return v.map(sanitizeValue);
  if (v && typeof v === 'object') {
    const next: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) next[k] = sanitizeValue(val);
    return next;
  }
  return v;
};

/**
 * req.body에서 지정된 필드만 추출하여 sanitize 처리하는 함수
 * - body 객체가 없거나 object 타입이 아닐 경우 무시
 * - sanitizeTargets에 명시된 필드만을 대상으로 함
 *
 * @param {Record<string, unknown>} body - 요청 body(req.body)
 * @param {readonly string[]} fields - sanitize 대상 field 목록
 */
const sanitizePickedFields = (body: any, fields: readonly string[]) => {
  if (!body || typeof body !== 'object') return;
  for (const field of fields) {
    if (field in body) body[field] = sanitizeValue(body[field]);
  }
};

/**
 * Express용 input sanitize 미들웨어 팩토리
 * - domain 이름을 인자로 받아, 해당 domain에 지정된 field를 자동으로 sanitize
 * - authMiddleware와 같은 레벨에서 라우터에 추가하면 됨
 * - 요청 본문(req.body)의 특정 필드를 안전하게 정화하여 XSS를 방지
 *
 * @example
 * import { sanitizeMiddleware } from '#core/sanitize';
 *
 * router.post(
 *   '/',
 *   authMiddleware,
 *   sanitizeMiddleware('complaints'),
 *   controller.createComplaint
 * );
 *
 * @param {SanitizeDomain} domain - sanitize 대상 domain (complaints, comments, etc)
 * @returns {RequestHandler} - Express 미들웨어 함수
 */
const sanitizeMiddleware = (domain: SanitizeDomain): RequestHandler => {
  return (req, _res, next) => {
    const targets = sanitizeTargets[domain];
    if (targets?.length && req.body) sanitizePickedFields(req.body, targets);
    next();
  };
};

export default sanitizeMiddleware;
