import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PersistenceMigrationPanel, WorkspaceAccessScopePanel } from './console/routes/SettingsPage.tsx';

describe('WorkspaceAccessScopePanel', () => {
  it('renders workspace role, overrides, and scoped permissions', () => {
    const html = renderToStaticMarkup(
      <WorkspaceAccessScopePanel
        locale="en"
        currentWorkspace={{
          id: 'workspace-live-ops',
          tenantId: 'tenant-quantpilot-labs',
          key: 'live-ops',
          label: 'Live Operations',
          description: 'Workspace for live operations.',
          role: 'execution-approver',
          grants: ['risk:review'],
          revokes: ['execution:approve'],
          defaultPermissions: ['dashboard:read', 'execution:approve'],
          effectivePermissions: ['dashboard:read', 'risk:review'],
          status: 'active',
          isDefault: false,
          isCurrent: true,
        }}
        accessSummary={{
          role: 'admin',
          roleLabel: 'Admin',
          status: 'active',
          defaultPermissions: ['dashboard:read', 'risk:review', 'execution:approve', 'account:write'],
          effectivePermissions: ['dashboard:read', 'risk:review', 'execution:approve', 'account:write'],
          workspaceRole: 'execution-approver',
          workspaceLabel: 'Live Operations',
          workspaceDefaultPermissions: ['dashboard:read', 'execution:approve'],
          workspaceEffectivePermissions: ['dashboard:read', 'risk:review'],
          scopedPermissions: ['dashboard:read', 'risk:review'],
          grants: [],
          revokes: [],
          workspaceGrants: ['risk:review'],
          workspaceRevokes: ['execution:approve'],
          addedPermissions: [],
          removedPermissions: [],
          sessionPermissions: ['dashboard:read', 'risk:review'],
          sessionAddedPermissions: [],
          sessionRemovedPermissions: [],
          isSessionAligned: true,
        }}
        sessionPermissions={['dashboard:read', 'risk:review']}
      />,
    );

    expect(html).toContain('Current Workspace Access Scope');
    expect(html).toContain('Current Workspace');
    expect(html).toContain('Live Operations');
    expect(html).toContain('Workspace Role');
    expect(html).toContain('execution-approver');
    expect(html).toContain('Template Permissions');
    expect(html).toContain('dashboard:read, execution:approve');
    expect(html).toContain('Workspace Grants');
    expect(html).toContain('risk:review');
    expect(html).toContain('Workspace Revokes');
    expect(html).toContain('Scoped Session Permissions');
  });

  it('renders persistence and migration details with recommended actions', () => {
    const html = renderToStaticMarkup(
      <PersistenceMigrationPanel
        locale="en"
        canInspectMaintenance={true}
        maintenance={{
          ok: true,
          generatedAt: '2026-03-28T08:00:00.000Z',
          storageAdapter: {
            kind: 'db',
            label: 'Embedded DB Store',
            namespace: 'control-plane',
            persistence: 'embedded-json-db',
          },
          integrity: {
            ok: true,
            generatedAt: '2026-03-28T08:00:00.000Z',
            status: 'healthy',
            adapter: {
              kind: 'db',
              label: 'Embedded DB Store',
              namespace: 'control-plane',
            },
            persistence: {
              adapter: {
                kind: 'db',
                label: 'Embedded DB Store',
                namespace: 'control-plane',
              },
              manifest: {
                schemaVersion: 3,
                persistence: 'embedded-json-db',
                storageModel: 'embedded-json-db',
                migrations: [
                  {
                    id: '001-bootstrap',
                    appliedAt: '2026-03-27T06:00:00.000Z',
                    fromVersion: 2,
                    toVersion: 3,
                  },
                ],
              },
              migrationPlan: {
                adapter: {
                  kind: 'db',
                  label: 'Embedded DB Store',
                  namespace: 'control-plane',
                },
                currentVersion: 2,
                targetVersion: 3,
                pending: [
                  {
                    id: '001-bootstrap',
                    fromVersion: 2,
                    toVersion: 3,
                  },
                ],
                upToDate: false,
              },
            },
            files: [],
            issues: [],
            summary: {
              fileCount: 0,
              collectionFiles: 0,
              objectFiles: 0,
              totalRecords: 0,
              duplicateIdCount: 0,
              missingIdCount: 0,
              malformedRecordCount: 0,
              retryScheduledWorkflows: 0,
              failedWorkflows: 0,
              pendingNotificationJobs: 0,
              pendingRiskScanJobs: 0,
              pendingAgentReviews: 0,
            },
          },
          backlog: {
            pendingNotificationJobs: 0,
            pendingRiskScanJobs: 0,
            pendingAgentReviews: 0,
            retryScheduledWorkflows: 1,
            failedWorkflows: 0,
            totalPending: 1,
            backlogStatus: 'warn',
          },
          recentFailedWorkflows: [],
          recentRetryScheduledWorkflows: [],
          supportedRepairs: [],
        }}
      />,
    );

    expect(html).toContain('Persistence &amp; Migration');
    expect(html).toContain('Embedded DB Store');
    expect(html).toContain('embedded-json-db');
    expect(html).toContain('Current -&gt; Target');
    expect(html).toContain('2 → 3');
    expect(html).toContain('Pending Migrations');
    expect(html).toContain('npm run control-plane:maintenance -- migrate --adapter db');
    expect(html).toContain('GET /api/operations/maintenance');
  });
});
