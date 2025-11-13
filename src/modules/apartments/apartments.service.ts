import { UserRole } from '@prisma/client';
import { getById, getCount, getList } from './apartments.repo';
import { ApartmentRequestQueryDto } from './dto/apartment.dto';
import ApiError from '#errors/ApiError';
import { mapApartmentListData, mapApartmentDetailData } from './utils/dataMapper';

/**
 * 아파트 목록 조회
 * @param query 아파트 조회 쿼리
 * @param userRole 요청한 사용자의 역할
 *  - 회원 가입 시에는 undefined로 전달됨
 * @returns response 형태에 맞춘 아파트 정보와 총 개수
 */
export const getApartmentList = async (query: ApartmentRequestQueryDto, userRole: UserRole | undefined) => {
  const [apartments, totalCount] = await Promise.all([getList(query, userRole), getCount(query, userRole)]);

  return { apartments: mapApartmentListData(apartments, userRole), totalCount };
};

/**
 * 아파트 상세 조회
 * @param apartmentId 조회할 아파트 ID
 * @param userRole 요청한 사용자의 역할
 * - 회원 가입 시에는 undefined로 전달됨
 * @returns response 형태에 맞춘 아파트 정보
 */
export const getApartment = async (apartmentId: string, userRole: UserRole | undefined) => {
  const apartment = await getById(apartmentId, userRole);
  if (!apartment) {
    throw ApiError.notFound('아파트를 찾을 수 없습니다.');
  }

  return mapApartmentDetailData(apartment, userRole);
};
