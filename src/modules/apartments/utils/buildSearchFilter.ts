import { Prisma, UserRole } from '@prisma/client';
import { ApartmentRequestQueryDto } from '../dto/apartment.dto';

export const buildSearchFilter = (query: ApartmentRequestQueryDto, userRole: UserRole) => {
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

  return OR;
};
