'use client';

import '@/styles/globals.css';

import { AppProps } from 'next/app';
import { NextPage } from 'next';
import { ReactNode, useEffect, useRef } from 'react';
import { FloatingChatButton, FloatingChatPanel } from '@/entities/chat/ui';
import { useAuthStore } from '@/shared/store/auth.store';
import { disconnectSocket } from '@/entities/chat/lib/socket';

// SSE 전역 연결
import { connectSse, disconnectSse } from '@/shared/lib/sse';

type NextPageWithLayout = NextPage & {
  getLayout: (page: ReactNode) => ReactNode;
};

export default function App({
  Component,
  pageProps,
}: AppProps & { Component: NextPageWithLayout }) {
  const getLayout = Component.getLayout ?? ((page: ReactNode) => page);
  const { user } = useAuthStore();
  const prevUserRef = useRef(user);

  // 로그아웃 감지: Socket 연결 완전히 종료
  useEffect(() => {
    const prevUser = prevUserRef.current;
    prevUserRef.current = user;

    // 로그아웃 시 (user가 있었다가 null이 됨)
    if (prevUser && !user) {
      console.log('🔌 로그아웃 감지: Socket 연결 종료');
      disconnectSocket();

      // 🔔 SSE 연결도 함께 종료
      console.log('🔌 로그아웃 감지: SSE 연결 종료');
      disconnectSse();
    }
  }, [user]);

  /* ─────────────────────────────────────────────────────────────
   *  SSE 전역 연결
   *  - 로그인 시 SSE 연결
   *  - 페이지 이동에도 끊기지 않음
   *  - Navibar와 무관하게 항상 유지됨
   * ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    // user가 없는 상태에서는 SSE 연결하지 않음
    if (!user) return;

    console.log('🔔 SSE 전역 연결 시작');
    const close = connectSse(user.id);

    return () => {
      console.log('🔌 _app 언마운트: SSE 연결 정리');
      close?.();
    };
  }, [user]);

  return (
    <>
      {getLayout(<Component {...pageProps} />)}
      {/* 플로팅 채팅 UI - 로그인 시에만 렌더링 */}
      {user && (
        <>
          <FloatingChatButton />
          <FloatingChatPanel />
        </>
      )}
    </>
  );
}
