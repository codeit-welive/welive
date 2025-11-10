import { UserRole } from '@prisma/client';
import { getById, getCount, getList } from './apartments.repo';
import { ApartmentRequestQueryDto } from './dto/apartment.dto';
import ApiError from '#errors/ApiError';

/**
 * 아파트 목록 조회
 * @param query 아파트 조회 쿼리
 * @returns 아파트 목록과 총 개수
 */
export const getApartmentList = async (query: ApartmentRequestQueryDto, userRole: UserRole) => {
  const [apartments, totalCount] = await Promise.all([getList(query, userRole), getCount(query, userRole)]);

  return { apartments, totalCount };
};

/**
 *
 * @param apartmentId 조회할 아파트 ID
 * @param userRole 요청한 사용자의 역할
 * @returns 아파트 상세 정보
 */
export const getApartment = async (apartmentId: string, userRole: UserRole) => {
  const apartment = await getById(apartmentId, userRole);
  if (!apartment) {
    throw ApiError.notFound('아파트를 찾을 수 없습니다.');
  }

  return apartment;
};
