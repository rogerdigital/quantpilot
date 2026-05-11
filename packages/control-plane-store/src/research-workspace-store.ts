// @ts-nocheck
import type {
  ResearchDecisionRecord,
  ResearchIdea,
  ResearchStatus,
  ResearchWorkspace,
} from '../../shared-types/src/research.ts';

type WorkspaceStore = {
  readCollection: (filename: string) => any[];
  writeCollection: (filename: string, entries: any[]) => void;
};

export function createResearchWorkspaceStore(store: WorkspaceStore) {
  const WORKSPACES_FILE = 'research_workspaces.json';

  function listWorkspaces(): ResearchWorkspace[] {
    return store.readCollection(WORKSPACES_FILE);
  }

  function getWorkspace(id: string): ResearchWorkspace | undefined {
    return listWorkspaces().find((w) => w.id === id);
  }

  function createWorkspace(workspace: ResearchWorkspace): ResearchWorkspace {
    const existing = listWorkspaces();
    existing.push(workspace);
    store.writeCollection(WORKSPACES_FILE, existing);
    return workspace;
  }

  function attachIdea(workspaceId: string, idea: ResearchIdea): ResearchIdea {
    const workspaces = listWorkspaces();
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    ws.ideas.push(idea);
    ws.updatedAt = new Date().toISOString();
    store.writeCollection(WORKSPACES_FILE, workspaces);
    return idea;
  }

  function transitionIdea(
    workspaceId: string,
    ideaId: string,
    nextStatus: ResearchStatus,
    reason: string,
    actor: string,
    role: ResearchIdea['ownerRole']
  ): ResearchIdea {
    const workspaces = listWorkspaces();
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const idea = ws.ideas.find((i) => i.id === ideaId);
    if (!idea) throw new Error(`Idea ${ideaId} not found`);

    const decision: ResearchDecisionRecord = {
      id: `dec-${Date.now()}`,
      actor,
      role,
      action: `transition:${idea.status}->${nextStatus}`,
      reason,
      evidenceLinks: [],
      timestamp: new Date().toISOString(),
      metadata: {},
    };

    idea.status = nextStatus;
    idea.decisionRecords.push(decision);
    idea.updatedAt = new Date().toISOString();
    ws.updatedAt = new Date().toISOString();
    store.writeCollection(WORKSPACES_FILE, workspaces);
    return idea;
  }

  function recordDecision(
    workspaceId: string,
    ideaId: string,
    decision: ResearchDecisionRecord
  ): ResearchDecisionRecord {
    const workspaces = listWorkspaces();
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const idea = ws.ideas.find((i) => i.id === ideaId);
    if (!idea) throw new Error(`Idea ${ideaId} not found`);

    idea.decisionRecords.push(decision);
    idea.updatedAt = new Date().toISOString();
    ws.updatedAt = new Date().toISOString();
    store.writeCollection(WORKSPACES_FILE, workspaces);
    return decision;
  }

  function linkDataset(workspaceId: string, ideaId: string, datasetId: string): void {
    const workspaces = listWorkspaces();
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const idea = ws.ideas.find((i) => i.id === ideaId);
    if (!idea) throw new Error(`Idea ${ideaId} not found`);
    if (!idea.linkedDatasetIds.includes(datasetId)) {
      idea.linkedDatasetIds.push(datasetId);
    }
    store.writeCollection(WORKSPACES_FILE, workspaces);
  }

  function linkFeatureSet(workspaceId: string, ideaId: string, featureSetId: string): void {
    const workspaces = listWorkspaces();
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const idea = ws.ideas.find((i) => i.id === ideaId);
    if (!idea) throw new Error(`Idea ${ideaId} not found`);
    if (!idea.linkedFeatureSetIds.includes(featureSetId)) {
      idea.linkedFeatureSetIds.push(featureSetId);
    }
    store.writeCollection(WORKSPACES_FILE, workspaces);
  }

  function linkExperiment(workspaceId: string, ideaId: string, experimentId: string): void {
    const workspaces = listWorkspaces();
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const idea = ws.ideas.find((i) => i.id === ideaId);
    if (!idea) throw new Error(`Idea ${ideaId} not found`);
    if (!idea.linkedExperimentIds.includes(experimentId)) {
      idea.linkedExperimentIds.push(experimentId);
    }
    store.writeCollection(WORKSPACES_FILE, workspaces);
  }

  function linkBacktest(workspaceId: string, ideaId: string, backtestId: string): void {
    const workspaces = listWorkspaces();
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);
    const idea = ws.ideas.find((i) => i.id === ideaId);
    if (!idea) throw new Error(`Idea ${ideaId} not found`);
    if (!idea.linkedBacktestIds.includes(backtestId)) {
      idea.linkedBacktestIds.push(backtestId);
    }
    store.writeCollection(WORKSPACES_FILE, workspaces);
  }

  return {
    listWorkspaces,
    getWorkspace,
    createWorkspace,
    attachIdea,
    transitionIdea,
    recordDecision,
    linkDataset,
    linkFeatureSet,
    linkExperiment,
    linkBacktest,
  };
}
