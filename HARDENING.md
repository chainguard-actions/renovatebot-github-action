<!-- markdownlint-disable -->

# Hardening Report: renovatebot--github-action/v46.3.15

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **renovatebot--github-action/v46.3.15** was hardened automatically. 0 finding(s) were identified and resolved across 1 iteration(s).

## Iteration Notes

### Iteration 1

**Fixes applied:** script-injection

**Notes:**

In .github/actions/setup-node/action.yml, I moved the hashFiles(...) expression from the 'Calculate CACHE_KEY' step into a new env var, CACHE_KEY_HASH. I moved the cache-hit expression from the 'Calculate CACHE_HIT' step into a new env var, CACHE_HIT_VALUE. Both scripts now strip newlines from the quoted variable and write the same CACHE_KEY / CACHE_HIT value to $GITHUB_ENV as before. Nothing was run to test this.

