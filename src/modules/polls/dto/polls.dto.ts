import { z } from 'zod';

export const createPollBodySchema = z.object({
  boardId: z.uuid({ message: '유효한 경로가 아닙니다.' }),
  userId: z.uuid(),
  status: z.literal('IN_PROGRESS'),
  title: z.string(),
  content: z.string(),
  buildingPermission: z.number().gte(0),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  options: z.array(z.object({ title: z.string().min(1).max(50) })),
});

export type createPollBodyDTO = z.infer<typeof createPollBodySchema>;
