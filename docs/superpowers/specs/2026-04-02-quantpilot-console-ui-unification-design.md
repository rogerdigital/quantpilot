# QuantPilot Console UI Unification Design

**Date:** 2026-04-02
**Scope:** `apps/web` console shell, shared visual system, and the major operator-facing surfaces rendered through the existing dashboard routes.

## Goal

Unify the QuantPilot web console under a single "financial command center" visual system that feels credible, high-signal, and memorable while preserving the current information architecture and route structure.

The redesign should improve the entire operator experience rather than polishing isolated screens. Shared shell elements, panels, tables, tags, forms, and inspection surfaces should read as one product with one point of view.

## Product Context

QuantPilot is not a generic SaaS dashboard. It is an operator console for monitoring market state, research output, execution flow, risk posture, automation health, and account configuration. The interface has to balance two goals:

1. High information density for frequent users.
2. Clear hierarchy so the system still feels calm under load.

The redesign should therefore emphasize scanability, operational confidence, and consistent state communication over novelty for its own sake.

## Approved Design Direction

The selected direction is **Unified Command Deck** with a **Financial War Room** tone.

### Visual Character

- Deep, instrument-panel base surfaces instead of generic flat dark SaaS panels.
- Cold mineral blues and controlled teal accents instead of purple gradients.
- A stronger editorial/technical typography pairing that separates headings, metrics, and body copy.
- Layered atmospheric backgrounds, restrained grid textures, and subtle "signal" motion.
- Dense but deliberate composition: primary desk, side monitors, data trays, and inspection rails.

### What Should Be Memorable

The product should feel like a serious trading command center: a place where people supervise systems, not just browse cards. The strongest memory should be the feeling of sitting at a coordinated desk with instruments, rather than inside a templated admin panel.

## Constraints

### Technical

- Keep the existing Vite + React app structure.
- Preserve the current route map and business logic wiring.
- Prefer centralized styling updates through the shared stylesheet and existing shared layout components.
- Avoid introducing heavy new dependencies when CSS and current React patterns are sufficient.

### UX

- Preserve bilingual support and current copy pathways.
- Maintain readability for long tables, dense status stacks, and inspection panels.
- Keep interactions keyboard- and pointer-friendly.
- Avoid visual ideas that make data harder to compare or tables harder to scan.

## Design Principles

### 1. One Console, Not Many Mini-Apps

Every page should feel like part of the same desk. The shell, cards, tables, badges, and headers should share a consistent visual grammar so moving from dashboard to market to execution to settings feels like moving between stations in one control room.

### 2. Status Must Read Instantly

Connectivity, risk posture, execution state, queue state, and mode state should have a stronger common language. Colors, borders, fills, labels, and emphasis should tell the user whether something is healthy, degraded, blocked, warning, or live without requiring re-interpretation per page.

### 3. Density With Air

The redesign should not chase oversized cards or excessive whitespace. Instead, it should use sharper spacing rules, cleaner alignment, better typography, and stronger grouping to let dense information breathe.

### 4. Shared Surfaces First

The highest leverage work is not page-specific decoration. It is the redesign of common shell and component primitives so that every existing page benefits immediately.

### 5. Bold, But Operational

The interface should be visually distinctive, but never theatrical to the point of harming trust. Motion, glows, textures, and decorative lines must support legibility and focus.

## Primary Change Areas

### A. Global Shell

Rework the application shell into a stronger command-deck layout:

- More deliberate sidebar with upgraded branding, route grouping feel, and clearer active-state behavior.
- Top toolbar that reads as a live tactical strip rather than a plain utility row.
- Main content framing that gives each page a desk-like stage with layered depth.
- Background treatment that adds atmosphere without reducing contrast.

### B. Global Visual Tokens

Replace the current ad hoc feel with a stronger shared token set:

- Background, panel, elevated panel, and inset surface colors.
- Border and highlight strengths for idle, hover, active, and alert states.
- Metric, heading, body, meta, and mono/data typography scales.
- Unified radius, shadow, blur, and overlay rules.
- Shared motion timings for hover, reveal, and state change transitions.

### C. Shared Component Language

Upgrade the common primitives that multiple pages already depend on:

- `panel`
- `panel-head`
- `panel-badge`
- `status-chip`
- meta cards
- buttons and inline action links
- table wrappers and row states
- focus lists and dense list rows
- form sections and settings cards
- empty states and helper copy

These should all inherit the same visual system so page-level work becomes mostly compositional.

### D. Dashboard Surface

Make the overview page the clearest expression of the new direction:

- Stronger hero command deck with better hierarchy between headline NAV, risk state, and key stats.
- KPI cards that look like coordinated desk instruments, not isolated blocks.
- Chart panels with more premium framing and better secondary metrics treatment.
- Watchlist and recent orders surfaces that feel like structured data trays.

### E. Heavy Data Pages

Market, execution, risk, notifications, research, agent, and settings should not be individually reimagined from scratch. Instead, they should inherit the upgraded shell and shared surface system, then receive focused refinements where needed:

- better section headers
- stronger layout rhythm
- improved data/table readability
- more intentional control and settings styling
- clearer action affordances

## Page Prioritization

### Priority 1

- Shared shell and global CSS system
- Dashboard / overview
- Common table, panel, and badge primitives

### Priority 2

- Market
- Execution
- Settings

### Priority 3

- Risk
- Notifications
- Research / strategies / backtest
- Agent

Lower-priority pages should still improve automatically through shared primitives even if they receive little page-specific restructuring.

## Typography Direction

The current typography should be replaced with a more ownable pairing:

- Display/headline font: distinctive, technical, slightly editorial, appropriate for control surfaces.
- Body/data font: highly legible for bilingual UI and dense operational text.

Typography must clearly separate:

- route/page identity
- live metrics
- labels and metadata
- dense explanatory copy
- tabular/data values

## Color Direction

Use a dark command-center palette anchored in navy, steel, and graphite rather than a generic black UI. Accent colors should be functionally mapped:

- teal/cyan for live, connected, and favorable active states
- blue for neutral technical emphasis
- amber for warning/watch posture
- red for blocked/failure/sell/danger states
- muted mineral tones for secondary metadata

The palette should remain restrained enough that status accents keep their meaning.

## Motion Direction

Motion should be subtle and purposeful:

- soft panel reveal on initial load
- more premium hover transitions for nav items, cards, buttons, and rows
- gentle elevation and border response on interaction
- restrained shimmering or radial emphasis only where it supports the "live system" feel

Avoid decorative animation loops that feel noisy or game-like.

## Interaction and Accessibility Expectations

- Preserve contrast and readability across all dense surfaces.
- Keep interactive targets clear in both pointer and keyboard flows.
- Ensure active, hover, focus, and selected states are visually distinct.
- Do not rely on color alone for important states where copy or icon-like affordances already exist.
- Preserve responsive behavior for narrower screens without flattening the design into a generic stacked mobile card list.

## Implementation Strategy

The redesign should be implemented in layers to minimize risk:

### Phase 1: Foundation

- Update the shared stylesheet tokens and foundational layout rules.
- Refactor the shared console shell component to establish the new brand, sidebar, and toolbar feel.

### Phase 2: Shared Primitives

- Upgrade panel, badge, meta, table, list, and form styling.
- Ensure the existing page surfaces inherit the new system cleanly.

### Phase 3: Showcase Surface

- Refine the overview page to fully express the new direction.

### Phase 4: Page Harmonization

- Tune market, execution, settings, and the remaining major routes where page-specific adjustments are needed after the shared-system changes land.

## Out of Scope

The redesign does not include:

- changing route structure or information architecture
- rewriting domain logic or control-plane behavior
- introducing a brand new component framework
- rebuilding every page from scratch
- altering core copy or localization architecture beyond what the refreshed presentation needs

## Acceptance Criteria

The redesign is successful when:

1. The app feels visually unified across shell, dashboard, tables, settings, and inspection surfaces.
2. The dashboard reads as a premium trading command center rather than a standard admin screen.
3. Shared states such as live, degraded, warning, blocked, and active are more consistent across pages.
4. Dense pages remain readable and operationally credible.
5. Existing routes and business workflows continue to function without behavioral regressions.
6. The app builds successfully after the styling and layout changes.

## Risks and Mitigations

### Risk: Shared CSS changes accidentally regress dense pages

Mitigation: change shared tokens and primitives first, then inspect the most complex pages and tighten page-specific rules where inheritance produces awkward results.

### Risk: The design becomes too decorative for a trading console

Mitigation: favor structural improvements, typography, surface depth, and disciplined status treatment over novelty effects.

### Risk: A global redesign becomes too large to finish coherently

Mitigation: prioritize shell, shared primitives, and the overview page first; let lower-priority pages benefit from the system before applying targeted refinements.
