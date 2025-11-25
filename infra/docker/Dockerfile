# ---------- base ----------
FROM node:20-alpine AS build
WORKDIR /app
# bcrypt / Prisma 등 네이티브 모듈 호환
RUN apk add --no-cache openssl libc6-compat

# ---------- build (TS → CJS) ----------
# dependencies
COPY package*.json ./
RUN npm ci

# sources
COPY prisma ./prisma
COPY tsconfig*.json ./
COPY src ./src
COPY scripts ./scripts

# generate prisma client
RUN npx prisma generate --schema=prisma/schema.prisma

# build TS → JS
RUN npm run build

# generate swagger (CJS)
RUN npm run swagger:generate

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=3001

# non-root
RUN addgroup -S app && adduser -S app -G app
RUN mkdir -p /app/logs && chown -R app:app /app/logs
USER app

# copy built artifacts + prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/swagger ./swagger
COPY package*.json ./

EXPOSE 3001

# 마이그레이션 후 기동
CMD sh -c "npx prisma migrate deploy --schema=prisma/schema.prisma && node dist/index.js"
