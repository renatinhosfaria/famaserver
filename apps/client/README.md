# FamaServer Client

The Next.js client is part of the FamaServer pnpm monorepo.

## Workspace commands

Run these commands from the repository root:

```bash
pnpm install
pnpm dev:client
pnpm --filter client build
pnpm --filter client type-check
pnpm --filter client lint
```

## Docker

Build the production image from the repository root:

```bash
docker build -f apps/client/Dockerfile .
```
