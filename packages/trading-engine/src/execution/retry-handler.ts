export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: Set<string>;
}

export interface RetryAttempt {
  attempt: number;
  error: string;
  timestamp: string;
  nextRetryAt?: string;
}

export interface RetryState {
  attempts: RetryAttempt[];
  totalRetries: number;
  lastError?: string;
  gaveUp: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: new Set([
    'timeout',
    'rate_limit',
    'network_error',
    'server_error',
    'connection_reset',
    'service_unavailable',
  ]),
};

export function isRetryableError(
  error: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): boolean {
  const lower = error.toLowerCase();
  for (const retryable of config.retryableErrors) {
    if (lower.includes(retryable)) return true;
  }
  return false;
}

export function calculateBackoff(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = config.baseDelayMs * config.backoffMultiplier ** attempt;
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.min(delay + jitter, config.maxDelayMs);
}

export function createRetryState(): RetryState {
  return { attempts: [], totalRetries: 0, gaveUp: false };
}

export function shouldRetry(
  state: RetryState,
  error: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): { retry: boolean; delayMs: number } {
  if (!isRetryableError(error, config)) {
    state.lastError = error;
    state.gaveUp = true;
    return { retry: false, delayMs: 0 };
  }

  const attempt = state.attempts.length;
  if (attempt >= config.maxRetries) {
    state.lastError = error;
    state.gaveUp = true;
    return { retry: false, delayMs: 0 };
  }

  const delayMs = calculateBackoff(attempt, config);
  const now = new Date().toISOString();
  state.attempts.push({
    attempt: attempt + 1,
    error,
    timestamp: now,
    nextRetryAt: new Date(Date.now() + delayMs).toISOString(),
  });
  state.totalRetries += 1;
  state.lastError = error;

  return { retry: true, delayMs };
}

export function resetRetryState(state: RetryState): void {
  state.attempts = [];
  state.totalRetries = 0;
  state.lastError = undefined;
  state.gaveUp = false;
}

export function getRetryConfig(overrides?: Partial<RetryConfig>): RetryConfig {
  return { ...DEFAULT_RETRY_CONFIG, ...overrides };
}
