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
  const strongest = state.stockStates.slice().sort((a, b) => b.score - a.score).slice(0, 3);

  return (
    <>
      <SectionHeader routeKey="agent" />
      <TopMeta items={[
        { label: copy[locale].labels.marketClock, value: state.marketClock },
        { label: copy[locale].terms.riskLevel, value: translateRiskLevel(locale, state.riskLevel), accent: true },
        { label: locale === 'zh' ? 'Agent 任务' : 'Agent Tasks', value: String(promptSuggestions[locale].length) },
      ]} />

      <section className="hero-grid two-up">
        <div className="hero-card hero-card-primary">
          <div className="card-eyebrow">{locale === 'zh' ? 'Intent Parser' : 'Intent Parser'}</div>
          <div className="mini-metric">{translateRuntimeText(locale, state.decisionSummary)}</div>
          <div className="mini-copy">{locale === 'zh' ? '当前用交易系统状态模拟 Agent 的上下文输入，下一步可以接 Planner 和 Tool Router。' : 'The prototype currently feeds Agent context from trading-system state and can next add a Planner and Tool Router.'}</div>
        </div>
        <div className="hero-card">
          <div className="card-eyebrow">{locale === 'zh' ? 'Explanation Engine' : 'Explanation Engine'}</div>
          <div className="mini-metric">{translateRuntimeText(locale, state.decisionCopy)}</div>
          <div className="mini-copy">{locale === 'zh' ? '把策略结论、风险状态和执行路径翻译成人能确认的建议。' : 'Translate strategy posture, risk state, and execution routing into operator-confirmable guidance.'}</div>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '建议提示词' : 'Suggested Prompts'}</div><div className="panel-copy">{locale === 'zh' ? '这些提示词对应你定义的 Agent Copilot 工作流。' : 'These prompts mirror the Agent Copilot workflows you outlined.'}</div></div><div className="panel-badge badge-info">PROMPTS</div></div>
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
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? '候选行动' : 'Candidate Actions'}</div><div className="panel-copy">{locale === 'zh' ? '用当前评分最高的标的模拟 Agent 输出建议。' : 'Use the highest-scoring symbols to simulate Agent recommendations.'}</div></div><div className="panel-badge badge-warn">PLAN</div></div>
          <div className="focus-list focus-list-terminal">
            {strongest.map((stock) => (
              <div className="focus-row" key={stock.symbol}>
                <div className="symbol-cell">
                  <strong>{stock.symbol}</strong>
                  <span>{stock.name}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '评分' : 'Score'}</span>
                  <strong>{stock.score.toFixed(1)}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '建议' : 'Advice'}</span>
                  <strong>{translateRuntimeText(locale, stock.actionText)}</strong>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
