import { useRef } from 'react';
import { useState } from 'react';
import {
  EmptyState,
  SectionHeader,
  TopMeta,
} from '../../components/layout/ConsoleChrome.tsx';
import { useTradingSystem } from '../../store/trading-system/TradingSystemProvider.tsx';
import { copy, useLocale } from '../console/console.i18n.tsx';
import { translateRiskLevel } from '../console/console.utils.ts';
import {
  agentActionBtn,
  agentActionBtnIcon,
  agentActionBtnLabel,
  agentActionBtnSub,
  agentActionButtons,
  agentChatAssistant,
  agentChatBody,
  agentChatComposer,
  agentChatComposerActions,
  agentChatMessage,
  agentChatMeta,
  agentChatMuted,
  agentChatSystem,
  agentChatTextarea,
  agentChatTranscript,
  agentChatUser,
  agentChatWarn,
  agentDialogueSection,
  agentDialogueStage,
  agentDualView,
  agentDualViewPanel,
  agentHandoffActions,
  agentHeroSub,
  agentHeroTitle,
  agentInsightCard,
  agentInsightHeader,
  agentInsightRail,
  agentNextStep,
  agentPageHero,
  agentPulseGrid,
  agentPulseItem,
  agentQuickChip,
  agentQuickChips,
  agentRationaleItem,
  agentRationaleList,
  agentRequestApprovalBtn,
  agentSendButton,
  agentStageHeader,
  agentStagePills,
  agentStepCard,
  agentStepCopy,
  agentStepStack,
  agentStepTop,
  agentStepper,
  agentStepperConnector,
  agentStepperDot,
  agentStepperDotActive,
  agentStepperDotDone,
  agentStepperItem,
  agentStepperLabel,
  agentStepperLabelActive,
  agentStepperLabelDone,
  agentSuggestionButton,
  agentSuggestionList,
  agentThesis,
  agentWarningItem,
} from './AgentPage.css.ts';
import { useAgentTools } from './useAgentTools.ts';

const promptSuggestions = {
  zh: [
    '帮我分析 AAPL 近期走势',
    '总结今天亏损原因',
    '给我一个更稳健的参数组合',
    '把回撤控制在 8% 内重算策略',
    '明天开盘前生成执行计划',
  ],
  en: [
    'Analyze recent AAPL price action',
    "Summarize today's loss drivers",
    'Suggest a more robust parameter set',
    'Recompute strategy with max drawdown capped at 8%',
    "Generate execution plan before tomorrow's open",
  ],
};

type StepperState = 'pending' | 'active' | 'done';

function AnalysisStepper({
  locale,
  running,
  sessionStatus,
  planStatus,
  analysisStatus,
}: {
  locale: 'zh' | 'en';
  running: boolean;
  sessionStatus: string;
  planStatus: string;
  analysisStatus: string;
}) {
  const intentDone = Boolean(sessionStatus && sessionStatus !== '');
  const planDone = planStatus === 'completed';
  const analysisDone = analysisStatus === 'completed';

  let intentState: StepperState = 'pending';
  let planState: StepperState = 'pending';
  let analysisState: StepperState = 'pending';

  if (running) {
    if (!intentDone) {
      intentState = 'active';
    } else if (!planDone) {
      intentState = 'done';
      planState = 'active';
    } else {
      intentState = 'done';
      planState = 'done';
      analysisState = 'active';
    }
  } else if (analysisDone) {
    intentState = 'done';
    planState = 'done';
    analysisState = 'done';
  } else if (planDone) {
    intentState = 'done';
    planState = 'done';
  } else if (intentDone) {
    intentState = 'done';
  }

  const steps: { key: string; label: { zh: string; en: string }; state: StepperState }[] = [
    { key: 'intent', label: { zh: '意图解析', en: 'Intent' }, state: intentState },
    { key: 'plan', label: { zh: '制定计划', en: 'Planning' }, state: planState },
    { key: 'analysis', label: { zh: 'AI 分析', en: 'Analysis' }, state: analysisState },
  ];

  return (
    <div className={agentStepper}>
      {steps.map((step, idx) => (
        <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: idx < steps.length - 1 ? 1 : 'initial' }}>
          <div className={agentStepperItem}>
            <div
              className={[
                agentStepperDot,
                step.state === 'active' ? agentStepperDotActive : '',
                step.state === 'done' ? agentStepperDotDone : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
            <span
              className={[
                agentStepperLabel,
                step.state === 'active' ? agentStepperLabelActive : '',
                step.state === 'done' ? agentStepperLabelDone : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {step.label[locale]}
            </span>
          </div>
          {idx < steps.length - 1 && <div className={agentStepperConnector} />}
        </div>
      ))}
    </div>
  );
}

function buildAgentConversation({
  locale,
  prompt,
  messages,
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
  messages: Array<{
    id: string;
    role: string;
    kind: string;
    title: string;
    body: string;
  }>;
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
  if (Array.isArray(messages) && messages.length) {
    return messages.map((message) => ({
      key: message.id,
      role: message.role === 'user' || message.role === 'assistant' ? message.role : 'system',
      label:
        message.role === 'user'
          ? locale === 'zh'
            ? '你'
            : 'You'
          : message.role === 'assistant'
            ? 'Agent'
            : locale === 'zh'
              ? '系统'
              : 'System',
      body: message.body || message.title,
      tone: message.kind === 'approval_note' ? 'warn' : 'default',
    }));
  }

  const fallbackMessages = [];

  if (sessionStatus) {
    fallbackMessages.push({
      key: 'system-session',
      role: 'system',
      label: locale === 'zh' ? '系统' : 'System',
      body:
        locale === 'zh'
          ? `会话状态：${sessionStatus}；intent：${intentKind || '--'}；plan：${planStatus || '--'}`
          : `Session: ${sessionStatus}; intent: ${intentKind || '--'}; plan: ${planStatus || '--'}`,
      tone: 'muted',
    });
  }

  if (prompt.trim()) {
    fallbackMessages.push({
      key: 'user-prompt',
      role: 'user',
      label: locale === 'zh' ? '你' : 'You',
      body: prompt.trim(),
      tone: 'default',
    });
  }

  if (running) {
    fallbackMessages.push({
      key: 'assistant-running',
      role: 'assistant',
      label: 'Agent',
      body:
        locale === 'zh'
          ? '正在解析意图、生成计划，并调用工具收集数据中…'
          : 'Parsing intent, building a plan, and gathering data with tools…',
      tone: 'muted',
    });
  }

  if (thesis || summary || rationale.length || warnings.length || recommendedNextStep || actionRequestSummary) {
    const body = [
      thesis || (locale === 'zh' ? '本轮分析已完成。' : 'Analysis complete.'),
      summary || null,
      rationale.length ? `${locale === 'zh' ? '分析依据' : 'Rationale'}: ${rationale.join(' ')}` : null,
      warnings.length ? `${locale === 'zh' ? '风险提示' : 'Warnings'}: ${warnings.join(' ')}` : null,
      recommendedNextStep ? `${locale === 'zh' ? '建议下一步' : 'Next step'}: ${recommendedNextStep}` : null,
      actionRequestSummary
        ? `${locale === 'zh' ? '审批请求' : 'Action request'}: ${actionRequestSummary} (${actionRequestStatus || '--'})`
        : null,
    ]
      .filter(Boolean)
      .join(' ');

    fallbackMessages.push({
      key: 'assistant-summary',
      role: 'assistant',
      label: 'Agent',
      body,
      tone: warnings.length ? 'warn' : 'default',
    });
  }

  if (error) {
    fallbackMessages.push({
      key: 'system-error',
      role: 'system',
      label: locale === 'zh' ? '提示' : 'Notice',
      body: error,
      tone: 'warn',
    });
  }

  return fallbackMessages;
}

export default function AgentPage() {
  const { state, session } = useTradingSystem();
  const { locale } = useLocale();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const {
    tools: _tools,
    workbench,
    sessionDetail,
    selectedSessionId,
    loading,
    running,
    requestingAction,
    error,
    selectSession,
    runPrompt,
    requestAction,
    refresh,
  } = useAgentTools();
  const [prompt, setPrompt] = useState('');

  const summary = workbench?.summary;
  const authorityState = workbench?.authorityState || null;
  const dailyBiasInstructions = Array.isArray(workbench?.dailyBias?.instructions)
    ? workbench.dailyBias.instructions
    : [];
  const latestExplanation = sessionDetail?.latestAnalysisRun?.explanation || null;
  const latestActionRequest = sessionDetail?.latestActionRequest || null;
  const recentSessions = Array.isArray(workbench?.queues.recentSessions)
    ? workbench?.queues.recentSessions
    : [];
  const latestRationale = Array.isArray(latestExplanation?.rationale)
    ? latestExplanation.rationale
    : [];
  const latestWarnings = Array.isArray(latestExplanation?.warnings)
    ? latestExplanation.warnings
    : [];
  const planSteps = Array.isArray(sessionDetail?.latestPlan?.steps)
    ? sessionDetail.latestPlan.steps
    : [];
  const evidence = Array.isArray(sessionDetail?.latestAnalysisRun?.evidence)
    ? sessionDetail.latestAnalysisRun.evidence
    : [];

  const conversation = buildAgentConversation({
    locale,
    prompt,
    messages: Array.isArray(sessionDetail?.messages) ? sessionDetail.messages : [],
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
    sessionDetail?.session.id &&
      sessionDetail?.latestPlan?.requiresApproval &&
      sessionDetail?.latestPlan?.status === 'completed' &&
      sessionDetail?.latestAnalysisRun?.status === 'completed' &&
      latestActionRequest?.status !== 'pending_review'
  );

  const hasAnalysis = Boolean(latestExplanation?.thesis);

  const submitPrompt = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    const result = await runPrompt(trimmed, session?.user.id);
    if (result?.session?.prompt) {
      setPrompt('');
    }
    // scroll transcript to bottom
    requestAnimationFrame(() => {
      if (transcriptRef.current) {
        transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
      }
    });
  };

  const submitActionRequest = async () => {
    await requestAction(session?.user.id);
  };

  const chatRoleClass: Record<string, string> = {
    user: agentChatUser,
    assistant: agentChatAssistant,
    system: agentChatSystem,
  };
  const chatToneClass: Record<string, string> = { muted: agentChatMuted, warn: agentChatWarn };

  return (
    <>
      <SectionHeader routeKey="agent" />
      <TopMeta
        items={[
          { label: copy[locale].labels.marketClock, value: state.marketClock },
          {
            label: copy[locale].terms.riskLevel,
            value: translateRiskLevel(locale, state.riskLevel),
            accent: true,
          },
          {
            label: locale === 'zh' ? '活跃会话' : 'Active Sessions',
            value: String(summary?.runningSessions ?? 0),
          },
          {
            label: locale === 'zh' ? '待审批' : 'Pending',
            value: String(summary?.pendingActionRequests ?? 0),
          },
        ]}
      />

      {/* Hero */}
      <div className={agentPageHero}>
        <div>
          <div className={agentHeroTitle}>
            {locale === 'zh' ? 'AI 投研助手' : 'AI Research Assistant'}
          </div>
          <div className={agentHeroSub}>
            {locale === 'zh'
              ? '用自然语言描述你的交易想法，Agent 负责分析、制定计划、并提供可执行建议。'
              : 'Describe your trading idea in plain language. Agent analyzes, plans, and delivers actionable insights.'}
          </div>
        </div>

        {/* Quick prompt chips */}
        <div className={agentQuickChips}>
          {promptSuggestions[locale].map((item) => (
            <button
              key={item}
              type="button"
              className={agentQuickChip}
              onClick={() => setPrompt(item)}
              disabled={running}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis stepper */}
      <AnalysisStepper
        locale={locale}
        running={running}
        sessionStatus={sessionDetail?.session.status || ''}
        planStatus={sessionDetail?.latestPlan?.status || ''}
        analysisStatus={sessionDetail?.latestAnalysisRun?.status || ''}
      />

      {/* Dual-panel main area */}
      <section className={agentDialogueSection}>
        <article className={`panel ${agentDualViewPanel}`}>
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? '对话工作台' : 'Agent Workspace'}
              </div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '左侧保持连续对话，右侧展示当前会话的洞察卡、计划步骤和操作入口。'
                  : 'Continuous conversation on the left; session insight, plan steps, and actions on the right.'}
              </div>
            </div>
            <div className={`panel-badge ${running ? 'badge-warn' : 'badge-info'}`}>
              {running ? (locale === 'zh' ? '运行中' : 'RUNNING') : locale === 'zh' ? '就绪' : 'READY'}
            </div>
          </div>

          <div className={agentDualView}>
            {/* Left: chat */}
            <div className={agentDialogueStage}>
              <div className={agentStageHeader}>
                <div>
                  <div className="card-eyebrow">
                    {locale === 'zh' ? '对话记录' : 'Conversation'}
                  </div>
                  <div className="mini-copy" style={{ marginTop: '2px' }}>
                    {locale === 'zh'
                      ? '每次请求、规划、工具调用和分析结果都沉淀在此。'
                      : 'Every request, plan, tool call, and analysis result is recorded here.'}
                  </div>
                </div>
                <div className={agentStagePills}>
                  <span className="settings-chip">
                    {sessionDetail?.session.status || (locale === 'zh' ? '无会话' : 'No session')}
                  </span>
                  {sessionDetail?.session.latestIntent.kind && (
                    <span className="settings-chip">
                      {sessionDetail.session.latestIntent.kind}
                    </span>
                  )}
                </div>
              </div>

              <div className={agentChatTranscript} ref={transcriptRef}>
                {!conversation.length && (
                  <EmptyState
                    icon="💬"
                    message={
                      locale === 'zh'
                        ? '还没有消息，选择一个快捷建议或直接输入。'
                        : 'No messages yet. Pick a suggestion or type below.'
                    }
                  />
                )}
                {conversation.map((message) => (
                  <div
                    className={[
                      agentChatMessage,
                      chatRoleClass[message.role],
                      chatToneClass[message.tone as keyof typeof chatToneClass],
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    key={message.key}
                  >
                    <div className={agentChatMeta}>
                      <span>{message.label}</span>
                      <span>{message.role.toUpperCase()}</span>
                    </div>
                    <div className={agentChatBody}>{message.body}</div>
                  </div>
                ))}
              </div>

              {/* Composer */}
              <div className={agentChatComposer}>
                <textarea
                  id="agent-prompt-input"
                  className={agentChatTextarea}
                  placeholder={
                    locale === 'zh'
                      ? '输入你的交易想法或问题，按发送让 Agent 分析…'
                      : 'Describe your trading idea or question, then send to Agent…'
                  }
                  value={prompt}
                  rows={2}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      submitPrompt();
                    }
                  }}
                />
                <div className={agentChatComposerActions}>
                  <span className="status-copy" style={{ fontSize: '11px' }}>
                    {locale === 'zh' ? '⌘Enter 发送' : '⌘Enter to send'}
                  </span>
                  <button
                    type="button"
                    className={agentSendButton}
                    onClick={submitPrompt}
                    disabled={running || !prompt.trim()}
                  >
                    {running
                      ? locale === 'zh' ? '分析中…' : 'Analyzing…'
                      : locale === 'zh' ? '发送并分析' : 'Send & Analyze'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: insight rail */}
            <aside className={agentInsightRail}>
              {/* ── Analysis Insight Card ── */}
              <div className={agentInsightCard}>
                <div className={agentInsightHeader}>
                  <div className="card-eyebrow">
                    {locale === 'zh' ? '分析洞察' : 'Analysis Insight'}
                  </div>
                  <span className={`panel-badge ${hasAnalysis ? 'badge-info' : ''}`}>
                    {hasAnalysis
                      ? locale === 'zh' ? '已完成' : 'DONE'
                      : locale === 'zh' ? '等待中' : 'PENDING'}
                  </span>
                </div>

                {hasAnalysis ? (
                  <>
                    <div className={agentThesis}>{latestExplanation!.thesis}</div>

                    {latestRationale.length > 0 && (
                      <div>
                        <div style={{ font: '600 11px/1 var(--font-data)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
                          {locale === 'zh' ? '分析依据' : 'Rationale'}
                        </div>
                        <ul className={agentRationaleList}>
                          {latestRationale.map((item, idx) => (
                            <li key={idx} className={agentRationaleItem}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {latestWarnings.length > 0 && (
                      <div style={{ display: 'grid', gap: '6px' }}>
                        {latestWarnings.map((w, idx) => (
                          <div key={idx} className={agentWarningItem}>{w}</div>
                        ))}
                      </div>
                    )}

                    {latestExplanation?.recommendedNextStep && (
                      <div>
                        <div style={{ font: '600 11px/1 var(--font-data)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
                          {locale === 'zh' ? '建议下一步' : 'Recommended Next Step'}
                        </div>
                        <div className={agentNextStep}>{latestExplanation.recommendedNextStep}</div>
                      </div>
                    )}

                    {/* Action buttons: Paper / Live / Backtest */}
                    <div>
                      <div style={{ font: '600 11px/1 var(--font-data)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
                        {locale === 'zh' ? '快速操作' : 'Quick Actions'}
                      </div>
                      <div className={agentActionButtons}>
                        <button
                          type="button"
                          className={agentActionBtn}
                          onClick={submitActionRequest}
                          disabled={!canRequestAction || requestingAction}
                          title={locale === 'zh' ? '模拟交易（不需要审批）' : 'Paper trade (no approval needed)'}
                        >
                          <span className={agentActionBtnIcon}>📄</span>
                          <span className={agentActionBtnLabel}>Paper</span>
                          <span className={agentActionBtnSub}>{locale === 'zh' ? '模拟' : 'Simulate'}</span>
                        </button>
                        <button
                          type="button"
                          className={agentActionBtn}
                          onClick={submitActionRequest}
                          disabled={!canRequestAction || requestingAction}
                          title={locale === 'zh' ? '实盘交易（需人工审批）' : 'Live trade (requires approval)'}
                        >
                          <span className={agentActionBtnIcon}>⚡</span>
                          <span className={agentActionBtnLabel}>Live</span>
                          <span className={agentActionBtnSub}>{locale === 'zh' ? '实盘' : 'Real'}</span>
                        </button>
                        <button
                          type="button"
                          className={agentActionBtn}
                          disabled={running}
                          title={locale === 'zh' ? '运行历史回测' : 'Run backtest'}
                          onClick={() => {
                            setPrompt(locale === 'zh' ? '运行一次历史回测' : 'Run a historical backtest');
                          }}
                        >
                          <span className={agentActionBtnIcon}>📊</span>
                          <span className={agentActionBtnLabel}>Backtest</span>
                          <span className={agentActionBtnSub}>{locale === 'zh' ? '回测' : 'History'}</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon="🤖"
                    message={
                      locale === 'zh'
                        ? '向 Agent 提问后，洞察卡将展示分析结论、依据和可操作建议。'
                        : 'Ask Agent a question — the insight card will show analysis conclusion, rationale, and actionable suggestions.'
                    }
                  />
                )}
              </div>

              {/* ── Session Pulse ── */}
              <div className={agentInsightCard}>
                <div className={agentInsightHeader}>
                  <div className="card-eyebrow">
                    {locale === 'zh' ? '会话状态' : 'Session Pulse'}
                  </div>
                  <span className={`panel-badge ${canRequestAction ? 'badge-warn' : 'badge-info'}`}>
                    {canRequestAction
                      ? locale === 'zh' ? '可审批' : 'APPROVABLE'
                      : locale === 'zh' ? '跟进中' : 'IN FLIGHT'}
                  </span>
                </div>
                <div className={agentPulseGrid}>
                  <div className={agentPulseItem}>
                    <span>{locale === 'zh' ? '会话' : 'Session'}</span>
                    <strong>{sessionDetail?.session.status || '--'}</strong>
                  </div>
                  <div className={agentPulseItem}>
                    <span>Intent</span>
                    <strong>{sessionDetail?.session.latestIntent.kind || '--'}</strong>
                  </div>
                  <div className={agentPulseItem}>
                    <span>Plan</span>
                    <strong>{sessionDetail?.latestPlan?.status || '--'}</strong>
                  </div>
                  <div className={agentPulseItem}>
                    <span>Analysis</span>
                    <strong>{sessionDetail?.latestAnalysisRun?.status || '--'}</strong>
                  </div>
                </div>
              </div>

              {/* ── Plan Steps ── */}
              {planSteps.length > 0 && (
                <div className={agentInsightCard}>
                  <div className="card-eyebrow">
                    {locale === 'zh' ? '执行步骤' : 'Plan Steps'}
                  </div>
                  <div className={agentStepStack}>
                    {planSteps.slice(0, 5).map((step) => (
                      <div className={agentStepCard} key={step.id}>
                        <div className={agentStepTop}>
                          <strong>{step.title}</strong>
                          <span>{step.status || '--'}</span>
                        </div>
                        <div className={agentStepCopy}>
                          {step.outputSummary || step.description || step.toolName || '--'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Evidence ── */}
              {evidence.length > 0 && (
                <div className={agentInsightCard}>
                  <div className="card-eyebrow">
                    {locale === 'zh' ? '数据证据' : 'Evidence'}
                  </div>
                  <div className={agentStepStack}>
                    {evidence.slice(0, 3).map((item) => (
                      <div className={agentStepCard} key={item.id}>
                        <div className={agentStepTop}>
                          <strong>{item.title}</strong>
                          <span>{item.source}</span>
                        </div>
                        <div className={agentStepCopy}>{item.summary}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Controlled Handoff ── */}
              <div className={agentInsightCard}>
                <div className={agentInsightHeader}>
                  <div className="card-eyebrow">
                    {locale === 'zh' ? '受控交接' : 'Controlled Handoff'}
                  </div>
                  <span className="settings-chip">{latestActionRequest?.status || '--'}</span>
                </div>
                <div className={agentHandoffActions}>
                  <button
                    type="button"
                    className={agentRequestApprovalBtn}
                    onClick={submitActionRequest}
                    disabled={!canRequestAction || requestingAction}
                  >
                    {requestingAction
                      ? locale === 'zh' ? '提交中…' : 'Submitting…'
                      : locale === 'zh' ? '提交审批请求' : 'Request Approval'}
                  </button>
                  <div className="mini-copy" style={{ fontSize: '12px' }}>
                    {latestActionRequest?.status === 'pending_review'
                      ? locale === 'zh'
                        ? '已有待审批的请求。请前往执行页面处理。'
                        : 'A pending action request is waiting. Go to Execution to review.'
                      : locale === 'zh'
                        ? '分析完成后可将建议提交为正式审批请求。'
                        : 'After analysis completes, submit the suggestion as a formal approval request.'}
                  </div>
                </div>
              </div>

              {/* ── Prompt Suggestions ── */}
              <div className={agentInsightCard}>
                <div className={agentInsightHeader}>
                  <div className="card-eyebrow">
                    {locale === 'zh' ? '快捷建议' : 'Quick Prompts'}
                  </div>
                </div>
                <div className={agentSuggestionList}>
                  {promptSuggestions[locale].map((item) => (
                    <button
                      type="button"
                      className={agentSuggestionButton}
                      key={item}
                      onClick={() => setPrompt(item)}
                      disabled={running}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </article>
      </section>

      {/* Governance section */}
      <section className="panel-grid panel-grid-wide" id="agent-governance" style={{ marginTop: '24px' }}>
        <article className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {locale === 'zh' ? 'Agent 治理' : 'Agent Governance'}
              </div>
              <div className="panel-copy">
                {locale === 'zh'
                  ? '当前 Agent 授权模式与今日运营偏置指令。'
                  : 'Current agent authority mode and active daily bias instructions.'}
              </div>
            </div>
            <span className={`panel-badge ${authorityState?.mode === 'stopped' ? 'badge-warn' : 'badge-info'}`}>
              {authorityState?.mode || 'manual_only'}
            </span>
          </div>
          <div className="focus-list">
            <div className="focus-row">
              <div className="symbol-cell">
                <strong>Authority Mode</strong>
                <span>
                  {authorityState?.reason ||
                    (locale === 'zh' ? '尚未配置治理策略。' : 'No governance policy configured.')}
                </span>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '模式' : 'Mode'}</span>
                <strong>{authorityState?.mode || 'manual_only'}</strong>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '策略数' : 'Policies'}</span>
                <strong>{authorityState?.policies?.length ?? 0}</strong>
              </div>
            </div>
            <div className="focus-row">
              <div className="symbol-cell">
                <strong>Daily Bias</strong>
                <span>
                  {dailyBiasInstructions.length
                    ? locale === 'zh'
                      ? `${dailyBiasInstructions.length} 条活跃指令正在影响本次会话。`
                      : `${dailyBiasInstructions.length} active instruction${dailyBiasInstructions.length > 1 ? 's' : ''} affecting this session.`
                    : locale === 'zh'
                      ? '当前没有活跃的今日运营指令。'
                      : 'No active daily bias instructions.'}
                </span>
              </div>
              <div className="focus-metric">
                <span>{locale === 'zh' ? '条数' : 'Count'}</span>
                <strong>{dailyBiasInstructions.length}</strong>
              </div>
            </div>
            {dailyBiasInstructions.map((item) => (
              <div className="focus-row" key={item.id}>
                <div className="symbol-cell">
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </div>
                <div className="focus-metric">
                  <span>{locale === 'zh' ? '有效至' : 'Active Until'}</span>
                  <strong>{item.activeUntil ? item.activeUntil.slice(0, 10) : '--'}</strong>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Recent sessions */}
      <section className="panel-grid-wide panel-grid" id="agent-sessions" style={{ marginTop: '24px' }}>
        <article className="panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-head">
            <div className="panel-title">
              {locale === 'zh' ? '最近会话' : 'Recent Sessions'}
            </div>
            <button
              type="button"
              className="inline-link"
              onClick={() => refresh()}
              disabled={loading || running}
            >
              {loading ? (locale === 'zh' ? '刷新中…' : 'Refreshing…') : locale === 'zh' ? '刷新' : 'Refresh'}
            </button>
          </div>
          <div className="focus-list focus-list-terminal panel-body panel-body-md">
            {loading && !recentSessions.length && (
              <EmptyState message={locale === 'zh' ? '正在加载…' : 'Loading…'} />
            )}
            {!loading && !recentSessions.length && (
              <EmptyState
                icon="🤖"
                message={locale === 'zh' ? '暂无会话记录。' : 'No agent sessions recorded yet.'}
              />
            )}
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
                  <button
                    type="button"
                    className="inline-link"
                    onClick={() => selectSession(String(item.id || ''))}
                  >
                    {selectedSessionId === String(item.id || '')
                      ? locale === 'zh' ? '已选中' : 'Selected'
                      : locale === 'zh' ? '查看' : 'Open'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
