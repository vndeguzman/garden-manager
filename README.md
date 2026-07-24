# Garden Manager

A local-first garden operations workspace built with React, Express, Prisma,
PostgreSQL, and Docker Compose. It combines a non-geographic 2D garden map with
task planning, growing-factor evidence, inventory traceability, harvest
economics, and automatic issue triage.

## Core workspace

- **2D operations map** with points, lines, polygons, rectangles, and circles;
  linked plots, zones, plantings, individual plants, trees, assets, tools, and
  custom items; edit-mode drag positioning; optional background image.
- **Terrain overlay** from user-entered or measured elevation points, contour
  interpolation, and an ideal static hydraulic-head estimate. The estimate
  intentionally excludes pipe loss, fittings, emitter requirements, and
  changing tank level.
- **Plant tracking** at batch or individual level with lifecycle status, age,
  position, care requirements, scientific-name autocomplete, expected harvest
  window, expected yield range, and actual harvest records.
- **Work management** for direct or group-level tasks, per-target progress,
  recurrence, priorities, due dates, tools/materials, costs, and predefined
  drip-irrigation work.
- **Assets and tools** for faucets, hoses, drums, drip lines, valves, pumps,
  structures, environmental influences, instruments, storage, and tools.
- **Growing factors** for numeric readings and qualitative observations,
  including light/lux, wind, moisture, pH, EC, nutrients, chemical/biological
  presence, evidence quality, confidence, requirement profiles, and projected
  or confirmed deficiencies/excesses.
- **Input inventory** for fertilizers, amendments, growing media, seeds,
  propagation inputs, pesticides, biologicals, enzymes, hormones, and other
  consumables; material composition/profile, storage locations, lots, expiry,
  cost, append-only transactions, and application records.
- **Yield and economics** for expected and actual harvests, disposition,
  market/channel-specific dated prices, sales, and inventory/replacement value.
- **Automatic triage** for overdue work, low/expired stock, tool problems,
  passed harvest windows, and serious factor assessments.
- **Notifications** via Web Push, SMTP email, and configurable speaker webhooks.
  Speaker webhooks can target a local Home Assistant, Node-RED, or similar
  bridge.
- **Hosted media** links for images and video attached to any supported entity.
  Direct binary upload is not included yet.

All operational records expose create/update/delete APIs and UI editors.
Inventory transactions are the deliberate exception: they are append-only so
stock history remains auditable. Use an adjustment/return transaction to
correct a mistake.

## Run locally with Docker Desktop / Gordon

Prerequisites: Docker Desktop with Compose support.

From the extracted project folder, ask Gordon to:

> Run `docker compose up --build -d`, wait for all services to become healthy,
> then show `docker compose ps`.

Or run the same command in PowerShell/Terminal:

```bash
docker compose up --build -d
docker compose ps
```

The backend applies Prisma migrations automatically before it starts.

Seed the representative workspace once:

```bash
docker compose exec backend npx tsx prisma/seed.ts
```

Open:

- Application: <http://localhost:8080>
- API health: <http://localhost:4000/health>
- Seed login: `vic@example.com` / `password123`

The seed command is destructive to Garden Manager data. Do not rerun it after
entering real records unless you intend to reset the application.

### Stop, restart, and inspect

```bash
docker compose stop
docker compose start
docker compose logs -f backend
```

To rebuild after a code change:

```bash
docker compose up --build -d
```

If the backend repeatedly restarts with an OpenSSL or Prisma engine permission
error, confirm you are using the current `backend/Dockerfile`, then force a
clean image rebuild:

```bash
docker compose down
docker compose build --no-cache backend frontend
docker compose up -d
```

If a fresh installation reports Prisma `P3018` followed by `P3009`, the
database volume contains a failed migration record. After replacing the
project files with the corrected release, reset the still-unused database and
rebuild the backend image so the repaired migration is copied into it:

```bash
docker compose down -v
docker compose build --no-cache backend
docker compose up -d
docker compose logs -f backend
```

Do not use `down -v` on an installation containing records you need. Back it
up and resolve the failed migration explicitly instead.

To remove containers while retaining PostgreSQL data:

```bash
docker compose down
```

To destroy the local database volume as well:

```bash
docker compose down -v
```

The last command permanently removes local application data.

## Optional notifications

Copy environment variables into a root `.env` file before starting Compose.
See `backend/.env.example` for the complete list.

Generate Web Push keys:

```bash
npx web-push generate-vapid-keys
```

Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`. Web Push works
on `localhost`; non-local deployments require HTTPS. A user must click
**Enable push on this device** in the Alerts tab and accept the browser prompt.

Set the `SMTP_*` variables for email. For speaker broadcast, add a SPEAKER
endpoint in the UI whose address is a local webhook. The backend sends JSON
containing the alert message; optional service/entity/token fields are stored
in the endpoint configuration through the API.

## Development without full Compose

Prerequisites: Node.js 20+, npm, and a reachable PostgreSQL database.

```bash
npm install
cp backend/.env.example backend/.env
docker compose up -d db
npm run db:migrate
npm run db:seed
npm run dev
```

- Vite frontend: <http://localhost:5173>
- Express API: <http://localhost:4000>

## Database upgrades

The container runs:

```bash
npx prisma migrate deploy
```

on every backend start. Existing records remain intact because only unapplied
migrations run. Always back up the PostgreSQL volume before applying a new
release.

The current schema also exists as `backend/schema.sql` for inspection or
manual provisioning, but Docker Compose uses Prisma migrations as the source
of truth.

## Quality checks

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

Database-backed authentication integration tests require `DATABASE_URL` and
`JWT_SECRET`. Pure scheduler, task-template, mapping, terrain, and component
tests run without a database.

## Version control

The project is a Git repository. The current stable baseline is tagged
`v1.0.0`; create short-lived feature or fix branches for further work. See
[`VERSION_CONTROL.md`](VERSION_CONTROL.md) for commit, release, rollback,
portable backup, and AI-assisted workflows. AI coding agents should read
[`AGENTS.md`](AGENTS.md) before making changes.

## Project layout

```text
garden-manager/
├── shared/                 # shared DTOs, enums, and Zod validation
├── backend/
│   ├── prisma/             # schema, seed, and migrations
│   └── src/modules/        # APIs, triage, notifications, domain services
├── frontend/
│   ├── public/             # PWA manifest and push service worker
│   └── src/                # map-first React workspace
├── docker-compose.yml
└── ROADMAP.md
```

## Important limits

- Contours are inverse-distance interpolations of entered points, not a survey.
- Hydraulic pressure is an ideal elevation-head estimate, not a pipe-network
  simulation.
- Deficiency projections store evidence, assumptions, and confidence; they are
  not laboratory diagnoses.
- Market prices are tied to a named market/channel, unit, grade/form, source,
  and observation date. The app does not guess a universal price.
- External weather, taxonomy, market-price, direct-upload, and IoT providers
  remain adapter work; no vendor was silently chosen.
