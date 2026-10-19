<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.3.9

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.3.9** was hardened automatically. 2 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Two `run:` blocks in `.github/actions/setup-node/action.yml` directly interpolate `${{ ... }}` expressions inside shell command strings (sub-rule a). Line 16: `echo 'CACHE_KEY=node_modules-${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}'` — the `${{ hashFiles(...) }}` expression is substituted into the shell command before the shell parses it. Line 30: `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}'` — the `${{ steps.*.outputs.* }}` context (workflow-controllable) is interpolated directly into the shell string. Any `${{ ... }}` inside a `run:` block is a script-injection risk regardless of which context it reads from.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:30`

### github-env-injection (severity: high)

Two `run:` blocks in `.github/actions/setup-node/action.yml` write `${{ ... }}`-derived values to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`). Line 18: `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}' >> "$GITHUB_ENV"` — the hash value from `hashFiles()` is written directly to GITHUB_ENV. Line 32: `echo 'CACHE_HIT=${{ steps.node-modules-restore.outputs.cache-hit ... }}' >> "$GITHUB_ENV"` — the step output (a workflow-controllable value via `steps.*.outputs.*`) is written directly to GITHUB_ENV. Neither write is preceded by the required `printf '%s' ... | tr -d '\n\r'` sanitization pipeline.

Locations:

- `.github/actions/setup-node/action.yml:18`
- `.github/actions/setup-node/action.yml:32`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed both findings in .github/actions/setup-node/action.yml:
1. Moved `${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}` from the run: shell string into an env: block as CACHE_KEY_HASH, then sanitized with `printf '%s' "$CACHE_KEY_HASH" | tr -d '\n\r'` before writing to $GITHUB_ENV.
2. Moved `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` from the run: shell string into an env: block as CACHE_HIT_VALUE, then sanitized with `printf '%s' "$CACHE_HIT_VALUE" | tr -d '\n\r'` before writing to $GITHUB_ENV.
Both script-injection and github-env-injection findings are resolved.

