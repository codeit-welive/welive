import { createSuperAdmin, createAdmin, createUser } from './auth.repo';
import { SignupSuperAdminRequestDto, SignupAdminRequestDto, SignupUserRequestDto } from './dto/register.dto';
import { hashPassword } from '#core/utils/passwordUtils';
import { adminDataMapper } from './utils/dataMapper';
import { checkDuplicateData } from './utils/checkDuplicateData';
import ApiError from '#errors/ApiError';
import { Prisma } from '@prisma/client';

export const registSuperAdmin = async (data: SignupSuperAdminRequestDto) => {
  try {
    const createdSuperAdmin = await createSuperAdmin({
      ...data,
      password: await hashPassword(data.password),
    });

    return createdSuperAdmin;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const errorFields = err.meta?.target as string[];
      throw ApiError.conflict(checkDuplicateData(errorFields).message);
    } else {
      throw err;
    }
  }
};

export const registAdmin = async (data: SignupAdminRequestDto) => {
  try {
    const { userData, apartmentData } = await adminDataMapper(data);
    const createdUser = await createAdmin(userData, apartmentData);

    return createdUser;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const errorFields = err.meta?.target as string[];
      throw ApiError.conflict(checkDuplicateData(errorFields).message);
    } else {
      throw err;
    }
  }
};

export const registUser = async (data: SignupUserRequestDto) => {
  try {
    const createdUser = await createUser(data);
    return createdUser;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const errorFields = err.meta?.target as string[];
        throw ApiError.conflict(checkDuplicateData(errorFields).message);
      } else if (err.code === 'P2025') {
        throw ApiError.notFound('해당 아파트가 존재하지 않습니다.');
      }
    } else {
      throw err;
    }
  }
};
