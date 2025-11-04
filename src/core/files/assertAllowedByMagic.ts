/**
 * @file assertAllowedByMagic.ts
 * @description 파일 버퍼 기반 실제 MIME 타입 검사
 */

import { fileTypeFromBuffer } from 'file-type';
import ApiError from '#errors/ApiError';
import { logger } from '#core/logger';
import { ALLOWED_IMAGE_MIMES, type AllowedImageMime } from '#constants/mime.constants';

/**
 * @function assertAllowedByMagic
 * @description 파일 버퍼를 기반으로 실제 MIME 타입을 검사합니다.
 * @returns {AllowedImageMime} 검증된 이미지 MIME 타입
 * @throws {ApiError} 허용되지 않은 형식일 경우 예외 발생
 */
export const assertAllowedByMagic = async (buffer: Buffer) => {
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) throw ApiError.badRequest('파일 형식을 인식할 수 없습니다.');

  const mime = detected.mime as string;
  logger.system.debug(`[File] 업로드 Mime: ${detected.mime}`);

  if (!(ALLOWED_IMAGE_MIMES as readonly string[]).includes(mime))
    throw ApiError.badRequest(`허용되지 않은 이미지 형식입니다. (${detected.mime})`);

  return mime as AllowedImageMime;
};
