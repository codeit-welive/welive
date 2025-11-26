import { useNotificationStore } from '../store/notify.store';

let eventSource: EventSource | null = null;

export function connectSse(userId: string) {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3001/api';

  const url = `${baseUrl}/notifications/sse?userId=${userId}`;
  console.log('🔔 SSE connecting:', url);

  eventSource = new EventSource(url, { withCredentials: true } as any);

  eventSource.onopen = () => {
    console.log('🔔 SSE 연결 성공');
  };

  eventSource.onerror = (err) => {
    console.error('❌ SSE 오류', err);
  };

  eventSource.addEventListener('alarm', (e) => {
    try {
      const incoming = JSON.parse(e.data);
      useNotificationStore.getState().addNotifications(incoming);
      console.log('📩 SSE 알림 수신:', incoming);
    } catch (err) {
      console.error('알림 파싱 오류:', err);
    }
  });

  return () => {
    eventSource?.close();
    eventSource = null;
  };
}

export function disconnectSse() {
  if (eventSource) {
    console.log('🔌 SSE 연결 종료됨');
    eventSource.close();
    eventSource = null;
  }
}
