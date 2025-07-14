FROM node:18 AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install

COPY . .
RUN pnpm build

FROM node:18-slim

WORKDIR /app

RUN npm install -g http-server@14.1.1

COPY --from=builder /app/dist ./dist

EXPOSE $PORT

CMD ["http-server", "./dist", "--port", "${PORT:-3000}", "--address", "0.0.0.0"]