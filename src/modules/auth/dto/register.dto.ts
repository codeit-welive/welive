import { z } from 'zod';
import dns from 'dns/promises';
import { UserRole, JoinStatus } from '@prisma/client';
import { ACCOUNT_VALIDATION, APARTMENT_VALIDATION } from '#constants/auth';

const emailWithMX = z.email({ message: '이메일 형식이 올바르지 않습니다.' }).refine(
  async (email) => {
    const domain = email.split('@')[1];
    try {
      const records = await dns.resolveMx(domain);
      return records && records.length > 0;
    } catch {
      return false;
    }
  },
  {
    message: '유효한 이메일 주소가 아닙니다.',
  }
);

export const userSchema = z.object({
  username: z
    .string()
    .min(
      ACCOUNT_VALIDATION.USERNAME_MIN_LENGTH,
      `아이디는 최소 ${ACCOUNT_VALIDATION.USERNAME_MIN_LENGTH}자 이상이어야 합니다.`
    )
    .max(
      ACCOUNT_VALIDATION.USERNAME_MAX_LENGTH,
      `아이디는 최대 ${ACCOUNT_VALIDATION.USERNAME_MAX_LENGTH}자 이하여야 합니다.`
    ),
  password: z
    .string()
    .min(
      ACCOUNT_VALIDATION.PASSWORD_MIN_LENGTH,
      `비밀번호는 최소 ${ACCOUNT_VALIDATION.PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`
    )
    .max(
      ACCOUNT_VALIDATION.PASSWORD_MAX_LENGTH,
      `비밀번호는 최대 ${ACCOUNT_VALIDATION.PASSWORD_MAX_LENGTH}자 이하여야 합니다.`
    )
    .superRefine((pwd, ctx) => {
      if (!/[a-z]/.test(pwd)) ctx.addIssue({ code: 'custom', message: '소문자 하나 이상 포함해야 합니다.' });
      if (!/\d/.test(pwd)) ctx.addIssue({ code: 'custom', message: '숫자 하나 이상 포함해야 합니다.' });
      if (!/[!@#$%^&*()_\-+={}[\]|\\;:'",.<>/?`~]/.test(pwd))
        ctx.addIssue({ code: 'custom', message: '특수문자 하나 이상 포함해야 합니다.' });
    }),
  contact: z
    .string()
    .regex(/^\d+$/, '숫자만 입력해주세요. 하이픈(-)은 제외해주세요.')
    .min(
      ACCOUNT_VALIDATION.CONTACT_MIN_LENGTH,
      `전화번호는 최소 ${ACCOUNT_VALIDATION.CONTACT_MIN_LENGTH}자 이상이어야 합니다.`
    )
    .max(
      ACCOUNT_VALIDATION.CONTACT_MAX_LENGTH,
      `전화번호는 최대 ${ACCOUNT_VALIDATION.CONTACT_MAX_LENGTH}자 이하여야 합니다.`
    ),
  name: z
    .string()
    .min(ACCOUNT_VALIDATION.NAME_MIN_LENGTH, `이름은 최소 ${ACCOUNT_VALIDATION.NAME_MIN_LENGTH}자 이상이어야 합니다.`)
    .max(ACCOUNT_VALIDATION.NAME_MAX_LENGTH, `이름은 최대 ${ACCOUNT_VALIDATION.NAME_MAX_LENGTH}자 이하여야 합니다.`),
  email: emailWithMX,
  role: z.enum(UserRole, '유효하지 않은 사용자 역할입니다.').default(UserRole.USER),
  avatar: z.string().default('process.env.DEFAULT_AVATAR'),
});

export const signupSuperAdminRequestDtoSchema = userSchema.extend({
  joinStatus: z.enum(JoinStatus, '유효하지 않은 가입 상태입니다.'),
});

export const apartmentSchema = z.object({
  apartmentName: z.string().max(APARTMENT_VALIDATION.APARTMENT_NAME_MAX_LENGTH),
  description: z.string().max(255),
  startComplexNumber: z.string().regex(/^\d+$/, '숫자만 입력해주세요.').min(1).max(2),
  endComplexNumber: z.string().regex(/^\d+$/, '숫자만 입력해주세요.').min(1).max(2),
  startDongNumber: z.string().regex(/^\d+$/, '숫자만 입력해주세요.').min(1).max(2),
  endDongNumber: z.string().regex(/^\d+$/, '숫자만 입력해주세요.').min(1).max(2),
  startFloorNumber: z.string().regex(/^\d+$/, '숫자만 입력해주세요.').min(1).max(2),
  endFloorNumber: z.string().regex(/^\d+$/, '숫자만 입력해주세요.').min(1).max(2),
  startHoNumber: z.string().regex(/^\d+$/, '숫자만 입력해주세요.').min(1).max(2),
  endHoNumber: z.string().regex(/^\d+$/, '숫자만 입력해주세요.').min(1).max(2),
  apartmentAddress: z.string().max(255),
  apartmentManagementNumber: z
    .string()
    .regex(/^\d+$/, '숫자만 입력해주세요. 하이픈(-)은 제외해주세요.')
    .min(APARTMENT_VALIDATION.OFFICE_NUMBER_MIN_LENGTH)
    .max(APARTMENT_VALIDATION.OFFICE_NUMBER_MAX_LENGTH),
});

export const signupAdminRequestDtoSchema = userSchema.extend(apartmentSchema.shape);

export const signupUserRequestDtoSchema = userSchema.extend({
  apartmentName: z.string().max(APARTMENT_VALIDATION.APARTMENT_NAME_MAX_LENGTH),
  apartmentDong: z.string().regex(/^\d+$/, '숫자만 입력해주세요.').min(3).max(4),
  apartmentHo: z.string().regex(/^\d+$/, '숫자만 입력해주세요.').min(3).max(4),
});

export type SignupSuperAdminRequestDto = z.infer<typeof signupSuperAdminRequestDtoSchema>;
export type SignupAdminRequestDto = z.infer<typeof signupAdminRequestDtoSchema>;
export type SignupUserRequestDto = z.infer<typeof signupUserRequestDtoSchema>;
export type UserDto = z.infer<typeof userSchema>;
export type ApartmentDto = z.infer<typeof apartmentSchema>;
