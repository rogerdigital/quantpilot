import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DataQualityPanel } from './DataQualityPanel.tsx';
import { DatasetRegistryPanel } from './DatasetRegistryPanel.tsx';
import { FeatureRegistryPanel } from './FeatureRegistryPanel.tsx';

describe('DataQualityPanel', () => {
  it('renders empty state when no reports', () => {
    const html = renderToStaticMarkup(<DataQualityPanel reports={[]} locale="en" />);
    expect(html).toContain('Data Quality');
    expect(html).toContain('No quality reports available');
  });

  it('renders quality summary with blockers and warnings', () => {
    const html = renderToStaticMarkup(
      <DataQualityPanel
        reports={[
          {
            id: 'qr-001',
            datasetId: 'ds-001',
            versionId: 'dsv-001',
            generatedAt: '2024-01-01T00:00:00Z',
            overallStatus: 'blocker',
            freshness: { lastUpdatedAt: '2024-01-01', lagSeconds: 100, stale: false },
            missingRatio: 0,
            duplicateRatio: 0,
            schemaDrift: true,
            outlierSummary: { count: 0, ratio: 0, worstField: '' },
            checks: [
              {
                check: 'schema_mismatch',
                severity: 'blocker',
                passed: false,
                message: 'Schema drift',
                value: 1,
                threshold: 0,
                metadata: {},
              },
            ],
            metadata: {},
          },
          {
            id: 'qr-002',
            datasetId: 'ds-002',
            versionId: 'dsv-002',
            generatedAt: '2024-01-01T00:00:00Z',
            overallStatus: 'warning',
            freshness: { lastUpdatedAt: '2024-01-01', lagSeconds: 50, stale: false },
            missingRatio: 0.15,
            duplicateRatio: 0,
            schemaDrift: false,
            outlierSummary: { count: 3, ratio: 0.01, worstField: 'close' },
            checks: [
              {
                check: 'missing_values',
                severity: 'warning',
                passed: false,
                message: 'High missing ratio',
                value: 0.15,
                threshold: 0.01,
                metadata: {},
              },
            ],
            metadata: {},
          },
          {
            id: 'qr-003',
            datasetId: 'ds-003',
            versionId: 'dsv-003',
            generatedAt: '2024-01-01T00:00:00Z',
            overallStatus: 'pass',
            freshness: { lastUpdatedAt: '2024-01-01', lagSeconds: 10, stale: false },
            missingRatio: 0,
            duplicateRatio: 0,
            schemaDrift: false,
            outlierSummary: { count: 0, ratio: 0, worstField: '' },
            checks: [
              {
                check: 'missing_values',
                severity: 'info',
                passed: true,
                message: 'OK',
                value: 0,
                threshold: 0.01,
                metadata: {},
              },
            ],
            metadata: {},
          },
        ]}
        locale="en"
      />
    );
    expect(html).toContain('Blockers: 1');
    expect(html).toContain('Warnings: 1');
    expect(html).toContain('Healthy: 1');
    expect(html).toContain('dsv-001');
  });

  it('renders in Chinese locale', () => {
    const html = renderToStaticMarkup(<DataQualityPanel reports={[]} locale="zh" />);
    expect(html).toContain('数据质量');
    expect(html).toContain('暂无质量报告');
  });
});

describe('DatasetRegistryPanel', () => {
  it('renders empty state when no datasets', () => {
    const html = renderToStaticMarkup(<DatasetRegistryPanel datasets={[]} locale="en" />);
    expect(html).toContain('Dataset Registry');
    expect(html).toContain('No registered datasets');
  });

  it('renders dataset list with freshness and owner', () => {
    const html = renderToStaticMarkup(
      <DatasetRegistryPanel
        datasets={[
          {
            id: 'ds-001',
            name: 'US Equities Daily',
            description: 'Daily OHLCV for US equities',
            category: 'market_data',
            owner: 'data-team',
            activeVersionId: 'dsv-latest',
            versions: [],
            source: {
              id: 'src-001',
              name: 'Polygon',
              provider: 'polygon',
              category: 'market_data',
              license: 'commercial',
              ingestionFrequency: 'daily',
              lastSuccessfulIngestion: new Date().toISOString(),
              owner: 'data-team',
              metadata: {},
            },
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            metadata: {},
          },
        ]}
        locale="en"
      />
    );
    expect(html).toContain('US Equities Daily');
    expect(html).toContain('market_data');
    expect(html).toContain('data-team');
    expect(html).toContain('Fresh');
    expect(html).toContain('dsv-latest');
  });

  it('marks stale datasets', () => {
    const staleDate = new Date(Date.now() - 200000 * 1000).toISOString();
    const html = renderToStaticMarkup(
      <DatasetRegistryPanel
        datasets={[
          {
            id: 'ds-002',
            name: 'Stale Dataset',
            description: 'Old fundamental data',
            category: 'fundamental',
            owner: 'ops',
            activeVersionId: null,
            versions: [],
            source: {
              id: 'src-002',
              name: 'Internal',
              provider: 'internal',
              category: 'fundamental',
              license: 'none',
              ingestionFrequency: 'daily',
              lastSuccessfulIngestion: staleDate,
              owner: 'ops',
              metadata: {},
            },
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            metadata: {},
          },
        ]}
        locale="en"
      />
    );
    expect(html).toContain('Stale');
  });
});

describe('FeatureRegistryPanel', () => {
  it('renders empty state when no features', () => {
    const html = renderToStaticMarkup(<FeatureRegistryPanel features={[]} locale="en" />);
    expect(html).toContain('Feature Registry');
    expect(html).toContain('No registered feature sets');
  });

  it('renders feature list with lineage and leakage risk', () => {
    const html = renderToStaticMarkup(
      <FeatureRegistryPanel
        features={[
          {
            id: 'fs-001',
            name: 'Momentum Features',
            description: 'Price momentum signals',
            owner: 'researcher-01',
            activeVersionId: 'fv-001',
            versions: [
              {
                id: 'fv-001',
                featureSetId: 'fs-001',
                version: 1,
                formulaFingerprint: 'abc123',
                columnCount: 5,
                rowCount: 1000,
                status: 'active',
                lineage: {
                  sourceDatasetVersionIds: ['dsv-001'],
                  transformationHash: 'hash-001',
                  lookbackWindow: '20d',
                  rebalanceCadence: 'daily',
                  leakagePreventionFlags: ['no_future_close'],
                  leakageRisk: true,
                },
                createdAt: '2024-01-01',
                metadata: {},
              },
            ],
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            metadata: {},
          },
        ]}
        locale="en"
      />
    );
    expect(html).toContain('Momentum Features');
    expect(html).toContain('researcher-01');
    expect(html).toContain('Tracked');
    expect(html).toContain('At Risk');
  });

  it('shows safe status for features without leakage risk', () => {
    const html = renderToStaticMarkup(
      <FeatureRegistryPanel
        features={[
          {
            id: 'fs-002',
            name: 'Basic Volume',
            description: 'Volume-based features',
            owner: 'quant-01',
            activeVersionId: 'fv-002',
            versions: [
              {
                id: 'fv-002',
                featureSetId: 'fs-002',
                version: 1,
                formulaFingerprint: 'def456',
                columnCount: 3,
                rowCount: 500,
                status: 'active',
                lineage: {
                  sourceDatasetVersionIds: [],
                  transformationHash: 'hash-002',
                  lookbackWindow: '5d',
                  rebalanceCadence: 'weekly',
                  leakagePreventionFlags: [],
                  leakageRisk: false,
                },
                createdAt: '2024-01-01',
                metadata: {},
              },
            ],
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            metadata: {},
          },
        ]}
        locale="en"
      />
    );
    expect(html).toContain('Safe');
    expect(html).toContain('Untracked');
  });
});
