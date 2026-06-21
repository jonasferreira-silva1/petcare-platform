# ─── Estágio 1: dependências ───────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Fixa a versão do pnpm igual ao ambiente local
RUN corepack enable && corepack prepare pnpm@10.34.4 --activate

# Copia apenas os arquivos de lock — o resto do código não invalida esse cache
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# ─── Estágio 2: build ──────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.34.4 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Placeholders para build-time — sobrescritos em runtime pelo docker-compose
ENV DATABASE_URL=postgresql://placeholder:placeholder@placeholder:5432/petcare
ENV BETTER_AUTH_URL=http://localhost:3000
ENV BETTER_AUTH_SECRET=build-placeholder-secret-minimum-32chars
ENV DOCKER_BUILD=1

RUN pnpm build

# ─── Estágio 3: runner (imagem final, enxuta) ──────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Bundle standalone gerado pelo Next.js + arquivos estáticos
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

# Necessário para o auto-migrate via instrumentation.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules     ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/lib/db           ./lib/db

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
