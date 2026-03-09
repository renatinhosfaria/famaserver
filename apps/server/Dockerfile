# Stage 1 — Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/tsconfig/package.json ./packages/tsconfig/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Stage 2 — Build
FROM deps AS builder
COPY packages/tsconfig ./packages/tsconfig
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY apps/server ./apps/server
RUN pnpm --filter @famaserver/types build
RUN pnpm --filter @famaserver/utils build
RUN pnpm --filter server build

# Stage 3 — Production
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main.js"]
