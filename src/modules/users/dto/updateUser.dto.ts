/**
 * @file updateUser.dto.ts
 * @description 사용자 정보 수정 DTO
 */

import { z } from 'zod';
import { ACCOUNT_VALIDATION } from '#constants/auth.constant';

export const updateUserSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(
        ACCOUNT_VALIDATION.PASSWORD_MIN_LENGTH,
        `비밀번호는 최소 ${ACCOUNT_VALIDATION.PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`
      )
      .max(
        ACCOUNT_VALIDATION.PASSWORD_MAX_LENGTH,
        `비밀번호는 최대 ${ACCOUNT_VALIDATION.PASSWORD_MAX_LENGTH}자 이하여야 합니다.`
      )
      .optional(),
  })
  .refine(
    (data) =>
      // 둘 다 없거나 둘 다 있어야 OK
      (!data.currentPassword && !data.newPassword) || (data.currentPassword && data.newPassword),
    {
      message: '비밀번호 변경 시 현재 비밀번호와 새 비밀번호가 모두 필요합니다.',
      path: ['newPassword'],
    }
  );
