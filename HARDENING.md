<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action--/v46.1.18

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `1`

Action **renovatebot--github-action--/v46.1.18** was hardened automatically. 2 finding(s) were identified and resolved across 2 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Three `run:` steps in the `release` job of build.yml directly interpolate GitHub Actions expressions into shell commands (sub-rule a). (1) `fetch pr` step: `run: git fetch origin +${{ github.sha }}:${{ github.ref }}` — both `github.sha` and `github.ref` are interpolated directly into the shell command. (2) `Merge main` step: `git merge --no-ff -Xtheirs -m 'skip: merge (${{ github.sha }}) [skip release]' ${{ github.sha }}` — `github.sha` is interpolated twice. (3) `Release` step: `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}` — `steps.merge.outputs.commit` is interpolated directly. All `${{ ... }}` expressions inside `run:` blocks are script-injection risks because YAML template substitution occurs before the shell ever sees the value.

Locations:

- `.github/workflows/build.yml:148`
- `.github/workflows/build.yml:152`
- `.github/workflows/build.yml:163`

### missing-permissions (severity: medium)

build.yml has no top-level `permissions:` key, and the following jobs also lack job-level `permissions:` blocks: `prepare`, `commitlint`, `lint`, `e2e`, `renovate-config-validator`, and `release`. Only the `lint-actions` job defines its own `permissions:`. Without explicit permissions, jobs run with the default (potentially broad) token permissions.

Locations:

- `.github/workflows/build.yml:1`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, missing-permissions

**Notes:**

Fixed script-injection in build.yml: (1) 'fetch pr' step: moved github.sha and github.ref to env vars GIT_SHA/GIT_REF; (2) 'Merge main' step: moved github.sha to env var GIT_SHA; (3) 'Release' step: moved steps.merge.outputs.commit to env var MERGE_COMMIT. Fixed missing-permissions: added top-level 'permissions: {}' and job-level permissions blocks for all jobs (prepare/commitlint/lint/e2e/renovate-config-validator: contents:read; release: contents:write; lint-actions already had security-events:write).

### Iteration 2

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed both findings in .github/actions/setup-node/action.yml: (1) script-injection at line 16: moved `hashFiles('.node-version', 'pnpm-lock.yaml')` expression into an `env:` block as `HASH`, then used `${HASH}` in the shell script with `printf '%s' ... | tr -d '\n\r'` sanitization before writing to $GITHUB_ENV. (2) script-injection + github-env-injection at line 31: moved `steps.node-modules-restore.outputs.cache-hit` expression into an `env:` block as `CACHE_HIT_RAW`, then used `$CACHE_HIT_RAW` in the shell script with `printf '%s' ... | tr -d '\n\r'` sanitization before writing to $GITHUB_ENV. All other parts of the file (pinned action SHAs, permissions, etc.) were preserved unchanged.

