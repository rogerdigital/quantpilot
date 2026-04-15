import type { TerminalOrderRequest, TerminalOrderResponse } from '@shared-types/trading.ts';
import { jsonHeaders } from '../../app/api/http.ts';

export async function submitTerminalOrder(
  req: TerminalOrderRequest
): Promise<TerminalOrderResponse> {
  const response = await fetch('/api/trading/orders', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(req),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    return {
      ok: false,
      message: (body as { message?: string }).message || `HTTP ${response.status}`,
    };
  }
  return response.json();
}
