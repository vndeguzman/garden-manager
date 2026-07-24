## Summary

<!-- Describe the behavior changed and why. Keep the pull request scoped. -->

## Validation

- [ ] `npm run check:repository`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `git diff --check`

## Database and recovery

- [ ] This change does not alter the database schema.
- [ ] Or: a new Prisma migration is included, existing migration history is unchanged, and rollback/forward-fix behavior is documented.
- [ ] A PostgreSQL backup is required before deployment, or the reason it is unnecessary is documented.

## Security and data

- [ ] No `.env` files, credentials, private keys, tokens, uploads, database volumes, backups, or user media are committed.
- [ ] Authorization and validation changes are enforced by the backend.
- [ ] Inventory history remains append-only.

## Evidence

- [ ] Tests were added or updated where behavior changed.
- [ ] UI changes include desktop/mobile screenshots or a note explaining why screenshots are unnecessary.
- [ ] Operational or deployment changes update the relevant documentation.

## Reviewer notes

<!-- Call out migrations, compatibility risks, follow-up work, and manual verification. -->
