import ApiError from '#errors/ApiError';
import { findDuplicateUser } from '../auth.repo';

export const checkDuplicateUser = async (username: string, email: string, contact: string) => {
  const existingUser = await findDuplicateUser({ username, email, contact });
  if (existingUser) {
    if (existingUser.username === username) {
      throw ApiError.badRequest('이미 사용 중인 아이디입니다.');
    } else if (existingUser.email === email) {
      throw ApiError.badRequest('이미 사용 중인 이메일입니다.');
    } else if (existingUser.contact === contact) {
      throw ApiError.badRequest('이미 사용 중인 연락처입니다.');
    }
  }
  // 중복된 사용자가 없으면 종료
  return;
};
