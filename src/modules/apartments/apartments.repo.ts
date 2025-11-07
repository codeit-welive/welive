import prisma from '#core/prisma';
import { Prisma, UserRole } from '@prisma/client';
import { ApartmentRequestQueryDto } from './dto/apartment.dto';

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
