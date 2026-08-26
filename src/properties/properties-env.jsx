// Environment Variable Resolver
export function getEnvMap() {
  // Vite Build-Time Environment Variables
  const viteEnv = import.meta.env || {};
  console.debug('Fetched viteEnv:', import.meta.env);
  const envMap = new Map(
    Object.entries(viteEnv).map(([key, value]) => [key.replace(/^VITE_|^REACT_APP_/, ''), value]),
  );

  // Runtime-Injected Environment Variables (window.env from env.js)
  const windowEnv = (typeof window !== 'undefined' && window.env) ? window.env : {};
  const windowEnvMap = new Map(
    Object.entries(windowEnv).map(([key, value]) => [key.replace(/^VITE_|^REACT_APP_/, ''), value]),
  );

  // Merge: window env takes precedence over Vite env
  return new Map([...envMap, ...windowEnvMap]);
}