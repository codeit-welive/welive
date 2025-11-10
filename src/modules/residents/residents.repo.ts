import prisma from '#core/prisma';
import { ResidentListRequestQueryDto } from './dto/resident.dto';
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

export const getList = async (query: ResidentListRequestQueryDto) => {
  return await prisma.resident.findMany({
    where: buildWhereCondition(query),
    select: selectResidentFields,
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  });
};

export const getCount = async (query: ResidentListRequestQueryDto) => {
  return await prisma.resident.count({
    where: buildWhereCondition(query),
  });
};

export const getById = async (residentId: string) => {
  return await prisma.resident.findUnique({
    where: { id: residentId },
    select: selectResidentFields,
  });
};
