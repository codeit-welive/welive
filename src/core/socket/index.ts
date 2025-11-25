import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import env from '#core/env';
import { logger } from '#core/logger';
import { socketAuthMiddleware, AuthenticatedSocket } from './middleware';
import { verifyChatRoomAccess } from '#modules/chats/chats.util';
import { createMessage } from '#modules/chats/chats.service';
import { patchMessageListAsRead } from '#modules/chats/chats.repo';
import ApiError from '#errors/ApiError';
import { CHAT_ERROR_MESSAGES } from '#constants/chat.constant';
import { SOCKET_EVENTS_RECEIVE, SOCKET_EVENTS_SEND, SOCKET_EVENTS_DEFAULT } from '#constants/socket.constant';

/**
 * Socket.io 서버 초기화 함수
 * @param httpServer - Express HTTP 서버 인스턴스
 * @returns Socket.io 서버 인스턴스
 * @description
 * HTTP 서버에 Socket.io를 연결하여 WebSocket 통신 활성화
 */
export const initializeSocketServer = (httpServer: HttpServer) => {
  /**
   * Socket.io 서버 생성
   * - httpServer: Express HTTP 서버와 Socket.io 연결
   * - cors: CORS(Cross-Origin Resource Sharing) 설정
   */
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  /**
   * Socket.io 인증 미들웨어 등록
   * @description
   * - JWT 토큰을 검증하고 socket.user에 사용자 정보 저장
   * - 인증 실패 시 연결을 거부함
   */
  io.use(socketAuthMiddleware);

  /**
   * 클라이언트 연결 이벤트 리스너
   * @event connection
   * @description 새로운 클라이언트가 Socket.io 서버에 접속할 때 실행
   * @param socket - 연결된 클라이언트의 Socket 인스턴스
   */
  io.on(SOCKET_EVENTS_DEFAULT.CONNECTION, (socket) => {
    logger.system.info(`✅ 새로운 클라이언트 연결: ${socket.id}`);

    /**
     * 클라이언트 연결 해제 이벤트 리스너
     * @event disconnect
     * @description
     */
    socket.on(SOCKET_EVENTS_DEFAULT.DISCONNECT, () => {
      logger.system.info(`❌ 클라이언트 연결 해제: ${socket.id}`);
    });

    /**
     * 채팅방 입장 이벤트
     * @event join_room
     * @description 클라이언트가 특정 채팅방에 입장할 때 실행
     */
    socket.on(SOCKET_EVENTS_RECEIVE.JOIN_ROOM, async (data: { chatRoomId: string }) => {
      try {
        const { chatRoomId } = data;
        const { user } = socket as AuthenticatedSocket;

        // 1. 권한 확인
        await verifyChatRoomAccess(chatRoomId, user.id, user.role as any);

        // 2. Socket.io Room 입장
        await socket.join(chatRoomId);

        // 3. 로깅
        logger.system.info(`✅ 채팅방 입장: User ${user.id} (${user.role}) → Room ${chatRoomId}`);

        // 4. 클라이언트에게 입장 성공 알림
        socket.emit(SOCKET_EVENTS_SEND.JOIN_ROOM_SUCCESS, {
          chatRoomId,
          message: '채팅방에 입장했습니다.',
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        logger.system.warn(`❌ 채팅방 입장 에러: ${errorMessage}`);
        socket.emit(SOCKET_EVENTS_SEND.ERROR_EVENT, { message: errorMessage });
      }
    });

    /**
     * 채팅방 퇴장 이벤트
     * @event leave_room
     * @description 클라이언트가 채팅방에서 퇴장할 때 실행
     */
    socket.on(SOCKET_EVENTS_RECEIVE.LEAVE_ROOM, async (data: { chatRoomId: string }) => {
      try {
        const { chatRoomId } = data;
        const { user } = socket as AuthenticatedSocket;

        // 1. Socket.io Room 퇴장
        await socket.leave(chatRoomId);

        // 2. 로깅
        logger.system.info(`👋 채팅방 퇴장: User ${user.id} (${user.role}) → Room ${chatRoomId}`);

        // 3. 클라이언트에게 퇴장 성공 알림
        socket.emit(SOCKET_EVENTS_SEND.LEAVE_ROOM_SUCCESS, {
          chatRoomId,
          message: '채팅방에서 퇴장했습니다.',
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        logger.system.warn(`❌ 채팅방 퇴장 에러: ${errorMessage}`);
        socket.emit(SOCKET_EVENTS_SEND.ERROR_EVENT, { message: errorMessage });
      }
    });

    /**
     * 메시지 전송 이벤트
     * @event send_message
     * @description 클라이언트가 메시지를 전송할 때 실행
     */
    socket.on(SOCKET_EVENTS_RECEIVE.SEND_MESSAGE, async (data: { chatRoomId: string; content: string }) => {
      try {
        // 1. 데이터 추출
        const { chatRoomId, content } = data;
        const { user } = socket as AuthenticatedSocket;

        // 2. Room 입장 확인 (메모리)
        if (!socket.rooms.has(chatRoomId)) {
          throw ApiError.forbidden(CHAT_ERROR_MESSAGES.MUST_JOIN_ROOM_FIRST);
        }

        // 3. 메시지 저장
        const savedMessage = await createMessage({
          chatRoomId,
          senderId: user.id,
          content,
          role: user.role as any,
        });

        // 4. 브로드캐스팅 (본인 포함 - 메시지는 모든 참여자가 받아야 함)
        io.to(chatRoomId).emit(SOCKET_EVENTS_SEND.NEW_MESSAGE, savedMessage);

        // 5. ✅ Room에 입장하지 않은 Admin에게도 메시지 전달
        // Resident가 메시지를 보냈을 때, 채팅방에 입장하지 않은 같은 아파트의 Admin에게도 알림
        if (user.role === 'USER') {
          const senderApartmentId = (socket as AuthenticatedSocket).apartmentId;

          // apartmentId 검증 (JWT에 apartmentId가 없는 경우 방어)
          if (!senderApartmentId) {
            logger.system.warn(`⚠️ apartmentId가 없는 Resident의 메시지 전송: User ${user.id}`);
          } else {
            io.sockets.sockets.forEach((clientSocket) => {
              const authSocket = clientSocket as AuthenticatedSocket;
              // Admin이면서 + 같은 아파트이면서 + Room에 입장하지 않은 경우에만 메시지 전달
              if (
                authSocket.user &&
                authSocket.user.role === 'ADMIN' &&
                authSocket.apartmentId === senderApartmentId && // JWT에서 가져온 apartmentId 비교
                !clientSocket.rooms.has(chatRoomId)
              ) {
                clientSocket.emit(SOCKET_EVENTS_SEND.NEW_MESSAGE, savedMessage);
              }
            });
          }
        }

        // 6. 로깅
        logger.system.info(`💬 메시지 전송: User ${user.id} (${user.role}) → Room ${chatRoomId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        logger.system.warn(`❌ 메시지 전송 에러: ${errorMessage}`);
        socket.emit(SOCKET_EVENTS_SEND.ERROR_EVENT, { message: errorMessage });
      }
    });

    /**
     * 읽음 상태 업데이트 이벤트
     * @event mark_as_read
     * @description 클라이언트가 메시지를 읽었을 때 실행
     */
    socket.on(SOCKET_EVENTS_RECEIVE.MARK_AS_READ, async (data: { chatRoomId: string }) => {
      try {
        // 1. 데이터 추출
        const { chatRoomId } = data;
        const { user } = socket as AuthenticatedSocket;

        // 2. Room 입장 확인 (메모리)
        if (!socket.rooms.has(chatRoomId)) {
          throw ApiError.forbidden(CHAT_ERROR_MESSAGES.MUST_JOIN_ROOM_FIRST);
        }

        // 3. DB 읽음 처리
        const updatedCount = await patchMessageListAsRead(chatRoomId, user.role as any);

        // 4. 브로드캐스팅 (본인 제외 - 상대방에게만 알림)
        socket.to(chatRoomId).emit(SOCKET_EVENTS_SEND.MESSAGES_READ, {
          chatRoomId,
          role: user.role,
          updatedCount,
        });

        // 5. 로깅
        logger.system.info(`👁️ 읽음 처리: User ${user.id} (${user.role}) → Room ${chatRoomId} (${updatedCount}개)`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        logger.system.warn(`❌ 읽음 처리 에러: ${errorMessage}`);
        socket.emit(SOCKET_EVENTS_SEND.ERROR_EVENT, { message: errorMessage });
      }
    });

    /**
     * 타이핑 중 이벤트
     * @event typing
     * @description 클라이언트가 메시지를 입력 중일 때 실행
     */
    socket.on(SOCKET_EVENTS_RECEIVE.TYPING, async (data: { chatRoomId: string; isTyping: boolean }) => {
      try {
        // 1. 데이터 추출
        const { chatRoomId, isTyping } = data;
        const { user } = socket as AuthenticatedSocket;

        // 2. Room 입장 확인 (메모리)
        if (!socket.rooms.has(chatRoomId)) {
          throw ApiError.forbidden(CHAT_ERROR_MESSAGES.MUST_JOIN_ROOM_FIRST);
        }

        // 3. 같은 Room의 다른 사용자들에게만 브로드캐스트 (본인 제외)
        socket.to(chatRoomId).emit(SOCKET_EVENTS_SEND.USER_TYPING, {
          chatRoomId,
          userId: user.id,
          userName: user.name,
          isTyping,
        });

        // 4. 로깅
        logger.system.info(
          `⌨️ 타이핑: User ${user.id} (${user.name}) → Room ${chatRoomId} (${isTyping ? '입력 중' : '중지'})`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        logger.system.warn(`❌ 타이핑 이벤트 에러: ${errorMessage}`);
        socket.emit(SOCKET_EVENTS_SEND.ERROR_EVENT, { message: errorMessage });
      }
    });
  });

  return io;
};
