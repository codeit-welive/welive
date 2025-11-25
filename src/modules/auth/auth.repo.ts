import prisma from '#core/prisma';
import { PatchApartmentBodyDto } from './dto/auth.dto';
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

/**
 * 중복 유저 확인
 * @description 아이디, 이메일, 연락처 중 하나라도 중복되는 유저가 있는지 확인
 * @param data
 *  - username: 아이디
 *  - email: 이메일
 *  - contact: 연락처
 * @returns 중복된 유저 정보 또는 null
 */
export const findDuplicateUser = async (data: { username: string; email: string; contact: string }) => {
  return prisma.user.findFirst({
    where: {
      OR: [{ username: data.username }, { email: data.email }, { contact: data.contact }],
    },
    select: {
      username: true,
      email: true,
      contact: true,
    },
  });
};

/**
 * 중복 아파트 확인
 * @description 아파트 이름이 중복되는 아파트가 있는지 확인
 * @param apartmentName 아파트 이름
 * @returns 중복된 아파트 정보 또는 null
 */
export const findDuplicateApartment = async (apartmentName: string) => {
  return prisma.apartment.findFirst({
    where: { apartmentName },
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

/**
 * @description 아파트 이름으로 아파트 동, 호수 정보 조회
 * @param apartmentName 아파트 이름
 * @returns 아파트 동, 호수 정보
 */
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

/**
 * 아이디로 유저 정보 조회
 * @description
 * - 관리자는 apartment 필드 포함
 * - 사용자는 resident 필드 포함
 * @param username 아이디
 * @param role 사용자 역할
 * @returns 유저 정보
 */
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

/**
 * 관리자 가입 상태 수정
 * @description
 *  - 관리자 ID가 주어지면 해당 관리자만 수정
 *  - 관리자 ID가 주어지지 않으면 가입 대기 중인 모든 관리자 수정
 * @param adminId 관리자 ID
 * @param status 변경하려는 상태
 */
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

/**
 * 유저 가입 상태 수정
 * @description
 *  - userId로 특정 유저의 가입 상태 수정
 *  - resident 테이블의 approvalStatus도 함께 수정
 * @param status 변경하려는 상태
 * @param userId 유저 ID
 */
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

/**
 * 유저 가입 상태 일괄 변경
 * @description
 *  - adminApartmentName 아파트에 속한 가입 대기 중인 모든 유저의 상태를 변경
 *  - resident 테이블의 approvalStatus도 함께 수정
 * @param status 변경하려는 상태
 * @param adminApartmentName 아파트 이름
 * @returns
 */
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

export const patchApartmentInfoRepo = async (
  adminId: string,
  apartmentData: Partial<PatchApartmentBodyDto>,
  userData: Partial<PatchApartmentBodyDto>
) => {
  return prisma.$transaction(async (tx) => {
    await tx.apartment.update({
      where: { adminId },
      data: apartmentData,
    });
    await tx.user.update({
      where: { id: adminId },
      data: userData,
    });
  });
};

export const deleteApartmentRepo = async (adminId: string) => {
  return await prisma.user.delete({
    where: { id: adminId },
  });
};
/**
 * 거절 유저 삭제
 * @description
 *  - targetRole 역할을 가진 거절된 유저 삭제
 *  - 관리자의 경우 자신의 아파트 소속만 삭제
 *  - resident 테이블의 isRegistered 필드도 false로 변경
 *  - 관리자가 삭제될 경우 아파트도 삭제됨
 * @param targetRole
 * @param apartmentName
 */
export const deleteRejectedUser = async (targetRole: UserRole, apartmentName: string | undefined) => {
  await prisma.$transaction(async (tx) => {
    if (apartmentName) {
      await tx.resident.updateMany({
        where: {
          user: {
            joinStatus: JoinStatus.REJECTED,
            role: targetRole,
            resident: { apartment: { apartmentName } },
          },
        },
        data: { isRegistered: false },
      });
    }

    await tx.user.deleteMany({
      where: {
        joinStatus: JoinStatus.REJECTED,
        role: targetRole,
        ...(apartmentName && {
          resident: { apartment: { apartmentName } },
        }),
      },
    });
  });
};
