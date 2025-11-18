/**
 * 채팅 관련 타입 정의
 * 백엔드 API 응답 구조와 일치
 */

export type ChatUserRole = 'USER' | 'ADMIN';

// ==================== 채팅방 ====================

export interface ChatRoom {
  id: string;
  apartmentId: string;
  residentId: string;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCountAdmin: number;
  unreadCountResident: number;
  createdAt: Date;
  updatedAt: Date;
  resident: {
    name: string;
    building: string;
    unitNumber: string;
  };
  apartment?: {
    apartmentName: string;
    admin: {
      name: string;
    };
  };
}

// ==================== 메시지 ====================

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  isReadByAdmin: boolean;
  isReadByResident: boolean;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    role: ChatUserRole;
  };
}

// ==================== API Request ====================

export interface CreateChatRoomByAdminRequest {
  residentId: string;
}

export interface GetChatRoomListRequest {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface GetMessageListRequest {
  chatRoomId: string;
  page?: number;
  limit?: number;
}

export interface SendMessageRequest {
  chatRoomId: string;
  content: string;
}

// ==================== API Response ====================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    nextCursor?: string;
  };
}

export type ChatRoomListResponse = PaginatedResponse<ChatRoom>;
export type MessageListResponse = PaginatedResponse<ChatMessage>;

// ==================== Socket Events ====================

export interface SocketJoinRoomData {
  chatRoomId: string;
}

export interface SocketLeaveRoomData {
  chatRoomId: string;
}

export interface SocketSendMessageData {
  chatRoomId: string;
  content: string;
}

export interface SocketMarkAsReadData {
  chatRoomId: string;
}

export interface SocketJoinRoomSuccessData {
  chatRoomId: string;
  message: string;
}

export interface SocketLeaveRoomSuccessData {
  chatRoomId: string;
  message: string;
}

export type SocketNewMessageData = ChatMessage;

export interface SocketMessagesReadData {
  chatRoomId: string;
  role: ChatUserRole;
  updatedCount: number;
}

export interface SocketErrorData {
  message: string;
}
