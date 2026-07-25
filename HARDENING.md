<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.1.18

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.1.18** was hardened automatically. 4 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Sub-rule (a): ${{ }} expressions are interpolated directly inside run: shell command strings in the 'release' job. (1) 'fetch pr' step: `run: git fetch origin +${{ github.sha }}:${{ github.ref }}` — both github.sha and github.ref are injected directly into the shell command. (2) 'Merge main' step: `git merge --no-ff -Xtheirs -m 'skip: merge (${{ github.sha }}) [skip release]' ${{ github.sha }}` — github.sha is injected directly. (3) 'Release' step: `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}` — steps.merge.outputs.commit is injected directly. Any of these values could contain shell metacharacters that are interpreted before the shell ever sees them.

Locations:

- `.github/workflows/build.yml:145`
- `.github/workflows/build.yml:150`
- `.github/workflows/build.yml:162`

### script-injection (severity: high)

Sub-rule (a): ${{ }} expressions are interpolated directly inside run: shell command strings in the composite setup-node action. (1) 'Calculate CACHE_KEY' step writes `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}' >> "$GITHUB_ENV"` — the ${{ }} expression is expanded inline in the shell command. (2) 'Calculate CACHE_HIT' step writes `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"` — the ${{ }} expression including steps.*.outputs.* is expanded inline in the shell command.

Locations:

- `.github/actions/setup-node/action.yml:15`
- `.github/actions/setup-node/action.yml:28`

### github-env-injection (severity: high)

The composite setup-node action writes values derived from ${{ }} expressions directly to $GITHUB_ENV without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`). (1) 'Calculate CACHE_KEY' step: `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}' >> "$GITHUB_ENV"` — the hashFiles() result is written unsanitized. (2) 'Calculate CACHE_HIT' step: `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"` — steps.node-modules-restore.outputs.cache-hit (a steps.*.outputs.* value, which is an untrusted source per the check scope) is written unsanitized. A newline injected into either value could define additional environment variables.

Locations:

- `.github/actions/setup-node/action.yml:15`
- `.github/actions/setup-node/action.yml:28`

### missing-permissions (severity: medium)

build.yml has no top-level `permissions:` key, and the following jobs also have no job-level `permissions:` key: prepare, commitlint, lint, e2e, renovate-config-validator, release. Only the lint-actions job defines job-level permissions. Without explicit permissions, jobs inherit the default repository token permissions, which may be overly broad (e.g. write access to contents). The release job in particular pushes to the repository and performs a semantic release, making it especially important to scope its token permissions explicitly.

Locations:

- `.github/workflows/build.yml:1`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection, missing-permissions

**Notes:**

Fixed all four findings:

1. **script-injection (build.yml)**: Moved all three ${{ }} expressions out of run: shell strings into env: blocks. 'fetch pr' step: GIT_SHA and GIT_REF env vars replace github.sha/github.ref inline. 'Merge main' step: GIT_SHA env var replaces github.sha inline. 'Release' step: MERGE_COMMIT env var replaces steps.merge.outputs.commit inline.

2. **script-injection (setup-node/action.yml)**: Moved hashFiles() result into HASH_FILES env var and cache-hit expression into CACHE_HIT_RAW env var, removing all ${{ }} from run: shell strings.

3. **github-env-injection (setup-node/action.yml)**: Both GITHUB_ENV writes now sanitize values through `printf '%s' "$VAR" | tr -d '\n\r'` before writing, preventing newline injection attacks.

4. **missing-permissions (build.yml)**: Added top-level `permissions: {}` to deny all by default. Added job-level permissions: prepare/commitlint/lint/e2e/renovate-config-validator get `contents: read`; release gets `contents: write` (needed to push to the release branch and perform semantic release). The lint-actions job already had `security-events: write`.

