import { describe, expect, it } from 'vitest';
import { useExecutionDetailPanels } from './useExecutionDetailPanels.ts';

describe('useExecutionDetailPanels', () => {
  it('derives selected execution detail state from ledger, audit, workflow, and runtime data', () => {
    const result = useExecutionDetailPanels({
      selectedPlanId: 'plan-1',
      selectedAuditEventId: 'audit-1',
      selectedWorkflowStepKey: 'settlement_watch',
      ledgerEntries: [
        {
          plan: {
            id: 'plan-1',
            workflowRunId: 'wf-exec-1',
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
            orders: [
              { symbol: 'AAPL', side: 'BUY', qty: 10, weight: 0.4, rationale: 'Momentum breakout' },
              { symbol: 'MSFT', side: 'SELL', qty: 4, weight: 0.2, rationale: 'Relative weakness' },
            ],
            metadata: {},
            createdAt: '2026-03-13T11:30:00.000Z',
            updatedAt: '2026-03-13T11:35:00.000Z',
          },
          workflow: {
            id: 'wf-exec-1',
            workflowId: 'task-orchestrator.strategy-execution',
            status: 'running',
            updatedAt: '2026-03-13T11:40:00.000Z',
            completedAt: '',
            failedAt: '',
          },
          latestRuntime: {
            id: 'runtime-1',
            cycleId: 'cycle-1',
            cycle: 1,
            executionPlanId: 'plan-1',
            executionRunId: 'exec-run-1',
            brokerAdapter: 'alpaca',
            brokerConnected: true,
            marketConnected: true,
            mode: 'paper',
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
            workflowRunId: 'wf-exec-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            mode: 'paper',
            lifecycleStatus: 'submitted',
            submittedOrderCount: 2,
            filledOrderCount: 0,
            rejectedOrderCount: 0,
            summary: 'Execution run active',
            owner: 'ops@desk',
            orderCount: 2,
            metadata: {},
            createdAt: '2026-03-13T11:35:00.000Z',
            updatedAt: '2026-03-13T11:40:00.000Z',
            completedAt: '',
          },
          orderStates: [
            {
              id: 'order-1',
              executionPlanId: 'plan-1',
              executionRunId: 'exec-run-1',
              symbol: 'AAPL',
              side: 'BUY',
              qty: 10,
              weight: 0.4,
              lifecycleStatus: 'submitted',
              brokerOrderId: 'alpaca-1',
              avgFillPrice: null,
              filledQty: 0,
              summary: 'Sent to broker',
              submittedAt: '2026-03-13T11:35:00.000Z',
              acknowledgedAt: '',
              filledAt: '',
              metadata: {},
              createdAt: '2026-03-13T11:35:00.000Z',
              updatedAt: '2026-03-13T11:40:00.000Z',
            },
          ],
        },
      ],
      auditItems: [
        {
          id: 'audit-1',
          type: 'execution-plan',
          actor: 'risk@desk',
          title: 'Execution approved',
          detail: 'Plan is ready for broker submit.',
          createdAt: '2026-03-13T11:35:00.000Z',
          metadata: {
            strategyId: 'strategy-1',
            orderCount: 2,
            capital: 50000,
            riskStatus: 'approved',
            approvalState: 'pending',
          },
        },
        {
          id: 'audit-2',
          type: 'execution-plan',
          actor: 'risk@desk',
          title: 'Other strategy',
          detail: 'Should be filtered out.',
          createdAt: '2026-03-13T11:25:00.000Z',
          metadata: {
            strategyId: 'strategy-2',
          },
        },
      ],
      operatorActions: [
        {
          id: 'action-1',
          type: 'approve-intent',
          symbol: 'AAPL',
          detail: 'Approved AAPL order',
          actor: 'risk@desk',
          title: 'Approve AAPL',
          level: 'info',
          createdAt: '2026-03-13T11:45:00.000Z',
        },
        {
          id: 'action-2',
          type: 'cancel-order',
          symbol: 'TSLA',
          detail: 'Canceled unrelated order',
          actor: 'risk@desk',
          title: 'Cancel TSLA',
          level: 'warn',
          createdAt: '2026-03-13T11:46:00.000Z',
        },
      ],
      workflowRuns: [
        {
          id: 'wf-exec-1',
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
      ],
      accountSnapshots: [
        {
          id: 'snapshot-1',
          cycleId: 'cycle-1',
          cycle: 1,
          executionPlanId: 'plan-1',
          executionRunId: 'exec-run-1',
          provider: 'alpaca',
          connected: true,
          message: 'Snapshot synced',
          account: { cash: 54000, buyingPower: 120000, equity: 102400 },
          orders: [{ symbol: 'AAPL', side: 'BUY', qty: 10 }],
          positions: [{ symbol: 'AAPL', qty: 10, avgCost: 180 }],
          createdAt: '2026-03-13T11:41:00.000Z',
        },
      ],
    });

    expect(result.selectedEntry?.plan.id).toBe('plan-1');
    expect(result.selectedExecutionAuditItems).toHaveLength(1);
    expect(result.selectedExecutionVersionItems).toHaveLength(1);
    expect(result.selectedExecutionActions).toHaveLength(1);
    expect(result.selectedExecutionActions[0]?.symbol).toBe('AAPL');
    expect(result.selectedWorkflow?.id).toBe('wf-exec-1');
    expect(result.selectedWorkflowStep?.key).toBe('settlement_watch');
    expect(result.selectedAccountSnapshot?.id).toBe('snapshot-1');
    expect(result.selectedAuditEvent?.id).toBe('audit-1');
  });

  it('falls back to the first available entry and snapshot when no ids are provided', () => {
    const result = useExecutionDetailPanels({
      selectedPlanId: '',
      selectedAuditEventId: '',
      selectedWorkflowStepKey: '',
      ledgerEntries: [
        {
          plan: {
            id: 'plan-1',
            workflowRunId: '',
            handoffId: 'handoff-1',
            executionRunId: 'exec-run-1',
            strategyId: 'strategy-1',
            strategyName: 'Momentum',
            mode: 'paper',
            status: 'ready',
            lifecycleStatus: 'awaiting_approval',
            approvalState: 'pending',
            riskStatus: 'approved',
            summary: 'Paper execution plan',
            capital: 50000,
            orderCount: 1,
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
      ],
      auditItems: [],
      operatorActions: [],
      workflowRuns: [],
      accountSnapshots: [
        {
          id: 'snapshot-1',
          cycleId: 'cycle-1',
          cycle: 1,
          executionPlanId: 'plan-1',
          executionRunId: 'exec-run-1',
          provider: 'alpaca',
          connected: true,
          message: 'Snapshot synced',
          account: { cash: 54000, buyingPower: 120000, equity: 102400 },
          orders: [],
          positions: [],
          createdAt: '2026-03-13T11:41:00.000Z',
        },
      ],
    });

    expect(result.selectedEntry?.plan.id).toBe('plan-1');
    expect(result.selectedExecutionAuditItems).toHaveLength(0);
    expect(result.selectedExecutionActions).toHaveLength(0);
    expect(result.selectedWorkflow).toBeNull();
    expect(result.selectedAccountSnapshot?.id).toBe('snapshot-1');
    expect(result.selectedAuditEvent).toBeNull();
    expect(result.selectedWorkflowStep).toBeNull();
  });
});
