import { ResidentListRequestQueryDto } from '../dto/resident.dto';

export const buildWhereCondition = (query: ResidentListRequestQueryDto) => {
  let whereCondition = {
    ...(query.building && { building: query.building }),
    ...(query.unitNumber && { unitNumber: query.unitNumber }),
    ...(query.residenceStatus && { residenceStatus: query.residenceStatus }),
    ...(query.isRegistered && { isRegistered: query.isRegistered }),
  };

  return whereCondition;
};
