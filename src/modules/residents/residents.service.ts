import ApiError from '#errors/ApiError';
import { ResidentListRequestQueryDto } from './dto/resident.dto';
import { getCount, getList, getById } from './residents.repo';
import { residentDataMapper } from './utils/dataMapper';

export const getResidentList = async (query: ResidentListRequestQueryDto, adminId: string) => {
  const [residents, count] = await Promise.all([getList(query, adminId), getCount(query, adminId)]);
  const mappedResidents = residentDataMapper(residents);
  return {
    residents: mappedResidents,
    message: `조회된 입주민 결과가 ${count}건 입니다.`,
    count,
  };
};

export const getResident = async (residentId: string) => {
  const resident = await getById(residentId);
  if (!resident) {
    throw ApiError.notFound('입주민을 찾을 수 없습니다.');
  }

  const [mappedResident] = residentDataMapper([resident]);
  return mappedResident;
};
