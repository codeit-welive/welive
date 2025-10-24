# deps / build
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build

# runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
# ENV UPLOAD_DIR=/app/uploads

# Prisma 및 bcrypt 등 네이티브 모듈 호환성을 위한 보강
RUN apk add --no-cache openssl libc6-compat

# non-root
RUN addgroup -S app && adduser -S app -G app
# RUN mkdir -p /app/uploads && chown -R app:app /app
USER app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/dist ./dist
COPY --from=deps /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3001
# Prisma 마이그레이션 후 서버 기동
CMD sh -c "npx prisma migrate deploy --schema=prisma/schema.prisma && node dist/app.js"
