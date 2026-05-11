export function KillSwitchPanel({
  state,
  locale,
}: {
  state: {
    active: boolean;
    activatedAt: string | null;
    activatedBy: string | null;
    reason: string | null;
  };
  locale: 'zh' | 'en';
}) {
  const labels = {
    zh: {
      title: '紧急熔断',
      active: '已激活',
      inactive: '未激活',
      activatedBy: '触发人',
      reason: '原因',
      time: '触发时间',
      confirm: '需要输入确认才能切换',
    },
    en: {
      title: 'Kill Switch',
      active: 'ACTIVE',
      inactive: 'Inactive',
      activatedBy: 'Activated By',
      reason: 'Reason',
      time: 'Activated At',
      confirm: 'Typed confirmation required to toggle',
    },
  }[locale];

  return (
    <section className="kill-switch-panel" data-active={state.active}>
      <h3>{labels.title}</h3>
      <div className="kill-switch-status">
        <span className={`kill-switch-badge ${state.active ? 'kill-active' : 'kill-inactive'}`}>
          {state.active ? labels.active : labels.inactive}
        </span>
      </div>
      {state.active ? (
        <div className="kill-switch-details">
          <div className="kill-field">
            <span className="field-label">{labels.activatedBy}</span>
            <span className="field-value">{state.activatedBy || '--'}</span>
          </div>
          <div className="kill-field">
            <span className="field-label">{labels.reason}</span>
            <span className="field-value">{state.reason || '--'}</span>
          </div>
          <div className="kill-field">
            <span className="field-label">{labels.time}</span>
            <span className="field-value">{state.activatedAt || '--'}</span>
          </div>
        </div>
      ) : null}
      <p className="kill-switch-confirm">{labels.confirm}</p>
    </section>
  );
}
