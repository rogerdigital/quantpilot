import { useAgentTools } from '../../hooks/useAgentTools.ts';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { SectionHeader, TopMeta } from '../console/components/ConsoleChrome.tsx';
import { copy, useLocale } from '../console/i18n.tsx';
import { translateRiskLevel, translateRuntimeText } from '../console/utils.ts';

const promptSuggestions = {
  zh: [
    '总结今天亏损原因',
    '给我一个更稳健的参数组合',
    '把回撤控制在 8% 内重算策略',
    '明天开盘前生成执行计划',
  ],
  en: [
    'Summarize today\'s loss drivers',
    'Suggest a more robust parameter set',
    'Recompute the strategy with max drawdown capped at 8%',
    'Generate the execution plan before tomorrow\'s open',
  ],
};

export default function AgentPage() {
  const { state } = useTradingSystem();
  const { locale } = useLocale();
  const { tools, preview, loading, error } = useAgentTools();

  return (
    <>
      <SectionHeader routeKey="agent" />
      <TopMeta items={[
        { label: copy[locale].labels.marketClock, value: state.marketClock },
        { label: copy[locale].terms.riskLevel, value: translateRiskLevel(locale, state.riskLevel), accent: true },
        { label: locale === 'zh' ? '受限工具' : 'Allowed Tools', value: String(tools.length) },
      ]} />

      <section className="hero-grid two-up">
        <div className="hero-card hero-card-primary">
          <div className="card-eyebrow">{locale === 'zh' ? 'Tool Layer' : 'Tool Layer'}</div>
          <div className="mini-metric">{locale === 'zh' ? '只读白名单' : 'Read-only Allowlist'}</div>
          <div className="mini-copy">
            {locale === 'zh'
              ? 'Agent 当前只能通过白名单工具读取策略、回测、风险和执行摘要，不能直接写 execution 或 workflow。'
              : 'Agent currently reads strategy, backtest, risk, and execution summaries through an allowlisted tool layer and cannot write execution or workflow state directly.'}
          </div>
        </div>
        <div className="hero-card">
          <div className="card-eyebrow">{locale === 'zh' ? 'Preview Result' : 'Preview Result'}</div>
          <div className="mini-metric">{preview?.summary || translateRuntimeText(locale, state.decisionCopy)}</div>
          <div className="mini-copy">
            {locale === 'zh'
              ? '当前预览只调用只读工具 `backtest.summary.get`，用于证明 Agent 访问已切到结构化工具层。'
              : 'The current preview only calls the read-only `backtest.summary.get` tool to prove Agent access has moved behind the structured tool layer.'}
          </div>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '工具白名单' : 'Tool Allowlist'}</div><div className="panel-copy">{locale === 'zh' ? '这些是 Agent 当前被允许调用的结构化工具。' : 'These are the structured tools currently allowed for Agent access.'}</div></div><div className="panel-badge badge-info">{tools.length}</div></div>
          <div className="focus-list focus-list-terminal">
            {loading ? <div className="empty-cell">{locale === 'zh' ? '正在加载工具目录...' : 'Loading tool registry...'}</div> : null}
            {error ? <div className="empty-cell">{locale === 'zh' ? `工具目录不可用：${error}` : `Tool registry unavailable: ${error}`}</div> : null}
            {!loading && !error ? tools.map((tool) => (
              <div className="focus-row" key={tool.name}>
                <div className="symbol-cell">
                  <strong>{tool.name}</strong>
                  <span>{tool.description}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '分类' : 'Category'}</span>
                  <strong>{tool.category}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '权限' : 'Access'}</span>
                  <strong>{tool.access}</strong>
                </div>
              </div>
            )) : null}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Prompt 到工具边界' : 'Prompt-to-Tool Boundary'}</div><div className="panel-copy">{locale === 'zh' ? 'Prompt 仍然面向自然语言，但后端实际只暴露白名单工具，不暴露直接写操作。' : 'Prompts remain natural language, but the backend only exposes allowlisted tools and no direct write operations.'}</div></div><div className="panel-badge badge-warn">BOUNDARY</div></div>
          <div className="focus-list focus-list-terminal">
            {promptSuggestions[locale].map((prompt) => (
              <div className="focus-row" key={prompt}>
                <div className="symbol-cell">
                  <strong>{locale === 'zh' ? 'Prompt' : 'Prompt'}</strong>
                  <span>{prompt}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
