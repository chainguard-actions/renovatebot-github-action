<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.1.16

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `1`

Action **renovatebot--github-action/v46.1.16** was hardened automatically. 2 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Rule (a) violation: `${{ ... }}` expressions are interpolated directly inside `run:` shell command strings in the composite action. (1) Line 16: `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}'` — the `${{ hashFiles(...) }}` expression is substituted into the shell command before the shell ever sees it, allowing any newline or shell metacharacter in the result to break out of the quoted string. (2) Line 30: `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}'` — the `steps.*.outputs.*` value is similarly interpolated directly. Both writes go to `$GITHUB_ENV`. The fix is to move these expressions into `env:` variables and reference them as `"$ENV_VAR"` in the shell.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:30`

### github-env-injection (severity: high)

Two `run:` steps write values derived from `${{ ... }}` expressions directly to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`). (1) Line 16-18: `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}' >> "$GITHUB_ENV"` — the hashFiles result is written unsanitized. (2) Line 30-33: `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"` — the `steps.*.outputs.cache-hit` value (an untrusted source per the check scope) is written unsanitized. A newline embedded in either value could inject arbitrary environment variables into subsequent steps.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:30`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed both findings in .github/actions/setup-node/action.yml: (1) Moved `${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}` out of the run: shell string into an env: variable `CACHE_KEY_HASH`, then sanitized it with `printf '%s' "$CACHE_KEY_HASH" | tr -d '\n\r'` before writing to $GITHUB_ENV. (2) Moved `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` out of the run: shell string into an env: variable `CACHE_HIT_VALUE`, then sanitized it with `printf '%s' "$CACHE_HIT_VALUE" | tr -d '\n\r'` before writing to $GITHUB_ENV. Both fixes eliminate direct ${{ }} interpolation in shell commands and prevent newline injection into $GITHUB_ENV.

