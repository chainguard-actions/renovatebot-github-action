<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.2.5

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.2.5** was hardened automatically. 3 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Sub-rule (a): The 'Release' step in the release job directly interpolates `${{ steps.merge.outputs.commit }}` inside a `run:` shell command: `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}`. Any expression inside a run: block is a script-injection risk as it is substituted before the shell parses the command.

Sub-rule (b): The 'fetch pr' step uses unquoted shell variables `$GH_SHA` and `$GH_REF` (sourced from `github.sha` and `github.ref`) in `run: git fetch origin +$GH_SHA:$GH_REF`. The 'Merge main' step also uses unquoted `$GH_SHA` in `git merge --no-ff -Xtheirs -m "skip: merge ($GH_SHA) [skip release]" $GH_SHA`. Unquoted expansions of workflow-controllable env vars allow shell metacharacter injection.

Locations:

- `.github/workflows/build.yml:155`
- `.github/workflows/build.yml:130`
- `.github/workflows/build.yml:137`

### missing-permissions (severity: medium)

The workflow file .github/workflows/build.yml has no top-level `permissions:` key, and the following jobs also have no job-level `permissions:` key: `prepare`, `commitlint`, `lint`, `e2e`, `renovate-config-validator`, and `release`. Only the `lint-actions` job defines a job-level permissions block. Without explicit permissions, jobs inherit the default repository permissions (which may be broad), violating the principle of least privilege.

Locations:

- `.github/workflows/build.yml:1`

### github-env-injection (severity: high)

In .github/actions/setup-node/action.yml, the 'Calculate CACHE_HIT' step writes a value derived from `steps.node-modules-restore.outputs.cache-hit` (a `steps.*.outputs.*` source, which is in the untrusted-input list) directly to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`). The offending line is: `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"`. A malicious cache-hit output value containing newlines could inject arbitrary environment variables.

Locations:

- `.github/actions/setup-node/action.yml:31`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, missing-permissions, github-env-injection

**Notes:**

Fixed three security findings:

1. script-injection (build.yml):
   - 'fetch pr' step: Quoted $GH_SHA and $GH_REF in git fetch command to prevent shell metacharacter injection.
   - 'Merge main' step: Quoted $GH_SHA in git merge command.
   - 'Release' step: Moved ${{ steps.merge.outputs.commit }} from the run: shell string into an env: block as MERGE_COMMIT, referenced as "$MERGE_COMMIT" in the shell.

2. missing-permissions (build.yml): Added permissions blocks to all jobs lacking them: prepare (contents:read), commitlint (contents:read), lint (contents:read), e2e (contents:read), renovate-config-validator (contents:read), release (contents:write for pushing to release branch and creating releases).

3. github-env-injection (setup-node/action.yml): Fixed 'Calculate CACHE_HIT' step by moving the steps.node-modules-restore.outputs.cache-hit expression into an env: block as CACHE_HIT_RAW, then sanitizing with printf '%s' "$CACHE_HIT_RAW" | tr -d '\n\r' before writing to $GITHUB_ENV.

