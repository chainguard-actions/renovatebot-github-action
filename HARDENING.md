<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.1.16

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.1.16** was hardened automatically. 5 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Sub-rule (a): GitHub Actions expressions are interpolated directly inside `run:` shell command strings in multiple steps of the `release` job.

1. "fetch pr" step (line ~160): `run: git fetch origin +${{ github.sha }}:${{ github.ref }}` — both `github.sha` and `github.ref` are injected directly into the shell command.

2. "Merge main" step (line ~165): `git merge --no-ff -Xtheirs -m 'skip: merge (${{ github.sha }}) [skip release]' ${{ github.sha }}` — `github.sha` is interpolated twice directly in the shell command.

3. "Release" step (line ~175): `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}` — `steps.merge.outputs.commit` is interpolated directly into the shell command.

All three cases allow YAML template substitution to inject arbitrary content into the shell before quoting occurs. These values should be passed via `env:` variables and referenced as `$VAR` in the script.

Locations:

- `.github/workflows/build.yml:160`
- `.github/workflows/build.yml:165`
- `.github/workflows/build.yml:175`

### script-injection (severity: high)

Sub-rule (a): GitHub Actions expressions are interpolated directly inside `run:` shell command strings in the composite setup-node action.

1. "Calculate CACHE_KEY" step (line ~16): `echo 'CACHE_KEY=node_modules-${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}' >> "$GITHUB_ENV"` — `${{ hashFiles(...) }}` is directly embedded in the run: block.

2. "Calculate CACHE_HIT" step (line ~31): `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"` — `${{ steps.node-modules-restore.outputs.cache-hit ... }}` is directly embedded in the run: block.

These expressions should be passed via `env:` variables and referenced as shell variables.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:31`

### github-env-injection (severity: high)

The "Configure renovate token" step in the `e2e` job writes env vars sourced from GitHub secrets (via `env:` mapping) to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`).

Line ~107: `echo "RENOVATE_TOKEN=${RENOVATE_TOKEN}" >> $GITHUB_ENV` — `RENOVATE_TOKEN` is set from `${{ secrets.RENOVATE_TOKEN }}` in the `env:` block.
Line ~109: `echo "RENOVATE_TOKEN=${GITHUB_TOKEN}" >> $GITHUB_ENV` — `GITHUB_TOKEN` is set from `${{ secrets.GITHUB_TOKEN }}` in the `env:` block.

Routing through an `env:` variable does not sanitize the value. A newline character in the secret value could inject additional environment variable assignments into `$GITHUB_ENV`.

Locations:

- `.github/workflows/build.yml:107`
- `.github/workflows/build.yml:109`

### github-env-injection (severity: high)

The composite setup-node action writes values derived from `${{ ... }}` expressions directly to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`).

Line ~16-18: `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}' >> "$GITHUB_ENV"` — the hashFiles result is written unsanitized.
Line ~31-33: `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"` — the step output is written unsanitized.

A newline in the interpolated value could inject additional environment variable assignments.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:31`

### missing-permissions (severity: medium)

The workflow file `build.yml` has no top-level `permissions:` key, and the majority of its jobs (`prepare`, `commitlint`, `lint`, `e2e`, `renovate-config-validator`, `release`) have no job-level `permissions:` block. Only the `lint-actions` job defines job-level permissions. Without explicit permissions, jobs inherit the default token permissions (which may be broad, especially `write-all` on some repository configurations). The `release` job in particular uses `GITHUB_TOKEN` and performs git push operations, making this especially risky. A top-level `permissions: {}` (or minimal scoped permissions per job) should be added.

Locations:

- `.github/workflows/build.yml:1`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection, missing-permissions

**Notes:**

Fixed all 5 findings across 2 files:

1. build.yml script-injection (release job): Moved github.sha and github.ref into env: blocks for 'fetch pr', 'Merge main', and 'Release' steps. All ${{ }} expressions are now referenced as plain shell variables.

2. setup-node/action.yml script-injection + github-env-injection: Moved hashFiles() and cache-hit expressions into env: blocks as CACHE_KEY_HASH and CACHE_HIT_VALUE. Added printf '%s' ... | tr -d '\n\r' sanitization before writing to $GITHUB_ENV.

3. build.yml github-env-injection (e2e job): Added printf '%s' ... | tr -d '\n\r' sanitization in 'Configure renovate token' step before writing to $GITHUB_ENV.

4. missing-permissions: Added top-level permissions: {} to deny all by default. Added job-level permissions blocks: contents:read for prepare/commitlint/lint/e2e/renovate-config-validator jobs, contents:write for release job. lint-actions already had security-events:write.

