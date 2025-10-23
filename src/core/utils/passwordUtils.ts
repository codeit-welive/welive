import bcrypt from 'bcrypt';

const COST = 10;
const PEPPER = process.env.PASSWORD_PEPPER ?? '';

/**
 * 문자열을 유니코드 정규화(NFKC) 방식으로 변환합니다.
 * 예: 전각문자/호환문자를 표준 형태로 통일.
 * @param {string} s - 정규화할 문자열
 * @returns {string} - 정규화된 문자열
 */
const normalize = (s: string): string => s.normalize('NFKC');

/**
 * 주어진 평문 비밀번호에 서버 전용 pepper를 추가하고 bcrypt로 해싱합니다.
 * @param {string} plain - 평문 비밀번호
 * @returns {Promise<string>} - bcrypt 해시 문자열
 */
export const hashPassword = async (plain: string): Promise<string> => {
  const salt = await bcrypt.genSalt(COST);
  return bcrypt.hash(`${PEPPER}${normalize(plain)}`, salt);
};

/**
 * 평문 비밀번호를 동일한 방식(pepper+정규화)으로 처리 후 bcrypt 해시와 비교합니다.
 * @param {string} plain - 평문 비밀번호
 * @param {string} hash - DB에 저장된 bcrypt 해시
 * @returns {Promise<boolean>} - 일치 여부 (비교 중 오류 발생 시 false)
 */
export const isPasswordValid = async (plain: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(`${PEPPER}${normalize(plain)}`, hash);
};
