# Contributing To QuantPilot

Thanks for contributing to QuantPilot.

This repository is organized as a layered monorepo. Contributions should preserve those boundaries instead of adding shortcut paths around risk, execution, account scope, workflow, or control-plane contracts.

## Working Principles

- Keep changes inside the existing architecture boundaries in `apps/*` and `packages/*`
- Prefer shared domain logic in `packages/*` over duplicated frontend and backend implementations
- Do not bypass risk, approval, or execution guardrails
- Treat audit, notification, and recovery semantics as part of the feature, not as optional follow-up work
- Keep documentation and validation baselines in sync with code changes

## Development Setup

Requirements:

- Node.js 20+
- npm 10+

Install dependencies:

```bash
npm install
```

Start the main local processes when needed:

```bash
npm run dev
npm run gateway
npm run worker
```

## Repository Structure

The main working areas are:

- `apps/web`: operator console and frontend workflows
- `apps/api`: API contracts, domain services, and gateway assembly
- `apps/worker`: background jobs and queued workflow execution
- `packages/control-plane-store`: persistence and repository contracts
- `packages/control-plane-runtime`: shared API/worker runtime assembly
- `packages/task-workflow-engine`: workflow execution paths
- `packages/trading-engine`: shared trading logic
- `packages/shared-types`: shared contracts across frontend and backend

For architectural background, see [README.md](./README.md) and [docs/architecture/project-structure.md](./docs/architecture/project-structure.md).

## Contribution Workflow

1. Align the scope before changing behavior-heavy surfaces
2. Make small, reviewable changes that preserve closed contracts
3. Add or update tests when behavior changes
4. Run the relevant validation commands locally
5. Keep docs updated when commands, workflows, or operator surfaces change

## Validation Expectations

Use targeted checks during development:

```bash
npm run test:control-plane
npm run test:runtime
npm run test:engine
npm run test:api
npm run test:worker
npm run test:web
npm run typecheck
```

Before pushing, run:

```bash
npm run verify
```

The repository installs a `pre-push` hook that runs `npm run verify` automatically.

## Documentation Expectations

Update documentation when you change:

- Startup, deployment, maintenance, or environment contracts
- Architecture boundaries or key code locations
- User-facing workbench behavior or operator flows
- Stage-closeout-referenced contracts that are enforced by `verify`

Primary documentation entry points:

- [README.md](./README.md)
- [README.zh-CN.md](./README.zh-CN.md)
- [docs/deployment.md](./docs/deployment.md)
- [docs/control-plane-migrations.md](./docs/control-plane-migrations.md)
- [docs/operations-handbook.md](./docs/operations-handbook.md)

## Safety Boundaries

Contributions must preserve these constraints:

- The browser must not hold real broker credentials
- Remote order placement must go through the server gateway
- Agents must not place real trades directly
- Risk and approval boundaries must not be bypassed
- Changes must not weaken existing workspace, audit, or maintenance contracts without explicitly updating tests and docs

## Pull Request Guidance

A strong change set usually includes:

- A narrow scope
- Clear validation evidence
- Updated docs when behavior or operations change
- No hidden coupling that bypasses the current control-plane model

If a change affects production-readiness surfaces such as persistence, maintenance, workspace scope, permissions, monitoring, or workflow recovery, include the related operational impact in the PR description.
