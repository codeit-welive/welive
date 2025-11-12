import { z } from 'zod';
import { PAGINATION } from '#constants/pagination.constant';
import { JoinStatus } from '@prisma/client';

export const apartmentRequestQuerySchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  searchKeyword: z.string().optional(),
  apartmentStatus: z.enum(JoinStatus).optional(),
  limit: z.coerce.number().min(1).default(PAGINATION.DEFAULT_LIMIT),
  page: z.coerce.number().min(1).default(PAGINATION.DEFAULT_PAGE),
});

export type ApartmentRequestQueryDto = z.infer<typeof apartmentRequestQuerySchema>;

export interface ApartmentResponseDto {
  id: string;
  apartmentName: string;
  apartmentAddress: string;
  apartmentManagementNumber: string | null;
  startComplexNumber: string | null;
  endComplexNumber: string | null;
  startDongNumber: string | null;
  endDongNumber: string | null;
  startFloorNumber: string | null;
  endFloorNumber: string | null;
  startHoNumber: string | null;
  endHoNumber: string | null;
  admin: {
    id: string;
    name: string;
    contact: string;
    email: string;
    joinStatus: string;
  } | null;
}

export const apartmentRequestParamsSchema = z.object({
  id: z.uuid(),
});
