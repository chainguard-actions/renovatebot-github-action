<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.3.13

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.3.13** was hardened automatically. 2 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Sub-rule (a): a ${{ }} expression is placed directly in a run: script in the internal composite action. Offending line: `echo 'CACHE_KEY=node_modules-${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}' >> "$GITHUB_ENV"`. The value is a computed hash, so the real risk is low. The rule still forbids any direct expression in a run block. Compute the key in an env: entry and refer to it as a quoted shell variable instead.

Locations:

- `.github/actions/setup-node/action.yml:16`

### script-injection (severity: high)

Sub-rule (a): a ${{ }} expression is placed directly in a run: script. Offending line: `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"`. It reads steps.*.outputs.* through template substitution. Move the value into an env: variable (e.g. CACHE_HIT_OUT: ${{ steps.node-modules-restore.outputs.cache-hit }}) and check it with a quoted shell expansion.

Locations:

- `.github/actions/setup-node/action.yml:31`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection

**Notes:**

In .github/actions/setup-node/action.yml, the hashFiles() result now goes into FILES_HASH in env:. Newlines are stripped from it before CACHE_KEY is written to GITHUB_ENV. The cache-hit output now goes into CACHE_HIT_OUT in env:. A quoted shell check sets CACHE_HIT to 'true' or '', which matches the original expression.

