import { z } from 'zod';
import { NOTICE_VALIDATION } from '#constants/notice';

type NoticeCategory =
  | 'MAINTENANCE'
  | 'EMERGENCY'
  | 'COMMUNITY'
  | 'RESIDENT_VOTE'
  | 'RESIDENT_COUNCIL'
  | 'COMPLAINT'
  | 'ETC';

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
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  isPinned: z.boolean(),
});

export type NoticeUpdateDTO = z.infer<typeof noticeUpdateSchema>;

export interface noticeEntityDTO {
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

export interface noticeListReponseDTO {
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

export interface NoticeQueryDTO {
  page: number;
  pageSize: number;
  category: NoticeCategory;
  search: string | null;
}
