import type { ReactNode } from 'react';
import * as css from './PanelHeader.css.ts';

/* -- PANEL HEADER (full) --------------------------------- */

interface PanelHeaderProps {
  title: string;
  badge?: ReactNode;
  description?: string;
}

export function PanelHeader({ title, badge, description }: PanelHeaderProps) {
  return (
    <div className={css.panelHeaderWrap}>
      <div className={css.panelHeaderContent}>
        <div className={css.panelHeaderTitle}>{title}</div>
        {description && <p className={css.panelHeaderDescription}>{description}</p>}
      </div>
      {badge}
    </div>
  );
}

/* -- PANEL HEADER COMPACT -------------------------------- */

interface PanelHeaderCompactProps {
  title: string;
}

export function PanelHeaderCompact({ title }: PanelHeaderCompactProps) {
  return <div className={css.panelHeaderCompact}>{title}</div>;
}
