export enum ErrorCode {
  // Auth: 1xxx
  AUTH_INVALID_TOKEN = 'AUTH_1001',
  AUTH_PERMISSION_DENIED = 'AUTH_1002',
  AUTH_SESSION_EXPIRED = 'AUTH_1003',
  AUTH_INVALID_CREDENTIALS = 'AUTH_1004',

  // Market: 2xxx
  MARKET_DATA_UNAVAILABLE = 'MKT_2001',
  MARKET_SYMBOL_NOT_FOUND = 'MKT_2002',
  MARKET_FEED_DISCONNECTED = 'MKT_2003',

  // Strategy: 3xxx
  STRATEGY_NOT_FOUND = 'STR_3001',
  STRATEGY_INVALID_PARAMS = 'STR_3002',
  STRATEGY_PROMOTION_DENIED = 'STR_3003',

  // Execution: 4xxx
  EXEC_ORDER_REJECTED = 'EXEC_4001',
  EXEC_INSUFFICIENT_MARGIN = 'EXEC_4002',
  EXEC_MARKET_CLOSED = 'EXEC_4003',
  EXEC_PARTIAL_FILL = 'EXEC_4004',

  // Risk: 5xxx
  RISK_LIMIT_EXCEEDED = 'RISK_5001',
  RISK_DRAWDOWN_BREACH = 'RISK_5002',
  RISK_CONCENTRATION_LIMIT = 'RISK_5003',

  // Backtest: 6xxx
  BACKTEST_INVALID_RANGE = 'BKT_6001',
  BACKTEST_NO_DATA = 'BKT_6002',

  // Agent: 7xxx
  AGENT_AUTHORITY_STOPPED = 'AGT_7001',
  AGENT_DAILY_LIMIT = 'AGT_7002',

  // System: 9xxx
  SYS_INTERNAL = 'SYS_9001',
  SYS_TIMEOUT = 'SYS_9002',
  SYS_RATE_LIMITED = 'SYS_9003',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  detail?: Record<string, unknown>;
  retryable: boolean;
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    'retryable' in value
  );
}

export const RETRYABLE_CODES = new Set<ErrorCode>([
  ErrorCode.MARKET_DATA_UNAVAILABLE,
  ErrorCode.MARKET_FEED_DISCONNECTED,
  ErrorCode.SYS_TIMEOUT,
  ErrorCode.SYS_RATE_LIMITED,
  ErrorCode.EXEC_PARTIAL_FILL,
]);

export function makeAppError(
  code: ErrorCode,
  message: string,
  options?: { detail?: Record<string, unknown>; retryable?: boolean }
): AppError {
  return {
    code,
    message,
    detail: options?.detail,
    retryable: options?.retryable ?? RETRYABLE_CODES.has(code),
  };
}
