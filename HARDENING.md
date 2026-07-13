<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.1.19

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `1`

Action **renovatebot--github-action/v46.1.19** was hardened automatically. 4 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Sub-rule (a): Multiple ${{ }} expressions are interpolated directly inside run: shell command strings in the release job. (1) `run: git fetch origin +${{ github.sha }}:${{ github.ref }}` — github.sha and github.ref flow through YAML template substitution before the shell sees them. (2) `git merge --no-ff -Xtheirs -m 'skip: merge (${{ github.sha }}) [skip release]' ${{ github.sha }}` — github.sha directly in run block. (3) `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}` — steps output directly in run block.

Locations:

- `.github/workflows/build.yml:170`
- `.github/workflows/build.yml:175`
- `.github/workflows/build.yml:186`

### github-env-injection (severity: high)

The 'Configure renovate token' step writes secret-sourced env vars to $GITHUB_ENV without sanitization. RENOVATE_TOKEN and GITHUB_TOKEN are set from secrets via env: mapping, then written with `echo "RENOVATE_TOKEN=${RENOVATE_TOKEN}" >> $GITHUB_ENV` and `echo "RENOVATE_TOKEN=${GITHUB_TOKEN}" >> $GITHUB_ENV` — no `printf '%s' ... | tr -d '\n\r'` sanitization is applied before the write.

Locations:

- `.github/workflows/build.yml:107`
- `.github/workflows/build.yml:109`

### github-env-injection (severity: high)

The setup-node composite action writes ${{ }} expression values directly to $GITHUB_ENV without sanitization. (1) `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}' >> "$GITHUB_ENV"` — hashFiles output written directly. (2) `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"` — steps output written directly. Neither write is preceded by the required `printf '%s' ... | tr -d '\n\r'` sanitization.

Locations:

- `.github/actions/setup-node/action.yml:15`
- `.github/actions/setup-node/action.yml:26`

### permissions (severity: medium)

missing-permissions: build.yml has no top-level `permissions:` key, and most jobs (prepare, commitlint, lint, e2e, renovate-config-validator, release) have no job-level `permissions:` block. Only the lint-actions job defines permissions. Without explicit permissions, jobs run with the default token permissions which may be overly broad.

Locations:

- `.github/workflows/build.yml:1`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection, permissions

**Notes:**

Fixed all findings in build.yml and setup-node/action.yml:

1. script-injection (build.yml lines 170, 175, 186): Moved ${{ github.sha }}, ${{ github.ref }}, and ${{ steps.merge.outputs.commit }} out of run: shell strings into step env: blocks (GIT_SHA, GIT_REF, MERGE_COMMIT), then referenced as plain env vars in the shell scripts.

2. github-env-injection (build.yml lines 107, 109): In the 'Configure renovate token' step, replaced direct echo of secret values to GITHUB_ENV with sanitized writes using printf '%s' ... | tr -d '\n\r'.

3. github-env-injection (setup-node/action.yml lines 15, 26): Moved ${{ hashFiles(...) }} and ${{ steps.node-modules-restore.outputs.cache-hit ... }} expressions into env: blocks (CACHE_KEY_VALUE, CACHE_HIT_VALUE), then sanitized with printf/tr before writing to GITHUB_ENV.

4. permissions (build.yml): Added top-level 'permissions: {}' to deny all by default, then added job-level permissions: contents: read for prepare, commitlint, lint, e2e, and renovate-config-validator jobs; contents: write for the release job (needs to push branch and create releases). The lint-actions job already had security-events: write.

