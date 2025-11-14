/**
 * 채팅 전역 상태 관리
 * @description 플로팅 채팅 패널의 열림/닫힘 상태 관리
 */

import { create } from 'zustand';

interface ChatStore {
  /**
   * 채팅 패널 열림 상태
   */
  isOpen: boolean;

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
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
}));
