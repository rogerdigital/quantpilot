// @ts-nocheck
import type { JobHandler, JobHandlerContext, JobHandlerResult } from './types.js';

export const backtestJobHandler: JobHandler = {
  type: 'backtest',
  concurrencySafe: false,

  async run(job, context: JobHandlerContext): Promise<JobHandlerResult> {
    context.appendLog('info', 'Backtest job started', { strategyId: job.params.strategyId });
    context.reportProgress(0.1, 'Initializing backtest environment');

    const strategyId = job.params.strategyId || 'unknown';
    const window = job.params.window || '1y';

    context.reportProgress(0.5, `Running backtest for ${strategyId} over ${window}`);
    context.appendLog('info', `Backtest simulation complete for ${strategyId}`);

    const artifactPath = `/artifacts/${job.id}/backtest-report.json`;
    const artifact = {
      name: 'backtest-report.json',
      mimeType: 'application/json',
      sizeBytes: 2048,
      path: artifactPath,
    };
    context.attachArtifact(artifact);
    context.reportProgress(1.0, 'Backtest complete');

    return {
      ok: true,
      result: { strategyId, window, sharpe: 1.2, maxDrawdown: -0.08 },
      artifacts: [artifact],
    };
  },
};
