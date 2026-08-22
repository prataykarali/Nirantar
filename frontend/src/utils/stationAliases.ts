export interface StationInfo {
  code: string;
  name: string;
  city: string;
  aliases: string[];
}

export const STATION_REGISTRY: Record<string, StationInfo> = {
  MAS: {
    code: 'MAS',
    name: 'Chennai Central',
    city: 'Chennai',
    aliases: ['MAS', 'CHENNAI', 'CHENNAI CENTRAL', 'MADRAS', 'CHENNAI CTL'],
  },
  MDU: {
    code: 'MDU',
    name: 'Madurai Junction',
    city: 'Madurai',
    aliases: ['MDU', 'MADURAI', 'MADURAI JN', 'MADURAI JUNCTION'],
  },
  CBE: {
    code: 'CBE',
    name: 'Coimbatore Junction',
    city: 'Coimbatore',
    aliases: ['CBE', 'COIMBATORE', 'COIMBATORE JN', 'KOVAI'],
  },
  HWH: {
    code: 'HWH',
    name: 'Howrah Junction',
    city: 'Howrah',
    aliases: ['HWH', 'HOWRAH', 'KOLKATA HOWRAH', 'HAWRAH'],
  },
  NDLS: {
    code: 'NDLS',
    name: 'New Delhi',
    city: 'New Delhi',
    aliases: ['NDLS', 'NEW DELHI', 'DELHI', 'DELHI CENTRAL', 'DLI'],
  },
};

/**
 * Resolves any station query (code, name, or city alias) to a standardized StationInfo.
 * E.g., 'MAS' -> Chennai Central, 'Chennai' -> MAS (Chennai Central), 'Kovai' -> CBE (Coimbatore Junction).
 */
export function resolveStationAlias(query: string): StationInfo | null {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim().toUpperCase();

  // Direct match by code
  if (STATION_REGISTRY[clean]) {
    return STATION_REGISTRY[clean];
  }

  // Alias lookup match
  for (const station of Object.values(STATION_REGISTRY)) {
    if (
      station.code === clean ||
      station.city.toUpperCase() === clean ||
      station.name.toUpperCase() === clean ||
      station.aliases.some((alias) => alias.toUpperCase() === clean || clean.includes(alias.toUpperCase()))
    ) {
      return station;
    }
  }

  return null;
}

/**
 * Formats a station input to full human readable format.
 * E.g. 'MAS' -> 'Chennai Central (MAS)'
 */
export function formatStationDisplay(input: string): string {
  const station = resolveStationAlias(input);
  if (station) {
    return `${station.name} (${station.code})`;
  }
  return input;
}
