import {
  buildSchedulerBucket,
  createNotificationEntry,
  createSchedulerTickEntry,
  getShanghaiTimeParts,
  matchesScopeFilter,
  resolveSchedulerPhase,
  trimAndSave,
} from '../shared.mjs';

const TICKS_FILE = 'scheduler-ticks.json';
const STATE_FILE = 'scheduler-state.json';
const NOTIFICATIONS_FILE = 'notifications.json';

export function createSchedulerRepository(store) {
  function filterByDate(items, since) {
    if (!since) return items;
    const sinceMs = Date.parse(since);
    if (!Number.isFinite(sinceMs)) return items;
    return items.filter((item) => {
      const valueMs = Date.parse(item.createdAt || '');
      return Number.isFinite(valueMs) && valueMs >= sinceMs;
    });
  }

  function sortByCreatedAtDesc(items) {
    return [...items].sort((left, right) => {
      const leftMs = Date.parse(left.createdAt || '');
      const rightMs = Date.parse(right.createdAt || '');
      if (!Number.isFinite(leftMs) && !Number.isFinite(rightMs)) return 0;
      if (!Number.isFinite(leftMs)) return 1;
      if (!Number.isFinite(rightMs)) return -1;
      return rightMs - leftMs;
    });
  }

  return {
    listSchedulerTicks(limit = 50, filter = {}) {
      const items = sortByCreatedAtDesc(
        filterByDate(store.readCollection(TICKS_FILE), filter.since)
          .filter((item) => matchesScopeFilter(item, filter))
          .filter((item) => !filter.phase || item.phase === filter.phase),
      );
      return items.slice(0, limit);
    },
    recordSchedulerTick(options = {}) {
      const worker = options.worker || 'quantpilot-worker';
      const now = options.createdAt ? new Date(options.createdAt) : new Date();
      const parts = getShanghaiTimeParts(now);
      const phase = options.phase || resolveSchedulerPhase(parts);
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
        id: options.id,
        phase,
        status: options.status || (phaseChanged ? 'phase-change' : 'steady'),
        title: options.title || (phaseChanged ? `Scheduler entered ${phase}` : `Scheduler tick ${phase}`),
        message: options.message || (
          phaseChanged
            ? `Scheduler moved into ${phase} window and background jobs can be routed accordingly.`
            : `Scheduler heartbeat recorded for the ${phase} window.`
        ),
        worker,
        createdAt: options.createdAt,
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
    },
  };
}
