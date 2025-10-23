import prisma from '#core/prisma';
import { api, signupAndLogin, bearer } from '../helpers/http';
import { PAGINATION } from '#constants/pagination';

describe('[Complaints] 공개', () => {
  let token: string;

  beforeEach(async () => {
    const { accessToken } = await signupAndLogin();
    token = accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('민원 목록 조회 200 (기본 페이지네이션)', async () => {
    const res = await api()
      .get(`/complaints?page=${PAGINATION.DEFAULT_PAGE}&limit=${PAGINATION.DEFAULT_LIMIT}`)
      .set(bearer(token))
      .expect(200);

    expect(res.body).toHaveProperty('complaints');
    expect(Array.isArray(res.body.complaints)).toBe(true);
    expect(res.body).toHaveProperty('totalCount');
  });
});
