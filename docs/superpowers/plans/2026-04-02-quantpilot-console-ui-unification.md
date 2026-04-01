# QuantPilot Console UI Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `apps/web` console shell and shared visual system into a unified financial command-center UI without changing route structure or business behavior.

**Architecture:** The work centers on the shared shell and stylesheet so most pages inherit the redesign automatically. Page-specific changes are limited to the overview surface and a few high-value route layouts where shared primitives alone will not fully express the new command-deck direction.

**Tech Stack:** React, React Router, TypeScript, Vite, shared global CSS in `apps/web/src/app/styles/style.css`

---

## File Map

### Shared foundation

- Modify: `apps/web/src/app/styles/style.css`
  - Source of truth for tokens, shell layout, panels, badges, lists, tables, form surfaces, animation, and responsive behavior.
- Modify: `apps/web/src/components/layout/ConsoleChrome.tsx`
  - Shared shell, global toolbar, route header, top meta, and chart framing.
- Modify: `apps/web/src/pages/console/components/ConsoleChrome.tsx`
  - Mirror exports or shell usage if the older path remains the actively imported shell entry.

### Shared surfaces

- Modify: `apps/web/src/components/business/ConsoleTables.tsx`
  - Dense data tables, log list, approval queue actions, row-level affordances.
- Modify: `apps/web/src/pages/console/components/InspectionPanels.tsx`
  - Inspection surfaces and dense metric rows that must match the new visual grammar.

### Priority pages

- Modify: `apps/web/src/pages/console/routes/OverviewPage.tsx`
  - Showcase command-deck surface.
- Modify: `apps/web/src/pages/console/routes/MarketPage.tsx`
  - Shared panel and data-table harmonization.
- Modify: `apps/web/src/pages/console/routes/ExecutionPage.tsx`
  - Execution workbench harmonization.
- Modify: `apps/web/src/pages/console/routes/SettingsPage.tsx`
  - Settings/forms harmonization.

### Verification

- Run: `pnpm --filter @quantpilot/web build`

---

### Task 1: Add CSS verification tests for the command-deck theme

**Files:**
- Create: `apps/web/src/app/styles/style.test.ts`
- Test: `apps/web/src/app/styles/style.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const stylePath = path.resolve(process.cwd(), 'src/app/styles/style.css');
const css = fs.readFileSync(stylePath, 'utf8');

describe('command-deck theme tokens', () => {
  it('defines the new shell-level variables and animation primitives', () => {
    expect(css).toContain('--bg-canvas');
    expect(css).toContain('--panel-elevated');
    expect(css).toContain('--accent-live');
    expect(css).toContain('--accent-warn');
    expect(css).toContain('--font-display');
    expect(css).toContain('@keyframes panel-enter');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @quantpilot/web exec vitest run src/app/styles/style.test.ts`

Expected: FAIL because the current stylesheet does not define the new variables or animation.

- [ ] **Step 3: Add Vitest dependency and test script if missing**

```json
{
  "scripts": {
    "dev": "vite --config vite.config.ts --host 0.0.0.0 --port 8080",
    "build": "vite build --config vite.config.ts",
    "preview": "vite preview --config vite.config.ts --host 0.0.0.0 --port 8080",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 4: Run the targeted test again**

Run: `pnpm --filter @quantpilot/web exec vitest run src/app/styles/style.test.ts`

Expected: still FAIL, but now the test runner executes correctly.

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json apps/web/src/app/styles/style.test.ts
git commit -m "test: add console theme token coverage"
```

---

### Task 2: Rebuild the shared shell and global token system

**Files:**
- Modify: `apps/web/src/app/styles/style.css`
- Modify: `apps/web/src/components/layout/ConsoleChrome.tsx`
- Modify: `apps/web/src/pages/console/components/ConsoleChrome.tsx`
- Test: `apps/web/src/app/styles/style.test.ts`

- [ ] **Step 1: Extend the failing test for shell-specific selectors**

```ts
it('defines the upgraded shell selectors', () => {
  expect(css).toContain('.app-shell::before');
  expect(css).toContain('.sidebar::after');
  expect(css).toContain('.toolbar-pill');
  expect(css).toContain('.main-panel::before');
  expect(css).toContain('.topbar-shell');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @quantpilot/web exec vitest run src/app/styles/style.test.ts`

Expected: FAIL because the current stylesheet lacks the upgraded shell selectors.

- [ ] **Step 3: Implement the shell and token redesign**

```tsx
function Sidebar() {
  const { locale } = useLocale();
  const routes = listSidebarRoutes();

  return (
    <aside className="sidebar">
      <div className="sidebar-orbit" aria-hidden="true" />
      <div className="brand">
        <div className="brand-mark">
          <span className="brand-mark-core" />
        </div>
        <div>
          <div className="brand-kicker">system desk</div>
          <div className="brand-name">{copy[locale].product}</div>
          <div className="brand-sub">{copy[locale].tagline}</div>
        </div>
      </div>
      <div className="sidebar-section-label">{locale === 'zh' ? '主控导航' : 'Command Routes'}</div>
      <nav className="nav-stack">
        {routes.map((route) => (
          <NavLink key={route.path} to={route.path} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-link-label">{copy[locale].nav[route.id]}</span>
            <span className="nav-link-glow" aria-hidden="true" />
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export function Layout() {
  const location = useLocation();
  const { locale } = useLocale();

  useEffect(() => {
    document.title = getConsoleDocumentTitle(locale, location.pathname);
  }, [locale, location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-panel">
        <div className="main-panel-frame">
          <GlobalToolbar />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
```

```css
:root {
  --bg-canvas: #06111b;
  --bg-canvas-2: #0a1722;
  --panel: rgba(10, 20, 31, 0.78);
  --panel-elevated: rgba(15, 29, 44, 0.9);
  --panel-inset: rgba(9, 17, 27, 0.92);
  --line: rgba(135, 170, 205, 0.14);
  --line-strong: rgba(149, 193, 236, 0.34);
  --accent-live: #58e0c1;
  --accent-tech: #7fb5ff;
  --accent-warn: #f1bb61;
  --accent-danger: #ff7f88;
  --font-display: "Sora", "IBM Plex Sans SC", sans-serif;
  --font-body: "IBM Plex Sans SC", sans-serif;
}

@keyframes panel-enter {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 4: Run the targeted theme test**

Run: `pnpm --filter @quantpilot/web exec vitest run src/app/styles/style.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/styles/style.css apps/web/src/components/layout/ConsoleChrome.tsx apps/web/src/pages/console/components/ConsoleChrome.tsx apps/web/src/app/styles/style.test.ts
git commit -m "feat: rebuild console shell theme"
```

---

### Task 3: Upgrade shared data surfaces and inspection primitives

**Files:**
- Modify: `apps/web/src/app/styles/style.css`
- Modify: `apps/web/src/components/business/ConsoleTables.tsx`
- Modify: `apps/web/src/pages/console/components/InspectionPanels.tsx`
- Test: `apps/web/src/app/styles/style.test.ts`

- [ ] **Step 1: Add failing assertions for table and inspection selectors**

```ts
it('defines shared data-surface selectors', () => {
  expect(css).toContain('.table-wrap table');
  expect(css).toContain('.table-row-hover');
  expect(css).toContain('.log-item');
  expect(css).toContain('.inspection-actions');
  expect(css).toContain('.focus-row::before');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @quantpilot/web exec vitest run src/app/styles/style.test.ts`

Expected: FAIL because the new dense-surface selectors are not present yet.

- [ ] **Step 3: Implement shared surface upgrades**

```tsx
export function InspectionSelectableRow({ leadTitle, leadCopy, metrics, actions }: InspectionSelectableRowProps) {
  return (
    <div className="focus-row focus-row-selectable">
      {leadTitle || leadCopy ? (
        <div className="symbol-cell">
          {leadTitle ? <strong>{leadTitle}</strong> : null}
          {leadCopy ? <span>{leadCopy}</span> : null}
        </div>
      ) : null}
      {metrics.map((metric) => (
        <div className="focus-metric" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </div>
      ))}
      {actions ? <div className="inspection-actions">{actions}</div> : null}
    </div>
  );
}
```

```tsx
<tbody>
  {rows.map((stock) => (
    <tr key={stock.symbol} className="table-row-hover">
      ...
    </tr>
  ))}
</tbody>
```

```css
.table-wrap table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.table-row-hover {
  transition: background 160ms ease, transform 160ms ease;
}

.table-row-hover:hover {
  background: rgba(127, 181, 255, 0.06);
}

.focus-row::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 2px;
  background: linear-gradient(180deg, var(--accent-live), transparent);
  opacity: 0;
}

.focus-row-selectable:hover::before {
  opacity: 1;
}
```

- [ ] **Step 4: Run the targeted theme test**

Run: `pnpm --filter @quantpilot/web exec vitest run src/app/styles/style.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/styles/style.css apps/web/src/components/business/ConsoleTables.tsx apps/web/src/pages/console/components/InspectionPanels.tsx apps/web/src/app/styles/style.test.ts
git commit -m "feat: unify console data surfaces"
```

---

### Task 4: Recompose the overview page into the showcase command deck

**Files:**
- Modify: `apps/web/src/pages/console/routes/OverviewPage.tsx`
- Modify: `apps/web/src/app/styles/style.css`
- Test: `apps/web/src/app/styles/style.test.ts`

- [ ] **Step 1: Add failing assertions for overview-specific shells**

```ts
it('defines the showcase overview surface selectors', () => {
  expect(css).toContain('.overview-command-card');
  expect(css).toContain('.overview-kpi-card');
  expect(css).toContain('.overview-blotter-grid');
  expect(css).toContain('.hero-card-primary::after');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @quantpilot/web exec vitest run src/app/styles/style.test.ts`

Expected: FAIL because the overview theme has not been rebuilt to the new command-deck treatment.

- [ ] **Step 3: Refine the overview composition without changing data logic**

```tsx
<section className="overview-hero-grid">
  <article className="hero-card hero-card-primary overview-command-card">
    <div className="card-eyebrow">Command Deck</div>
    <div className="overview-command-head">
      ...
    </div>
    <div className="hero-headline">
      <div className="hero-value">{fmtCurrency(totalNav)}</div>
      <div className={`hero-change ${totalPnlPct >= 0 ? 'text-up' : 'text-down'}`}>{fmtPct(totalPnlPct)}</div>
    </div>
    <div className="overview-command-strip">...</div>
  </article>
</section>
```

```css
.hero-card-primary::after {
  content: "";
  position: absolute;
  inset: -20% 25% auto auto;
  width: 240px;
  height: 240px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(88, 224, 193, 0.2), transparent 68%);
  pointer-events: none;
}
```

- [ ] **Step 4: Run the targeted theme test**

Run: `pnpm --filter @quantpilot/web exec vitest run src/app/styles/style.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/console/routes/OverviewPage.tsx apps/web/src/app/styles/style.css apps/web/src/app/styles/style.test.ts
git commit -m "feat: redesign overview command deck"
```

---

### Task 5: Harmonize market, execution, and settings around the new visual system

**Files:**
- Modify: `apps/web/src/pages/console/routes/MarketPage.tsx`
- Modify: `apps/web/src/pages/console/routes/ExecutionPage.tsx`
- Modify: `apps/web/src/pages/console/routes/SettingsPage.tsx`
- Modify: `apps/web/src/app/styles/style.css`
- Test: `apps/web/src/app/styles/style.test.ts`

- [ ] **Step 1: Add failing assertions for route harmonization selectors**

```ts
it('defines settings and workbench support selectors', () => {
  expect(css).toContain('.shortcut-surface');
  expect(css).toContain('.policy-card-inline');
  expect(css).toContain('.settings-chip-row');
  expect(css).toContain('.panel-grid-wide');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @quantpilot/web exec vitest run src/app/styles/style.test.ts`

Expected: FAIL because route-level harmonization selectors are incomplete.

- [ ] **Step 3: Tune the priority route layouts and supporting CSS**

```tsx
<section className="panel-grid panel-grid-wide">
  <article className="panel panel-market-pulse">...</article>
  <article className="panel panel-provider-status">...</article>
</section>
```

```css
.shortcut-surface {
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}

.shortcut-surface:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
}

.policy-card-inline,
.settings-chip-row,
.panel-grid-wide {
  /* harmonized route-specific support selectors */
}
```

- [ ] **Step 4: Run the targeted theme test**

Run: `pnpm --filter @quantpilot/web exec vitest run src/app/styles/style.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/console/routes/MarketPage.tsx apps/web/src/pages/console/routes/ExecutionPage.tsx apps/web/src/pages/console/routes/SettingsPage.tsx apps/web/src/app/styles/style.css apps/web/src/app/styles/style.test.ts
git commit -m "feat: harmonize command center route surfaces"
```

---

### Task 6: Run full verification and inspect final diffs

**Files:**
- Verify only

- [ ] **Step 1: Run the focused test suite**

Run: `pnpm --filter @quantpilot/web test`

Expected: PASS with the stylesheet coverage suite green.

- [ ] **Step 2: Run the web build**

Run: `pnpm --filter @quantpilot/web build`

Expected: PASS with a successful Vite production build.

- [ ] **Step 3: Review final diff for unintended route or logic changes**

Run: `git diff -- apps/web`

Expected: only shared styling, layout, and route presentation changes relevant to the redesign.

- [ ] **Step 4: Commit**

```bash
git add apps/web docs/superpowers/plans/2026-04-02-quantpilot-console-ui-unification.md
git commit -m "feat: unify quantpilot console ui"
```

---

## Self-Review

### Spec Coverage

- Global shell redesign: covered by Task 2.
- Shared tokens and visual grammar: covered by Task 2.
- Shared panels, badges, tables, lists, inspection surfaces: covered by Task 3.
- Dashboard as the showcase command desk: covered by Task 4.
- Market, execution, settings harmonization: covered by Task 5.
- Build verification: covered by Task 6.

### Placeholder Scan

- No `TBD`, `TODO`, or deferred “implement later” placeholders remain.
- Every task includes concrete files and commands.

### Type Consistency

- Shared shell work stays in `ConsoleChrome.tsx`.
- Dense-surface upgrades stay in `ConsoleTables.tsx` and `InspectionPanels.tsx`.
- Page-specific harmonization stays in the route files already used by the router.
