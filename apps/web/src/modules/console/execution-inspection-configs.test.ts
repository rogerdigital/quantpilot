import { describe, expect, it } from 'vitest';
import {
  getExecutionAuditEventInspectionConfig,
  getExecutionDetailInspectionConfig,
  getExecutionSnapshotInspectionConfig,
  getExecutionWorkflowInspectionConfig,
  getExecutionWorkflowStepInspectionConfig,
} from './executionInspectionConfigs.ts';

describe('execution inspection configs', () => {
  it('builds execution detail summary and runtime copy', () => {
    const config = getExecutionDetailInspectionConfig('en', {
      plan: {
        id: 'plan-1',
        workflowRunId: 'wf-1',
        handoffId: 'handoff-1',
        executionRunId: 'exec-run-1',
        strategyId: 'strategy-1',
        strategyName: 'Momentum',
        mode: 'paper',
        status: 'ready',
        lifecycleStatus: 'submitted',
        approvalState: 'pending',
        riskStatus: 'approved',
        summary: 'Paper execution plan',
        capital: 50000,
        orderCount: 2,
        orders: [],
        metadata: {},
        createdAt: '2026-03-13T11:30:00.000Z',
        updatedAt: '2026-03-13T11:35:00.000Z',
      },
      workflow: null,
      latestRuntime: {
        id: 'runtime-1',
        cycleId: 'cycle-1',
        cycle: 1,
        executionPlanId: 'plan-1',
        executionRunId: 'exec-run-1',
        mode: 'paper',
        brokerAdapter: 'alpaca',
        brokerConnected: true,
        marketConnected: true,
        submittedOrderCount: 2,
        rejectedOrderCount: 0,
        openOrderCount: 1,
        positionCount: 3,
        cash: 54000,
        buyingPower: 120000,
        equity: 102400,
        message: 'Orders submitted',
        metadata: {},
        createdAt: '2026-03-13T11:40:00.000Z',
      },
      executionRun: {
        id: 'exec-run-1',
        executionPlanId: 'plan-1',
        workflowRunId: 'wf-1',
        strategyId: 'strategy-1',
        strategyName: 'Momentum',
        mode: 'paper',
        lifecycleStatus: 'submitted',
        summary: 'Execution run active',
        owner: 'ops@desk',
        orderCount: 2,
        submittedOrderCount: 2,
        filledOrderCount: 0,
        rejectedOrderCount: 0,
        createdAt: '2026-03-13T11:35:00.000Z',
        updatedAt: '2026-03-13T11:40:00.000Z',
        completedAt: '',
        metadata: {},
      },
      orderStates: [],
    });

    expect(config.summary).toBe('Paper execution plan');
    expect(config.runtimeMessage).toContain('Latest runtime: submitted 2, open 1, equity 102400');
  });

  it('returns empty-state inspection copy for missing audit event and snapshot', () => {
    const auditConfig = getExecutionAuditEventInspectionConfig('en', null, null);
    const snapshotConfig = getExecutionSnapshotInspectionConfig('en', null, null);

    expect(auditConfig.emptyMessage).toBe('Select an execution plan from the ledger first.');
    expect(snapshotConfig.emptyMessage).toBe('Select an execution plan from the ledger first.');
  });

  it('builds workflow and step guidance for selected execution workflow nodes', () => {
    const workflowConfig = getExecutionWorkflowInspectionConfig(
      'en',
      {
        plan: {
          id: 'plan-1',
          workflowRunId: 'wf-1',
          handoffId: 'handoff-1',
          executionRunId: 'exec-run-1',
          strategyId: 'strategy-1',
          strategyName: 'Momentum',
          mode: 'paper',
          status: 'ready',
          lifecycleStatus: 'submitted',
          approvalState: 'pending',
          riskStatus: 'approved',
          summary: 'Paper execution plan',
          capital: 50000,
          orderCount: 2,
          orders: [],
          metadata: {},
          createdAt: '2026-03-13T11:30:00.000Z',
          updatedAt: '2026-03-13T11:35:00.000Z',
        },
        workflow: null,
        latestRuntime: null,
        executionRun: null,
        orderStates: [],
      },
      {
        id: 'wf-1',
        workflowId: 'task-orchestrator.strategy-execution',
        workflowType: 'strategy-execution',
        status: 'running',
        actor: 'worker',
        trigger: 'approved',
        attempt: 1,
        maxAttempts: 3,
        nextRunAt: '',
        lockedBy: '',
        lockedAt: '',
        createdAt: '2026-03-13T11:30:00.000Z',
        updatedAt: '2026-03-13T11:40:00.000Z',
        startedAt: '2026-03-13T11:31:00.000Z',
        completedAt: '',
        failedAt: '',
        steps: [
          { key: 'broker_submit', status: 'completed' },
          { key: 'settlement_watch', status: 'running' },
        ],
        payload: {},
        result: null,
        error: null,
        metadata: {},
      },
      false
    );
    const stepConfig = getExecutionWorkflowStepInspectionConfig(
      'en',
      {
        plan: {
          id: 'plan-1',
          workflowRunId: 'wf-1',
          handoffId: 'handoff-1',
          executionRunId: 'exec-run-1',
          strategyId: 'strategy-1',
          strategyName: 'Momentum',
          mode: 'paper',
          status: 'ready',
          lifecycleStatus: 'submitted',
          approvalState: 'pending',
          riskStatus: 'approved',
          summary: 'Paper execution plan',
          capital: 50000,
          orderCount: 2,
          orders: [],
          metadata: {},
          createdAt: '2026-03-13T11:30:00.000Z',
          updatedAt: '2026-03-13T11:35:00.000Z',
        },
        workflow: null,
        latestRuntime: null,
        executionRun: null,
        orderStates: [],
      },
      {
        key: 'settlement_watch',
        status: 'running',
      }
    );

    expect(workflowConfig.metrics[0]?.value).toBe('wf-1');
    expect(stepConfig.guidance).toBe('The current deep link is focused on step settlement_watch.');
  });
});
