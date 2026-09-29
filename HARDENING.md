<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.3.6

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.3.6** was hardened automatically. 4 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Rule (a): A ${{ }} expression is interpolated directly inside a run: shell command string. In the 'Calculate CACHE_KEY' step, `${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}` is embedded directly in the echo command: `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}' >> "$GITHUB_ENV"`. Any ${{ ... }} expression inside a run: block is a script-injection risk as the value is substituted before the shell parses the command.

Locations:

- `.github/actions/setup-node/action.yml:16`

### script-injection (severity: high)

Rule (a): A ${{ }} expression is interpolated directly inside a run: shell command string. In the 'Calculate CACHE_HIT' step, `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` is embedded directly in the echo command: `echo 'CACHE_HIT=${{ ... }}' >> "$GITHUB_ENV"`. The `steps.*.outputs.*` context is an untrusted-input source and is substituted into the shell command before execution.

Locations:

- `.github/actions/setup-node/action.yml:31`

### github-env-injection (severity: high)

A ${{ }} expression (steps.node-modules-restore.outputs.cache-hit, which is a steps.*.outputs.* untrusted-input source) is written directly to $GITHUB_ENV without the required sanitization step (printf '%s' ... | tr -d '\n\r'). The offending line is: `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"`. An attacker-controlled cache-hit output value containing newlines could inject arbitrary environment variables.

Locations:

- `.github/actions/setup-node/action.yml:31`

### github-env-injection (severity: high)

A ${{ }} expression (hashFiles(...)) is written directly to $GITHUB_ENV without the required sanitization step (printf '%s' ... | tr -d '\n\r'). The offending line is: `echo 'CACHE_KEY=node_modules-${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}' >> "$GITHUB_ENV"`. Even though hashFiles() is GitHub-controlled, the value is interpolated into the shell command and written to GITHUB_ENV without sanitization, violating the check's requirement that all ${{ }} writes to special environment files be sanitized.

Locations:

- `.github/actions/setup-node/action.yml:16`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed both findings in hardened/action/.github/actions/setup-node/action.yml:

1. 'Calculate CACHE_KEY' step (line 16): Moved `${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}` into the step's env: block as CACHE_KEY_HASH. The run: script now uses `printf '%s' "node_modules-${CACHE_KEY_HASH}" | tr -d '\n\r'` to sanitize before writing to $GITHUB_ENV.

2. 'Calculate CACHE_HIT' step (line 31): Moved `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` into the step's env: block as CACHE_HIT_VALUE. The run: script now uses `printf '%s' "$CACHE_HIT_VALUE" | tr -d '\n\r'` to sanitize before writing to $GITHUB_ENV.

Both changes eliminate script-injection risk (no ${{ }} in run: blocks) and github-env-injection risk (values are sanitized before being written to $GITHUB_ENV).

