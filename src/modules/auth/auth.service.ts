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
  patchApartmentInfoRepo,
  deleteApartmentRepo,
  getSuperAdminIdList,
  getAdminIdByApartmentName,
} from './auth.repo';
import { SignupSuperAdminRequestDto, SignupAdminRequestDto, SignupUserRequestDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { hashPassword, isPasswordValid } from '#core/utils/passwordUtils';
import { adminDataMapper } from './utils/dataMapper';
import { searchResultToResponse } from './utils/searchResultMapper';
import { generateAccessToken, generateRefreshToken } from './utils/tokenUtils';
import ApiError from '#errors/ApiError';
import { JoinStatus, UserRole } from '@prisma/client';
import { checkDuplicateApartment, checkDuplicateUser } from '#helpers/checkDuplicate';
import { PatchApartmentBodyDto } from './dto/auth.dto';
import { SIGN_UP_NOTIFICATIONS } from '#constants/auth.constant';
import { createAndSendNotification } from '#core/utils/notificationHelper';
import { createLimit } from '#core/utils/Limiter';

const limit = createLimit(5);

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

  // 모든 Super Admin에게 알림 전송
  const notification = SIGN_UP_NOTIFICATIONS.ADMIN;
  const superAdmins = await getSuperAdminIdList();
  for (const admin of superAdmins) {
    limit(async () => {
      createAndSendNotification(
        {
          content: notification.content,
          notificationType: notification.type,
          recipientId: admin.id,
        },
        admin.id
      );
    });
  }

  return createdUser;
};

export const registUser = async (data: SignupUserRequestDto) => {
  await checkDuplicateUser(data.username, data.email, data.contact);
  const createdUser = await createUser({
    ...data,
    password: await hashPassword(data.password),
  });

  // 아파트 관리자에게 알림 전송
  const notification = SIGN_UP_NOTIFICATIONS.USER;
  const apartment = await getAdminIdByApartmentName(data.apartmentName);
  createAndSendNotification(
    {
      content: notification.content,
      notificationType: notification.type,
      recipientId: createdUser.id,
    },
    apartment.adminId as unknown as string
  );

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

export const patchApartmentInfo = async (adminId: string, data: PatchApartmentBodyDto) => {
  const { contact, name, email, ...rest } = data;
  const apartmentData = rest;
  const userData = { contact, name, email };

  await patchApartmentInfoRepo(adminId, apartmentData, userData);
};

export const deleteApartmentInfo = async (adminId: string) => {
  await deleteApartmentRepo(adminId);
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
