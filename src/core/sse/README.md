# SSE 모듈 구조 및 사용 가이드

## 디렉터리 구조

```
src/core/sse/
 ├─ index.ts        # SSE 라우터, 다중 연결 관리, 전역 클라이언트 Map 보관
 ├─ sseClient.ts    # 단일 SSE 연결(Session) 관리
 ├─ sseEmitter.ts   # 백그라운드(Cron, Scheduler 등)에서 안전하게 알림 전송하는 브리지
 ├─ types.ts        # SSE 이벤트 및 알림 페이로드 타입 정의
 └─ README.md        # (현재 문서)
```

## 파일별 역할

| 파일명            | 역할                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| **index.ts**      | SSE 라우터 등록, 다중 탭/다중 세션 지원, 전역 클라이언트 Map 유지, `broadcast()` 및 `sendToUser()` 제공 |
| **sseClient.ts**  | 단일 클라이언트 연결 관리 (EventSource 전송, 하트비트 ping, 연결 종료 처리)                             |
| **sseEmitter.ts** | CronJob·Scheduler·백그라운드 로직에서 SSE 안전 전송 기능 제공 (`sendSseNotification`, `sendSseToUser`)  |
| **types.ts**      | `SseEvent`, `NotificationPayload` 타입 정의                                                             |

## SSE 라우터 작동 방식

### 엔드포인트

```
GET /api/notifications/sse
```

### 인증

JWT 쿠키(`authMiddleware`)를 통해 식별된 사용자만 SSE 연결 가능.

### 동작 요약

- 로그인한 유저의 SSE 연결을 **Map<string, Set<SseClient>>** 에 저장
- 연결 시 현재 읽지 않은 알림을 즉시 push
- 서버는 30s ± 5s 간격으로 ping 전송
- poll/notice/complaint 등에서 `sendSse...` 호출 시 실시간 push

## 사용 예시 (서비스/도메인 레벨)

### 전역 알림 전송

```ts
import { sendSseNotification } from '#sse/sseEmitter';

sendSseNotification({
  notificationId: created.id,
  content: created.content,
  notificationType: created.notificationType.NOTICE_REG, // prisma에서 import 필요
  notifiedAt: created.notifiedAt.toISOString(),
  isChecked: created.isChecked,
  noticeId: created.noticeId,
});
```

### 특정 유저에게 전송

```ts
import { sendSseToUser } from '#sse/sseEmitter';

sendSseToUser(targetUserId, {
  notificationId: n.id,
  content: n.content,
  notificationType: n.notificationType.COMPLAINT_RESOLVED, // prisma에서 import 필요
  notifiedAt: n.notifiedAt.toISOString(),
  isChecked: n.isChecked,
  complaintId: n.complaintId,
});
```

## 중요사항

> [!WARNING]
>
> - `broadcast()`나 `sendToUser()`를 직접 import 하지 말 것
> - 반드시 **sseEmitter.ts** 를 통해 호출

- 최초 SSE 연결 시 unread 알림 자동 전송
- 다중 탭 완벽 지원(Map<string, Set<SseClient>>)

## 예외 처리 및 로깅

- SSE 라우터 초기화 문제 → `logger.sse.warn`
- 연결 종료 시 자동 clean-up
- stringify 실패 시 경고 로그 출력
