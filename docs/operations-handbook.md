# Operations Handbook

This handbook is the primary operations entry point for QuantPilot. Use it as the top-level guide for startup checks, runtime observation, maintenance posture, recovery sequencing, and the supporting documents you should open next.

For environment-specific deployment steps, use [deployment.md](./deployment.md). For migration and repair planning, use [control-plane-migrations.md](./control-plane-migrations.md).

## Scope

This handbook covers:

- Startup and readiness checks
- Routine operational observation
- Maintenance decision points
- Recovery and rollback entry guidance
- The core commands and documents operators should use first

This handbook does not replace:

- detailed deployment configuration in [deployment.md](./deployment.md)
- migration and repair sequencing in [control-plane-migrations.md](./control-plane-migrations.md)

## Core Entry Points

Start with these surfaces:

- Frontend operations workbench
- Frontend persistence and migration panels in settings
- `GET /api/operations/workbench`
- `GET /api/operations/maintenance`
- `npm run control-plane:maintenance -- check`

Use the frontend when you need an operator-oriented summary. Use the CLI and API when you need a maintenance-grade view or a controlled write-side action.

## Startup Checklist

Before starting or restarting a working environment:

1. Validate the env contract
2. Confirm the target control-plane adapter and namespace
3. Confirm gateway, worker, and frontend processes are aligned with the intended environment
4. Verify the latest persistence posture is readable

Recommended commands:

```bash
npm install
npm run check:runtime-env -- --env-file .env
npm run verify
```

## Routine Operational Flow

### 1. Observe

Start by checking:

- frontend operations workbench
- monitoring posture
- persistence posture
- workflow backlog
- incident and notification pressure

Key questions:

- Is the system readable and stable?
- Is there retry backlog pressure?
- Are incidents or warnings pointing to a single subsystem?
- Is persistence posture healthy, attention, or degraded?

### 2. Triage

Once a signal is visible, identify which class of issue it is:

- monitoring-only signal
- workflow backlog signal
- persistence/migration signal
- incident-response signal
- connectivity or provider signal

Do not treat all warnings as maintenance actions. Many signals should stay in observation or incident triage instead of immediately moving into backup, restore, or repair.

### 3. Act

Only run write-side maintenance when the posture supports it.

Typical action classes:

- `backup`
- `restore --dry-run`
- `restore`
- `migrate`
- `repair-workflows`

Do one class of write action at a time and re-check posture after each one.

## Maintenance Commands

Common maintenance commands:

```bash
npm run control-plane:maintenance -- check
npm run control-plane:maintenance -- migrate
npm run control-plane:maintenance -- backup --output ./backups/control-plane.json
npm run control-plane:maintenance -- restore --input ./backups/control-plane.json --dry-run
npm run control-plane:maintenance -- restore --input ./backups/control-plane.json
npm run control-plane:maintenance -- repair-workflows --limit 20
```

If you are validating the embedded db path explicitly:

```bash
npm run control-plane:maintenance -- check --adapter db
```

## Decision Guidance

### Healthy Posture

Use this path when:

- persistence is readable
- no migration work is pending
- integrity is acceptable

Recommended move:

- continue observing
- keep routine backups current
- avoid unnecessary write-side maintenance

### Attention Posture

Use this path when:

- pending migrations exist
- integrity is still readable
- backlog or maintenance posture requires operator review

Recommended move:

1. take a backup
2. validate restore dry run
3. run migrate if appropriate
4. re-check posture
5. run workflow repair only if backlog remains and the store is still trustworthy

### Degraded Posture

Use this path when:

- persistence metadata is inconsistent
- integrity posture is no longer trustworthy
- migration status cannot be interpreted cleanly

Recommended move:

1. stop planned write-side changes
2. capture a backup if the store is still readable
3. inspect integrity and maintenance posture
4. choose between restore or deeper investigation
5. do not jump directly to repair-workflows

## Recovery Entry Guidance

Use this order when recovery may be needed:

1. `check`
2. `backup`
3. `restore --dry-run`
4. `restore` if needed
5. `check` again
6. `repair-workflows` only after persistence posture is readable
7. `npm run verify`

If the issue is specifically about planned adapter cutover or migration sequencing, continue in [control-plane-migrations.md](./control-plane-migrations.md).

## Related API Routes

Useful operational API routes:

```http
GET /api/operations/workbench
GET /api/operations/maintenance
POST /api/operations/maintenance/backup
POST /api/operations/maintenance/restore
POST /api/operations/maintenance/repair/workflows
GET /api/monitoring/status
GET /api/monitoring/snapshots
GET /api/monitoring/alerts
```

## Related Documents

- [README.md](../README.md)
- [README.zh-CN.md](../README.zh-CN.md)
- [deployment.md](./deployment.md)
- [control-plane-migrations.md](./control-plane-migrations.md)
- [architecture/project-structure.md](./architecture/project-structure.md)
