import { UserRole } from '@prisma/client';
import { ApartmentResponseDto } from '../dto/apartment.dto';

export const mapApartmentListData = (data: ApartmentResponseDto[], userRole: UserRole | undefined) => {
  return data.map((item) => ({
    id: item.id,
    name: item.apartmentName,
    address: item.apartmentAddress,
    ...(userRole && {
      officeNumber: item.apartmentManagementNumber,
      startComplexNumber: item.startComplexNumber,
      endComplexNumber: item.endComplexNumber,
      startDongNumber: item.startDongNumber,
      endDongNumber: item.endDongNumber,
      startFloorNumber: item.startFloorNumber,
      endFloorNumber: item.endFloorNumber,
      startHoNumber: item.startHoNumber,
      endHoNumber: item.endHoNumber,
      apartmentStatus: item.admin?.joinStatus,
      adminId: item.admin?.id,
      adminName: item.admin?.name,
      adminContact: item.admin?.contact,
      adminEmail: item.admin?.email,
    }),
  }));
};

export const mapApartmentDetailData = (data: ApartmentResponseDto, userRole: UserRole | undefined) => {
  const startDongNumber = String(data.startDongNumber).padStart(2, '0');
  const endDongNumber = String(data.endDongNumber).padStart(2, '0');
  const startHoNumber = String(data.startHoNumber).padStart(2, '0');
  const endHoNumber = String(data.endHoNumber).padStart(2, '0');

  return {
    id: data.id,
    name: data.apartmentName,
    address: data.apartmentAddress,
    startComplexNumber: data.startComplexNumber,
    endComplexNumber: data.endComplexNumber,
    startDongNumber,
    endDongNumber,
    startFloorNumber: data.startFloorNumber,
    endFloorNumber: data.endFloorNumber,
    startHoNumber,
    endHoNumber,
    ...(userRole &&
      userRole !== UserRole.USER && {
        officeNumber: data.apartmentManagementNumber,
        apartmentStatus: data.admin?.joinStatus,
        adminId: data.admin?.id,
        adminName: data.admin?.name,
        adminContact: data.admin?.contact,
        adminEmail: data.admin?.email,
      }),
    dongRange: {
      start: data.startComplexNumber + startDongNumber,
      end: data.endComplexNumber + endDongNumber,
    },
    hoRange: {
      start: data.startFloorNumber + startHoNumber,
      end: data.endFloorNumber + endHoNumber,
    },
  };
};
