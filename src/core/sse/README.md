# SSE 모듈 구조 및 사용 가이드

## 디렉터리 구조

```
src/core/sse/
 ├─ index.ts        # SSE 라우터 및 브로드캐스트 관리
 ├─ sseClient.ts    # 개별 클라이언트 세션 관리 클래스
 ├─ sseEmitter.ts   # 백그라운드(Cron 등) 환경에서 안전하게 SSE 전송 수행
 ├─ types.ts        # 이벤트 및 페이로드 타입 정의
 └─ README.md       # (현재 문서)
```

---

## 파일별 역할

| 파일명            | 역할                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| **index.ts**      | SSE 라우터 등록, 연결 관리, 전역 클라이언트 Map 보관, `broadcast()` 및 `sendToUser()` 함수 제공                |
| **sseClient.ts**  | 단일 클라이언트 연결 관리 (EventSource 응답 유지, 데이터 전송, 하트비트 관리)                                  |
| **sseEmitter.ts** | 백그라운드(Cron, Scheduler 등) 환경에서 안전하게 `broadcast()` 호출 수행. 예외 발생 시 시스템 로그로 경고 출력 |
| **types.ts**      | SSE 이벤트 및 페이로드 타입 정의 (`SseEvent`, `NotificationPayload`)                                           |

---

## 코드 사용 예시

### 서비스 레벨에서의 전역 알림 전송

```ts
import { broadcast } from '#core/sse';

broadcast({
  event: 'notification',
  data: {
    id: notice.id,
    content: `새 공지사항이 등록되었습니다.`,
    type: 'NOTICE_REG', // Prisma NotificationType
    notifiedAt: new Date().toISOString(),
    isChecked: false,
    recipientId: userId,
  },
});
```

### 특정 유저에게 전송

```ts
import { sendToUser } from '#core/sse';

sendToUser(targetUserId, {
  event: 'notification',
  data: {
    id: complaint.id,
    content: `민원 처리가 완료되었습니다.`,
    type: 'COMPLAINT_RESOLVED',
    notifiedAt: new Date().toISOString(),
    isChecked: false,
    recipientId: targetUserId,
  },
});
```

### 참고사항

- `broadcast()`와 `sendToUser()`는 전역 상태의 클라이언트 Map을 참조하므로, import만으로 사용 가능함.
