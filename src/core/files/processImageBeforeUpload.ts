/**
 * @file processImageBeforeUpload.ts
 * @description 업로드 전 이미지 리사이징 및 재인코딩 처리
 */

import sharp from 'sharp';
import ApiError from '#errors/ApiError';
import { logger } from '#core/logger';

/**
 * @function processImageBeforeUpload
 * @description Sharp를 사용해 이미지 리사이징 및 Webp 재인코딩을 수행합니다.
 * @param {Buffer} buffer 원본 이미지 버퍼
 * @returns {Promise<Buffer>} 리사이징 및 인코딩된 이미지 버퍼
 */
export const processImageBeforeUpload = async (buffer: Buffer): Promise<Buffer> => {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    logger.system.debug(`[Sharp] 원본 해상도: ${metadata.width}x${metadata.height}`);

    const resized = await image
      .resize({ width: 512, height: 512, fit: 'cover' })
      .toFormat('webp', { quality: 90 })
      .toBuffer();

    logger.system.debug(`[Sharp] 변환 완료 (Webp, ${resized.length / 1024}KB)`);
    return resized;
  } catch (err) {
    logger.system.error(err as Error, '[Sharp] 이미지 처리 중 오류,');
    throw ApiError.internal('이미지 처리 중 오류가 발생했습니다', err);
  }
};
