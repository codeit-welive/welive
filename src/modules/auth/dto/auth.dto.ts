import { ACCOUNT_VALIDATION, APARTMENT_VALIDATION } from '#constants/auth.constant';
import { JoinStatus } from '@prisma/client';
import { z } from 'zod';
import dns from 'dns/promises';

export const patchStatusParamSchema = z.object({
  adminId: z.uuid().optional(),
  residentId: z.uuid().optional(),
});

export const patchStatusBodySchema = z.object({
  status: z.enum([JoinStatus.APPROVED, JoinStatus.REJECTED]),
});

export const patchApartmentParamSchema = z.object({
  adminId: z.uuid(),
});

export const deleteApartmentParmSchema = z.object({
  adminId: z.uuid(),
});

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

export const patchApartmentBodySchema = z.object({
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
    )
    .optional(),
  name: z
    .string()
    .min(ACCOUNT_VALIDATION.NAME_MIN_LENGTH, `이름은 최소 ${ACCOUNT_VALIDATION.NAME_MIN_LENGTH}자 이상이어야 합니다.`)
    .max(ACCOUNT_VALIDATION.NAME_MAX_LENGTH, `이름은 최대 ${ACCOUNT_VALIDATION.NAME_MAX_LENGTH}자 이하여야 합니다.`)
    .optional(),
  email: emailWithMX.optional(),
  description: z.string().max(255).optional(),
  apartmentName: z.string().max(APARTMENT_VALIDATION.APARTMENT_NAME_MAX_LENGTH).optional(),
  apartmentAddress: z.string().max(255).optional(),
  apartmentManagementNumber: z
    .string()
    .regex(/^\d+$/, '숫자만 입력해주세요. 하이픈(-)은 제외해주세요.')
    .min(APARTMENT_VALIDATION.OFFICE_NUMBER_MIN_LENGTH)
    .max(APARTMENT_VALIDATION.OFFICE_NUMBER_MAX_LENGTH)
    .optional(),
});

export type PatchApartmentBodyDto = z.infer<typeof patchApartmentBodySchema>;
