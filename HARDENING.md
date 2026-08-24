<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.2.4

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.2.4** was hardened automatically. 6 finding(s) were identified and resolved across 2 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Rule (a): A `${{ ... }}` expression is directly interpolated inside a `run:` shell command string in the '⚙️ Calculate `CACHE_KEY`' step. The expression `${{ hashFiles('.node-version', 'pnpm-lock.yaml') }}` is embedded directly in the echo command: `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}' >> "$GITHUB_ENV"`. Any `${{ ... }}` in a run: block is a script-injection risk because YAML template substitution occurs before the shell ever sees the string.

Locations:

- `.github/actions/setup-node/action.yml:16`

### script-injection (severity: high)

Rule (a): A `${{ ... }}` expression is directly interpolated inside a `run:` shell command string in the 'Calculate `CACHE_HIT`' step. The expression `${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}` — which reads from `steps.*.outputs.*`, an explicitly untrusted context — is embedded directly in the echo command: `echo 'CACHE_HIT=${{ ... }}' >> "$GITHUB_ENV"`. This allows injection of arbitrary content into the shell command before execution.

Locations:

- `.github/actions/setup-node/action.yml:29`

### script-injection (severity: high)

Rule (a): A `${{ steps.merge.outputs.commit }}` expression (from the `steps.*.outputs.*` untrusted context) is directly interpolated inside the 'Release' job's `run:` shell command: `export GITHUB_REF=refs/heads/release GITHUB_SHA=${{ steps.merge.outputs.commit }}`. YAML template substitution injects this value into the shell command string before the shell executes it, enabling script injection.

Locations:

- `.github/workflows/build.yml:167`

### github-env-injection (severity: high)

The '⚙️ Calculate `CACHE_KEY`' step writes a value derived from a `${{ ... }}` expression directly to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`). The offending line is: `echo 'CACHE_KEY=node_modules-${{ hashFiles(...) }}' >> "$GITHUB_ENV"`. Although `hashFiles()` is GitHub-controlled, the value is still written to the environment file without newline sanitization, which could allow environment variable injection if the hash output were ever manipulated.

Locations:

- `.github/actions/setup-node/action.yml:16`

### github-env-injection (severity: high)

The 'Calculate `CACHE_HIT`' step writes a value derived from `${{ steps.node-modules-restore.outputs.cache-hit }}` (an explicitly untrusted `steps.*.outputs.*` source) directly to `$GITHUB_ENV` without the required sanitization step (`printf '%s' ... | tr -d '\n\r'`). The offending line is: `echo 'CACHE_HIT=${{ (steps.node-modules-restore.outputs.cache-hit == 'true') && 'true' || '' }}' >> "$GITHUB_ENV"`. A malicious cache-hit output value containing newlines could inject additional environment variables.

Locations:

- `.github/actions/setup-node/action.yml:29`

### missing-permissions (severity: medium)

The workflow file `build.yml` has no top-level `permissions:` key, and the following jobs also lack job-level `permissions:` blocks: `prepare`, `commitlint`, `lint`, `e2e`, `renovate-config-validator`, and `release`. Only the `lint-actions` job has a job-level `permissions:` block. Without explicit permissions, jobs run with the repository's default token permissions, which may be overly broad (e.g., write access to contents and pull-requests on public repositories).

Locations:

- `.github/workflows/build.yml:1`

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection, github-env-injection, missing-permissions

**Notes:**

Fixed 6 findings across 2 files:

1. setup-node/action.yml - CACHE_KEY step: Moved `${{ hashFiles(...) }}` to env block as HASH_FILES, added `printf '%s' "$HASH_FILES" | tr -d '\n\r'` sanitization before writing to GITHUB_ENV.

2. setup-node/action.yml - CACHE_HIT step: Moved `${{ steps.node-modules-restore.outputs.cache-hit ... }}` to env block as CACHE_HIT_VALUE, added sanitization before writing to GITHUB_ENV.

3. build.yml - Release step: Moved `${{ steps.merge.outputs.commit }}` to env block as MERGE_COMMIT, referenced as `"$MERGE_COMMIT"` in the shell script.

4. build.yml - Added top-level `permissions: {}` and job-level permissions for all jobs lacking them: prepare/commitlint/lint/e2e/renovate-config-validator get `contents: read`; release gets `contents: write` (needed to push to release branch and create GitHub releases).

### Iteration 2

**Fixes applied:** script-injection

**Notes:**

Fixed two unquoted shell variable expansions in hardened/action/.github/workflows/build.yml:
1. 'fetch pr' step (line ~191): Quoted the refspec argument to git fetch: `git fetch origin "+$GH_SHA:$GH_REF"` — prevents word-splitting and glob expansion of the combined refspec string.
2. 'Merge main' step (line ~199): Quoted the trailing SHA argument to git merge: `"$GH_SHA"` — prevents word-splitting and glob expansion of the commit SHA passed as a positional argument.

