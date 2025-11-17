import { RequestHandler } from 'express';
import { Readable } from 'stream';
import { parse } from 'csv-parse';
import { residentCsvSchema } from '#modules/residents/dto/csv.dto';

const csvParser: RequestHandler = async (req, res, next) => {
  try {
    const stream = Readable.from(req.file!.buffer);
    const parser = stream.pipe(parse({ columns: true, trim: true, bom: true }));

    const mappedRecords = [];
    for await (const record of parser) {
      // record는 { header1: '...', header2: '...' } 형태 (columns: true)
      // 필드 이름이 다르면 매핑하거나 normalize해서 사용
      const normalized = {
        building: String(record['동'] ?? '').trim(),
        unitNumber: String(record['호수'] ?? '').trim(),
        contact: String(record['연락처'] ?? '').trim(),
        name: String(record['이름'] ?? '').trim(),
        isHouseholder: String(record['세대주여부'] ?? '').trim(),
      };
      const validatedRecord = residentCsvSchema.parse(normalized);
      mappedRecords.push(validatedRecord);
    }

    res.locals.parsedCsv = mappedRecords;
    next();
  } catch (err) {
    next(err);
  }
};

export default csvParser;
