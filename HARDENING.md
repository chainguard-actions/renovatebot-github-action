<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.2.2

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.2.2** was hardened automatically. 2 finding(s) were identified and resolved across 3 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Three `run:` blocks in the `release` job directly interpolate GitHub Actions expressions into shell commands without routing through env vars, violating sub-rule (a).

1. **`fetch pr` step** (line ~138): `run: git fetch origin +${{ github.sha }}:${{ github.ref }}` — both `${{ github.sha }}` and `${{ github.ref }}` are interpolated directly into the shell command string.

2. **`Merge main` step** (line ~143): `git merge --no-ff -Xtheirs -m 'skip: merge (${{ github.sha }}) [skip release]' ${{ github.sha }}` — `${{ github.sha }}` is interpolated directly into the shell command string twice.

3. **`Release` step** (line ~153): `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}` — `${{ steps.merge.outputs.commit }}` (a step output, which is a workflow-controllable context) is interpolated directly into the shell command string.

All three cases substitute template values before the shell ever sees the command, allowing injection of shell metacharacters if any of these values were attacker-influenced.

Locations:

- `.github/workflows/build.yml:138`
- `.github/workflows/build.yml:143`
- `.github/workflows/build.yml:153`

### missing-permissions (severity: medium)

The workflow file `build.yml` has no top-level `permissions:` key, and the majority of its jobs (`prepare`, `commitlint`, `lint`, `e2e`, `renovate-config-validator`, `release`) also have no job-level `permissions:` block. Only the `lint-actions` job defines permissions (`security-events: write`). Without explicit permissions, jobs run with the default token permissions, which may be overly broad (e.g., write access to contents and pull-requests on public repositories). A top-level `permissions: {}` or explicit minimal permissions on every job is required.

Locations:

- `.github/workflows/build.yml:1`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, missing-permissions

**Notes:**

Fixed all three script-injection instances in the release job by moving ${{ github.sha }}, ${{ github.ref }}, and ${{ steps.merge.outputs.commit }} into step-level env vars (GIT_SHA, GIT_REF, MERGE_COMMIT) and referencing them as plain shell variables. Added top-level 'permissions: {}' to restrict defaults, and added explicit minimal job-level permissions to all jobs: prepare/lint/e2e/renovate-config-validator get 'contents: read'; commitlint gets 'contents: read' + 'pull-requests: read'; release gets 'contents: write'; lint-actions already had 'security-events: write' and was preserved.

### Iteration 2

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed two findings in hardened/action/.github/actions/setup-node/action.yml:
1. Step '⚙️ Calculate CACHE_KEY' (line 16): Moved `${{ hashFiles(...) }}` expression into an `env:` block as `CACHE_KEY_HASH`, then referenced it as `${CACHE_KEY_HASH}` in the shell script to prevent script injection.
2. Step 'Calculate CACHE_HIT' (line 31): Moved `${{ steps.node-modules-restore.outputs.cache-hit ... }}` expression into an `env:` block as `CACHE_HIT_RAW`, then sanitized it with `printf '%s' "$CACHE_HIT_RAW" | tr -d '\n\r'` before writing to `$GITHUB_ENV`, fixing both the script-injection and github-env-injection findings.

### Iteration 3

**Fixes applied:** github-env-injection

**Notes:**

Fixed the 'Configure renovate token' step in hardened/action/.github/workflows/build.yml (lines 86-88). Both branches of the if/else now sanitize the token value using `printf '%s' "${VAR}" | tr -d '\n\r'` before writing to $GITHUB_ENV. This prevents a newline embedded in a secret value from injecting additional environment variable assignments into $GITHUB_ENV. Also quoted $GITHUB_ENV as "$GITHUB_ENV" for best practice.

