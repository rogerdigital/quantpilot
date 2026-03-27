# Persistence Operations Surfaces Design

## Overview

This design adds persistence and migration status visibility to two existing frontend surfaces:

- the operations workbench for fast operational posture checks
- the settings page for system-level persistence detail and guided next steps

The goal is to expose already-implemented backend persistence contracts in a way that is useful to operators without turning the UI into a direct maintenance execution surface.

## Scope

In scope:

- show storage adapter and persistence model status in the operations workbench
- show schema and migration status in the settings page
- provide recommended next actions through deep links plus copyable CLI and API examples
- reuse existing backend maintenance and persistence contracts whenever possible

Out of scope:

- adding new destructive frontend controls for backup, migrate, restore, or repair
- implementing new backend migration behavior
- redesigning the existing workbench visual system

## User Outcomes

Operators should be able to answer four questions quickly:

1. What persistence backend is currently active?
2. Is the control plane up to date?
3. If not, how far behind is it?
4. What should I do next?

## Information Architecture

### Operations Workbench

Add a new `Persistence Posture` card to the operations workbench.

Purpose:

- communicate health and urgency at a glance
- surface the minimum information needed to decide whether maintenance follow-up is required

Displayed fields:

- adapter
- persistence model
- schema version
- current version to target version
- pending migration count
- up-to-date status

Actions shown:

- deep link to the maintenance area
- deep link to the settings detail panel
- copyable CLI example
- copyable API example

### Settings Page

Add a new `Persistence & Migration` detail card to the settings page.

Purpose:

- explain the current storage and migration state
- provide more detailed interpretation than the operations workbench
- help operators choose the right maintenance path

Displayed fields:

- adapter
- persistence model
- manifest schema version
- current version to target version
- pending migration count
- up-to-date status
- latest migration summary when available

Guidance shown:

- observe only when healthy
- backup before migration when attention is required
- inspect maintenance posture before any change when degraded

## State Model

Both pages will share one frontend posture mapping:

- `healthy`
  - migration plan is up to date or has no pending work
- `attention`
  - pending migrations exist but the persistence status is still readable and well-formed
- `degraded`
  - persistence metadata is missing, inconsistent, or the migration plan cannot be interpreted

Shared recommendation copy:

- `healthy`: continue monitoring
- `attention`: back up before applying migrations
- `degraded`: inspect maintenance posture before making changes

## UX Principles

- keep the operations workbench decision-oriented
- keep the settings page explanation-oriented
- avoid introducing direct high-risk execution controls in the browser
- preserve the current console visual language
- keep the UI useful for both English and Chinese copy paths

## Data and API Boundaries

Preferred source:

- existing operations maintenance and persistence status contracts

If a thin extension is needed, it should:

- expose only read-only persistence summary fields already derivable from backend maintenance data
- avoid adding new mutation routes
- avoid duplicating migration logic in the frontend

## Components

### Operations Persistence Card

Responsibilities:

- render posture badge
- render concise persistence and migration summary
- render operator next-step actions

Suggested content structure:

- title and badge
- one-line headline
- summary rows
- actions area with links and copyable commands

### Settings Persistence Card

Responsibilities:

- render persistence configuration detail
- render migration detail
- render explanatory guidance and recommended commands

Suggested content structure:

- title and environment label
- persistence detail rows
- migration plan detail rows
- recommended CLI and API examples
- maintenance caution copy

## Command and API Examples

Frontend examples should be copyable and read-only.

CLI examples should follow the existing maintenance commands, such as:

```bash
npm run control-plane:maintenance -- backup --adapter db
npm run control-plane:maintenance -- migrate --adapter db
npm run control-plane:maintenance -- repair-workflows --adapter db
```

API examples should follow existing maintenance endpoints, such as:

```http
GET /api/operations/maintenance
POST /api/operations/maintenance/backup
POST /api/operations/maintenance/repair/workflows
```

The frontend should present these as guidance, not execute them directly.

## Testing

### API

- verify persistence and migration summary fields used by the frontend remain available
- verify degraded and pending states are representable through current maintenance responses

### Frontend

- operations workbench renders `healthy`, `attention`, and `degraded` postures correctly
- settings page renders persistence and migration detail correctly
- both surfaces render CLI and API recommendations
- both surfaces use the same posture mapping semantics

### Verification

- `npm run test:web`
- `npm run test:api`
- `npm run typecheck`
- `npm run verify`

## Risks and Mitigations

Risk:

- the workbench becomes too dense and hard to scan

Mitigation:

- keep the operations card summary-focused and move detail to settings

Risk:

- frontend and backend semantics drift

Mitigation:

- derive posture from shared read-only fields and reuse one frontend mapping helper

Risk:

- operators treat UI guidance as a safe replacement for maintenance review

Mitigation:

- avoid direct mutation buttons and keep maintenance guidance explicitly cautionary

## Implementation Notes

- prefer a shared frontend helper for posture mapping and command generation
- keep new UI in existing workbench and settings visual patterns
- add deep links rather than new navigation primitives

## Done Criteria

This work is complete when:

- the operations workbench shows persistence posture and next-step guidance
- the settings page shows persistence and migration detail
- both pages stay read-only for maintenance actions
- test coverage and full verification pass
