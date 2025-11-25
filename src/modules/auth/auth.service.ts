import {
  createSuperAdmin,
  createAdmin,
  createUser,
  getPasswordByUsername,
  getUserByUsername,
  getResidentById,
  getRoleById,
  patchAdminStatusRepo,
  patchUserStatusRepo,
  patchUserListStatusRepo,
  getApartmentNameByAdminId,
  deleteRejectedUser,
} from './auth.repo';
import { SignupSuperAdminRequestDto, SignupAdminRequestDto, SignupUserRequestDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { hashPassword, isPasswordValid } from '#core/utils/passwordUtils';
import { adminDataMapper } from './utils/dataMapper';
import { searchResultToResponse } from './utils/searchResultMapper';
import { generateAccessToken, generateRefreshToken } from './utils/tokenUtils';
import ApiError from '#errors/ApiError';
import { JoinStatus, UserRole } from '@prisma/client';
import { checkDuplicateApartment, checkDuplicateUser } from './utils/checkDuplicate';

export const registSuperAdmin = async (data: SignupSuperAdminRequestDto) => {
  await checkDuplicateUser(data.username, data.email, data.contact);
  const createdSuperAdmin = await createSuperAdmin({
    ...data,
    password: await hashPassword(data.password),
  });

  return createdSuperAdmin;
};

export const registAdmin = async (data: SignupAdminRequestDto) => {
  await checkDuplicateUser(data.username, data.email, data.contact);
  await checkDuplicateApartment(data.apartmentName);
  const { userData, apartmentData } = await adminDataMapper(data);
  const createdUser = await createAdmin(userData, apartmentData);

  return createdUser;
};

export const registUser = async (data: SignupUserRequestDto) => {
  await checkDuplicateUser(data.username, data.email, data.contact);
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

  const accessToken = generateAccessToken({
    id: createdUser.id,
    role: createdUser.role,
    joinStatus: createdUser.joinStatus,
    isActive: createdUser.isActive,
    apartmentId: createdUser.apartmentId,
  });
  const refreshToken = generateRefreshToken({
    id: createdUser.id,
    role: createdUser.role,
    joinStatus: createdUser.joinStatus,
    isActive: createdUser.isActive,
    apartmentId: createdUser.apartmentId,
  });
  return { user: createdUser, accessToken, refreshToken };
};

export const patchAdminStatus = async (adminId: string, status: JoinStatus) => {
  if (adminId) {
    const targetRole = await getRoleById(adminId);
    if (targetRole?.role !== UserRole.ADMIN) {
      throw ApiError.badRequest('잘못된 요청입니다', 'role_mismatch');
    }
  }
  await patchAdminStatusRepo(adminId, status);
};

export const patchUserStatus = async (residentId: string, status: JoinStatus, adminId: string) => {
  const resident = await getResidentById(residentId);
  if (!resident?.user) {
    throw ApiError.notFound('가입하지 않은 유저입니다');
  }

  const userId = resident.user.id;
  const targetRole = resident.user.role;
  const adminApartment = await getApartmentNameByAdminId(adminId);
  const adminApartmentName = adminApartment?.apartment?.apartmentName as string;

  if (residentId) {
    if (targetRole !== UserRole.USER || resident?.apartment.apartmentName !== adminApartmentName) {
      throw ApiError.badRequest('잘못된 요청입니다', 'mismatch');
    }
  }

  await patchUserStatusRepo(status, userId);
};

export const patchUserListStatus = async (status: JoinStatus, adminId: string) => {
  const adminApartment = await getApartmentNameByAdminId(adminId);
  const adminApartmentName = adminApartment?.apartment?.apartmentName as string;

  await patchUserListStatusRepo(status, adminApartmentName);
};

export const cleanupRejectedUsers = async (role: UserRole, adminId: string | undefined) => {
  const ROLE_CLEANUP_MAP: Record<UserRole, UserRole | null> = {
    SUPER_ADMIN: UserRole.ADMIN,
    ADMIN: UserRole.USER,
    USER: null, // 권한 X
  };

  const targetRole = ROLE_CLEANUP_MAP[role];

  if (!targetRole) throw ApiError.forbidden('권한이 없습니다');

  let apartmentName;
  if (adminId) {
    const apartment = await getApartmentNameByAdminId(adminId);
    if (!apartment) throw ApiError.notFound('아파트를 찾을 수 없습니다');
    apartmentName = apartment?.apartment?.apartmentName;
  }
  await deleteRejectedUser(targetRole, apartmentName);
};
