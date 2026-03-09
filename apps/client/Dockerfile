# Stage 1 — Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/client/package.json ./apps/client/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/tsconfig/package.json ./packages/tsconfig/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Stage 2 — Build
FROM deps AS builder
COPY packages/tsconfig ./packages/tsconfig
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY apps/client ./apps/client
RUN pnpm --filter @famaserver/types build
RUN pnpm --filter @famaserver/utils build
RUN pnpm --filter client build

# Stage 3 — Production (standalone Next.js)
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/client/.next/standalone ./
COPY --from=builder /app/apps/client/.next/static ./.next/static
COPY --from=builder /app/apps/client/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
