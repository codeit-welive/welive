import { ComplaintStatus } from '@prisma/client';
import { z } from 'zod';
import { COMPLAINT_VALIDATION } from '#constants/complaint';

export const complaintCreateSchema = z.object({
  userId: z.string().uuid({ message: '유효한 사용자 ID가 아닙니다.' }),
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
  boardId: z.string().uuid({ version: 'v4', message: '유효한 게시판 ID가 아닙니다.' }),
  status: z.nativeEnum(ComplaintStatus).default(ComplaintStatus.PENDING),
});

export type ComplaintCreateDto = z.infer<typeof complaintCreateSchema>;
