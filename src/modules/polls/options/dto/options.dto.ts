import { z } from 'zod';

export const postVoteParamsSchema = z.object({
  optionId: z.uuid({ message: '투표 옵션이 존재하지 않습니다.' }),
});

export type postVoteParamsDTO = z.infer<typeof postVoteParamsSchema>;

export const deleteVoteParamsSchema = z.object({
  optionId: z.uuid({ message: '투표 옵션이 존재하지 않습니다.' }),
});

export type deleteVoteParamsDTO = z.infer<typeof deleteVoteParamsSchema>;
