import { Prisma, UserRole } from '@prisma/client';
import { ApartmentRequestQueryDto } from '../dto/apartment.dto';

export const buildSearchFilter = (query: ApartmentRequestQueryDto) => {
  const OR = [];
  const mode = 'insensitive' as Prisma.QueryMode;

  OR.push({ apartmentName: { contains: query.searchKeyword, mode } });
  OR.push({ apartmentAddress: { contains: query.searchKeyword, mode } });
  OR.push({ admin: { name: { contains: query.searchKeyword, mode } } });
  OR.push({ admin: { email: { contains: query.searchKeyword, mode } } });

  return OR;
};

export const buildWhereCondition = (query: ApartmentRequestQueryDto, userRole: UserRole | undefined) => {
  const whereCondition = {
    ...(query.apartmentStatus && userRole && { admin: { joinStatus: query.apartmentStatus } }),
    ...(userRole && { OR: buildSearchFilter(query) }),
  };

  return whereCondition;
};
