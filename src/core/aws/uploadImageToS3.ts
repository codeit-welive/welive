/**
 * @file uploadImageToS3.ts
 * @description 이미지 파일을 AWS S3에 업로드하는 유틸리티
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { fromInstanceMetadata } from '@aws-sdk/credential-providers';
import { randomUUID } from 'crypto';
import env from '#core/env';
import { logger } from '#core/logger';
import ApiError from '#errors/ApiError';

/**
 * @function uploadImageToS3
 * @description 처리된 이미지 버퍼를 S3에 업로드하고 URL과 key를 반환합니다.
 * @param {Buffer} buffer 업로드할 이미지 버퍼 (이미 webp로 변환된 상태)
 * @returns {Promise<{ url: string; key: string }>}
 */
export const uploadImageToS3 = async (buffer: Buffer): Promise<string> => {
  if (!env.AWS_CONFIG.enabled) throw ApiError.internal('AWS S3 설정이 활성화되어 있지 않습니다.');

  try {
    // S3 클라이언트 생성
    const s3 = new S3Client({
      region: env.AWS_CONFIG.region!,
      credentials: fromInstanceMetadata(),
    });

    // 파일명 생성
    const uuid = randomUUID();
    const timestamp = Date.now();
    const key = `avatars/${timestamp}-${uuid}.webp`;

    // 업로드
    await s3.send(
      new PutObjectCommand({
        Bucket: env.AWS_CONFIG.bucketName!,
        Key: key,
        Body: buffer,
        ACL: 'public-read',
        ContentType: 'image/webp',
      })
    );

    // URL 생성
    const url = `${env.AWS_CONFIG.baseUrl}/${key}`;
    logger.system.debug(`[S3] 업로드 성공: ${url}`);

    return url;
  } catch (err) {
    logger.system.error(err as Error, '[S3] 업로드 실패');
    throw ApiError.internal('S3 업로드 중 오류가 발생했습니다.', err);
  }
};
