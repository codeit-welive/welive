import { PAGINATION } from '#constants/pagination.constant';
import { ResidentStatus, IsHouseholder } from '@prisma/client';
import { z } from 'zod';

export const residentListRequestQuerySchema = z.object({
  building: z.string().optional(),
  unitNumber: z.string().optional(),
  residenceStatus: z.enum(ResidentStatus).optional(),
  isRegistered: z.coerce.boolean().optional(),
  keyword: z.string().default(''),
  limit: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_LIMIT),
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
});

export type ResidentListRequestQueryDto = z.infer<typeof residentListRequestQuerySchema>;

export interface ResidentResponseDto {
  id: string;
  building: string;
  unitNumber: string;
  contact: string;
  name: string;
  residenceStatus: ResidentStatus;
  isHouseholder: IsHouseholder;
  isRegistered: boolean;
  user: {
    id: string;
    email: string;
  } | null;
}

export const residentRequestParamSchema = z.object({
  id: z.uuid(),
});

export const residentPatchRequestBodySchema = z.object({
  building: z.string(),
  unitNumber: z.string(),
  contact: z.string(),
  name: z.string(),
  isHouseholder: z.enum(IsHouseholder),
});

export type ResidentPatchRequestBodyDto = z.infer<typeof residentPatchRequestBodySchema>;

export const residentCreateRequestBodySchema = z.object({
  building: z.string(),
  unitNumber: z.string(),
  contact: z.string(),
  name: z.string(),
  isHouseholder: z.enum(IsHouseholder),
});

export type ResidentCreateRequestBodyDto = z.infer<typeof residentCreateRequestBodySchema>;
