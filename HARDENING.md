<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.2.0

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.2.0** was hardened automatically. 4 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Three run: steps in the 'release' job directly interpolate ${{ }} expressions inside shell commands, violating rule (a). (1) 'fetch pr' step: `run: git fetch origin +${{ github.sha }}:${{ github.ref }}` — both github.sha and github.ref are interpolated directly. (2) 'Merge main' step: `git merge --no-ff -Xtheirs -m 'skip: merge (${{ github.sha }}) [skip release]' ${{ github.sha }}` — github.sha interpolated directly. (3) 'Release' step: `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}` — steps.merge.outputs.commit interpolated directly. Any ${{ ... }} inside a run: block is a script-injection risk regardless of the context.

Locations:

- `.github/workflows/build.yml:175`
- `.github/workflows/build.yml:180`
- `.github/workflows/build.yml:191`

### script-injection (severity: high)

Two run: steps in the composite setup-node action directly interpolate ${{ }} expressions inside shell commands, violating rule (a). (1) 'Calculate CACHE_KEY' step: `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}'` — hashFiles() expression interpolated directly in run: block. (2) 'Calculate CACHE_HIT' step: `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}'` — steps.*.outputs.* expression interpolated directly in run: block.

Locations:

- `.github/actions/setup-node/action.yml:16`
- `.github/actions/setup-node/action.yml:31`

### github-env-injection (severity: high)

Two run: steps in the composite setup-node action write values derived from ${{ }} expressions (including steps.*.outputs.* which is an untrusted-input source) to $GITHUB_ENV without the required sanitization step (printf '%s' ... | tr -d '\n\r'). (1) 'Calculate CACHE_KEY' step writes `${{ hashFiles(...) }}` result to $GITHUB_ENV. (2) 'Calculate CACHE_HIT' step writes `${{ steps.node-modules-restore.outputs.cache-hit }}` result to $GITHUB_ENV. Neither write is preceded by the required sanitization pipeline.

Locations:

- `.github/actions/setup-node/action.yml:18`
- `.github/actions/setup-node/action.yml:33`

### missing-permissions (severity: medium)

build.yml has no top-level permissions: key, and the majority of jobs (prepare, commitlint, lint, e2e, renovate-config-validator, release) have no job-level permissions: key either. Only the lint-actions job defines a permissions block. Without explicit permissions, jobs inherit the default repository token permissions, which may be overly broad. Each job should declare minimal required permissions.

Locations:

- `.github/workflows/build.yml:1`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection, missing-permissions

**Notes:**

Fixed all four findings:

1. script-injection (build.yml, 3 locations): Moved all ${{ }} expressions in run: blocks to step-level env: vars. 'fetch pr' step uses GIT_SHA/GIT_REF env vars; 'Merge main' step uses GIT_SHA env var; 'Release' step uses MERGE_COMMIT env var.

2. script-injection (setup-node/action.yml, 2 locations): 'Calculate CACHE_KEY' step moves hashFiles() result to HASH_FILES env var; 'Calculate CACHE_HIT' step moves cache-hit expression to CACHE_HIT_RAW env var.

3. github-env-injection (setup-node/action.yml, 2 locations): Both GITHUB_ENV writes now sanitize values with `printf '%s' "$VAR" | tr -d '\n\r'` before writing.

4. missing-permissions (build.yml): Added explicit permissions blocks to all jobs — prepare/lint/renovate-config-validator get `contents: read`; commitlint gets `contents: read, pull-requests: read`; lint-actions gets `contents: read` added to existing block; e2e gets `contents: read, packages: read`; release gets `contents: write, id-token: write`.

