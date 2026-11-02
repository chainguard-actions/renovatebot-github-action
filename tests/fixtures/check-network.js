// Executed inside the container; with --network none only loopback exists.
const os = require('os');
const names = Object.keys(os.networkInterfaces());
console.log(`interfaces=${names.join(',')}`);
const nonLo = names.filter((n) => n !== 'lo');
if (nonLo.length !== 0) {
  console.log('FAIL: expected only loopback interface with --network none');
  process.exit(1);
}
console.log('PASS: container attached to network none');
