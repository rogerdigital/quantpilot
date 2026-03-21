import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const stage1CloseoutPath = new URL('../docs/architecture/stage-1-closeout.md', import.meta.url);
const stage2CloseoutPath = new URL('../docs/architecture/stage-2-closeout.md', import.meta.url);
const readmePath = new URL('../README.md', import.meta.url);
const structurePath = new URL('../docs/architecture/project-structure.md', import.meta.url);

function readText(path) {
  return readFileSync(path, 'utf8');
}

const stage1Closeout = readText(stage1CloseoutPath);
const stage2Closeout = readText(stage2CloseoutPath);
const readme = readText(readmePath);
const structure = readText(structurePath);

const requiredStage1Sections = [
  '## 目标',
  '## 完成定义',
  '## 明确非目标',
  '## 进入阶段 2 的前置条件',
  '## 验证基线',
];

const requiredStage2Sections = [
  '## 目标',
  '## 完成定义',
  '## 明确非目标',
  '## 进入阶段 3 的前置条件',
  '## 验证基线',
];

for (const section of requiredStage1Sections) {
  assert.ok(stage1Closeout.includes(section), `missing stage 1 closeout section: ${section}`);
}

for (const section of requiredStage2Sections) {
  assert.ok(stage2Closeout.includes(section), `missing stage 2 closeout section: ${section}`);
}

assert.ok(
  readme.includes('docs/architecture/stage-1-closeout.md'),
  'README.md must reference the stage 1 closeout document',
);
assert.ok(
  readme.includes('docs/architecture/stage-2-closeout.md'),
  'README.md must reference the stage 2 closeout document',
);

assert.ok(
  structure.includes('stage-1-closeout.md'),
  'project-structure.md must reference the stage 1 closeout document',
);
assert.ok(
  structure.includes('stage-2-closeout.md'),
  'project-structure.md must reference the stage 2 closeout document',
);

console.log('stage documentation links are in sync');
