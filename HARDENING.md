<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.3.3

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.3.3** was hardened automatically. 2 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Sub-rule (a): Two `run:` blocks in the composite action directly interpolate `${{ }}` expressions inside shell command strings. (1) Line 16: `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}'` — a `${{ }}` expression is embedded directly in the shell command. (2) Line 31: `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}'` — a `steps.*.outputs.*` expression (untrusted input) is interpolated directly in the shell command. Any `${{ ... }}` inside a `run:` block is a script-injection risk because YAML template substitution occurs before the shell ever sees the string.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:31`

### github-env-injection (severity: high)

A `run:` block writes a value derived from `steps.node-modules-restore.outputs.cache-hit` (a `steps.*.outputs.*` source, which is in the untrusted-input list) directly to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`). The expression `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` is interpolated directly into the `echo` command that writes to `$GITHUB_ENV`, allowing newline injection to set arbitrary environment variables.

Locations:

- `.github/actions/setup-node/action.yml:31`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed both findings in hardened/action/.github/actions/setup-node/action.yml:
1. CACHE_KEY step (line 16): Moved `${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}` into an `env:` block as `CACHE_KEY_HASH`. In the run: block, sanitized with `printf '%s' "$CACHE_KEY_HASH" | tr -d '\n\r'` before writing to $GITHUB_ENV.
2. CACHE_HIT step (line 31): Moved `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` into an `env:` block as `CACHE_HIT_VALUE`. In the run: block, sanitized with `printf '%s' "$CACHE_HIT_VALUE" | tr -d '\n\r'` before writing to $GITHUB_ENV. This eliminates both the script-injection risk (no more ${{ }} in shell strings) and the github-env-injection risk (newlines stripped before writing to $GITHUB_ENV).

