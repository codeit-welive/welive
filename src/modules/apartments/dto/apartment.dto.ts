import { z } from 'zod';
import { PAGINATION } from '#constants/pagination.constant';

export const apartmentRequestQuerySchema = z.object({
  name: z.string(),
  address: z.string(),
  limit: z.number().min(1).default(PAGINATION.DEFAULT_LIMIT),
  page: z.number().min(1).default(PAGINATION.DEFAULT_PAGE),
});

export type ApartmentRequestQueryDto = z.infer<typeof apartmentRequestQuerySchema>;

export interface UserApartmentResponseDto {
  id: string;
  apartmentName: string;
  apartmentAddress: string;
}
export interface AdminApartmentResponseDto extends UserApartmentResponseDto {
  apartmentManagementNumber: string;
  startComplexNumber: string;
  endComplexNumber: string;
  startDongNumber: string;
  endDongNumber: string;
  startFloorNumber: string;
  endFloorNumber: string;
  startHoNumber: string;
  endHoNumber: string;
  admin: {
    id: string;
    name: string;
    contact: string;
    email: string;
    joinStatus: string;
  };
}
