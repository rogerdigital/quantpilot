export type OrganizationTier = 'individual' | 'team' | 'enterprise';

export type Organization = {
  id: string;
  name: string;
  tier: OrganizationTier;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type Workspace = {
  id: string;
  organizationId: string;
  name: string;
  environment: 'research' | 'paper' | 'live';
  status: 'active' | 'suspended' | 'archived';
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type Team = {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
};

export type TeamMember = {
  userId: string;
  role: UserRole;
  joinedAt: string;
};

export type UserRole =
  | 'owner'
  | 'admin'
  | 'portfolio_manager'
  | 'researcher'
  | 'risk_officer'
  | 'operator'
  | 'viewer';

export type BrokerAccount = {
  id: string;
  organizationId: string;
  workspaceId: string;
  provider: string;
  label: string;
  environment: 'paper' | 'live';
  status: 'active' | 'disabled' | 'pending_verification';
  capitalAllocated: number;
  capitalUsed: number;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type StrategyAllocation = {
  id: string;
  organizationId: string;
  workspaceId: string;
  strategyId: string;
  brokerAccountId: string;
  allocationPct: number;
  maxCapital: number;
  status: 'active' | 'paused' | 'closed';
  createdAt: string;
  updatedAt: string;
};

export type AccountRiskLimit = {
  id: string;
  organizationId: string;
  workspaceId: string;
  brokerAccountId: string;
  maxDrawdownPct: number;
  maxPositionPct: number;
  maxDailyLossPct: number;
  maxOpenPositions: number;
  killSwitchEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};
