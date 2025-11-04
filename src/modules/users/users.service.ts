import { hashPassword, isPasswordValid } from '#helpers/passwordUtils';
import ApiError from '#errors/ApiError';
import { findUserById, updateUser } from './users.repo';
import { USER_MESSAGES as MSG } from '#constants/user.constants';
import { assertAllowedByMagic } from '#core/files/assertAllowedByMagic';
import { processImageBeforeUpload } from '#core/files/processImageBeforeUpload';
import { uploadImageToS3 } from '#core/aws/uploadImageToS3';
import { deleteImageFromS3 } from '#core/aws/deleteImageFromS3';

interface UpdateUserPayload {
  body: {
    currentPassword?: string;
    newPassword?: string;
  };
  file?: {
    buffer: Buffer;
  };
}

export const updateUserService = async (userId: string, { body, file }: UpdateUserPayload) => {
  const updates: Record<string, any> = {};
  const user = await findUserById(userId);
  if (!user) throw ApiError.badRequest(MSG.USER_NOT_FOUND);

  // 비밀번호 변경
  if (body.currentPassword && body.newPassword) {
    const match = await isPasswordValid(body.currentPassword, user.password);
    if (!match) throw ApiError.forbidden(MSG.FORBIDDEN);

    const hashed = await hashPassword(body.newPassword);
    updates.password = hashed;
  }

  // 아바타 업로드
  if (file && file.buffer) {
    const buffer = file.buffer;

    // MIME 체크
    await assertAllowedByMagic(buffer);

    // Sharp 변환
    const processed = await processImageBeforeUpload(buffer);

    // S3 업로드
    const url = await uploadImageToS3(processed);

    updates.avatar = url;
  }

  if (Object.keys(updates).length === 0) throw ApiError.unprocessable(MSG.UNPROCESSABLE);

  // DB 업데이트
  const updatedUser = await updateUser(userId, updates);

  // 기존 아바타 삭제
  if (updates.avatar && user.avatar) deleteImageFromS3(user.avatar); // fire-and-forget

  return {
    message: `${updatedUser.name}${MSG.UPDATE_SUCCESS}`,
  };
};
