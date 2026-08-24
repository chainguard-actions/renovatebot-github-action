<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.2.3

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.2.3** was hardened automatically. 4 finding(s) were identified and resolved across 2 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Rule (a): ${{ }} expressions are interpolated directly inside run: shell command strings in the composite setup-node action. Step 'Calculate CACHE_KEY' uses `echo 'CACHE_KEY=node_modules-${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}'` and step 'Calculate CACHE_HIT' uses `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}'`. Any ${{ ... }} expression inside a run: block is a script-injection risk because the value is substituted by the template engine before the shell ever sees it, allowing metacharacters to break out of the intended context.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:28`

### script-injection (severity: high)

Rule (a): The 'Release' step in build.yml interpolates `${{ steps.merge.outputs.commit }}` directly inside a run: shell command string: `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}`. The steps.*.outputs.* context is workflow-controllable and must never be interpolated directly into a run: block; it should be passed via an env: variable and double-quoted.

Locations:

- `.github/workflows/build.yml:130`

### github-env-injection (severity: high)

The composite setup-node action writes values derived from ${{ }} expressions directly to $GITHUB_ENV without the required sanitization step (printf '%s' ... | tr -d '\n\r'). Step 'Calculate CACHE_KEY' writes `CACHE_KEY=node_modules-${{ hashFiles(...) }}` to $GITHUB_ENV, and step 'Calculate CACHE_HIT' writes `CACHE_HIT=${{ steps.node-modules-restore.outputs.cache-hit == 'true' && 'true' || '' }}` to $GITHUB_ENV. An attacker who can influence these values could inject newlines to set arbitrary environment variables for subsequent steps.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:28`

### missing-permissions (severity: medium)

The build.yml workflow has no top-level `permissions:` key, and the majority of its jobs (prepare, commitlint, lint, e2e, renovate-config-validator, release) have no job-level `permissions:` block either. Only the `lint-actions` job defines permissions (security-events: write). Without explicit permissions, jobs run with the default token permissions, which may be broader than necessary. A top-level `permissions: {}` or explicit per-job permissions should be added.

Locations:

- `.github/workflows/build.yml:1`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection, missing-permissions

**Notes:**

Fixed all four findings:
1. setup-node/action.yml - 'Calculate CACHE_KEY' step: moved hashFiles() expression to env: CACHE_KEY_HASH, sanitized with tr -d '\n\r' before writing to GITHUB_ENV.
2. setup-node/action.yml - 'Calculate CACHE_HIT' step: moved cache-hit ternary expression to env: CACHE_HIT_VALUE, sanitized before writing to GITHUB_ENV.
3. build.yml - 'Release' step: moved steps.merge.outputs.commit to env: MERGE_COMMIT, referenced as "$MERGE_COMMIT" in shell.
4. build.yml - Added top-level 'permissions: {}' and per-job permissions: contents: read for prepare/commitlint/lint/e2e/renovate-config-validator, contents: write for release (needed for git push and semantic-release), lint-actions already had security-events: write.

### Iteration 2

**Fixes applied:** script-injection

**Notes:**

Fixed two unquoted variable usages in hardened/action/.github/workflows/build.yml:
1. 'fetch pr' step (line 130): Changed `git fetch origin +$GH_SHA:$GH_REF` to `git fetch origin "+$GH_SHA:$GH_REF"` — the entire git refspec is now double-quoted.
2. 'Merge main' step (line 137): Changed the trailing `$GH_SHA` to `"$GH_SHA"` in the git merge command.
Both variables were already correctly routed through the env: block; only the quoting in the shell script was missing.

