# Etapa de build
FROM node:18 AS builder

WORKDIR /app

# Copia mínimamente para Turbo/workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copia solo frontend
COPY apps/frontend ./apps/frontend

# Instala solo para frontend
RUN corepack enable && pnpm install --filter=@levantapedidos/frontend

# Build solo frontend, con filtro explícito
RUN pnpm turbo run build --filter=@levantapedidos/frontend --scope=@levantapedidos/frontend

# Etapa de producción
FROM node:18-slim

WORKDIR /app

RUN npm install -g http-server@14.1.1

COPY --from=builder /app/apps/frontend/dist ./dist

EXPOSE $PORT

CMD ["http-server", "./dist", "--port", "${PORT:-3000}", "--address", "0.0.0.0", "--proxy", "http://localhost:${PORT}?"] 