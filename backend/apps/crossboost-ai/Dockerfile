FROM node:lts-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
COPY libs/ ./libs/
COPY apps/crossboost-ai/ ./apps/crossboost-ai/
RUN corepack enable pnpm && pnpm install --frozen-lockfile || npm install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/libs ./libs
COPY --from=deps /app/apps/crossboost-ai ./apps/crossboost-ai
COPY tsconfig.base.json nx.json ./
RUN npx nx build crossboost-ai

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/crossboost-ai/dist ./dist
COPY --from=builder /app/libs ./libs
EXPOSE 3010
CMD ["node", "dist/main.js"]
