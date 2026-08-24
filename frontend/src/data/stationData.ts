import rawData from './realTrainsData.json';

export interface Station {
  code: string;
  name: string;
  city: string;
  state: string;
  aliases: string[];
}

export const POPULAR_STATIONS: Station[] = rawData.stations as Station[];

export function findStation(query: string): Station | null {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim().toUpperCase();

  // 1. Direct code match
  const direct = POPULAR_STATIONS.find((s) => s.code === clean);
  if (direct) return direct;

  // 2. City or name exact match
  const exactName = POPULAR_STATIONS.find(
    (s) => s.city.toUpperCase() === clean || s.name.toUpperCase() === clean
  );
  if (exactName) return exactName;

  // 3. Alias match
  const aliasMatch = POPULAR_STATIONS.find((s) =>
    s.aliases && s.aliases.some((a) => a.toUpperCase() === clean || clean.includes(a.toUpperCase()))
  );
  if (aliasMatch) return aliasMatch;

  // 4. Partial substring
  const partial = POPULAR_STATIONS.find(
    (s) =>
      s.name.toUpperCase().includes(clean) ||
      s.city.toUpperCase().includes(clean) ||
      clean.includes(s.city.toUpperCase())
  );
  if (partial) return partial;

  return null;
}

export function searchStations(query: string, limit: number = 8): Station[] {
  if (!query || query.trim().length === 0) return POPULAR_STATIONS.slice(0, limit);
  const q = query.trim().toUpperCase();
  return POPULAR_STATIONS.filter(
    (s) =>
      s.code.includes(q) ||
      s.name.toUpperCase().includes(q) ||
      s.city.toUpperCase().includes(q) ||
      (s.aliases && s.aliases.some((a) => a.toUpperCase().includes(q)))
  ).slice(0, limit);
}
