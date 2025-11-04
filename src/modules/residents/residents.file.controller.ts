/**
 * @file residents.file.controller.ts
 * @description 입주민용 CSV 템플릿 다운로드
 */

import type { RequestHandler } from 'express';
import { ResidentFileService } from './residents.file.service';
import ApiError from '#errors/ApiError';

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
