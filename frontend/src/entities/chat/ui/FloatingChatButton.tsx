/**
 * 플로팅 채팅 버튼
 * @description 우측 하단에 고정된 채팅 버튼 (고객센터 스타일)
 */

'use client';

import { useChatStore } from '@/shared/store/chat.store';
import { useAuthStore } from '@/shared/store/auth.store';

export function FloatingChatButton() {
  const { user } = useAuthStore();
  const { toggleChat, isOpen, unreadCount } = useChatStore();

  // 로그인하지 않은 경우 버튼 숨김
  if (!user) return null;

  return (
    <button
      onClick={toggleChat}
      className='fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-600 hover:scale-110 active:scale-95'
      aria-label='채팅 열기'
    >
      {/* 읽지 않은 메시지 배지 */}
      {!isOpen && unreadCount > 0 && (
        <span className='absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white shadow-md'>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {isOpen ? (
        // 닫기 아이콘 (X)
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={2}
          stroke='currentColor'
          className='h-6 w-6'
        >
          <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
        </svg>
      ) : (
        // 채팅 아이콘
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={2}
          stroke='currentColor'
          className='h-6 w-6'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z'
          />
        </svg>
      )}
    </button>
  );
}
