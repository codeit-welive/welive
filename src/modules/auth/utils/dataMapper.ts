import { SignupAdminRequestDto, SignupUserRequestDto } from '../dto/register.dto';
import { hashPassword } from '#core/utils/passwordUtils';

export const adminDataMapper = async (data: SignupAdminRequestDto) => {
  return {
    userData: {
      username: data.username,
      password: await hashPassword(data.password),
      contact: data.contact,
      name: data.name,
      email: data.email,
      role: data.role,
      avatar: data.avatar,
    },
    apartmentData: {
      apartmentName: data.apartmentName,
      description: data.description,
      startComplexNumber: data.startComplexNumber,
      endComplexNumber: data.endComplexNumber,
      startDongNumber: data.startDongNumber,
      endDongNumber: data.endDongNumber,
      startFloorNumber: data.startFloorNumber,
      endFloorNumber: data.endFloorNumber,
      startHoNumber: data.startHoNumber,
      endHoNumber: data.endHoNumber,
      apartmentAddress: data.apartmentAddress,
      apartmentManagementNumber: data.apartmentManagementNumber,
    },
  };
};

export const userDataMapper = async (data: SignupUserRequestDto) => {
  return {
    userData: {
      username: data.username,
      password: await hashPassword(data.password),
      contact: data.contact,
      name: data.name,
      email: data.email,
      role: data.role,
      avatar: data.avatar,
      building: data.apartmentDong,
      unitNumber: data.apartmentHo,
    },
  };
};
