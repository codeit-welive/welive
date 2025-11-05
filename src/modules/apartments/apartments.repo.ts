import prisma from '#core/prisma';
import { UserRole } from '@prisma/client';
import { ApartmentRequestQueryDto } from './dto/apartment.dto';

export const getList = async (query: ApartmentRequestQueryDto, userRole: UserRole) => {
  return prisma.apartment.findMany({
    where: {
      OR: [
        { apartmentName: { contains: query.name, mode: 'insensitive' } },
        { apartmentAddress: { contains: query.address, mode: 'insensitive' } },
        {
          admin: {
            name: { contains: query.name, mode: 'insensitive' },
            email: { contains: query.name, mode: 'insensitive' },
          },
        },
      ],
    },
    skip: (query.page - 1) * query.limit,
    take: query.limit,
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
