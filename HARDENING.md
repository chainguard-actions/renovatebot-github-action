<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.3.1

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.3.1** was hardened automatically. 2 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Sub-rule (a): Two `run:` blocks in `.github/actions/setup-node/action.yml` directly interpolate `${{ ... }}` expressions inside shell commands. (1) The 'Calculate CACHE_KEY' step embeds `${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}` directly in an `echo` command. (2) The 'Calculate CACHE_HIT' step embeds `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` directly in an `echo` command. Any `${{ ... }}` expression inside a `run:` block is a script-injection risk because the value is substituted by the template engine before the shell ever parses the string, allowing metacharacters to break out of the intended context. The `steps.*.outputs.*` context is also workflow-controllable and particularly dangerous.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:30`

### github-env-injection (severity: high)

Two `run:` blocks in `.github/actions/setup-node/action.yml` write values derived from `${{ ... }}` expressions directly to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`). (1) The 'Calculate CACHE_KEY' step writes `CACHE_KEY=node_modules-${{ hashFiles(...) }}` to `$GITHUB_ENV`. (2) The 'Calculate CACHE_HIT' step writes `CACHE_HIT=${{ steps.node-modules-restore.outputs.cache-hit == 'true' ... }}` to `$GITHUB_ENV`. The `steps.*.outputs.*` context is explicitly listed as an untrusted-input source. Writing unsanitized values to `$GITHUB_ENV` allows newline injection that can set arbitrary environment variables for subsequent steps.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:30`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed both findings in `.github/actions/setup-node/action.yml`:

1. **CACHE_KEY step**: Moved `${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}` into an `env:` block as `HASH_FILES`. The shell script now sanitizes the value with `printf '%s' "$HASH_FILES" | tr -d '\n\r'` before writing `CACHE_KEY=node_modules-${safe_hash}` to `$GITHUB_ENV`.

2. **CACHE_HIT step**: Moved `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` into an `env:` block as `CACHE_HIT_VALUE`. The shell script now sanitizes the value with `printf '%s' "$CACHE_HIT_VALUE" | tr -d '\n\r'` before writing `CACHE_HIT=${safe_cache_hit}` to `$GITHUB_ENV`.

Both fixes eliminate script-injection risk (no `${{ }}` expressions in `run:` blocks) and github-env-injection risk (values are sanitized before writing to `$GITHUB_ENV`).

