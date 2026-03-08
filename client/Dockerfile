
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Next.js build requires env vars sometimes, but we can build generic if handling envs at runtime or build time properly.
# For simplicity, we assume standard build.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Production Run
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
# Hostname must be 0.0.0.0 for docker
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
