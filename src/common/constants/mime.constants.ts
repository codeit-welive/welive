/**
 * @file mime.constants.ts
 * @description 이미지 파일 MIME 타입 관련 상수
 */

export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];
