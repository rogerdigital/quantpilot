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
npm run control-plane:maintenance -- artifact-integrity
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

## Agent Governance API Routes (Stage 7 P0)

Routes added in stage 7 for Agent trading governance:

```http
# Read current authority mode (includes risk/anomaly override)
GET /api/agent/authority?accountId=paper-main&strategyId=all&actionType=all&environment=paper&riskMode=healthy&anomalyMode=healthy

# Save an authority policy (creates or updates)
POST /api/agent/policies
{ "accountId": "paper-main", "strategyId": "all", "actionType": "all", "environment": "paper", "authority": "ask_first" }

# Create a daily bias instruction (active until end of today)
POST /api/agent/instructions
{ "kind": "daily_bias", "title": "Trade lighter today", "body": "Prefer fewer new entries.", "requestedBy": "operator-demo" }

# Governance snapshot also available via workbench (authorityState, dailyBias, authorityEvents, dailyRuns)
GET /api/agent/workbench
```

Authority mode ladder (most-restrictive-wins across all matching policies):
`full_auto` → `bounded_auto` → `ask_first` → `manual_only` → `stopped`

`risk_off` or critical anomaly forces `stopped`; warn anomaly forces at least `ask_first`.

## Platform Events

The platform emits structured events for all major lifecycle changes. Events are categorized by type and severity:

**Event types:** `dataset_ingested`, `data_quality_failed`, `experiment_started`, `experiment_completed`, `backtest_completed`, `promotion_submitted`, `promotion_approved`, `promotion_rejected`, `risk_breach_detected`, `execution_plan_submitted`, `order_lifecycle_changed`, `agent_review_produced`, `kill_switch_triggered`.

**Severity levels:** `info`, `warning`, `critical`.

Events can be filtered by type, severity, source, and namespace. The observability dashboard exposes system health matrix (healthy/degraded/blocked per service), live event stream, and artifact integrity status.

## Artifact Integrity

The `artifact-integrity` maintenance command runs 6 checks:

1. **Missing metadata** — artifacts without descriptive metadata (warning)
2. **Missing payload** — artifacts with no content body (error)
3. **Hash mismatch** — payload hash doesn't match stored hash (error)
4. **Orphaned** — artifact references a non-existent parent (warning)
5. **Stale active dataset** — dataset version active beyond threshold (warning)
6. **Promotion missing evidence** — promotion record with no attached evidence (error)

```bash
npm run control-plane:maintenance -- artifact-integrity
```

## Research & Strategy Lifecycle

### Research Lifecycle

1. **Workspace creation** — create research workspace with hypothesis
2. **Idea management** — add ideas, transition status, record decisions
3. **Experiment tracking** — link datasets, features, experiments
4. **Model registry** — register and version models

### Data Lifecycle

1. **Dataset registration** — register datasets with schema and quality expectations
2. **Ingestion** — run data quality checks (missing values, duplicates, monotonicity, staleness, extreme spikes, schema mismatch, symbol coverage)
3. **Version activation** — only quality-passing ingestions activate new versions
4. **Feature lineage** — track derivation chains from raw datasets to computed features

### Strategy Promotion

Strategies follow a gated promotion lifecycle: `research → candidate → paper_limited → paper_full → live_limited → live_full`.

Each transition requires specific gates to pass:
- `research_evidence` — validated hypothesis required
- `dataset_quality` — no blocker-severity quality issues
- `feature_leakage_check` — no target leakage detected
- `backtest_reproducibility` — deterministic spec hash
- `robustness_diagnostics` — acceptable overfit risk
- `risk_compliance` — passes risk policy engine
- `paper_observation` — sufficient paper trading days
- `live_acknowledgement` — explicit operator sign-off

### Paper / Live Boundaries

- Paper and live modes are strictly isolated at the broker connector level
- Live mode requires: `BROKER_API_KEY`, `BROKER_API_SECRET`, `BROKER_ACCOUNT_ID` env vars
- Strategy packages cannot request `live:execute` permission by default
- Max leverage capped at 5x, max drawdown at 50%

## Agent Boundaries

- Agents produce advisory outputs only — cannot directly execute trades
- Agent actions go through risk assessment before execution
- Agent tools registry controls which capabilities are available
- Review workflows require evidence citations
- Agent governance (authority ladder) can restrict agent autonomy based on risk conditions

## Job Runner and Artifacts

- Compute jobs track status: `queued → running → completed / failed`
- Jobs produce artifacts stored with metadata + payload + content hash
- Backtest dispatcher queues reproducible backtest specs
- Data ingestion jobs run quality checks before activating versions
- Worker job handlers process queued jobs asynchronously

## Related Documents

- [README.md](../README.md)
- [README.zh-CN.md](../README.zh-CN.md)
- [deployment.md](./deployment.md)
- [control-plane-migrations.md](./control-plane-migrations.md)
- [architecture/project-structure.md](./architecture/project-structure.md)

## Platform Boundaries

QuantPilot is a controlled quantitative research and execution control plane. It is not a stock recommendation tool, unattended live-trading bot, or retail trading app.

**Non-negotiable constraints:**

- Agents cannot directly place live orders. All agent outputs are advisory until a human or server-side policy accepts them.
- `live` mode requires server-side environment validation, explicit operator acknowledgement, and complete promotion evidence (research → backtest → risk → execution).
- Paper and live execution paths are strictly isolated. Mode confusion is treated as a critical incident.
- Risk policies and kill switch are server-side enforced and cannot be bypassed by UI, agent, or API caller.
- All strategy promotions require four categories of evidence: research record, backtest record, risk assessment, and execution plan.
- Audit records are append-only. No deletion API exists for audit, decision, or governance events.
