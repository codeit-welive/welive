/**
 * @file residents.file.controller.ts
 * @description 입주민용 CSV 템플릿 다운로드
 */

import type { RequestHandler } from 'express';
import { ResidentFileService } from './residents.file.service';
import ApiError from '#errors/ApiError';
import { filenameFormat } from './utils/csvUtil';
import { Prisma } from '@prisma/client';

/**
 * [GET] /api/residents/file/template
 */
export const downloadResidentTemplate: RequestHandler = async (req, res, next) => {
  try {
    const { filePath, downloadName } = ResidentFileService.getTemplateFile();

    res.download(filePath, downloadName, (err) => {
      if (err) next(ApiError.internal('파일 다운로드 중 오류가 발생했습니다.', err));
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @description 입주민 명부 다운로드
 * @param adminId 관리자 ID
 * @param query 필터링 및 페이징 정보
 */
export const downloadResidentList: RequestHandler = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const query = res.locals.validatedQuery;

    const csv = await ResidentFileService.getResidentListFile(adminId, query);
    const filename = `입주민명부_${filenameFormat(new Date())}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="residents.csv"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    return res.send(csv);
  } catch (err) {
    next(err);
  }
};

/**
 * @description CSV 파일로부터 입주민 일괄 등록
 * [POST] /api/residents/from-file
 * @param req.user.id 관리자 ID
 * @param res.locals.parsedCsv 파싱된 CSV 데이터
 * @returns 생성된 입주민 수
 */
export const uploadResidentListFile: RequestHandler = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const data = res.locals.parsedCsv;

    const createdCount = await ResidentFileService.createResidentFromFile(adminId, data);
    return res.status(201).json({
      message: `${createdCount}명의 입주민이 등록되었습니다`,
      count: createdCount,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return next(new ApiError(409, '이미 존재하는 연락처입니다', 'CONFLICT'));
      } else {
        return next(new ApiError(500, '입주민 등록 중 오류가 발생했습니다.'));
      }
    }
    next(err);
  }
};
