import { z } from 'zod';
import { NOTICE_VALIDATION } from '#constants/notice.constant';
import { NoticeCategory } from '@prisma/client';

type CommentDTO = {
  id: string;
  user: {
    id: string;
    name: string;
  };
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export const noticeParamsSchema = z.uuid({ message: '유효한 경로가 아닙니다.' });

export const noticeListQuerySchema = z.object({
  page: z.number().gte(1).optional(),
  pageSize: z.number().gte(5).optional(),
  category: z.enum(['MAINTENANCE', 'EMERGENCY', 'COMMUNITY', 'RESIDENT_VOTE', 'RESIDENT_COUNCIL', 'COMPLAINT', 'ETC']),
  search: z.string().optional().nullable(),
});

export type NoticeListQueryDTO = z.infer<typeof noticeListQuerySchema>;

export const noticeCreateSchema = z.object({
  userId: z.uuid({ message: '유효한 사용자 ID가 아닙니다.' }),
  title: z
    .string()
    .min(NOTICE_VALIDATION.TITLE_MIN_LENGTH, `제목은 최소 ${NOTICE_VALIDATION.TITLE_MIN_LENGTH}자 이상이어야 합니다.`)
    .max(NOTICE_VALIDATION.TITLE_MAX_LENGTH, `제목은 최대 ${NOTICE_VALIDATION.TITLE_MAX_LENGTH}자까지 가능합니다.`),
  content: z
    .string()
    .min(
      NOTICE_VALIDATION.CONTENT_MIN_LENGTH,
      `내용은 최소 ${NOTICE_VALIDATION.CONTENT_MIN_LENGTH}자 이상이어야 합니다.`
    )
    .max(NOTICE_VALIDATION.CONTENT_MAX_LENGTH, `내용은 최대 ${NOTICE_VALIDATION.CONTENT_MAX_LENGTH}자까지 가능합니다.`),
  category: z.enum(['MAINTENANCE', 'EMERGENCY', 'COMMUNITY', 'RESIDENT_VOTE', 'RESIDENT_COUNCIL', 'COMPLAINT', 'ETC']),
  boardId: z.uuid({ message: '유효한 게시판 ID가 아닙니다.' }),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  isPinned: z.boolean().optional(),
});

export type NoticeCreateDTO = z.infer<typeof noticeCreateSchema>;

export const noticeUpdateSchema = z.object({
  userId: z.uuid({ message: '유효한 사용자 ID가 아닙니다.' }),
  title: z
    .string()
    .min(NOTICE_VALIDATION.TITLE_MIN_LENGTH, `제목은 최소 ${NOTICE_VALIDATION.TITLE_MIN_LENGTH}자 이상이어야 합니다.`)
    .max(NOTICE_VALIDATION.TITLE_MAX_LENGTH, `제목은 최대 ${NOTICE_VALIDATION.TITLE_MAX_LENGTH}자까지 가능합니다.`),
  content: z
    .string()
    .min(
      NOTICE_VALIDATION.CONTENT_MIN_LENGTH,
      `내용은 최소 ${NOTICE_VALIDATION.CONTENT_MIN_LENGTH}자 이상이어야 합니다.`
    )
    .max(NOTICE_VALIDATION.CONTENT_MAX_LENGTH, `내용은 최대 ${NOTICE_VALIDATION.CONTENT_MAX_LENGTH}자까지 가능합니다.`),
  category: z.enum(['MAINTENANCE', 'EMERGENCY', 'COMMUNITY', 'RESIDENT_VOTE', 'RESIDENT_COUNCIL', 'COMPLAINT', 'ETC']),
  boardId: z.uuid({ message: '유효한 게시판 ID가 아닙니다.' }),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  isPinned: z.boolean().optional(),
});

export type NoticeUpdateDTO = z.infer<typeof noticeUpdateSchema>;

export interface NoticeEntityDTO {
  id: string;
  user: {
    id: string;
    name: string;
  };
  category: NoticeCategory;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  viewsCount: number;
  _count: {
    comments: number;
  };
  isPinned: boolean;
  content: string;
  comments: CommentDTO[];
}

export interface NoticeListReponseDTO {
  id: string;
  userId: string;
  category: string;
  title: string;
  writerName: string;
  createdAt: string;
  updatedAt: string;
  viewsCount: number;
  commentsCount: number;
  isPinned: boolean;
}
