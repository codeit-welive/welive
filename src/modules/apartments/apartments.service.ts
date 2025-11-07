import { UserRole } from '@prisma/client';
import { getById, getCount, getList } from './apartments.repo';
import { ApartmentRequestQueryDto } from './dto/apartment.dto';
import ApiError from '#errors/ApiError';

export const getApartmentList = async (query: ApartmentRequestQueryDto, userRole: UserRole) => {
  const [apartments, totalCount] = await Promise.all([await getList(query, userRole), await getCount(query, userRole)]);

  return { apartments, totalCount };
};

export const getApartment = async (apartmentId: string, userRole: UserRole) => {
  const apartment = await getById(apartmentId, userRole);
  if (!apartment) {
    throw ApiError.notFound('아파트를 찾을 수 없습니다.');
  }

  return apartment;
};
