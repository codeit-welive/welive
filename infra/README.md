# 빌드 안내

## 이미지 빌드

docker build -f infra/Dockerfile -t welive-backend .

## 실행

docker run -p 3001:3001 --env-file .env welive-backend
