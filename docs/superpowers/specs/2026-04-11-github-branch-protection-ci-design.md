# GitHub Branch Protection and CI Design

## Goal

Align QuantPilot with the repository governance model used by `rogerdigital/publio`: future changes to `main` must go through pull requests, pass CI, and merge by squash.

## Reference

The reference repository `rogerdigital/publio` uses an active `Protect main` branch ruleset for the default branch. It requires pull requests, review thread resolution, squash-only merges, and blocks deletion and non-fast-forward updates. It also uses a required `build` status check through branch protection.

QuantPilot should mirror those repository rules, while adapting the CI workflow to this repository's npm-based toolchain and existing `npm run verify` aggregate script.

## Design

Update `.github/workflows/ci.yml` so the required check remains named `build`. The workflow runs on pushes to `main`, pull requests targeting `main`, and manual dispatch. It uses Node.js 20, installs dependencies with `npm ci`, and runs `npm run verify`.

Create a repository-level ruleset named `Protect main` for the default branch with active enforcement. The ruleset requires pull requests, requires review thread resolution, allows only squash merges, blocks branch deletion, and blocks non-fast-forward updates. No bypass actors are configured.

Configure branch protection for `main` to require the `build` status check and require branches to be up to date before merging. Disable force pushes and branch deletion there as well, matching the ruleset guardrails.

Update repository merge settings so the GitHub UI only offers squash merge and deletes head branches after merge.

## Verification

After configuration, read back the GitHub ruleset, branch protection, repository merge settings, and local CI workflow diff. The readback must show `Protect main` active, required `build` status check, squash-only merge settings, and no bypass actors.
