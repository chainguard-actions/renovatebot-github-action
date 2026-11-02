// Executed inside the container; verifies the --user passed via docker-user.
const uid = process.getuid();
const gid = process.getgid();
console.log(`uid=${uid} gid=${gid}`);
if (uid !== 1234 || gid !== 1234) {
  console.log('FAIL: expected uid=1234 gid=1234');
  process.exit(1);
}
console.log('PASS: container runs as docker-user');
