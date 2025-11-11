import prisma from '#core/prisma';
import {
  ResidentCreateRequestBodyDto,
  ResidentListRequestQueryDto,
  ResidentPatchRequestBodyDto,
} from './dto/resident.dto';
import { buildWhereCondition } from './utils/whereConditionBuilder';

const selectResidentFields = {
  id: true,
  building: true,
  unitNumber: true,
  name: true,
  contact: true,
  residenceStatus: true,
  isHouseholder: true,
  isRegistered: true,
  approvalStatus: true,
  user: {
    select: {
      id: true,
      email: true,
    },
  },
};

export const getList = async (query: ResidentListRequestQueryDto, adminId: string) => {
  return await prisma.resident.findMany({
    where: buildWhereCondition(query, adminId),
    select: selectResidentFields,
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  });
};

export const getCount = async (query: ResidentListRequestQueryDto, adminId: string) => {
  return await prisma.resident.count({
    where: buildWhereCondition(query, adminId),
  });
};

export const getById = async (residentId: string) => {
  return await prisma.resident.findUnique({
    where: { id: residentId },
    select: selectResidentFields,
  });
};

export const update = async (residnetId: string, data: ResidentPatchRequestBodyDto) => {
  return await prisma.resident.update({
    where: { id: residnetId },
    data,
    select: selectResidentFields,
  });
};

export const remove = async (residentId: string) => {
  return await prisma.resident.delete({
    where: { id: residentId },
  });
};

export const create = async (data: ResidentCreateRequestBodyDto, apartmentId: string) => {
  return await prisma.resident.create({
    data: {
      ...data,
      apartmentId,
    },
    select: selectResidentFields,
  });
};

export const getApartmentIdByAdminId = async (adminId: string) => {
  return await prisma.apartment.findUnique({
    where: { adminId },
    select: { id: true },
  });
};
