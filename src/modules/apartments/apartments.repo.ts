import prisma from '#core/prisma';
import { UserRole } from '@prisma/client';
import { ApartmentRequestQueryDto } from './dto/apartment.dto';
import { buildWhereCondition } from './utils/buildSearchFilter';

/**
 * @description 아파트 목록 조회
 *  - PUBLIC: 전체 아파트 목록 반환
 *  - ADMIN, SUPER_ADMIN: searchKeyword로 검색 및 apartmentStatus로 필터링
 * @param query 아파트 조회 쿼리
 * @param userRole 요청한 사용자의 역할
 *  - 회원 가입 시에는 undefined로 전달됨
 * @returns 아파트 목록
 *  - PUBLIC: 아파트id, 이름, 주소만 반환
 *  - ADMIN, SUPER_ADMIN: 추가 정보 포함
 */
export const getList = async (query: ApartmentRequestQueryDto, userRole: UserRole | undefined) => {
  const where = buildWhereCondition(query, userRole);

  return prisma.apartment.findMany({
    where,
    select: {
      id: true,
      apartmentName: true,
      apartmentAddress: true,
      ...(userRole && {
        apartmentManagementNumber: true,
        startComplexNumber: true,
        endComplexNumber: true,
        startDongNumber: true,
        endDongNumber: true,
        startFloorNumber: true,
        endFloorNumber: true,
        startHoNumber: true,
        endHoNumber: true,
        admin: {
          select: {
            id: true,
            name: true,
            contact: true,
            email: true,
            joinStatus: true,
          },
        },
      }),
    },
    ...(userRole && {
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  });
};

/**
 * @description 아파트 상세 조회
 * @param query 아파트 조회 쿼리
 * @param userRole 요청한 사용자의 역할
 *  - 회원 가입 시에는 undefined로 전달됨
 * @returns 아파트 상세 정보
 *  - PUBLIC: 아파트id, 이름, 주소, 아파트 동, 호수 범위 반환
 *  - ADMIN, SUPER_ADMIN: 추가 정보 포함
 */
export const getById = async (id: string, userRole: UserRole | undefined) => {
  return prisma.apartment.findUnique({
    where: { id },
    select: {
      id: true,
      apartmentName: true,
      apartmentAddress: true,
      startComplexNumber: true,
      endComplexNumber: true,
      startDongNumber: true,
      endDongNumber: true,
      startFloorNumber: true,
      endFloorNumber: true,
      startHoNumber: true,
      endHoNumber: true,
      ...(userRole &&
        userRole !== UserRole.USER && {
          apartmentManagementNumber: true,
          admin: {
            select: {
              id: true,
              name: true,
              contact: true,
              email: true,
              joinStatus: true,
            },
          },
        }),
    },
  });
};

/**
 * @description 아파트 총 개수 조회
 * @param query 아파트 조회 쿼리
 * @param userRole 요청한 사용자의 역할
 *  - 회원 가입 시에는 undefined로 전달됨
 * @returns 조건에 맞는 아파트 총 개수
 */
export const getCount = async (query: ApartmentRequestQueryDto, userRole: UserRole | undefined) => {
  const where = buildWhereCondition(query, userRole);

  return prisma.apartment.count({
    where,
  });
};

/**
 * 아파트 ID → apartmentName 조회
 * @returns apartmentName | null
 */
export const getApartmentNameByIdRepo = async (apartmentId: string) => {
  const apt = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    select: { apartmentName: true },
  });

  return apt?.apartmentName ?? null;
};
