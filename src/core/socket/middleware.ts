import type { Socket } from 'socket.io';
import { verifyAccessToken } from '#modules/auth/utils/tokenUtils';
import { DecodedToken } from '#modules/auth/dto/token.dto';
import { logger } from '#core/logger';
import ApiError from '#errors/ApiError';

export interface AuthenticatedSocket extends Socket {
  user: DecodedToken;
  apartmentId?: string; // JWT 토큰 또는 JOIN_ROOM 시 저장된 apartmentId
}

export const socketAuthMiddleware = (socket: Socket, next: (err?: ApiError) => void) => {
  try {
    // 쿠키에서 access_token 추출 (HTTP API와 동일한 방식)
    let token: string | undefined;
    const cookies = socket.handshake.headers.cookie;

    if (cookies) {
      const cookieArray = cookies.split('; ');
      const tokenCookie = cookieArray.find((c) => c.startsWith('access_token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
      }
    }

    if (!token) {
      logger.system.warn(`❌ Socket 연결 실패: 토큰이 제공되지 않음 (Socket ID: ${socket.id})`);
      return next(new ApiError(401, '인증 토큰이 필요합니다.'));
    }

    const decoded = verifyAccessToken(token);
    (socket as AuthenticatedSocket).user = decoded;
    // apartmentId를 JWT에서 가져와 socket에 저장 (SUPER_ADMIN은 undefined)
    (socket as AuthenticatedSocket).apartmentId = decoded.apartmentId;
    logger.system.info(
      `✅ Socket 인증 성공: ${decoded.role} (User ID: ${decoded.id}, Apartment: ${decoded.apartmentId || 'N/A'}, Socket ID: ${socket.id})`
    );

    next();
  } catch (error) {
    logger.system.error(`❌ Socket 인증 실패:(Socket ID: ${socket.id})`);
    next(error as ApiError);
  }
};
