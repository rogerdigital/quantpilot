import { useState } from 'react';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { SectionHeader, TopMeta } from '../../pages/console/components/ConsoleChrome.tsx';
import { copy, useLocale } from '../../pages/console/i18n.tsx';
import { translateRiskLevel } from '../../pages/console/utils.ts';
import { useAgentTools } from './useAgentTools.ts';

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
  const { state, session } = useTradingSystem();
  const { locale } = useLocale();
  const { tools, workbench, sessionDetail, selectedSessionId, loading, running, error, selectSession, runPrompt } = useAgentTools();
  const [prompt, setPrompt] = useState(promptSuggestions[locale][0]);

  const summary = workbench?.summary;
  const latestExplanation = sessionDetail?.latestAnalysisRun?.explanation || null;
  const recentSessions = Array.isArray(workbench?.queues.recentSessions) ? workbench?.queues.recentSessions : [];
  const pendingRequests = Array.isArray(workbench?.queues.pendingActionRequests) ? workbench?.queues.pendingActionRequests : [];
  const recentExplanations = Array.isArray(workbench?.recentExplanations) ? workbench.recentExplanations : [];
  const timeline = Array.isArray(sessionDetail?.timeline) ? sessionDetail.timeline : [];
  const runbook = Array.isArray(workbench?.runbook) ? workbench.runbook : [];

  const submitPrompt = async () => {
    const result = await runPrompt(prompt, session?.user.id);
    if (result?.session?.prompt) {
      setPrompt(result.session.prompt);
    }
  };

  return (
    <>
      <SectionHeader routeKey="agent" />
      <TopMeta items={[
        { label: copy[locale].labels.marketClock, value: state.marketClock },
        { label: copy[locale].terms.riskLevel, value: translateRiskLevel(locale, state.riskLevel), accent: true },
        { label: locale === 'zh' ? '活跃会话' : 'Active Sessions', value: String(summary?.runningSessions ?? 0) },
        { label: locale === 'zh' ? '待审批请求' : 'Pending Requests', value: String(summary?.pendingActionRequests ?? 0) },
      ]} />

      <section className="hero-grid two-up">
        <div className="hero-card hero-card-primary">
          <div className="card-eyebrow">{locale === 'zh' ? 'Workbench' : 'Workbench'}</div>
          <div className="mini-metric">
            {locale === 'zh'
              ? `${summary?.completedSessions ?? 0} 个会话已完成分析`
              : `${summary?.completedSessions ?? 0} sessions completed analysis`}
          </div>
          <div className="mini-copy">
            {locale === 'zh'
              ? '这里现在已经是正式的 Agent 协作工作台：会话、解释、待审批请求和 operator trail 都来自后端 workbench 聚合，不再只是工具演示页。'
              : 'This is now a real Agent collaboration workbench: sessions, explanations, pending requests, and the operator trail all come from backend workbench aggregation instead of a simple tool demo.'}
        </div>
        </div>
        <div className="hero-card">
          <div className="card-eyebrow">{locale === 'zh' ? 'Latest Explanation' : 'Latest Explanation'}</div>
          <div className="mini-metric">{latestExplanation?.thesis || (locale === 'zh' ? '等待新的分析结果' : 'Waiting for the next analysis result')}</div>
          <div className="mini-copy">
            {locale === 'zh'
              ? (latestExplanation?.recommendedNextStep || '运行一次新的分析后，这里会显示结构化解释和建议的下一步动作。')
              : (latestExplanation?.recommendedNextStep || 'Run a new analysis to surface a structured explanation and the recommended next action here.')}
          </div>
        </div>
      </section>

      <section className="panel-grid panel-grid-wide">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Prompt Studio' : 'Prompt Studio'}</div><div className="panel-copy">{locale === 'zh' ? '从这里发起新的 Agent 分析，系统会自动解析 intent、生成 plan，并执行只读分析链路。' : 'Start a new Agent analysis here. The backend will parse intent, create a plan, and run the read-only analysis path.'}</div></div><div className={`panel-badge ${running ? 'badge-warn' : 'badge-info'}`}>{running ? 'RUNNING' : 'READY'}</div></div>
          <label className="field-label" htmlFor="agent-prompt-input">{locale === 'zh' ? '分析请求' : 'Analysis Prompt'}</label>
          <textarea
            id="agent-prompt-input"
            className="detail-textarea"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <div className="focus-list">
            <div className="focus-row">
              <div className="symbol-cell">
                <strong>{locale === 'zh' ? '会话状态' : 'Session Status'}</strong>
                <span>{sessionDetail?.session.status || (locale === 'zh' ? '尚未选择会话' : 'No session selected yet')}</span>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? 'Intent' : 'Intent'}</span>
                <strong>{sessionDetail?.session.latestIntent.kind || '--'}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? 'Plan' : 'Plan'}</span>
                <strong>{sessionDetail?.latestPlan?.status || '--'}</strong>
              </div>
            </div>
            <div className="focus-row">
              <div className="symbol-cell">
                <strong>{locale === 'zh' ? '快捷提示' : 'Prompt Suggestions'}</strong>
                <span>{locale === 'zh' ? '点击即可填入编辑框，然后运行分析。' : 'Click any suggestion to populate the editor and run the analysis.'}</span>
              </div>
            </div>
            {promptSuggestions[locale].map((item) => (
              <div className="focus-row" key={item}>
                <div className="symbol-cell">
                  <strong>{locale === 'zh' ? 'Prompt' : 'Prompt'}</strong>
                  <span>{item}</span>
                </div>
                <div className="focus-metric">
                  <button type="button" className="inline-link" onClick={() => setPrompt(item)}>{locale === 'zh' ? '填入' : 'Use'}</button>
                </div>
              </div>
            ))}
            <div className="focus-row">
              <div className="symbol-cell">
                <strong>{locale === 'zh' ? '提交分析' : 'Run Analysis'}</strong>
                <span>{error || (locale === 'zh' ? '只会执行白名单只读工具，不会直接写 execution 或 workflow。' : 'This only runs allowlisted read-only tools and never writes execution or workflow state directly.')}</span>
              </div>
              <div className="focus-metric">
                <button type="button" onClick={submitPrompt} disabled={running || !prompt.trim()}>{running ? (locale === 'zh' ? '运行中...' : 'Running...') : (locale === 'zh' ? '运行分析' : 'Run')}</button>
              </div>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Recent Sessions' : 'Recent Sessions'}</div><div className="panel-copy">{locale === 'zh' ? '查看最近的 agent 会话，并切换到对应的详细解释和 timeline。' : 'Review recent agent sessions and switch into their explanation and timeline detail.'}</div></div><div className="panel-badge badge-info">{recentSessions.length}</div></div>
          <div className="focus-list focus-list-terminal">
            {loading && !recentSessions.length ? <div className="empty-cell">{locale === 'zh' ? '正在加载 Agent 工作台...' : 'Loading agent workbench...'}</div> : null}
            {!loading && !recentSessions.length ? <div className="empty-cell">{locale === 'zh' ? '当前还没有 agent 会话。' : 'No agent sessions have been recorded yet.'}</div> : null}
            {recentSessions.map((item) => (
              <div className="focus-row" key={String(item.id)}>
                <div className="symbol-cell">
                  <strong>{String(item.title || item.id)}</strong>
                  <span>{String(item.prompt || '--')}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                  <strong>{String(item.status || '--')}</strong>
                </div>
                <div className="focus-metric">
                  <button type="button" className="inline-link" onClick={() => selectSession(String(item.id || ''))}>
                    {selectedSessionId === String(item.id || '') ? (locale === 'zh' ? '已选中' : 'Selected') : (locale === 'zh' ? '查看' : 'Open')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Pending Requests' : 'Pending Requests'}</div><div className="panel-copy">{locale === 'zh' ? '这里显示等待人工 review 的 agent action requests，方便从分析工作台切换到审批上下文。' : 'These are the agent action requests still waiting for manual review, so operators can pivot from analysis into approval context.'}</div></div><div className={`panel-badge ${pendingRequests.length ? 'badge-warn' : 'badge-muted'}`}>{pendingRequests.length}</div></div>
          <div className="focus-list focus-list-terminal">
            {!pendingRequests.length ? <div className="empty-cell">{locale === 'zh' ? '当前没有待审批的 agent 请求。' : 'There are no pending agent requests right now.'}</div> : null}
            {pendingRequests.map((item) => (
              <div className="focus-row" key={String(item.id)}>
                <div className="symbol-cell">
                  <strong>{String(item.requestType || '--')}</strong>
                  <span>{String(item.summary || '--')}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '审批' : 'Approval'}</span>
                  <strong>{String(item.approvalState || '--')}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '风险' : 'Risk'}</span>
                  <strong>{String(item.riskStatus || '--')}</strong>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel-grid panel-grid-wide">
        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Explanation Detail' : 'Explanation Detail'}</div><div className="panel-copy">{locale === 'zh' ? '这里显示选中会话的最新 thesis、理由、警告和下一步建议。' : 'Review the selected session thesis, rationale, warnings, and recommended next step here.'}</div></div><div className={`panel-badge ${latestExplanation?.warnings?.length ? 'badge-warn' : 'badge-info'}`}>{latestExplanation?.warnings?.length ?? 0}</div></div>
          <div className="focus-list">
            <div className="focus-row">
              <div className="symbol-cell">
                <strong>{latestExplanation?.thesis || (locale === 'zh' ? '等待解释结果' : 'Waiting for explanation')}</strong>
                <span>{sessionDetail?.latestAnalysisRun?.summary || (locale === 'zh' ? '运行一次分析后，这里会显示结构化结论。' : 'Run an analysis to surface a structured conclusion here.')}</span>
              </div>
            </div>
            {(latestExplanation?.rationale || []).map((item) => (
              <div className="focus-row" key={item}>
                <div className="symbol-cell">
                  <strong>{locale === 'zh' ? '理由' : 'Rationale'}</strong>
                  <span>{item}</span>
                </div>
              </div>
            ))}
            {(latestExplanation?.warnings || []).map((item) => (
              <div className="focus-row" key={item}>
                <div className="symbol-cell">
                  <strong>{locale === 'zh' ? '警告' : 'Warning'}</strong>
                  <span>{item}</span>
                </div>
              </div>
            ))}
            <div className="focus-row">
              <div className="symbol-cell">
                <strong>{locale === 'zh' ? '下一步' : 'Recommended Next Step'}</strong>
                <span>{latestExplanation?.recommendedNextStep || '--'}</span>
              </div>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Operator Timeline' : 'Operator Timeline'}</div><div className="panel-copy">{locale === 'zh' ? '把 session 相关的 audit、request、notification 和 operator action 串成一条可回放轨迹。' : 'Replay the session audit, request, notification, and operator-action trail in one place.'}</div></div><div className="panel-badge badge-info">{timeline.length}</div></div>
          <div className="focus-list focus-list-terminal">
            {!timeline.length ? <div className="empty-cell">{locale === 'zh' ? '当前会话还没有轨迹记录。' : 'This session does not have a timeline yet.'}</div> : null}
            {timeline.map((item) => (
              <div className="focus-row" key={item.id}>
                <div className="symbol-cell">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '轨道' : 'Lane'}</span>
                  <strong>{item.lane}</strong>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '执行者' : 'Actor'}</span>
                  <strong>{item.actor || '--'}</strong>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Tool Allowlist' : 'Tool Allowlist'}</div><div className="panel-copy">{locale === 'zh' ? 'Agent 工作台仍然只会调用这些白名单只读工具，不会直接写 execution 或 workflow。' : 'The workbench still only invokes these allowlisted read-only tools and never writes execution or workflow state directly.'}</div></div><div className="panel-badge badge-info">{tools.length}</div></div>
          <div className="focus-list">
            {tools.map((tool) => (
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
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Runbook And Recent Explanations' : 'Runbook And Recent Explanations'}</div><div className="panel-copy">{locale === 'zh' ? '先看 workbench runbook，再回看最近的 explanation 摘要。' : 'Use the workbench runbook to prioritize work, then review the latest explanation summaries.'}</div></div><div className="panel-badge badge-info">{runbook.length + recentExplanations.length}</div></div>
          <div className="focus-list">
            {runbook.map((item) => (
              <div className="focus-row" key={item.key}>
                <div className="symbol-cell">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '优先级' : 'Priority'}</span>
                  <strong>{item.priority}</strong>
                </div>
              </div>
            ))}
            {recentExplanations.map((item) => (
              <div className="focus-row" key={item.analysisRunId}>
                <div className="symbol-cell">
                  <strong>{item.thesis}</strong>
                  <span>{item.recommendedNextStep}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '警告' : 'Warnings'}</span>
                  <strong>{item.warningCount}</strong>
                </div>
                <div className="focus-metric">
                  <button type="button" className="inline-link" onClick={() => selectSession(item.sessionId)}>
                    {locale === 'zh' ? '查看会话' : 'Open Session'}
                  </button>
                </div>
              </div>
            ))}
            {!runbook.length && !recentExplanations.length ? <div className="empty-cell">{locale === 'zh' ? '工作台还没有形成 runbook 或 explanation 摘要。' : 'The workbench does not have a runbook or explanation summary yet.'}</div> : null}
          </div>
        </article>
      </section>
    </>
  );
}
