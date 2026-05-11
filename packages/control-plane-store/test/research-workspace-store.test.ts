// @ts-nocheck
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createResearchWorkspaceStore } from '../src/research-workspace-store.ts';
import { createMemoryStore } from './helpers/memory-store.ts';

describe('research workspace store', () => {
  it('creates a workspace and retrieves it', () => {
    const store = createMemoryStore();
    const registry = createResearchWorkspaceStore(store);

    const ws = registry.createWorkspace({
      id: 'ws-001',
      title: 'Momentum Alpha Research',
      description: 'Investigating momentum signals across US equities',
      owner: 'researcher-01',
      ownerRole: 'researcher',
      status: 'active',
      ideas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
    });

    assert.equal(ws.id, 'ws-001');
    const loaded = registry.getWorkspace('ws-001');
    assert.equal(loaded.title, 'Momentum Alpha Research');
  });

  it('attaches an idea with explicit hypothesis', () => {
    const store = createMemoryStore();
    const registry = createResearchWorkspaceStore(store);

    registry.createWorkspace({
      id: 'ws-001',
      title: 'Test',
      description: '',
      owner: 'r1',
      ownerRole: 'researcher',
      status: 'active',
      ideas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
    });

    const idea = registry.attachIdea('ws-001', {
      id: 'idea-001',
      workspaceId: 'ws-001',
      title: '12-month momentum factor',
      hypothesis: {
        statement: 'Stocks with high 12M returns continue to outperform',
        rationale: 'Behavioral persistence in trend following',
        expectedOutcome: 'Sharpe > 0.8 after transaction costs',
        falsificationCriteria: 'Sharpe < 0.3 in out-of-sample',
        relatedLiterature: ['Jegadeesh & Titman 1993'],
      },
      market: 'US_EQUITIES',
      assetUniverse: ['SP500'],
      timeHorizon: '12M',
      status: 'idea',
      owner: 'r1',
      ownerRole: 'researcher',
      tags: ['momentum', 'cross-sectional'],
      decisionRecords: [],
      linkedDatasetIds: [],
      linkedFeatureSetIds: [],
      linkedExperimentIds: [],
      linkedBacktestIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
    });

    assert.equal(idea.hypothesis.statement, 'Stocks with high 12M returns continue to outperform');
    const ws = registry.getWorkspace('ws-001');
    assert.equal(ws.ideas.length, 1);
  });

  it('transitions idea status and records reason', () => {
    const store = createMemoryStore();
    const registry = createResearchWorkspaceStore(store);

    registry.createWorkspace({
      id: 'ws-001',
      title: 'Test',
      description: '',
      owner: 'r1',
      ownerRole: 'researcher',
      status: 'active',
      ideas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
    });

    registry.attachIdea('ws-001', {
      id: 'idea-001',
      workspaceId: 'ws-001',
      title: 'Test Idea',
      hypothesis: {
        statement: 'H1',
        rationale: 'R1',
        expectedOutcome: 'E1',
        falsificationCriteria: 'F1',
        relatedLiterature: [],
      },
      market: 'US',
      assetUniverse: [],
      timeHorizon: '1M',
      status: 'idea',
      owner: 'r1',
      ownerRole: 'researcher',
      tags: [],
      decisionRecords: [],
      linkedDatasetIds: [],
      linkedFeatureSetIds: [],
      linkedExperimentIds: [],
      linkedBacktestIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
    });

    const updated = registry.transitionIdea(
      'ws-001',
      'idea-001',
      'dataset_selected',
      'Selected US equities daily OHLCV dataset',
      'r1',
      'researcher'
    );

    assert.equal(updated.status, 'dataset_selected');
    assert.equal(updated.decisionRecords.length, 1);
    assert.ok(updated.decisionRecords[0].reason.includes('Selected US equities'));
    assert.ok(updated.decisionRecords[0].action.includes('idea->dataset_selected'));
  });

  it('decisions are append-only', () => {
    const store = createMemoryStore();
    const registry = createResearchWorkspaceStore(store);

    registry.createWorkspace({
      id: 'ws-001',
      title: 'Test',
      description: '',
      owner: 'r1',
      ownerRole: 'researcher',
      status: 'active',
      ideas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
    });

    registry.attachIdea('ws-001', {
      id: 'idea-001',
      workspaceId: 'ws-001',
      title: 'Test',
      hypothesis: {
        statement: 'H',
        rationale: 'R',
        expectedOutcome: 'E',
        falsificationCriteria: 'F',
        relatedLiterature: [],
      },
      market: 'US',
      assetUniverse: [],
      timeHorizon: '1M',
      status: 'idea',
      owner: 'r1',
      ownerRole: 'researcher',
      tags: [],
      decisionRecords: [],
      linkedDatasetIds: [],
      linkedFeatureSetIds: [],
      linkedExperimentIds: [],
      linkedBacktestIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
    });

    registry.recordDecision('ws-001', 'idea-001', {
      id: 'dec-001',
      actor: 'r1',
      role: 'researcher',
      action: 'approve',
      reason: 'First decision',
      evidenceLinks: [],
      timestamp: new Date().toISOString(),
      metadata: {},
    });

    registry.recordDecision('ws-001', 'idea-001', {
      id: 'dec-002',
      actor: 'risk-01',
      role: 'risk_officer',
      action: 'review',
      reason: 'Second decision',
      evidenceLinks: ['ev-001'],
      timestamp: new Date().toISOString(),
      metadata: {},
    });

    const ws = registry.getWorkspace('ws-001');
    const idea = ws.ideas[0];
    assert.equal(idea.decisionRecords.length, 2);
    assert.equal(idea.decisionRecords[0].id, 'dec-001');
    assert.equal(idea.decisionRecords[1].id, 'dec-002');
  });

  it('links datasets, features, experiments, and backtests', () => {
    const store = createMemoryStore();
    const registry = createResearchWorkspaceStore(store);

    registry.createWorkspace({
      id: 'ws-001',
      title: 'Test',
      description: '',
      owner: 'r1',
      ownerRole: 'researcher',
      status: 'active',
      ideas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
    });

    registry.attachIdea('ws-001', {
      id: 'idea-001',
      workspaceId: 'ws-001',
      title: 'Test',
      hypothesis: {
        statement: 'H',
        rationale: 'R',
        expectedOutcome: 'E',
        falsificationCriteria: 'F',
        relatedLiterature: [],
      },
      market: 'US',
      assetUniverse: [],
      timeHorizon: '1M',
      status: 'idea',
      owner: 'r1',
      ownerRole: 'researcher',
      tags: [],
      decisionRecords: [],
      linkedDatasetIds: [],
      linkedFeatureSetIds: [],
      linkedExperimentIds: [],
      linkedBacktestIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
    });

    registry.linkDataset('ws-001', 'idea-001', 'ds-001');
    registry.linkFeatureSet('ws-001', 'idea-001', 'fs-001');
    registry.linkExperiment('ws-001', 'idea-001', 'exp-001');
    registry.linkBacktest('ws-001', 'idea-001', 'bt-001');

    const ws = registry.getWorkspace('ws-001');
    const idea = ws.ideas[0];
    assert.deepEqual(idea.linkedDatasetIds, ['ds-001']);
    assert.deepEqual(idea.linkedFeatureSetIds, ['fs-001']);
    assert.deepEqual(idea.linkedExperimentIds, ['exp-001']);
    assert.deepEqual(idea.linkedBacktestIds, ['bt-001']);
  });
});
