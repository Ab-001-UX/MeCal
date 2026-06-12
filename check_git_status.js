const { execSync } = require('child_process');

try {
  console.log('--- GIT TRACKED FILES CONTAINING .env ---');
  const tracked = execSync('git ls-files').toString();
  const envFiles = tracked.split('\n').filter(f => f.includes('.env'));
  console.log(envFiles.length ? envFiles : 'No .env files tracked in the index.');

  console.log('\n--- GIT STATUS ---');
  console.log(execSync('git status -s').toString());

  console.log('\n--- PAST COMMITS CONTAINING .env ---');
  const commits = execSync('git log --all --name-only --oneline').toString();
  const envCommits = commits.split('\n').filter(line => line.includes('.env'));
  console.log(envCommits.slice(0, 10));
} catch (err) {
  console.error('Git Command failed:', err.message);
  if (err.stdout) console.log('Stdout:', err.stdout.toString());
  if (err.stderr) console.error('Stderr:', err.stderr.toString());
}
