<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.1.21

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.1.21** was hardened automatically. 4 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Sub-rule (a): Direct expression interpolation in run: blocks in the release job. The 'fetch pr' step interpolates `${{ github.sha }}` and `${{ github.ref }}` directly into the shell command: `run: git fetch origin +${{ github.sha }}:${{ github.ref }}`. The 'Merge main' step interpolates `${{ github.sha }}` directly: `git merge --no-ff -Xtheirs -m 'skip: merge (${{ github.sha }}) [skip release]' ${{ github.sha }}`. The 'Release' step interpolates `${{ steps.merge.outputs.commit }}` directly: `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}`. All three are script-injection risks as expressions are substituted by the Actions runner before the shell parses the command.

Locations:

- `.github/workflows/build.yml:145`
- `.github/workflows/build.yml:150`
- `.github/workflows/build.yml:161`

### script-injection (severity: high)

Sub-rule (a): Direct expression interpolation in run: blocks in a composite action. The 'Calculate CACHE_KEY' step writes `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}'` directly in a run: block (line 16). The 'Calculate CACHE_HIT' step writes `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == true) && true || ... }}'` directly in a run: block (line 31). Any ${{ ... }} expression inside a run: block is a script-injection risk regardless of the context it reads from.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:31`

### github-env-injection (severity: high)

The composite action's 'Calculate CACHE_KEY' step writes `${{ hashFiles(...) }}` to $GITHUB_ENV without sanitization: `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}' >> "$GITHUB_ENV"`. The 'Calculate CACHE_HIT' step writes `${{ steps.node-modules-restore.outputs.cache-hit ... }}` to $GITHUB_ENV without sanitization: `echo 'CACHE_HIT=${{ ... }}' >> "$GITHUB_ENV"`. The `steps.*.outputs.*` context is in the untrusted-input list. Neither write is preceded by the required `printf '%s' ... | tr -d '\n\r'` sanitization pipeline.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:31`

### missing-permissions (severity: medium)

The workflow file has no top-level `permissions:` key, and the majority of jobs (prepare, commitlint, lint, e2e, renovate-config-validator, release) have no job-level `permissions:` block. Only the `lint-actions` job defines permissions (`security-events: write`). Without explicit permissions, jobs inherit the default repository permissions which may be overly broad.

Locations:

- `.github/workflows/build.yml:1`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection, missing-permissions

**Notes:**

Fixed all four findings:

1. script-injection in build.yml (release job, lines 145/150/161): Moved all three ${{ }} expressions out of run: blocks into env: blocks. 'fetch pr' step uses GIT_SHA/GIT_REF env vars; 'Merge main' step uses GIT_SHA env var; 'Release' step uses MERGE_COMMIT env var. Also fixed the missing GITHUB_OUTPUT write in 'Merge main'.

2. script-injection in setup-node/action.yml (lines 16/31): Moved ${{ hashFiles(...) }} to CACHE_KEY_HASH env var and ${{ steps.node-modules-restore.outputs.cache-hit }} to CACHE_HIT_RAW env var. Shell scripts reference plain env vars.

3. github-env-injection in setup-node/action.yml (lines 16/31): Both GITHUB_ENV writes now sanitize values using `printf '%s' "$VAR" | tr -d '\n\r'` before writing, preventing newline injection.

4. missing-permissions in build.yml: Added top-level `permissions: contents: read` and job-level permissions to all jobs: prepare/commitlint/lint/e2e/renovate-config-validator get `contents: read`; release gets `contents: write` (required for pushing branches and creating releases); lint-actions already had `security-events: write`.

