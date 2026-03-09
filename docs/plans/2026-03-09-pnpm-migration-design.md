# PNPM Migration Design

**Date:** 2026-03-09
**Status:** Approved
**Scope:** Complete package manager migration for the existing FamaServer monorepo

## Context

The repository already declares `pnpm` at the root and uses Turborepo workspaces, but it still behaves like a hybrid npm/pnpm codebase.

Current inconsistencies:
- The root workspace uses `pnpm-lock.yaml`, but `apps/server` and `apps/client` still carry `package-lock.json`.
- The root `package.json` does not expose the monorepo commands needed for day-to-day use.
- `apps/server/package.json` and `apps/client/package.json` use `typecheck`, while `turbo.json` expects `type-check`.
- `apps/server/Dockerfile` and `apps/client/Dockerfile` still install and build with `npm`.
- The repository root has no `.gitignore`, so `node_modules` and future Turbo artifacts are not ignored.
- Local docs still mention `npm` commands, which conflicts with the intended workflow.

## Goal

Make `pnpm` the only supported package manager in the repository and leave the monorepo ready for consistent local development, Docker builds, and future CI/CD automation.

## Non-Goals

- Renaming the `server` and `client` packages.
- Introducing new deployment automation in this change.
- Refactoring application code unrelated to package management, Docker, or workspace tooling.

## Decisions

### 1. Root `pnpm` becomes the single source of truth

The root `package.json` will become the operational entrypoint for the monorepo. It should expose scripts for:
- `dev`
- `dev:server`
- `dev:client`
- `build`
- `lint`
- `type-check`
- `format`

These commands should delegate through `turbo` or `pnpm --filter`, so installation and orchestration happen from the workspace root.

### 2. Workspace script names must match the Turbo pipeline

All workspaces participating in the pipeline should use `type-check`, not `typecheck`. This aligns `apps/server`, `apps/client`, `packages/types`, and `packages/utils` with the existing `turbo.json` task contract.

### 3. Docker builds must start from the monorepo root

The server and client images should build from the root workspace using `corepack enable pnpm` and the single `pnpm-lock.yaml`.

Dockerfile expectations:
- Copy root workspace manifests first for deterministic dependency caching.
- Copy the app package manifest plus any shared package manifests needed for resolution.
- Run `pnpm install --frozen-lockfile`.
- Copy app and shared source files.
- Build with `pnpm --filter`.
- Ship only the runtime artifacts needed by each app.

This keeps Docker aligned with local installs and future CI runners.

### 4. Lockfile hygiene is part of the migration

The migration should delete:
- `apps/server/package-lock.json`
- `apps/client/package-lock.json`

The only committed lockfile should be `pnpm-lock.yaml`.

### 5. Repository hygiene must support the new workflow

Add a root `.gitignore` that covers at least:
- `node_modules`
- `.turbo`
- build outputs such as `dist` and `.next`
- environment files that should not be committed

This prevents the root workspace from leaking generated artifacts into git.

### 6. Documentation must describe the real workflow

At minimum, the migration should update the local documentation that still tells contributors to use `npm`, especially:
- `apps/server/README.md`
- `apps/client/README.md`

The docs should describe installation and commands from the workspace root, with `pnpm` as the only supported package manager.

## Affected Files

Expected changes are concentrated in:
- `package.json`
- `.gitignore`
- `turbo.json` if task names need adjustment
- `apps/server/package.json`
- `apps/client/package.json`
- `apps/server/Dockerfile`
- `apps/client/Dockerfile`
- `apps/server/README.md`
- `apps/client/README.md`
- `apps/server/package-lock.json` (delete)
- `apps/client/package-lock.json` (delete)

## Risks and Mitigations

- Docker builds may fail if workspace manifests are copied incorrectly.
  - Mitigation: verify both images build from the monorepo root after the migration.
- Changing script names may break local habits or future CI commands.
  - Mitigation: keep the script contract small and aligned with `turbo.json`.
- Shared package resolution may differ from the current app-local installs.
  - Mitigation: verify `pnpm build` and filtered Docker builds before declaring success.
- Root artifact leakage may continue if `.gitignore` remains incomplete.
  - Mitigation: add the root `.gitignore` during the same migration.

## Acceptance Criteria

The migration is complete when all of the following are true:
- `pnpm install` from the repository root works as the only supported install flow.
- `pnpm build`, `pnpm lint`, and `pnpm type-check` run from the root with the workspace contract.
- `apps/server` and `apps/client` no longer contain `package-lock.json`.
- Both Dockerfiles install and build with `pnpm` from the monorepo root.
- Local documentation no longer instructs contributors to use `npm`.
- The repository root ignores `node_modules` and Turbo/build artifacts.
- The repository is ready for a future CI pipeline based on `pnpm install --frozen-lockfile`.
