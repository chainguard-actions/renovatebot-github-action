<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.1.20

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.1.20** was hardened automatically. 2 finding(s) were identified and resolved across 2 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Sub-rule (a): GitHub Actions expressions are interpolated directly inside run: shell command strings in the release job of build.yml.

1. 'fetch pr' step: `run: git fetch origin +${{ github.sha }}:${{ github.ref }}` — both github.sha and github.ref are injected directly into the shell command.

2. 'Merge main' step: `git merge --no-ff -Xtheirs -m 'skip: merge (${{ github.sha }}) [skip release]' ${{ github.sha }}` — github.sha is injected directly.

3. 'Release' step: `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}` — steps.merge.outputs.commit (a step output, which is a workflow-controllable context) is injected directly into the shell.

All three cases allow YAML template substitution to inject arbitrary shell metacharacters before the shell ever parses the command. These values should be passed via env: variables and referenced as $ENV_VAR instead.

Locations:

- `.github/workflows/build.yml:149`
- `.github/workflows/build.yml:153`
- `.github/workflows/build.yml:163`

### missing-permissions (severity: medium)

build.yml has no top-level permissions: key, and the following jobs also have no job-level permissions: block: prepare, commitlint, lint, e2e, renovate-config-validator, release. Only the lint-actions job defines its own permissions (security-events: write). Without explicit permissions, jobs inherit the default repository token permissions, which may be overly broad. A top-level `permissions: {}` or per-job minimal permissions should be added.

Locations:

- `.github/workflows/build.yml:1`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, missing-permissions

**Notes:**

Fixed script-injection in build.yml release job: moved github.sha, github.ref, and steps.merge.outputs.commit from inline ${{ }} expressions in run: commands to env: blocks, referencing them as $GIT_SHA, $GIT_REF, and $MERGE_COMMIT respectively. Added top-level `permissions: {}` and per-job permissions: contents: read for prepare/commitlint/lint/e2e/renovate-config-validator, contents: read + security-events: write for lint-actions, and contents: write + id-token: write for the release job.

### Iteration 1

**Fixes applied:** script-injection, github-env-injection

**Notes:**

Fixed both findings in hardened/action/.github/actions/setup-node/action.yml:

1. script-injection: Moved both ${{ }} expressions out of run: shell strings into env: blocks. Step 'Calculate CACHE_KEY' now uses HASH_FILES env var; step 'Calculate CACHE_HIT' now uses CACHE_HIT_EXPR env var. Shell scripts reference these as plain $VAR expansions.

2. github-env-injection: Both GITHUB_ENV writes now sanitize values with `safe=$(printf '%s' "..." | tr -d '\n\r')` before writing `echo "VAR=${safe}" >> "$GITHUB_ENV"`, preventing newline injection of additional environment variables.

