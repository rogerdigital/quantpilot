import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function readJson(pathname) {
  return JSON.parse(readFileSync(pathname, 'utf8'));
}

export function listWorkspacePaths(repoRoot, rootPackage) {
  const workspacePatterns = Array.isArray(rootPackage.workspaces) ? rootPackage.workspaces : [];
  const paths = [];

  workspacePatterns.forEach((pattern) => {
    if (!pattern.endsWith('/*')) {
      return;
    }

    const baseDir = pattern.slice(0, -2);
    const absoluteBaseDir = join(repoRoot, baseDir);

    if (!existsSync(absoluteBaseDir)) {
      return;
    }

    readdirSync(absoluteBaseDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .forEach((entry) => {
        paths.push(join(baseDir, entry.name));
      });
  });

  return paths
    .filter((workspacePath) => existsSync(join(repoRoot, workspacePath, 'package.json')))
    .sort();
}

export function listWorkspacePackages(repoRoot, rootPackage) {
  return listWorkspacePaths(repoRoot, rootPackage).map((workspacePath) => {
    const packageJsonPath = join(repoRoot, workspacePath, 'package.json');
    const manifest = readJson(packageJsonPath);
    return {
      path: workspacePath,
      packageJsonPath,
      manifest,
    };
  });
}
