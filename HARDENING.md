<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.3.8

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.3.8** was hardened automatically. 2 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Two `run:` blocks in the composite action directly interpolate `${{ }}` expressions inside shell command strings, violating rule (a). 

1. Line 16: `echo 'CACHE_KEY=node_modules-${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}' >> "$GITHUB_ENV"` — the `${{ hashFiles(...) }}` expression is substituted directly into the shell command before the shell ever sees it.

2. Line 29: `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"` — the `${{ steps.node-modules-restore.outputs.cache-hit }}` expression (an untrusted `steps.*.outputs.*` source) is substituted directly into the shell command.

Both should be moved to `env:` variables and referenced as `"$CACHE_KEY"` / `"$CACHE_HIT"` in the shell.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:29`

### github-env-injection (severity: high)

Two `run:` blocks write values derived from `${{ }}` expressions directly to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`).

1. Lines 16-18: `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}' >> "$GITHUB_ENV"` — the `hashFiles()` result is written unsanitized to GITHUB_ENV.

2. Lines 29-31: `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"` — the `steps.*.outputs.cache-hit` value (an untrusted source) is written unsanitized to GITHUB_ENV. A newline embedded in the output value could inject arbitrary environment variables into subsequent steps.

The fix is to capture the expression into an `env:` variable, sanitize it with `safe=$(printf '%s' "$VAR" | tr -d '\n\r')`, and then write `$safe` to `$GITHUB_ENV`.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:29`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed both findings in .github/actions/setup-node/action.yml:
1. Step 'Calculate CACHE_KEY' (line 16): Moved `${{ hashFiles(...) }}` into an `env:` block as `HASH`, then sanitized with `safe=$(printf '%s' "$HASH" | tr -d '\n\r')` before writing `CACHE_KEY=node_modules-${safe}` to $GITHUB_ENV.
2. Step 'Calculate CACHE_HIT' (line 29): Moved `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` into an `env:` block as `CACHE_HIT_RAW`, then sanitized with `safe=$(printf '%s' "$CACHE_HIT_RAW" | tr -d '\n\r')` before writing `CACHE_HIT=${safe}` to $GITHUB_ENV.

