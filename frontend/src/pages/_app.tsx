import '@/styles/globals.css';

import { AppProps } from 'next/app';
import { NextPage } from 'next';
import { ReactNode } from 'react';
import { FloatingChatButton, FloatingChatPanel } from '@/entities/chat/ui';

type NextPageWithLayout = NextPage & {
  getLayout: (page: ReactNode) => ReactNode;
};

export default function App({
  Component,
  pageProps,
}: AppProps & { Component: NextPageWithLayout }) {
  const getLayout = Component.getLayout ?? ((page: ReactNode) => page);

  return (
    <>
      {getLayout(<Component {...pageProps} />)}
      {/* 플로팅 채팅 UI */}
      <FloatingChatButton />
      <FloatingChatPanel />
    </>
  );
}
