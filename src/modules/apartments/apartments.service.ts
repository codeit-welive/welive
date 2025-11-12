import { UserRole } from '@prisma/client';
import { getById, getCount, getList } from './apartments.repo';
import { ApartmentRequestQueryDto } from './dto/apartment.dto';
import ApiError from '#errors/ApiError';
import { mapApartmentListData, mapApartmentDetailData } from './utils/dataMapper';

/**
 * 아파트 목록 조회
 * @param query 아파트 조회 쿼리
 * @returns 아파트 목록과 총 개수
 *  - ADMIN, SUPER_ADMIN: 아파트 관리자 정보 포함
 *  - PUBLIC: 아파트 정보만 반환
 */
export const getApartmentList = async (query: ApartmentRequestQueryDto, userRole: UserRole | undefined) => {
  const [apartments, totalCount] = await Promise.all([getList(query, userRole), getCount(query, userRole)]);

  return { apartments: mapApartmentListData(apartments, userRole), totalCount };
};

/**
 * 아파트 상세 조회
 * @param apartmentId 조회할 아파트 ID
 * @param userRole 요청한 사용자의 역할
 * @returns 아파트 상세 정보
 *  - ADMIN, SUPER_ADMIN: 아파트 관리자 정보 포함
 *  - PUBLIC: 아파트 정보만 반환
 */
export const getApartment = async (apartmentId: string, userRole: UserRole) => {
  const apartment = await getById(apartmentId, userRole);
  if (!apartment) {
    throw ApiError.notFound('아파트를 찾을 수 없습니다.');
  }

  return mapApartmentDetailData(apartment, userRole);
};
