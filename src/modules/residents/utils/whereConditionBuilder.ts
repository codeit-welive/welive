import { Prisma } from '@prisma/client';
import { ResidentListRequestQueryDto } from '../dto/resident.dto';

export const buildWhereCondition = (query: ResidentListRequestQueryDto, adminId: string) => {
  const mode = 'insensitive' as Prisma.QueryMode;
  const whereCondition = {
    ...(query.building && { building: query.building }),
    ...(query.unitNumber && { unitNumber: query.unitNumber }),
    ...(query.isHouseholder && { isHouseholder: query.isHouseholder }),
    ...(query.isRegistered !== undefined && { isRegistered: query.isRegistered }),
    apartment: { adminId },
    OR: [{ name: { contains: query.keyword, mode } }, { contact: { contains: query.keyword, mode } }],
  };

  return whereCondition;
};
