import { DISCOVER_SERVICES, DiscoverService } from '../data/discoverServices';

export interface DiscoveryMatch { service: DiscoverService; confidence: number; }

/** Offline keyword matcher for P0: transparent, deterministic and zero-network. */
export function resolveDiscoveryIntent(query: string): DiscoveryMatch | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;
  const ranked = DISCOVER_SERVICES.map((service) => {
    const matches = service.keywords.filter((keyword) => normalized.includes(keyword)).length;
    return { service, matches };
  }).filter(({ matches }) => matches > 0).sort((a, b) => b.matches - a.matches);
  if (!ranked.length) return null;
  const top = ranked[0];
  return { service: top.service, confidence: Math.min(0.98, 0.64 + top.matches * 0.16) };
}
