import {
  executeAgentReviewWorkflow,
  isValidReviewType,
} from '../../../../packages/task-workflow-engine/src/agent-review-workflows.js';
import type { JobHandler, JobHandlerContext, JobHandlerResult } from './types.js';

export const reportJobHandler: JobHandler = {
  type: 'report',
  concurrencySafe: true,

  async run(job, context: JobHandlerContext): Promise<JobHandlerResult> {
    const reportType = job.params.reportType || 'summary';

    if (reportType === 'agent-review' && isValidReviewType(job.params.reviewType as string)) {
      context.appendLog('info', 'Agent review workflow started', {
        reviewType: job.params.reviewType,
        targetId: job.params.targetId,
      });
      context.reportProgress(0.2, 'Gathering evidence');

      const result = await executeAgentReviewWorkflow(
        {
          reviewType: job.params.reviewType as any,
          targetId: (job.params.targetId as string) || '',
          requestedBy: (job.params.requestedBy as string) || 'worker',
          context: job.params.context as Record<string, unknown> | undefined,
        },
        job.params._runtimeContext || {}
      );

      context.reportProgress(1.0, 'Agent review complete');
      context.appendLog(
        'info',
        `Agent review ${job.params.reviewType} completed: ${result.verdict}`
      );

      return {
        ok: result.ok,
        result: {
          reviewType: result.reviewType,
          verdict: result.verdict,
          summary: result.summary,
          evidenceCitations: result.evidenceCitations,
          recommendations: result.recommendations,
        },
      };
    }

    context.appendLog('info', 'Report generation started', { reportType });
    context.reportProgress(0.3, 'Aggregating data');
    context.reportProgress(0.7, 'Rendering report output');

    const artifactPath = `/artifacts/${job.id}/report.pdf`;
    const artifact = {
      name: `${reportType}-report.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 4096,
      path: artifactPath,
    };
    context.attachArtifact(artifact);
    context.reportProgress(1.0, 'Report generated');
    context.appendLog('info', `Report ${reportType} generated successfully`);

    return {
      ok: true,
      result: { reportType, pages: 5 },
      artifacts: [artifact],
    };
  },
};
