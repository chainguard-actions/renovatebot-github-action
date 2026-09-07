<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.2.6

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.2.6** was hardened automatically. 4 finding(s) were identified and resolved across 2 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Sub-rule (a): Direct expression interpolation inside a `run:` block. The 'Release' step interpolates `${{ steps.merge.outputs.commit }}` directly into the shell command: `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}`. The `steps.*.outputs.*` context flows through YAML template substitution before the shell sees it, enabling script injection.

Locations:

- `.github/workflows/build.yml:143`

### script-injection (severity: high)

Sub-rule (a): Direct expression interpolation inside `run:` blocks in a composite action. The 'Calculate CACHE_KEY' step interpolates `${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}` directly inside a `run:` shell command: `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}' >> "$GITHUB_ENV"`. The 'Calculate CACHE_HIT' step interpolates `${{ steps.node-modules-restore.outputs.cache-hit == 'true' && 'true' || '' }}` (which includes the `steps.*.outputs.*` context) directly inside a `run:` shell command. Any `${{ ... }}` inside a `run:` block is a script-injection risk regardless of context.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:27`

### github-env-injection (severity: high)

The composite action writes GitHub Actions expressions directly to `$GITHUB_ENV` without sanitization. The 'Calculate CACHE_KEY' step writes `${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}` to GITHUB_ENV via `echo 'CACHE_KEY=node_modules-${{ ... }}' >> "$GITHUB_ENV"`. The 'Calculate CACHE_HIT' step writes `${{ steps.node-modules-restore.outputs.cache-hit == 'true' && 'true' || '' }}` (sourced from `steps.*.outputs.*`, an explicitly listed untrusted source) to GITHUB_ENV. Neither write is preceded by the required sanitization step `printf '%s' ... | tr -d '\n\r'`.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:27`

### missing-permissions (severity: medium)

The workflow file has no top-level `permissions:` key, and most jobs lack job-level `permissions:` blocks. Only the `lint-actions` job defines permissions (`security-events: write`). The jobs `prepare`, `commitlint`, `lint`, `e2e`, `renovate-config-validator`, and `release` all run without any explicit permissions, defaulting to whatever the repository or organization grants — which may be overly broad.

Locations:

- `.github/workflows/build.yml:1`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection, missing-permissions

**Notes:**

Fixed all four findings:
1. build.yml script-injection (line 143): Moved `${{ steps.merge.outputs.commit }}` into env: block as MERGE_COMMIT, referenced as "$MERGE_COMMIT" in the shell.
2. setup-node/action.yml script-injection (lines 16 & 27): Moved `${{ hashFiles(...) }}` into env: HASH_FILES and `${{ steps.node-modules-restore.outputs.cache-hit ... }}` into env: CACHE_HIT_RAW.
3. setup-node/action.yml github-env-injection (lines 16 & 27): Both values sanitized with `printf '%s' "$VAR" | tr -d '\n\r'` before writing to $GITHUB_ENV.
4. build.yml missing-permissions: Added top-level `permissions: {}` to restrict defaults, plus job-level permissions for all jobs (contents: read for prepare/commitlint/lint/e2e/renovate-config-validator; contents: write for release; existing security-events: write kept for lint-actions).

### Iteration 2

**Fixes applied:** github-env-injection, script-injection

**Notes:**

Fixed three issues in hardened/action/.github/workflows/build.yml:
1. 'Configure renovate token' step (lines 103/105): Added sanitization using `safe=$(printf '%s' "$VAR" | tr -d '\n\r')` before writing both RENOVATE_TOKEN and GITHUB_TOKEN to $GITHUB_ENV, preventing newline injection.
2. 'fetch pr' step (line 153): Quoted the refspec as `"+$GH_SHA:$GH_REF"` to prevent word splitting/glob expansion of $GH_REF (sourced from github.ref).
3. 'Merge main' step (line 159): Quoted the trailing positional argument as `"$GH_SHA"` to prevent word splitting.

