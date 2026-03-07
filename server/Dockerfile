# --- Build stage ---
FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/package.json server/package-lock.json ./server/
COPY shared/ ./shared/

WORKDIR /app/server
RUN npm ci

COPY server/src/ ./src/
COPY server/tsconfig.json ./

# shared/ imports bare specifiers (e.g. @logtape/logtape) which tsc resolves
# from the file's directory. Symlink so ../node_modules finds server's deps.
RUN ln -s /app/server/node_modules /app/node_modules

RUN npm run build

# --- Production stage ---
FROM node:22-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/server/package.json /app/server/package-lock.json ./server/

WORKDIR /app/server
RUN npm ci --omit=dev

COPY --from=builder /app/server/dist/ ./dist/

ENV PORT=2567
EXPOSE 2567

CMD ["node", "dist/server/src/index.js"]
