import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { listWorkspacePackages, readJson } from './workspace-utils.js';

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
  const workspaces = listWorkspacePackages(repoRoot, rootPackage);
  const errors = [];
  const seenNames = new Map();

  workspaces.forEach(({ path: workspacePath, manifest }) => {
    if (!manifest.name || typeof manifest.name !== 'string') {
      errors.push(`${workspacePath} is missing a valid package name`);
      return;
    }

    if (seenNames.has(manifest.name)) {
      errors.push(`${workspacePath} duplicates workspace package name ${manifest.name} already used by ${seenNames.get(manifest.name)}`);
    } else {
      seenNames.set(manifest.name, workspacePath);
    }

    const lockPathEntry = lockPackages[workspacePath];
    if (!lockPathEntry) {
      errors.push(`${workspacePath} is missing from package-lock packages`);
    } else {
      if (lockPathEntry.name && lockPathEntry.name !== manifest.name) {
        errors.push(`${workspacePath} lockfile name mismatch: expected ${manifest.name}, found ${lockPathEntry.name}`);
      }
      if (typeof manifest.version === 'string' && manifest.version && lockPathEntry.version && lockPathEntry.version !== manifest.version) {
        errors.push(`${workspacePath} lockfile version mismatch: expected ${manifest.version}, found ${lockPathEntry.version}`);
      }
    }

    const lockLinkEntry = lockPackages[`node_modules/${manifest.name}`];
    if (!lockLinkEntry) {
      errors.push(`${workspacePath} is missing node_modules link entry for ${manifest.name}`);
    } else if (lockLinkEntry.resolved !== workspacePath || lockLinkEntry.link !== true) {
      errors.push(`${workspacePath} has invalid node_modules link entry for ${manifest.name}`);
    }
  });

  if (errors.length) {
    console.error('Workspace integrity check failed:');
    errors.forEach((entry) => console.error(`- ${entry}`));
    console.error('Run `npm install` and commit the updated package-lock.json after fixing workspace metadata.');
    process.exitCode = 1;
    return;
  }

  console.info(`Workspace integrity check passed for ${workspaces.length} workspace packages.`);
}

main();
