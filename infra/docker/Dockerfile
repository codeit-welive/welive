# ---------- base ----------
FROM node:20-alpine AS build
WORKDIR /app
# bcrypt / Prisma 등 네이티브 모듈 호환
RUN apk add --no-cache openssl libc6-compat

# ---------- build (TS → CJS) ----------
# 의존성
COPY package*.json ./
RUN npm ci

# Prisma 스키마/소스 복사
COPY prisma ./prisma
COPY tsconfig*.json ./
COPY src ./src

# Prisma Client 생성
RUN npx prisma generate --schema=prisma/schema.prisma

# 빌드
RUN npm run build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=3001

# non-root
RUN addgroup -S app && adduser -S app -G app
USER app

# deps / app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3001

# 마이그레이션 후 기동
CMD sh -c "npx prisma migrate deploy --schema=prisma/schema.prisma && node dist/index.js"
