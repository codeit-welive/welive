import prisma from '#core/prisma';
import { SignupSuperAdminRequestDto, UserDto, ApartmentDto, SignupUserRequestDto } from './dto/register.dto';

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
  // 유저 생성 후 아파트를 생성하고 유저와 연결
  return await prisma.user.create({
    data: {
      ...userData,
      apartment: {
        create: apartmentData,
      },
    },
    select: UserSelectFields,
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
