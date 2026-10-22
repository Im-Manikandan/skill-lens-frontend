// Identity is a claim; backend validates origins, actor permissions and tenant.
export function resolveUsageApplication(configured, loginMode) {
  if (configured === 'admin' || configured === 'client') return configured;
  return loginMode === 'admin' || loginMode === 'client' ? loginMode : null;
}
