<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.3.5

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.3.5** was hardened automatically. 4 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Rule (a): A `${{ ... }}` expression is directly interpolated inside a `run:` shell command string. In the 'Calculate CACHE_KEY' step, `${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}` is embedded directly in the echo command. Any `${{ ... }}` expression inside a `run:` block is a script-injection risk because YAML template substitution occurs before the shell ever sees the value. The value should be passed via an `env:` variable and then referenced as a quoted shell variable.

Locations:

- `.github/actions/setup-node/action.yml:15`

### script-injection (severity: high)

Rule (a): A `${{ ... }}` expression is directly interpolated inside a `run:` shell command string. In the 'Calculate CACHE_HIT' step, `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` is embedded directly in the echo command. `steps.*.outputs.*` is an explicitly untrusted source per the check rules. The value should be passed via an `env:` variable and then referenced as a quoted shell variable.

Locations:

- `.github/actions/setup-node/action.yml:29`

### github-env-injection (severity: high)

A value derived from a `${{ ... }}` expression is written directly to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`). In the 'Calculate CACHE_KEY' step, `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}' >> "$GITHUB_ENV"` writes the unsanitized expression result to the environment file. An attacker who can influence the hash input filenames could inject newlines to set arbitrary environment variables.

Locations:

- `.github/actions/setup-node/action.yml:15`

### github-env-injection (severity: high)

A value derived from `steps.node-modules-restore.outputs.cache-hit` (an explicitly untrusted `steps.*.outputs.*` source) is written directly to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`). In the 'Calculate CACHE_HIT' step, `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"` writes the unsanitized value to the environment file, allowing newline injection to set arbitrary environment variables.

Locations:

- `.github/actions/setup-node/action.yml:29`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed all four findings in hardened/action/.github/actions/setup-node/action.yml:
1. 'Calculate CACHE_KEY' step: Moved ${{ hashFiles('.node-version', 'pnpm-lock.yaml') }} into an env: block as HASH_FILES, then sanitized with `printf '%s' "$HASH_FILES" | tr -d '\n\r'` before writing to $GITHUB_ENV.
2. 'Calculate CACHE_HIT' step: Moved ${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }} into an env: block as CACHE_HIT_VALUE, then sanitized with `printf '%s' "$CACHE_HIT_VALUE" | tr -d '\n\r'` before writing to $GITHUB_ENV.

