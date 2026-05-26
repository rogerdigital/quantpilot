/**
 * Black-Scholes Option Pricing Model
 * European-style options pricing and Greeks calculation
 */

// Standard normal cumulative distribution function
function normCDF(x: number) {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

// Standard normal probability density function
function normPDF(x: number) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Black-Scholes option pricing
 * @param {Object} params
 * @param {number} params.S - Current stock price
 * @param {number} params.K - Strike price
 * @param {number} params.T - Time to expiration (in years)
 * @param {number} params.r - Risk-free interest rate
 * @param {number} params.sigma - Volatility
 * @param {'CALL'|'PUT'} params.optionType - Option type
 * @returns {Object} Option price and Greeks
 */
export function blackScholes({
  S,
  K,
  T,
  r,
  sigma,
  optionType = 'CALL',
}: {
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
  optionType?: string;
}) {
  if (T <= 0) {
    // Option has expired
    const intrinsic = optionType === 'CALL' ? Math.max(0, S - K) : Math.max(0, K - S);
    return {
      price: intrinsic,
      delta: optionType === 'CALL' ? (S > K ? 1 : 0) : S < K ? -1 : 0,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
    };
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const Nd1 = normCDF(d1);
  const Nd2 = normCDF(d2);
  const nd1 = normPDF(d1);

  let price, delta, rho;

  if (optionType === 'CALL') {
    price = S * Nd1 - K * Math.exp(-r * T) * Nd2;
    delta = Nd1;
    rho = (K * T * Math.exp(-r * T) * Nd2) / 100;
  } else {
    const NnegD1 = normCDF(-d1);
    const NnegD2 = normCDF(-d2);
    price = K * Math.exp(-r * T) * NnegD2 - S * NnegD1;
    delta = Nd1 - 1;
    rho = (-K * T * Math.exp(-r * T) * NnegD2) / 100;
  }

  const gamma = nd1 / (S * sigma * sqrtT);
  const theta =
    (-(S * nd1 * sigma) / (2 * sqrtT) -
      r * K * Math.exp(-r * T) * (optionType === 'CALL' ? Nd2 : normCDF(-d2))) /
    365;
  const vega = (S * nd1 * sqrtT) / 100;

  return {
    price,
    delta,
    gamma,
    theta,
    vega,
    rho,
    d1,
    d2,
    impliedVolatility: sigma,
  };
}

/**
 * Calculate implied volatility using Newton-Raphson method
 * @param {Object} params
 * @param {number} params.marketPrice - Observed market price
 * @param {number} params.S - Current stock price
 * @param {number} params.K - Strike price
 * @param {number} params.T - Time to expiration (in years)
 * @param {number} params.r - Risk-free interest rate
 * @param {'CALL'|'PUT'} params.optionType - Option type
 * @param {number} [params.maxIterations=100] - Maximum iterations
 * @param {number} [params.tolerance=0.0001] - Convergence tolerance
 * @returns {number} Implied volatility
 */
export function impliedVolatility({
  marketPrice,
  S,
  K,
  T,
  r,
  optionType = 'CALL',
  maxIterations = 100,
  tolerance = 0.0001,
}: {
  marketPrice: number;
  S: number;
  K: number;
  T: number;
  r: number;
  optionType?: string;
  maxIterations?: number;
  tolerance?: number;
}) {
  let sigma = 0.3; // Initial guess

  for (let i = 0; i < maxIterations; i++) {
    const result = blackScholes({ S, K, T, r, sigma, optionType });
    const diff = result.price - marketPrice;

    if (Math.abs(diff) < tolerance) {
      return sigma;
    }

    // Newton-Raphson update
    if (result.vega === 0) break;
    sigma -= diff / (result.vega * 100);

    // Ensure sigma stays positive
    sigma = Math.max(0.001, sigma);
  }

  return sigma;
}

/**
 * Calculate portfolio Greeks aggregation
 * @param {Array} positions - Array of option positions
 * @returns {Object} Aggregated Greeks
 */
export function calculatePortfolioGreeks(positions: any[]) {
  return positions.reduce(
    (acc, pos) => {
      const multiplier = pos.multiplier || 100;
      const quantity = pos.quantity || 0;

      return {
        delta: acc.delta + (pos.greeks?.delta || 0) * quantity * multiplier,
        gamma: acc.gamma + (pos.greeks?.gamma || 0) * quantity * multiplier,
        theta: acc.theta + (pos.greeks?.theta || 0) * quantity * multiplier,
        vega: acc.vega + (pos.greeks?.vega || 0) * quantity * multiplier,
        rho: acc.rho + (pos.greeks?.rho || 0) * quantity * multiplier,
      };
    },
    { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 }
  );
}

/**
 * Calculate options-specific risk metrics
 * @param {Object} params
 * @param {Array} params.positions - Option positions
 * @param {number} params.underlyingPrice - Current underlying price
 * @param {number} params.underlyingMove - Expected underlying move (e.g., 0.05 for 5%)
 * @param {number} params.daysForward - Days to project forward
 * @returns {Object} Risk metrics
 */
export function calculateOptionsRisk({
  positions,
  underlyingPrice,
  underlyingMove = 0.05,
  daysForward = 1,
}: {
  positions: any[];
  underlyingPrice: number;
  underlyingMove?: number;
  daysForward?: number;
}) {
  const portfolioGreeks = calculatePortfolioGreeks(positions);

  // Delta exposure: P&L from 1% underlying move
  const deltaPnl = portfolioGreeks.delta * underlyingPrice * 0.01;

  // Gamma exposure: P&L from gamma (convexity)
  const gammaPnl = 0.5 * portfolioGreeks.gamma * (underlyingPrice * underlyingMove) ** 2;

  // Theta decay: daily time decay
  const thetaDecay = portfolioGreeks.theta * daysForward;

  // Vega exposure: P&L from 1% volatility change
  const vegaPnl = portfolioGreeks.vega * 1;

  // Total estimated P&L
  const totalPnl = deltaPnl + gammaPnl + thetaDecay + vegaPnl;

  // Risk scenarios
  const scenarios = {
    underlyingUp: {
      move: underlyingMove,
      pnl: deltaPnl + gammaPnl,
    },
    underlyingDown: {
      move: -underlyingMove,
      pnl: -deltaPnl + gammaPnl,
    },
    volatilityUp: {
      move: 0.01,
      pnl: vegaPnl,
    },
    volatilityDown: {
      move: -0.01,
      pnl: -vegaPnl,
    },
    timeDecay: {
      days: daysForward,
      pnl: thetaDecay,
    },
  };

  return {
    portfolioGreeks,
    deltaPnl,
    gammaPnl,
    thetaDecay,
    vegaPnl,
    totalPnl,
    scenarios,
    underlyingPrice,
    underlyingMove,
    daysForward,
  };
}

/**
 * Generate option chain for an underlying
 * @param {Object} params
 * @param {string} params.underlying - Underlying symbol
 * @param {number} params.currentPrice - Current underlying price
 * @param {number} params.volatility - Implied volatility
 * @param {number} params.riskFreeRate - Risk-free rate
 * @param {number} params.daysToExpiry - Days to expiration
 * @param {number} [params.strikeRange=0.2] - Strike range as % of current price
 * @param {number} [params.strikeCount=10] - Number of strikes on each side
 * @returns {Object} Option chain with calls and puts
 */
export function generateOptionChain({
  underlying,
  currentPrice,
  volatility,
  riskFreeRate = 0.05,
  daysToExpiry = 30,
  strikeRange = 0.2,
  strikeCount = 10,
}: {
  underlying: string;
  currentPrice: number;
  volatility: number;
  riskFreeRate?: number;
  daysToExpiry?: number;
  strikeRange?: number;
  strikeCount?: number;
}) {
  const T = daysToExpiry / 365;
  const minStrike = currentPrice * (1 - strikeRange);
  const maxStrike = currentPrice * (1 + strikeRange);
  const strikeStep = (maxStrike - minStrike) / (strikeCount * 2);

  const strikes = [];
  for (let strike = minStrike; strike <= maxStrike; strike += strikeStep) {
    strikes.push(Math.round(strike * 100) / 100);
  }

  const chain = strikes.map((strike) => {
    const call = blackScholes({
      S: currentPrice,
      K: strike,
      T,
      r: riskFreeRate,
      sigma: volatility,
      optionType: 'CALL',
    });

    const put = blackScholes({
      S: currentPrice,
      K: strike,
      T,
      r: riskFreeRate,
      sigma: volatility,
      optionType: 'PUT',
    });

    return {
      strike,
      call: {
        price: call.price,
        delta: call.delta,
        gamma: call.gamma,
        theta: call.theta,
        vega: call.vega,
        impliedVolatility: volatility,
      },
      put: {
        price: put.price,
        delta: put.delta,
        gamma: put.gamma,
        theta: put.theta,
        vega: put.vega,
        impliedVolatility: volatility,
      },
    };
  });

  return {
    underlying,
    currentPrice,
    daysToExpiry,
    volatility,
    riskFreeRate,
    chain,
    generatedAt: new Date().toISOString(),
  };
}
