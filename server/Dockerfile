# --- Build stage ---
FROM node:22-slim AS builder

WORKDIR /app

COPY server/package.json server/package-lock.json ./server/
COPY shared/ ./shared/

WORKDIR /app/server
RUN npm ci

COPY server/src/ ./src/
COPY server/tsconfig.json ./
RUN npx tsc

# --- Production stage ---
FROM node:22-slim

WORKDIR /app

COPY --from=builder /app/server/package.json /app/server/package-lock.json ./server/
COPY --from=builder /app/shared/ ./shared/

WORKDIR /app/server
RUN npm ci --omit=dev

COPY --from=builder /app/server/dist/ ./dist/

ENV PORT=2567
EXPOSE 2567

CMD ["node", "dist/server/src/index.js"]
