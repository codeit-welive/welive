import { z } from 'zod';

export const complaintParamsSchema = z.uuid({ message: '유효한 민원 ID가 아닙니다.' });

export type ComplaintParams = z.infer<typeof complaintParamsSchema>;
