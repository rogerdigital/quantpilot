import type { ControlPlaneResolution, TradingState } from '@shared-types/trading.ts';
import { applyControlPlaneResolution as sharedApplyControlPlaneResolution } from '../../../../../../packages/trading-engine/src/runtime.mjs';

export function applyControlPlaneResolution(state: TradingState, resolution: ControlPlaneResolution) {
  sharedApplyControlPlaneResolution(state, resolution);
}
