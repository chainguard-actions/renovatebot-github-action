<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.3.2

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.3.2** was hardened automatically. 4 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Sub-rule (a): The 'Calculate CACHE_KEY' step interpolates a ${{ hashFiles(...) }} expression directly inside a run: shell command string. Any ${{ }} expression inside a run: block is a script-injection risk because YAML template substitution occurs before the shell ever sees the value. Offending line: echo 'CACHE_KEY=node_modules-${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}' >> "$GITHUB_ENV"

Locations:

- `.github/actions/setup-node/action.yml:15`

### script-injection (severity: high)

Sub-rule (a): The 'Calculate CACHE_HIT' step interpolates a ${{ steps.node-modules-restore.outputs.cache-hit == 'true' && 'true' || '' }} expression directly inside a run: shell command string. steps.*.outputs.* is an explicitly listed untrusted-input source. Offending line: echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"

Locations:

- `.github/actions/setup-node/action.yml:28`

### github-env-injection (severity: high)

The 'Calculate CACHE_KEY' step writes a value derived from a ${{ hashFiles(...) }} expression directly to $GITHUB_ENV without the required sanitization step (printf '%s' ... | tr -d '\n\r'). The expression is interpolated inline in the shell command before being echoed to $GITHUB_ENV.

Locations:

- `.github/actions/setup-node/action.yml:15`

### github-env-injection (severity: high)

The 'Calculate CACHE_HIT' step writes a value derived from ${{ steps.node-modules-restore.outputs.cache-hit }} — an untrusted steps.*.outputs.* source — directly to $GITHUB_ENV without the required sanitization step (printf '%s' ... | tr -d '\n\r'). A malicious cache-hit output value containing newlines could inject arbitrary environment variables.

Locations:

- `.github/actions/setup-node/action.yml:28`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed both findings in hardened/action/.github/actions/setup-node/action.yml:
1. 'Calculate CACHE_KEY' step: Moved ${{ hashFiles(...) }} into env: block as HASH_FILES, then sanitized with `printf '%s' "$HASH_FILES" | tr -d '\n\r'` before writing to $GITHUB_ENV.
2. 'Calculate CACHE_HIT' step: Moved ${{ steps.node-modules-restore.outputs.cache-hit == 'true' && 'true' || '' }} into env: block as CACHE_HIT_RAW, then sanitized with `printf '%s' "$CACHE_HIT_RAW" | tr -d '\n\r'` before writing to $GITHUB_ENV.
Both fixes address the script-injection and github-env-injection findings simultaneously by removing inline ${{ }} expressions from run: blocks and sanitizing values before writing to $GITHUB_ENV.

