import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const stage1CloseoutPath = new URL('../docs/architecture/stage-1-closeout.md', import.meta.url);
const stage2CloseoutPath = new URL('../docs/architecture/stage-2-closeout.md', import.meta.url);
const stage3CloseoutPath = new URL('../docs/architecture/stage-3-closeout.md', import.meta.url);
const stage4CloseoutPath = new URL('../docs/architecture/stage-4-closeout.md', import.meta.url);
const stage5CloseoutPath = new URL('../docs/architecture/stage-5-closeout.md', import.meta.url);
const stage6CloseoutPath = new URL('../docs/architecture/stage-6-closeout.md', import.meta.url);
const stage7CloseoutPath = new URL('../docs/architecture/stage-7-closeout.md', import.meta.url);
const readmePath = new URL('../README.md', import.meta.url);
const structurePath = new URL('../docs/architecture/project-structure.md', import.meta.url);

function readText(path) {
  return readFileSync(path, 'utf8');
}

const stage1Closeout = readText(stage1CloseoutPath);
const stage2Closeout = readText(stage2CloseoutPath);
const stage3Closeout = readText(stage3CloseoutPath);
const stage4Closeout = readText(stage4CloseoutPath);
const stage5Closeout = readText(stage5CloseoutPath);
const stage6Closeout = readText(stage6CloseoutPath);
const stage7Closeout = readText(stage7CloseoutPath);
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

const requiredStage3Sections = [
  '## 目标',
  '## 完成定义',
  '## 明确非目标',
  '## 进入阶段 4 的前置条件',
  '## 验证基线',
];

const requiredStage4Sections = [
  '## 目标',
  '## 完成定义',
  '## 明确非目标',
  '## 进入阶段 5 的前置条件',
  '## 验证基线',
];

const requiredStage5Sections = [
  '## 目标',
  '## 完成定义',
  '## 明确非目标',
  '## 进入阶段 6 的前置条件',
  '## 验证基线',
];

const requiredStage6Sections = [
  '## 目标',
  '## 完成定义',
  '## 明确非目标',
  '## 后续扩展前提',
  '## 验证基线',
];

const requiredStage7Sections = [
  '## 目标',
  '## 完成定义',
  '## 明确非目标',
  '## 后续扩展前提',
];

for (const section of requiredStage1Sections) {
  assert.ok(stage1Closeout.includes(section), `missing stage 1 closeout section: ${section}`);
}

for (const section of requiredStage2Sections) {
  assert.ok(stage2Closeout.includes(section), `missing stage 2 closeout section: ${section}`);
}

for (const section of requiredStage3Sections) {
  assert.ok(stage3Closeout.includes(section), `missing stage 3 closeout section: ${section}`);
}

for (const section of requiredStage4Sections) {
  assert.ok(stage4Closeout.includes(section), `missing stage 4 closeout section: ${section}`);
}

for (const section of requiredStage5Sections) {
  assert.ok(stage5Closeout.includes(section), `missing stage 5 closeout section: ${section}`);
}

for (const section of requiredStage6Sections) {
  assert.ok(stage6Closeout.includes(section), `missing stage 6 closeout section: ${section}`);
}

for (const section of requiredStage7Sections) {
  assert.ok(stage7Closeout.includes(section), `missing stage 7 closeout section: ${section}`);
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
  readme.includes('docs/architecture/stage-3-closeout.md'),
  'README.md must reference the stage 3 closeout document',
);
assert.ok(
  readme.includes('docs/architecture/stage-4-closeout.md'),
  'README.md must reference the stage 4 closeout document',
);
assert.ok(
  readme.includes('docs/architecture/stage-5-closeout.md'),
  'README.md must reference the stage 5 closeout document',
);
assert.ok(
  readme.includes('docs/architecture/stage-6-closeout.md'),
  'README.md must reference the stage 6 closeout document',
);
assert.ok(
  readme.includes('docs/architecture/stage-7-closeout.md'),
  'README.md must reference the stage 7 closeout document',
);

assert.ok(
  structure.includes('stage-1-closeout.md'),
  'project-structure.md must reference the stage 1 closeout document',
);
assert.ok(
  structure.includes('stage-2-closeout.md'),
  'project-structure.md must reference the stage 2 closeout document',
);
assert.ok(
  structure.includes('stage-3-closeout.md'),
  'project-structure.md must reference the stage 3 closeout document',
);
assert.ok(
  structure.includes('stage-4-closeout.md'),
  'project-structure.md must reference the stage 4 closeout document',
);
assert.ok(
  structure.includes('stage-5-closeout.md'),
  'project-structure.md must reference the stage 5 closeout document',
);
assert.ok(
  structure.includes('stage-6-closeout.md'),
  'project-structure.md must reference the stage 6 closeout document',
);
assert.ok(
  structure.includes('stage-7-closeout.md'),
  'project-structure.md must reference the stage 7 closeout document',
);

console.log('stage documentation links are in sync');
