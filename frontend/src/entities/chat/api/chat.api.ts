/**
 * 채팅 REST API 호출 함수
 * 백엔드 /api/chats 엔드포인트와 통신
 */

import axios from '@/shared/lib/axios';
import type {
  ChatRoom,
  ChatRoomListResponse,
  MessageListResponse,
  CreateChatRoomByAdminRequest,
  GetChatRoomListRequest,
  GetMessageListRequest,
} from './chat.types';

// ==================== 채팅방 생성 ====================

/**
 * USER: 내 채팅방 생성
 * @description 입주민이 자신의 아파트 관리자와 1:1 채팅방 생성
 * POST /chats/my-room
 */
export const createMyChatRoom = async (): Promise<ChatRoom> => {
  const response = await axios.post<ChatRoom>('/chats/my-room');
  return response.data;
};

/**
 * ADMIN: 특정 입주민과 채팅방 생성
 * @description 관리자가 자신의 아파트 입주민과 1:1 채팅방 생성
 * POST /chats/rooms
 */
export const createChatRoomByAdmin = async (
  data: CreateChatRoomByAdminRequest,
): Promise<ChatRoom> => {
  const response = await axios.post<ChatRoom>('/chats/rooms', data);
  return response.data;
};

// ==================== 채팅방 조회 ====================

/**
 * USER: 내 채팅방 조회
 * @description 입주민이 자신의 채팅방 정보 조회
 * GET /chats/my-room
 */
export const getMyChatRoom = async (): Promise<ChatRoom> => {
  const response = await axios.get<ChatRoom>('/chats/my-room');
  return response.data;
};

/**
 * ADMIN: 채팅방 목록 조회 (페이지네이션)
 * @description 관리자가 관리하는 아파트의 모든 채팅방 목록 조회
 * GET /chats/rooms?page=1&limit=20&unreadOnly=false
 */
export const getChatRoomList = async (
  params?: GetChatRoomListRequest,
): Promise<ChatRoomListResponse> => {
  const response = await axios.get<ChatRoomListResponse>('/chats/rooms', { params });
  return response.data;
};

/**
 * 특정 채팅방 조회
 * @description USER/ADMIN이 특정 채팅방의 상세 정보 조회
 * GET /chats/rooms/:id
 */
export const getChatRoom = async (chatRoomId: string): Promise<ChatRoom> => {
  const response = await axios.get<ChatRoom>(`/chats/rooms/${chatRoomId}`);
  return response.data;
};

// ==================== 메시지 조회 ====================

/**
 * 메시지 목록 조회 (페이지네이션)
 * @description 특정 채팅방의 메시지 목록 조회 (최신순)
 * GET /chats/rooms/:id/messages?page=1&limit=50
 */
export const getMessageList = async (
  params: GetMessageListRequest,
): Promise<MessageListResponse> => {
  const { chatRoomId, ...queryParams } = params;
  const response = await axios.get<MessageListResponse>(`/chats/rooms/${chatRoomId}/messages`, {
    params: queryParams,
  });
  return response.data;
};
