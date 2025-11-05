import { UserRole } from '@prisma/client';
import { getById, getList } from './apartments.repo';
import { ApartmentRequestQueryDto } from './dto/apartment.dto';
import ApiError from '#errors/ApiError';

export const getApartmentList = async (query: ApartmentRequestQueryDto, userRole: UserRole) => {
  const apartments = await getList(query, userRole);

  return apartments;
};

export const getApartment = async (apartmentId: string, userRole: UserRole) => {
  const apartment = await getById(apartmentId, userRole);
  if (!apartment) {
    throw ApiError.notFound('아파트를 찾을 수 없습니다.');
  }

  return apartment;
};
