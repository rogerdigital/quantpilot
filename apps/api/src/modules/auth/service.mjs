const DEFAULT_OPERATOR = {
  id: 'operator-demo',
  name: 'QuantPilot Operator',
  role: 'admin',
  permissions: ['dashboard:read', 'strategy:write', 'risk:review', 'execution:approve'],
};

export function getSession() {
  return {
    ok: true,
    user: DEFAULT_OPERATOR,
    issuedAt: new Date().toISOString(),
  };
}
