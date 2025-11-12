import { BoardType, NoticeCategory } from '@prisma/client';
import { z } from 'zod';

export const eventListQueryInputSchema = z.object({
  apartmentId: z.uuid({ message: '아파트 아이디가 존재하지 않습니다.' }),
  year: z.number().int().min(1980).max(2500),
  month: z.number().int().min(1).max(12),
});

export type eventListQueryInputDTO = z.infer<typeof eventListQueryInputSchema>;

export const eventUpdateQueryInputSchema = z.object({
  boardType: z.enum(BoardType),
  boardId: z.uuid({ message: '게시글 아이디가 필요합니다(noticeId 혹은 pollId).' }),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
});

export type eventUpdateQueryInputDTO = z.infer<typeof eventUpdateQueryInputSchema>;

export const eventDeleteParamsInputSchema = z.object({
  eventId: z.uuid(),
});

export type eventDeleteParamsInputDTO = z.infer<typeof eventDeleteParamsInputSchema>;
