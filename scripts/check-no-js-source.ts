import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const repoRoot = process.cwd();
const sourceRoots = ['apps', 'packages', 'scripts'];
const blockedExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs']);
const ignoredDirs = new Set(['node_modules', 'dist', 'coverage', '.git', '.vite']);

function walk(dirPath: string, hits: string[]) {
  const entries = readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;

    const absolutePath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(absolutePath, hits);
      continue;
    }

    const extension = entry.name.slice(entry.name.lastIndexOf('.'));
    if (blockedExtensions.has(extension)) {
      hits.push(relative(repoRoot, absolutePath));
    }
  }
}

function findTrackedJavaScriptFiles() {
  const output = execFileSync('git', ['ls-files', '*.js', '*.jsx', '*.mjs', '*.cjs'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  return output.split('\n').filter(Boolean);
}

function main() {
  const hits: string[] = [];
  const trackedHits = findTrackedJavaScriptFiles();

  for (const sourceRoot of sourceRoots) {
    walk(join(repoRoot, sourceRoot), hits);
  }

  const allHits = Array.from(new Set([...trackedHits, ...hits])).sort();

  if (allHits.length > 0) {
    console.error('JavaScript files are not allowed in first-party source or tracked files.');
    console.error('Migrate these files to TypeScript or remove generated artifacts from Git:');
    for (const hit of allHits) {
      console.error(`- ${hit}`);
    }
    process.exitCode = 1;
    return;
  }

  console.info('No JavaScript files found in first-party source roots or Git-tracked files.');
}

main();
