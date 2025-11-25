import ApiError from '#errors/ApiError';
import prisma from '#core/prisma';

export const checkDuplicateUser = async (username: string, email: string, contact: string) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: username }, { email: email }, { contact: contact }],
    },
    select: {
      username: true,
      email: true,
      contact: true,
    },
  });
  if (existingUser) {
    if (existingUser.username === username) {
      throw ApiError.badRequest('이미 사용 중인 아이디입니다.');
    } else if (existingUser.email === email) {
      throw ApiError.badRequest('이미 사용 중인 이메일입니다.');
    } else if (existingUser.contact === contact) {
      throw ApiError.badRequest('이미 사용 중인 연락처입니다.');
    }
  }
  // 중복된 정보가 없으면 종료
  return;
};

export const checkDuplicateApartment = async (apartmentName: string) => {
  const existingApartment = await prisma.apartment.findFirst({
    where: { apartmentName },
    select: { id: true },
  });
  if (existingApartment) {
    throw ApiError.badRequest('이미 존재하는 이름입니다.');
  }
  // 중복된 정보가 없으면 종료
  return;
};
