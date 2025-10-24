import { z } from 'zod';
import { PAGINATION } from '#constants/pagination.constant';
import { ComplaintStatus } from '@prisma/client';

export const complaintListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  status: z.enum(ComplaintStatus).optional(),
  isPublic: z.coerce.boolean().optional(),
  dong: z.string().optional(),
  ho: z.string().optional(),
  keyword: z.string().trim().optional(),
});

export type ComplaintListQuery = z.infer<typeof complaintListQuerySchema>;
