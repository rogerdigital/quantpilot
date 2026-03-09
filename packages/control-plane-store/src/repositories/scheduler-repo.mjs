import {
  buildSchedulerBucket,
  createNotificationEntry,
  createSchedulerTickEntry,
  getShanghaiTimeParts,
  resolveSchedulerPhase,
  trimAndSave,
} from '../shared.mjs';
import { controlPlaneStore as store } from '../store.mjs';

const TICKS_FILE = 'scheduler-ticks.json';
const STATE_FILE = 'scheduler-state.json';
const NOTIFICATIONS_FILE = 'notifications.json';

export function listSchedulerTicks(limit = 50) {
  return store.readCollection(TICKS_FILE).slice(0, limit);
}

export function recordSchedulerTick(options = {}) {
  const worker = options.worker || 'quantpilot-worker';
  const now = new Date();
  const parts = getShanghaiTimeParts(now);
  const phase = resolveSchedulerPhase(parts);
  const bucket = buildSchedulerBucket(parts);
  const state = store.readObject(STATE_FILE, {
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

  const ticks = store.readCollection(TICKS_FILE);
  ticks.unshift(tick);
  trimAndSave(store, TICKS_FILE, ticks, 100);

  if (phaseChanged) {
    const notifications = store.readCollection(NOTIFICATIONS_FILE);
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
    trimAndSave(store, NOTIFICATIONS_FILE, notifications, 100);
  }

  store.writeObject(STATE_FILE, {
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
