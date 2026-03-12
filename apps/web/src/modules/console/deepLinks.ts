export type DeepLinkParams = Record<string, string | null | undefined>;

export function buildDeepLink(pathname: string, params: DeepLinkParams) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    query.set(key, value);
  });

  const serialized = query.toString();
  return serialized ? `${pathname}?${serialized}` : pathname;
}

export function readDeepLinkParams(searchParams: URLSearchParams) {
  return {
    planId: searchParams.get('plan') || '',
    strategyId: searchParams.get('strategy') || '',
    runId: searchParams.get('run') || '',
    timelineId: searchParams.get('timeline') || '',
    sourcePage: searchParams.get('source') || '',
    auditEventId: searchParams.get('audit') || '',
    workflowStepKey: searchParams.get('step') || '',
  };
}
