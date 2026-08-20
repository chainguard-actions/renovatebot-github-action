<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.1.7

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.1.7** was hardened automatically. 3 finding(s) were identified and resolved across 2 iteration(s).

## Findings Fixed

### missing-permissions (severity: medium)

build.yml has no top-level `permissions:` key, and the following jobs also have no job-level `permissions:` block: prepare, commitlint, lint, e2e, renovate-config-validator, release. This means the GITHUB_TOKEN is granted its default (potentially broad) permissions for all those jobs.

Locations:

- `.github/workflows/build.yml:1`

### script-injection (severity: high)

Multiple `run:` blocks in the `release` job of build.yml interpolate GitHub Actions expressions directly into shell commands (sub-rule a), allowing an attacker to inject arbitrary shell code:

1. "fetch pr" step: `run: git fetch origin +${{ github.sha }}:${{ github.ref }}` — both `github.sha` and `github.ref` are interpolated directly into the shell command.
2. "Merge main" step: `run: git merge --no-ff -Xtheirs -m 'skip: merge (${{ github.sha }}) [skip release]' ${{ github.sha }}` — `github.sha` is interpolated directly.
3. "Release" step: `run: export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}` — `steps.merge.outputs.commit` is interpolated directly into a shell export command.

All of these should be moved to `env:` variables and referenced as `"$VAR"` in the shell.

Locations:

- `.github/workflows/build.yml:131`
- `.github/workflows/build.yml:135`
- `.github/workflows/build.yml:148`

### github-env-injection (severity: high)

The "Configure renovate token" step in the `e2e` job writes secret-sourced environment variables to `$GITHUB_ENV` without sanitization. The values `${RENOVATE_TOKEN}` and `${GITHUB_TOKEN}` are set from `${{ secrets.RENOVATE_TOKEN }}` and `${{ secrets.GITHUB_TOKEN }}` respectively via the `env:` block, then written directly with `echo "RENOVATE_TOKEN=${RENOVATE_TOKEN}" >> $GITHUB_ENV` and `echo "RENOVATE_TOKEN=${GITHUB_TOKEN}" >> $GITHUB_ENV`. No `printf '%s' ... | tr -d '\n\r'` sanitization is applied before the write, allowing a newline in the secret value to inject arbitrary environment variables.

Locations:

- `.github/workflows/build.yml:75`

## Iteration Notes

### Iteration 1

**Fixes applied:** missing-permissions, script-injection, github-env-injection

**Notes:**

Fixed all three findings in hardened/action/.github/workflows/build.yml:

1. missing-permissions: Added top-level `permissions: {}` and explicit job-level permissions for all 6 jobs (prepare, commitlint, lint, renovate-config-validator get `{}`, e2e gets `contents: read`, release gets `contents: write`).

2. script-injection: Moved all three ${{ }} expressions out of run: blocks into env: blocks — github.sha/github.ref in 'fetch pr' step (→ GIT_SHA/GIT_REF), github.sha in 'Merge main' step (→ GIT_SHA), and steps.merge.outputs.commit in 'Release' step (→ MERGE_COMMIT). Also added the missing `echo "commit=${commit}" >> "$GITHUB_OUTPUT"` line in the Merge main step that was needed to actually set the step output.

3. github-env-injection: The 'Configure renovate token' step now sanitizes both RENOVATE_TOKEN and GITHUB_TOKEN using `printf '%s' "${VAR}" | tr -d '\n\r'` before writing to $GITHUB_ENV, preventing newline injection.

### Iteration 2

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed both findings in `.github/actions/setup-node/action.yml`:
1. Step 'Calculate CACHE_KEY' (line 16): Moved `${{ hashFiles(...) }}` expression into an `env:` block as `CACHE_KEY_HASH`, then sanitized with `printf '%s' "$CACHE_KEY_HASH" | tr -d '\n\r'` before writing to $GITHUB_ENV.
2. Step 'Calculate CACHE_HIT' (line 29): Moved `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` into an `env:` block as `CACHE_HIT_VALUE`, then sanitized with `printf '%s' "$CACHE_HIT_VALUE" | tr -d '\n\r'` before writing to $GITHUB_ENV. This resolves both the script-injection and github-env-injection findings for that step.

