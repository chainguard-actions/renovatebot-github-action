<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action--/v46.1.18

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `1`

Action **renovatebot--github-action--/v46.1.18** was hardened automatically. 3 finding(s) were identified and resolved across 2 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Sub-rule (a): Direct expression interpolation in run: blocks. Three steps in the 'release' job interpolate GitHub context expressions directly into shell commands without going through env vars: (1) 'fetch pr' step: `run: git fetch origin +${{ github.sha }}:${{ github.ref }}` — github.sha and github.ref are interpolated directly; (2) 'Merge main' step: `git merge --no-ff -Xtheirs -m 'skip: merge (${{ github.sha }}) [skip release]' ${{ github.sha }}` — github.sha is interpolated directly; (3) 'Release' step: `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}` — steps.merge.outputs.commit is interpolated directly.

Locations:

- `.github/workflows/build.yml:150`
- `.github/workflows/build.yml:155`
- `.github/workflows/build.yml:171`

### permissions (severity: medium)

missing-permissions: build.yml has no top-level permissions: key, and the following jobs have no job-level permissions: block either: prepare, commitlint, lint, e2e, renovate-config-validator, release. Only the lint-actions job has a job-level permissions block. This means most jobs run with the default (potentially broad) token permissions.

Locations:

- `.github/workflows/build.yml:1`

### github-env-injection (severity: high)

The 'Calculate CACHE_HIT' step in the composite action writes a value derived from steps.node-modules-restore.outputs.cache-hit (a steps.*.outputs.* source, which is listed as untrusted) directly to $GITHUB_ENV without the required sanitization step (printf '%s' ... | tr -d '\n\r'). The expression `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` is interpolated directly into the echo command that writes to $GITHUB_ENV.

Locations:

- `.github/actions/setup-node/action.yml:30`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, permissions, github-env-injection

**Notes:**

Fixed all three findings: (1) script-injection in build.yml release job - moved github.sha, github.ref, and steps.merge.outputs.commit expressions into env vars (GIT_SHA, GIT_REF, MERGE_COMMIT) and referenced them as shell variables in run blocks; (2) missing-permissions - added top-level 'permissions: {}' to build.yml and job-level permissions blocks to all jobs (prepare, commitlint, lint, e2e, renovate-config-validator get 'contents: read'; release gets 'contents: write'; lint-actions already had 'security-events: write'); (3) github-env-injection in setup-node/action.yml - moved the steps.node-modules-restore.outputs.cache-hit expression into an env var (CACHE_HIT_RAW) and sanitized it with 'printf | tr -d' before writing to GITHUB_ENV.

### Iteration 2

**Fixes applied:** script-injection

**Notes:**

Fixed script-injection in .github/actions/setup-node/action.yml: moved the ${{ hashFiles('.node-version', 'pnpm-lock.yaml') }} expression from the run: shell command into an env: block as HASH, and updated the shell script to reference it as ${HASH} instead of directly interpolating the ${{ }} expression.

