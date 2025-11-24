import prisma from '#core/prisma';
import { ResidentCsvDto } from './dto/csv.dto';
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

export const getById = async (residentId: string, apartmentId: string) => {
  return await prisma.resident.findUnique({
    where: {
      id: residentId,
      apartmentId,
    },
    select: selectResidentFields,
  });
};

export const update = async (residentId: string, data: ResidentPatchRequestBodyDto, apartmentId: string) => {
  return await prisma.resident.update({
    where: {
      id: residentId,
      apartmentId,
    },
    data,
    select: selectResidentFields,
  });
};

export const remove = async (residentId: string, apartmentId: string) => {
  return await prisma.resident.delete({
    where: {
      id: residentId,
      apartmentId,
    },
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

/**
 * @description 관리자 ID로 아파트 ID 조회
 * @param adminId 관리자 ID
 * @returns 아파트 ID
 */
export const getApartmentIdByAdminId = async (adminId: string) => {
  return await prisma.apartment.findUnique({
    where: { adminId },
    select: { id: true },
  });
};

/**
 * @description 입주민 명부 다운로드용 데이터 조회
 * @param adminId 관리자 ID
 * @param query 필터링 및 페이징 정보
 * @returns 입주민 목록
 */
export const getResidentListForDownload = async (adminId: string, query: ResidentListRequestQueryDto) => {
  return await prisma.resident.findMany({
    where: buildWhereCondition(query, adminId),
    select: {
      building: true,
      unitNumber: true,
      contact: true,
      name: true,
      isHouseholder: true,
    },
  });
};

/**
 * @description 입주민 일괄 생성
 * @param data 입주민 데이터 배열
 * @param apartmentId 아파트 ID
 * @returns 생성된 입주민 수 정보
 */
export const createMany = async (data: ResidentCsvDto[], apartmentId: string) => {
  return await prisma.resident.createMany({
    data: data.map((item) => ({
      building: item.building,
      unitNumber: item.unitNumber,
      name: item.name,
      contact: item.contact,
      apartmentId,
      isHouseholder: item.isHouseholder === '세대주' ? 'HOUSEHOLDER' : 'MEMBER',
    })),
    skipDuplicates: true,
  });
};
