import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WorkspaceAccessScopePanel } from './console/routes/SettingsPage.tsx';

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
});
