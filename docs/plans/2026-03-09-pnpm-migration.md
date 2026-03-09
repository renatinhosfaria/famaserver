# PNPM Monorepo Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `pnpm` the single package manager for the FamaServer monorepo and leave local commands, Docker builds, and future CI usage aligned with one workspace contract.

**Architecture:** The migration keeps the current `apps/*` and `packages/*` monorepo structure but moves all installation and orchestration responsibility to the repository root. Workspace scripts are normalized to the Turbo task names, Docker builds are rewritten to consume the root workspace with `pnpm`, and stale npm artifacts are removed.

**Tech Stack:** pnpm 10, Turborepo 2, Next.js 16, NestJS 11, Docker multi-stage builds

---

### Task 1: Establish the root workspace contract

**Files:**
- Modify: `package.json`
- Create: `.gitignore`

**Step 1: Capture the current failure from the root**

Run: `pnpm type-check`
Expected: FAIL because the root package does not expose the monorepo script yet.

**Step 2: Add the root scripts**

Update `package.json` so the root exposes:

```json
{
  "scripts": {
    "dev": "turbo dev",
    "dev:server": "pnpm --filter server dev",
    "dev:client": "pnpm --filter client dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "format": "pnpm -r format"
  }
}
```

**Step 3: Add the root ignore rules**

Create `.gitignore` with at least:

```gitignore
node_modules/
.turbo/
dist/
.next/
.env
.env.*
```

**Step 4: Verify the root scripts are now wired**

Run: `pnpm run`
Expected: PASS with the new root scripts listed.

**Step 5: Commit**

```bash
git add package.json .gitignore
git commit -m "chore: add root pnpm workspace scripts"
```

### Task 2: Align workspace script names with Turbo

**Files:**
- Modify: `apps/server/package.json`
- Modify: `apps/client/package.json`
- Modify: `packages/types/package.json`
- Modify: `packages/utils/package.json`

**Step 1: Capture the current mismatch**

Run: `pnpm type-check`
Expected: FAIL or skip tasks because the apps expose `typecheck` while Turbo expects `type-check`.

**Step 2: Rename the scripts**

Update the workspace manifests so every participating package uses:

```json
{
  "scripts": {
    "type-check": "tsc --noEmit"
  }
}
```

Keep the existing `build`, `dev`, `lint`, and `format` scripts intact unless a package is missing one needed by the root workflow.

**Step 3: Verify the pipeline contract**

Run: `pnpm type-check`
Expected: PASS for task discovery. If code-level errors appear, they should be real TypeScript issues rather than missing scripts.

**Step 4: Commit**

```bash
git add apps/server/package.json apps/client/package.json packages/types/package.json packages/utils/package.json
git commit -m "chore: align workspace type-check scripts"
```

### Task 3: Migrate the server image to root-level pnpm builds

**Files:**
- Modify: `apps/server/Dockerfile`

**Step 1: Capture the current Docker dependency model**

Inspect `apps/server/Dockerfile` and confirm it still uses `npm ci` and `npm run build`.
Expected: PASS finding the old npm-based builder.

**Step 2: Rewrite the Dockerfile for workspace-aware pnpm**

Replace the current flow with a multi-stage build that:
- copies `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and the root `package.json`
- copies `apps/server/package.json`
- copies shared package manifests such as `packages/types/package.json`, `packages/utils/package.json`, and `packages/tsconfig/package.json` when needed
- runs `corepack enable pnpm && pnpm install --frozen-lockfile`
- copies `apps/server` and any shared package sources required for the build
- runs `pnpm --filter server build`
- ships only runtime artifacts in the final image

The runtime command should remain compatible with the server output path.

**Step 3: Verify the server image builds**

Run: `docker build -f apps/server/Dockerfile .`
Expected: PASS with the server image building from the root workspace.

**Step 4: Commit**

```bash
git add apps/server/Dockerfile
git commit -m "chore: migrate server docker build to pnpm"
```

### Task 4: Migrate the client image to root-level pnpm builds

**Files:**
- Modify: `apps/client/Dockerfile`

**Step 1: Capture the current Docker dependency model**

Inspect `apps/client/Dockerfile` and confirm it still uses `npm ci` and `npm run build`.
Expected: PASS finding the old npm-based builder.

**Step 2: Rewrite the Dockerfile for workspace-aware pnpm**

Replace the current flow with a multi-stage build that:
- copies the root workspace manifests first
- copies `apps/client/package.json`
- copies shared package manifests required by resolution
- runs `corepack enable pnpm && pnpm install --frozen-lockfile`
- copies `apps/client` and any shared package sources required for the build
- runs `pnpm --filter client build`
- preserves the Next standalone runtime output in the final image

Keep `output: "standalone"` in `apps/client/next.config.ts` unchanged unless the build proves it is incorrect.

**Step 3: Verify the client image builds**

Run: `docker build -f apps/client/Dockerfile .`
Expected: PASS with the client image building from the root workspace.

**Step 4: Commit**

```bash
git add apps/client/Dockerfile
git commit -m "chore: migrate client docker build to pnpm"
```

### Task 5: Remove stale npm artifacts and update docs

**Files:**
- Delete: `apps/server/package-lock.json`
- Delete: `apps/client/package-lock.json`
- Modify: `apps/server/README.md`
- Modify: `apps/client/README.md`

**Step 1: Capture the stale npm references**

Run: `rg -n --glob '!pnpm-lock.yaml' --glob '!**/package-lock.json' "npm ci|npm run|npm install|package-lock" .`
Expected: PASS with remaining references in Dockerfiles and READMEs before cleanup.

**Step 2: Delete the old lockfiles**

Remove:

```text
apps/server/package-lock.json
apps/client/package-lock.json
```

**Step 3: Update the documentation**

Rewrite the relevant README command examples so they describe the root workflow, for example:

```bash
pnpm install
pnpm dev:server
pnpm dev:client
pnpm build
pnpm type-check
```

Avoid documenting `npm` as an alternative path.

**Step 4: Verify npm references are gone**

Run: `rg -n --glob '!pnpm-lock.yaml' --glob '!**/package-lock.json' "npm ci|npm run|npm install|package-lock" .`
Expected: PASS with no remaining workflow references to npm in tracked project files.

**Step 5: Commit**

```bash
git add apps/server/README.md apps/client/README.md apps/server/package-lock.json apps/client/package-lock.json
git commit -m "docs: remove npm workflow references"
```

### Task 6: Run end-to-end verification from the root

**Files:**
- Modify: `package.json` only if verification exposes missing root scripts
- Modify: `turbo.json` only if verification exposes a task contract issue

**Step 1: Run the root install contract**

Run: `pnpm install --frozen-lockfile`
Expected: PASS with no lockfile drift.

**Step 2: Run the monorepo validation commands**

Run these commands one by one:

```bash
pnpm build
pnpm lint
pnpm type-check
```

Expected: PASS. Any failure here should be treated as a migration bug unless it reveals a pre-existing application error.

**Step 3: Run Docker verification**

Run these commands one by one:

```bash
docker build -f apps/server/Dockerfile .
docker build -f apps/client/Dockerfile .
```

Expected: PASS for both images.

**Step 4: Fix only verification regressions**

If any command fails due to the migration, patch the relevant config and rerun only the failing command until it passes.

**Step 5: Commit**

```bash
git add package.json turbo.json apps/server/Dockerfile apps/client/Dockerfile apps/server/package.json apps/client/package.json packages/types/package.json packages/utils/package.json .gitignore
git commit -m "chore: complete pnpm monorepo migration"
```
