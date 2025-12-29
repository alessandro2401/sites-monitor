# Multi-stage build para otimizar tamanho da imagem

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação
RUN pnpm build && pnpm build:server

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Instalar dumb-init para melhor gerenciamento de processos
RUN apk add --no-cache dumb-init curl

# Copiar dependências do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copiar código compilado
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

# Criar diretório de logs
RUN mkdir -p /app/logs

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Mudar propriedade dos arquivos
RUN chown -R nodejs:nodejs /app

# Usar usuário não-root
USER nodejs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Usar dumb-init para iniciar a aplicação
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar
CMD ["node", "dist/server/index.js"]
