// @ts-nocheck
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  AccountRiskLimit,
  BrokerAccount,
  Organization,
  StrategyAllocation,
  Team,
  Workspace,
} from '../../shared-types/src/organization.ts';
import { OrganizationStore } from '../src/organization-store.js';

function makeOrg(overrides: Partial<Organization> = {}): Organization {
  return {
    id: 'org-1',
    name: 'Quant Desk Alpha',
    tier: 'team',
    ownerUserId: 'user-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
    ...overrides,
  };
}

function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: 'ws-1',
    organizationId: 'org-1',
    name: 'Research Lab',
    environment: 'research',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
    ...overrides,
  };
}

function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: 'team-1',
    organizationId: 'org-1',
    name: 'Alpha Research',
    description: 'Cross-sectional momentum research team',
    members: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeBrokerAccount(overrides: Partial<BrokerAccount> = {}): BrokerAccount {
  return {
    id: 'broker-1',
    organizationId: 'org-1',
    workspaceId: 'ws-1',
    provider: 'interactive_brokers',
    label: 'IB Paper Account',
    environment: 'paper',
    status: 'active',
    capitalAllocated: 1_000_000,
    capitalUsed: 250_000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
    ...overrides,
  };
}

function makeAllocation(overrides: Partial<StrategyAllocation> = {}): StrategyAllocation {
  return {
    id: 'alloc-1',
    organizationId: 'org-1',
    workspaceId: 'ws-1',
    strategyId: 'strat-momentum-01',
    brokerAccountId: 'broker-1',
    allocationPct: 25,
    maxCapital: 250_000,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRiskLimit(overrides: Partial<AccountRiskLimit> = {}): AccountRiskLimit {
  return {
    id: 'risk-1',
    organizationId: 'org-1',
    workspaceId: 'ws-1',
    brokerAccountId: 'broker-1',
    maxDrawdownPct: 10,
    maxPositionPct: 5,
    maxDailyLossPct: 2,
    maxOpenPositions: 20,
    killSwitchEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('OrganizationStore', () => {
  describe('organizations', () => {
    it('creates and retrieves an organization', () => {
      const store = new OrganizationStore();
      const org = store.createOrganization(makeOrg());
      assert.equal(org.id, 'org-1');
      assert.equal(org.name, 'Quant Desk Alpha');

      const loaded = store.getOrganization('org-1');
      assert.equal(loaded?.tier, 'team');
    });

    it('returns null for unknown organization', () => {
      const store = new OrganizationStore();
      assert.equal(store.getOrganization('nonexistent'), null);
    });

    it('lists all organizations', () => {
      const store = new OrganizationStore();
      store.createOrganization(makeOrg({ id: 'org-1' }));
      store.createOrganization(makeOrg({ id: 'org-2', name: 'Beta Desk' }));
      const list = store.listOrganizations();
      assert.equal(list.length, 2);
    });

    it('updates an organization', () => {
      const store = new OrganizationStore();
      const created = store.createOrganization(makeOrg());
      const before = created.updatedAt;
      // ensure clock advances
      const start = Date.now();
      while (Date.now() === start) {
        /* spin */
      }
      const updated = store.updateOrganization('org-1', { tier: 'enterprise' });
      assert.equal(updated?.tier, 'enterprise');
      assert.notEqual(updated?.updatedAt, before);
    });

    it('update returns null for unknown id', () => {
      const store = new OrganizationStore();
      assert.equal(store.updateOrganization('nope', { name: 'x' }), null);
    });

    it('returns defensive copies (structuredClone)', () => {
      const store = new OrganizationStore();
      const created = store.createOrganization(makeOrg());
      created.name = 'mutated';
      const loaded = store.getOrganization('org-1');
      assert.equal(loaded?.name, 'Quant Desk Alpha');
    });
  });

  describe('workspaces', () => {
    it('creates and retrieves a workspace', () => {
      const store = new OrganizationStore();
      store.createWorkspace(makeWorkspace());
      const ws = store.getWorkspace('ws-1');
      assert.equal(ws?.name, 'Research Lab');
      assert.equal(ws?.environment, 'research');
    });

    it('lists workspaces filtered by organizationId', () => {
      const store = new OrganizationStore();
      store.createWorkspace(makeWorkspace({ id: 'ws-1', organizationId: 'org-1' }));
      store.createWorkspace(makeWorkspace({ id: 'ws-2', organizationId: 'org-2' }));
      store.createWorkspace(makeWorkspace({ id: 'ws-3', organizationId: 'org-1' }));

      const org1Ws = store.listWorkspaces('org-1');
      assert.equal(org1Ws.length, 2);
      const all = store.listWorkspaces();
      assert.equal(all.length, 3);
    });

    it('updates a workspace', () => {
      const store = new OrganizationStore();
      store.createWorkspace(makeWorkspace());
      const updated = store.updateWorkspace('ws-1', { status: 'suspended' });
      assert.equal(updated?.status, 'suspended');
    });
  });

  describe('teams', () => {
    it('creates and retrieves a team', () => {
      const store = new OrganizationStore();
      store.createTeam(makeTeam());
      const team = store.getTeam('team-1');
      assert.equal(team?.name, 'Alpha Research');
      assert.deepEqual(team?.members, []);
    });

    it('lists teams filtered by organizationId', () => {
      const store = new OrganizationStore();
      store.createTeam(makeTeam({ id: 'team-1', organizationId: 'org-1' }));
      store.createTeam(makeTeam({ id: 'team-2', organizationId: 'org-2' }));

      const org1Teams = store.listTeams('org-1');
      assert.equal(org1Teams.length, 1);
    });

    it('adds a team member', () => {
      const store = new OrganizationStore();
      store.createTeam(makeTeam());
      const updated = store.addTeamMember('team-1', {
        userId: 'user-001',
        role: 'researcher',
        joinedAt: new Date().toISOString(),
      });
      assert.equal(updated?.members.length, 1);
      assert.equal(updated?.members[0].role, 'researcher');
    });

    it('removes a team member', () => {
      const store = new OrganizationStore();
      store.createTeam(
        makeTeam({
          members: [
            { userId: 'user-001', role: 'researcher', joinedAt: new Date().toISOString() },
            { userId: 'user-002', role: 'risk_officer', joinedAt: new Date().toISOString() },
          ],
        })
      );
      const updated = store.removeTeamMember('team-1', 'user-001');
      assert.equal(updated?.members.length, 1);
      assert.equal(updated?.members[0].userId, 'user-002');
    });

    it('add/remove returns null for unknown team', () => {
      const store = new OrganizationStore();
      assert.equal(
        store.addTeamMember('nope', {
          userId: 'u',
          role: 'viewer',
          joinedAt: new Date().toISOString(),
        }),
        null
      );
      assert.equal(store.removeTeamMember('nope', 'u'), null);
    });
  });

  describe('broker accounts', () => {
    it('creates and retrieves a broker account', () => {
      const store = new OrganizationStore();
      store.createBrokerAccount(makeBrokerAccount());
      const account = store.getBrokerAccount('broker-1');
      assert.equal(account?.provider, 'interactive_brokers');
      assert.equal(account?.capitalAllocated, 1_000_000);
    });

    it('lists broker accounts filtered by organizationId', () => {
      const store = new OrganizationStore();
      store.createBrokerAccount(makeBrokerAccount({ id: 'b1', organizationId: 'org-1' }));
      store.createBrokerAccount(makeBrokerAccount({ id: 'b2', organizationId: 'org-2' }));

      const org1 = store.listBrokerAccounts('org-1');
      assert.equal(org1.length, 1);
      const all = store.listBrokerAccounts();
      assert.equal(all.length, 2);
    });

    it('updates a broker account', () => {
      const store = new OrganizationStore();
      store.createBrokerAccount(makeBrokerAccount());
      const updated = store.updateBrokerAccount('broker-1', {
        status: 'disabled',
        capitalUsed: 0,
      });
      assert.equal(updated?.status, 'disabled');
      assert.equal(updated?.capitalUsed, 0);
    });
  });

  describe('strategy allocations', () => {
    it('creates and retrieves an allocation', () => {
      const store = new OrganizationStore();
      store.createStrategyAllocation(makeAllocation());
      const alloc = store.getStrategyAllocation('alloc-1');
      assert.equal(alloc?.strategyId, 'strat-momentum-01');
      assert.equal(alloc?.allocationPct, 25);
    });

    it('lists allocations filtered by workspaceId', () => {
      const store = new OrganizationStore();
      store.createStrategyAllocation(makeAllocation({ id: 'a1', workspaceId: 'ws-1' }));
      store.createStrategyAllocation(makeAllocation({ id: 'a2', workspaceId: 'ws-2' }));
      store.createStrategyAllocation(makeAllocation({ id: 'a3', workspaceId: 'ws-1' }));

      const ws1 = store.listStrategyAllocations('ws-1');
      assert.equal(ws1.length, 2);
    });

    it('updates an allocation', () => {
      const store = new OrganizationStore();
      store.createStrategyAllocation(makeAllocation());
      const updated = store.updateStrategyAllocation('alloc-1', {
        status: 'paused',
        allocationPct: 0,
      });
      assert.equal(updated?.status, 'paused');
      assert.equal(updated?.allocationPct, 0);
    });
  });

  describe('risk limits', () => {
    it('creates and retrieves a risk limit', () => {
      const store = new OrganizationStore();
      store.createRiskLimit(makeRiskLimit());
      const limit = store.getRiskLimit('risk-1');
      assert.equal(limit?.maxDrawdownPct, 10);
      assert.equal(limit?.killSwitchEnabled, true);
    });

    it('lists risk limits filtered by organizationId', () => {
      const store = new OrganizationStore();
      store.createRiskLimit(makeRiskLimit({ id: 'r1', organizationId: 'org-1' }));
      store.createRiskLimit(makeRiskLimit({ id: 'r2', organizationId: 'org-2' }));

      const org1 = store.listRiskLimits('org-1');
      assert.equal(org1.length, 1);
    });

    it('gets risk limit for a specific broker account', () => {
      const store = new OrganizationStore();
      store.createRiskLimit(makeRiskLimit({ id: 'r1', brokerAccountId: 'broker-1' }));
      store.createRiskLimit(makeRiskLimit({ id: 'r2', brokerAccountId: 'broker-2' }));

      const limit = store.getRiskLimitForAccount('broker-2');
      assert.equal(limit?.id, 'r2');
      assert.equal(store.getRiskLimitForAccount('broker-999'), null);
    });

    it('updates a risk limit', () => {
      const store = new OrganizationStore();
      store.createRiskLimit(makeRiskLimit());
      const updated = store.updateRiskLimit('risk-1', {
        maxDrawdownPct: 5,
        killSwitchEnabled: false,
      });
      assert.equal(updated?.maxDrawdownPct, 5);
      assert.equal(updated?.killSwitchEnabled, false);
    });

    it('update returns null for unknown id', () => {
      const store = new OrganizationStore();
      assert.equal(store.updateRiskLimit('nope', { maxDrawdownPct: 1 }), null);
    });
  });
});
