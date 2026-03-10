import { runtimeConfig } from '../../../app/config/runtime.ts';
import { DEFAULT_ENGINE_CONFIG, INITIAL_SERIES_LENGTH, OPEN_ORDER_STATUSES, STOCK_UNIVERSE } from '../../../../../../packages/trading-engine/src/runtime.mjs';

export const APP_CONFIG = {
  refreshMs: runtimeConfig.refreshMs,
  ...DEFAULT_ENGINE_CONFIG,
};
