// @ts-nocheck

import type {
  AccountRiskLimit,
  BrokerAccount,
  Organization,
  StrategyAllocation,
  Team,
  TeamMember,
  Workspace,
} from '../../shared-types/src/organization.ts';

export class OrganizationStore {
  private organizations: Map<string, Organization> = new Map();
  private workspaces: Map<string, Workspace> = new Map();
  private teams: Map<string, Team> = new Map();
  private brokerAccounts: Map<string, BrokerAccount> = new Map();
  private strategyAllocations: Map<string, StrategyAllocation> = new Map();
  private riskLimits: Map<string, AccountRiskLimit> = new Map();

  createOrganization(org: Organization): Organization {
    this.organizations.set(org.id, structuredClone(org));
    return structuredClone(org);
  }

  getOrganization(id: string): Organization | null {
    const org = this.organizations.get(id);
    return org ? structuredClone(org) : null;
  }

  listOrganizations(): Organization[] {
    return [...this.organizations.values()].map((o) => structuredClone(o));
  }

  updateOrganization(id: string, patch: Partial<Organization>): Organization | null {
    const org = this.organizations.get(id);
    if (!org) return null;
    Object.assign(org, patch, { updatedAt: new Date().toISOString() });
    return structuredClone(org);
  }

  createWorkspace(ws: Workspace): Workspace {
    this.workspaces.set(ws.id, structuredClone(ws));
    return structuredClone(ws);
  }

  getWorkspace(id: string): Workspace | null {
    const ws = this.workspaces.get(id);
    return ws ? structuredClone(ws) : null;
  }

  listWorkspaces(organizationId?: string): Workspace[] {
    const all = [...this.workspaces.values()];
    const filtered = organizationId ? all.filter((w) => w.organizationId === organizationId) : all;
    return filtered.map((w) => structuredClone(w));
  }

  updateWorkspace(id: string, patch: Partial<Workspace>): Workspace | null {
    const ws = this.workspaces.get(id);
    if (!ws) return null;
    Object.assign(ws, patch, { updatedAt: new Date().toISOString() });
    return structuredClone(ws);
  }

  createTeam(team: Team): Team {
    this.teams.set(team.id, structuredClone(team));
    return structuredClone(team);
  }

  getTeam(id: string): Team | null {
    const team = this.teams.get(id);
    return team ? structuredClone(team) : null;
  }

  listTeams(organizationId?: string): Team[] {
    const all = [...this.teams.values()];
    const filtered = organizationId ? all.filter((t) => t.organizationId === organizationId) : all;
    return filtered.map((t) => structuredClone(t));
  }

  addTeamMember(teamId: string, member: TeamMember): Team | null {
    const team = this.teams.get(teamId);
    if (!team) return null;
    team.members.push(member);
    team.updatedAt = new Date().toISOString();
    return structuredClone(team);
  }

  removeTeamMember(teamId: string, userId: string): Team | null {
    const team = this.teams.get(teamId);
    if (!team) return null;
    team.members = team.members.filter((m) => m.userId !== userId);
    team.updatedAt = new Date().toISOString();
    return structuredClone(team);
  }

  createBrokerAccount(account: BrokerAccount): BrokerAccount {
    this.brokerAccounts.set(account.id, structuredClone(account));
    return structuredClone(account);
  }

  getBrokerAccount(id: string): BrokerAccount | null {
    const account = this.brokerAccounts.get(id);
    return account ? structuredClone(account) : null;
  }

  listBrokerAccounts(organizationId?: string): BrokerAccount[] {
    const all = [...this.brokerAccounts.values()];
    const filtered = organizationId ? all.filter((a) => a.organizationId === organizationId) : all;
    return filtered.map((a) => structuredClone(a));
  }

  updateBrokerAccount(id: string, patch: Partial<BrokerAccount>): BrokerAccount | null {
    const account = this.brokerAccounts.get(id);
    if (!account) return null;
    Object.assign(account, patch, { updatedAt: new Date().toISOString() });
    return structuredClone(account);
  }

  createStrategyAllocation(allocation: StrategyAllocation): StrategyAllocation {
    this.strategyAllocations.set(allocation.id, structuredClone(allocation));
    return structuredClone(allocation);
  }

  getStrategyAllocation(id: string): StrategyAllocation | null {
    const alloc = this.strategyAllocations.get(id);
    return alloc ? structuredClone(alloc) : null;
  }

  listStrategyAllocations(workspaceId?: string): StrategyAllocation[] {
    const all = [...this.strategyAllocations.values()];
    const filtered = workspaceId ? all.filter((a) => a.workspaceId === workspaceId) : all;
    return filtered.map((a) => structuredClone(a));
  }

  updateStrategyAllocation(
    id: string,
    patch: Partial<StrategyAllocation>
  ): StrategyAllocation | null {
    const alloc = this.strategyAllocations.get(id);
    if (!alloc) return null;
    Object.assign(alloc, patch, { updatedAt: new Date().toISOString() });
    return structuredClone(alloc);
  }

  createRiskLimit(limit: AccountRiskLimit): AccountRiskLimit {
    this.riskLimits.set(limit.id, structuredClone(limit));
    return structuredClone(limit);
  }

  getRiskLimit(id: string): AccountRiskLimit | null {
    const limit = this.riskLimits.get(id);
    return limit ? structuredClone(limit) : null;
  }

  listRiskLimits(organizationId?: string): AccountRiskLimit[] {
    const all = [...this.riskLimits.values()];
    const filtered = organizationId ? all.filter((l) => l.organizationId === organizationId) : all;
    return filtered.map((l) => structuredClone(l));
  }

  getRiskLimitForAccount(brokerAccountId: string): AccountRiskLimit | null {
    const limit = [...this.riskLimits.values()].find((l) => l.brokerAccountId === brokerAccountId);
    return limit ? structuredClone(limit) : null;
  }

  updateRiskLimit(id: string, patch: Partial<AccountRiskLimit>): AccountRiskLimit | null {
    const limit = this.riskLimits.get(id);
    if (!limit) return null;
    Object.assign(limit, patch, { updatedAt: new Date().toISOString() });
    return structuredClone(limit);
  }
}
