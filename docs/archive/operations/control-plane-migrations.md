# Control-Plane Migration And Repair Runbook

This runbook explains how to plan control-plane storage migrations, when to switch adapters, how to protect backups before changes, and how to recover safely if migration or restore work does not go as expected.

This document is intentionally operational. It is not a design note for future storage work. Use it when preparing a real environment change or when validating maintenance posture before a release.

## Goals

- keep the current control-plane data readable and recoverable
- make adapter and migration steps explicit before execution
- require backup and dry-run validation before write-side maintenance
- separate migration, restore, and workflow repair into predictable phases

## Current Storage Model

QuantPilot currently supports two control-plane adapter modes:

- `file`
  - default runtime path
  - filesystem-backed JSON collections and objects
- `db`
  - embedded database foundation with schema manifest and migration contracts

The current system supports switching the adapter contract and running migration planning through the same maintenance surface, but it should still be treated as an operator-reviewed change, not as an automatic runtime behavior.

## When To Use This Runbook

Use this document when any of the following are true:

- you are changing `QUANTPILOT_CONTROL_PLANE_ADAPTER`
- `GET /api/operations/maintenance` or the frontend persistence posture shows pending migrations
- you need to move from routine observation into backup, migrate, restore, or repair actions
- you need to recover a control-plane namespace after an interrupted maintenance operation

Do not use this runbook for routine monitoring when persistence posture is healthy and no migration work is pending.

## Safety Rules

1. Never run `migrate` before a successful backup.
2. Never run `restore` without a prior `restore --dry-run` using the same backup payload.
3. Never combine migration and workflow repair into one blind step.
4. If migration posture is degraded, inspect integrity first instead of guessing the next command.
5. Keep adapter changes and restore actions inside a controlled maintenance window.

## Pre-Change Planning

Before changing anything, capture the current posture:

```bash
npm run check:runtime-env -- --env-file .env
npm run control-plane:maintenance -- check --adapter file
npm run control-plane:maintenance -- check --adapter db
```

If you only run one adapter in the target environment, the second `check` is optional. It is still useful when validating a future cutover plan.

Record the following:

- target adapter: `file` or `db`
- active namespace
- current schema version
- target schema version
- pending migration count
- retry-scheduled workflow backlog
- whether the current posture is `healthy`, `attention`, or `degraded`

## Recommended Decision Flow

### Healthy

Use this path when:

- migration plan is up to date
- integrity is healthy or acceptable
- no restore is planned

Recommended action:

- no migration required
- keep routine backups in place
- continue monitoring

### Attention

Use this path when:

- pending migrations exist
- integrity is readable
- adapter metadata and manifest are present

Recommended action:

1. run backup
2. validate restore dry run
3. run migrate
4. re-check posture
5. run workflow repair only if retry backlog still exists

### Degraded

Use this path when:

- manifest is missing or inconsistent
- migration plan cannot be interpreted
- integrity status is no longer trustworthy

Recommended action:

1. stop planned migration changes
2. export a backup if the store is still readable
3. inspect integrity and adapter metadata
4. decide whether the safer path is restore or manual investigation
5. only resume migrate after posture becomes readable again

## Standard Maintenance Sequence

This is the preferred order for a planned migration or adapter cutover:

```bash
npm run control-plane:maintenance -- check --adapter db
npm run control-plane:maintenance -- backup --adapter db --output ./backups/control-plane.json
npm run control-plane:maintenance -- restore --adapter db --input ./backups/control-plane.json --dry-run
npm run control-plane:maintenance -- migrate --adapter db
npm run control-plane:maintenance -- check --adapter db
npm run control-plane:maintenance -- repair-workflows --adapter db --limit 20
```

Notes:

- `repair-workflows` is not part of every migration. Run it only when retry-scheduled workflows remain after migration or when maintenance posture explicitly calls it out.
- if the target environment remains `file`-backed, keep `--adapter file` throughout the same sequence.

## Adapter Cutover Guidance

### File To DB

Use this path when validating or adopting the embedded db foundation:

1. confirm the target namespace and env file
2. run `check --adapter db`
3. export a backup before enabling the new adapter
4. run `restore --dry-run` against the target adapter payload if needed
5. run `migrate --adapter db`
6. switch `QUANTPILOT_CONTROL_PLANE_ADAPTER=db`
7. re-run `check:runtime-env` and `verify`

Recommended posture:

- do this during a maintenance window
- keep the previous file-backed namespace untouched until the new path is verified

### DB To File

Use this path only for rollback or controlled fallback:

1. export a fresh backup from the db-backed namespace
2. validate `restore --dry-run` for the file-backed target
3. switch `QUANTPILOT_CONTROL_PLANE_ADAPTER=file`
4. restore the desired snapshot into the fallback namespace if required
5. re-run `check` and `verify`

Recommended posture:

- treat this as a rollback path, not a normal operating mode transition

## Restore And Rollback Posture

### When Restore Is Appropriate

- migration changes were interrupted
- adapter switch left the target namespace unreadable
- integrity check reports unacceptable issues after maintenance

### When Restore Is Not The First Move

- posture is still readable and only workflow retry backlog remains
- migrations are pending but no destructive failure occurred
- a monitoring warning exists without persistence corruption

### Rollback Sequence

```bash
npm run control-plane:maintenance -- backup --output ./backups/pre-rollback.json
npm run control-plane:maintenance -- restore --input ./backups/known-good.json --dry-run
npm run control-plane:maintenance -- restore --input ./backups/known-good.json
npm run control-plane:maintenance -- check
```

After rollback:

- validate persistence posture again
- confirm recent workflows, notifications, and risk jobs are readable
- only then consider `repair-workflows`

## Workflow Repair Guidance

`repair-workflows` is meant for retry backlog recovery, not as a universal repair tool.

Use it when:

- retry-scheduled workflows are due and stuck
- maintenance posture remains readable after migrate or restore
- you need to release backlog pressure after infrastructure recovery

Do not use it when:

- persistence metadata is degraded
- restore validation has not been completed
- the operator does not yet know whether the underlying store is trustworthy

## API Equivalents

The same posture can be inspected through API routes:

```http
GET /api/operations/maintenance
POST /api/operations/maintenance/backup
POST /api/operations/maintenance/restore
POST /api/operations/maintenance/repair/workflows
```

Recommended API flow:

1. inspect `GET /api/operations/maintenance`
2. create backup
3. validate restore dry run if a restore path is being considered
4. run repair only after persistence posture is readable again

## Operational Checklist

Before maintenance:

- confirm env file and namespace
- confirm target adapter
- run runtime env validation
- capture maintenance snapshot
- export backup

During maintenance:

- run one change class at a time: migrate, restore, or repair
- re-check posture after each write-side action
- stop if integrity posture becomes less readable

After maintenance:

- re-run `check`
- re-run `npm run verify`
- confirm frontend operations and settings surfaces show the expected persistence posture
- keep the backup used for the maintenance window until post-change validation is complete

## Related References

- [Deployment Guide](./deployment.md)
- [Stage 6 Closeout](./architecture/stage-6-closeout.md)
