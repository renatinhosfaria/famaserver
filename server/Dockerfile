
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
# Prune dev dependencies for production
RUN npm prune --production

# Stage 2: Production Run
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Environment variables will be passed via docker-compose
EXPOSE 3001

CMD ["npm", "run", "start:prod"]
