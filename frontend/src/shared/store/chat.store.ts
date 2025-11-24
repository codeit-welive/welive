/**
 * 채팅 전역 상태 관리
 * @description 플로팅 채팅 패널의 열림/닫힘 상태 및 읽지 않은 메시지 수 관리
 */

import { create } from 'zustand';

interface ChatStore {
  /**
   * 채팅 패널 열림 상태
   */
  isOpen: boolean;

  /**
   * 읽지 않은 메시지 총 개수
   * @description Admin: 모든 채팅방의 읽지 않은 메시지 수 합계
   * @description Resident: 자신의 채팅방 읽지 않은 메시지 수
   */
  unreadCount: number;

  /**
   * 채팅 패널 열기
   */
  openChat: () => void;

  /**
   * 채팅 패널 닫기
   */
  closeChat: () => void;

  /**
   * 채팅 패널 토글
   */
  toggleChat: () => void;

  /**
   * 읽지 않은 메시지 수 설정
   */
  setUnreadCount: (count: number) => void;

  /**
   * 읽지 않은 메시지 수 증가
   */
  incrementUnreadCount: (amount?: number) => void;

  /**
   * 읽지 않은 메시지 수 감소
   */
  decrementUnreadCount: (amount?: number) => void;

  /**
   * 읽지 않은 메시지 수 초기화
   */
  resetUnreadCount: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  unreadCount: 0,
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnreadCount: (amount = 1) => set((state) => ({ unreadCount: state.unreadCount + amount })),
  decrementUnreadCount: (amount = 1) => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - amount) })),
  resetUnreadCount: () => set({ unreadCount: 0 }),
}));
