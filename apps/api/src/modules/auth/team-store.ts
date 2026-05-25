import { randomBytes } from 'node:crypto';
import { loadMap, persistMap } from '../../lib/persist.js';

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
  invitedBy: string;
}

export interface TeamInvite {
  id: string;
  teamId: string;
  email: string;
  role: TeamRole;
  token: string;
  expiresAt: string;
  acceptedAt?: string;
  invitedBy: string;
}

export interface ApiKey {
  id: string;
  teamId: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: string;
  expiresAt?: string;
  revokedAt?: string;
  createdBy: string;
}

const teams = new Map<string, Team>();
const members = new Map<string, TeamMember[]>();
const invites = new Map<string, TeamInvite>();
const apiKeys = new Map<string, ApiKey>();

loadMap<string, Team>('teams.json', teams);
loadMap<string, TeamMember[]>('team-members.json', members);
loadMap<string, TeamInvite>('team-invites.json', invites);
loadMap<string, ApiKey>('api-keys.json', apiKeys);

function save() {
  persistMap('teams.json', teams);
  persistMap('team-members.json', members);
  persistMap('team-invites.json', invites);
  persistMap('api-keys.json', apiKeys);
}

export function createTeam(name: string, description: string, ownerId: string): Team {
  const team: Team = {
    id: `team-${Date.now()}`,
    name,
    description,
    ownerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  teams.set(team.id, team);

  const member: TeamMember = {
    teamId: team.id,
    userId: ownerId,
    role: 'owner',
    joinedAt: new Date().toISOString(),
    invitedBy: ownerId,
  };
  members.set(team.id, [member]);
  save();

  return team;
}

export function getTeam(teamId: string): Team | null {
  return teams.get(teamId) ?? null;
}

export function getUserTeams(userId: string): Team[] {
  const userTeams: Team[] = [];
  for (const [teamId, teamMembers] of members) {
    if (teamMembers.some((m) => m.userId === userId)) {
      const team = teams.get(teamId);
      if (team) userTeams.push(team);
    }
  }
  return userTeams;
}

export function updateTeam(
  teamId: string,
  patch: Partial<Pick<Team, 'name' | 'description'>>
): Team | null {
  const team = teams.get(teamId);
  if (!team) return null;
  if (patch.name) team.name = patch.name;
  if (patch.description) team.description = patch.description;
  team.updatedAt = new Date().toISOString();
  save();
  return team;
}

export function deleteTeam(teamId: string): boolean {
  const team = teams.get(teamId);
  if (!team) return false;
  teams.delete(teamId);
  members.delete(teamId);
  save();
  return true;
}

export function getTeamMembers(teamId: string): TeamMember[] {
  return members.get(teamId) ?? [];
}

export function getTeamMember(teamId: string, userId: string): TeamMember | null {
  const teamMembers = members.get(teamId) ?? [];
  return teamMembers.find((m) => m.userId === userId) ?? null;
}

export function addTeamMember(
  teamId: string,
  userId: string,
  role: TeamRole,
  invitedBy: string
): TeamMember | null {
  const team = teams.get(teamId);
  if (!team) return null;

  const teamMembers = members.get(teamId) ?? [];
  if (teamMembers.some((m) => m.userId === userId)) return null;

  const member: TeamMember = {
    teamId,
    userId,
    role,
    joinedAt: new Date().toISOString(),
    invitedBy,
  };
  teamMembers.push(member);
  members.set(teamId, teamMembers);
  save();
  return member;
}

export function updateMemberRole(
  teamId: string,
  userId: string,
  role: TeamRole
): TeamMember | null {
  const teamMembers = members.get(teamId) ?? [];
  const member = teamMembers.find((m) => m.userId === userId);
  if (!member) return null;
  member.role = role;
  save();
  return member;
}

export function removeMember(teamId: string, userId: string): boolean {
  const teamMembers = members.get(teamId) ?? [];
  const index = teamMembers.findIndex((m) => m.userId === userId);
  if (index === -1) return false;
  teamMembers.splice(index, 1);
  save();
  return true;
}

export function createInvite(
  teamId: string,
  email: string,
  role: TeamRole,
  invitedBy: string
): TeamInvite {
  const invite: TeamInvite = {
    id: `invite-${Date.now()}`,
    teamId,
    email: email.toLowerCase(),
    role,
    token: randomBytes(16).toString('hex'),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    invitedBy,
  };
  invites.set(invite.id, invite);
  save();
  return invite;
}

export function getInviteByToken(token: string): TeamInvite | null {
  for (const invite of invites.values()) {
    if (invite.token === token && !invite.acceptedAt && new Date(invite.expiresAt) > new Date()) {
      return invite;
    }
  }
  return null;
}

export function acceptInvite(token: string): TeamInvite | null {
  const invite = getInviteByToken(token);
  if (!invite) return null;
  invite.acceptedAt = new Date().toISOString();
  save();
  return invite;
}

export function createApiKey(
  teamId: string,
  name: string,
  permissions: string[],
  createdBy: string,
  expiresInDays?: number
): ApiKey {
  const key = `qpk_${randomBytes(32).toString('hex')}`;
  const apiKey: ApiKey = {
    id: `key-${Date.now()}`,
    teamId,
    name,
    key,
    permissions,
    createdAt: new Date().toISOString(),
    expiresAt: expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
    createdBy,
  };
  apiKeys.set(apiKey.id, apiKey);
  save();
  return apiKey;
}

export function getApiKeys(teamId: string): ApiKey[] {
  const result: ApiKey[] = [];
  for (const key of apiKeys.values()) {
    if (key.teamId === teamId && !key.revokedAt) result.push(key);
  }
  return result;
}

export function revokeApiKey(keyId: string): boolean {
  const apiKey = apiKeys.get(keyId);
  if (!apiKey) return false;
  apiKey.revokedAt = new Date().toISOString();
  save();
  return true;
}

export function validateApiKey(key: string): ApiKey | null {
  for (const apiKey of apiKeys.values()) {
    if (apiKey.key === key && !apiKey.revokedAt) {
      if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) return null;
      return apiKey;
    }
  }
  return null;
}
