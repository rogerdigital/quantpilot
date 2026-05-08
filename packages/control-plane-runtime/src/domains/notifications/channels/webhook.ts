import { createHmac } from 'node:crypto';

export interface WebhookConfig {
  url: string;
  secret?: string;
  enabled: boolean;
  maxRetries: number;
  timeoutMs: number;
}

export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  signature?: string;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  attempts: number;
  timestamp: string;
}

const DEFAULT_CONFIG: WebhookConfig = {
  url: '',
  enabled: true,
  maxRetries: 3,
  timeoutMs: 5000,
};

export function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = signPayload(payload, secret);
  return expected === signature;
}

export async function sendWebhook(
  config: WebhookConfig,
  event: string,
  data: Record<string, unknown>
): Promise<WebhookDeliveryResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  if (!mergedConfig.enabled) {
    return {
      success: false,
      error: 'Webhook channel is disabled',
      attempts: 0,
      timestamp: new Date().toISOString(),
    };
  }

  if (!mergedConfig.url) {
    return {
      success: false,
      error: 'Webhook URL not configured',
      attempts: 0,
      timestamp: new Date().toISOString(),
    };
  }

  const payload: WebhookPayload = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  const payloadString = JSON.stringify(payload);
  if (mergedConfig.secret) {
    payload.signature = signPayload(payloadString, mergedConfig.secret);
  }

  let lastError = '';
  for (let attempt = 1; attempt <= mergedConfig.maxRetries; attempt++) {
    try {
      const response = await fetch(mergedConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-QuantPilot-Event': event,
          'X-QuantPilot-Timestamp': payload.timestamp,
          ...(payload.signature ? { 'X-QuantPilot-Signature': payload.signature } : {}),
        },
        body: payloadString,
        signal: AbortSignal.timeout(mergedConfig.timeoutMs),
      });

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status,
          attempts: attempt,
          timestamp: new Date().toISOString(),
        };
      }

      lastError = `HTTP ${response.status}: ${response.statusText}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Network error';
    }

    if (attempt < mergedConfig.maxRetries) {
      const delay = Math.min(1000 * 2 ** (attempt - 1), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: mergedConfig.maxRetries,
    timestamp: new Date().toISOString(),
  };
}

export function buildWebhookPayload(event: string, data: Record<string, unknown>): WebhookPayload {
  return {
    event,
    data,
    timestamp: new Date().toISOString(),
  };
}
