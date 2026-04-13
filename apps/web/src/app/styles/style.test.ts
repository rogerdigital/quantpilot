import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const stylesDir = new URL('./', import.meta.url);
const read = (name: string) => readFileSync(fileURLToPath(new URL(name, stylesDir)), 'utf8');

const theme = read('theme.css.ts');
const animations = read('animations.css.ts');
const layout = read('layout.css.ts');
const panels = read('panels.css.ts');
const chips = read('chips.css.ts');
const tables = read('tables.css.ts');
const settings = read('settings.css.ts');

const consoleI18nPath = fileURLToPath(
  new URL('../../modules/console/console.i18n.tsx', import.meta.url)
);
const consoleI18n = readFileSync(consoleI18nPath, 'utf8');

describe('command-deck theme stylesheet', () => {
  it('includes the core theme tokens and animation hook', () => {
    expect(theme).toContain('--bg-canvas');
    expect(theme).toContain('--panel-frame');
    expect(theme).toContain('--accent-live');
    expect(theme).toContain('--text-strong');
    expect(theme).toContain('--font-display');
    expect(animations).toContain('panelEnter');
  });

  it('includes the upgraded shell framing selectors', () => {
    expect(layout).toContain('.app-shell::before');
    expect(layout).toContain('.sidebar::after');
    expect(layout).toContain('.toolbar-pill');
    expect(layout).toContain('.main-panel::before');
    expect(layout).toContain("'.topbar'");
    expect(layout).toContain('.topbar::before');
  });

  it('includes shared data-surface selectors for tables, logs, and inspection rows', () => {
    expect(tables).toContain('.table-wrap table');
    expect(tables).toContain('.table-row-hover');
    expect(tables).toContain('.log-item');
    expect(tables).toContain('.inspection-actions');
    expect(tables).toContain('.focus-row::before');
  });

  it('includes overview-specific command deck selectors', () => {
    expect(panels).toContain('.overview-command-card');
    expect(panels).toContain('.overview-kpi-card');
    expect(panels).toContain('.overview-blotter-grid');
    expect(panels).toContain('.hero-card-primary::after');
  });

  it('keeps route harmonization selectors wired into the priority console pages', () => {
    expect(panels).toContain('.shortcut-surface');
    expect(settings).toContain('.policy-card-inline');
    expect(settings).toContain('.settings-chip-row');
    expect(panels).toContain('.panel-grid-wide');
  });

  it('keeps shared command-deck copy centralized', () => {
    expect(consoleI18n).toContain('commandDeck');
    expect(consoleI18n).toContain('tacticalRoutes');
    expect(consoleI18n).toContain('deskBrief');
    expect(consoleI18n).toContain('autonomyControls');
    expect(consoleI18n).toContain('systemPulse');
    expect(consoleI18n).toContain('connectivity');
    expect(consoleI18n).toContain('deskNotes');
  });
});
