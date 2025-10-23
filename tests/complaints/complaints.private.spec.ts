import prisma from '#core/prisma';
import { api, signupAndLogin, bearer } from '../helpers/http';
import { COMPLAINT_VALIDATION } from '#constants/complaint';

describe('[Complaints] 인증 필요', () => {
  let token: string;
  let complaintBoardId: string;

  beforeAll(async () => {
    const board = await prisma.board.findFirst({
      where: { type: 'COMPLAINT' },
      select: { id: true },
    });
    if (!board) throw new Error('❌ COMPLAINT 게시판을 찾을 수 없습니다.');
    complaintBoardId = board.id;
  });

  beforeEach(async () => {
    const { accessToken } = await signupAndLogin();
    token = accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('민원 등록 201 (정상)', async () => {
    const res = await api()
      .post('/complaints')
      .set(bearer(token))
      .send({
        title: 'x'.repeat(COMPLAINT_VALIDATION.TITLE_MIN_LENGTH),
        content: '내용'.repeat(COMPLAINT_VALIDATION.CONTENT_MIN_LENGTH / 2),
        boardId: complaintBoardId,
        isPublic: true,
      })
      .expect(201);

    expect(res.body.message).toBe('정상적으로 등록 처리되었습니다.');
  });

  test('민원 등록 400 (제목 길이 미달)', async () => {
    const res = await api()
      .post('/complaints')
      .set(bearer(token))
      .send({
        title: '짧음',
        content: '충분히 긴 내용입니다.',
        boardId: complaintBoardId,
        isPublic: false,
      })
      .expect(400);

    expect(res.body.message).toMatch(/제목은 최소/);
  });
});
