/**
 * @file sanitize.ts
 * @description
 * 요청 본문(req.body)에 포함된 특정 필드만을 선별적으로 HTML Sanitizing 하는 미들웨어.
 *
 * ## 주요 목적
 * - 사용자가 입력한 문자열에 포함될 수 있는 위험한 HTML 태그/속성을 제거하여 XSS 공격을 방지.
 * - 도메인별로 sanitize 대상 필드를 명확히 정의(sanitizeTargets)하고,
 *   각 라우터에서 sanitizeMiddleware('comments')처럼 선언형으로 적용.
 * - 검증(Zod) → Sanitize → Controller 의 흐름에서,
 *   컨트롤러 도달 전 입력값이 반드시 정화되도록 설계.
 *
 * ## 동작 방식
 * - sanitizeTargets 에 정의된 필드만 선택적으로 정화.
 * - 문자열: DOMPurify 기반으로 HTML 제거
 * - 배열/객체: 재귀적으로 모든 값에 sanitize 적용
 *
 * ## 기술적 특징
 * - JSDOM / DOMPurify 는 요청 시 최초 1회만 lazy-load 되어 성능 및 빌드 호환성 보장.
 * - Swagger 문서 생성 시 라우터 import 과정에서 sanitize가 초기화되지 않도록 설계됨.
 */

import type { RequestHandler } from 'express';
import { sanitizeTargets, type SanitizeDomain } from './sanitizeTargets';

/**
 * Lazy-loaded DOMPurify instance
 */
let DOMPurify: any = null;

/**
 * DOMPurify 초기화 (lazy)
 * - swagger-autogen(빌드 단계)에서는 jsdom을 실행하면 crash → 동적 import 로 해결
 */
const loadPurifier = async () => {
  if (!DOMPurify) {
    const { JSDOM } = await import('jsdom');
    const createDOMPurifyModule: any = await import('isomorphic-dompurify');

    const window = new JSDOM('').window as unknown as Window;

    const createDOMPurify = (createDOMPurifyModule as any).default || createDOMPurifyModule;

    DOMPurify = createDOMPurify(window);
  }
  return DOMPurify;
};

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
  if (typeof v === 'string') {
    return DOMPurify.sanitize(v, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }
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
  return async (req, _res, next) => {
    const purifier = await loadPurifier();

    const targets = sanitizeTargets[domain];
    if (targets?.length && req.body) {
      // DOMPurify instance 셋업
      DOMPurify = purifier;
      sanitizePickedFields(req.body, targets);
    }
    next();
  };
};

export default sanitizeMiddleware;
