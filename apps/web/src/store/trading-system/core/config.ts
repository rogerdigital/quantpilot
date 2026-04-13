import {
  DEFAULT_ENGINE_CONFIG,
  INITIAL_SERIES_LENGTH,
  OPEN_ORDER_STATUSES,
  STOCK_UNIVERSE,
} from '../../../../../../packages/trading-engine/src/runtime.js';
import { runtimeConfig } from '../../../app/config/runtime.ts';

export const APP_CONFIG = {
  refreshMs: runtimeConfig.refreshMs,
  ...DEFAULT_ENGINE_CONFIG,
};
