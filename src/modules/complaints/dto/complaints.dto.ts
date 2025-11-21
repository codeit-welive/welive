import { ComplaintStatus, UserRole } from '@prisma/client';
import { z } from 'zod';
import { COMPLAINT_VALIDATION } from '#constants/complaint.constant';

export const complaintCreateSchema = z.object({
  userId: z.uuid({ message: '유효한 사용자 ID가 아닙니다.' }),
  title: z
    .string()
    .min(
      COMPLAINT_VALIDATION.TITLE_MIN_LENGTH,
      `제목은 최소 ${COMPLAINT_VALIDATION.TITLE_MIN_LENGTH}자 이상이어야 합니다.`
    )
    .max(
      COMPLAINT_VALIDATION.TITLE_MAX_LENGTH,
      `제목은 최대 ${COMPLAINT_VALIDATION.TITLE_MAX_LENGTH}자까지 가능합니다.`
    ),
  content: z
    .string()
    .min(
      COMPLAINT_VALIDATION.CONTENT_MIN_LENGTH,
      `내용은 최소 ${COMPLAINT_VALIDATION.CONTENT_MIN_LENGTH}자 이상이어야 합니다.`
    )
    .max(
      COMPLAINT_VALIDATION.CONTENT_MAX_LENGTH,
      `내용은 최대 ${COMPLAINT_VALIDATION.CONTENT_MAX_LENGTH}자까지 가능합니다.`
    ),
  isPublic: z.boolean().default(false),
  boardId: z.uuid({ message: '유효한 게시판 ID가 아닙니다.' }),
});

export const complaintPatchSchema = z
  .object({
    title: z
      .string()
      .min(
        COMPLAINT_VALIDATION.TITLE_MIN_LENGTH,
        `제목은 최소 ${COMPLAINT_VALIDATION.TITLE_MIN_LENGTH}자 이상이어야 합니다.`
      )
      .max(
        COMPLAINT_VALIDATION.TITLE_MAX_LENGTH,
        `제목은 최대 ${COMPLAINT_VALIDATION.TITLE_MAX_LENGTH}자까지 가능합니다.`
      ),
    content: z
      .string()
      .min(
        COMPLAINT_VALIDATION.CONTENT_MIN_LENGTH,
        `내용은 최소 ${COMPLAINT_VALIDATION.CONTENT_MIN_LENGTH}자 이상이어야 합니다.`
      )
      .max(
        COMPLAINT_VALIDATION.CONTENT_MAX_LENGTH,
        `내용은 최대 ${COMPLAINT_VALIDATION.CONTENT_MAX_LENGTH}자까지 가능합니다.`
      ),
    isPublic: z.boolean(),
  })
  .partial();

export const complaintPatchStatusSchema = z.object({
  userId: z.uuid({ message: '유효한 사용자 ID가 아닙니다.' }),
  status: z.enum(ComplaintStatus),
});

export const complaintDeleteSchema = z.object({
  userId: z.uuid({ message: '유효한 사용자 ID가 아닙니다.' }),
  role: z.enum(UserRole),
});

export type ComplaintCreateDto = z.infer<typeof complaintCreateSchema>;
export type ComplaintPatchDto = z.infer<typeof complaintPatchSchema>;
export type ComplaintPatchStatusDto = z.infer<typeof complaintPatchStatusSchema>;
export type ComplaintDeleteDto = z.infer<typeof complaintDeleteSchema>;
