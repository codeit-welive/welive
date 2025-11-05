/**
 * @file user.constants.ts
 * @description User 에러 메시지
 * - 상수는 auth.constants.ts 사용
 */

export const USER_MESSAGES = {
  // 200
  UPDATE_SUCCESS: '님의 정보가 성공적으로 업데이트되었습니다. 다시 로그인해주세요.',

  // 400
  UPDATE_FAILED: '유저 정보 수정 실패',

  // 401
  UNAUTHORIZED: '권한 없음',

  // 403
  FORBIDDEN: '권한 없음',

  // 404
  USER_NOT_FOUND: '사용자를 찾을 수 없음',

  // 500
  INTERNAL_SERVER_ERROR: '서버 내부 오류',

  // 422, fallback
  UNPROCESSABLE: '수정할 항목이 없습니다.',
};
