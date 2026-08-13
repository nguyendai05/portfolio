import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function resolveGitDirectory() {
  const dotGit = path.resolve('.git');
  const stat = fs.statSync(dotGit);
  if (stat.isDirectory()) return dotGit;
  const pointer = fs.readFileSync(dotGit, 'utf8').trim();
  if (!pointer.startsWith('gitdir:')) throw new Error('Unsupported .git pointer');
  return path.resolve(path.dirname(dotGit), pointer.slice('gitdir:'.length).trim());
}

function readCommit() {
  const gitDir = resolveGitDirectory();
  const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
  if (!head.startsWith('ref:')) return head;
  const ref = head.slice('ref:'.length).trim();
  const looseRef = path.join(gitDir, ...ref.split('/'));
  if (fs.existsSync(looseRef)) return fs.readFileSync(looseRef, 'utf8').trim();
  const packed = fs.readFileSync(path.join(gitDir, 'packed-refs'), 'utf8');
  const match = packed.split(/\r?\n/).find((line) => line.endsWith(` ${ref}`));
  if (!match) throw new Error(`Could not resolve Git ref ${ref}`);
  return match.split(' ')[0];
}

const lock = fs.readFileSync('package-lock.json');
const npmVersion = process.env.npm_config_user_agent?.match(/(?:^|\s)npm\/([^\s]+)/)?.[1] || 'unknown';
const baseline = {
  capturedAt: new Date().toISOString(),
  commit: readCommit(),
  node: process.version,
  npm: npmVersion,
  packageLockSha256: crypto.createHash('sha256').update(lock).digest('hex'),
};
fs.mkdirSync('artifacts/baseline', { recursive: true });
fs.writeFileSync('artifacts/baseline/environment.json', `${JSON.stringify(baseline, null, 2)}\n`);
console.log(JSON.stringify(baseline, null, 2));
