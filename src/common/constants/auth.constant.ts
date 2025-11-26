/**
 * 기본 이미지 상수
 */
export const DEFAULT_AVATAR = 'default-avatar.png';

/**
 * 계정 검증 관련 상수
 */
export const ACCOUNT_VALIDATION = {
  /** 이름 최소 길이 */
  NAME_MIN_LENGTH: 2,
  /** 이름 최대 길이 */
  NAME_MAX_LENGTH: 20,
  /** 아이디 최소 길이 */
  USERNAME_MIN_LENGTH: 5,
  /** 아이디 최대 길이 */
  USERNAME_MAX_LENGTH: 30,
  /** 비밀번호 최소 길이 */
  PASSWORD_MIN_LENGTH: 8,
  /** 비밀번호 최대 길이 */
  PASSWORD_MAX_LENGTH: 100,
  /** 전화번호 최소 길이 */
  CONTACT_MIN_LENGTH: 10,
  /** 전화번호 최대 길이 */
  CONTACT_MAX_LENGTH: 15,
} as const;

/**
 * 아파트 검증 관련 상수
 */
export const APARTMENT_VALIDATION = {
  /** 아파트 이름 최대 길이 */
  APARTMENT_NAME_MAX_LENGTH: 100,
  /** 관리번호 최소 길이 */
  OFFICE_NUMBER_MIN_LENGTH: 10,
  /** 관리번호 최대 길이 */
  OFFICE_NUMBER_MAX_LENGTH: 15,
} as const;

/**
 * 회원 가입 알림 설정
 * @description 민원 상태 변경 시 작성자에게 전송되는 알림 메시지 및 타입
 */
export const SIGN_UP_NOTIFICATIONS = {
  ADMIN: {
    type: 'SIGNUP_REQ' as const,
    content: '회원 가입 요청이 접수되었습니다.',
  },
  USER: {
    type: 'SIGNUP_REQ' as const,
    content: '회원 가입 요청이 접수되었습니다.',
  },
} as const;
