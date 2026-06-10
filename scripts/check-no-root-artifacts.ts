import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const blockedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function main() {
  const hits = readdirSync(repoRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => blockedExtensions.has(name.slice(name.lastIndexOf('.')).toLowerCase()))
    .sort();

  if (hits.length > 0) {
    console.error('Root-level image artifacts are not allowed.');
    console.error(
      'Tests or manual screenshot checks must write to test-results/ or clean up files after use.'
    );
    for (const hit of hits) {
      console.error(`- ${join('.', hit)}`);
    }
    process.exitCode = 1;
    return;
  }

  console.info('No root-level image artifacts found.');
}

main();
