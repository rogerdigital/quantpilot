import {
  buildRiskScanResult,
  createNotificationEntry,
  createRiskEventEntry,
  matchesScopeFilter,
  trimAndSave,
} from '../shared.js';

const EVENTS_FILE = 'risk-events.json';
const OUTBOX_FILE = 'risk-scan-outbox.json';
const NOTIFICATIONS_FILE = 'notifications.json';

export function createRiskRepository(store) {
  return {
    listRiskEvents(limit = 50, filter = {}) {
      return store.readCollection(EVENTS_FILE)
        .filter((item) => matchesScopeFilter(item, filter))
        .slice(0, limit);
    },
    appendRiskEvent(event) {
      const events = store.readCollection(EVENTS_FILE);
      const entry = createRiskEventEntry(event);
      events.unshift(entry);
      trimAndSave(store, EVENTS_FILE, events, 100);
      return entry;
    },
    enqueueRiskScan(payload) {
      const jobs = store.readCollection(OUTBOX_FILE);
      const job = {
        id: `risk-scan-job-${payload.id || Date.now()}`,
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
      trimAndSave(store, OUTBOX_FILE, jobs, 200);
      return job;
    },
    listRiskScanJobs(limit = 50) {
      return store.readCollection(OUTBOX_FILE).slice(0, limit);
    },
    dispatchPendingRiskScans(options = {}) {
      const worker = options.worker || 'quantpilot-worker';
      const limit = Number.isFinite(options.limit) ? options.limit : 20;
      const jobs = store.readCollection(OUTBOX_FILE);
      const events = store.readCollection(EVENTS_FILE);
      const notifications = store.readCollection(NOTIFICATIONS_FILE);
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
        trimAndSave(store, EVENTS_FILE, events, 100);
        trimAndSave(store, NOTIFICATIONS_FILE, notifications, 100);
        store.writeCollection(OUTBOX_FILE, [...dispatchedJobs, ...pendingJobs].slice(0, 200));
      }

      return {
        worker,
        dispatchedCount: dispatchedJobs.length,
        dispatchedJobs,
      };
    },
  };
}
