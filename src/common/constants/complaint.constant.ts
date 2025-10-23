/**
 * 민원 검증 관련 상수
 */
export const COMPLAINT_VALIDATION = {
  /** 제목 최소 길이 */
  TITLE_MIN_LENGTH: 5,
  /** 제목 최대 길이 */
  TITLE_MAX_LENGTH: 50,
  /** 내용 최소 길이 */
  CONTENT_MIN_LENGTH: 10,
  /** 내용 최대 길이 */
  CONTENT_MAX_LENGTH: 255,
} as const;
