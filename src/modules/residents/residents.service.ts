import ApiError from '#errors/ApiError';
import {
  ResidentCreateRequestBodyDto,
  ResidentListRequestQueryDto,
  ResidentPatchRequestBodyDto,
} from './dto/resident.dto';
import { getCount, getList, getById, update, remove, getApartmentIdByAdminId, create } from './residents.repo';
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

export const patchResident = async (residentId: string, data: ResidentPatchRequestBodyDto) => {
  const updatedResident = await update(residentId, data);
  if (!updatedResident) {
    throw ApiError.notFound('입주민을 찾을 수 없습니다.');
  }

  const [mappedResident] = residentDataMapper([updatedResident]);
  return mappedResident;
};

export const removeResident = async (residentId: string) => {
  await remove(residentId);
};

export const createResident = async (data: ResidentCreateRequestBodyDto, adminId: string) => {
  const apartmentId = await getApartmentIdByAdminId(adminId);
  if (!apartmentId) {
    throw ApiError.notFound('아파트를 찾을 수 없습니다');
  }

  const resident = await create(data, apartmentId.id);
  const [mappedResident] = residentDataMapper([resident]);
  return mappedResident;
};
