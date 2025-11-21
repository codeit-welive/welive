import { RequestHandler } from 'express';
import { createResident, getResident, getResidentList, patchResident, removeResident } from './residents.service';
import { Prisma } from '@prisma/client';
import ApiError from '#errors/ApiError';
import { mapUniqueConstraintError } from '#helpers/mapPrismaError';

/**
 * @description 입주민 명부 목록 조회 핸들러
 *  - building, unitNumber, residenceStatus, isRegistered로 필터링
 *  - keyword로 이름 또는 연락처 검색
 * @query 검증된 쿼리 파라미터
 *  - building: 동
 *  - unitNumber: 호수
 *  - residenceStatus: 거주 상태
 *  - isRegistered: 가입 여부
 *  - keyword: 검색 키워드
 *  - limit: 페이지당 항목 수
 *  - page: 페이지 번호
 * @param adminId 관리자 ID (아파트 관리자 식별용)
 * @return 200 - 입주민 명부 목록 및 페이징 정보
 */
export const getResidentListHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery;
    const adminId = req.user.id;
    const result = await getResidentList(query, adminId);

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};

/**
 * @description 입주민 정보 상세 조회 핸들러
 * @param residentId 입주민 ID
 * @returns 200 - 입주민 정보
 */
export const getResidentHandler: RequestHandler = async (req, res, next) => {
  try {
    const residentId = res.locals.validatedParams.id;
    const result = await getResident(residentId);

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * @description 입주민 정보 수정 핸들러
 * @param residentId 입주민 ID
 * @returns 200 - 수정된 입주민 정보
 */
export const patchResidentHandler: RequestHandler = async (req, res, next) => {
  try {
    const residentId = res.locals.validatedParams.id;
    const data = res.locals.validatedBody;
    const result = await patchResident(residentId, data);

    return res.status(200).json(result);
  } catch (err) {
    // 대상 없음(P2025) → 404
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return next(ApiError.notFound('입주민을 찾을 수 없습니다.'));
    }
    return next(err);
  }
};

/**
 * @description 입주민 정보 삭제 핸들러
 * @param residentId 입주민 ID
 * @returns 200 - 삭제 성공 메시지
 */
export const deleteResidentHandler: RequestHandler = async (req, res, next) => {
  try {
    const residentId = res.locals.validatedParams.id;
    await removeResident(residentId);

    return res.status(200).send({ message: '작업이 성공적으로 완료되었습니다' });
  } catch (err) {
    // 대상 없음(P2025) → 404
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return next(ApiError.notFound('입주민을 찾을 수 없습니다.'));
    }
    return next(err);
  }
};

/**
 * @description 입주민 등록 핸들러
 * @param adminId 관리자 ID
 * @returns 201 - 생성된 입주민 정보
 */
export const createResidentHandler: RequestHandler = async (req, res, next) => {
  try {
    const data = res.locals.validatedBody;
    const adminId = req.user.id;
    const result = await createResident(data, adminId);

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const errorFields = err.meta?.target as string[] | undefined;

      if (Array.isArray(errorFields)) {
        return next(new ApiError(409, mapUniqueConstraintError(errorFields).message));
      }

      // err.meta.target 정보가 없을 때는 포괄적인 409로 처리
      return next(new ApiError(409, '이미 존재하는 값이 있습니다.'));
    }
    return next(err);
  }
};
