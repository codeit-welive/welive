/**
 * @file deleteImageFromS3.ts
 * @description S3에서 이미지 파일을 삭제하는 유틸리티
 */

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import env from '#core/env';
import { logger } from '#core/logger';

export const deleteImageFromS3 = async (url: string): Promise<void> => {
  try {
    if (!env.AWS_CONFIG.enabled) return;

    const baseUrl = env.AWS_CONFIG.baseUrl!;
    if (!url.startsWith(baseUrl)) {
      logger.system.warn(`[S3] 삭제 실패: baseUrl과 불일치 (${url})`);
      return;
    }

    const key = url.replace(`${baseUrl}/`, '');

    const s3 = new S3Client({
      region: env.AWS_CONFIG.region!,
    });

    await s3.send(
      new DeleteObjectCommand({
        Bucket: env.AWS_CONFIG.bucketName!,
        Key: key,
      })
    );

    logger.system.debug(`[S3] 기존 이미지 삭제 성공: ${key}`);
  } catch (err) {
    logger.system.warn(`[S3] 이미지 삭제 중 오류: ${(err as Error).message}`);
  }
};
