import type { Response } from 'express';
import type { SseEvent } from './types';

/**
 * 개별 SSE 클라이언트 관리 클래스
 */
export class SseClient {
  constructor(
    public readonly id: string,
    private res: Response
  ) {}

  /**
   * 이벤트 전송
   */
  send(event: SseEvent): void {
    this.res.write(`event: ${event.event}\n`);
    this.res.write(`data: ${JSON.stringify(event.data)}`);
  }

  /**
   * 하트비트 (keep-alive)
   */
  ping(): void {
    const stream = this.res as unknown as import('http').ServerResponse;
    stream.write(': ping\n\n');
  }

  /**
   * 연결 종료
   */
  close(): void {
    this.res.end();
  }
}
