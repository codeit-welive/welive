import { PollStatus } from '@prisma/client';
import { string, z } from 'zod';

export const createPollBodySchema = z.object({
  boardId: z.uuid({ message: '유효한 경로가 아닙니다.' }),
  userId: z.uuid(),
  status: z.enum(PollStatus),
  title: z.string(),
  content: z.string(),
  buildingPermission: z.number().gte(0),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  options: z.array(z.object({ title: z.string().min(1).max(50) })),
});

export type createPollBodyDTO = z.infer<typeof createPollBodySchema>;

export const pollListQuerySchema = z.object({
  page: z.number().gte(1),
  pageSize: z.number().gte(5),
  votingStatus: z.enum(PollStatus),
  apartment: z.stringFormat('투표권자', /^[1-9][0-9][1-9]동$/).or(z.string('전체')),
  search: z.string().optional(),
});

export type pollListQueryDTO = z.infer<typeof pollListQuerySchema>;

export const patchPollBodySchema = z.object({
  title: z.string(),
  content: z.string(),
  buildingPermission: z.number().gte(0),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  status: z.enum(PollStatus),
  options: z.array(z.object({ title: z.string().min(1).max(50) })),
});

export type patchPollBodyDTO = z.infer<typeof patchPollBodySchema>;
