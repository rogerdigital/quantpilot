export interface SlippageConfig {
  model: 'fixed' | 'volume' | 'spread' | 'volatility_adjusted';
  fixedPct?: number; // For fixed model: e.g., 0.001 = 0.1%
  volumeImpact?: number; // For volume model: impact per unit of participation
  spreadBps?: number; // For spread model: bid-ask spread in basis points
  volatilityMultiplier?: number; // For volatility model: multiplier on realized vol
}

export interface SlippageInput {
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  volume?: number; // Required for volume model
  volatility?: number; // Required for volatility_adjusted model (annualized)
}

export interface SlippageResult {
  executionPrice: number;
  slippage: number; // Absolute slippage per share
  slippagePct: number; // Slippage as percentage
}

/**
 * Fixed slippage model: applies a constant percentage to the price.
 * Buy: price * (1 + slippagePct)
 * Sell: price * (1 - slippagePct)
 */
export function calcFixedSlippage(input: SlippageInput, config: SlippageConfig): SlippageResult {
  const slippagePct = config.fixedPct ?? 0.001;
  const direction = input.side === 'buy' ? 1 : -1;
  const executionPrice = input.price * (1 + direction * slippagePct);
  return {
    executionPrice,
    slippage: Math.abs(executionPrice - input.price),
    slippagePct,
  };
}

/**
 * Volume-based slippage model: impact proportional to order size / average volume.
 * Larger orders relative to volume cause more slippage.
 * Formula: slippage = price * impact * (quantity / volume)
 */
export function calcVolumeSlippage(input: SlippageInput, config: SlippageConfig): SlippageResult {
  const impact = config.volumeImpact ?? 0.1;
  const volume = input.volume ?? 1_000_000; // Default volume if not provided

  if (volume <= 0) {
    return calcFixedSlippage(input, { model: 'fixed', fixedPct: 0.001 });
  }

  const participationRate = input.quantity / volume;
  const slippagePct = impact * participationRate;
  const direction = input.side === 'buy' ? 1 : -1;
  const executionPrice = input.price * (1 + direction * slippagePct);

  return {
    executionPrice,
    slippage: Math.abs(executionPrice - input.price),
    slippagePct,
  };
}

/**
 * Spread model: simulates bid-ask spread based on historical data.
 * Buy executes at ask (price + spread/2), sell at bid (price - spread/2).
 * Spread in basis points: spreadBps = 10 means 0.1% spread.
 */
export function calcSpreadSlippage(input: SlippageInput, config: SlippageConfig): SlippageResult {
  const spreadBps = config.spreadBps ?? 5; // Default 5 bps = 0.05%
  const halfSpreadPct = spreadBps / 10_000 / 2;

  const direction = input.side === 'buy' ? 1 : -1;
  const executionPrice = input.price * (1 + direction * halfSpreadPct);

  return {
    executionPrice,
    slippage: Math.abs(executionPrice - input.price),
    slippagePct: halfSpreadPct,
  };
}

/**
 * Volatility-adjusted slippage: scales slippage with realized volatility.
 * Higher vol assets get more slippage. Uses daily vol approximation.
 * Formula: slippage = multiplier * dailyVol * sqrt(quantity / volume)
 */
export function calcVolatilitySlippage(
  input: SlippageInput,
  config: SlippageConfig
): SlippageResult {
  const multiplier = config.volatilityMultiplier ?? 1.0;
  const annualVol = input.volatility ?? 0.2;
  const dailyVol = annualVol / Math.sqrt(252);
  const volume = input.volume ?? 1_000_000;

  if (volume <= 0) {
    return calcFixedSlippage(input, { model: 'fixed', fixedPct: 0.001 });
  }

  const participationRate = Math.min(input.quantity / volume, 1.0);
  const slippagePct = multiplier * dailyVol * Math.sqrt(participationRate);
  const direction = input.side === 'buy' ? 1 : -1;
  const executionPrice = input.price * (1 + direction * slippagePct);

  return {
    executionPrice,
    slippage: Math.abs(executionPrice - input.price),
    slippagePct,
  };
}

/**
 * Calculate slippage using the configured model.
 */
export function calcSlippage(input: SlippageInput, config: SlippageConfig): SlippageResult {
  switch (config.model) {
    case 'volume':
      return calcVolumeSlippage(input, config);
    case 'spread':
      return calcSpreadSlippage(input, config);
    case 'volatility_adjusted':
      return calcVolatilitySlippage(input, config);
    case 'fixed':
    default:
      return calcFixedSlippage(input, config);
  }
}
