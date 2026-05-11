import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  AgentActionBoundary,
  AgentEvidenceCitation,
  AgentExecutionReview,
  AgentResearchSuggestion,
  AgentRiskReview,
  ResearchAssistantTask,
} from '../../shared-types/src/ai-research.ts';

test('ResearchAssistantTask: construct a valid task with citations', () => {
  const citation: AgentEvidenceCitation = {
    id: 'cite-1',
    kind: 'backtest',
    entityId: 'bt-run-1',
    entityLabel: 'Momentum Strategy Backtest Q4',
    summary: 'Sharpe 1.4, max drawdown -8%',
    relevance: 'primary',
  };

  const task: ResearchAssistantTask = {
    id: 'task-1',
    type: 'backtest_review',
    status: 'completed',
    requestedBy: 'researcher@desk',
    targetEntityId: 'bt-run-1',
    targetEntityType: 'backtest_run',
    prompt: 'Review this backtest for overfit signals',
    result: {
      summary: 'Moderate overfit risk detected in parameter sensitivity',
      suggestions: [],
      riskReview: null,
      executionReview: null,
      citations: [citation],
    },
    error: null,
    boundaries: [],
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  assert.equal(task.type, 'backtest_review');
  assert.equal(task.status, 'completed');
  assert.equal(task.result?.citations[0].kind, 'backtest');
  assert.equal(task.result?.citations[0].relevance, 'primary');
});

test('AgentResearchSuggestion: advisory until accepted', () => {
  const suggestion: AgentResearchSuggestion = {
    id: 'sug-1',
    taskId: 'task-1',
    kind: 'risk_flag',
    title: 'High correlation with benchmark',
    body: 'Strategy returns correlate >0.9 with SPY — may not provide unique alpha',
    confidence: 'high',
    citations: [
      {
        id: 'cite-2',
        kind: 'experiment',
        entityId: 'exp-run-1',
        entityLabel: 'Correlation analysis',
        summary: 'Pearson r = 0.92',
        relevance: 'primary',
      },
    ],
    accepted: null,
    acceptedBy: null,
    acceptedAt: null,
  };

  assert.equal(suggestion.accepted, null);
  assert.equal(suggestion.confidence, 'high');
  assert.equal(suggestion.citations.length, 1);
});

test('AgentRiskReview: cannot be final approver', () => {
  const review: AgentRiskReview = {
    id: 'review-1',
    taskId: 'task-2',
    entityId: 'promo-1',
    entityType: 'promotion_request',
    verdict: 'warn',
    summary: 'Insufficient out-of-sample validation',
    findings: [
      {
        dimension: 'validation_coverage',
        severity: 'warn',
        message: 'Only 6 months of out-of-sample data',
        citation: {
          id: 'cite-3',
          kind: 'backtest',
          entityId: 'bt-run-2',
          entityLabel: 'OOS Validation',
          summary: '6 months OOS with degraded Sharpe',
          relevance: 'primary',
        },
      },
    ],
    citations: [],
    reviewedAt: new Date().toISOString(),
  };

  assert.equal(review.verdict, 'warn');
  assert.equal(review.findings[0].severity, 'warn');
  assert.ok(review.findings[0].citation);
});

test('AgentExecutionReview: requires human follow-up for holds', () => {
  const review: AgentExecutionReview = {
    id: 'exec-review-1',
    taskId: 'task-3',
    executionPlanId: 'plan-1',
    verdict: 'hold',
    summary: 'Market conditions deviate from backtest assumptions',
    concerns: [
      {
        area: 'market_regime',
        severity: 'warn',
        message: 'VIX >30 not present in training data',
      },
      {
        area: 'liquidity',
        severity: 'info',
        message: 'Spread widened but within tolerance',
      },
    ],
    citations: [
      {
        id: 'cite-4',
        kind: 'risk_assessment',
        entityId: 'ra-1',
        entityLabel: 'Pre-execution risk check',
        summary: 'Market regime flagged',
        relevance: 'primary',
      },
    ],
    reviewedAt: new Date().toISOString(),
  };

  assert.equal(review.verdict, 'hold');
  assert.equal(review.concerns.length, 2);
  assert.equal(review.citations[0].kind, 'risk_assessment');
});

test('AgentActionBoundary: forbidden actions are explicit', () => {
  const boundaries: AgentActionBoundary[] = [
    {
      tool: 'read_research_workspace',
      allowed: true,
      reason: 'Read-only research access',
      category: 'read',
    },
    {
      tool: 'draft_risk_review',
      allowed: true,
      reason: 'Advisory review generation',
      category: 'write',
    },
    {
      tool: 'place_live_order',
      allowed: false,
      reason: 'Agent cannot directly place live orders',
      category: 'execute',
    },
    {
      tool: 'approve_live_promotion',
      allowed: false,
      reason: 'Agent cannot be final approver for live trading',
      category: 'approve',
    },
    {
      tool: 'read_secrets',
      allowed: false,
      reason: 'Secret access denied to agent',
      category: 'read',
    },
    {
      tool: 'bypass_risk_policy',
      allowed: false,
      reason: 'Risk policy bypass forbidden',
      category: 'execute',
    },
    {
      tool: 'delete_audit_records',
      allowed: false,
      reason: 'Audit records are immutable',
      category: 'delete',
    },
  ];

  const allowed = boundaries.filter((b) => b.allowed);
  const forbidden = boundaries.filter((b) => !b.allowed);
  assert.equal(allowed.length, 2);
  assert.equal(forbidden.length, 5);
  assert.ok(forbidden.some((b) => b.tool === 'place_live_order'));
  assert.ok(forbidden.some((b) => b.tool === 'approve_live_promotion'));
  assert.ok(forbidden.some((b) => b.tool === 'delete_audit_records'));
});

test('ResearchAssistantTask: queued task has null result', () => {
  const task: ResearchAssistantTask = {
    id: 'task-q',
    type: 'idea_critique',
    status: 'queued',
    requestedBy: 'researcher',
    targetEntityId: 'idea-1',
    targetEntityType: 'research_idea',
    prompt: 'Critique this hypothesis',
    result: null,
    error: null,
    boundaries: [
      {
        tool: 'read_research_workspace',
        allowed: true,
        reason: 'Read workspace',
        category: 'read',
      },
    ],
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
  };

  assert.equal(task.result, null);
  assert.equal(task.startedAt, null);
  assert.equal(task.boundaries.length, 1);
});
