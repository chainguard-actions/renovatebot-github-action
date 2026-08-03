<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.2.1

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.2.1** was hardened automatically. 2 finding(s) were identified and resolved across 2 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Three run: steps in the release job of build.yml directly interpolate ${{ }} expressions inside shell commands (sub-rule a), which causes YAML template substitution before the shell ever sees the value:

1. 'fetch pr' step: `run: git fetch origin +${{ github.sha }}:${{ github.ref }}` — github.sha and github.ref interpolated directly.
2. 'Merge main' step: `git merge --no-ff -Xtheirs -m 'skip: merge (${{ github.sha }}) [skip release]' ${{ github.sha }}` — github.sha interpolated directly into a shell string.
3. 'Release' step: `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}` — steps.merge.outputs.commit interpolated directly into a shell assignment.

All three should use environment variables instead of direct expression interpolation.

Locations:

- `.github/workflows/build.yml:155`
- `.github/workflows/build.yml:160`
- `.github/workflows/build.yml:170`

### missing-permissions (severity: medium)

build.yml has no top-level permissions: key, and the following jobs also have no job-level permissions: block: prepare, commitlint, lint, e2e, renovate-config-validator, and release. Without explicit permissions, these jobs inherit the default repository token permissions (which may be read/write depending on repository settings), violating the principle of least privilege. Only the lint-actions job has a job-level permissions block.

Locations:

- `.github/workflows/build.yml:1`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, missing-permissions

**Notes:**

Fixed all three script injection issues in build.yml's release job by moving ${{ github.sha }}, ${{ github.ref }}, and ${{ steps.merge.outputs.commit }} expressions into env: blocks and referencing them as plain shell variables (GIT_SHA, GIT_REF, MERGE_COMMIT). Added a top-level `permissions: {}` block to deny all permissions by default, and added explicit job-level permissions blocks to all jobs: contents: read for prepare, commitlint, lint, e2e, and renovate-config-validator; contents: read + security-events: write for lint-actions (preserving existing permission); and contents: write for release (needed for git push and semantic-release).

### Iteration 2

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed both findings in hardened/action/.github/actions/setup-node/action.yml:

1. **script-injection** (lines 16 & 29): Moved `${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}` and `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` out of `run:` shell strings into `env:` blocks as `CACHE_HASH` and `CACHE_HIT_RAW` respectively. The shell scripts now reference these as plain environment variables.

2. **github-env-injection** (lines 18 & 31): Both values are now sanitized with `printf '%s' "$VAR" | tr -d '\n\r'` before being written to `$GITHUB_ENV`, preventing newline-based environment variable injection attacks.

