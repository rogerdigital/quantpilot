import { randomUUID } from 'node:crypto';
import { createJsonFileStore } from '../../db/src/index.mjs';

const store = createJsonFileStore({ namespace: 'control-plane' });

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
  return store.readCollection('notifications.json').slice(0, limit);
}

export function listAuditRecords(limit = 50) {
  return store.readCollection('audit-records.json').slice(0, limit);
}

export function appendAuditRecord(record) {
  const records = store.readCollection('audit-records.json');
  const entry = createAuditRecordEntry(record);
  records.unshift(entry);
  records.splice(100);
  store.writeCollection('audit-records.json', records);
  return entry;
}

export function listCycleRecords(limit = 30) {
  return store.readCollection('cycle-records.json').slice(0, limit);
}

export function appendCycleRecord(payload) {
  const cycles = store.readCollection('cycle-records.json');
  const entry = createCycleRecordEntry(payload);
  cycles.unshift(entry);
  cycles.splice(60);
  store.writeCollection('cycle-records.json', cycles);
  return entry;
}

export function listOperatorActions(limit = 50) {
  return store.readCollection('operator-actions.json').slice(0, limit);
}

export function appendOperatorAction(payload) {
  const actions = store.readCollection('operator-actions.json');
  const entry = createOperatorActionEntry(payload);
  actions.unshift(entry);
  actions.splice(100);
  store.writeCollection('operator-actions.json', actions);
  return entry;
}

export function appendNotification(event) {
  const notifications = store.readCollection('notifications.json');
  const entry = createNotificationEntry(event);
  notifications.unshift(entry);
  notifications.splice(100);
  store.writeCollection('notifications.json', notifications);
  return entry;
}

export function enqueueNotification(event) {
  const jobs = store.readCollection('notification-outbox.json');
  const job = {
    id: `notification-job-${randomUUID()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    payload: createNotificationEntry(event),
  };
  jobs.unshift(job);
  jobs.splice(200);
  store.writeCollection('notification-outbox.json', jobs);
  return job;
}

export function listNotificationJobs(limit = 50) {
  return store.readCollection('notification-outbox.json').slice(0, limit);
}

export function dispatchPendingNotifications(options = {}) {
  const worker = options.worker || 'quantpilot-worker';
  const limit = Number.isFinite(options.limit) ? options.limit : 20;
  const jobs = store.readCollection('notification-outbox.json');
  const notifications = store.readCollection('notifications.json');
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
    store.writeCollection('notifications.json', notifications);
    store.writeCollection('notification-outbox.json', [...dispatchedJobs, ...pendingJobs].slice(0, 200));
  }

  return {
    worker,
    dispatchedCount: dispatchedJobs.length,
    dispatchedJobs,
  };
}

export function listRiskEvents(limit = 50) {
  return store.readCollection('risk-events.json').slice(0, limit);
}

export function appendRiskEvent(event) {
  const events = store.readCollection('risk-events.json');
  const entry = createRiskEventEntry(event);
  events.unshift(entry);
  events.splice(100);
  store.writeCollection('risk-events.json', events);
  return entry;
}

export function enqueueRiskScan(payload) {
  const jobs = store.readCollection('risk-scan-outbox.json');
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
  store.writeCollection('risk-scan-outbox.json', jobs);
  return job;
}

export function listRiskScanJobs(limit = 50) {
  return store.readCollection('risk-scan-outbox.json').slice(0, limit);
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
  const jobs = store.readCollection('risk-scan-outbox.json');
  const events = store.readCollection('risk-events.json');
  const notifications = store.readCollection('notifications.json');
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
    store.writeCollection('risk-events.json', events);
    store.writeCollection('notifications.json', notifications);
    store.writeCollection('risk-scan-outbox.json', [...dispatchedJobs, ...pendingJobs].slice(0, 200));
  }

  return {
    worker,
    dispatchedCount: dispatchedJobs.length,
    dispatchedJobs,
  };
}

export function listSchedulerTicks(limit = 50) {
  return store.readCollection('scheduler-ticks.json').slice(0, limit);
}

export function recordSchedulerTick(options = {}) {
  const worker = options.worker || 'quantpilot-worker';
  const now = new Date();
  const parts = getShanghaiTimeParts(now);
  const phase = resolveSchedulerPhase(parts);
  const bucket = buildSchedulerBucket(parts);
  const state = store.readObject('scheduler-state.json', {
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

  const ticks = store.readCollection('scheduler-ticks.json');
  ticks.unshift(tick);
  ticks.splice(100);
  store.writeCollection('scheduler-ticks.json', ticks);

  if (phaseChanged) {
    const notifications = store.readCollection('notifications.json');
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
    store.writeCollection('notifications.json', notifications);
  }

  store.writeObject('scheduler-state.json', {
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
