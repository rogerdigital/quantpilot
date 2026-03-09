import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(packageDir, '..', '..', '..');
const runtimeRoot = join(repoRoot, '.quantpilot-runtime', 'control-plane');
const notificationsPath = join(runtimeRoot, 'notifications.json');
const outboxPath = join(runtimeRoot, 'notification-outbox.json');
const riskEventsPath = join(runtimeRoot, 'risk-events.json');
const riskScanOutboxPath = join(runtimeRoot, 'risk-scan-outbox.json');
const schedulerTicksPath = join(runtimeRoot, 'scheduler-ticks.json');
const schedulerStatePath = join(runtimeRoot, 'scheduler-state.json');
const auditRecordsPath = join(runtimeRoot, 'audit-records.json');
const cycleRecordsPath = join(runtimeRoot, 'cycle-records.json');
const operatorActionsPath = join(runtimeRoot, 'operator-actions.json');

function ensureRuntimeRoot() {
  mkdirSync(runtimeRoot, { recursive: true });
}

function readCollection(pathname) {
  ensureRuntimeRoot();
  if (!existsSync(pathname)) {
    return [];
  }
  try {
    const text = readFileSync(pathname, 'utf8');
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCollection(pathname, entries) {
  ensureRuntimeRoot();
  writeFileSync(pathname, JSON.stringify(entries, null, 2));
}

function readObject(pathname, fallback) {
  ensureRuntimeRoot();
  if (!existsSync(pathname)) {
    return fallback;
  }
  try {
    const text = readFileSync(pathname, 'utf8');
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeObject(pathname, value) {
  ensureRuntimeRoot();
  writeFileSync(pathname, JSON.stringify(value, null, 2));
}

function createNotificationEntry(event) {
  return {
    id: event.id || `notification-${randomUUID()}`,
    level: event.level || 'info',
    title: event.title || 'Notification',
    message: event.message || '',
    source: event.source || 'system',
    createdAt: event.createdAt || new Date().toISOString(),
    metadata: event.metadata || {},
  };
}

function createRiskEventEntry(event) {
  return {
    id: event.id || `risk-event-${randomUUID()}`,
    level: event.level || 'info',
    status: event.status || 'healthy',
    title: event.title || 'Risk Scan',
    message: event.message || '',
    cycle: Number(event.cycle || 0),
    riskLevel: event.riskLevel || 'NORMAL',
    source: event.source || 'risk-monitor',
    createdAt: event.createdAt || new Date().toISOString(),
    metadata: event.metadata || {},
  };
}

function createSchedulerTickEntry(event) {
  return {
    id: event.id || `scheduler-tick-${randomUUID()}`,
    phase: event.phase || 'OFF_HOURS',
    status: event.status || 'steady',
    title: event.title || 'Scheduler Tick',
    message: event.message || '',
    worker: event.worker || 'quantpilot-worker',
    createdAt: event.createdAt || new Date().toISOString(),
    metadata: event.metadata || {},
  };
}

function createAuditRecordEntry(record) {
  return {
    id: record.id || `audit-${randomUUID()}`,
    type: record.type || 'system',
    actor: record.actor || 'system',
    title: record.title || 'Untitled audit event',
    detail: record.detail || '',
    createdAt: record.createdAt || new Date().toISOString(),
    metadata: record.metadata || {},
  };
}

function createCycleRecordEntry(payload) {
  return {
    id: payload.id || `cycle-${randomUUID()}`,
    cycle: Number(payload.cycle || 0),
    mode: payload.mode || 'autopilot',
    riskLevel: payload.riskLevel || 'NORMAL',
    decisionSummary: payload.decisionSummary || '',
    marketClock: payload.marketClock || '',
    pendingApprovals: Number(payload.pendingApprovals || 0),
    liveIntentCount: Number(payload.liveIntentCount || 0),
    brokerConnected: Boolean(payload.brokerConnected),
    marketConnected: Boolean(payload.marketConnected),
    createdAt: payload.createdAt || new Date().toISOString(),
  };
}

function createOperatorActionEntry(payload) {
  return {
    id: payload.id || `action-${randomUUID()}`,
    type: payload.type || 'manual',
    symbol: payload.symbol || '',
    detail: payload.detail || '',
    actor: payload.actor || 'operator',
    title: payload.title || 'Operator action',
    level: payload.level || 'info',
    createdAt: payload.createdAt || new Date().toISOString(),
    metadata: payload.metadata || {},
  };
}

function getShanghaiTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const map = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  });
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    hour: Number(map.hour || 0),
    minute: Number(map.minute || 0),
    second: Number(map.second || 0),
  };
}

function resolveSchedulerPhase(parts) {
  const time = parts.hour * 60 + parts.minute;
  if (time >= 8 * 60 + 30 && time < 9 * 60 + 30) {
    return 'PRE_OPEN';
  }
  if (time >= 9 * 60 + 30 && time < 15 * 60) {
    return 'INTRADAY';
  }
  if (time >= 15 * 60 && time < 18 * 60) {
    return 'POST_CLOSE';
  }
  return 'OFF_HOURS';
}

function buildSchedulerBucket(parts) {
  const minuteBucket = String(Math.floor(parts.minute / 15) * 15).padStart(2, '0');
  return `${parts.date} ${String(parts.hour).padStart(2, '0')}:${minuteBucket}`;
}

export function listNotifications(limit = 50) {
  return readCollection(notificationsPath).slice(0, limit);
}

export function listAuditRecords(limit = 50) {
  return readCollection(auditRecordsPath).slice(0, limit);
}

export function appendAuditRecord(record) {
  const records = readCollection(auditRecordsPath);
  const entry = createAuditRecordEntry(record);
  records.unshift(entry);
  records.splice(100);
  writeCollection(auditRecordsPath, records);
  return entry;
}

export function listCycleRecords(limit = 30) {
  return readCollection(cycleRecordsPath).slice(0, limit);
}

export function appendCycleRecord(payload) {
  const cycles = readCollection(cycleRecordsPath);
  const entry = createCycleRecordEntry(payload);
  cycles.unshift(entry);
  cycles.splice(60);
  writeCollection(cycleRecordsPath, cycles);
  return entry;
}

export function listOperatorActions(limit = 50) {
  return readCollection(operatorActionsPath).slice(0, limit);
}

export function appendOperatorAction(payload) {
  const actions = readCollection(operatorActionsPath);
  const entry = createOperatorActionEntry(payload);
  actions.unshift(entry);
  actions.splice(100);
  writeCollection(operatorActionsPath, actions);
  return entry;
}

export function appendNotification(event) {
  const notifications = readCollection(notificationsPath);
  const entry = createNotificationEntry(event);
  notifications.unshift(entry);
  notifications.splice(100);
  writeCollection(notificationsPath, notifications);
  return entry;
}

export function enqueueNotification(event) {
  const jobs = readCollection(outboxPath);
  const job = {
    id: `notification-job-${randomUUID()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    payload: createNotificationEntry(event),
  };
  jobs.unshift(job);
  jobs.splice(200);
  writeCollection(outboxPath, jobs);
  return job;
}

export function listNotificationJobs(limit = 50) {
  return readCollection(outboxPath).slice(0, limit);
}

export function dispatchPendingNotifications(options = {}) {
  const worker = options.worker || 'quantpilot-worker';
  const limit = Number.isFinite(options.limit) ? options.limit : 20;
  const jobs = readCollection(outboxPath);
  const notifications = readCollection(notificationsPath);
  const dispatchedJobs = [];
  const pendingJobs = [];

  jobs.forEach((job) => {
    if (job.status !== 'pending' || dispatchedJobs.length >= limit) {
      pendingJobs.push(job);
      return;
    }
    const entry = {
      ...job.payload,
      dispatchedAt: new Date().toISOString(),
      dispatchedBy: worker,
    };
    notifications.unshift(entry);
    dispatchedJobs.push({
      ...job,
      status: 'dispatched',
      dispatchedAt: entry.dispatchedAt,
      dispatchedBy: worker,
      notificationId: entry.id,
    });
  });

  if (dispatchedJobs.length) {
    notifications.splice(100);
    writeCollection(notificationsPath, notifications);
    writeCollection(outboxPath, [...dispatchedJobs, ...pendingJobs].slice(0, 200));
  }

  return {
    worker,
    dispatchedCount: dispatchedJobs.length,
    dispatchedJobs,
  };
}

export function listRiskEvents(limit = 50) {
  return readCollection(riskEventsPath).slice(0, limit);
}

export function appendRiskEvent(event) {
  const events = readCollection(riskEventsPath);
  const entry = createRiskEventEntry(event);
  events.unshift(entry);
  events.splice(100);
  writeCollection(riskEventsPath, events);
  return entry;
}

export function enqueueRiskScan(payload) {
  const jobs = readCollection(riskScanOutboxPath);
  const job = {
    id: `risk-scan-job-${randomUUID()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    payload: {
      cycle: Number(payload.cycle || 0),
      mode: payload.mode || 'autopilot',
      riskLevel: payload.riskLevel || 'NORMAL',
      pendingApprovals: Number(payload.pendingApprovals || 0),
      brokerConnected: Boolean(payload.brokerConnected),
      marketConnected: Boolean(payload.marketConnected),
      paperExposure: Number(payload.paperExposure || 0),
      liveExposure: Number(payload.liveExposure || 0),
      routeHint: payload.routeHint || '',
      source: payload.source || 'state-runner',
      createdAt: payload.createdAt || new Date().toISOString(),
    },
  };
  jobs.unshift(job);
  jobs.splice(200);
  writeCollection(riskScanOutboxPath, jobs);
  return job;
}

export function listRiskScanJobs(limit = 50) {
  return readCollection(riskScanOutboxPath).slice(0, limit);
}

function buildRiskScanResult(payload) {
  if (payload.riskLevel === 'RISK OFF') {
    return {
      level: 'critical',
      status: 'risk-off',
      title: `Cycle ${payload.cycle} entered risk-off`,
      message: 'Risk guard triggered a defensive posture and reduced executable risk.',
      notify: true,
    };
  }
  if (payload.pendingApprovals > 0) {
    return {
      level: 'warn',
      status: 'approval-required',
      title: `Cycle ${payload.cycle} requires review`,
      message: `${payload.pendingApprovals} live actions remain behind the approval gate.`,
      notify: true,
    };
  }
  if (!payload.brokerConnected || !payload.marketConnected) {
    return {
      level: 'warn',
      status: 'connectivity-degraded',
      title: `Cycle ${payload.cycle} risk scan detected degraded inputs`,
      message: 'Broker or market connectivity is degraded, so downstream execution confidence is reduced.',
      notify: true,
    };
  }
  return {
    level: 'info',
    status: 'healthy',
    title: `Cycle ${payload.cycle} risk posture healthy`,
    message: 'Risk scan completed without a blocking condition.',
    notify: false,
  };
}

export function dispatchPendingRiskScans(options = {}) {
  const worker = options.worker || 'quantpilot-worker';
  const limit = Number.isFinite(options.limit) ? options.limit : 20;
  const jobs = readCollection(riskScanOutboxPath);
  const events = readCollection(riskEventsPath);
  const notifications = readCollection(notificationsPath);
  const dispatchedJobs = [];
  const pendingJobs = [];

  jobs.forEach((job) => {
    if (job.status !== 'pending' || dispatchedJobs.length >= limit) {
      pendingJobs.push(job);
      return;
    }

    const scan = buildRiskScanResult(job.payload);
    const event = createRiskEventEntry({
      ...scan,
      cycle: job.payload.cycle,
      riskLevel: job.payload.riskLevel,
      source: 'risk-monitor',
      metadata: {
        mode: job.payload.mode,
        pendingApprovals: job.payload.pendingApprovals,
        brokerConnected: job.payload.brokerConnected,
        marketConnected: job.payload.marketConnected,
        paperExposure: job.payload.paperExposure,
        liveExposure: job.payload.liveExposure,
        routeHint: job.payload.routeHint,
      },
    });
    event.dispatchedAt = new Date().toISOString();
    event.dispatchedBy = worker;
    events.unshift(event);

    if (scan.notify) {
      notifications.unshift(createNotificationEntry({
        level: scan.level,
        title: event.title,
        message: event.message,
        source: 'risk-monitor',
        metadata: {
          riskEventId: event.id,
          cycle: event.cycle,
          status: event.status,
        },
      }));
    }

    dispatchedJobs.push({
      ...job,
      status: 'dispatched',
      dispatchedAt: event.dispatchedAt,
      dispatchedBy: worker,
      riskEventId: event.id,
    });
  });

  if (dispatchedJobs.length) {
    events.splice(100);
    notifications.splice(100);
    writeCollection(riskEventsPath, events);
    writeCollection(notificationsPath, notifications);
    writeCollection(riskScanOutboxPath, [...dispatchedJobs, ...pendingJobs].slice(0, 200));
  }

  return {
    worker,
    dispatchedCount: dispatchedJobs.length,
    dispatchedJobs,
  };
}

export function listSchedulerTicks(limit = 50) {
  return readCollection(schedulerTicksPath).slice(0, limit);
}

export function recordSchedulerTick(options = {}) {
  const worker = options.worker || 'quantpilot-worker';
  const now = new Date();
  const parts = getShanghaiTimeParts(now);
  const phase = resolveSchedulerPhase(parts);
  const bucket = buildSchedulerBucket(parts);
  const state = readObject(schedulerStatePath, {
    lastPhase: '',
    lastBucket: '',
    lastTickAt: '',
  });

  if (state.lastPhase === phase && state.lastBucket === bucket) {
    return {
      worker,
      emitted: false,
      phase,
      tick: null,
    };
  }

  const phaseChanged = state.lastPhase !== phase;
  const tick = createSchedulerTickEntry({
    phase,
    status: phaseChanged ? 'phase-change' : 'steady',
    title: phaseChanged ? `Scheduler entered ${phase}` : `Scheduler tick ${phase}`,
    message: phaseChanged
      ? `Scheduler moved into ${phase} window and background jobs can be routed accordingly.`
      : `Scheduler heartbeat recorded for the ${phase} window.`,
    worker,
    metadata: {
      bucket,
      previousPhase: state.lastPhase || null,
    },
  });

  const ticks = readCollection(schedulerTicksPath);
  ticks.unshift(tick);
  ticks.splice(100);
  writeCollection(schedulerTicksPath, ticks);

  if (phaseChanged) {
    const notifications = readCollection(notificationsPath);
    notifications.unshift(createNotificationEntry({
      level: phase === 'OFF_HOURS' ? 'info' : 'warn',
      title: tick.title,
      message: tick.message,
      source: 'scheduler',
      metadata: {
        phase,
        previousPhase: state.lastPhase || null,
      },
    }));
    notifications.splice(100);
    writeCollection(notificationsPath, notifications);
  }

  writeObject(schedulerStatePath, {
    lastPhase: phase,
    lastBucket: bucket,
    lastTickAt: tick.createdAt,
  });

  return {
    worker,
    emitted: true,
    phase,
    tick,
  };
}
