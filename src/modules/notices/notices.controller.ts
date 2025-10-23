import type { RequestHandler } from 'express';
import type { NoticeCreateDTO } from '#modules/auth/dto/notice.dto';
import noticesService from './notices.service';

/**
 * @function createNotice
 * @description 공지를 생성합니다.
 *
 * @param {Object} req - Express 요청 객체
 * @param {Object} res - Express 응답 객체
 *
 * @returns {201} 생성된 공지 반환
 *
 * @throws {400} 잘못된 요청 형식
 * @throws {403} 프로젝트 접근 권한 없음
 * @throws {404} 할일을 찾을 수 없는 경우
 */

export const createNotice: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const boardId = req.body.boardId;
    const dto: NoticeCreateDTO = {
      title: req.body.title as string,
      content: req.body.content as string,
      category: req.body.category as
        | 'MAINTENANCE'
        | 'EMERGENCY'
        | 'COMMUNITY'
        | 'RESIDENT_VOTE'
        | 'RESIDENT_COUNCIL'
        | 'COMPLAINT'
        | 'ETC',
    };
    await noticesService.createNotice(dto, userId, boardId);

    res.status(201).json({ message: '정상적으로 등록 처리되었습니다.' });
  } catch (err) {
    next(err);
  }
};
