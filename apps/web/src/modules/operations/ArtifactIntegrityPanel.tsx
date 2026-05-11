type ArtifactRecord = {
  id: string;
  type: string;
  label: string;
  hash: string;
  createdAt: string;
  status: 'valid' | 'missing_payload' | 'hash_mismatch' | 'orphaned';
};

type Props = {
  artifacts: ArtifactRecord[];
};

export function ArtifactIntegrityPanel({ artifacts }: Props) {
  if (artifacts.length === 0) {
    return <div data-testid="artifact-integrity-empty">No artifacts to verify.</div>;
  }

  const issues = artifacts.filter((a) => a.status !== 'valid');

  return (
    <div data-testid="artifact-integrity">
      <h3>
        Artifact Integrity{' '}
        {issues.length > 0 && (
          <span data-testid="integrity-issue-count" style={{ color: '#ef4444' }}>
            ({issues.length} issue{issues.length > 1 ? 's' : ''})
          </span>
        )}
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Label</th>
            <th style={{ textAlign: 'left' }}>Type</th>
            <th style={{ textAlign: 'left' }}>Status</th>
            <th style={{ textAlign: 'left' }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {artifacts.map((art) => (
            <tr key={art.id} data-testid={`artifact-${art.id}`}>
              <td>{art.label}</td>
              <td>{art.type}</td>
              <td style={{ color: art.status === 'valid' ? '#22c55e' : '#ef4444' }}>
                {art.status}
              </td>
              <td style={{ fontSize: '0.85em', opacity: 0.7 }}>{art.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type { ArtifactRecord };
