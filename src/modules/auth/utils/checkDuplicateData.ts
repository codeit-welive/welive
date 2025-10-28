// 중복된 유저정보가 있는지 확인
export const checkDuplicateData = (targets: string[]) => {
  if (targets.includes('username')) {
    return { message: '이미 사용 중인 아이디입니다.' };
  }
  if (targets.includes('email')) {
    return { message: '이미 사용 중인 이메일입니다.' };
  }
  if (targets.includes('contact')) {
    return { message: '이미 사용 중인 연락처입니다.' };
  }
  if (targets.includes('apartmentManagementNumber')) {
    return { message: '이미 사용 중인 관리번호입니다.' };
  }
  if (targets.includes('apartmentName')) {
    return { message: '이미 사용 중인 아파트 이름입니다.' };
  }
  return { message: targets[0] };
};
