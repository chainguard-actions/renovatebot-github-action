<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.3.4

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.3.4** was hardened automatically. 2 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Sub-rule (a): Two `run:` blocks in the composite action directly interpolate `${{ }}` expressions inside shell command strings.

1. Step "Calculate `CACHE_KEY`" (line 16): `echo 'CACHE_KEY=node_modules-${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}' >> "$GITHUB_ENV"` — the `${{ hashFiles(...) }}` expression is substituted directly into the shell command before execution.

2. Step "Calculate `CACHE_HIT`" (line 31): `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"` — `steps.*.outputs.*` is an explicitly untrusted-input source and is interpolated directly into the shell command string.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:31`

### github-env-injection (severity: high)

Two `run:` blocks write values derived from `${{ }}` expressions directly to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`).

1. Step "Calculate `CACHE_KEY`" (line 16-18): `echo 'CACHE_KEY=node_modules-${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}' >> "$GITHUB_ENV"` — the result of the expression is written to GITHUB_ENV with no newline stripping.

2. Step "Calculate `CACHE_HIT`" (line 31-33): `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"` — `steps.*.outputs.*` is an untrusted-input source per the check scope, and its value is written to GITHUB_ENV without sanitization.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:31`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed both findings in .github/actions/setup-node/action.yml:
1. CACHE_KEY step (line 16): Moved `${{ hashFiles(...) }}` into an `env:` block as `HASH_VALUE`, then sanitized with `printf '%s' "$HASH_VALUE" | tr -d '\n\r'` before writing to $GITHUB_ENV.
2. CACHE_HIT step (line 31): Moved `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` into an `env:` block as `CACHE_HIT_VALUE`, then sanitized with `printf '%s' "$CACHE_HIT_VALUE" | tr -d '\n\r'` before writing to $GITHUB_ENV.
Both fixes address script-injection (expressions no longer interpolated directly into shell strings) and github-env-injection (values sanitized before writing to $GITHUB_ENV).

