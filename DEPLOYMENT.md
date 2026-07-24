# Local deployment and release operations

This guide covers the supported local deployment of Garden Manager on Windows
with Docker Desktop and PowerShell. It also defines how a validated Git release
is promoted, verified, backed up, and rolled back.

Garden Manager is currently a local Docker application. The default Compose
configuration is not hardened for direct internet exposure.

## Deployment model

The release path is:

```text
feature branch
    -> typecheck, tests, lint, build
    -> review and merge to main
    -> annotated release tag
    -> PostgreSQL backup
    -> Docker image build
    -> automatic Prisma migrations
    -> health checks and smoke test
```

The Compose stack contains:

| Service | Container role | Host address |
| --- | --- | --- |
| `db` | PostgreSQL 16 data store | `localhost:5432` |
| `backend` | Express API, automation worker, migrations | `http://localhost:4000` |
| `frontend` | Nginx-hosted React application and API proxy | `http://localhost:8080` |

The named Docker volume `garden_db_data` stores PostgreSQL data independently
of the containers. Rebuilding or removing containers does not remove this
volume unless `docker compose down -v` is used.

## Prerequisites

- Docker Desktop with Docker Compose.
- Git for Windows.
- PowerShell.
- A local clone of the Garden Manager repository.
- At least one known-good Git release tag.

Confirm the tools:

```powershell
docker version
docker compose version
git --version
```

## Inspect the selected release

Run all deployment commands from the repository root:

```powershell
cd C:\Users\VIC\garden-manager
git status
git branch --show-current
git describe --tags --always
```

Do not deploy with uncommitted source changes. For an exact release deployment,
check out its tag:

```powershell
git fetch origin --tags
git switch --detach v1.0.0
```

A detached checkout is appropriate for an exact deployment. Return to normal
development later with:

```powershell
git switch main
```

## Optional environment configuration

Docker Compose reads notification settings from a root `.env` file. Do not
commit this file.

Example:

```dotenv
AUTOMATION_INTERVAL_SECONDS=300

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:garden-manager@localhost

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Garden Manager <garden-manager@localhost>
```

The Compose file currently contains local-development PostgreSQL credentials
and a local JWT secret. Replace those defaults and restrict exposed ports
before allowing access from another network or the internet.

Validate the resolved Compose configuration without printing it into an issue
or log that other people can read:

```powershell
docker compose config --quiet
```

## Fresh installation

For a new computer or an installation with no existing Garden Manager data:

```powershell
git clone https://github.com/YOUR-USERNAME/garden-manager.git
cd garden-manager
git fetch --tags
git switch --detach v1.0.0

docker compose config --quiet
docker compose up --build -d
docker compose ps
```

The backend waits for PostgreSQL to become healthy, runs:

```text
prisma migrate deploy
```

and starts only after all committed migrations have applied successfully.

Seed representative data only on a fresh or disposable database:

```powershell
docker compose exec backend npx tsx prisma/seed.ts
```

The seed operation replaces Garden Manager records. Never rerun it after
entering data that must be retained.

## Back up PostgreSQL before an upgrade

Create a local backup directory:

```powershell
New-Item -ItemType Directory -Force .\backups | Out-Null
```

Create a compressed PostgreSQL archive inside the database container:

```powershell
docker compose exec -T db pg_dump `
  -U garden `
  -d garden_manager `
  -Fc `
  -f /tmp/garden-manager.dump
```

Verify that PostgreSQL can read the archive catalog:

```powershell
docker compose exec -T db pg_restore -l /tmp/garden-manager.dump
```

Copy the archive to Windows with a timestamp:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

docker compose cp `
  db:/tmp/garden-manager.dump `
  ".\backups\garden-manager-$stamp.dump"

Get-Item ".\backups\garden-manager-$stamp.dump"
```

Keep at least one recent backup outside the repository directory. Git preserves
source history, not user-entered PostgreSQL data or uploaded media.

## Upgrade an existing deployment

First complete the database backup. Then update the source to the reviewed
release:

```powershell
git switch main
git pull --ff-only origin main
git fetch origin --tags
git status
git log --oneline --decorate -n 5
```

For a tagged release, deploy the exact tag:

```powershell
git switch --detach v2.0.0-alpha.1
```

Build and replace the application containers:

```powershell
docker compose config --quiet
docker compose up --build -d
```

This command retains `garden_db_data`. The backend applies only unapplied
Prisma migrations before starting.

## Monitor and verify the deployment

Inspect container state:

```powershell
docker compose ps
```

Follow backend startup and migrations:

```powershell
docker compose logs -f backend
```

Press `Ctrl+C` to stop following logs. This does not stop the containers.

Check migration state:

```powershell
docker compose exec backend npx prisma migrate status
```

Check both HTTP services:

```powershell
curl.exe -f http://localhost:4000/health
curl.exe -I http://localhost:8080
```

Open the user interface:

```powershell
Start-Process http://localhost:8080
```

Run this smoke test:

1. Log in.
2. Open an existing garden.
3. Confirm plots, plants, tasks, inventory, observations, and alerts load.
4. Create and edit a temporary task.
5. Open the map and move a test entity.
6. Delete the temporary task.
7. Check recent backend logs for unexpected errors.

## Routine container operations

Stop containers without removing them:

```powershell
docker compose stop
```

Start existing containers:

```powershell
docker compose start
```

Remove and recreate containers while preserving PostgreSQL data:

```powershell
docker compose down
docker compose up --build -d
```

Never use the following command against an installation containing data that
must be retained:

```powershell
docker compose down -v
```

The `-v` option removes the named PostgreSQL volume.

## Code rollback

If the database remains compatible with the previous application version,
deploy the last known-good tag:

```powershell
git fetch origin --tags
git switch -c rollback/v1.0.0 v1.0.0
docker compose up --build -d
docker compose ps
```

Code rollback alone is not sufficient when a newer migration made incompatible
schema or data changes. Use the pre-deployment PostgreSQL backup in that case.

## Database restore

Database restoration replaces the current Garden Manager database. Confirm the
backup filename and stop the backend before running these commands:

```powershell
docker compose stop backend

docker compose cp `
  ".\backups\GARDEN-MANAGER-BACKUP.dump" `
  db:/tmp/garden-manager-restore.dump

docker compose exec -T db dropdb `
  -U garden `
  --if-exists `
  garden_manager

docker compose exec -T db createdb `
  -U garden `
  garden_manager

docker compose exec -T db pg_restore `
  -U garden `
  -d garden_manager `
  --no-owner `
  /tmp/garden-manager-restore.dump

docker compose start backend
docker compose logs --tail=100 backend
```

After restoration, run the HTTP checks and full smoke test again.

## Release procedure for new features

Create a short-lived branch from current `main`:

```powershell
git switch main
git pull --ff-only origin main
git switch -c feature/v2-map-foundation
git push -u origin feature/v2-map-foundation
```

Before proposing a merge:

```powershell
npm run typecheck
npm test
npm run lint
npm run build
git diff --check
git status
```

After review and merge, update `CHANGELOG.md` and the package version, then
create an annotated prerelease or stable tag:

```powershell
git tag -a v2.0.0-alpha.1 -m "Garden Manager v2.0.0-alpha.1"
git push origin v2.0.0-alpha.1
```

Deploy from the tag, not from an unreviewed feature-branch commit.

## Troubleshooting

### Backend repeatedly restarts

```powershell
docker compose logs --tail=200 backend
docker compose logs --tail=100 db
```

For a stale backend image or Prisma/OpenSSL engine problem:

```powershell
docker compose down
docker compose build --no-cache backend frontend
docker compose up -d
```

### Prisma `P3018` followed by `P3009`

The database contains a failed migration record. Do not repeatedly restart the
backend and do not edit an already-released migration.

For a new disposable installation only, after confirming no data must be kept:

```powershell
docker compose down -v
docker compose build --no-cache backend
docker compose up -d
docker compose logs -f backend
```

For an installation containing useful data, preserve the volume, keep the
backup, inspect the failed migration, and resolve it explicitly.

### Frontend is unhealthy

```powershell
docker compose logs --tail=100 frontend
curl.exe -I http://localhost:8080
```

Rebuild the frontend if its image is stale:

```powershell
docker compose build --no-cache frontend
docker compose up -d frontend
```

### Inspect resolved ports and volumes

```powershell
docker compose ps
docker compose config
docker volume ls
```

Do not publish `docker compose config` output when it contains real secrets.
