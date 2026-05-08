// @ts-nocheck

export const AssetType = {
  STOCK: 'STOCK',
  OPTION: 'OPTION',
  FUTURE: 'FUTURE',
  CRYPTO: 'CRYPTO',
  FOREX: 'FOREX',
};

export const OptionType = {
  CALL: 'CALL',
  PUT: 'PUT',
};

export function createInstrument(data) {
  const base = {
    symbol: data.symbol || '',
    assetType: data.assetType || AssetType.STOCK,
    name: data.name || '',
    exchange: data.exchange || '',
    currency: data.currency || 'USD',
    metadata: data.metadata || {},
  };

  switch (data.assetType) {
    case AssetType.OPTION:
      return {
        ...base,
        underlying: data.underlying || '',
        strike: Number(data.strike || 0),
        expiry: data.expiry || '',
        optionType: data.optionType || OptionType.CALL,
        multiplier: Number(data.multiplier || 100),
        greeks: {
          delta: Number(data.greeks?.delta || 0),
          gamma: Number(data.greeks?.gamma || 0),
          theta: Number(data.greeks?.theta || 0),
          vega: Number(data.greeks?.vega || 0),
          rho: Number(data.greeks?.rho || 0),
        },
        impliedVolatility: Number(data.impliedVolatility || 0),
        openInterest: Number(data.openInterest || 0),
        lastTradePrice: Number(data.lastTradePrice || 0),
      };

    case AssetType.FUTURE:
      return {
        ...base,
        contractMonth: data.contractMonth || '',
        multiplier: Number(data.multiplier || 1),
        tickSize: Number(data.tickSize || 0.01),
        marginRequirement: Number(data.marginRequirement || 0),
        expirationDate: data.expirationDate || '',
        settlementType: data.settlementType || 'cash',
      };

    case AssetType.CRYPTO:
      return {
        ...base,
        baseAsset: data.baseAsset || '',
        quoteAsset: data.quoteAsset || '',
        decimalPrecision: Number(data.decimalPrecision || 8),
        minOrderSize: Number(data.minOrderSize || 0),
        maxOrderSize: Number(data.maxOrderSize || Infinity),
        makerFee: Number(data.makerFee || 0.001),
        takerFee: Number(data.takerFee || 0.001),
      };

    case AssetType.FOREX:
      return {
        ...base,
        baseCurrency: data.baseCurrency || '',
        quoteCurrency: data.quoteCurrency || '',
        pipSize: Number(data.pipSize || 0.0001),
        lotSize: Number(data.lotSize || 100000),
      };

    default: // STOCK
      return {
        ...base,
        sector: data.sector || '',
        industry: data.industry || '',
        marketCap: Number(data.marketCap || 0),
        avgVolume: Number(data.avgVolume || 0),
      };
  }
}

export function createPosition(data) {
  const base = {
    symbol: data.symbol || '',
    assetType: data.assetType || AssetType.STOCK,
    quantity: Number(data.quantity || 0),
    avgCost: Number(data.avgCost || 0),
    currentPrice: Number(data.currentPrice || 0),
    marketValue: Number(data.marketValue || 0),
    unrealizedPnl: Number(data.unrealizedPnl || 0),
    realizedPnl: Number(data.realizedPnl || 0),
    metadata: data.metadata || {},
  };

  // Calculate market value if not provided
  if (base.marketValue === 0 && base.quantity !== 0) {
    base.marketValue = base.quantity * base.currentPrice;
  }

  // Calculate unrealized P&L if not provided
  if (base.unrealizedPnl === 0 && base.quantity !== 0) {
    base.unrealizedPnl = (base.currentPrice - base.avgCost) * base.quantity;
  }

  switch (data.assetType) {
    case AssetType.OPTION:
      return {
        ...base,
        underlying: data.underlying || '',
        strike: Number(data.strike || 0),
        expiry: data.expiry || '',
        optionType: data.optionType || OptionType.CALL,
        multiplier: Number(data.multiplier || 100),
        greeks: {
          delta: Number(data.greeks?.delta || 0),
          gamma: Number(data.greeks?.gamma || 0),
          theta: Number(data.greeks?.theta || 0),
          vega: Number(data.greeks?.vega || 0),
          rho: Number(data.greeks?.rho || 0),
        },
        // Options market value includes multiplier
        marketValue: base.marketValue * (data.multiplier || 100),
        // Greeks exposure
        deltaExposure: (data.greeks?.delta || 0) * base.quantity * (data.multiplier || 100),
        gammaExposure: (data.greeks?.gamma || 0) * base.quantity * (data.multiplier || 100),
        thetaDecay: (data.greeks?.theta || 0) * base.quantity * (data.multiplier || 100),
      };

    case AssetType.FUTURE:
      return {
        ...base,
        contractMonth: data.contractMonth || '',
        multiplier: Number(data.multiplier || 1),
        marginRequirement: Number(data.marginRequirement || 0),
        // Futures market value uses multiplier
        marketValue: base.marketValue * (data.multiplier || 1),
      };

    default:
      return base;
  }
}

export function calculatePortfolioGreeks(positions) {
  const optionPositions = positions.filter((p) => p.assetType === AssetType.OPTION);

  if (optionPositions.length === 0) {
    return { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  return optionPositions.reduce(
    (acc, pos) => ({
      delta: acc.delta + (pos.deltaExposure || 0),
      gamma: acc.gamma + (pos.gammaExposure || 0),
      theta: acc.theta + (pos.thetaDecay || 0),
      vega: acc.vega + (pos.greeks?.vega || 0) * pos.quantity * (pos.multiplier || 100),
      rho: acc.rho + (pos.greeks?.rho || 0) * pos.quantity * (pos.multiplier || 100),
    }),
    { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 }
  );
}

export function getAssetTypeLabel(assetType, locale = 'en') {
  const labels = {
    en: {
      [AssetType.STOCK]: 'Stock',
      [AssetType.OPTION]: 'Option',
      [AssetType.FUTURE]: 'Future',
      [AssetType.CRYPTO]: 'Crypto',
      [AssetType.FOREX]: 'Forex',
    },
    zh: {
      [AssetType.STOCK]: '股票',
      [AssetType.OPTION]: '期权',
      [AssetType.FUTURE]: '期货',
      [AssetType.CRYPTO]: '加密货币',
      [AssetType.FOREX]: '外汇',
    },
  };

  return labels[locale]?.[assetType] || assetType;
}
