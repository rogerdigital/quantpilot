import { type ReactNode, useCallback, useState } from 'react';
import { SplitPane } from './SplitPane.js';
import {
  layoutArea,
  toolbar,
  toolbarBtn,
  toolbarBtnActive,
  workspace,
} from './TradingWorkspace.css.js';

export type LayoutPreset = 'default' | 'chart-focus' | 'order-focus' | 'monitor';

interface Panel {
  id: string;
  content: ReactNode;
}

interface TradingWorkspaceProps {
  panels: Panel[];
  className?: string;
}

const STORAGE_KEY = 'qp-trading-layout';

const presets: Record<LayoutPreset, { split: number; direction: 'horizontal' | 'vertical' }> = {
  default: { split: 300, direction: 'horizontal' },
  'chart-focus': { split: 200, direction: 'horizontal' },
  'order-focus': { split: 400, direction: 'horizontal' },
  monitor: { split: 250, direction: 'vertical' },
};

function loadPreset(): LayoutPreset {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in presets) return saved as LayoutPreset;
  } catch {
    // ignore
  }
  return 'default';
}

export function TradingWorkspace({ panels, className = '' }: TradingWorkspaceProps) {
  const [preset, setPreset] = useState<LayoutPreset>(loadPreset);

  const handlePresetChange = useCallback((p: LayoutPreset) => {
    setPreset(p);
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch {
      // ignore
    }
  }, []);

  const { split, direction } = presets[preset];

  if (panels.length < 2) {
    return <div className={`${workspace} ${className}`}>{panels[0]?.content}</div>;
  }

  const left = panels[0].content;
  const right = panels.slice(1).map((p) => p.content);

  return (
    <div className={`${workspace} ${className}`}>
      <div className={toolbar}>
        {(Object.keys(presets) as LayoutPreset[]).map((p) => (
          <button
            key={p}
            type="button"
            className={`${toolbarBtn}${p === preset ? ` ${toolbarBtnActive}` : ''}`}
            onClick={() => handlePresetChange(p)}
          >
            {p.replace('-', ' ')}
          </button>
        ))}
      </div>
      <div className={layoutArea}>
        <SplitPane direction={direction} defaultSize={split}>
          {left}
          <div
            style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}
          >
            {right}
          </div>
        </SplitPane>
      </div>
    </div>
  );
}
