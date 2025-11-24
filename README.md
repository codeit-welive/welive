# 🌳 Welive

## 📌 프로젝트 소개

🌳 **“함께 사는 공간, 함께 만드는 관리.”**  
**위리브(Welive)**는 입주민과 관리 단체가 한자리에서 소통하고 문제를 해결하며, 더 나은 공동체를 만들어가는 아파트 상호 관리 플랫폼입니다.
당신의 일상이 더 편해지는 그 순간까지, 위리브가 함께합니다.

---

## 📋 프로젝트 개요

- **프로젝트 기간**: 2025.10.17 ~ 2025.11.28
- **목표**: 레이어드 아키텍처 기반의 안정적이고 확장 가능한 프로젝트 관리 백엔드 구축
- **주요 기능**:
    - 사용자 인증 및 승인 프로세스  
      - 슈퍼관리자 / 관리자 / 입주민의 역할 기반 승인 구조 및 2차 인증  
      - (관리자·입주민 승인 요청, 승인/거절, 자동 매칭)

      > [!NOTE]  
      > 인증은 **JWT Access / Refresh Token** 기반으로 동작하며, Refresh Token은 DB에서 상태를 관리해 로그아웃·재발급 시 기존 토큰을 무효화하도록 설계했습니다.

    - 입주민 명부 관리  
      - 개별 등록 / CSV 업로드 / 검색·필터·페이지네이션 / 일괄 정리 기능 제공

      > [!WARNING]  
      > CSV 업로드 시 **헤더 명칭이 정확히 일치**해야 하며, 인코딩은 **UTF-8**만 지원됩니다.  
      > 잘못된 칼럼 또는 누락이 있는 경우, 해당 파일은 전체 업로드가 거부됩니다.

    - 민원(문의) 관리  
      - 상태(처리 전·중·완료) 변경, 실시간 알림, 비공개 처리, 수정·삭제 제한 로직 포함
    - 주민 투표 시스템  
      - 투표권자 범위 설정, 일정 기반 자동 오픈/마감, 결과 자동 공지 등록, 실시간 참여 가능

    - 공지사항 및 일정 관리  
      - 카테고리, 중요도, 댓글, 조회수, 일정 자동 반영 등 관리자 중심의 공지 운영 기능
    - 댓글 시스템  
      - 공지/민원 기반 댓글 등록·수정·삭제 기능 제공
    - 알림 시스템 (SSE)  
      - 민원·공지·투표 상태 변경 시 실시간 알림 전송
    - 파일 업로드 (프로필 사진)  
      - S3 업로드 기반의 안정적인 이미지 처리

      > [!WARNING]  
      > 업로드된 파일은 확장자가 아니라 **실제 바이너리(Magic Number)** 기반으로 검증되며,  
      > 이미지가 아닌 파일을 위장하여 업로드할 경우 서버에서 즉시 차단됩니다.

    - DB 트랜잭션 및 동시성 최적화 구조 설계  
      - 대량 업로드(CSV), 투표 마감 스케줄러 등에서의 트랜잭션 혹은 동시성 제한 처리 및 성능 고려

      > [!NOTE]  
      > Poll 자동 활성화/만료 로직은 **Limiter 기반 동시성 제어**로 보호되며,  
      > 동일 Poll에 대한 중복 스케줄 실행은 자동으로 방지됩니다.

---

## 👥 팀 구성 및 역할

| 담당자                                      | 역할                                     | 담당 모듈                                                                         | 주요 책임                                                                                              |
| ------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [유진호(리드)](https://github.com/selentia) | Backend Lead · System Architect · DevOps | Core, Infra/DevOps, Users, Events, Notifications/SSE, Poll Scheduler, 전체 스키마 | 시스템 아키텍처 및 스키마 설계 / Core·서버 파이프라인 구축 / 일부 도메인 개발 및 테스트·배포 환경 구축 / 프로젝트 문서·산출물(요구·설계·구현·테스트·배포) 및 시연 영상 통합 정리 |
| [한선재(팀장)](https://github.com/HSunJ)    | Auth & Residents & Apartments            | Auth, Residents, Apartments                                                       | Auth 기능 전반 구현 / Residents·Apartments CRUD·CSV / 입주민·아파트 권한 로직                          |
| [김준철](https://github.com/nodejun)        | Complaints & Comments & Chat             | Complaints, Comments, Chat(Socket.io)                                             | Complaints·Comments CRUD / 실시간 Chat API 개발                                                        |
| [김나연](https://github.com/luciakim22)     | Polls & Notices                          | Polls, PollsVote, Notices                                                         | Polls·PollsVote CRUD / Notices CRUD                                                                    |

---

## 🛠 기술 스택

### ⚙️ 백엔드 서버

| 구분                        | 기술                                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **언어/런타임**             | TypeScript, Node.js(Express 5)                                                                                    |
| **서버 프레임워크·구조**    | Express 5 기반 커스텀 서버(app.ts), 라우터 모듈 구조, 미들웨어 파이프라인 설계                                    |
| **ORM/DB**                  | Prisma, PostgreSQL                                                                                                |
| **스케줄러**                | cron (투표 활성화/만료 작업), **Limiter 기반 Poll Scheduler(직접 구현)**                                          |
| **유효성 검증**             | Zod(DTO·Body·Query·Params, CSV 데이터 검증 포함)                                                                  |
| **입력 정화(Sanitize)**     | isomorphic-dompurify + jsdom                                                                                      |
| **파일 업로드/이미지 처리** | multer, sharp                                                                                                     |
| **AWS 연동**                | AWS SDK v3 (@aws-sdk/client-s3, credential-providers, s3-request-presigner) — S3 업로드                           |
| **보안/안정화**             | helmet(CSP 포함), hpp, express-rate-limit, CORS(화이트리스트 기반), bcrypt(+pepper), jsonwebtoken(access/refresh) |
| **로그/모니터링**           | Pino(애플리케이션 로그), Morgan(HTTP 요청 로그)                                                                   |
| **환경변수 관리**           | dotenv, dotenv-cli, cross-env                                                                                     |

---

### 🧪 개발 및 테스트

| 구분                   | 기술                                |
| ---------------------- | ----------------------------------- |
| **테스트 프레임워크**  | Jest, ts-jest                       |
| **HTTP 테스트**        | supertest                           |
| **모킹/도구**          | jest.mock, jsdom                    |
| **정적 분석**          | ESLint, TypeScript ESLint, Prettier |
| **경로/빌드 유틸리티** | tsc-alias, tsconfig-paths, rimraf   |

---

### 🏗 운영·배포(Infra / DevOps)

| 구분                          | 기술                                                    |
| ----------------------------- | ------------------------------------------------------- |
| **컨테이너/배포**             | Docker, docker-compose, GitHub Actions(CI/CD 자동 배포) |
| **리버스 프록시**             | Nginx                                                   |
| **백엔드 프로세스 실행 방식** | Docker 컨테이너 단일 실행 (PM2 미사용)                  |
| **프론트엔드 배포(참고)**     | Next.js → PM2 기반 프로세스 실행                        |
| **로깅/운영**                 | Pino 로그, Nginx Access/Error 로그                      |

---

### 🧰 개발 편의

| 구분                            | 기술                                |
| ------------------------------- | ----------------------------------- |
| **자동 재시작**                 | nodemon                             |
| **동시 실행 스크립트**          | concurrently                        |
| **Swagger 문서 자동 생성/서빙** | swagger-autogen, swagger-ui-express |

## 📂 디렉터리 구조

프로젝트 전체 구조는 대규모이기 때문에, 주요 책임 단위 중심으로 요약한 형태입니다.

```
welive/
├── .github/workflows/ # CI/CD 파이프라인 (CI, CD)
├── infra/ # 배포/인프라 구성
│ ├── docker/ # Dockerfile, docker-compose, 서버 구성
│ └── nginx/ # Nginx Reverse Proxy 설정
│
├── prisma/ # Prisma 스키마 & 마이그레이션
│ ├── schema.prisma
│ ├── migrations/
│ └── seed.ts
│
├── public/ # 정적 파일 (템플릿 등)
│ └── templates/
│
├── scripts/ # Swagger 자동 생성 등 스크립트
│ ├── genSwagger.js
│ └── pinTree.js
│
├── src/
│ ├── @types/ # Express 타입 확장
│ │
│ ├── common/ # 공통 유틸/상수/Error/Helper
│ │ ├── constants/
│ │ ├── errors/
│ │ └── helpers/
│ │
│ ├── core/ # 앱 코어 레이어
│ │ ├── aws/ # S3 업로드/삭제 유틸
│ │ ├── files/ # 파일 MIME/MagicNumber 검증
│ │ ├── health/ # /health API
│ │ ├── middlewares/ # 인증/CORS/CSV/Error 핸들러
│ │ ├── sanitize/ # 입력 정화(DOMPurify)
│ │ ├── socket/ # Socket.io 초기화
│ │ ├── sse/ # SSE 라우터/Emitter
│ │ ├── utils/ # Limiter, Zod wrapper 등
│ │ ├── app.ts # Express 앱 초기화
│ │ ├── env.ts # 환경 변수 로더(Zod 검증)
│ │ ├── httpLogger.ts
│ │ ├── logger.ts
│ │ ├── prisma.ts
│ │ └── router.ts
│ │
│ ├── jobs/ # Poll Scheduler(자동 활성화/만료)
│ │ └── poll/
│ │
│ ├── modules/ # 도메인 모듈 (Router·Service·Repo·Validator·Dto)
│ │ ├── apartments/
│ │ ├── auth/
│ │ ├── chats/
│ │ ├── comments/
│ │ ├── complaints/
│ │ ├── events/
│ │ ├── notices/
│ │ ├── notifications/
│ │ ├── poll-scheduler/
│ │ ├── polls/
│ │ ├── residents/
│ │ └── users/
│ │
│ └── index.ts # 서버 엔트리
│
├── swagger/ # Swagger JSON 결과물
│
├── tests/ # 통합 테스트 및 Core 테스트
│ ├── core/
│ ├── modules/
│ ├── jobs/
│ └── setup/
│
├── logs/ # 서버/테스트 로그
├── .env* # 환경 변수 파일들
├── jest.config.ts
├── tsconfig.json
└── package.json

```

---

## ⚙️ 실행 방법

### 1) 환경 변수 예시 (`.env.example`)

`.env.example` 파일을 참고하여 실제 환경에 맞게 `.env`, `.env.production`, `.env.test` 파일을 구성합니다.

```env
# DATABASE
DATABASE_URL=postgresql://<user_name>:<password>@localhost:5432/welive

# PORT
PORT=3001
FE_PORT=3000

# BASE URL (API 오리진)
BASE_URL=https://your.domain.com

# FRONT (프론트엔드 오리진)
FRONT_URL=https://your.domain.com

# FILE URL (정적 업로드 접근용)
FILE_BASE_URL_DEV=http://localhost:3001/api/uploads
FILE_BASE_URL=https://your.domain.com/api/uploads

# RUNTIME
CORS_ORIGIN=https://your.domain.com
ACCESS_TOKEN_SECRET=your_accesstoken_secret
REFRESH_TOKEN_SECRET=your_refreshtoken_secret
PASSWORD_PEPPER=your_password_pepper
DEFAULT_AVATAR_URL=https://your_bucket_name.s3.ap-northeast-2.amazonaws.com/default_avatar.png

# AWS S3
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_BASE_URL=https://your_bucket_name.s3.ap-northeast-2.amazonaws.com
```

> [!WARNING]
> 테스트 환경(`.env.test`)은 Jest 스크립트 실행 시 자동으로 로드되며,  
> 테스트용 DB는 `test:reset`/`test:migrate` 과정에서 초기화됩니다.  
> 운영 DB 연결 정보가 `.env.test`에 들어가지 않도록 반드시 주의해야 합니다.  

### 2) 패키지 설치

```bash
npm install
```

### 3) 데이터베이스 설정 (Prisma)

개발/테스트 환경 모두 Prisma 스키마를 기반으로 초기화해야 합니다.

```bash
# 마이그레이션 + 시드 전체 수행
npm run prisma:migrate

# 또는 개별 실행:
npm run prisma:generate     # 프리즈마 클라이언트 생성
npm run prisma:reset        # DB 초기화 (dev)
npm run seed                # seed.ts 실행
npm run prisma:studio       # Prisma Studio(웹 기반 DB UI)
```

### 4) 개발 서버 실행

이 프로젝트는 백엔드(Express), 프론트엔드(Next.js) 를 동시에 개발하기 위해 `concurrently`를 사용합니다.

```bash
npm run dev
```

#### 개별 실행 방법

**백엔드 단독 실행**

```bash
npm run dev:be
```

**프론트 단독 실행**

```bash
npm run dev:fe
```

### 5) 테스트 실행

jest 환경은 `.env.test`를 자동 로드하며,  
Prisma 테스트 DB는 `test:migrate`/`test:reset`으로 제어할 수 있습니다.

```bash
npm test            # 전체 테스트 실행 (--runInBand)
npm run test:watch  # 변경 감지
npm run test:cov    # 테스트 커버리지
```

테스트용 DB 초기화:

```bash
npm run test:reset
npm run test:migrate
```

> [!WARNING]
> 테스트 초기화(`test:reset`)는 테스트용 DB를 전부 비우고 마이그레이션을 다시 적용하므로,  
> 실제 데이터가 저장된 DB와는 반드시 분리된 환경에서 실행해야 합니다.

### 6) 빌드

```bash
npm run build
```

빌드를 수행하면 `dist/` 디렉터리가 생성되고,
`tsc-alias`로 경로 alias가 자동 변환됩니다.

### 7) 프로덕션 실행

프론트는 PM2로 실행하고,  
백엔드는 Docker 기반으로 운영하는 환경과 PM2 기반 환경 모두 지원하도록 스크립트가 구성되어 있습니다.  

**PM2 기반 실행 (로컬 / 서버 공용)**

```bash
npm start     # (= start:be && start:fe)
```

**백엔드만 실행**

```bash
npm run start:be
```

**프론트만 실행**

```bash
npm run start:fe
```

**중지:**

```bash
npm run stop
```

> [!WARNING]
> `npm run stop` 스크립트는 `pm2 delete` 실패 시에도 프로세스를 계속 진행하도록 구성되어 있습니다.  
> PM2 프로세스가 수동으로 종료된 상태라면 경고가 출력될 수 있지만, 이는 정상 동작입니다.  

### 8) Swagger 문서 생성

Swagger는 자동 생성 스크립트(genSwagger.js) 를 통해 /swagger/swagger.json으로 빌드됩니다.

```bash
npm run swagger:generate
```

이후 /api/docs 경로에서 Swagger UI로 확인할 수 있습니다.

> [!NOTE]
> `swagger/swagger.json` 파일이 존재하지 않는 경우, 서버는 부정확한 문서 상태로의 배포를 막기 위해 즉시 종료되도록 설계되어 있습니다.  
> 배포 전에 반드시 `npm run swagger:generate`를 실행해야 합니다.  

---

## 🔐 보안 기본 설정

WeLive 서버는 Express 5 기반으로, 다음과 같은 다층 보안 요소를 적용하여 안정성과 안전성을 강화했습니다.

### 1) HTTP 보안 헤더

- **helmet** 적용
  - CSP(Content Security Policy) 커스텀 구성
  - `frame-ancestors: none`, `object-src: none` 등 클릭재킹 및 위변조 방지
  - 개발 환경에서만 `img-src`에 `blob:` 허용

### 2) X-Powered-By & ETag 제거

- `app.disable('x-powered-by')` 로 Express 노출 제거
- `app.set('etag', false)` 로 ETag 기반 캐싱 무효화 (보안 취약점 완화)

### 3) Rate Limiting (요청 제한)

- **express-rate-limit** 적용
  - 15분 기준 최대 1000 요청
  - 표준 헤더 적용(429 메시지 개선)

### 4) HTTP Parameter Pollution 방지

- **hpp** 사용
  - 중복된 파라미터로 인한 HPP 공격 차단

### 5) CORS 화이트리스트 기반 제한

- 환경 변수 기반 **정적 오리진 화이트리스트 구성**
- 인증 쿠키 및 JWT 헤더 노출 제어

### 6) Proxy Trust 설정

- `app.set('trust proxy', [...])`
  - Nginx 프록시 뒤에서 실행될 때 정확한 IP/프로토콜 정보 사용 가능

### 7) 요청 Body 보호

- `express.json({ limit: '2mb' })` 로 본문 크기 제한
- URL-encoded payload도 제한적 허용

### 8) 쿠키 처리

- **cookie-parser** 사용
  - 로그인·세션·보조 데이터 파싱
  - (필요한 최소 범위로 제한하여 사용)

### 9) 응답 압축

- **compression(gzip)** 적용
  - 응답 크기 감소 → DDoS 표면 감소

### 10) 정적 파일 보안

- MIME 기반 파일 유효성 검사
- sharp 기반 이미지 처리로 악성 이미지·Payload 숨기기 방지
- Magic Number 기반 MIME 검증(`assertAllowedByMagic.ts`)

### 11) 입력 정화(Input Sanitization)

- **DOMPurify(isomorphic-dompurify + jsdom)**
  - 댓글/게시글에서 악성 스크립트 제거 (서버단 Sanitization)

### 12) 인증 보안

- 로그인/회원가입/토큰 전송은 **JWT Access + Refresh Token 구조**
- 비밀번호는 **bcrypt + pepper** 조합으로 강화 해싱
- Refresh Token은 DB에서 상태 관리
- TokenUtils에서 서명·만료·갱신 로직 통합 관리

### 13) SSE & WebSocket 보호

- SSE 연결 시 **JWT 기반 헤더 인증**
- WebSocket(Socket.io)도 미들웨어로 JWT 인증 적용

### 14) 서버 오류 노출 방지

- 글로벌 에러 핸들러로
  - 내부 스택트레이스 숨김
  - 일정한 에러 응답 형식 유지(ApiError)

### 15) Swagger 보안

- Swagger 파일이 존재하지 않을 경우 서버 자동 중단  
  → 잘못 구성된 문서/배포 방지

---

## ✅ 진행 결과 하이라이트

- **인프라/배포**
  - Docker 기반 백엔드 컨테이너 구축 및 Nginx Reverse Proxy 구성
  - GitHub Actions 기반 CI/CD 파이프라인 구축 (테스트 → 빌드 → GHCR Push → EC2 자동 배포)
  - RDS/EC2 환경에서 최종 프로덕션 배포 완료 및 안정적 운영 중

- **백엔드 아키텍처**
  - 전체 Prisma 스키마 아키텍처 설계 및 Core 레이어 구축(env/logger/middlewares/router)
  - Express 5 기반 서버(app.ts) 설계: CSP/보안 헤더, rate-limit, HPP, CORS, Proxy 신뢰, gzip 압축 등 전체 보안 파이프라인 구성
  - SSE 기반 실시간 알림 시스템 및 Socket.io 실시간 채팅 모듈 구축
  - Poll 자동 활성화/만료 스케줄러 설계(Limiter 기반 동시성 제어 포함)

- **백엔드 주요 기능**
  - 사용자 프로필/이미지 업로드(S3 Presigned URL), 유저 정보 수정 기능
  - 공지/민원/댓글/입주민/아파트/투표(Polls) CRUD 전체 기능 완성
  - Notifications REST + SSE 알림 통합 시스템 구현
  - 이벤트(Calendar) 모듈 구축 및 관리자/유저 권한 흐름 정립

- **테스트/품질**
  - Core, Modules, Jobs 전체에 걸친 통합 테스트 작성(Jest + Supertest)
  - SSE, Scheduler, Prisma 트랜잭션/캐스케이드 테스트 포함
  - ESLint/Prettier/tsconfig 구성 정비 및 전체 코드 품질 안정화

- **시연/운영**
  - Swagger 자동 생성 및 API 문서화 완비
  - 개발·테스트·프로덕션 환경 분리(.env/.env.test/.env.production)
  - 프론트엔드 연동 테스트 완료 및 최종 배포 성공

---

## 📌 링크

- 팀 협업 문서(Notion): 갱신 예정
- 최종 발표 자료: 갱신 예정
- 시연 영상: 갱신 예정
- 저장소: https://github.com/codeit-welive/welive
- 산출물:
  - 1. 요구사항 분석: 갱신 예정
  - 2. 설계: 갱신 예정
  - 3. 구현: 갱신 예정
  - 4. 테스트: 갱신 예정
  - 5. 배포 및 유지보수: 갱신 예정
