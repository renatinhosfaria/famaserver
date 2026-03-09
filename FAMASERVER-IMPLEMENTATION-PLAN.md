# INSTRUÇÕES PARA CLAUDE CODE — FamaServer Monorepo + CI/CD

## CONTEXTO

Você está no repositório `famaserver` que foi reestruturado parcialmente. A estrutura atual é:

```
famaserver/
├── apps/
│   ├── server/    ← NestJS backend (já existente, movido de /server)
│   └── client/    ← Next.js frontend (já existente, movido de /client)
├── packages/
│   ├── tsconfig/  ← JÁ CRIADO (base.json, nestjs.json, nextjs.json, package.json)
│   ├── eslint-config/ ← CRIAR
│   ├── types/src/     ← CRIAR
│   └── utils/src/     ← CRIAR
├── package.json           ← JÁ EXISTE (raiz com turbo como devDep)
├── pnpm-workspace.yaml    ← JÁ EXISTE
├── turbo.json             ← JÁ EXISTE
└── pnpm-lock.yaml         ← JÁ EXISTE
```

## OBJETIVO

Transformar o FamaServer num monorepo profissional com Turborepo + pnpm workspaces, CI/CD via GitHub Actions + GHCR, e deploy via comando local SSH.

## REGRAS

1. NÃO alterar a lógica de negócio do server nem do client
2. NÃO alterar ou remover funcionalidades existentes
3. Manter compatibilidade com o docker-compose atual da VPS
4. Usar pnpm (não npm nem yarn)
5. Node 22, TypeScript 5.5+
6. O projeto server usa NestJS com Drizzle ORM
7. O projeto client usa Next.js com Tailwind
8. O repo remoto está em https://github.com/renatinhosfaria/famaserver.git (branch master)

## ETAPAS DE IMPLEMENTAÇÃO

Execute todas as etapas na ordem. Após cada etapa, faça um commit.

---

### ETAPA 1 — Completar packages compartilhados

**1.1 Criar @famaserver/eslint-config**

Arquivo `packages/eslint-config/package.json`:
```json
{
  "name": "@famaserver/eslint-config",
  "version": "0.0.0",
  "private": true,
  "dependencies": {
    "eslint": "^9.0.0",
    "typescript-eslint": "^8.0.0"
  }
}
```

Arquivo `packages/eslint-config/base.js`:
```js
import tseslint from 'typescript-eslint';

export default [
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: ['dist/**', '.next/**', 'node_modules/**'],
  },
];
```

**1.2 Criar @famaserver/types**

Arquivo `packages/types/package.json`:
```json
{
  "name": "@famaserver/types",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@famaserver/tsconfig": "workspace:*"
  }
}
```

Arquivo `packages/types/tsconfig.json`:
```json
{
  "extends": "@famaserver/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

Arquivo `packages/types/src/index.ts`:
Extrair as interfaces/types compartilhados entre server e client. No mínimo criar:
- `User` (baseado no schema do server em `apps/server/src/database/schema.ts`)
- `FileItem` (baseado no schema de files)
- `ShareLink` (baseado no schema de shares)
- `ApiResponse<T>` (tipo genérico de resposta da API)

Analise os arquivos `apps/server/src/database/schema.ts`, `apps/client/types/file.ts` e outros types existentes para extrair os tipos corretos. Não invente — use os tipos reais do projeto.

**1.3 Criar @famaserver/utils**

Arquivo `packages/utils/package.json`:
```json
{
  "name": "@famaserver/utils",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@famaserver/tsconfig": "workspace:*"
  }
}
```

Arquivo `packages/utils/tsconfig.json`:
```json
{
  "extends": "@famaserver/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

Arquivo `packages/utils/src/index.ts`:
Extrair funções utilitárias compartilhadas entre server e client. Analise `apps/client/lib/format.ts`, `apps/client/lib/utils.ts` e utilitários do server. No mínimo:
- `formatFileSize(bytes: number): string`
- `formatDate(date: Date | string): string`

Use as implementações reais do projeto, não invente.

**Commit:** `chore: create shared packages (types, utils, eslint-config)`

---

### ETAPA 2 — Configurar apps para usar packages compartilhados

**2.1 Atualizar apps/server/package.json**

Adicionar dependências dos packages compartilhados:
```json
"dependencies": {
  "@famaserver/types": "workspace:*",
  "@famaserver/utils": "workspace:*"
},
"devDependencies": {
  "@famaserver/tsconfig": "workspace:*",
  "@famaserver/eslint-config": "workspace:*"
}
```

**2.2 Atualizar apps/server/tsconfig.json**

Fazer extend do tsconfig compartilhado:
```json
{
  "extends": "@famaserver/tsconfig/nestjs.json",
  ...resto das configs específicas do server
}
```

IMPORTANTE: manter as configs específicas do NestJS que já existem (paths, decorators, etc). Só mudar o extends.

**2.3 Atualizar apps/client/package.json**

Adicionar dependências dos packages compartilhados:
```json
"dependencies": {
  "@famaserver/types": "workspace:*",
  "@famaserver/utils": "workspace:*"
},
"devDependencies": {
  "@famaserver/tsconfig": "workspace:*",
  "@famaserver/eslint-config": "workspace:*"
}
```

**2.4 Atualizar apps/client/tsconfig.json**

Fazer extend do tsconfig compartilhado:
```json
{
  "extends": "@famaserver/tsconfig/nextjs.json",
  ...resto das configs específicas do Next.js
}
```

IMPORTANTE: manter as configs específicas do Next.js que já existem (paths, plugins, etc). Só mudar o extends.

**2.5 Atualizar package.json raiz**

```json
{
  "name": "famaserver",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@10.27.0",
  "scripts": {
    "dev": "turbo dev",
    "dev:server": "turbo dev --filter=server",
    "dev:client": "turbo dev --filter=client",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "format": "prettier --write .",
    "deploy": "ssh root@207.244.236.154 \"cd /var/www/FamaServer && docker compose pull && docker compose up -d\"",
    "deploy:status": "ssh root@207.244.236.154 \"cd /var/www/FamaServer && docker compose ps\"",
    "deploy:logs": "ssh root@207.244.236.154 \"cd /var/www/FamaServer && docker compose logs --tail=50\""
  },
  "devDependencies": {
    "turbo": "^2.8.14",
    "prettier": "^3.3.0"
  }
}
```

**2.6 Rodar pnpm install para linkar tudo**

```bash
pnpm install
```

**2.7 Verificar que o build funciona**

```bash
pnpm build
```

Se der erros de tipo, corrigir. O objetivo é que `pnpm build` passe sem erros.

**Commit:** `chore: configure apps to use shared packages`

---

### ETAPA 3 — Dockerfiles multi-stage

**3.1 Criar apps/server/Dockerfile**

Substituir o Dockerfile existente por multi-stage build:

```dockerfile
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
```

IMPORTANTE: verificar a porta correta do server analisando `apps/server/src/main.ts`. Ajustar EXPOSE e a porta se necessário.

**3.2 Criar apps/client/Dockerfile**

Substituir o Dockerfile existente por multi-stage build:

```dockerfile
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
```

IMPORTANTE: verificar se o Next.js está configurado com `output: 'standalone'` em `next.config.ts`. Se não estiver, adicionar.

**3.3 Criar .dockerignore na raiz**

```
node_modules
.next
dist
.git
*.log
.env
.env.*
```

**Commit:** `chore: add multi-stage Dockerfiles`

---

### ETAPA 4 — GitHub Actions (CI/CD)

**4.1 Criar .github/workflows/build.yml**

```yaml
name: Build & Push

on:
  push:
    branches: [master]

env:
  REGISTRY: ghcr.io
  SERVER_IMAGE: ghcr.io/renatinhosfaria/famaserver/server
  CLIENT_IMAGE: ghcr.io/renatinhosfaria/famaserver/client

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm type-check

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          context: .
          file: apps/server/Dockerfile
          push: true
          tags: |
            ${{ env.SERVER_IMAGE }}:latest
            ${{ env.SERVER_IMAGE }}:sha-${{ github.sha }}

      - uses: docker/build-push-action@v6
        with:
          context: .
          file: apps/client/Dockerfile
          push: true
          tags: |
            ${{ env.CLIENT_IMAGE }}:latest
            ${{ env.CLIENT_IMAGE }}:sha-${{ github.sha }}
```

NOTA: branch é `master` (não `main`) porque o repo famaserver usa master.

**Commit:** `ci: add GitHub Actions build pipeline`

---

### ETAPA 5 — Docker Compose de produção + configs

**5.1 Criar docker-compose.yml na raiz**

```yaml
services:
  server:
    image: ghcr.io/renatinhosfaria/famaserver/server:latest
    restart: unless-stopped
    env_file: .env
    depends_on: [postgres, redis, minio]
    networks: [app-network]

  client:
    image: ghcr.io/renatinhosfaria/famaserver/client:latest
    restart: unless-stopped
    env_file: .env
    networks: [app-network]

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on: [server, client]
    networks: [app-network]

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    env_file: .env
    networks: [app-network]

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks: [app-network]

  minio:
    image: minio/minio:latest
    restart: unless-stopped
    volumes:
      - minio_data:/data
    env_file: .env
    command: server /data --console-address ":9001"
    networks: [app-network]

volumes:
  postgres_data:
  redis_data:
  minio_data:

networks:
  app-network:
```

**5.2 Criar .env.example na raiz**

Analisar as variáveis de ambiente usadas em `apps/server/.env` (se existir) e `apps/server/src/app.module.ts` e criar um template com todas as variáveis necessárias (sem valores reais):

```env
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/famaserver
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=famaserver

# Redis
REDIS_URL=redis://redis:6379

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=famaserver

# Auth
JWT_SECRET=change-me

# App
PORT=3001
NODE_ENV=production
```

Ajustar baseado nas variáveis reais encontradas no projeto.

**5.3 Criar .prettierrc na raiz**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

**5.4 Atualizar .gitignore raiz**

Criar/atualizar `.gitignore` na raiz:
```
node_modules
dist
.next
.turbo
.env
.env.*
!.env.example
*.log
```

**Commit:** `chore: add docker-compose, env template, and configs`

---

### ETAPA 6 — Verificação final

1. Rodar `pnpm install` — deve completar sem erros
2. Rodar `pnpm build` — deve buildar types, utils, server e client sem erros
3. Rodar `pnpm type-check` — deve passar
4. Verificar estrutura final com `tree` ou listagem de diretórios
5. Fazer commit e push de tudo para o GitHub:

```bash
git add -A
git commit -m "feat: restructure as Turborepo monorepo with CI/CD"
git push origin master
```

---

## CHECKLIST FINAL

Após completar todas as etapas, verificar:

- [ ] `pnpm install` funciona
- [ ] `pnpm build` funciona (types → utils → server + client)
- [ ] `pnpm type-check` passa
- [ ] `pnpm dev:server` inicia o NestJS
- [ ] `pnpm dev:client` inicia o Next.js
- [ ] Dockerfile do server builda (`docker build -f apps/server/Dockerfile .`)
- [ ] Dockerfile do client builda (`docker build -f apps/client/Dockerfile .`)
- [ ] `.github/workflows/build.yml` existe e está correto
- [ ] `docker-compose.yml` usa imagens GHCR
- [ ] `.env.example` documenta todas as variáveis
- [ ] `.gitignore` protege arquivos sensíveis
- [ ] Tudo commitado e pushado no GitHub
