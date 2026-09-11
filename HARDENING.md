<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.3.0

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.3.0** was hardened automatically. 2 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Two `run:` blocks in the composite action directly interpolate `${{ ... }}` GitHub Actions expressions inside shell command strings (sub-rule a). (1) The 'Calculate CACHE_KEY' step interpolates `${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}` directly in the shell command: `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}' >> "$GITHUB_ENV"`. (2) The 'Calculate CACHE_HIT' step interpolates `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` directly in the shell command: `echo 'CACHE_HIT=${{ ... }}' >> "$GITHUB_ENV"`. Any `${{ ... }}` expression inside a `run:` block is a script-injection risk because the value is substituted by the YAML template engine before the shell ever sees it, bypassing shell quoting.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:30`

### github-env-injection (severity: high)

Two `run:` blocks write values derived from `${{ ... }}` expressions directly to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`). (1) The 'Calculate CACHE_KEY' step writes `CACHE_KEY=node_modules-${{ hashFiles(...) }}` to `$GITHUB_ENV` unsanitized (line 18). (2) The 'Calculate CACHE_HIT' step writes `CACHE_HIT=${{ steps.node-modules-restore.outputs.cache-hit ... }}` to `$GITHUB_ENV` unsanitized (line 32). The `steps.*.outputs.*` context is explicitly an untrusted input source. A newline injected into either value could define additional environment variables or override existing ones in subsequent steps.

Locations:

- `.github/actions/setup-node/action.yml:18`
- `.github/actions/setup-node/action.yml:32`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed both findings in .github/actions/setup-node/action.yml: (1) 'Calculate CACHE_KEY' step: moved ${{ hashFiles(...) }} into env.HASH, then sanitized with printf/tr before writing to $GITHUB_ENV. (2) 'Calculate CACHE_HIT' step: moved ${{ steps.node-modules-restore.outputs.cache-hit ... }} into env.CACHE_HIT_RAW, then sanitized with printf/tr before writing to $GITHUB_ENV. Both changes eliminate script-injection risk (no ${{ }} in run: blocks) and github-env-injection risk (values are sanitized before being written to $GITHUB_ENV).

