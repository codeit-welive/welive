# 🌐 Nginx Reverse Proxy 설정 (WeLive)

Cloudflare HTTPS → Origin HTTP 구조에서 사용되는 Nginx 설정입니다.
Next.js 프론트엔드(3000)와 Express 백엔드(3001)를 하나의 도메인 아래에서 서비스할 수 있도록 구성되었습니다.

## 파일 구조

```
infra/
 └── nginx/
      ├── welive.mimu.live.conf
      └── README.md
```

## 서버 적용 방법

### 1) 파일 업로드

```
scp infra/nginx/welive.mimu.live.conf \
    ubuntu@<EC2_HOST>:/home/ubuntu/welive.mimu.live.conf
```

### 2) 이동

```
sudo mv ~/welive.mimu.live.conf /etc/nginx/sites-available/welive.mimu.live
```

### 3) 심볼릭 링크

```
sudo ln -s /etc/nginx/sites-available/welive.mimu.live /etc/nginx/sites-enabled/
```

### 4) 테스트 & Reload

```
sudo nginx -t
sudo systemctl reload nginx
```

### 5) Cloudflare 설정

- A 레코드 → 서버 IP
- Proxy ON
- SSL mode: Flexible 또는 Full

## Nginx 설정파일

```
# --- Cloudflare 원 IP 복원 (server 블록 바깥) ---
real_ip_header CF-Connecting-IP;

# CF IPv4
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/12;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;

# CF IPv6
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2c0f:f248::/32;
set_real_ip_from 2a06:98c0::/29;

real_ip_recursive on;

server {
    listen 80;
    listen [::]:80;
    server_name welive.mimu.live;

    client_max_body_size 5M;

    # 프론트 (3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;

        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
    }

    # 백엔드 API + SSE (3001)
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;

        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
    }

    # 정적 파일 캐싱
    location ~* \\.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
        expires 30d;
        access_log off;
    }

    # gzip
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_types text/plain text/css application/json application/javascript application/xml+rss image/svg+xml;
}
```
