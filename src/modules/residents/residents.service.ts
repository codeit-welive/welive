import ApiError from '#errors/ApiError';
import {
  ResidentCreateRequestBodyDto,
  ResidentListRequestQueryDto,
  ResidentPatchRequestBodyDto,
} from './dto/resident.dto';
import { getCount, getList, getById, update, remove, create } from './residents.repo';
import { residentDataMapper } from './utils/dataMapper';

export const getResidentList = async (query: ResidentListRequestQueryDto, adminId: string) => {
  const [residents, totalCount] = await Promise.all([getList(query, adminId), getCount(query, adminId)]);
  const mappedResidents = residentDataMapper(residents);
  const count = mappedResidents.length;

  return {
    residents: mappedResidents,
    message: `조회된 입주민 결과가 ${count}건 입니다.`,
    count,
    totalCount,
  };
};

export const getResident = async (residentId: string, adminId: string) => {
  const resident = await getById(residentId, adminId);
  if (!resident) {
    throw ApiError.notFound('입주민을 찾을 수 없습니다.');
  }

  const [mappedResident] = residentDataMapper([resident]);
  return mappedResident;
};

export const patchResident = async (residentId: string, data: ResidentPatchRequestBodyDto, adminId: string) => {
  const updatedResident = await update(residentId, data, adminId);

  const [mappedResident] = residentDataMapper([updatedResident]);
  return mappedResident;
};

export const removeResident = async (residentId: string, adminId: string) => {
  await remove(residentId, adminId);
};

export const createResident = async (data: ResidentCreateRequestBodyDto, adminId: string) => {
  const resident = await create(data, adminId);
  const [mappedResident] = residentDataMapper([resident]);
  return mappedResident;
};
