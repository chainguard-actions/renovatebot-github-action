<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.1.15

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.1.15** was hardened automatically. 4 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Sub-rule (a): Multiple `run:` blocks in the `release` job directly interpolate GitHub Actions expressions inside shell commands. (1) `run: git fetch origin +${{ github.sha }}:${{ github.ref }}` — `github.ref` is attacker-controllable (branch name) and flows through YAML template substitution before the shell sees it. (2) `git merge --no-ff -Xtheirs -m 'skip: merge (${{ github.sha }}) [skip release]' ${{ github.sha }}` — `github.sha` is interpolated directly into a shell command string. (3) `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}` — a step output is interpolated directly into a shell command. All three must be moved to `env:` variables and double-quoted in the shell script.

Locations:

- `.github/workflows/build.yml:133`
- `.github/workflows/build.yml:137`
- `.github/workflows/build.yml:151`

### script-injection (severity: high)

Sub-rule (a): Two `run:` blocks in the `setup-node` composite action directly interpolate `${{ }}` expressions inside shell commands. (1) `echo 'CACHE_KEY=${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}' >> "$GITHUB_ENV"` — the `hashFiles()` expression is interpolated directly in the run block. (2) `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"` — a step output expression is interpolated directly in the run block. Any `${{ ... }}` inside a `run:` block is a script-injection risk regardless of the context.

Locations:

- `.github/actions/setup-node/action.yml:15`
- `.github/actions/setup-node/action.yml:30`

### github-env-injection (severity: high)

Two `run:` steps in the `setup-node` composite action write values derived from `${{ }}` expressions (which include `steps.*.outputs.*`) to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`). (1) The `Calculate CACHE_KEY` step writes `CACHE_KEY=<hashFiles result>` to `$GITHUB_ENV`. (2) The `Calculate CACHE_HIT` step writes `CACHE_HIT=<steps.node-modules-restore.outputs.cache-hit>` to `$GITHUB_ENV`. Step outputs (`steps.*.outputs.*`) are listed as untrusted input sources; writing them unsanitized to `$GITHUB_ENV` allows newline injection that could set arbitrary environment variables.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:31`

### missing-permissions (severity: medium)

The workflow file `build.yml` has no top-level `permissions:` key, and the majority of its jobs (`prepare`, `commitlint`, `lint`, `e2e`, `renovate-config-validator`, `release`) also have no job-level `permissions:` block. Only the `lint-actions` job defines its own `permissions:`. Without explicit permissions, jobs inherit the default token permissions (which may be `write-all` depending on repository settings), violating the principle of least privilege. A top-level `permissions: {}` or specific per-job permissions should be added.

Locations:

- `.github/workflows/build.yml:1`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection, missing-permissions

**Notes:**

Fixed all four findings:

1. **script-injection in build.yml** (lines 133, 137, 151): Moved `github.sha`, `github.ref`, and `steps.merge.outputs.commit` out of `run:` shell strings into `env:` blocks as `GIT_SHA`, `GIT_REF`, and `MERGE_COMMIT` respectively. Referenced them double-quoted in the shell scripts.

2. **script-injection in setup-node/action.yml** (lines 15, 30): Moved `hashFiles()` expression and the step output expression (`steps.node-modules-restore.outputs.cache-hit`) out of `run:` blocks into `env:` blocks as `CACHE_KEY_VALUE` and `CACHE_HIT_VALUE`.

3. **github-env-injection in setup-node/action.yml** (lines 16, 31): Added `printf '%s' "$VAR" | tr -d '\n\r'` sanitization before writing values to `$GITHUB_ENV` in both the `Calculate CACHE_KEY` and `Calculate CACHE_HIT` steps.

4. **missing-permissions in build.yml** (line 1): Added top-level `permissions: contents: read` to restrict default token permissions. Added job-level `permissions: contents: write` to the `release` job which needs to push to the release branch and create GitHub releases via semantic-release.

