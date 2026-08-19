<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.1.17

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.1.17** was hardened automatically. 2 finding(s) were identified and resolved across 2 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Three `run:` blocks in build.yml directly interpolate `${{ ... }}` expressions into shell commands (sub-rule a), allowing an attacker to inject arbitrary shell commands via crafted git refs or step outputs.

1. "fetch pr" step: `run: git fetch origin +${{ github.sha }}:${{ github.ref }}` — both `github.sha` and `github.ref` are interpolated directly.
2. "Merge main" step: `git merge --no-ff -Xtheirs -m 'skip: merge (${{ github.sha }}) [skip release]' ${{ github.sha }}` — `github.sha` is interpolated directly into a shell argument.
3. "Release" step: `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}` — `steps.merge.outputs.commit` is interpolated directly into a shell export statement.

All three should use environment variables instead: set the value in an `env:` block and reference it as `$ENV_VAR` in the shell script.

Locations:

- `.github/workflows/build.yml:148`
- `.github/workflows/build.yml:153`
- `.github/workflows/build.yml:162`

### permissions (severity: medium)

missing-permissions: build.yml has no top-level `permissions:` key, and the majority of its jobs (`prepare`, `commitlint`, `lint`, `e2e`, `release`, `renovate-config-validator`) also have no job-level `permissions:` block. Only the `lint-actions` job defines its own permissions. Without explicit permissions, jobs inherit the default repository token permissions, which may be overly broad. A top-level `permissions: {}` (or minimal scopes) should be added, with job-level overrides where elevated access is needed.

Locations:

- `.github/workflows/build.yml:1`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, permissions

**Notes:**

Fixed three script injection vulnerabilities in build.yml by moving ${{ github.sha }}, ${{ github.ref }}, and ${{ steps.merge.outputs.commit }} expressions from run: shell strings into env: blocks, referencing them as plain env vars ($GIT_SHA, $GIT_REF, $MERGE_COMMIT). Added top-level `permissions: {}` to deny all permissions by default, then added minimal job-level permissions: contents:read for prepare/commitlint/lint/lint-actions/e2e/renovate-config-validator, pull-requests:read for commitlint, security-events:write for lint-actions (already existed, added contents:read), and contents:write for release.

### Iteration 2

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed both findings in hardened/action/.github/actions/setup-node/action.yml:

1. Step 'Calculate CACHE_KEY' (lines 16/18): Moved `${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}` into an `env:` block as `HASH_FILES`. The shell script now builds the cache key string from the env var and sanitizes it with `printf '%s' ... | tr -d '\n\r'` before writing to $GITHUB_ENV.

2. Step 'Calculate CACHE_HIT' (lines 31/33): Moved `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` into an `env:` block as `CACHE_HIT_RAW`. The shell script now sanitizes the value with `printf '%s' ... | tr -d '\n\r'` before writing to $GITHUB_ENV.

Both fixes address script-injection (no more ${{ }} inside run: strings) and github-env-injection (values are sanitized before writing to GITHUB_ENV).

