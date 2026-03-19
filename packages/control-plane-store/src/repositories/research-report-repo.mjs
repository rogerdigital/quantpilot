import { createResearchReportEntry, trimAndSave } from '../shared.mjs';

const FILENAME = 'research-reports.json';

const DEFAULT_RESEARCH_REPORTS = [
  {
    id: 'research-report-ema-cross',
    evaluationId: 'research-eval-ema-cross',
    workflowRunId: 'workflow-research-report-ema-cross',
    runId: 'bt-ema-cross-20260310',
    resultId: 'backtest-result-ema-cross-v1',
    strategyId: 'ema-cross-us',
    strategyName: 'US Trend Ema Cross',
    title: 'US Trend Ema Cross promotion memo',
    verdict: 'promote',
    readiness: 'paper',
    executiveSummary: 'The reviewed trend strategy remains strong enough to enter paper execution preparation.',
    promotionCall: 'Promote the strategy from candidate to paper and retain the current benchmark envelope.',
    executionPreparation: 'Paper execution can reuse the current order template and broker route assumptions.',
    riskNotes: 'Drawdown remains within the current gate and Sharpe is above the paper promotion floor.',
    createdAt: '2026-03-10T01:20:00.000Z',
    updatedAt: '2026-03-10T01:20:00.000Z',
    metadata: {
      verdictReason: 'strong trend persistence',
    },
  },
];

function parseTimestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSince(value) {
  if (!value) return 0;
  return parseTimestamp(value);
}

export function createResearchReportRepository(store) {
  function readReports() {
    const reports = store.readCollection(FILENAME);
    if (!reports.length) {
      store.writeCollection(FILENAME, DEFAULT_RESEARCH_REPORTS);
      return DEFAULT_RESEARCH_REPORTS.map((entry) => createResearchReportEntry(entry));
    }
    return reports.map((entry) => createResearchReportEntry(entry));
  }

  function writeReports(reports) {
    trimAndSave(store, FILENAME, reports.map((entry) => createResearchReportEntry(entry)), 600);
  }

  return {
    listResearchReports(limit = 100, filter = {}) {
      const sinceMs = normalizeSince(filter.since);
      return readReports()
        .filter((item) => !filter.evaluationId || item.evaluationId === filter.evaluationId)
        .filter((item) => !filter.workflowRunId || item.workflowRunId === filter.workflowRunId)
        .filter((item) => !filter.runId || item.runId === filter.runId)
        .filter((item) => !filter.resultId || item.resultId === filter.resultId)
        .filter((item) => !filter.strategyId || item.strategyId === filter.strategyId)
        .filter((item) => !filter.verdict || item.verdict === filter.verdict)
        .filter((item) => !sinceMs || parseTimestamp(item.createdAt) >= sinceMs)
        .slice(0, limit);
    },
    getResearchReport(reportId) {
      return readReports().find((item) => item.id === reportId) || null;
    },
    getLatestResearchReportForRun(runId) {
      return readReports().find((item) => item.runId === runId) || null;
    },
    getLatestResearchReportForStrategy(strategyId) {
      return readReports().find((item) => item.strategyId === strategyId) || null;
    },
    appendResearchReport(payload = {}) {
      const reports = readReports();
      const entry = createResearchReportEntry(payload);
      reports.unshift(entry);
      writeReports(reports);
      return entry;
    },
  };
}
