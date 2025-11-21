import '@/styles/globals.css';

import { AppProps } from 'next/app';
import { NextPage } from 'next';
import { ReactNode, useEffect, useRef } from 'react';
import { FloatingChatButton, FloatingChatPanel } from '@/entities/chat/ui';
import { useAuthStore } from '@/shared/store/auth.store';
import { disconnectSocket } from '@/entities/chat/lib/socket';

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
    }
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
