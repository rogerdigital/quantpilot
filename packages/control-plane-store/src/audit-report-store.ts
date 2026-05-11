// @ts-nocheck

export type AuditReportType =
  | 'strategy_promotion'
  | 'live_trading_approval'
  | 'risk_breach'
  | 'execution_incident'
  | 'agent_action'
  | 'dataset_lineage';

export type AuditReport = {
  id: string;
  organizationId: string;
  reportType: AuditReportType;
  title: string;
  summary: string;
  generatedBy: string;
  status: 'draft' | 'final' | 'exported';
  entries: AuditReportEntry[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type AuditReportEntry = {
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  evidenceRef?: string;
};

export class AuditReportStore {
  private reports: Map<string, AuditReport> = new Map();

  createReport(report: AuditReport): AuditReport {
    this.reports.set(report.id, structuredClone(report));
    return structuredClone(report);
  }

  getReport(id: string): AuditReport | null {
    const report = this.reports.get(id);
    return report ? structuredClone(report) : null;
  }

  listReports(organizationId?: string, reportType?: AuditReportType): AuditReport[] {
    let results = [...this.reports.values()];
    if (organizationId) {
      results = results.filter((r) => r.organizationId === organizationId);
    }
    if (reportType) {
      results = results.filter((r) => r.reportType === reportType);
    }
    return results.map((r) => structuredClone(r));
  }

  updateReport(id: string, patch: Partial<AuditReport>): AuditReport | null {
    const report = this.reports.get(id);
    if (!report) return null;
    Object.assign(report, patch, { updatedAt: new Date().toISOString() });
    return structuredClone(report);
  }

  appendEntry(reportId: string, entry: AuditReportEntry): AuditReport | null {
    const report = this.reports.get(reportId);
    if (!report) return null;
    report.entries.push(entry);
    report.updatedAt = new Date().toISOString();
    return structuredClone(report);
  }

  finalizeReport(id: string): AuditReport | null {
    return this.updateReport(id, { status: 'final' });
  }

  exportReport(id: string): AuditReport | null {
    const report = this.reports.get(id);
    if (!report || report.status !== 'final') return null;
    return this.updateReport(id, { status: 'exported' });
  }
}
