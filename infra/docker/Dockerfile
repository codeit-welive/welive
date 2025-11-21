# ---------- base ----------
FROM node:20-alpine AS base
WORKDIR /app
# bcrypt / Prisma 등 네이티브 모듈 호환
RUN apk add --no-cache openssl libc6-compat

# ---------- deps (dev 포함: 빌드용) ----------
FROM base AS deps
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY prisma ./prisma
COPY src ./src

# Prisma Client 생성
RUN npx prisma generate --schema=prisma/schema.prisma

# ---------- build (TS → CJS) ----------
FROM deps AS build
COPY prisma ./prisma
RUN npm run build

# ---------- prod-deps (런타임: prod deps + prisma CLI만 추가) ----------
FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev \
  && npm i --no-save prisma@6.17.1

# ---------- runtime ----------
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3001

# non-root
RUN addgroup -S app && adduser -S app -G app
USER app

# deps / app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build     /app/dist         ./dist
COPY --from=build     /app/prisma       ./prisma
COPY package*.json ./ 

EXPOSE 3001

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api || exit 1

# 마이그레이션 후 기동
CMD sh -c "npx prisma migrate deploy --schema=prisma/schema.prisma && node dist/index.js"
