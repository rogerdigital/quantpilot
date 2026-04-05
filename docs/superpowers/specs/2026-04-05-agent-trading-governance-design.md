# QuantPilot Agent Trading Governance Design

## Summary

QuantPilot's current Agent capability is a controlled analysis and handoff workbench. It can parse prompts, create analysis plans, run allowlisted read-only tools, generate structured explanations, and submit approval-bound action requests. That is a solid operator-assist foundation, but it does not yet satisfy the intended product direction: a continuously operating trading Agent that can analyze, filter, buy, sell, summarize, and collaborate with the operator through chat while staying inside explicit execution authority boundaries.

This design upgrades Agent from a "prompt -> explanation -> approval request" flow into a governed trading-agent system with six coordinated capabilities:

1. `Agent Chat`
2. `Agent Memory`
3. `Agent Runtime`
4. `Agent Decision Engine`
5. `Agent Authority Guard`
6. `Agent Review & Summary`

The target system remains human-centered and risk-gated. `paper` and `live` environments may both support automatic execution, but every action must pass a policy layer that combines account scope, strategy scope, action type, capital limits, position limits, risk state, and degradation state. The operator can continuously interact with the Agent through chat, and those interactions can shape the current trading day through temporary operating bias without silently mutating long-lived strategy definitions.

## Problem Statement

The current Agent module is not aligned with the desired operating model.

Today it is good at:

- Prompt-driven read-only analysis
- Session / intent / plan / analysis persistence
- Controlled action handoff into approval workflows
- Explanation and audit trail visibility

Today it is not good at:

- Running autonomously on a daily cadence
- Reacting to market events or operator updates as first-class triggers
- Managing account, strategy, and action permissions for auto execution
- Treating chat input as durable operator guidance for the current day
- Producing full-cycle outputs like pre-market briefs, intraday decisions, and post-market recaps
- Operating as a real trading copilot that can move from analysis to governed action

The result is that Agent currently behaves like a structured analysis assistant, not a governed trading teammate.

## Product Goal

The desired Agent should support the following operating loop:

`operator chat / new information -> agent context update -> scheduled or event-driven run -> analysis -> candidate filtering -> action decision -> authority evaluation -> execution or ask-first handoff -> risk monitoring -> daily summary -> next-step planning`

The system must support:

- Continuous operator chat
- Temporary same-day directional guidance
- Event-triggered follow-up analysis
- Daily autonomous operation
- Controlled auto-trading in both `paper` and `live`
- Explicit authority limits
- Automatic downgrade and shutdown protection

## Core Design Principles

### 1. Governed Autonomy

The Agent is allowed to act, but only inside explicit, inspectable policy. Autonomy is granted, bounded, degraded, or revoked by system policy rather than by hidden prompt behavior.

### 2. Chat Shapes The Day, Not The Strategy Definition

Chat messages may change current-day posture, focus, and constraints, but they must not directly rewrite long-lived strategy parameters. Long-term strategy changes continue to require explicit strategy-level flows.

### 3. Runtime Is Mixed-Triggered

Agent operation uses both:

- schedule-driven runs for pre-market, intraday, and post-market work
- event-driven runs for volatility, risk alerts, operator input, and execution state changes

### 4. Default To The Most Restrictive Effective Permission

Execution authority is resolved across:

- account-level policy
- strategy-level policy
- action-type policy

The most restrictive result wins.

### 5. Sell-Side Automation Can Be Easier Than Buy-Side Automation

By default, reducing or closing risk may be more automatable than opening or increasing exposure. The system should treat `trim`, `exit`, `cancel`, and `risk_reduce` differently from `enter` and `add`.

### 6. Degrade Before Disaster

Light anomalies should trigger authority downgrades. Severe anomalies should trigger automatic shutdown. Recovery must be explicit and visible.

## Target Capability Model

## 1. Agent Chat

### Purpose

Provide a continuous collaboration channel between operator and Agent.

### Responsibilities

- Accept free-form operator chat
- Distinguish message intent
- Route messages into the right context layer
- Preserve conversation history as part of trading context

### Supported chat classes

- `conversation`
  General reasoning, questions, explanation, and review
- `daily_bias`
  Current-day posture changes such as "be more conservative today"
- `market_intel`
  External information such as earnings notes, macro headlines, or discretionary observations
- `watch_focus`
  Focus instructions such as "watch NVDA and US Treasuries today"
- `strategy_change_request`
  Longer-lived strategy-change proposals, not auto-applied

### Guardrails

- Chat may produce same-day operational bias
- Chat may not silently alter durable strategy configuration
- Changes that would persist beyond the current operating window must go through governed approval paths

## 2. Agent Memory

### Purpose

Maintain usable trading context across sessions and throughout the day.

### Memory layers

- `long_term_preferences`
  Persistent operator preferences and standing guidance
- `daily_operating_bias`
  Same-day temporary guidance
- `event_context`
  Temporary information linked to a session, market event, or account state
- `recent_lessons`
  Short rolling recap of recent errors, risk incidents, and operator overrides

### Examples

- Long-term:
  "Prefer lower turnover strategies in live accounts."
- Daily:
  "Today bias conservative due to payrolls event."
- Event:
  "Operator says avoid new semiconductor exposure before earnings."
- Recent lesson:
  "Recent momentum entries had poor follow-through after gap-up opens."

### Constraints

- Daily bias expires automatically
- Event context expires or is archived when no longer relevant
- Long-term memory must be explicit and inspectable

## 3. Agent Runtime

### Purpose

Run Agent workflows on both schedule and event triggers.

### Scheduled phases

- `pre_market`
  Build watchlists, daily brief, and candidate plan
- `intraday_monitor`
  Check positions, risks, and pending actions
- `post_market`
  Produce recap, attribution, and next-day preparation

### Event-driven phases

- `operator_update`
  Operator sends chat input or new information
- `risk_event`
  Control-plane risk or scheduler attention event
- `execution_event`
  Fill, reject, reconcile, cancel, or exception updates
- `market_event`
  Price/volatility regime shift, provider flag, or symbol-specific alert

### Runtime outputs

- daily brief
- refreshed action decisions
- authority evaluation result
- action queue or ask-first prompt
- daily recap

## 4. Agent Decision Engine

### Purpose

Convert research, market, execution, risk, and chat context into structured trading actions.

### Inputs

- strategy catalog and research state
- backtest summary and run quality
- current positions and execution plan state
- risk events and current risk posture
- monitoring and broker health
- daily bias and market intelligence from chat

### Decision outputs

- `watch`
- `hold`
- `enter`
- `add`
- `trim`
- `exit`
- `cancel`
- `rebalance`

### Each decision must include

- decision type
- target account
- target strategy
- target symbol or plan
- confidence
- rationale
- risk note
- capital suggestion
- position-size suggestion
- execution urgency
- authority requirement

## 5. Agent Authority Guard

### Purpose

Determine whether a proposed Agent action may execute automatically, must ask first, or is forbidden.

### Policy dimensions

- account
- strategy
- action type

### Effective authority levels

- `full_auto`
  Agent may execute directly
- `bounded_auto`
  Agent may execute directly only inside explicit limits
- `ask_first`
  Agent must ask the operator before execution
- `manual_only`
  Agent may not execute automatically

### Supported environments

- `paper`
- `live`

Both environments may use automatic execution. Environment alone does not decide authority. Policy decides authority.

### Policy constraints

- single-action notional cap
- single-action percentage-of-equity cap
- strategy-level exposure cap
- daily automatic execution count cap
- daily PnL drawdown threshold
- rolling max drawdown threshold
- market- or broker-health override

### Resolution order

1. Resolve account policy
2. Resolve strategy policy
3. Resolve action-type policy
4. Take the most restrictive result
5. Apply risk-state downgrade
6. Apply anomaly-state downgrade

### Action defaults

By default:

- `trim`
- `exit`
- `cancel`
- `risk_reduce`

should be easier to automate than:

- `enter`
- `add`
- `rebalance_into_more_risk`

## 6. Agent Review & Summary

### Purpose

Give the operator reliable outputs at the right moments.

### Required artifacts

- `pre_market_brief`
  What matters today, what the Agent plans to watch, and what actions are likely
- `intraday_action_log`
  What the Agent observed, proposed, executed, or deferred
- `post_market_recap`
  What worked, what failed, and what should change tomorrow
- `authority_events`
  Downgrades, ask-first interceptions, blocked actions, and shutdown triggers

### Operator UX expectations

The operator should always be able to see:

- today's operating bias
- current authority mode
- recent actions and decisions
- pending ask-first requests
- reason for any downgrade or stop state

## Functional Delta Against Current System

### What exists today

- Agent sessions, intents, plans, analysis runs, and action requests
- Agent workbench aggregation
- read-only allowlisted tool execution
- approval-controlled handoff
- audit trail and timeline linkage

### What is missing

- authority policy model
- daily bias model
- market-intel operator input model
- scheduled Agent daily runs
- structured daily brief / recap objects
- event-driven follow-up runs
- direct authority evaluation for candidate actions
- automatic degrade / shutdown state machine
- position-level continuous operation model

## Required New Domain Objects

The following new objects should be introduced as formal first-class contracts.

### `agent_policy`

Defines execution authority by:

- account
- strategy
- action type
- environment
- capital and exposure limits
- downgrade thresholds

### `agent_instruction`

Captures operator input that affects current-day Agent behavior.

Types:

- daily_bias
- market_intel
- watch_focus
- discretionary_note

### `agent_daily_run`

Represents a scheduled or event-triggered Agent operating cycle.

Types:

- pre_market
- intraday_monitor
- post_market
- operator_update
- risk_event
- execution_event
- market_event

### `agent_daily_brief`

Structured pre-market output.

### `agent_post_market_recap`

Structured end-of-day output.

### `agent_authority_event`

Records downgrade, escalation, shutdown, and recovery events.

## UI Implications

The current Agent page should evolve from a workbench into a trading-operations cockpit.

### Primary surfaces

- chat thread
- today's operating bias
- today's brief
- current authority state
- pending ask-first actions
- recent automated actions
- downgrade / shutdown banner
- post-market summary

### Settings / governance surfaces

Settings should gain an `Agent Governance` area with:

- account-level authority rules
- strategy-level authority rules
- action-level authority rules
- paper/live environment rules
- caps, thresholds, and downgrade settings
- recovery controls after shutdown

### Notifications / operations surfaces

Operations and notifications should surface:

- daily brief availability
- authority downgrade events
- blocked or escalated actions
- automated execution summaries
- recap publication events

## Risk & Safety Model

### Downgrade policy

System behavior should follow graded responses:

- light anomaly:
  downgrade from `full_auto` to `ask_first`
- medium anomaly:
  downgrade from `bounded_auto` to `manual_only`
- severe anomaly:
  trigger shutdown and require explicit operator restore

### Severe anomaly examples

- repeated broker rejects
- risk-off state
- major broker-health degradation
- authority policy breach
- daily drawdown breach
- repeated execution exceptions

### Recovery

Recovery must be explicit and visible. Auto recovery is not allowed for severe states.

## Recommended Delivery Order

### P0

Build the governance skeleton.

- formalize `agent_policy`
- formalize `agent_instruction`
- add `daily_bias` handling through chat
- add mixed-trigger runtime scaffold
- expose authority state in UI
- introduce downgrade / stop state machine

### P1

Build the first real daily operating loop.

- pre-market brief
- intraday monitoring run
- post-market recap
- action decisions for `trim / exit / cancel / risk_reduce`
- operator ask-first queue

### P2

Expand to deeper autonomy.

- bounded `enter / add`
- richer cross-account and cross-strategy coordination
- stronger memory
- better event-triggered operating behavior

## Out Of Scope For This Phase

- silent long-term strategy mutation via chat
- unrestricted live auto-trading
- fully autonomous self-modifying strategy generation
- removing approval and risk boundaries from the system

## Success Criteria

The design is successful when:

- the Agent can run every day without manual prompt entry
- operator chat can shape same-day behavior without mutating long-term strategy config
- paper and live can both support automation, but only via explicit policy
- every candidate action resolves through a visible authority decision
- sell-side risk-reduction actions can be more automatable than buy-side expansion actions
- degradation and shutdown states are explicit, testable, and visible in UI
- the operator receives a daily brief, action trace, and recap

