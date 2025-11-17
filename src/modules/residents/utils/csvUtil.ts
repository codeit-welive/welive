import { Readable } from 'stream';
import { parse } from 'csv-parse';
/**
 * @description CSV 변환 유틸리티
 * @param rows 데이터 레코드 배열
 * @param headers 객체 키값 배열
 * @param label 컬럼명 배열
 * @returns CSV 문자열
 */
export const toCsv = (rows: Record<string, string>[], headers: string[], label: string[]) => {
  if (rows.length === 0) {
    return label.join(',') + '\r\n';
  }
  const columnNames = label.join(',');
  const lines = rows.map((row) => {
    return headers.map((col) => row[col] ?? '').join(',');
  });
  return [columnNames, ...lines].join('\r\n');
};

export const filenameFormat = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

export const extractHeaderFromBuffer = async (buffer: Buffer) => {
  const stream = Readable.from(buffer);
  const parser = stream.pipe(parse({ to_line: 1, bom: true, relax_column_count: true, trim: true }));

  for await (const record of parser) {
    return record;
  }
  return [];
};
