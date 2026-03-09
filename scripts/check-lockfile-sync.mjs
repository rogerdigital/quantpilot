import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const packageJsonPath = join(repoRoot, 'package.json');
const lockfilePath = join(repoRoot, 'package-lock.json');

function readJson(pathname) {
  return JSON.parse(readFileSync(pathname, 'utf8'));
}

function listWorkspacePaths(rootPackage) {
  const workspacePatterns = Array.isArray(rootPackage.workspaces) ? rootPackage.workspaces : [];
  const paths = [];

  workspacePatterns.forEach((pattern) => {
    if (pattern === 'apps/*') {
      paths.push('apps/api', 'apps/web', 'apps/worker');
    }
    if (pattern === 'packages/*') {
      paths.push('packages/shared-types', 'packages/trading-engine', 'packages/control-plane-store', 'packages/db');
    }
  });

  return paths.filter((workspacePath) => existsSync(join(repoRoot, workspacePath, 'package.json')));
}

function main() {
  if (!existsSync(packageJsonPath) || !existsSync(lockfilePath)) {
    throw new Error('package.json or package-lock.json is missing.');
  }

  const rootPackage = readJson(packageJsonPath);
  const lockfile = readJson(lockfilePath);
  const lockPackages = lockfile.packages || {};
  const workspacePaths = listWorkspacePaths(rootPackage);
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
