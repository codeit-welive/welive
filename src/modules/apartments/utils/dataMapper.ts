import { AdminApartmentResponseDto, UserApartmentResponseDto } from '../dto/apartment.dto';

export const mapApartmentData = (data: UserApartmentResponseDto | AdminApartmentResponseDto) => {
  return {
    id: data.id,
    name: data.apartmentName,
    address: data.apartmentAddress,
    ...('apartmentManagementNumber' in data && {
      officeNumber: data.apartmentManagementNumber,
      startComplexNumber: data.startComplexNumber,
      endComplexNumber: data.endComplexNumber,
      startDongNumber: data.startDongNumber,
      endDongNumber: data.endDongNumber,
      startFloorNumber: data.startFloorNumber,
      endFloorNumber: data.endFloorNumber,
      startHoNumber: data.startHoNumber,
      endHoNumber: data.endHoNumber,
      apartmentStatus: data.admin.joinStatus,
      adminID: data.admin.id,
      adminName: data.admin.name,
      adminContact: data.admin.contact,
      adminEmail: data.admin.email,
    }),
  };
};
