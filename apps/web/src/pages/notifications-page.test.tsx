import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OperationsPersistencePanel } from './notifications/NotificationsPage.tsx';

describe('OperationsPersistencePanel', () => {
  it('renders persistence posture, deep links, and command guidance', () => {
    const html = renderToStaticMarkup(
      <OperationsPersistencePanel
        locale="en"
        persistence={{
          posture: 'attention',
          headline: 'Migration follow-up recommended.',
          detail: 'The db adapter is readable, but one migration is still pending.',
          adapter: {
            kind: 'db',
            label: 'Embedded DB Store',
            namespace: 'control-plane',
          },
          storageModel: 'embedded-json-db',
          schemaVersion: 3,
          currentVersion: 2,
          targetVersion: 3,
          pendingCount: 1,
          upToDate: false,
          recommendedAction: 'Back up before applying migrations.',
          latestMigration: null,
          links: {
            maintenance: '/notifications#operations-workbench',
            settings: '/settings#persistence-migration',
          },
        }}
      />
    );

    expect(html).toContain('Persistence Posture');
    expect(html).toContain('Migration follow-up recommended.');
    expect(html).toContain('Embedded DB Store');
    expect(html).toContain('embedded-json-db');
    expect(html).toContain('Current -&gt; Target');
    expect(html).toContain('2 → 3');
    expect(html).toContain('/settings#persistence-migration');
    expect(html).toContain('npm run control-plane:maintenance -- backup --adapter db');
    expect(html).toContain('POST /api/operations/maintenance/backup');
  });
});
