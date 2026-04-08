// @ts-nocheck
import { execFileSync } from 'node:child_process';
import process from 'node:process';

function runGit(args) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

try {
  const root = runGit(['rev-parse', '--show-toplevel']);
  if (root !== process.cwd()) {
    process.chdir(root);
  }

  const currentHooksPath = runGit(['config', '--local', '--get', 'core.hooksPath']);
  if (currentHooksPath === '.githooks') {
    console.log('Git hooks already configured to use .githooks');
    process.exit(0);
  }
} catch {
  // Ignore missing config or non-git contexts and continue to installation attempt.
}

try {
  runGit(['config', '--local', 'core.hooksPath', '.githooks']);
  console.log('Configured git hooks path to .githooks');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`Skipping git hook installation: ${message}`);
}
