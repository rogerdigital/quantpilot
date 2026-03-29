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

function buildAgentConversation({
  locale,
  prompt,
  sessionStatus,
  intentKind,
  planStatus,
  running,
  error,
  thesis,
  summary,
  rationale,
  warnings,
  recommendedNextStep,
  actionRequestSummary,
  actionRequestStatus,
}: {
  locale: 'zh' | 'en';
  prompt: string;
  sessionStatus: string;
  intentKind: string;
  planStatus: string;
  running: boolean;
  error: string;
  thesis: string;
  summary: string;
  rationale: string[];
  warnings: string[];
  recommendedNextStep: string;
  actionRequestSummary: string;
  actionRequestStatus: string;
}) {
  const messages = [];
  messages.push({
    key: 'system-session',
    role: 'system',
    label: locale === 'zh' ? '系统' : 'System',
    body: locale === 'zh'
      ? `当前会话状态：${sessionStatus || '未选择'}；最近 intent：${intentKind || '--'}；plan：${planStatus || '--'}。`
      : `Current session status: ${sessionStatus || 'unselected'}; latest intent: ${intentKind || '--'}; plan: ${planStatus || '--'}.`,
    tone: 'muted',
  });

  if (prompt.trim()) {
    messages.push({
      key: 'user-prompt',
      role: 'user',
      label: locale === 'zh' ? '你' : 'You',
      body: prompt.trim(),
      tone: 'default',
    });
  }

  if (running) {
    messages.push({
      key: 'assistant-running',
      role: 'assistant',
      label: locale === 'zh' ? 'Agent' : 'Agent',
      body: locale === 'zh'
        ? '正在解析意图、生成计划，并串行执行白名单只读工具。'
        : 'Parsing intent, creating a plan, and running allowlisted read-only tools.',
      tone: 'muted',
    });
  }

  if (thesis || summary || rationale.length || warnings.length || recommendedNextStep || actionRequestSummary) {
    const body = [
      thesis ? thesis : (locale === 'zh' ? '本轮分析已经完成。' : 'This analysis run has completed.'),
      summary ? summary : null,
      rationale.length ? `${locale === 'zh' ? '理由' : 'Rationale'}: ${rationale.join(' ')}` : null,
      warnings.length ? `${locale === 'zh' ? '警告' : 'Warnings'}: ${warnings.join(' ')}` : null,
      recommendedNextStep ? `${locale === 'zh' ? '下一步' : 'Next step'}: ${recommendedNextStep}` : null,
      actionRequestSummary
        ? `${locale === 'zh' ? '审批请求' : 'Action request'}: ${actionRequestSummary} (${actionRequestStatus || '--'})`
        : null,
    ].filter(Boolean).join(' ');

    messages.push({
      key: 'assistant-summary',
      role: 'assistant',
      label: locale === 'zh' ? 'Agent' : 'Agent',
      body,
      tone: warnings.length ? 'warn' : 'default',
    });
  }

  if (error) {
    messages.push({
      key: 'system-error',
      role: 'system',
      label: locale === 'zh' ? '工作台提示' : 'Workbench Alert',
      body: error,
      tone: 'warn',
    });
  }

  return messages;
}

export default function AgentPage() {
  const { state, session } = useTradingSystem();
  const { locale } = useLocale();
  const { tools, workbench, sessionDetail, selectedSessionId, loading, running, requestingAction, error, selectSession, runPrompt, requestAction, refresh } = useAgentTools();
  const [prompt, setPrompt] = useState(promptSuggestions[locale][0]);

  const summary = workbench?.summary;
  const latestExplanation = sessionDetail?.latestAnalysisRun?.explanation || null;
  const latestActionRequest = sessionDetail?.latestActionRequest || null;
  const recentSessions = Array.isArray(workbench?.queues.recentSessions) ? workbench?.queues.recentSessions : [];
  const pendingRequests = Array.isArray(workbench?.queues.pendingActionRequests) ? workbench?.queues.pendingActionRequests : [];
  const recentExplanations = Array.isArray(workbench?.recentExplanations) ? workbench.recentExplanations : [];
  const timeline = Array.isArray(sessionDetail?.timeline) ? sessionDetail.timeline : [];
  const runbook = Array.isArray(workbench?.runbook) ? workbench.runbook : [];
  const latestRationale = Array.isArray(latestExplanation?.rationale) ? latestExplanation.rationale : [];
  const latestWarnings = Array.isArray(latestExplanation?.warnings) ? latestExplanation.warnings : [];
  const conversation = buildAgentConversation({
    locale,
    prompt,
    sessionStatus: sessionDetail?.session.status || '',
    intentKind: sessionDetail?.session.latestIntent.kind || '',
    planStatus: sessionDetail?.latestPlan?.status || '',
    running,
    error,
    thesis: latestExplanation?.thesis || '',
    summary: sessionDetail?.latestAnalysisRun?.summary || '',
    rationale: latestRationale,
    warnings: latestWarnings,
    recommendedNextStep: latestExplanation?.recommendedNextStep || '',
    actionRequestSummary: latestActionRequest?.summary || '',
    actionRequestStatus: latestActionRequest?.status || '',
  });
  const canRequestAction = Boolean(
    sessionDetail?.session.id
    && sessionDetail?.latestPlan?.requiresApproval
    && sessionDetail?.latestPlan?.status === 'completed'
    && sessionDetail?.latestAnalysisRun?.status === 'completed'
    && latestActionRequest?.status !== 'pending_review',
  );

  const submitPrompt = async () => {
    const result = await runPrompt(prompt, session?.user.id);
    if (result?.session?.prompt) {
      setPrompt(result.session.prompt);
    }
  };

  const submitActionRequest = async () => {
    await requestAction(session?.user.id);
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
          <div className="settings-chip-row">
            <button type="button" className="inline-link" onClick={() => refresh()} disabled={loading || running || requestingAction}>
              {loading ? (locale === 'zh' ? '刷新中...' : 'Refreshing...') : (locale === 'zh' ? '刷新工作台' : 'Refresh Workbench')}
            </button>
            <a className="settings-chip" href="#agent-sessions">{locale === 'zh' ? '最近会话' : 'Recent Sessions'}</a>
            <a className="settings-chip" href="#agent-explanation">{locale === 'zh' ? '解释详情' : 'Explanation Detail'}</a>
            <a className="settings-chip" href="#agent-timeline">{locale === 'zh' ? '轨迹时间线' : 'Operator Timeline'}</a>
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
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Agent Chat' : 'Agent Chat'}</div><div className="panel-copy">{locale === 'zh' ? '先以对话方式提出分析请求，再把解释、警告和审批建议沉淀到右侧工作台。' : 'Start with a chat-style request, then let the structured explanation, warnings, and approval handoff settle into the workbench on the right.'}</div></div><div className={`panel-badge ${running ? 'badge-warn' : 'badge-info'}`}>{running ? 'RUNNING' : 'READY'}</div></div>
          <div className="agent-chat-shell">
            <div className="agent-chat-transcript">
              {!conversation.length ? (
                <div className="empty-cell">{locale === 'zh' ? '当前还没有消息，先向 Agent 提一个分析问题。' : 'There are no messages yet. Start by asking the Agent for an analysis.'}</div>
              ) : null}
              {conversation.map((message) => (
                <div className={`agent-chat-message agent-chat-${message.role} agent-chat-${message.tone}`} key={message.key}>
                  <div className="agent-chat-meta">
                    <span>{message.label}</span>
                    <span>{message.role.toUpperCase()}</span>
                  </div>
                  <div className="agent-chat-body">{message.body}</div>
                </div>
              ))}
            </div>
            <div className="agent-chat-sidecar">
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
                    <span>{locale === 'zh' ? '点击任意建议，把它放进消息框后直接发送。' : 'Use any suggestion to populate the composer and send it straight into the analysis flow.'}</span>
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
              </div>
            </div>
          </div>
          <label className="field-label" htmlFor="agent-prompt-input">{locale === 'zh' ? '发给 Agent 的消息' : 'Message To Agent'}</label>
          <div className="agent-chat-composer">
            <textarea
              id="agent-prompt-input"
              className="detail-textarea agent-chat-textarea"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
            <div className="agent-chat-composer-actions">
              <div className="status-copy">
                {locale === 'zh'
                  ? '发送后会进入 intent -> plan -> read-only analysis 流程，并把结果写回当前会话。'
                  : 'Sending a message enters the intent -> plan -> read-only analysis flow and writes the result back into the current session.'}
              </div>
              <button type="button" onClick={submitPrompt} disabled={running || !prompt.trim()}>{running ? (locale === 'zh' ? '运行中...' : 'Running...') : (locale === 'zh' ? '发送并分析' : 'Send And Analyze')}</button>
            </div>
          </div>
          <div className="focus-list">
            <div className="focus-row">
              <div className="symbol-cell">
                <strong>{locale === 'zh' ? '受控交接' : 'Controlled Handoff'}</strong>
                <span>
                  {latestActionRequest?.status === 'pending_review'
                    ? (locale === 'zh' ? '当前会话已经有待审批的 action request。' : 'This session already has a pending action request.')
                    : (locale === 'zh'
                      ? '当解释链路完成且 plan 需要审批时，可以把下一步建议正式提交为 action request。'
                      : 'Once analysis is complete and the plan requires approval, the recommended next step can be submitted as a formal action request.')}
                </span>
              </div>
              <div className="focus-metric">
                <button type="button" onClick={submitActionRequest} disabled={!canRequestAction || requestingAction}>
                  {requestingAction
                    ? (locale === 'zh' ? '提交中...' : 'Submitting...')
                    : (locale === 'zh' ? '提交审批' : 'Request Approval')}
                </button>
              </div>
            </div>
          </div>
        </article>

        <article className="panel" id="agent-sessions">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Recent Sessions' : 'Recent Sessions'}</div><div className="panel-copy">{locale === 'zh' ? '查看最近的 agent 会话，并切换到对应的详细解释和 timeline。' : 'Review recent agent sessions and switch into their explanation and timeline detail.'}</div></div><div className="settings-chip-row"><button type="button" className="inline-link" onClick={() => refresh()} disabled={loading || running || requestingAction}>{locale === 'zh' ? '刷新' : 'Refresh'}</button><div className="panel-badge badge-info">{recentSessions.length}</div></div></div>
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
        <article className="panel" id="agent-explanation">
          <div className="panel-head"><div><div className="panel-title">{locale === 'zh' ? 'Explanation Detail' : 'Explanation Detail'}</div><div className="panel-copy">{locale === 'zh' ? '这里显示选中会话的最新 thesis、理由、警告和下一步建议。' : 'Review the selected session thesis, rationale, warnings, and recommended next step here.'}</div></div><div className={`panel-badge ${latestExplanation?.warnings?.length ? 'badge-warn' : 'badge-info'}`}>{latestExplanation?.warnings?.length ?? 0}</div></div>
          <div className="focus-list">
            <div className="focus-row">
              <div className="symbol-cell">
                <strong>{latestExplanation?.thesis || (locale === 'zh' ? '等待解释结果' : 'Waiting for explanation')}</strong>
                <span>{sessionDetail?.latestAnalysisRun?.summary || (locale === 'zh' ? '运行一次分析后，这里会显示结构化结论。' : 'Run an analysis to surface a structured conclusion here.')}</span>
              </div>
            </div>
            {latestRationale.map((item) => (
              <div className="focus-row" key={item}>
                <div className="symbol-cell">
                  <strong>{locale === 'zh' ? '理由' : 'Rationale'}</strong>
                  <span>{item}</span>
                </div>
              </div>
            ))}
            {!latestRationale.length ? (
              <div className="focus-row">
                <div className="symbol-cell">
                  <strong>{locale === 'zh' ? '理由' : 'Rationale'}</strong>
                  <span>{locale === 'zh' ? '当前解释还没有额外的理由条目。' : 'No additional rationale items are available for this explanation yet.'}</span>
                </div>
              </div>
            ) : null}
            {latestWarnings.map((item) => (
              <div className="focus-row" key={item}>
                <div className="symbol-cell">
                  <strong>{locale === 'zh' ? '警告' : 'Warning'}</strong>
                  <span>{item}</span>
                </div>
              </div>
            ))}
            {!latestWarnings.length ? (
              <div className="focus-row">
                <div className="symbol-cell">
                  <strong>{locale === 'zh' ? '警告' : 'Warning'}</strong>
                  <span>{locale === 'zh' ? '当前解释还没有新的警告条目。' : 'No warning items have been raised for this explanation yet.'}</span>
                </div>
              </div>
            ) : null}
            <div className="focus-row">
              <div className="symbol-cell">
                <strong>{locale === 'zh' ? '下一步' : 'Recommended Next Step'}</strong>
                <span>{latestExplanation?.recommendedNextStep || '--'}</span>
              </div>
            </div>
            <div className="focus-row">
              <div className="symbol-cell">
                <strong>{locale === 'zh' ? '动作请求' : 'Action Request'}</strong>
                <span>{latestActionRequest?.summary || (locale === 'zh' ? '当前会话还没有提交 action request。' : 'No action request has been submitted for this session yet.')}</span>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '状态' : 'Status'}</span>
                <strong>{latestActionRequest?.status || '--'}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '审批' : 'Approval'}</span>
                <strong>{latestActionRequest?.approvalState || '--'}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="panel" id="agent-timeline">
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
            {!tools.length ? <div className="empty-cell">{locale === 'zh' ? '当前没有可用的白名单工具。' : 'No allowlisted tools are available right now.'}</div> : null}
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
