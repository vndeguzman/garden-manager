# Garden Manager agent guide

Use this file as the compact starting context for AI-assisted development.

## Architecture

- npm workspace with `shared`, `backend`, and `frontend`.
- React/Vite frontend in `frontend/src`.
- Express/Prisma backend in `backend/src`.
- Shared Zod schemas and API types in `shared/src`.
- PostgreSQL schema in `backend/prisma/schema.prisma`.
- Docker Compose is the supported local deployment.

## Source-of-truth rules

- Edit source files, never generated `dist` files or `node_modules`.
- Keep API validation and shared DTOs synchronized.
- Treat committed Prisma migrations as immutable release history.
- Add a new migration for every database change; never silently edit an
  already-applied migration.
- Never commit `.env` files, credentials, VAPID private keys, tokens, uploads,
  database volumes, or user media.
- Inventory transactions are append-only by design.

## Required checks

Run before proposing a commit:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

Database integration tests require a disposable `DATABASE_URL` and
`JWT_SECRET`; tests that do not require them must still pass.

## Git workflow

- `main` is the deployable branch.
- Use short-lived branches named `feature/<topic>`, `fix/<topic>`, or
  `chore/<topic>`.
- Keep commits scoped and describe the behavior changed.
- Inspect `git status` and `git diff --check` before every commit.
- Use annotated release tags such as `v1.0.0` and `v2.0.0-alpha.1`.
- Require explicit user approval before pushing, merging, deleting branches or
  tags, force-pushing, resetting, or rewriting history.

Read `VERSION_CONTROL.md` for Git and AI-agent commands. Read `DEPLOYMENT.md`
before changing deployment, migration, backup, restore, or release behavior.
