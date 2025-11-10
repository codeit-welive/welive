import { ResidentResponseDto } from '../dto/resident.dto';
import { JoinStatus } from '@prisma/client';

export const residentDataMapper = (residents: ResidentResponseDto[]) => {
  return residents.map((resident) => {
    const { user, ...rest } = resident;
    return {
      ...rest,
      userId: user ? user.id : {},
      email: user ? user.email : {},
    };
  });
};
