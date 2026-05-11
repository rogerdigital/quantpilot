import { useLocale } from '../../modules/console/console.i18n.tsx';
import { DataQualityPanel } from '../../modules/data/DataQualityPanel.tsx';
import { DatasetRegistryPanel } from '../../modules/data/DatasetRegistryPanel.tsx';
import { FeatureRegistryPanel } from '../../modules/data/FeatureRegistryPanel.tsx';
import { useDataConsole } from '../../modules/data/useDataConsole.ts';
import * as css from './DataPage.css.ts';

export function DataPage() {
  const { locale } = useLocale();
  const { datasets, qualityReports, features, loading, error } = useDataConsole();

  const labels = {
    zh: {
      title: '数据科学平台',
      subtitle: '管理数据资产、质量报告和特征血缘，为策略研究提供可靠数据基础。',
      loading: '加载中...',
    },
    en: {
      title: 'Data Science Platform',
      subtitle:
        'Manage data assets, quality reports, and feature lineage for reliable research foundations.',
      loading: 'Loading...',
    },
  }[locale];

  if (loading) {
    return (
      <div className={css.dataPageLayout}>
        <div className={css.dataPageLoading}>{labels.loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={css.dataPageLayout}>
        <div className={css.dataPageError}>{error}</div>
      </div>
    );
  }

  return (
    <div className={css.dataPageLayout}>
      <header className={css.dataPageHeader}>
        <div>
          <h1 className={css.dataPageTitle}>{labels.title}</h1>
          <p className={css.dataPageSubtitle}>{labels.subtitle}</p>
        </div>
      </header>

      <div className={css.dataPageGrid}>
        <div className={css.dataPageSection}>
          <DataQualityPanel reports={qualityReports} locale={locale} />
        </div>

        <div className={css.dataPageSection}>
          <DatasetRegistryPanel datasets={datasets} locale={locale} />
        </div>

        <div className={css.dataPageSection}>
          <FeatureRegistryPanel features={features} locale={locale} />
        </div>
      </div>
    </div>
  );
}

export default DataPage;
