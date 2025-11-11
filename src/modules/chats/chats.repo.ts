import prisma from '#core/prisma';
import { ChatRoomListQueryDto, ChatMessageListQueryDto } from './dto/querys.dto';

// ==================== 채팅방 조회 ====================

/**
 * 사용자 ID로 채팅방 조회
 * @description User → Resident → ChatRoom 관계를 통해 채팅방 조회
 * @param userId - 사용자 ID
 * @returns 채팅방 정보 또는 null
 */
export const getByUserId = async (userId: string) => {
  return await prisma.chatRoom.findFirst({
    where: {
      resident: {
        user: {
          id: userId,
        },
      },
    },
    select: {
      id: true,
      apartmentId: true,
      residentId: true,
      lastMessage: true,
      lastMessageAt: true,
      unreadCountAdmin: true,
      unreadCountResident: true,
      createdAt: true,
      updatedAt: true,
      resident: {
        select: {
          name: true,
          building: true,
          unitNumber: true,
        },
      },
      apartment: {
        select: {
          apartmentName: true,
          admin: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
};

/**
 * 채팅방 ID + 사용자 권한으로 조회 (USER용)
 * @description 입주민이 자신의 채팅방만 조회할 수 있도록 권한 체크 포함
 * @param chatRoomId - 채팅방 ID
 * @param userId - 사용자 ID
 * @returns 권한이 있으면 채팅방 정보, 없거나 존재하지 않으면 null
 */
export const getByIdWithUserAuth = async (chatRoomId: string, userId: string) => {
  const chatRoom = await prisma.chatRoom.findFirst({
    where: {
      id: chatRoomId,
      resident: {
        user: {
          id: userId,
        },
      },
    },
    select: {
      id: true,
      apartmentId: true,
      residentId: true,
      lastMessage: true,
      lastMessageAt: true,
      unreadCountAdmin: true,
      unreadCountResident: true,
      createdAt: true,
      updatedAt: true,
      resident: {
        select: {
          name: true,
          building: true,
          unitNumber: true,
        },
      },
      apartment: {
        select: {
          apartmentName: true,
          admin: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
  return chatRoom;
};

/**
 * 채팅방 ID + 관리자 권한으로 조회 (ADMIN용)
 * @description 관리자가 자신이 관리하는 아파트의 채팅방만 조회
 * @param chatRoomId - 채팅방 ID
 * @param adminId - 관리자 ID
 * @returns 권한이 있으면 채팅방 정보, 없거나 존재하지 않으면 null
 */
export const getByIdWithAdminAuth = async (chatRoomId: string, adminId: string) => {
  const chatRoom = await prisma.chatRoom.findFirst({
    where: {
      id: chatRoomId,
      apartment: {
        adminId,
      },
    },
    select: {
      id: true,
      apartmentId: true,
      residentId: true,
      lastMessage: true,
      lastMessageAt: true,
      unreadCountAdmin: true,
      unreadCountResident: true,
      createdAt: true,
      updatedAt: true,
      resident: {
        select: {
          name: true,
          building: true,
          unitNumber: true,
        },
      },
      apartment: {
        select: {
          apartmentName: true,
          admin: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
  return chatRoom;
};

/**
 * 관리자 ID로 채팅방 목록 조회
 * @description 관리자가 관리하는 아파트의 모든 채팅방 목록 (페이지네이션 + 필터링)
 * @param adminId - 관리자 ID
 * @param query - 목록 조회 쿼리 (page, limit, unreadOnly)
 * @returns 채팅방 목록
 */
export const getListByAdminId = async (adminId: string, query: ChatRoomListQueryDto) => {
  return await prisma.chatRoom.findMany({
    where: {
      apartment: {
        adminId,
      },
      ...(query.unreadOnly && { unreadCountAdmin: { gt: 0 } }),
    },
    select: {
      id: true,
      apartmentId: true,
      residentId: true,
      lastMessage: true,
      lastMessageAt: true,
      unreadCountAdmin: true,
      unreadCountResident: true,
      createdAt: true,
      updatedAt: true,
      resident: {
        select: {
          name: true,
          building: true,
          unitNumber: true,
        },
      },
    },
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    orderBy: { lastMessageAt: 'desc' },
  });
};

/**
 * 관리자의 채팅방 총 개수 조회 (필터링 적용)
 * @description 관리자가 관리하는 아파트의 채팅방 총 개수 (unreadOnly 필터 적용)
 * @param adminId - 관리자 ID
 * @param query - 목록 조회 쿼리 (unreadOnly)
 * @returns 필터링된 채팅방 총 개수
 */
export const getCountByAdminId = async (adminId: string, query: ChatRoomListQueryDto) => {
  return await prisma.chatRoom.count({
    where: {
      apartment: {
        adminId,
      },
      ...(query.unreadOnly && { unreadCountAdmin: { gt: 0 } }),
    },
  });
};

// ==================== 채팅방 생성 ====================

/**
 * 채팅방 생성
 * @description 새로운 1:1 채팅방 생성
 * @param apartmentId - 아파트 ID
 * @param residentId - 입주민 ID
 * @returns 생성된 채팅방 ID
 */
export const createChatRoom = async (apartmentId: string, residentId: string) => {
  return await prisma.chatRoom.create({
    data: {
      apartmentId,
      residentId,
    },
    select: {
      id: true,
    },
  });
};

// ==================== 메시지 조회 ====================

/**
 * 채팅방의 메시지 목록 조회
 * @description 채팅방의 메시지 목록을 페이지네이션하여 조회 (최신순)
 * @param chatRoomId - 채팅방 ID
 * @param query - 목록 조회 쿼리 (page, limit)
 * @returns 메시지 목록
 */
export const getMessagesByChatRoomId = async (chatRoomId: string, query: ChatMessageListQueryDto) => {
  return await prisma.chatMessage.findMany({
    where: { chatRoomId },
    select: {
      id: true,
      chatRoomId: true,
      senderId: true,
      content: true,
      isReadByAdmin: true,
      isReadByResident: true,
      createdAt: true,
      sender: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * 채팅방의 메시지 총 개수 조회
 * @description 페이지네이션을 위한 전체 메시지 개수
 * @param chatRoomId - 채팅방 ID
 * @returns 메시지 총 개수
 */
export const getMessageCountByChatRoomId = async (chatRoomId: string) => {
  return await prisma.chatMessage.count({
    where: { chatRoomId },
  });
};

// ==================== 메시지 생성 ====================

/**
 * 메시지 생성
 * @description 새로운 메시지를 생성하고 채팅방의 lastMessage/lastMessageAt/unreadCount 업데이트
 * @param data - 메시지 생성 데이터
 * @param data.chatRoomId - 채팅방 ID
 * @param data.senderId - 발신자 ID
 * @param data.content - 메시지 내용
 * @param data.isReadByAdmin - 관리자 읽음 여부
 * @param data.isReadByResident - 입주민 읽음 여부
 * @returns 생성된 메시지 정보
 */
export const createMessage = async (data: {
  chatRoomId: string;
  senderId: string;
  content: string;
  isReadByAdmin: boolean;
  isReadByResident: boolean;
}) => {
  return await prisma.$transaction(async (tx) => {
    const message = await tx.chatMessage.create({
      data,
      select: {
        id: true,
        chatRoomId: true,
        senderId: true,
        content: true,
        isReadByAdmin: true,
        isReadByResident: true,
        createdAt: true,
        sender: {
          select: {
            name: true,
          },
        },
      },
    });

    await tx.chatRoom.update({
      where: { id: data.chatRoomId },
      data: {
        lastMessage: data.content,
        lastMessageAt: new Date(),
        ...(data.isReadByAdmin ? {} : { unreadCountAdmin: { increment: 1 } }),
        ...(data.isReadByResident ? {} : { unreadCountResident: { increment: 1 } }),
      },
    });

    return message;
  });
};

// ==================== 메시지 읽음 처리 ====================

/**
 * 채팅방의 읽지 않은 메시지를 모두 읽음 처리
 * @description 역할에 따라 isReadByAdmin 또는 isReadByResident 업데이트
 * @param chatRoomId - 채팅방 ID
 * @param role - 사용자 역할 ("ADMIN" | "USER")
 * @returns 읽음 처리된 메시지 개수
 */
export const patchMessagesAsRead = async (chatRoomId: string, role: 'ADMIN' | 'USER') => {
  return await prisma.$transaction(async (tx) => {
    const result = await tx.chatMessage.updateMany({
      where: {
        chatRoomId,
        ...(role === 'ADMIN' ? { isReadByAdmin: false } : { isReadByResident: false }),
      },
      data: {
        ...(role === 'ADMIN' ? { isReadByAdmin: true } : { isReadByResident: true }),
      },
    });
    await tx.chatRoom.update({
      where: {
        id: chatRoomId,
      },
      data: {
        ...(role === 'ADMIN' ? { unreadCountAdmin: 0 } : { unreadCountResident: 0 }),
      },
    });
    return result.count;
  });
};
