import { UserRole } from '@prisma/client';

export const searchResultToResponse = (searchResult: any) => {
  const contact = searchResult.contact.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
  // SUPER_ADMIN인 경우에는 아파트 정보가 없으므로 별도 처리
  if (searchResult.role === UserRole.SUPER_ADMIN) {
    return {
      id: searchResult.id,
      name: searchResult.name,
      email: searchResult.email,
      role: searchResult.role,
      joinStatus: searchResult.joinStatus,
      isActive: searchResult.isActive,
      apartmentId: {},
      apartmentName: {},
      residentDong: {},
      boardIds: {},
      username: searchResult.username,
      contact,
      avatar: searchResult.avatar,
    };
  }

  // 관리자 apartment에서 아파트 정보를 가져오고 유저는 resident에서 아파트 정보 가져옴
  const apartment = searchResult.apartment || searchResult.resident?.apartment;
  // boardIds를 형태에 맞게 매핑
  const boardList = apartment?.boards?.map((board: any) => ({ [board.type]: board.id }));
  const boardIds = Object.assign({}, ...(boardList || []));

  // UserRole.USER인 경우에만 동 정보 포함
  const residentDong = searchResult.role === UserRole.USER ? searchResult.resident?.building + '동' : {};

  return {
    id: searchResult.id,
    name: searchResult.name,
    email: searchResult.email,
    role: searchResult.role,
    joinStatus: searchResult.joinStatus,
    isActive: searchResult.isActive,
    apartmentId: apartment?.id,
    apartmentName: apartment?.apartmentName,
    residentDong,
    boardIds,
    username: searchResult.username,
    contact,
    avatar: searchResult.avatar,
  };
};
