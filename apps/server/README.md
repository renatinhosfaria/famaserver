# FamaServer Server

The NestJS server is part of the FamaServer pnpm monorepo.

## Workspace commands

Run these commands from the repository root:

```bash
pnpm install
pnpm dev:server
pnpm --filter server build
pnpm --filter server type-check
pnpm --filter server test
pnpm --filter server test:e2e
```

## Docker

Build the production image from the repository root:

```bash
docker build -f apps/server/Dockerfile .
```
