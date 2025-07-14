# Etapa de build
FROM node:18 AS builder

WORKDIR /app

# Copia archivos de raíz necesarios para monorepo/Turbo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copia solo el frontend
COPY apps/frontend ./apps/frontend

# Instala dependencias solo para frontend
RUN corepack enable && pnpm install --filter=@levantapedidos/frontend

# Build solo frontend con Turbo filter
RUN pnpm turbo run build --filter=@levantapedidos/frontend

# Etapa de producción
FROM node:18-slim

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/apps/frontend/dist /app/dist

EXPOSE 3000

CMD ["serve", "dist", "-s", "-l", "3000"] 