# 🌐 Nginx Reverse Proxy 설정 (WeLive)

> [!NOTE]
> 이 문서는 Public GitHub 저장소 공개를 위해 실제 도메인을 마스킹한 버전(example.com)입니다.

WeLive 서비스는 **Cloudflare → Nginx → Backend** 구조로 동작하며,  
프론트엔드와 백엔드를 각각 분리된 도메인에서 운영합니다.

---

# 🔄 아키텍처 개요

## 1) 도메인 분리 구조 (예시 도메인 사용)

- **프론트엔드:**  
  https://frontend.example.com → **127.0.0.1:3000**

- **백엔드 API:**  
  https://api.example.com → **127.0.0.1:3001**

Cloudflare의 프록시(Proxy ON)를 거쳐 Nginx로 전달됩니다.

---

## 2) 백엔드 Express는 Prod에서 로컬바인딩(127.0.0.1)

프로덕션 환경에서는 백엔드가 외부에서 직접 접근되지 않도록  
아래와 같이 **로컬바인딩**을 적용합니다:

```ts
server.listen(PORT, "127.0.0.1");
```

외부에서 `:3001` 포트로 직접 접근할 수 없으며,  
Cloudflare → Nginx → Backend 경로로만 호출됩니다.

---

## 3) Swagger 접근 정책 분리

Swagger 문서는 다음과 같이 분리 운영됩니다:

- **공개:** https://api.example.com/docs  
- **차단:** https://frontend.example.com/docs → 404 처리

Swagger는 API 도메인에서만 접근 가능하도록 Nginx 레벨에서 URL 접근을 제어합니다.

---

# 📁 파일 구조

```
infra/
 └── nginx/
      ├── cloudflare.conf             # Cloudflare Nginx 설정
      ├── frontend.example.com.conf   # 프론트용 Nginx 설정
      ├── api.example.com.conf        # API + Swagger 설정
      └── README.md                   # (이 문서)
```

---

## ☁️ Cloudflare 공통 설정

`cloudflare.conf`는 Cloudflare에서 전달되는 실제 클라이언트 IP를 복원하기 위한 공통 설정입니다.  
Nginx 메인 설정 또는 각 사이트 설정 파일 상단에서 다음과 같이 include 해서 사용합니다.  
※ cloudflare.conf는 /etc/nginx/ 또는 /etc/nginx/conf.d/ 중 하나에 둘 수 있으며, 팀 환경에 맞게 선택하면 됩니다.

예시:

```nginx
# /etc/nginx/sites-available/frontend.example.com.conf
include /etc/nginx/cloudflare.conf;

server {
    ...
}
```

```nginx
# /etc/nginx/sites-available/api.example.com.conf
include /etc/nginx/cloudflare.conf;

server {
    ...
}
```

---

# 🚀 서버 적용 방법

### 1) 파일 업로드
```bash
scp infra/nginx/*.conf ubuntu@<EC2_HOST>:/home/ubuntu/
```

### 2) nginx 디렉토리로 이동
```bash
sudo mv ~/cloudflare.conf /etc/nginx/
sudo mv ~/frontend.example.com.conf /etc/nginx/sites-available/
sudo mv ~/api.example.com.conf /etc/nginx/sites-available/
```

### 3) 심볼릭 링크 생성
```bash
sudo ln -s /etc/nginx/sites-available/frontend.example.com.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.example.com.conf /etc/nginx/sites-enabled/
```

### 4) 테스트 & Reload
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5) Cloudflare 설정
- A 레코드: `frontend.example.com`, `api.example.com` → EC2 IP  
- Proxy: ON  
- SSL mode: Full 또는 Full(Strict)  
- Cache: 기본값 유지

---

# 🛡 보안 요약

- 백엔드는 **127.0.0.1 로컬바인딩**으로 외부 접근 불가  
- Cloudflare → Nginx → Backend 구조  
- Swagger는 API 도메인에서만 공개, 프론트에서는 차단  
- Cloudflare 원본 IP 복원(real_ip_header) 적용 → 정확한 로그 및 RateLimit 보장

---

# 📌 참고

> [!NOTE]
> 이 문서는 public 용도로 작성된 README이며  
> 실제 운영 도메인 및 민감 설정은 포함하지 않습니다.