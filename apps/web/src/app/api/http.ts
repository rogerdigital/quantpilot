export class ApiPermissionError extends Error {
  missingPermission?: string;
  status: number;

  constructor(message: string, status: number, missingPermission?: string) {
    super(message);
    this.name = 'ApiPermissionError';
    this.status = status;
    this.missingPermission = missingPermission;
  }
}

export function jsonHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

export async function assertOk(response: Response) {
  if (response.ok) return;

  let payload: { message?: string; missingPermission?: string } | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  throw new ApiPermissionError(
    payload?.message || `HTTP ${response.status}`,
    response.status,
    payload?.missingPermission,
  );
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  await assertOk(response);
  return response.json();
}
