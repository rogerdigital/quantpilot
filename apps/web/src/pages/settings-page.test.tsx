import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WorkspaceAccessScopePanel } from './console/routes/SettingsPage.tsx';

describe('WorkspaceAccessScopePanel', () => {
  it('renders workspace role, overrides, and scoped permissions', () => {
    const html = renderToStaticMarkup(
      <WorkspaceAccessScopePanel
        locale="en"
        currentWorkspace={{
          id: 'workspace-paper',
          tenantId: 'tenant-local',
          key: 'paper',
          label: 'Paper Workspace',
          description: 'Workspace for paper execution.',
          role: 'operator',
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
          defaultPermissions: [
            'dashboard:read',
            'risk:review',
            'execution:approve',
            'account:write',
          ],
          effectivePermissions: [
            'dashboard:read',
            'risk:review',
            'execution:approve',
            'account:write',
          ],
          workspaceRole: 'operator',
          workspaceLabel: 'Paper Workspace',
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
      />
    );

    expect(html).toContain('Current Workspace Access Scope');
    expect(html).toContain('Paper Workspace');
    expect(html).toContain('Workspace Role');
    expect(html).toContain('operator');
    expect(html).toContain('Scoped Session Permissions');
  });
});
