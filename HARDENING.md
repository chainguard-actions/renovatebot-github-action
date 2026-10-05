<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.3.7

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.3.7** was hardened automatically. 2 finding(s) were identified and resolved across 2 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Two `run:` blocks in the composite action directly interpolate `${{ }}` expressions inside shell command strings, violating rule (a). (1) The 'Calculate CACHE_KEY' step interpolates `${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}` directly in the shell command: `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}' >> "$GITHUB_ENV"`. (2) The 'Calculate CACHE_HIT' step interpolates `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` directly in the shell command: `echo 'CACHE_HIT=${{ ... }}' >> "$GITHUB_ENV"`. Any `${{ ... }}` expression inside a `run:` block is a script-injection risk because the value is substituted by the Actions template engine before the shell ever sees it, bypassing shell quoting.

Locations:

- `.github/actions/setup-node/action.yml:17`
- `.github/actions/setup-node/action.yml:31`

### github-env-injection (severity: high)

The 'Calculate CACHE_HIT' `run:` block writes the value of `${{ steps.node-modules-restore.outputs.cache-hit }}` (a `steps.*.outputs.*` value, which is an untrusted-input source) directly to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`). An attacker who can influence the cache-hit output could inject arbitrary environment variable definitions into subsequent steps via newline characters. The offending line is: `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"`.

Locations:

- `.github/actions/setup-node/action.yml:31`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed two findings in hardened/action/.github/actions/setup-node/action.yml:
1. 'Calculate CACHE_KEY' step (line 17): Moved `${{ hashFiles(...) }}` expression into the step's `env:` block as `HASH`, then referenced it as `${HASH}` in the shell script, eliminating direct template interpolation in the run block.
2. 'Calculate CACHE_HIT' step (line 31): Moved `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` into the step's `env:` block as `CACHE_HIT_VALUE`, then sanitized it with `printf '%s' "$CACHE_HIT_VALUE" | tr -d '\n\r'` before writing to `$GITHUB_ENV`, fixing both the script-injection and github-env-injection findings.

### Iteration 1

**Fixes applied:** github-env-injection

**Notes:**

Fixed the '⚙️ Calculate `CACHE_KEY`' step in hardened/action/.github/actions/setup-node/action.yml. Added sanitization of the HASH value using `safe=$(printf '%s' "$HASH" | tr -d '\n\r')` before writing to $GITHUB_ENV, and changed the echo to use `${safe}` instead of `${HASH}`. This matches the pattern already used in the adjacent 'Calculate `CACHE_HIT`' step.

