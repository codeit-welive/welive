import { z } from 'zod';
import { NOTICE_VALIDATION } from '#constants/notice';

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

export interface noticeDTO {
  id: string;
  user: {
    id: string;
    name: string;
  };
  category: ['MAINTENANCE' | 'EMERGENCY' | 'COMMUNITY' | 'RESIDENT_VOTE' | 'RESIDENT_COUNCIL' | 'COMPLAINT' | 'ETC'];
  title: string;
  createdAt: string;
  updatedAt: string;
  viewsCount: number;
  _count: number;
  isPinned: boolean;
  content: string;
  comments: {
    id: string;
    user: {
      id: string;
      name: string;
    };
    content: string;
    createdAt: string;
    updatedAt: string;
  };
}
