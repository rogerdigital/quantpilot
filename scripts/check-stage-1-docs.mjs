import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const closeoutPath = new URL('../docs/architecture/stage-1-closeout.md', import.meta.url);
const readmePath = new URL('../README.md', import.meta.url);
const structurePath = new URL('../docs/architecture/project-structure.md', import.meta.url);

function readText(path) {
  return readFileSync(path, 'utf8');
}

const closeout = readText(closeoutPath);
const readme = readText(readmePath);
const structure = readText(structurePath);

const requiredCloseoutSections = [
  '## 目标',
  '## 完成定义',
  '## 明确非目标',
  '## 进入阶段 2 的前置条件',
  '## 验证基线',
];

for (const section of requiredCloseoutSections) {
  assert.ok(closeout.includes(section), `missing closeout section: ${section}`);
}

assert.ok(
  readme.includes('docs/architecture/stage-1-closeout.md'),
  'README.md must reference the stage 1 closeout document',
);

assert.ok(
  structure.includes('stage-1-closeout.md'),
  'project-structure.md must reference the stage 1 closeout document',
);

console.log('stage 1 documentation links are in sync');
