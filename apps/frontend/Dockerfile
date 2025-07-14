# Etapa de build
FROM node:18 AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml .
RUN corepack enable && pnpm install

COPY . .
RUN pnpm build

# Etapa de producción
FROM node:18-slim

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist /app/dist

EXPOSE 3000

CMD ["serve", "dist", "-s", "-l", "3000"] 