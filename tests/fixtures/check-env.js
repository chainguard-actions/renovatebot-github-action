// Executed inside the container (node image entrypoint runs non-executable
// files with node). Verifies the env vars the action passes through.
const expect = {
  RENOVATE_TOKEN: 'test-token-123',
  RENOVATE_TEST_VALUE: 'hello-renovate',
  MY_EXTRA_VAR: 'extra-value',
  LOG_LEVEL: 'debug',
};
let failed = false;
for (const [k, v] of Object.entries(expect)) {
  const actual = process.env[k];
  console.log(`${k}=${actual}`);
  if (actual !== v) {
    console.log(`FAIL: expected ${k}='${v}'`);
    failed = true;
  }
}
if (process.env.NOT_PASSED_VAR !== undefined) {
  console.log('FAIL: NOT_PASSED_VAR should not be forwarded');
  failed = true;
}
if (failed) process.exit(1);
console.log('PASS: environment forwarded correctly');
