import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const workspaces = [
  'apps/api',
  'apps/web',
  'packages/control-plane-runtime',
  'packages/control-plane-store',
  'packages/db',
  'packages/shared-types',
  'packages/task-workflow-engine',
  'packages/trading-engine',
  'packages/ui',
];

let hasErrors = false;

for (const ws of workspaces) {
  const tsconfigPath = resolve(ws, 'tsconfig.json');
  if (!existsSync(tsconfigPath)) continue;

  process.stdout.write(`── ${ws} ──\n`);
  try {
    execSync(`tsc --noEmit -p ${tsconfigPath}`, {
      stdio: 'inherit',
      timeout: 120_000,
    });
  } catch {
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exit(1);
}
