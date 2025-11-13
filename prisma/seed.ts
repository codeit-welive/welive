/**
 * 실행 순서
 * 1. SUPER_ADMIN
 * 2. ADMIN + APARTMENT
 * 3. RESIDENTS
 * 4. BOARDS
 * 5. NOTICE / COMPLAINT / POLL(2)
 * 6. COMMENT / NOTIFICATION / EVENT
 * 7. 실행
 */

import { v4 as uuid } from 'uuid';
import prisma from '../src/core/prisma';

// ------------------------------
// UTILS
// ------------------------------

/**
 * PEPPER + 12345678a!
 */
const HASHED_PASSWORD = '$2a$10$BTWt7pgku69fojJ0gQA/9uZ3ZXLIdLfZT0BLKbGwqW8vc.q/PGjO6';

/**
 * 자정으로 시간 고정하는 유틸
 */
const d = (yyyy: number, mm: number, dd: number) => new Date(yyyy, mm - 1, dd);
const ONE_DAY = 24 * 60 * 60 * 1000;

const NOW = new Date();
const START_DATE_PAST = d(2025, 6, 10);
const END_DATE_PAST = new Date(d(2025, 6, 12).getTime() + ONE_DAY - 1);
const START_DATE_FUTURE = new Date(NOW.getTime() - ONE_DAY); // 어제 시작
const END_DATE_FUTURE = new Date(NOW.getTime() + ONE_DAY * 7); // 일주일 뒤 종료

const DEFAULT_AVATAR = 'https://example.com/default-avatar.png';
const DEFAULT_ADDRESS = '서울특별시 강남구 위리브로 12';

// ------------------------------
// 1. SUPER_ADMIN
// ------------------------------
const SUPER_ADMIN_ID = uuid();
const createSuperAdmin = async () =>
  prisma.user.create({
    data: {
      id: SUPER_ADMIN_ID,
      username: 'superadmin',
      password: HASHED_PASSWORD,
      contact: '01000000000',
      name: '슈퍼관리자',
      email: 'super@welive.com',
      role: 'SUPER_ADMIN',
      joinStatus: 'APPROVED',
      avatar: DEFAULT_AVATAR,
    },
  });

// ------------------------------
// 2. ADMIN + APARTMENT
// ------------------------------
const ADMIN_ID = uuid();
const APT_ID = uuid();

const createAdminAndApartment = async () => {
  const admin = await prisma.user.create({
    data: {
      id: ADMIN_ID,
      username: 'admin1',
      password: HASHED_PASSWORD,
      contact: '01011111111',
      name: '김관리',
      email: 'admin1@welive.com',
      role: 'ADMIN',
      joinStatus: 'APPROVED',
      avatar: DEFAULT_AVATAR,
    },
  });

  const apartment = await prisma.apartment.create({
    data: {
      id: APT_ID,
      apartmentName: '위리브아파트',
      apartmentAddress: DEFAULT_ADDRESS,
      apartmentManagementNumber: '0211111111',
      startComplexNumber: '1',
      endComplexNumber: '1',
      startDongNumber: '1',
      endDongNumber: '5',
      startFloorNumber: '1',
      endFloorNumber: '20',
      startHoNumber: '1',
      endHoNumber: '20',
      adminId: ADMIN_ID,
      description: '테스트용 아파트 단지',
    },
  });

  return { admin, apartment };
};

// ------------------------------
// 3. RESIDENTS
// ------------------------------
const RESIDENT_IDS = [uuid(), uuid()];

const createResidents = async () => {
  // 1) 유저 생성
  await prisma.user.createMany({
    data: [
      {
        id: RESIDENT_IDS[0],
        username: 'residentA',
        password: HASHED_PASSWORD,
        contact: '01022222222',
        name: '주민일',
        email: 'residentA@welive.com',
        role: 'USER',
        joinStatus: 'APPROVED',
        avatar: DEFAULT_AVATAR,
      },
      {
        id: RESIDENT_IDS[1],
        username: 'residentB',
        password: HASHED_PASSWORD,
        contact: '01033333333',
        name: '주민이',
        email: 'residentB@welive.com',
        role: 'USER',
        joinStatus: 'APPROVED',
        avatar: DEFAULT_AVATAR,
      },
    ],
  });

  // 2) Resident 생성
  const residents = await prisma.$transaction([
    prisma.resident.create({
      data: {
        name: '주민일',
        contact: '01022222222',
        building: '101',
        unitNumber: '1101',
        isRegistered: true,
        approvalStatus: 'APPROVED',
        residentStatus: 'RESIDENCE',
        isHouseholder: 'HOUSEHOLDER',
        apartmentId: APT_ID,
      },
    }),
    prisma.resident.create({
      data: {
        name: '주민이',
        contact: '01033333333',
        building: '102',
        unitNumber: '1202',
        isRegistered: true,
        approvalStatus: 'APPROVED',
        residentStatus: 'RESIDENCE',
        isHouseholder: 'MEMBER',
        apartmentId: APT_ID,
      },
    }),
  ]);

  // 3) User와 Resident 연결
  await prisma.user.update({
    where: { id: RESIDENT_IDS[0] },
    data: { residentId: residents[0].id },
  });
  await prisma.user.update({
    where: { id: RESIDENT_IDS[1] },
    data: { residentId: residents[1].id },
  });
};

// ------------------------------
// 4. BOARDS
// ------------------------------
const createBoards = async () =>
  prisma.board.createMany({
    data: [
      { type: 'NOTICE', apartmentId: APT_ID },
      { type: 'POLL', apartmentId: APT_ID },
      { type: 'COMPLAINT', apartmentId: APT_ID },
    ],
  });

// ------------------------------
// 5. NOTICE / COMPLAINT / POLL(2)
// ------------------------------
const createPosts = async () => {
  const [noticeBoard, complaintBoard, pollBoard] = await Promise.all([
    prisma.board.findFirst({ where: { apartmentId: APT_ID, type: 'NOTICE' } }),
    prisma.board.findFirst({ where: { apartmentId: APT_ID, type: 'COMPLAINT' } }),
    prisma.board.findFirst({ where: { apartmentId: APT_ID, type: 'POLL' } }),
  ]);

  const notice = await prisma.notice.create({
    data: {
      title: '정기 점검 안내',
      content: '6월 15일 오전 9시~12시 단수 예정입니다.',
      category: 'MAINTENANCE',
      userId: ADMIN_ID,
      boardId: noticeBoard!.id,
      apartmentId: APT_ID,
      startDate: START_DATE_PAST,
      endDate: END_DATE_PAST,
    },
  });

  const complaint = await prisma.complaint.create({
    data: {
      title: '엘리베이터 소음이 심합니다.',
      content: '102동 12층 엘리베이터에서 지속적인 소음 발생.',
      userId: RESIDENT_IDS[0],
      boardId: complaintBoard!.id,
      apartmentId: APT_ID,
      status: 'IN_PROGRESS',
    },
  });

  // 지난 투표 (종료됨)
  const pollPast = await prisma.poll.create({
    data: {
      title: '공용 전기차 충전소 설치 찬반 투표',
      content: '주민 여러분의 의견을 수렴합니다.',
      startDate: START_DATE_PAST,
      endDate: END_DATE_PAST,
      userId: ADMIN_ID,
      boardId: pollBoard!.id,
      apartmentId: APT_ID,
    },
  });

  // 현재 진행 중 투표 (아직 유효)
  const pollActive = await prisma.poll.create({
    data: {
      title: '지하주차장 CCTV 추가 설치 여부',
      content: '주민 안전 강화를 위한 CCTV 추가 설치 투표입니다.',
      startDate: START_DATE_FUTURE,
      endDate: END_DATE_FUTURE,
      userId: ADMIN_ID,
      boardId: pollBoard!.id,
      apartmentId: APT_ID,
    },
  });

  await prisma.pollOption.createMany({
    data: [
      { title: '찬성', pollId: pollPast.id },
      { title: '반대', pollId: pollPast.id },
      { title: '찬성', pollId: pollActive.id },
      { title: '반대', pollId: pollActive.id },
    ],
  });

  const firstOption = await prisma.pollOption.findFirst({ where: { pollId: pollPast.id, title: '찬성' } });
  if (firstOption) {
    await prisma.pollVote.create({
      data: {
        userId: RESIDENT_IDS[0],
        pollId: pollPast.id,
        optionId: firstOption.id,
      },
    });
  }

  return { notice, complaint, pollPast, pollActive };
};

// ------------------------------
// 6. COMMENT / NOTIFICATION / EVENT
// ------------------------------
const createCommentsAndNotifications = async ({ notice, complaint }: any) => {
  const [noticeBoard, complaintBoard] = await Promise.all([
    prisma.board.findFirst({ where: { type: 'NOTICE', apartmentId: APT_ID } }),
    prisma.board.findFirst({ where: { type: 'COMPLAINT', apartmentId: APT_ID } }),
  ]);

  await prisma.comment.createMany({
    data: [
      {
        content: '확인했습니다.',
        userId: RESIDENT_IDS[1],
        boardType: 'NOTICE',
        boardId: noticeBoard!.id,
        noticeId: notice.id,
      },
      {
        content: '빠른 조치 부탁드립니다.',
        userId: RESIDENT_IDS[0],
        boardType: 'COMPLAINT',
        boardId: complaintBoard!.id,
        complaintId: complaint.id,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        content: '민원 상태가 처리 중으로 변경되었습니다.',
        notificationType: 'COMPLAINT_IN_PROGRESS',
        recipientId: RESIDENT_IDS[0],
        complaintId: complaint.id,
      },
      {
        content: '새 공지사항이 등록되었습니다.',
        notificationType: 'NOTICE_REG',
        recipientId: RESIDENT_IDS[1],
        noticeId: notice.id,
      },
    ],
  });

  await prisma.event.create({
    data: {
      title: '6월 정기 점검 일정',
      category: 'MAINTENANCE',
      boardType: 'NOTICE',
      startDate: START_DATE_PAST,
      endDate: END_DATE_PAST,
      apartmentId: APT_ID,
      noticeId: notice.id,
    },
  });
};

// ------------------------------
// 7. 실행
// ------------------------------
const main = async () => {
  console.log('🌱 Seeding Welive database...');
  await createSuperAdmin();
  await createAdminAndApartment();
  await createResidents();
  await createBoards();
  const posts = await createPosts();
  await createCommentsAndNotifications(posts);
  console.log('✅ Seed completed.');
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
