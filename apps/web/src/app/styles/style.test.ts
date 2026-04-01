import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const stylePath = fileURLToPath(new URL("./style.css", import.meta.url));
const consoleI18nPath = fileURLToPath(new URL("../../modules/console/console.i18n.tsx", import.meta.url));
const style = readFileSync(stylePath, "utf8");
const consoleI18n = readFileSync(consoleI18nPath, "utf8");

describe("command-deck theme stylesheet", () => {
  it("includes the core theme tokens and animation hook", () => {
    expect(style).toContain("--bg-canvas");
    expect(style).toContain("--panel-frame");
    expect(style).toContain("--accent-live");
    expect(style).toContain("--text-strong");
    expect(style).toContain("--font-display");
    expect(style).toContain("@keyframes panel-enter");
  });

  it("includes the upgraded shell framing selectors", () => {
    expect(style).toContain(".app-shell::before");
    expect(style).toContain(".sidebar::after");
    expect(style).toContain(".toolbar-pill");
    expect(style).toContain(".main-panel::before");
    expect(style).toContain(".topbar {");
    expect(style).toContain(".topbar::before");
  });

  it("includes shared data-surface selectors for tables, logs, and inspection rows", () => {
    expect(style).toContain(".table-wrap table");
    expect(style).toContain(".table-row-hover");
    expect(style).toContain(".log-item");
    expect(style).toContain(".inspection-actions");
    expect(style).toContain(".focus-row::before");
  });

  it("includes overview-specific command deck selectors", () => {
    expect(style).toContain(".overview-command-card");
    expect(style).toContain(".overview-kpi-card");
    expect(style).toContain(".overview-blotter-grid");
    expect(style).toContain(".hero-card-primary::after");
  });

  it("keeps route harmonization selectors wired into the priority console pages", () => {
    expect(style).toContain(".shortcut-surface");
    expect(style).toContain(".policy-card-inline");
    expect(style).toContain(".settings-chip-row");
    expect(style).toContain(".panel-grid-wide");
  });

  it("keeps shared command-deck copy centralized", () => {
    expect(consoleI18n).toContain("commandDeck");
    expect(consoleI18n).toContain("tacticalRoutes");
    expect(consoleI18n).toContain("deskBrief");
    expect(consoleI18n).toContain("autonomyControls");
    expect(consoleI18n).toContain("systemPulse");
    expect(consoleI18n).toContain("connectivity");
    expect(consoleI18n).toContain("deskNotes");
  });
});
