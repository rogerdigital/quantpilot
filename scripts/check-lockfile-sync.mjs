import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { listWorkspacePaths, readJson } from './workspace-utils.mjs';

const repoRoot = process.cwd();
const packageJsonPath = join(repoRoot, 'package.json');
const lockfilePath = join(repoRoot, 'package-lock.json');

function main() {
  if (!existsSync(packageJsonPath) || !existsSync(lockfilePath)) {
    throw new Error('package.json or package-lock.json is missing.');
  }

  const rootPackage = readJson(packageJsonPath);
  const lockfile = readJson(lockfilePath);
  const lockPackages = lockfile.packages || {};
  const workspacePaths = listWorkspacePaths(repoRoot, rootPackage);
  const missing = [];

  workspacePaths.forEach((workspacePath) => {
    const packageEntry = lockPackages[workspacePath];

    if (!packageEntry) {
      missing.push(`${workspacePath} missing from package-lock packages`);
    }
  });

  if (missing.length) {
    console.error('Lockfile is out of sync with workspace packages:');
    missing.forEach((entry) => console.error(`- ${entry}`));
    console.error('Run `npm install` and commit the updated package-lock.json.');
    process.exitCode = 1;
    return;
  }

  console.info(`Lockfile sync check passed for ${workspacePaths.length} workspace packages.`);
}

main();
