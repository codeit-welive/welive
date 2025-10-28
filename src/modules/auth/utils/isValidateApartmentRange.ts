import { getApartmentRangeByName } from '../auth.repo';

export const isValidateApartmentRange = async (apartmentName: string, userDong: string, userHo: string) => {
  const apartmentRange = await getApartmentRangeByName(apartmentName);
  if (!apartmentRange) {
    return { valid: false, message: '해당 아파트가 존재하지 않습니다.' };
  }

  const userComplexNumber = parseInt(userDong.slice(0, -2), 10);
  const userDongNumber = parseInt(userDong.slice(-2), 10);
  const userFloorNumber = parseInt(userHo.slice(0, -2), 10);
  const userHoNumber = parseInt(userHo.slice(-2), 10);

  if (userComplexNumber < parseInt(apartmentRange.endComplexNumber)) {
    if (userDongNumber < parseInt(apartmentRange.endDongNumber)) {
      if (userFloorNumber < parseInt(apartmentRange.endFloorNumber)) {
        if (userHoNumber <= parseInt(apartmentRange.endHoNumber)) {
          return { valid: true };
        }
      }
    }
  }

  return { valid: false, message: '아파트 동/호수가 아파트 관리 범위를 벗어났습니다.' };
};
