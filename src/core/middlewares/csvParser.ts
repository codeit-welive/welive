import type { RequestHandler } from 'express';
import { residentCsvSchema } from '#modules/residents/dto/csv.dto';
import ApiError from '#errors/ApiError';
import forwardZodError from '#core/utils/zod';

/**
 * 세대주여부 매핑 딕셔너리
 * - CSV의 "세대주"/"세대원"을 Prisma enum 값으로 변환
 */

/**
 * @description CSV 파일을 파싱하고 유효성을 검증하는 미들웨어
 * @param req.file 업로드된 CSV 파일 (multer를 통해 처리됨)
 * @returns res.locals.parsedCsv 파싱 및 검증된 입주민 데이터 배열
 */
const csvParser: RequestHandler = async (req, res, next) => {
  try {
    // validateCsvHeader에서 전처리되지만, 추가 방어 처리
    if (!req.file) return next(ApiError.badRequest('파일이 첨부되지 않았습니다.'));

    // 전체 CSV → 문자열 변환
    const raw = req.file.buffer.toString('utf-8');
    const text = raw.replace(/^\uFEFF/, ''); // BOM 제거

    // 라인 바이 라인 파싱
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // 헤더만 있는 경우 빈 배열 반환
    if (lines.length <= 1) {
      res.locals.parsedCsv = [];
      return next();
    }

    // 첫 줄은 헤더 (validate에서 검증)
    const [, ...dataLines] = lines;
    const parsedRecords: unknown[] = [];

    for (const line of dataLines) {
      // 간단 CSV 파싱 (이번 스펙 상 콤마 포함 필드는 없다는 전제)
      const cols = line.split(',');

      // 열 개수가 맞지 않으면 잘못된 CSV 형식으로 간주
      if (cols.length < 5) {
        return next(ApiError.badRequest('CSV 데이터 형식이 올바르지 않습니다.'));
      }

      const [buildingRaw, unitNumberRaw, nameRaw, contactRaw, isHouseholderRaw] = cols.map((c) => c.trim());

      // 완전히 비어 있는 줄은 스킵 (마지막 라인에 공백 줄 등이 들어왔을 때)
      if (!buildingRaw && !unitNumberRaw && !nameRaw && !contactRaw && !isHouseholderRaw) continue;

      // Zod 스키마에 맞게 normalize
      const dtoInput = {
        building: buildingRaw,
        unitNumber: unitNumberRaw,
        name: nameRaw,
        contact: contactRaw,
        isHouseholder: isHouseholderRaw,
      };

      // 행 단위 유효성 검증
      const validated = residentCsvSchema.parse(dtoInput);
      parsedRecords.push(validated);
    }

    res.locals.parsedCsv = parsedRecords;
    return next();
  } catch (err) {
    // CSV 내용 자체가 스키마와 맞지 않는 경우 → 400으로 매핑
    return forwardZodError(err, '입주민 CSV 데이터', next);
  }
};

export default csvParser;
