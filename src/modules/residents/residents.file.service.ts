/**
 * @file residents.file.service.ts
 * @description 입주민 템플릿 파일 관련 서비스
 * - 파일 존재 여부 검증
 * - 다운로드용 경로/파일명 반환
 */

import path from 'path';
import fs from 'fs';
import ApiError from '#errors/ApiError';
import { toCsv } from './utils/csvUtil';
import { ResidentListRequestQueryDto } from './dto/resident.dto';
import { getResidentListForDownload } from './residents.repo';

export const ResidentFileService = {
  getTemplateFile() {
    const filePath = path.resolve(process.cwd(), 'public', 'templates', 'residents_template.csv');

    if (!fs.existsSync(filePath)) throw ApiError.badRequest('템플릿 파일을 찾을 수 없습니다.');

    return {
      filePath,
      downloadName: '입주민명부_템플릿.csv',
    };
  },
  async getResidentListFile(adminId: string, query: ResidentListRequestQueryDto) {
    const residents = await getResidentListForDownload(adminId, query);
    return (
      '\uFEFF' +
      toCsv(
        residents,
        ['building', 'unitNumber', 'name', 'contact', 'isHouseholder'],
        ['동', '호수', '이름', '연락처', '세대주여부']
      )
    );
  },
};
