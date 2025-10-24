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
  CONTENT_MAX_LENGTH: 2000,
} as const;

/**
 * 민원 에러 메시지
 */
export const COMPLAINT_ERROR_MESSAGES = {
  // 404 Not Found
  COMPLAINT_NOT_FOUND: '민원을 찾을 수 없습니다.',
  BOARD_NOT_FOUND: '게시판을 찾을 수 없습니다.',
  RESIDENT_NOT_FOUND: '거주자 정보를 찾을 수 없습니다.',

  // 403 Forbidden - 권한
  NO_BOARD_PERMISSION: '해당 게시판에 글을 작성할 권한이 없습니다.',
  NO_COMPLAINT_ACCESS: '해당 민원에 접근할 권한이 없습니다.',
  NO_COMPLAINT_PERMISSION: '해당 민원에 대한 권한이 없습니다.',
  NO_ADMIN_PERMISSION: '해당 아파트의 관리자 권한이 없습니다.',
  PRIVATE_COMPLAINT_RESTRICTED: '비공개 민원은 작성자만 조회할 수 있습니다.',

  // 403 Forbidden - 상태 제약
  CANNOT_EDIT_IN_PROGRESS: '처리중이거나 완료된 민원은 수정할 수 없습니다.',
  CANNOT_DELETE_IN_PROGRESS: '처리중이거나 처리완료된 민원은 삭제할 수 없습니다.',

  // 400 Bad Request
  NO_UPDATE_DATA: '수정할 내용이 없습니다.',
} as const;
