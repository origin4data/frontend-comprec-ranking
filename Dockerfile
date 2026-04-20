# --- Estágio 1: Dependências ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia os ficheiros de dependências
COPY package.json package-lock.json* ./
RUN npm ci

# --- Estágio 2: Build ---
FROM node:20-alpine AS builder
WORKDIR /app

# Copia as dependências e o código fonte
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desativa a telemetria do Next.js durante o build
ENV NEXT_TELEMETRY_DISABLED=1

# Gera o build otimizado (Standalone)
RUN npm run build

# --- Estágio 3: Produção (Runner) ---
FROM node:20-alpine AS runner
WORKDIR /app

# libc6-compat é exigida pelo sharp (otimização de imagens) no Alpine
RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cria um utilizador sem privilégios de root por motivos de segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia a pasta public (imagens, svgs, etc)
COPY --from=builder /app/public ./public

# Prepara a diretoria de cache e dá permissões
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copia o build standalone e os arquivos estáticos
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Instala o sharp (obrigatório pra otimização de imagens em standalone)
RUN npm install --omit=dev sharp

# Muda para o utilizador seguro
USER nextjs

# O Next.js corre por defeito na porta 3000
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Inicia o servidor Node.js otimizado
CMD ["node", "server.js"]
