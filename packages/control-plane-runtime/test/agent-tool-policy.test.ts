// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateToolBatch,
  evaluateToolPolicy,
  filterAllowedFromRequest,
  getAllowedTools,
  getForbiddenTools,
  isToolForbidden,
} from '../src/agent-tool-policy.js';

test('getAllowedTools returns the research tool allowlist', () => {
  const tools = getAllowedTools();
  assert.ok(tools.length >= 7);
  assert.ok(tools.some((t) => t.name === 'read_research_workspace'));
  assert.ok(tools.some((t) => t.name === 'draft_risk_review'));
  assert.ok(tools.some((t) => t.name === 'compare_experiment_runs'));
});

test('getForbiddenTools returns the forbidden tool list', () => {
  const tools = getForbiddenTools();
  assert.ok(tools.length >= 5);
  assert.ok(tools.some((t) => t.name === 'place_live_order'));
  assert.ok(tools.some((t) => t.name === 'approve_live_promotion'));
  assert.ok(tools.some((t) => t.name === 'delete_audit_records'));
});

test('evaluateToolPolicy: allowed tool returns allowed verdict', () => {
  const verdict = evaluateToolPolicy('read_research_workspace');
  assert.equal(verdict.allowed, true);
  assert.equal(verdict.tool, 'read_research_workspace');
});

test('evaluateToolPolicy: forbidden tool is rejected with reason', () => {
  const verdict = evaluateToolPolicy('place_live_order');
  assert.equal(verdict.allowed, false);
  assert.ok(verdict.reason.includes('live orders'));
});

test('evaluateToolPolicy: unknown tool is rejected', () => {
  const verdict = evaluateToolPolicy('unknown_tool_xyz');
  assert.equal(verdict.allowed, false);
  assert.ok(verdict.reason.includes('not in the agent allowlist'));
});

test('evaluateToolBatch: processes multiple tools', () => {
  const verdicts = evaluateToolBatch([
    'read_research_workspace',
    'place_live_order',
    'draft_risk_review',
    'delete_audit_records',
  ]);
  assert.equal(verdicts.length, 4);
  assert.equal(verdicts[0].allowed, true);
  assert.equal(verdicts[1].allowed, false);
  assert.equal(verdicts[2].allowed, true);
  assert.equal(verdicts[3].allowed, false);
});

test('isToolForbidden: returns true for forbidden tools', () => {
  assert.equal(isToolForbidden('place_live_order'), true);
  assert.equal(isToolForbidden('approve_live_promotion'), true);
  assert.equal(isToolForbidden('read_secrets'), true);
  assert.equal(isToolForbidden('bypass_risk_policy'), true);
  assert.equal(isToolForbidden('delete_audit_records'), true);
});

test('isToolForbidden: returns false for allowed or unknown tools', () => {
  assert.equal(isToolForbidden('read_research_workspace'), false);
  assert.equal(isToolForbidden('unknown_tool'), false);
});

test('filterAllowedFromRequest: separates allowed and rejected', () => {
  const result = filterAllowedFromRequest([
    'read_research_workspace',
    'summarize_dataset_quality',
    'place_live_order',
    'approve_live_promotion',
    'draft_promotion_review',
  ]);
  assert.equal(result.allowed.length, 3);
  assert.equal(result.rejected.length, 2);
  assert.ok(result.allowed.includes('read_research_workspace'));
  assert.ok(result.allowed.includes('summarize_dataset_quality'));
  assert.ok(result.allowed.includes('draft_promotion_review'));
  assert.ok(result.rejected.some((r) => r.tool === 'place_live_order'));
  assert.ok(result.rejected.some((r) => r.tool === 'approve_live_promotion'));
});

test('forbidden tools are rejected server-side regardless of context', () => {
  const forbidden = getForbiddenTools();
  for (const tool of forbidden) {
    const verdict = evaluateToolPolicy(tool.name);
    assert.equal(verdict.allowed, false, `${tool.name} should be rejected`);
    assert.ok(verdict.reason.length > 0);
  }
});
