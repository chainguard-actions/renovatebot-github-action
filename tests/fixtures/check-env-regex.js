// Executed inside the container; verifies env-regex override filtering.
let failed = false;
const expect = { CUSTOM_FOO: 'custom-value', RENOVATE_TOKEN: 'test-token-123' };
for (const [k, v] of Object.entries(expect)) {
  console.log(`${k}=${process.env[k]}`);
  if (process.env[k] !== v) {
    console.log(`FAIL: expected ${k}='${v}'`);
    failed = true;
  }
}
for (const k of ['RENOVATE_SHOULD_NOT_PASS', 'LOG_LEVEL']) {
  console.log(`${k}=${process.env[k]}`);
  if (process.env[k] !== undefined) {
    console.log(`FAIL: ${k} should not be forwarded with custom env-regex`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log('PASS: env-regex override honored');
