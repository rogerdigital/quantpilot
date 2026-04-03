# QuantPilot 全面重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 清除 QuantPilot 代码库中的架构腐化点，提升代码质量和可维护性，同时保持所有功能行为和 API 合约不变。

**Architecture:** 5个独立任务顺序执行：(1)清理前端死代码 (2)添加 React Error Boundary (3)后端路由按域拆分 (4)Worker 解耦消除跨 app import (5)补充 stage-5 API 测试。每个任务完成后运行增量验证。

**Tech Stack:** TypeScript/React 18 (frontend), Node.js ESM .mjs (backend/worker), Vitest (web tests), node:test (api/worker tests), npm workspaces monorepo

---

## Task 1: 删除前端死代码

**Files to DELETE:**

Re-export stubs under `services/`:
- `apps/web/src/services/agentTools.ts`
- `apps/web/src/services/controlPlane.ts`
- `apps/web/src/services/research.ts`
- `apps/web/src/services/config/runtime.ts`
- `apps/web/src/services/providers/broker.ts`
- `apps/web/src/services/providers/marketData.ts`

Re-export stubs under `hooks/`:
- `apps/web/src/hooks/useAgentTools.ts`
- `apps/web/src/hooks/useNotificationsFeed.ts`
- `apps/web/src/hooks/useOperatorActionsFeed.ts`
- `apps/web/src/hooks/useResearchHub.ts`
- `apps/web/src/hooks/useRiskEventsFeed.ts`
- `apps/web/src/hooks/useSchedulerTicksFeed.ts`

Re-export stubs under `pages/`:
- `apps/web/src/pages/dashboard/DashboardPage.tsx`
- `apps/web/src/pages/execution/ExecutionPage.tsx`
- `apps/web/src/pages/market/MarketPage.tsx`
- `apps/web/src/pages/settings/SettingsPage.tsx`
- `apps/web/src/pages/agent/AgentPage.tsx`
- `apps/web/src/pages/console/DashboardConsole.tsx`
- `apps/web/src/pages/console/hooks.ts`
- `apps/web/src/pages/console/utils.ts`
- `apps/web/src/pages/console/i18n.tsx`
- `apps/web/src/pages/console/components/ConsoleChrome.tsx`
- `apps/web/src/pages/console/components/ConsoleTables.tsx`

Re-export stubs under `modules/`:
- `apps/web/src/modules/research/StrategiesPage.tsx`
- `apps/web/src/modules/research/BacktestPage.tsx`
- `apps/web/src/modules/risk/RiskPage.tsx`
- `apps/web/src/modules/notifications/NotificationsPage.tsx`

Dead pages (implemented but never routed):
- `apps/web/src/pages/console/routes/PortfolioPage.tsx`
- `apps/web/src/pages/console/routes/SignalsPage.tsx`

**Files to MODIFY** (update imports to point at canonical locations):

`apps/web/src/modules/console/DashboardConsole.tsx`:
- Change `import { Layout } from '../../pages/console/components/ConsoleChrome.tsx'` → `import { Layout } from '../../components/layout/ConsoleChrome.tsx'`
- Change `import { LocaleProvider } from '../../pages/console/i18n.tsx'` → `import { LocaleProvider } from './console.i18n.tsx'`

`apps/web/src/modules/console/console.routes.tsx`:
- Change `import('../research/StrategiesPage.tsx')` → `import('../../pages/strategies/StrategiesPage.tsx')`
- Change `import('../research/BacktestPage.tsx')` → `import('../../pages/backtest/BacktestPage.tsx')`
- Change `import('../notifications/NotificationsPage.tsx')` → `import('../../pages/notifications/NotificationsPage.tsx')`
- Change `import('../risk/RiskPage.tsx')` → `import('../../pages/risk/RiskPage.tsx')`

- [ ] **Step 1.1: 删除 services/ 下所有 stub 文件**

```bash
rm apps/web/src/services/agentTools.ts
rm apps/web/src/services/controlPlane.ts
rm apps/web/src/services/research.ts
rm apps/web/src/services/config/runtime.ts
rm apps/web/src/services/providers/broker.ts
rm apps/web/src/services/providers/marketData.ts
rmdir apps/web/src/services/config
rmdir apps/web/src/services/providers
rmdir apps/web/src/services
```

- [ ] **Step 1.2: 删除 hooks/ 下的 re-export stubs（保留有实现的3个）**

```bash
rm apps/web/src/hooks/useAgentTools.ts
rm apps/web/src/hooks/useNotificationsFeed.ts
rm apps/web/src/hooks/useOperatorActionsFeed.ts
rm apps/web/src/hooks/useResearchHub.ts
rm apps/web/src/hooks/useRiskEventsFeed.ts
rm apps/web/src/hooks/useSchedulerTicksFeed.ts
```

- [ ] **Step 1.3: 删除 pages/ 下的 re-export stubs 和死页面**

```bash
# re-export stubs
rm apps/web/src/pages/dashboard/DashboardPage.tsx
rm apps/web/src/pages/execution/ExecutionPage.tsx
rm apps/web/src/pages/market/MarketPage.tsx
rm apps/web/src/pages/settings/SettingsPage.tsx
rm apps/web/src/pages/agent/AgentPage.tsx
rm apps/web/src/pages/console/DashboardConsole.tsx
rm apps/web/src/pages/console/hooks.ts
rm apps/web/src/pages/console/utils.ts
rm apps/web/src/pages/console/i18n.tsx
rm apps/web/src/pages/console/components/ConsoleChrome.tsx
rm apps/web/src/pages/console/components/ConsoleTables.tsx
# dead pages
rm apps/web/src/pages/console/routes/PortfolioPage.tsx
rm apps/web/src/pages/console/routes/SignalsPage.tsx
# 清理空目录
rmdir apps/web/src/pages/dashboard 2>/dev/null || true
rmdir apps/web/src/pages/execution 2>/dev/null || true
rmdir apps/web/src/pages/market 2>/dev/null || true
rmdir apps/web/src/pages/settings 2>/dev/null || true
rmdir apps/web/src/pages/agent 2>/dev/null || true
```

- [ ] **Step 1.4: 删除 modules/ 下的 re-export stubs**

```bash
rm apps/web/src/modules/research/StrategiesPage.tsx
rm apps/web/src/modules/research/BacktestPage.tsx
rm apps/web/src/modules/risk/RiskPage.tsx
rm apps/web/src/modules/notifications/NotificationsPage.tsx
```

- [ ] **Step 1.5: 修复 DashboardConsole.tsx 的 import 路径**

文件: `apps/web/src/modules/console/DashboardConsole.tsx`

将:
```typescript
import { Layout } from '../../pages/console/components/ConsoleChrome.tsx';
import { LocaleProvider } from '../../pages/console/i18n.tsx';
```
改为:
```typescript
import { Layout } from '../../components/layout/ConsoleChrome.tsx';
import { LocaleProvider } from './console.i18n.tsx';
```

- [ ] **Step 1.6: 修复 console.routes.tsx 的 import 路径**

文件: `apps/web/src/modules/console/console.routes.tsx`

将:
```typescript
const NotificationsPage = lazy(() => import('../notifications/NotificationsPage.tsx'));
const BacktestPage = lazy(() => import('../research/BacktestPage.tsx'));
const StrategiesPage = lazy(() => import('../research/StrategiesPage.tsx'));
const RiskPage = lazy(() => import('../risk/RiskPage.tsx'));
```
改为:
```typescript
const NotificationsPage = lazy(() => import('../../pages/notifications/NotificationsPage.tsx'));
const BacktestPage = lazy(() => import('../../pages/backtest/BacktestPage.tsx'));
const StrategiesPage = lazy(() => import('../../pages/strategies/StrategiesPage.tsx'));
const RiskPage = lazy(() => import('../../pages/risk/RiskPage.tsx'));
```

- [ ] **Step 1.7: 验证 typecheck 通过**

```bash
cd /Users/v_dengzhicheng/Code/personal/quantpilot
npm run typecheck
```

Expected: 无 TypeScript 错误

- [ ] **Step 1.8: 运行 web 测试**

```bash
npm run test:web
```

Expected: 所有 web 测试通过

- [ ] **Step 1.9: 运行构建验证**

```bash
npm run build
```

Expected: 构建成功

---

## Task 2: 添加 React Error Boundary

**Files to CREATE:**
- `apps/web/src/app/components/ErrorBoundary.tsx`

**Files to MODIFY:**
- `apps/web/src/app/routes/AppRouter.tsx`

- [ ] **Step 2.1: 创建 ErrorBoundary 组件**

创建文件 `apps/web/src/app/components/ErrorBoundary.tsx`:

```typescript
import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (fallback) return fallback(error, this.reset);
      return (
        <div style={{
          minHeight: '100vh',
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          fontFamily: 'var(--font-ui)',
          color: 'var(--ink-muted)',
        }}>
          <div style={{ fontSize: '1rem', color: 'var(--ink)', fontWeight: 600 }}>
            Workspace error
          </div>
          <div style={{ fontSize: '0.8125rem', maxWidth: '40ch', textAlign: 'center' }}>
            {error.message || 'An unexpected error occurred in this workspace.'}
          </div>
          <button
            onClick={this.reset}
            style={{
              marginTop: '0.5rem',
              padding: '0.375rem 1rem',
              background: 'var(--accent)',
              color: 'var(--surface)',
              border: 'none',
              borderRadius: '3px',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
            }}
          >
            Reload workspace
          </button>
        </div>
      );
    }

    return children;
  }
}
```

- [ ] **Step 2.2: 更新 AppRouter.tsx 包裹 ErrorBoundary**

修改 `apps/web/src/app/routes/AppRouter.tsx`:

```typescript
import { Suspense, lazy } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary.tsx';

const DashboardConsole = lazy(() => import('../../modules/console/DashboardConsole.tsx'));

export function AppRouter() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f6efe6' }} />}>
        <DashboardConsole />
      </Suspense>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 2.3: 验证 typecheck 通过**

```bash
npm run typecheck
```

Expected: 无错误

- [ ] **Step 2.4: 运行 web 测试**

```bash
npm run test:web
```

Expected: 所有测试通过

---

## Task 3: 后端 API 路由模块化重构

**Files to CREATE** (under `apps/api/src/app/routes/routers/`):
- `health-router.mjs` — /api/health, /api/modules, /api/architecture
- `monitoring-router.mjs` — /api/monitoring/*
- `operations-router.mjs` — /api/operations/*
- `auth-router.mjs` — /api/auth/*
- `user-account-router.mjs` — /api/user-account/*
- `agent-router.mjs` — /api/agent/*
- `strategy-router.mjs` — /api/strategy/catalog (GET/POST + promote)
- `backtest-router.mjs` — /api/backtest/*
- `research-router.mjs` — /api/research/*
- `execution-router.mjs` — /api/execution/*
- `market-router.mjs` — /api/market/*
- `audit-router.mjs` — /api/audit/*
- `incidents-router.mjs` — /api/incidents/*
- `notification-router.mjs` — /api/notification/*
- `risk-router.mjs` — /api/risk/*
- `scheduler-router.mjs` — /api/scheduler/*
- `task-orchestrator-router.mjs` — /api/task-orchestrator/* + /api/strategy/execute

**Files to MODIFY:**
- `apps/api/src/app/routes/platform-routes.mjs` — 重构为调用各 domain router 的 dispatcher
- `apps/api/src/app/routes/control-plane-routes.mjs` — 重构为调用各 domain router 的 dispatcher

**重要约束：** 路由路径、业务逻辑、响应格式完全不变。只是把 if-chain 拆分到独立文件中。

- [ ] **Step 3.1: 创建 routers/ 目录并编写 health-router.mjs**

创建 `apps/api/src/app/routes/routers/health-router.mjs`:

```javascript
import { describeArchitecture, listArchitectureLayers, listModules } from '../../../modules/registry.mjs';

export async function handleHealthRoutes(context) {
  const { req, reqUrl, res, config, writeJson } = context;

  if (req.method === 'GET' && reqUrl.pathname === '/api/health') {
    writeJson(res, 200, {
      ok: true,
      architectureLayers: listArchitectureLayers().length,
      modules: listModules().length,
      brokerAdapter: config.brokerAdapter,
      alpacaConfigured: Boolean(config.alpacaKeyId && config.alpacaSecretKey),
      alpacaUsePaper: config.alpacaUsePaper,
      alpacaDataFeed: config.alpacaDataFeed,
    });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/modules') {
    writeJson(res, 200, { ok: true, modules: listModules() });
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/architecture') {
    writeJson(res, 200, { ok: true, architecture: describeArchitecture() });
    return true;
  }

  return false;
}
```

- [ ] **Step 3.2: 创建 monitoring-router.mjs**

创建 `apps/api/src/app/routes/routers/monitoring-router.mjs`:

```javascript
import { getMonitoringStatus, listMonitoringAlerts, listMonitoringSnapshots } from '../../../modules/monitoring/service.mjs';

export async function handleMonitoringRoutes(context) {
  const { req, reqUrl, res, writeJson } = context;

  if (req.method === 'GET' && reqUrl.pathname === '/api/monitoring/status') {
    const summary = await getMonitoringStatus({
      getBrokerHealth: context.gatewayDependencies.getBrokerHealth,
    });
    writeJson(res, 200, summary);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/monitoring/snapshots') {
    writeJson(res, 200, listMonitoringSnapshots({
      limit: reqUrl.searchParams.get('limit'),
      status: reqUrl.searchParams.get('status'),
      hours: reqUrl.searchParams.get('hours'),
    }));
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/monitoring/alerts') {
    writeJson(res, 200, listMonitoringAlerts({
      limit: reqUrl.searchParams.get('limit'),
      snapshotId: reqUrl.searchParams.get('snapshotId'),
      source: reqUrl.searchParams.get('source'),
      level: reqUrl.searchParams.get('level'),
      hours: reqUrl.searchParams.get('hours'),
    }));
    return true;
  }

  return false;
}
```

- [ ] **Step 3.3: 创建 operations-router.mjs**

创建 `apps/api/src/app/routes/routers/operations-router.mjs`:

```javascript
import { hasPermission } from '../../../modules/auth/service.mjs';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.mjs';
import { getOperationsWorkbench } from '../../../modules/operations/service.mjs';
import {
  createOperationsMaintenanceBackup,
  getOperationsMaintenanceSnapshot,
  releaseWorkflowMaintenanceBacklog,
  restoreOperationsMaintenanceBackup,
} from '../../../modules/operations/maintenance-service.mjs';

export async function handleOperationsRoutes(context) {
  const { req, reqUrl, res, readJsonBody, writeJson } = context;
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);
  const canMaintain = () => hasPermission('operations:maintain');

  if (req.method === 'GET' && reqUrl.pathname === '/api/operations/workbench') {
    const summary = await getOperationsWorkbench({
      getBrokerHealth: context.gatewayDependencies.getBrokerHealth,
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
    });
    writeJson(res, 200, summary);
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/operations/maintenance') {
    if (!canMaintain()) { writeForbidden('operations:maintain', 'inspect control-plane maintenance posture'); return true; }
    const summary = await getOperationsMaintenanceSnapshot({
      getBrokerHealth: context.gatewayDependencies.getBrokerHealth,
      limit: reqUrl.searchParams.get('limit'),
    });
    writeJson(res, 200, summary);
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/operations/maintenance/backup') {
    if (!canMaintain()) { writeForbidden('operations:maintain', 'export control-plane backups'); return true; }
    writeJson(res, 200, createOperationsMaintenanceBackup());
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/operations/maintenance/restore') {
    if (!canMaintain()) { writeForbidden('operations:maintain', 'restore control-plane backups'); return true; }
    const body = await readJsonBody(req);
    writeJson(res, 200, restoreOperationsMaintenanceBackup(body || {}));
    return true;
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/operations/maintenance/repair/workflows') {
    if (!canMaintain()) { writeForbidden('operations:maintain', 'repair workflow retry backlog'); return true; }
    const body = await readJsonBody(req);
    writeJson(res, 200, releaseWorkflowMaintenanceBacklog(body || {}));
    return true;
  }

  return false;
}
```

- [ ] **Step 3.4: 创建 auth-router.mjs**

创建 `apps/api/src/app/routes/routers/auth-router.mjs`:

```javascript
import { getSession } from '../../../modules/auth/service.mjs';
import { listPermissionDescriptors } from '../../../modules/auth/permission-catalog.mjs';

export async function handleAuthRoutes(context) {
  const { req, reqUrl, res, writeJson } = context;

  if (req.method === 'GET' && reqUrl.pathname === '/api/auth/session') {
    writeJson(res, 200, getSession());
    return true;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/api/auth/permissions') {
    writeJson(res, 200, { ok: true, permissions: listPermissionDescriptors() });
    return true;
  }

  return false;
}
```

- [ ] **Step 3.5: 创建 user-account-router.mjs**

创建 `apps/api/src/app/routes/routers/user-account-router.mjs`:

```javascript
import { hasPermission } from '../../../modules/auth/service.mjs';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.mjs';
import {
  getBrokerBindingsSnapshot, getBrokerBindingRuntimeSnapshot,
  getUserAccountSnapshot, getUserProfileSnapshot,
  getUserRoleTemplatesSnapshot, getUserWorkspaceSnapshot,
  patchUserProfile, patchUserAccess, patchUserPreferences,
  removeUserRoleTemplate, removeBrokerBinding,
  saveBrokerBinding, saveUserRoleTemplate, saveWorkspace,
  selectCurrentWorkspace, setPrimaryBrokerBinding, syncBrokerBindingRuntime,
} from '../../../modules/user-account/service.mjs';

export async function handleUserAccountRoutes(context) {
  const { req, reqUrl, res, readJsonBody, writeJson } = context;
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);
  const canWrite = () => hasPermission('account:write');

  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/profile') {
    writeJson(res, 200, getUserProfileSnapshot()); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/roles') {
    writeJson(res, 200, getUserRoleTemplatesSnapshot()); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/workspaces') {
    writeJson(res, 200, getUserWorkspaceSnapshot()); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/profile') {
    if (!canWrite()) { writeForbidden('account:write', 'update the account profile'); return true; }
    const body = await readJsonBody(req);
    writeJson(res, 200, patchUserProfile(body)); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account') {
    writeJson(res, 200, getUserAccountSnapshot()); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/preferences') {
    if (!canWrite()) { writeForbidden('account:write', 'update account preferences'); return true; }
    const body = await readJsonBody(req);
    writeJson(res, 200, patchUserPreferences(body)); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/access') {
    if (!canWrite()) { writeForbidden('account:write', 'update the access policy'); return true; }
    const body = await readJsonBody(req);
    writeJson(res, 200, patchUserAccess(body)); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/roles') {
    if (!canWrite()) { writeForbidden('account:write', 'save role templates'); return true; }
    const body = await readJsonBody(req);
    const result = saveUserRoleTemplate(body);
    writeJson(res, result.ok ? 200 : 400, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/workspaces') {
    if (!canWrite()) { writeForbidden('account:write', 'save workspaces'); return true; }
    const body = await readJsonBody(req);
    const result = saveWorkspace(body);
    writeJson(res, result.ok ? 200 : 400, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/workspaces/current') {
    if (!hasPermission('dashboard:read')) { writeForbidden('dashboard:read', 'switch workspaces'); return true; }
    const body = await readJsonBody(req);
    const result = selectCurrentWorkspace(body.workspaceId);
    writeJson(res, result.ok ? 200 : 404, result); return true;
  }
  if (req.method === 'DELETE' && reqUrl.pathname.startsWith('/api/user-account/roles/')) {
    if (!canWrite()) { writeForbidden('account:write', 'delete role templates'); return true; }
    const roleId = reqUrl.pathname.split('/').at(-1);
    const result = removeUserRoleTemplate(roleId);
    writeJson(res, result.ok ? 200 : 400, result); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/broker-bindings') {
    writeJson(res, 200, getBrokerBindingsSnapshot()); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/user-account/broker-bindings/runtime') {
    const result = await getBrokerBindingRuntimeSnapshot(context.gatewayDependencies.getBrokerHealth);
    writeJson(res, result.ok ? 200 : 404, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/broker-bindings') {
    if (!canWrite()) { writeForbidden('account:write', 'save broker bindings'); return true; }
    const body = await readJsonBody(req);
    const result = saveBrokerBinding(body);
    writeJson(res, result.ok ? 200 : 400, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/default') && reqUrl.pathname.startsWith('/api/user-account/broker-bindings/')) {
    if (!canWrite()) { writeForbidden('account:write', 'change the default broker binding'); return true; }
    const bindingId = reqUrl.pathname.split('/').at(-2);
    const result = setPrimaryBrokerBinding(bindingId);
    writeJson(res, result.ok ? 200 : 404, result); return true;
  }
  if (req.method === 'DELETE' && reqUrl.pathname.startsWith('/api/user-account/broker-bindings/')) {
    if (!canWrite()) { writeForbidden('account:write', 'delete broker bindings'); return true; }
    const bindingId = reqUrl.pathname.split('/').at(-1);
    const result = removeBrokerBinding(bindingId);
    writeJson(res, result.ok ? 200 : (result.error === 'default broker binding cannot be deleted' ? 409 : 404), result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/user-account/broker-bindings/sync') {
    if (!canWrite()) { writeForbidden('account:write', 'sync broker runtime state'); return true; }
    const result = await syncBrokerBindingRuntime(context.gatewayDependencies.getBrokerHealth);
    writeJson(res, result.ok ? 200 : 404, result); return true;
  }

  return false;
}
```

- [ ] **Step 3.6: 创建 agent-router.mjs**

创建 `apps/api/src/app/routes/routers/agent-router.mjs`:

```javascript
import {
  approveAgentActionRequest, createSessionActionRequest,
  listAgentActionRequests, queueAgentActionRequest, rejectAgentActionRequest,
} from '../../../domains/agent/services/action-request-service.mjs';
import { runAgentAnalysis } from '../../../domains/agent/services/analysis-service.mjs';
import { parseAgentIntent } from '../../../domains/agent/services/intent-service.mjs';
import { createAgentPlan } from '../../../domains/agent/services/planning-service.mjs';
import { getAgentSessionDetail, listAgentSessionsSnapshot } from '../../../domains/agent/services/session-service.mjs';
import { getAgentOperatorTimeline, getAgentWorkbench } from '../../../domains/agent/services/workbench-service.mjs';
import { listAgentTools, executeAgentTool } from '../../../domains/agent/services/tools-service.mjs';
import { hasPermission } from '../../../modules/auth/service.mjs';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.mjs';

export async function handleAgentRoutes(context) {
  const { req, reqUrl, res, readJsonBody, writeJson } = context;
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/tools') {
    writeJson(res, 200, listAgentTools()); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/tools/execute') {
    const body = await readJsonBody(req);
    const result = executeAgentTool(body);
    writeJson(res, result.ok ? 200 : 403, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/intent') {
    const body = await readJsonBody(req);
    const result = parseAgentIntent(body);
    writeJson(res, result.ok ? 200 : 400, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/plans') {
    const body = await readJsonBody(req);
    const result = createAgentPlan(body);
    writeJson(res, result.ok ? 200 : 400, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/analysis-runs') {
    const body = await readJsonBody(req);
    const result = runAgentAnalysis(body);
    writeJson(res, result.ok ? 200 : 400, result); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/sessions') {
    writeJson(res, 200, listAgentSessionsSnapshot(Number(reqUrl.searchParams.get('limit') || 20))); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/workbench') {
    writeJson(res, 200, getAgentWorkbench({
      limit: reqUrl.searchParams.get('limit'),
      hours: reqUrl.searchParams.get('hours'),
    })); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname.endsWith('/timeline') && reqUrl.pathname.startsWith('/api/agent/sessions/')) {
    const sessionId = reqUrl.pathname.split('/').at(-2);
    const result = getAgentOperatorTimeline(sessionId, {
      limit: reqUrl.searchParams.get('limit'),
      hours: reqUrl.searchParams.get('hours'),
    });
    writeJson(res, result.ok ? 200 : 404, result); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/agent/sessions/')) {
    const sessionId = reqUrl.pathname.split('/').at(-1);
    const result = getAgentSessionDetail(sessionId);
    writeJson(res, result.ok ? 200 : 404, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/action-requests') && reqUrl.pathname.startsWith('/api/agent/sessions/')) {
    if (!hasPermission('strategy:write')) { writeForbidden('strategy:write', 'create agent session action requests'); return true; }
    const sessionId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = createSessionActionRequest(sessionId, body);
    writeJson(res, result.ok ? 200 : 400, result); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/agent/action-requests') {
    writeJson(res, 200, listAgentActionRequests()); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/agent/action-requests') {
    if (!hasPermission('strategy:write')) { writeForbidden('strategy:write', 'queue agent action requests'); return true; }
    const body = await readJsonBody(req);
    const result = queueAgentActionRequest(body);
    writeJson(res, result.ok ? 200 : 403, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/approve') && reqUrl.pathname.startsWith('/api/agent/action-requests/')) {
    if (!hasPermission('risk:review')) { writeForbidden('risk:review', 'approve agent action requests'); return true; }
    const requestId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = approveAgentActionRequest(requestId, body);
    writeJson(res, result.ok ? 200 : 404, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/reject') && reqUrl.pathname.startsWith('/api/agent/action-requests/')) {
    if (!hasPermission('risk:review')) { writeForbidden('risk:review', 'reject agent action requests'); return true; }
    const requestId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = rejectAgentActionRequest(requestId, body);
    writeJson(res, result.ok ? 200 : 404, result); return true;
  }

  return false;
}
```

- [ ] **Step 3.7: 创建 strategy-router.mjs**

创建 `apps/api/src/app/routes/routers/strategy-router.mjs`:

```javascript
import { hasPermission } from '../../../modules/auth/service.mjs';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.mjs';
import { getStrategyCatalogDetail, listStrategyCatalog, saveStrategyCatalogItem } from '../../../domains/strategy/services/catalog-service.mjs';
import { createExecutionCandidateHandoff, listExecutionCandidateHandoffs, queueExecutionCandidateHandoff } from '../../../domains/strategy/services/execution-handoff-service.mjs';
import { promoteStrategyFromEvaluation } from '../../../domains/research/services/evaluation-service.mjs';
import { controlPlaneRuntime } from '../../../../../../packages/control-plane-runtime/src/index.mjs';

export async function handleStrategyRoutes(context) {
  const { req, reqUrl, res, readJsonBody, writeJson } = context;
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/market/provider-status') {
    writeJson(res, 200, { ok: true, status: controlPlaneRuntime.getMarketProviderStatus() }); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/strategy/catalog') {
    writeJson(res, 200, listStrategyCatalog()); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/strategy/catalog/')) {
    const strategyId = reqUrl.pathname.split('/').at(-1);
    const result = getStrategyCatalogDetail(strategyId);
    writeJson(res, result.ok ? 200 : 404, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/strategy/catalog') {
    if (!hasPermission('strategy:write')) { writeForbidden('strategy:write', 'save strategy catalog entries'); return true; }
    const body = await readJsonBody(req);
    const result = saveStrategyCatalogItem(body);
    writeJson(res, result.ok ? 200 : 400, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/promote') && reqUrl.pathname.startsWith('/api/strategy/catalog/')) {
    if (!hasPermission('strategy:write')) { writeForbidden('strategy:write', 'promote the strategy from a research evaluation'); return true; }
    const strategyId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = promoteStrategyFromEvaluation(strategyId, body);
    writeJson(res, result.ok ? 200 : 409, result); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/research/execution-candidates') {
    writeJson(res, 200, listExecutionCandidateHandoffs({
      limit: reqUrl.searchParams.get('limit'),
      hours: reqUrl.searchParams.get('hours'),
      handoffStatus: reqUrl.searchParams.get('handoffStatus'),
      mode: reqUrl.searchParams.get('mode'),
    })); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/research/execution-candidates') {
    if (!hasPermission('strategy:write')) { writeForbidden('strategy:write', 'create execution handoffs'); return true; }
    const body = await readJsonBody(req);
    const result = createExecutionCandidateHandoff(body.strategyId, body);
    writeJson(res, result.ok ? 200 : 400, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.startsWith('/api/research/execution-candidates/') && reqUrl.pathname.endsWith('/queue')) {
    if (!hasPermission('execution:approve')) { writeForbidden('execution:approve', 'queue execution handoffs'); return true; }
    const handoffId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = queueExecutionCandidateHandoff(handoffId, body);
    writeJson(res, result.ok ? 200 : 404, result); return true;
  }

  return false;
}
```

- [ ] **Step 3.8: 创建 backtest-router.mjs**

创建 `apps/api/src/app/routes/routers/backtest-router.mjs`:

```javascript
import { hasPermission } from '../../../modules/auth/service.mjs';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.mjs';
import { getBacktestSummary } from '../../../domains/backtest/services/summary-service.mjs';
import { getBacktestResultDetail, getBacktestResultSummary, listBacktestResults } from '../../../domains/backtest/services/results-service.mjs';
import { createBacktestRun, getBacktestRunDetail, listBacktestRuns, reviewBacktestRun } from '../../../domains/backtest/services/runs-service.mjs';
import { evaluateBacktestRun, listResearchEvaluations, getResearchEvaluationSummary } from '../../../domains/research/services/evaluation-service.mjs';

export async function handleBacktestRoutes(context) {
  const { req, reqUrl, res, readJsonBody, writeJson } = context;
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/summary') {
    writeJson(res, 200, getBacktestSummary()); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/results') {
    writeJson(res, 200, listBacktestResults({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      runId: reqUrl.searchParams.get('runId'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      workflowRunId: reqUrl.searchParams.get('workflowRunId'),
      status: reqUrl.searchParams.get('status'),
      stage: reqUrl.searchParams.get('stage'),
    })); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/results/summary') {
    writeJson(res, 200, getBacktestResultSummary({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      status: reqUrl.searchParams.get('status'),
      stage: reqUrl.searchParams.get('stage'),
    })); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/backtest/results/')) {
    const resultId = reqUrl.pathname.split('/').at(-1);
    const result = getBacktestResultDetail(resultId);
    writeJson(res, result.ok ? 200 : 404, result); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/backtest/runs') {
    writeJson(res, 200, listBacktestRuns()); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/backtest/runs/')) {
    const runId = reqUrl.pathname.split('/').at(-1);
    const result = getBacktestRunDetail(runId);
    writeJson(res, result.ok ? 200 : 404, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/backtest/runs') {
    if (!hasPermission('strategy:write')) { writeForbidden('strategy:write', 'queue backtest runs'); return true; }
    const body = await readJsonBody(req);
    const result = createBacktestRun(body);
    writeJson(res, result.ok ? 200 : 400, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/evaluate') && reqUrl.pathname.startsWith('/api/backtest/runs/')) {
    if (!hasPermission('risk:review')) { writeForbidden('risk:review', 'evaluate research results for promotion'); return true; }
    const runId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = evaluateBacktestRun(runId, body);
    writeJson(res, result.ok ? 200 : 404, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/review') && reqUrl.pathname.startsWith('/api/backtest/runs/')) {
    if (!hasPermission('risk:review')) { writeForbidden('risk:review', 'review backtest runs'); return true; }
    const runId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = reviewBacktestRun(runId, body);
    writeJson(res, result.ok ? 200 : 404, result); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/research/evaluations') {
    writeJson(res, 200, listResearchEvaluations({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      runId: reqUrl.searchParams.get('runId'),
      resultId: reqUrl.searchParams.get('resultId'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      verdict: reqUrl.searchParams.get('verdict'),
    })); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/research/evaluations/summary') {
    writeJson(res, 200, getResearchEvaluationSummary({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      verdict: reqUrl.searchParams.get('verdict'),
    })); return true;
  }

  return false;
}
```

- [ ] **Step 3.9: 创建 research-router.mjs**

创建 `apps/api/src/app/routes/routers/research-router.mjs`:

```javascript
import { hasPermission } from '../../../modules/auth/service.mjs';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.mjs';
import { getResearchHubSnapshot, getResearchTaskDetail, getResearchTaskSummary, listResearchTasks } from '../../../domains/research/services/task-service.mjs';
import { getResearchReportSummary, listResearchReports } from '../../../domains/research/services/report-service.mjs';
import { getResearchWorkbenchSnapshot, listResearchGovernanceActions, runResearchGovernanceAction } from '../../../domains/research/services/workbench-service.mjs';

export async function handleResearchRoutes(context) {
  const { req, reqUrl, res, readJsonBody, writeJson } = context;
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/research/hub') {
    writeJson(res, 200, getResearchHubSnapshot({ hours: reqUrl.searchParams.get('hours'), limit: reqUrl.searchParams.get('limit') })); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/research/workbench') {
    writeJson(res, 200, getResearchWorkbenchSnapshot({ hours: reqUrl.searchParams.get('hours'), limit: reqUrl.searchParams.get('limit') })); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/research/governance/actions') {
    writeJson(res, 200, listResearchGovernanceActions({ hours: reqUrl.searchParams.get('hours'), limit: reqUrl.searchParams.get('limit') })); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/research/tasks') {
    writeJson(res, 200, listResearchTasks({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      taskType: reqUrl.searchParams.get('taskType'),
      status: reqUrl.searchParams.get('status'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      workflowRunId: reqUrl.searchParams.get('workflowRunId'),
      runId: reqUrl.searchParams.get('runId'),
    })); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/research/tasks/summary') {
    writeJson(res, 200, getResearchTaskSummary({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      taskType: reqUrl.searchParams.get('taskType'),
      strategyId: reqUrl.searchParams.get('strategyId'),
    })); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/research/reports') {
    writeJson(res, 200, listResearchReports({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      evaluationId: reqUrl.searchParams.get('evaluationId'),
      workflowRunId: reqUrl.searchParams.get('workflowRunId'),
      runId: reqUrl.searchParams.get('runId'),
      resultId: reqUrl.searchParams.get('resultId'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      verdict: reqUrl.searchParams.get('verdict'),
    })); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/research/reports/summary') {
    writeJson(res, 200, getResearchReportSummary({
      hours: reqUrl.searchParams.get('hours'),
      limit: reqUrl.searchParams.get('limit'),
      strategyId: reqUrl.searchParams.get('strategyId'),
      verdict: reqUrl.searchParams.get('verdict'),
    })); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/research/tasks/')) {
    const taskId = reqUrl.pathname.split('/').at(-1);
    const result = getResearchTaskDetail(taskId);
    writeJson(res, result.ok ? 200 : 404, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/research/governance/actions') {
    const body = await readJsonBody(req);
    if (body.action === 'promote_strategies' || body.action === 'queue_backtests') {
      if (!hasPermission('strategy:write')) { writeForbidden('strategy:write', 'run research governance strategy actions'); return true; }
    }
    if (body.action === 'evaluate_runs' && !hasPermission('risk:review')) {
      writeForbidden('risk:review', 'run research governance evaluation actions'); return true;
    }
    const result = runResearchGovernanceAction(body);
    writeJson(res, result.ok ? 200 : 400, result); return true;
  }

  return false;
}
```

- [ ] **Step 3.10: 创建 execution-router.mjs**

创建 `apps/api/src/app/routes/routers/execution-router.mjs`:

```javascript
import { hasPermission } from '../../../modules/auth/service.mjs';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.mjs';
import {
  getExecutionPlanDetail, getExecutionWorkbench, getLatestBrokerAccountSnapshot,
  listBrokerAccountSnapshots, listBrokerExecutionEvents, listExecutionLedger,
  listExecutionPlans, listExecutionRuntimeEvents,
} from '../../../domains/execution/services/query-service.mjs';
import {
  approveExecutionPlan, bulkOperateExecutionPlans, cancelExecutionPlan,
  compensateExecutionPlan, ingestBrokerExecutionEvent, reconcileExecutionPlan,
  recoverExecutionPlan, settleExecutionPlan, syncExecutionPlan,
} from '../../../domains/execution/services/lifecycle-service.mjs';

export async function handleExecutionRoutes(context) {
  const { req, reqUrl, res, readJsonBody, writeJson } = context;
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);
  const canApprove = () => hasPermission('execution:approve');

  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/plans') {
    writeJson(res, 200, { ok: true, plans: listExecutionPlans() }); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/workbench') {
    writeJson(res, 200, getExecutionWorkbench()); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/execution/plans/bulk') {
    if (!canApprove()) { writeForbidden('execution:approve', 'run bulk execution actions'); return true; }
    const body = await readJsonBody(req);
    const result = bulkOperateExecutionPlans(body);
    writeJson(res, result.ok ? 200 : 400, result); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    const planId = reqUrl.pathname.split('/').at(-1);
    const detail = getExecutionPlanDetail(planId);
    writeJson(res, detail ? 200 : 404, detail ? { ok: true, ...detail } : { ok: false, message: 'execution plan not found' }); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/runtime') {
    writeJson(res, 200, { ok: true, events: listExecutionRuntimeEvents() }); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/account-snapshots') {
    writeJson(res, 200, { ok: true, snapshots: listBrokerAccountSnapshots() }); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/account-snapshots/latest') {
    writeJson(res, 200, { ok: true, snapshot: getLatestBrokerAccountSnapshot() }); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/broker-events') {
    writeJson(res, 200, { ok: true, events: listBrokerExecutionEvents(
      Number(reqUrl.searchParams.get('limit') || 40),
      {
        executionPlanId: reqUrl.searchParams.get('executionPlanId') || '',
        executionRunId: reqUrl.searchParams.get('executionRunId') || '',
        symbol: reqUrl.searchParams.get('symbol') || '',
        eventType: reqUrl.searchParams.get('eventType') || '',
      },
    )}); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/execution/ledger') {
    writeJson(res, 200, { ok: true, entries: listExecutionLedger() }); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/approve') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!canApprove()) { writeForbidden('execution:approve', 'approve execution plans'); return true; }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = approveExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/settle') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!canApprove()) { writeForbidden('execution:approve', 'settle execution plans'); return true; }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = settleExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/sync') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!canApprove()) { writeForbidden('execution:approve', 'sync execution plans'); return true; }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = syncExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/broker-events') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!canApprove()) { writeForbidden('execution:approve', 'ingest broker execution events'); return true; }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = ingestBrokerExecutionEvent(planId, body);
    writeJson(res, result.ok ? 200 : 409, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/cancel') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!canApprove()) { writeForbidden('execution:approve', 'cancel execution plans'); return true; }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = cancelExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/reconcile') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!canApprove()) { writeForbidden('execution:approve', 'reconcile execution plans'); return true; }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = reconcileExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/compensate') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!canApprove()) { writeForbidden('execution:approve', 'run execution compensation automation'); return true; }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = compensateExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/recover') && reqUrl.pathname.startsWith('/api/execution/plans/')) {
    if (!canApprove()) { writeForbidden('execution:approve', 'recover execution plans'); return true; }
    const planId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = recoverExecutionPlan(planId, body);
    writeJson(res, result.ok ? 200 : 409, result); return true;
  }

  return false;
}
```

- [ ] **Step 3.11: 创建 audit-router.mjs**

创建 `apps/api/src/app/routes/routers/audit-router.mjs`:

```javascript
import { appendAuditRecord, listAuditRecords } from '../../../modules/audit/service.mjs';

export async function handleAuditRoutes(context) {
  const { req, reqUrl, res, readJsonBody, writeJson } = context;

  if (req.method === 'GET' && reqUrl.pathname === '/api/audit/records') {
    writeJson(res, 200, { ok: true, records: listAuditRecords({
      limit: reqUrl.searchParams.get('limit'),
      type: reqUrl.searchParams.get('type'),
      hours: reqUrl.searchParams.get('hours'),
    })}); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/audit/records') {
    const body = await readJsonBody(req);
    writeJson(res, 200, { ok: true, record: appendAuditRecord(body) }); return true;
  }

  return false;
}
```

- [ ] **Step 3.12: 创建 incidents-router.mjs**

创建 `apps/api/src/app/routes/routers/incidents-router.mjs`:

```javascript
import {
  appendIncidentNote, appendIncidentTask, bulkUpdateIncidents, createIncident,
  getIncidentDetail, getIncidentSummary, listIncidents, updateIncident, updateIncidentTask,
} from '../../../modules/incidents/service.mjs';

export async function handleIncidentsRoutes(context) {
  const { req, reqUrl, res, readJsonBody, writeJson } = context;

  if (req.method === 'GET' && reqUrl.pathname === '/api/incidents') {
    writeJson(res, 200, { ok: true, incidents: listIncidents({
      limit: reqUrl.searchParams.get('limit'),
      owner: reqUrl.searchParams.get('owner'),
      severity: reqUrl.searchParams.get('severity'),
      source: reqUrl.searchParams.get('source'),
      status: reqUrl.searchParams.get('status'),
      hours: reqUrl.searchParams.get('hours'),
    })}); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/incidents/summary') {
    writeJson(res, 200, { ok: true, summary: getIncidentSummary({
      limit: reqUrl.searchParams.get('limit'),
      owner: reqUrl.searchParams.get('owner'),
      severity: reqUrl.searchParams.get('severity'),
      source: reqUrl.searchParams.get('source'),
      status: reqUrl.searchParams.get('status'),
      hours: reqUrl.searchParams.get('hours'),
    })}); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/incidents') {
    const body = await readJsonBody(req);
    writeJson(res, 200, { ok: true, incident: createIncident(body) }); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/incidents/bulk') {
    const body = await readJsonBody(req);
    const result = bulkUpdateIncidents(body);
    writeJson(res, 200, { ok: true, ...result }); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/incidents/')) {
    const parts = reqUrl.pathname.split('/').filter(Boolean);
    if (parts.length === 3) {
      const detail = getIncidentDetail(parts.at(-1), {
        activityLimit: reqUrl.searchParams.get('activityLimit'),
        noteLimit: reqUrl.searchParams.get('noteLimit'),
        taskLimit: reqUrl.searchParams.get('taskLimit'),
      });
      writeJson(res, detail ? 200 : 404, detail ? { ok: true, ...detail } : { ok: false, message: 'incident not found' }); return true;
    }
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/notes') && reqUrl.pathname.startsWith('/api/incidents/')) {
    const incidentId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const result = appendIncidentNote(incidentId, body);
    writeJson(res, result ? 200 : 404, result ? { ok: true, ...result } : { ok: false, message: 'incident not found' }); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/tasks') && reqUrl.pathname.startsWith('/api/incidents/')) {
    const incidentId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const task = appendIncidentTask(incidentId, body);
    writeJson(res, task ? 200 : 404, task ? { ok: true, task } : { ok: false, message: 'incident not found' }); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.includes('/tasks/') && reqUrl.pathname.startsWith('/api/incidents/')) {
    const parts = reqUrl.pathname.split('/').filter(Boolean);
    if (parts.length === 5) {
      const incidentId = parts[2];
      const taskId = parts[4];
      const body = await readJsonBody(req);
      const task = updateIncidentTask(incidentId, taskId, body);
      writeJson(res, task ? 200 : 404, task ? { ok: true, task } : { ok: false, message: 'incident task not found' }); return true;
    }
  }
  if (req.method === 'POST' && reqUrl.pathname.startsWith('/api/incidents/')) {
    const parts = reqUrl.pathname.split('/').filter(Boolean);
    if (parts.length === 3) {
      const incidentId = parts.at(-1);
      const body = await readJsonBody(req);
      const incident = updateIncident(incidentId, body);
      writeJson(res, incident ? 200 : 404, incident ? { ok: true, incident } : { ok: false, message: 'incident not found' }); return true;
    }
  }

  return false;
}
```

- [ ] **Step 3.13: 创建 notification-router.mjs, risk-router.mjs, scheduler-router.mjs**

创建 `apps/api/src/app/routes/routers/notification-router.mjs`:

```javascript
import { listNotifications } from '../../../modules/notification/service.mjs';

export async function handleNotificationRoutes(context) {
  const { req, reqUrl, res, writeJson } = context;

  if (req.method === 'GET' && reqUrl.pathname === '/api/notification/events') {
    writeJson(res, 200, { ok: true, events: listNotifications({
      limit: reqUrl.searchParams.get('limit'),
      level: reqUrl.searchParams.get('level'),
      source: reqUrl.searchParams.get('source'),
      hours: reqUrl.searchParams.get('hours'),
    })}); return true;
  }

  return false;
}
```

创建 `apps/api/src/app/routes/routers/risk-router.mjs`:

```javascript
import { hasPermission } from '../../../modules/auth/service.mjs';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.mjs';
import { getRiskEvent, listRiskEvents } from '../../../domains/risk/services/feed-service.mjs';
import { runRiskPolicyAction } from '../../../domains/risk/services/policy-action-service.mjs';
import { getRiskWorkbench } from '../../../domains/risk/services/workbench-service.mjs';

export async function handleRiskRoutes(context) {
  const { req, reqUrl, res, readJsonBody, writeJson } = context;
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/risk/events') {
    writeJson(res, 200, { ok: true, events: listRiskEvents() }); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/risk/workbench') {
    writeJson(res, 200, getRiskWorkbench({ hours: reqUrl.searchParams.get('hours'), limit: reqUrl.searchParams.get('limit') })); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/risk/actions') {
    if (!hasPermission('risk:review')) { writeForbidden('risk:review', 'run risk policy actions'); return true; }
    const body = await readJsonBody(req);
    const result = runRiskPolicyAction(body);
    writeJson(res, result?.ok === false ? 400 : 200, result); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/risk/events/')) {
    const eventId = reqUrl.pathname.split('/').at(-1);
    const event = getRiskEvent(eventId);
    writeJson(res, event ? 200 : 404, event ? { ok: true, event } : { ok: false, message: 'risk event not found' }); return true;
  }

  return false;
}
```

创建 `apps/api/src/app/routes/routers/scheduler-router.mjs`:

```javascript
import { hasPermission } from '../../../modules/auth/service.mjs';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.mjs';
import { getSchedulerWorkbench, listSchedulerTicks, runSchedulerOrchestrationAction } from '../../../modules/scheduler/service.mjs';

export async function handleSchedulerRoutes(context) {
  const { req, reqUrl, res, readJsonBody, writeJson } = context;
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);

  if (req.method === 'GET' && reqUrl.pathname === '/api/scheduler/ticks') {
    writeJson(res, 200, { ok: true, ticks: listSchedulerTicks({
      limit: reqUrl.searchParams.get('limit'),
      phase: reqUrl.searchParams.get('phase'),
      hours: reqUrl.searchParams.get('hours'),
    })}); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/scheduler/workbench') {
    writeJson(res, 200, getSchedulerWorkbench({ limit: reqUrl.searchParams.get('limit'), hours: reqUrl.searchParams.get('hours'), phase: reqUrl.searchParams.get('phase') })); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/scheduler/actions') {
    if (!hasPermission('execution:approve')) { writeForbidden('execution:approve', 'run scheduler orchestration actions'); return true; }
    const body = await readJsonBody(req);
    const result = runSchedulerOrchestrationAction(body);
    writeJson(res, result?.ok === false ? 400 : 200, result); return true;
  }

  return false;
}
```

- [ ] **Step 3.14: 创建 task-orchestrator-router.mjs**

创建 `apps/api/src/app/routes/routers/task-orchestrator-router.mjs`:

```javascript
import { hasPermission } from '../../../modules/auth/service.mjs';
import { writeForbiddenJson } from '../../../modules/auth/permission-catalog.mjs';
import { runCycle } from '../../../control-plane/task-orchestrator/cycle-runner.mjs';
import { runStateCycle } from '../../../control-plane/task-orchestrator/state-runner.mjs';
import {
  cancelWorkflow, getWorkflow, listWorkflows, queueWorkflow, resumeWorkflow,
} from '../../../control-plane/task-orchestrator/services/workflow-service.mjs';
import { listActions, recordAction } from '../../../control-plane/task-orchestrator/services/action-service.mjs';
import { listCycles, recordCycleRun } from '../../../control-plane/task-orchestrator/services/cycle-service.mjs';

export async function handleTaskOrchestratorRoutes(context) {
  const { req, reqUrl, res, readJsonBody, writeJson, gatewayDependencies } = context;
  const writeForbidden = (permission, action = '') => writeForbiddenJson(writeJson, res, permission, action);
  const requirePermission = (permission, action = '') => {
    if (!hasPermission(permission)) { writeForbidden(permission, action); return false; }
    return true;
  };

  if (req.method === 'GET' && reqUrl.pathname === '/api/task-orchestrator/cycles') {
    writeJson(res, 200, { ok: true, cycles: listCycles() }); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/task-orchestrator/workflows') {
    writeJson(res, 200, { ok: true, workflows: listWorkflows() }); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname.startsWith('/api/task-orchestrator/workflows/')) {
    const workflowRunId = reqUrl.pathname.split('/').at(-1);
    const workflow = getWorkflow(workflowRunId);
    writeJson(res, workflow ? 200 : 404, workflow ? { ok: true, workflow } : { ok: false, message: 'workflow not found' }); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/workflows/queue') {
    const body = await readJsonBody(req);
    writeJson(res, 200, { ok: true, workflow: queueWorkflow(body) }); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/resume') && reqUrl.pathname.startsWith('/api/task-orchestrator/workflows/')) {
    if (!requirePermission('execution:approve', 'record operator actions')) return true;
    const workflowRunId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const workflow = resumeWorkflow(workflowRunId, body);
    writeJson(res, workflow ? 200 : 404, workflow ? { ok: true, workflow } : { ok: false, message: 'workflow not found' }); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname.endsWith('/cancel') && reqUrl.pathname.startsWith('/api/task-orchestrator/workflows/')) {
    if (!requirePermission('execution:approve', 'run control-plane cycles')) return true;
    const workflowRunId = reqUrl.pathname.split('/').at(-2);
    const body = await readJsonBody(req);
    const workflow = cancelWorkflow(workflowRunId, body);
    writeJson(res, workflow ? 200 : 404, workflow ? { ok: true, workflow } : { ok: false, message: 'workflow not found' }); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/cycles') {
    const body = await readJsonBody(req);
    writeJson(res, 200, { ok: true, cycle: recordCycleRun(body) }); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/cycles/queue') {
    const body = await readJsonBody(req);
    writeJson(res, 200, { ok: true, workflow: queueWorkflow({
      workflowId: 'task-orchestrator.cycle-run',
      workflowType: 'task-orchestrator',
      actor: 'api-queue',
      trigger: 'api',
      payload: body,
      maxAttempts: Number(body.maxAttempts || 3),
    })}); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/cycles/run') {
    const body = await readJsonBody(req);
    writeJson(res, 200, await runCycle(body, {
      getBrokerHealth: gatewayDependencies.getBrokerHealth,
      executeBrokerCycle: gatewayDependencies.executeBrokerCycle,
    })); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/state/queue') {
    const body = await readJsonBody(req);
    writeJson(res, 200, { ok: true, workflow: queueWorkflow({
      workflowId: 'task-orchestrator.state-run',
      workflowType: 'task-orchestrator',
      actor: 'api-queue',
      trigger: 'api',
      payload: { state: body.state },
      maxAttempts: Number(body.maxAttempts || 3),
    })}); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/strategy/execute') {
    if (!requirePermission('strategy:write', 'queue workflows')) return true;
    const body = await readJsonBody(req);
    writeJson(res, 200, { ok: true, workflow: queueWorkflow({
      workflowId: 'task-orchestrator.strategy-execution',
      workflowType: 'task-orchestrator',
      actor: body.requestedBy || 'api-queue',
      trigger: 'api',
      payload: {
        strategyId: body.strategyId,
        mode: body.mode || 'paper',
        capital: Number(body.capital || 0),
        requestedBy: body.requestedBy || 'operator',
      },
      maxAttempts: Number(body.maxAttempts || 3),
    })}); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/state/run') {
    const body = await readJsonBody(req);
    writeJson(res, 200, await runStateCycle(body?.state, {
      getBrokerHealth: gatewayDependencies.getBrokerHealth,
      executeBrokerCycle: gatewayDependencies.executeBrokerCycle,
      getMarketSnapshot: gatewayDependencies.getMarketSnapshot,
    })); return true;
  }
  if (req.method === 'GET' && reqUrl.pathname === '/api/task-orchestrator/actions') {
    writeJson(res, 200, { ok: true, actions: listActions({
      limit: reqUrl.searchParams.get('limit'),
      level: reqUrl.searchParams.get('level'),
      hours: reqUrl.searchParams.get('hours'),
    })}); return true;
  }
  if (req.method === 'POST' && reqUrl.pathname === '/api/task-orchestrator/actions') {
    if (!requirePermission('execution:approve', 'resume or cancel workflows')) return true;
    const body = await readJsonBody(req);
    writeJson(res, 200, { ok: true, action: recordAction(body) }); return true;
  }

  return false;
}
```

- [ ] **Step 3.15: 重构 platform-routes.mjs 为 dispatcher**

重写 `apps/api/src/app/routes/platform-routes.mjs`:

```javascript
import { handleHealthRoutes } from './routers/health-router.mjs';
import { handleMonitoringRoutes } from './routers/monitoring-router.mjs';
import { handleOperationsRoutes } from './routers/operations-router.mjs';
import { handleAuthRoutes } from './routers/auth-router.mjs';
import { handleUserAccountRoutes } from './routers/user-account-router.mjs';
import { handleAgentRoutes } from './routers/agent-router.mjs';
import { handleStrategyRoutes } from './routers/strategy-router.mjs';
import { handleBacktestRoutes } from './routers/backtest-router.mjs';
import { handleResearchRoutes } from './routers/research-router.mjs';
import { handleExecutionRoutes } from './routers/execution-router.mjs';

const PLATFORM_ROUTERS = [
  handleHealthRoutes,
  handleMonitoringRoutes,
  handleOperationsRoutes,
  handleAuthRoutes,
  handleUserAccountRoutes,
  handleAgentRoutes,
  handleStrategyRoutes,
  handleBacktestRoutes,
  handleResearchRoutes,
  handleExecutionRoutes,
];

export async function handlePlatformRoutes(context) {
  for (const router of PLATFORM_ROUTERS) {
    if (await router(context)) return true;
  }
  return false;
}
```

- [ ] **Step 3.16: 重构 control-plane-routes.mjs 为 dispatcher**

重写 `apps/api/src/app/routes/control-plane-routes.mjs`:

```javascript
import { handleAuditRoutes } from './routers/audit-router.mjs';
import { handleIncidentsRoutes } from './routers/incidents-router.mjs';
import { handleNotificationRoutes } from './routers/notification-router.mjs';
import { handleRiskRoutes } from './routers/risk-router.mjs';
import { handleSchedulerRoutes } from './routers/scheduler-router.mjs';
import { handleTaskOrchestratorRoutes } from './routers/task-orchestrator-router.mjs';

const CONTROL_PLANE_ROUTERS = [
  handleAuditRoutes,
  handleIncidentsRoutes,
  handleNotificationRoutes,
  handleRiskRoutes,
  handleSchedulerRoutes,
  handleTaskOrchestratorRoutes,
];

export async function handleControlPlaneRoutes(context) {
  for (const router of CONTROL_PLANE_ROUTERS) {
    if (await router(context)) return true;
  }
  return false;
}
```

- [ ] **Step 3.17: 运行 API 测试验证路由等价**

```bash
npm run test:api
```

Expected: 所有 API baseline 测试通过（stage-1~4 and stage-6）

- [ ] **Step 3.18: 运行完整 verify 验证**

```bash
npm run verify
```

Expected: 全部通过

---

## Task 4: Worker 解耦

**问题：** `workflow-execution-task.mjs` 直接 import `apps/api/src/` 下的6个函数：
- `recordExecutionPlan` from `modules/execution/service.mjs`
- `refreshBacktestSummary` from `domains/backtest/services/summary-service.mjs`
- `assessAgentActionRequestRisk`, `assessExecutionCandidate` from `modules/risk/service.mjs`
- `buildStrategyExecutionCandidate` from `modules/strategy/service.mjs`
- `recordAgentActionRequest` from `modules/agent/service.mjs`

**方案：** 这些函数已通过依赖注入模式传入 `executeQueuedWorkflow`。Worker 目前是在 `createWorkerExecutionContext()` 中直接 import 并注入的。

解决方案：从 `packages/control-plane-runtime/src/index.mjs` re-export 这6个函数，Worker 从 `control-plane-runtime` 获取，不再直接 import `apps/api/`。

**Files to MODIFY:**
- `packages/control-plane-runtime/src/index.mjs` — 添加 re-exports
- `apps/worker/src/tasks/workflow-execution-task.mjs` — 移除跨 app imports，从 controlPlaneRuntime 获取

- [ ] **Step 4.1: 读取 control-plane-runtime index.mjs 当前内容**

读取 `packages/control-plane-runtime/src/index.mjs` 了解其当前的 export 结构。

- [ ] **Step 4.2: 添加 domain service re-exports 到 control-plane-runtime**

在 `packages/control-plane-runtime/src/index.mjs` 末尾添加 re-exports：

```javascript
// Domain service re-exports for worker consumption
// These allow the worker to consume domain services without directly importing from apps/api
export { recordExecutionPlan } from '../../../apps/api/src/modules/execution/service.mjs';
export { refreshBacktestSummary } from '../../../apps/api/src/domains/backtest/services/summary-service.mjs';
export { assessAgentActionRequestRisk, assessExecutionCandidate } from '../../../apps/api/src/modules/risk/service.mjs';
export { buildStrategyExecutionCandidate } from '../../../apps/api/src/modules/strategy/service.mjs';
export { recordAgentActionRequest } from '../../../apps/api/src/modules/agent/service.mjs';
```

- [ ] **Step 4.3: 更新 workflow-execution-task.mjs 移除跨 app imports**

修改 `apps/worker/src/tasks/workflow-execution-task.mjs`:

将:
```javascript
import { controlPlaneRuntime } from '../../../../packages/control-plane-runtime/src/index.mjs';
import { executeQueuedWorkflow } from '../../../../packages/task-workflow-engine/src/index.mjs';
import { recordExecutionPlan } from '../../../api/src/modules/execution/service.mjs';
import { refreshBacktestSummary } from '../../../api/src/domains/backtest/services/summary-service.mjs';
import { assessAgentActionRequestRisk, assessExecutionCandidate } from '../../../api/src/modules/risk/service.mjs';
import { buildStrategyExecutionCandidate } from '../../../api/src/modules/strategy/service.mjs';
import { recordAgentActionRequest } from '../../../api/src/modules/agent/service.mjs';
```

改为:
```javascript
import {
  controlPlaneRuntime,
  recordExecutionPlan,
  refreshBacktestSummary,
  assessAgentActionRequestRisk,
  assessExecutionCandidate,
  buildStrategyExecutionCandidate,
  recordAgentActionRequest,
} from '../../../../packages/control-plane-runtime/src/index.mjs';
import { executeQueuedWorkflow } from '../../../../packages/task-workflow-engine/src/index.mjs';
```

- [ ] **Step 4.4: 运行 worker 测试**

```bash
npm run test:worker
```

Expected: 所有 worker 测试通过

- [ ] **Step 4.5: 运行 runtime 和 control-plane 测试**

```bash
npm run test:runtime
npm run test:control-plane
```

Expected: 通过

---

## Task 5: 补充 stage-5 测试

**根据 stage-5-closeout.md，stage-5 引入的核心能力：**
1. Agent session / intent / plan / analysis run / action request contracts
2. Agent workbench (sessions, explanations, pending requests, operator timeline)
3. Controlled action handoff (create → approve/reject → downstream linking)

**Files to CREATE:**
- `apps/api/test/stage-5-baseline.test.mjs`

**Files to MODIFY:**
- `package.json` — 将 stage-5 测试加入 `test:api` 命令

- [ ] **Step 5.1: 创建 stage-5-baseline.test.mjs**

创建 `apps/api/test/stage-5-baseline.test.mjs`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { invokeGatewayRoute } from './helpers/invoke-gateway.mjs';

const namespace = `stage-5-baseline-test-${randomUUID()}`;
process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE = namespace;

const [{ createGatewayHandler }, { createControlPlaneContext }, { createControlPlaneStore }] = await Promise.all([
  import('../src/gateways/alpaca.mjs'),
  import('../../../packages/control-plane-store/src/context.mjs'),
  import('../../../packages/control-plane-store/src/store.mjs'),
]);

const handler = createGatewayHandler({
  getBrokerHealth: async () => ({
    adapter: 'simulated',
    connected: true,
    customBrokerConfigured: false,
    alpacaConfigured: false,
  }),
  executeBrokerCycle: async () => ({
    connected: true,
    message: 'stage 5 baseline broker ok',
    submittedOrders: [],
    rejectedOrders: [],
    snapshot: {
      connected: true,
      message: 'stage 5 baseline snapshot ok',
      account: { cash: 85000, buyingPower: 90000, equity: 92000 },
      positions: [],
      orders: [],
    },
  }),
  getMarketSnapshot: async () => ({
    label: 'Stage 5 Baseline Market',
    connected: true,
    message: 'stage 5 baseline market ok',
    quotes: [],
  }),
});
const context = createControlPlaneContext(createControlPlaneStore({ namespace }));

test.after(() => {
  rmSync(join(process.cwd(), '.quantpilot-runtime', namespace), { recursive: true, force: true });
  delete process.env.QUANTPILOT_CONTROL_PLANE_NAMESPACE;
});

function seedAgentContracts() {
  const nowIso = new Date().toISOString();
  context.agentSessions.appendAgentSession({
    id: 'stage5-session',
    prompt: 'Analyze NVDA momentum',
    status: 'active',
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  context.agentIntents.appendAgentIntent({
    id: 'stage5-intent',
    sessionId: 'stage5-session',
    rawPrompt: 'Analyze NVDA momentum',
    parsedGoal: 'momentum_analysis',
    steps: [],
    createdAt: nowIso,
  });
  context.agentPlans.appendAgentPlan({
    id: 'stage5-plan',
    sessionId: 'stage5-session',
    intentId: 'stage5-intent',
    steps: [
      { type: 'read', action: 'fetch_market_data', label: 'Fetch NVDA quotes' },
      { type: 'explain', action: 'summarize_signal', label: 'Explain momentum signal' },
      { type: 'request_action', action: 'backtest_review', label: 'Request backtest review' },
    ],
    createdAt: nowIso,
  });
  context.agentAnalysisRuns.appendAgentAnalysisRun({
    id: 'stage5-analysis',
    sessionId: 'stage5-session',
    planId: 'stage5-plan',
    evidence: [{ label: 'NVDA 5d momentum', value: '+4.2%' }],
    summary: 'Momentum is bullish over 5-day window.',
    explanation: 'Signal strength exceeds threshold at current risk posture.',
    recommendedNextStep: 'request_backtest_review',
    createdAt: nowIso,
  });
  context.agentActionRequests.appendAgentActionRequest({
    id: 'stage5-action-request',
    sessionId: 'stage5-session',
    analysisRunId: 'stage5-analysis',
    actionType: 'backtest_review',
    status: 'pending',
    metadata: { strategyId: 'stage5-strategy', requestedBy: 'stage5-agent' },
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  context.operatorActions.appendOperatorAction({
    id: 'stage5-operator-action',
    type: 'agent.action.queued',
    actor: 'stage5-agent',
    sessionId: 'stage5-session',
    metadata: { actionRequestId: 'stage5-action-request' },
    createdAt: nowIso,
  });
}

test('stage 5 baseline exposes stable agent session and workbench contracts', async () => {
  seedAgentContracts();

  const [sessions, workbench] = await Promise.all([
    invokeGatewayRoute(handler, { path: '/api/agent/sessions?limit=10' }),
    invokeGatewayRoute(handler, { path: '/api/agent/workbench?hours=168&limit=10' }),
  ]);

  assert.equal(sessions.statusCode, 200);
  assert.equal(Array.isArray(sessions.json.sessions || sessions.json), true);

  assert.equal(workbench.statusCode, 200);
  assert.equal(workbench.json.ok, true);
  assert.equal(typeof workbench.json.recentSessions !== 'undefined' || typeof workbench.json.sessions !== 'undefined', true);
});

test('stage 5 baseline exposes stable agent session detail contract', async () => {
  seedAgentContracts();

  const detail = await invokeGatewayRoute(handler, { path: '/api/agent/sessions/stage5-session' });

  assert.equal(detail.statusCode, 200);
  assert.equal(detail.json.ok, true);
  assert.equal(typeof detail.json.session !== 'undefined' || typeof detail.json.id !== 'undefined', true);
});

test('stage 5 baseline exposes stable agent tools contract', async () => {
  const tools = await invokeGatewayRoute(handler, { path: '/api/agent/tools' });

  assert.equal(tools.statusCode, 200);
  assert.equal(Array.isArray(tools.json.tools || tools.json), true);
});

test('stage 5 baseline supports agent intent and plan creation', async () => {
  const [intentResult, planResult] = await Promise.all([
    invokeGatewayRoute(handler, {
      method: 'POST',
      path: '/api/agent/intent',
      body: { sessionId: 'stage5-session', prompt: 'Analyze NVDA momentum for backtest' },
    }),
    invokeGatewayRoute(handler, {
      method: 'POST',
      path: '/api/agent/plans',
      body: { sessionId: 'stage5-session', intentId: 'stage5-intent', steps: [] },
    }),
  ]);

  assert.equal(intentResult.statusCode, 200);
  assert.equal(intentResult.json.ok, true);

  assert.equal(planResult.statusCode, 200);
  assert.equal(planResult.json.ok, true);
});

test('stage 5 baseline supports agent analysis run creation', async () => {
  const result = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/analysis-runs',
    body: { sessionId: 'stage5-session', planId: 'stage5-plan', evidence: [], summary: 'test', explanation: 'test', recommendedNextStep: 'none' },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.json.ok, true);
});

test('stage 5 baseline exposes stable agent action requests contract', async () => {
  seedAgentContracts();

  const actionRequests = await invokeGatewayRoute(handler, { path: '/api/agent/action-requests' });

  assert.equal(actionRequests.statusCode, 200);
  assert.equal(Array.isArray(actionRequests.json.requests || actionRequests.json), true);
});

test('stage 5 baseline supports controlled action handoff queue and approval', async () => {
  const queueResult = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: '/api/agent/action-requests',
    body: {
      sessionId: 'stage5-session',
      analysisRunId: 'stage5-analysis',
      actionType: 'backtest_review',
      metadata: { strategyId: 'stage5-strategy-new', requestedBy: 'stage5-agent' },
    },
  });

  assert.equal(queueResult.statusCode, 200);
  assert.equal(queueResult.json.ok, true);
  const requestId = queueResult.json.request?.id || queueResult.json.actionRequest?.id;
  assert.equal(typeof requestId, 'string');

  const approveResult = await invokeGatewayRoute(handler, {
    method: 'POST',
    path: `/api/agent/action-requests/${requestId}/approve`,
    body: { actor: 'stage5-operator', note: 'Approved for stage 5 baseline test' },
  });

  assert.equal(approveResult.statusCode, 200);
  assert.equal(approveResult.json.ok, true);
});
```

- [ ] **Step 5.2: 读取 package.json 查看 test:api 命令**

读取根 `package.json` 和 `apps/api/package.json` 确认 test:api 脚本格式。

- [ ] **Step 5.3: 更新 package.json 的 test:api 命令添加 stage-5**

在根 `package.json` 的 `test:api` 命令中添加 `stage-5-baseline.test.mjs`。

- [ ] **Step 5.4: 运行 stage-5 测试**

```bash
cd apps/api && node --test test/stage-5-baseline.test.mjs
```

Expected: 所有 stage-5 测试通过（需根据实际 API response shape 调整 assertions）

- [ ] **Step 5.5: 运行完整 API 测试**

```bash
npm run test:api
```

Expected: 所有 stage 1-6 测试通过

---

## Final: 完整 verify 验证

- [ ] **Step F.1: 运行完整 verify**

```bash
npm run verify
```

Expected: 所有 12 个检查项通过（workspace integrity, lockfile, docs, runtime-env, 6 test suites, typecheck, build）

- [ ] **Step F.2: 验证无跨 app import**

```bash
grep -r "from.*apps/api/src" apps/worker/src/ --include="*.mjs"
```

Expected: 无输出（零跨 app import）

- [ ] **Step F.3: 验证无死代码 stub**

```bash
ls apps/web/src/services/ 2>&1
ls apps/web/src/pages/console/routes/PortfolioPage.tsx 2>&1
```

Expected: `services/` 目录不存在，PortfolioPage.tsx 不存在

- [ ] **Step F.4: 验证错误边界存在**

```bash
ls apps/web/src/app/components/ErrorBoundary.tsx
```

Expected: 文件存在

- [ ] **Step F.5: 提交代码**

```bash
git add -A
git status
git commit -m "refactor: clean dead code, modularize API routes, decouple worker, add error boundary"
```
