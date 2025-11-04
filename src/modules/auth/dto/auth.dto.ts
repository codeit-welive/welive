import { JoinStatus } from '@prisma/client';
import { z } from 'zod';

export const patchStatusParamSchema = z.object({
  adminId: z.uuid().optional(),
  residentId: z.uuid().optional(),
});

export const patchStatusBodySchema = z.object({
  status: z.enum(JoinStatus),
});
