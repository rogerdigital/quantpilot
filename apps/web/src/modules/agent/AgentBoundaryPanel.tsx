import { useLocale } from '../console/console.i18n.tsx';

type ToolEntry = {
  name: string;
  category?: string;
  description?: string;
  reason?: string;
};

type AgentBoundaryPanelProps = {
  allowedTools: ToolEntry[];
  forbiddenTools: ToolEntry[];
};

export function AgentBoundaryPanel({ allowedTools, forbiddenTools }: AgentBoundaryPanelProps) {
  const { locale } = useLocale();

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 8,
        background: 'var(--surface-1, rgba(255,255,255,0.02))',
        border: '1px solid var(--border, rgba(255,255,255,0.06))',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
        {locale === 'zh' ? 'Agent 能力边界' : 'Agent Boundaries'}
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--accent-green, #22c55e)',
            marginBottom: 4,
            fontWeight: 500,
          }}
        >
          {locale === 'zh'
            ? `可用工具 (${allowedTools.length})`
            : `Allowed (${allowedTools.length})`}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {allowedTools.map((tool) => (
            <div
              key={tool.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '3px 6px',
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{tool.name.replace(/_/g, ' ')}</span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                {tool.category || 'read'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--accent-red, #ef4444)',
            marginBottom: 4,
            fontWeight: 500,
          }}
        >
          {locale === 'zh'
            ? `禁止操作 (${forbiddenTools.length})`
            : `Forbidden (${forbiddenTools.length})`}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {forbiddenTools.map((tool) => (
            <div
              key={tool.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '3px 6px',
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              <span style={{ color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                {tool.name.replace(/_/g, ' ')}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                {tool.reason || ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          fontSize: 11,
          color: 'var(--text-tertiary)',
          padding: '6px 0 0',
          borderTop: '1px solid var(--border, rgba(255,255,255,0.06))',
        }}
      >
        {locale === 'zh'
          ? '所有审批操作必须由人类或策略控制。Agent 只能建议，不能执行受限操作。'
          : 'Approval actions remain human/policy controlled. Agent can advise but cannot execute restricted operations.'}
      </div>
    </div>
  );
}
