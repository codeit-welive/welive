import { RequestHandler } from 'express';
import {
  registSuperAdmin,
  registAdmin,
  registUser,
  login,
  patchAdminStatus,
  patchUserStatus,
  patchUserListStatus,
  cleanupRejectedUsers,
} from './auth.service';
import ApiError from '#errors/ApiError';
import { Prisma } from '@prisma/client';
import { mapUniqueConstraintError } from '#helpers/mapPrismaError';
import env from '#core/env';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './utils/tokenUtils';

/**
 * 슈퍼관리자 등록 핸들러
 * @data 검증된 요청 바디
 *  - username: 아이디
 *  - password: 비밀번호
 *  - name: 이름
 *  - contact: 연락처
 *  - email: 이메일 (emailWithMX로 도메인 유효성 검사 포함)
 *  - role: 사용자 역할
 *  - avatar: 프로필 사진(기본 사진으로 설정. 추후 사용자 정보 변경 시 변경 가능)
 * @returns 201 - 생성된 슈퍼관리자 정보
 * @throws
 *  - ApiError(400) 이미 존재하는 아이디, 이메일, 연락처인 경우
 */
export const registSuperAdminHandler: RequestHandler = async (_req, res, next) => {
  try {
    const data = res.locals.validatedBody;

    const result = await registSuperAdmin(data);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

/**
 * 관리자 등록 핸들러
 * @description
 *  - 아파트 정보도 함께 생성
 * @data 검증된 요청 바디
 *  - username: 아이디
 *  - password: 비밀번호
 *  - name: 이름
 *  - contact: 연락처
 *  - email: 이메일 (emailWithMX로 도메인 유효성 검사 포함)
 *  - role: 사용자 역할
 *  - avatar: 프로필 사진(기본 사진으로 설정. 추후 사용자 정보 변경 시 변경 가능)
 *  - 아파트 정보
 * @returns 201 - 생성된 관리자 정보
 * @throws
 *  - ApiError(400) 이미 존재하는 아이디, 이메일, 연락처, 아파트 이름인 경우
 */
export const registerAdminHandler: RequestHandler = async (_req, res, next) => {
  try {
    const data = res.locals.validatedBody;

    const result = await registAdmin(data);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
};

/**
 * 일반 유저 등록 핸들러
 * @description
 *  - 입주민 정보도 함께 생성
 *  - 이미 입주민 정보에 등록된 유저일 경우 바로 가입 승인
 * @data 검증된 요청 바디
 *  - username: 아이디
 *  - password: 비밀번호
 *  - name: 이름
 *  - contact: 연락처
 *  - email: 이메일 (emailWithMX로 도메인 유효성 검사 포함)
 *  - role: 사용자 역할
 *  - avatar: 프로필 사진(기본 사진으로 설정. 추후 사용자 정보 변경 시 변경 가능)
 *  - 소속될 아파트 정보 (아파트 이름, 동, 호수)
 * @returns 201 - 생성된 일반 유저 정보
 * @throws
 *  - ApiError(400) 이미 존재하는 아이디, 이메일, 연락처인 경우
 *  - ApiError(404) 아파트가 존재하지 않는 경우
 */
export const registerUserHandler: RequestHandler = async (_req, res, next) => {
  try {
    const data = res.locals.validatedBody;

    const result = await registUser(data);
    return res.status(201).json(result);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return next(new ApiError(404, '해당 아파트가 존재하지 않습니다.', 'NOT_FOUND'));
      }
    }
    return next(err);
  }
};

/**
 * 로그인 핸들러
 * @description
 *  - 로그인 성공 시 access token과 refresh token을 쿠키에 저장
 * @data 검증된 요청 바디
 *  - username: 아이디
 *  - password: 비밀번호
 * @returns 200 - 로그인한 유저 정보
 * @throws
 *  - ApiError(404) 사용자를 찾을 수 없는 경우
 *  - ApiError(401) 비밀번호가 일치하지 않는 경우
 */
export const loginHandler: RequestHandler = async (_req, res, next) => {
  try {
    const data = res.locals.validatedBody;
    const result = await login(data);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
      path: '/',
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      path: '/',
    });

    return res.status(200).json(result.user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return next(new ApiError(404, '사용자를 찾을 수 없습니다'));
      }
    }
    return next(err);
  }
};

/**
 * 로그아웃 핸들러
 * @description
 *  - access token과 refresh token 쿠키를 삭제
 * @returns 204
 * @throws
 *  - 500 기타 서버 에러
 */
export const logoutHandler: RequestHandler = async (_req, res, next) => {
  try {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

/**
 * 토큰 갱신 핸들러
 * @description
 *  - refresh token을 검증하고 새로운 access token과 refresh token을 발급하여 쿠키에 저장
 * @returns 200 - 토큰 갱신 성공 메시지
 * @throws
 *  - ApiError(401) 토큰이 없거나 유효하지 않은 경우
 *  - 500 기타 서버 에러
 */
export const refreshTokenHandler: RequestHandler = async (req, res, next) => {
  try {
    const cookies = req.cookies as Record<string, string>;
    const refreshToken = cookies['refresh_token'];

    const decoded = verifyRefreshToken(refreshToken);

    const newAccessToken = generateAccessToken({
      id: decoded.id,
      role: decoded.role,
      joinStatus: decoded.joinStatus,
      isActive: decoded.isActive,
    });
    const newRefreshToken = generateRefreshToken({
      id: decoded.id,
      role: decoded.role,
      joinStatus: decoded.joinStatus,
      isActive: decoded.isActive,
    });

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
      path: '/',
    });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      path: '/',
    });

    return res.status(200).json({ message: '작업이 성공적으로 완료되었습니다 ' });
  } catch (err) {
    next(err);
  }
};

/**
 * 관리자 상태 변경 핸들러
 * @returns 200 - 작업 성공 메시지
 * @adminId 변경하려는 관리자 ID (없을 경우 요청중인 모든 관리자 대상)
 * @param data 검증된 요청 바디
 *  - status: 변경하려는 상태
 * @throws
 *  - ApiError(404) 해당 관리자를 찾을 수 없는 경우
 */
export const patchAdminStatusHandler: RequestHandler = async (req, res, next) => {
  try {
    const adminId = req.params.adminId;
    const data = res.locals.validatedBody;

    await patchAdminStatus(adminId, data.status);
    return res.status(200).json({ message: '작업이 성공적으로 완료되었습니다 ' });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return next(new ApiError(404, '해당 관리자를 찾을 수 없습니다', 'NOT_FOUND'));
      }
    }
    return next(err);
  }
};

/**
 * 일반 유저 상태 변경 핸들러
 * @description
 *  - residentId가 주어지면 특정 유저 대상
 *  - residentId가 주어지지 않으면 요청중인 아파트 소속 모든 유저 대상
 *  - status에 따라 resident 테이블의 approvalStatus도 함께 수정
 * @param residentId 변경하려는 유저 ID
 * @adminId 요청한 관리자 ID
 * @param data 검증된 요청 바디
 *  - status: 변경하려는 상태
 * @returns 200 - 작업 성공 메시지
 * @throws
 *  - ApiError(404) 해당 사용자를 찾을 수 없는 경우
 */
export const patchUserStatusHandler: RequestHandler = async (req, res, next) => {
  try {
    const residentId = req.params.residentId;
    const adminId = req.user.id;
    const data = res.locals.validatedBody;

    if (!residentId) {
      await patchUserListStatus(data.status, adminId);
    } else {
      await patchUserStatus(residentId, data.status, adminId);
    }
    return res.status(200).json({ message: '작업이 성공적으로 완료되었습니다 ' });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return next(new ApiError(404, '해당 사용자를 찾을 수 없습니다', 'NOT_FOUND'));
      }
    }
    return next(err);
  }
};

/**
 * 거절 계정 정리 핸들러
 * @description
 *  - 관리자는 자신이 관리하는 아파트의 거절된 계정 정리
 *  - 슈퍼 관리자는 모든 아파트의 거절된 계정 정리
 * @returns 200 - 작업 성공 메시지
 * @throws
 *  - 500 기타 서버 에러
 */
export const cleanupHandler: RequestHandler = async (req, res, next) => {
  try {
    const role = req.user.role;

    await cleanupRejectedUsers(role);
    return res.status(200).json({ message: '작업이 성공적으로 완료되었습니다' });
  } catch (err) {
    next(err);
  }
};
