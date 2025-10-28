import { createSuperAdmin, createAdmin, createUser } from './auth.repo';
import { SignupSuperAdminRequestDto, SignupAdminRequestDto, SignupUserRequestDto } from './dto/register.dto';
import { hashPassword } from '#core/utils/passwordUtils';
import { adminDataMapper } from './utils/dataMapper';

export const registSuperAdmin = async (data: SignupSuperAdminRequestDto) => {
  const createdSuperAdmin = await createSuperAdmin({
    ...data,
    password: await hashPassword(data.password),
  });

  return createdSuperAdmin;
};

export const registAdmin = async (data: SignupAdminRequestDto) => {
  const { userData, apartmentData } = await adminDataMapper(data);
  const createdUser = await createAdmin(userData, apartmentData);

  return createdUser;
};

export const registUser = async (data: SignupUserRequestDto) => {
  const createdUser = await createUser(data);
  return createdUser;
};
