import prisma from '#core/prisma';
import { SignupSuperAdminRequestDto, UserDto, ApartmentDto, SignupUserRequestDto } from './dto/register.dto';
import { ApprovalStatus, BoardType, JoinStatus, UserRole } from '@prisma/client';

const UserSelectFields = {
  id: true,
  name: true,
  email: true,
  joinStatus: true,
  isActive: true,
  role: true,
};

export const createSuperAdmin = async (data: SignupSuperAdminRequestDto) => {
  return prisma.user.create({
    data,
    select: UserSelectFields,
  });
};

export const createAdmin = async (userData: UserDto, apartmentData: ApartmentDto) => {
  // 유저 생성 -> 아파트 생성 후 연결 -> 아파트의 공지, 민원, 투표 게시판 생성
  return await prisma.user.create({
    data: {
      ...userData,
      apartment: {
        create: {
          ...apartmentData,
          boards: {
            create: [{ type: BoardType.NOTICE }, { type: BoardType.COMPLAINT }, { type: BoardType.POLL }],
          },
        },
      },
    },
    select: UserSelectFields,
  });
};

export const isUserDuplicate = async (data: SignupUserRequestDto) => {
  return prisma.user.findFirst({
    where: {
      OR: [{ username: data.username }, { email: data.email }, { contact: data.contact }],
    },
    select: { id: true },
  });
};

export const createUser = async (userData: SignupUserRequestDto) => {
  return prisma.$transaction(async (tx) => {
    // 아파트가 존재하는지 확인
    await tx.apartment.findUniqueOrThrow({
      where: { apartmentName: userData.apartmentName },
      select: { id: true },
    });

    // 유저 생성 및 거주자 생성, 연결
    const createdUser = await tx.user.create({
      data: {
        name: userData.name,
        username: userData.username,
        password: userData.password,
        contact: userData.contact,
        email: userData.email,
        role: userData.role,
        avatar: userData.avatar,
        resident: {
          connectOrCreate: {
            where: { contact: userData.contact },
            create: {
              name: userData.name,
              contact: userData.contact,
              building: userData.apartmentDong,
              unitNumber: userData.apartmentHo,
              isRegistered: true,
              apartment: { connect: { apartmentName: userData.apartmentName } },
            },
          },
        },
      },
      select: UserSelectFields,
    });
    return createdUser;
  });
};

export const findResidentByContact = async (contact: string) => {
  return prisma.resident.findUnique({
    where: { contact },
    select: { id: true },
  });
};

export const getApartmentRangeByName = async (apartmentName: string) => {
  return prisma.apartment.findUnique({
    where: { apartmentName },
    select: {
      startComplexNumber: true,
      endComplexNumber: true,
      startDongNumber: true,
      endDongNumber: true,
      startFloorNumber: true,
      endFloorNumber: true,
      startHoNumber: true,
      endHoNumber: true,
    },
  });
};

export const getPasswordByUsername = async (username: string) => {
  return prisma.user.findUniqueOrThrow({
    where: { username },
    select: {
      password: true,
      role: true,
    },
  });
};

export const getUserByUsername = async (username: string, role: UserRole) => {
  return prisma.user.findUniqueOrThrow({
    where: { username },
    select: {
      ...UserSelectFields,
      apartment:
        role === UserRole.ADMIN
          ? {
              select: {
                id: true,
                apartmentName: true,
                boards: { select: { id: true, type: true } },
              },
            }
          : undefined,
      resident:
        role === UserRole.USER
          ? {
              select: {
                building: true,
                apartment: {
                  select: {
                    id: true,
                    apartmentName: true,
                    boards: { select: { id: true, type: true } },
                  },
                },
              },
            }
          : undefined,
      username: true,
      contact: true,
      avatar: true,
    },
  });
};

export const getRoleById = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
    },
  });
};

export const patchAdminStatusRepo = async (adminId: string, status: JoinStatus) => {
  if (adminId) {
    return prisma.user.update({
      where: { id: adminId },
      data: { joinStatus: status },
    });
  } else {
    return prisma.user.updateMany({
      where: {
        role: UserRole.ADMIN,
        joinStatus: JoinStatus.PENDING,
      },
      data: { joinStatus: status },
    });
  }
};

export const patchUserStatusRepo = async (status: JoinStatus, userId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      joinStatus: status,
      resident: {
        update: { approvalStatus: status === JoinStatus.APPROVED ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED },
      },
    },
  });
};

export const patchUserListStatusRepo = async (status: JoinStatus, adminApartmentName: string) => {
  return await prisma.$transaction(async (tx) => {
    await tx.user.updateMany({
      where: {
        role: UserRole.USER,
        joinStatus: JoinStatus.PENDING,
        resident: {
          apartment: {
            apartmentName: adminApartmentName,
          },
        },
      },
      data: { joinStatus: status },
    });
    await tx.resident.updateMany({
      where: {
        apartment: { apartmentName: adminApartmentName },
        approvalStatus: ApprovalStatus.PENDING,
      },
      data: { approvalStatus: status === JoinStatus.APPROVED ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED },
    });
  });
};

export const getResidentById = async (residentId: string) => {
  return await prisma.resident.findUnique({
    where: { id: residentId },
    select: {
      user: {
        select: {
          id: true,
          role: true,
        },
      },
      apartment: {
        select: {
          apartmentName: true,
        },
      },
    },
  });
};

export const getApartmentNameByAdminId = async (adminId: string) => {
  return prisma.user.findUnique({
    where: { id: adminId },
    select: {
      apartment: {
        select: {
          apartmentName: true,
        },
      },
    },
  });
};

export const deleteRejectedUser = async (targetRole: UserRole) => {
  await prisma.user.deleteMany({
    where: {
      joinStatus: JoinStatus.REJECTED,
      role: targetRole,
    },
  });
};
