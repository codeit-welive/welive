import { createSuperAdmin, createAdmin, createUser, getPasswordByUsername, getUserByUsername } from './auth.repo';
import { SignupSuperAdminRequestDto, SignupAdminRequestDto, SignupUserRequestDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { hashPassword, isPasswordValid } from '#core/utils/passwordUtils';
import { adminDataMapper } from './utils/dataMapper';
import { searchResultToResponse } from './utils/searchResultMapper';
import { generateAccessToken, generateRefreshToken } from './utils/tokenUtils';
import ApiError from '#errors/ApiError';

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
  const createdUser = await createUser({
    ...data,
    password: await hashPassword(data.password),
  });
  return createdUser;
};

export const login = async (data: LoginDto) => {
  const { username, password } = data;
  const hashedPassword = await getPasswordByUsername(username);

  if (!(await isPasswordValid(password, hashedPassword.password))) {
    throw ApiError.unauthorized('잘못된 비밀번호입니다');
  }

  const rawUserData = await getUserByUsername(username, hashedPassword.role);
  const createdUser = searchResultToResponse(rawUserData);

  const accessToken = generateAccessToken({ id: createdUser.id, role: createdUser.role });
  const refreshToken = generateRefreshToken({ id: createdUser.id, role: createdUser.role });
  return { user: createdUser, accessToken, refreshToken };
};
