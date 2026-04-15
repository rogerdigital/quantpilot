import { DEFAULT_ENGINE_CONFIG } from '../../../../../../packages/trading-engine/src/runtime.js';
import { runtimeConfig } from '../../../app/config/runtime.ts';

export const APP_CONFIG = {
  refreshMs: runtimeConfig.refreshMs,
  ...DEFAULT_ENGINE_CONFIG,
};
