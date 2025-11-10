import prisma from '#core/prisma';
import { Prisma, UserRole } from '@prisma/client';
import { ApartmentRequestQueryDto } from './dto/apartment.dto';

/**
 * @description 아파트 목록 조회
 *  - USER: 아파트 이름으로 검색
 *  - ADMIN, SUPER_ADMIN: searchKeyword로 검색 및 apartmentStatus로 필터링
 * @returns 아파트 목록
 *  - USER: 아파트id, 이름, 주소만 반환
 *  - ADMIN, SUPER_ADMIN: 추가 정보 포함
 */
export const getList = async (query: ApartmentRequestQueryDto, userRole: UserRole) => {
  const OR = [];
  const mode = 'insensitive' as Prisma.QueryMode;

  if (userRole !== UserRole.USER) {
    OR.push({ apartmentName: { contains: query.searchKeyword, mode } });
    OR.push({ apartmentAddress: { contains: query.searchKeyword, mode } });
    OR.push({ admin: { name: { contains: query.searchKeyword, mode } } });
    OR.push({ admin: { email: { contains: query.searchKeyword, mode } } });
  } else {
    OR.push({ apartmentName: { contains: query.name, mode } });
  }

  return prisma.apartment.findMany({
    where: {
      OR,
      ...(query.apartmentStatus && { admin: { joinStatus: query.apartmentStatus } }),
    },
    select: {
      id: true,
      apartmentName: true,
      apartmentAddress: true,
      ...(userRole !== UserRole.USER && {
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
    ...(userRole !== UserRole.USER && {
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  });
};

/**
 * @description 아파트 상세 조회
 *  - USER: 아파트id, 이름, 주소만 반환
 *  - ADMIN, SUPER_ADMIN: 추가 정보 포함
 * @returns 아파트 상세 정보
 *  - USER: 아파트id, 이름, 주소만 반환
 *  - ADMIN, SUPER_ADMIN: 추가 정보 포함
 */
export const getById = async (id: string, userRole: UserRole) => {
  return prisma.apartment.findUnique({
    where: { id },
    select: {
      id: true,
      apartmentName: true,
      apartmentAddress: true,
      ...(userRole !== UserRole.USER && {
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
  });
};

export const getCount = async (query: ApartmentRequestQueryDto, userRole: UserRole) => {
  const OR = [];
  const mode = 'insensitive' as Prisma.QueryMode;

  if (userRole !== UserRole.USER) {
    OR.push({ apartmentName: { contains: query.searchKeyword, mode } });
    OR.push({ apartmentAddress: { contains: query.searchKeyword, mode } });
    OR.push({ admin: { name: { contains: query.searchKeyword, mode } } });
    OR.push({ admin: { email: { contains: query.searchKeyword, mode } } });
  } else {
    OR.push({ apartmentName: { contains: query.name, mode } });
  }

  return prisma.apartment.count({
    where: {
      OR,
      ...(query.apartmentStatus && { admin: { joinStatus: query.apartmentStatus } }),
    },
  });
};
