import { describe, it, expect } from '@jest/globals';
import { SseClient } from '#sse/sseClient';
import { NotificationType } from '@prisma/client';

describe('[SSE] SseClient 동작 검증', () => {
  const mockRes = { write: jest.fn(), end: jest.fn() } as any;
  const client = new SseClient('user1', mockRes);

  it('send()는 event-stream 포맷으로 write 호출', () => {
    const payload = {
      notificationId: 'n1',
      content: '테스트 알림',
      notificationType: NotificationType.POLL_REG,
      notifiedAt: new Date().toISOString(),
      isChecked: false,
    };

    client.send({ event: 'alarm', data: [payload] });
    const written = (mockRes.write as jest.Mock).mock.calls.map((c) => c[0]).join('');
    expect(written).toMatch(/^event: alarm\n/);
    expect(written).toMatch(/data: \[/);
    expect(written.endsWith('\n\n')).toBe(true);
  });

  it('ping() 호출 시 ": ping" 작성', () => {
    client.ping();
    expect(mockRes.write).toHaveBeenCalledWith(': ping\n\n');
  });

  it('close() 호출 시 end() 실행', () => {
    client.close();
    expect(mockRes.end).toHaveBeenCalled();
  });
});
