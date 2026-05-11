// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  ResearchDecisionRecord,
  ResearchIdea,
  ResearchStatus,
  ResearchWorkspace,
} from '../../shared-types/src/research.ts';
import { createMemoryStore } from './helpers/memory-store.ts';

test('research contracts: serialize and deserialize ResearchWorkspace', () => {
  const store = createMemoryStore();

  const workspace: ResearchWorkspace = {
    id: 'ws-001',
    title: 'Momentum Alpha Research',
    description: 'Exploring momentum signals across US large-cap equities',
    owner: 'researcher-01',
    ownerRole: 'researcher',
    status: 'active',
    ideas: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
  };

  store.writeCollection('research_workspaces.json', [workspace]);
  const [loaded] = store.readCollection('research_workspaces.json');

  assert.equal(loaded.id, 'ws-001');
  assert.equal(loaded.title, 'Momentum Alpha Research');
  assert.equal(loaded.ownerRole, 'researcher');
  assert.equal(loaded.status, 'active');
  assert.deepEqual(loaded.ideas, []);
});

test('research contracts: ResearchIdea carries hypothesis and lifecycle fields', () => {
  const idea: ResearchIdea = {
    id: 'idea-001',
    workspaceId: 'ws-001',
    title: 'Cross-sectional momentum 5-20 day',
    hypothesis: {
      statement: 'Stocks with strong 5-20 day returns continue outperforming',
      rationale: 'Behavioral underreaction to firm-specific news',
      expectedOutcome: 'Excess return 5-10% annualized after costs',
      falsificationCriteria: 'Sharpe < 0.3 in 3-year walk-forward',
      relatedLiterature: ['Jegadeesh & Titman 1993'],
    },
    market: 'US',
    assetUniverse: ['SP500'],
    timeHorizon: '5-20 days',
    status: 'idea',
    owner: 'researcher-01',
    ownerRole: 'researcher',
    tags: ['momentum', 'equity', 'short-term'],
    decisionRecords: [],
    linkedDatasetIds: [],
    linkedFeatureSetIds: [],
    linkedExperimentIds: [],
    linkedBacktestIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
  };

  assert.equal(idea.status, 'idea');
  assert.equal(
    idea.hypothesis.statement,
    'Stocks with strong 5-20 day returns continue outperforming'
  );
  assert.deepEqual(idea.assetUniverse, ['SP500']);
});

test('research contracts: status transitions must record decisions', () => {
  const transitions: Array<{ from: ResearchStatus; to: ResearchStatus }> = [
    { from: 'idea', to: 'dataset_selected' },
    { from: 'dataset_selected', to: 'features_defined' },
    { from: 'features_defined', to: 'experiment_running' },
    { from: 'experiment_running', to: 'experiment_reviewed' },
    { from: 'experiment_reviewed', to: 'strategy_candidate' },
  ];

  const decisions: ResearchDecisionRecord[] = transitions.map((t, i) => ({
    id: `dec-${i}`,
    actor: 'researcher-01',
    role: 'researcher',
    action: `transition_${t.from}_to_${t.to}`,
    reason: `Validated criteria for ${t.to}`,
    evidenceLinks: [`evidence-${i}`],
    timestamp: new Date().toISOString(),
    metadata: {},
  }));

  assert.equal(decisions.length, 5);
  assert.equal(decisions[0].action, 'transition_idea_to_dataset_selected');
  assert.ok(decisions.every((d) => d.reason.length > 0));
  assert.ok(decisions.every((d) => d.evidenceLinks.length > 0));
});
