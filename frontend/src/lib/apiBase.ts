export function apiBase(): string {
  const raw = ((import.meta as any).env?.VITE_API_URL as string | undefined) || '';
  if (!raw) return '/api/v1';
  const trimmed = raw.replace(/\/$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}
