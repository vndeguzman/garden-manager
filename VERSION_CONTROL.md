# Version control

Garden Manager uses Git for source-code history and semantic version tags for
releases. Git tracks the application source; it does not replace PostgreSQL
backups or future in-app garden-plan revisions.

## Repository model

- `main`: locally deployable, validated code.
- `feature/<topic>`: new functionality.
- `fix/<topic>`: corrections.
- `chore/<topic>`: tooling, documentation, or maintenance.
- Release tags: `vMAJOR.MINOR.PATCH`, with optional prerelease suffixes such as
  `v2.0.0-alpha.1`.

The initial working application is tagged `v1.0.0`.

## Everyday commands

Inspect the current repository:

```bash
git status
git log --oneline --decorate --graph --all
git diff
```

Create a feature branch:

```bash
git switch -c feature/zoomable-map
```

Checkpoint a completed, validated change:

```bash
npm run typecheck
npm test
npm run lint
npm run build
git diff --check
git add --all
git commit
```

Return to the deployable branch:

```bash
git switch main
```

## Inspect and restore history

Show a commit without changing the working tree:

```bash
git show <commit>
```

Compare two versions:

```bash
git diff <older-commit>..<newer-commit>
```

Restore one file from an earlier commit:

```bash
git restore --source=<commit> -- path/to/file
```

Create a recovery branch at an earlier commit:

```bash
git switch -c recovery/<topic> <commit>
```

Prefer a recovery branch or `git revert` over rewriting history.

## Release procedure

1. Confirm the working tree is clean.
2. Run all checks listed in `AGENTS.md`.
3. Update `CHANGELOG.md` and the root `package.json` version.
4. Commit the release.
5. Create an annotated tag:

```bash
git tag -a v2.0.0 -m "Garden Manager v2.0.0"
```

6. Build and deploy from the tagged commit.
7. Back up PostgreSQL before applying new migrations.

Never modify a migration that has shipped in a release. Create a corrective
migration instead.

## Portable backup

A Git bundle preserves branches, tags, and commit history in one file:

```bash
git bundle create garden-manager.bundle --all
git bundle verify garden-manager.bundle
```

Clone from the backup:

```bash
git clone garden-manager.bundle garden-manager-restored
```

Keep the bundle outside the repository and alongside a separate PostgreSQL
backup. Source history does not contain user-entered garden data.

## AI-assisted workflow

An AI coding agent may:

- inspect commits, branches, tags, diffs, and file history;
- create a proposed branch and make scoped code changes;
- run checks and summarize failures;
- propose commit messages, changelog entries, and release versions;
- create a local commit or tag after the user approves the exact change.

An agent must request explicit approval before:

- pushing to a remote or opening/merging a pull request;
- deleting a branch or tag;
- force-pushing, resetting, or rebasing shared history;
- discarding local changes;
- running destructive database operations.

Useful requests include:

- “Show what changed since `v1.0.0`.”
- “Create `feature/zoomable-map` and implement the approved map changes.”
- “Restore only `WorkspaceMap.tsx` from commit `<hash>`.”
- “Run the release checks and prepare `v2.0.0-alpha.1`; do not tag yet.”
