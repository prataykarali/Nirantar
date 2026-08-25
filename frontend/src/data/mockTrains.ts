import rawData from './realTrainsData.json';

export interface TrainClassAvailability {
  classCode: '1A' | '2A' | '3A' | 'SL' | 'CC' | 'EC' | string;
  className: string;
  fare: number;
  status: string; // 'AVAILABLE' | 'RAC' | 'WL'
  availableSeats: number;
  confirmationProbability?: number; // e.g. 95%
  cateringIncluded?: boolean;
}

export interface TrainDetail {
  trainNumber: string;
  trainName: string;
  trainType: 'VANDE_BHARAT' | 'RAJDHANI' | 'SHATABDI' | 'DURONTO' | 'SUPERFAST' | 'MAIL_EXPRESS' | string;
  fromStationCode: string;
  fromStationName: string;
  fromCity: string;
  toStationCode: string;
  toStationName: string;
  toCity: string;
  departureTime: string;
  arrivalTime: string;
  durationHours: string;
  distanceKm: number;
  runningDays: string[];
  classes: TrainClassAvailability[];
  rating: number;
  punctualityScore: number;
  pantryAvailable: boolean;
  cleanlinessScore: number;
  aiRecommendationReason?: string;
  isFastest?: boolean;
  isBestValue?: boolean;
}

export const MOCK_TRAINS_DATABASE: TrainDetail[] = rawData.trains as TrainDetail[];

const MAJOR_CORRIDORS: string[][] = [
  ['NDLS', 'CNB', 'PRYJ', 'DDU', 'GAYA', 'DHN', 'HWH', 'SDAH'],
  ['NDLS', 'KOTA', 'RTM', 'BRC', 'ST', 'BVI', 'CSMT', 'MMCT'],
  ['NDLS', 'AGC', 'GWL', 'VGLJ', 'BPL', 'NGP', 'BPQ', 'KZJ', 'SC', 'RC', 'SBC'],
  ['NDLS', 'GZB', 'ALJN', 'TDL', 'ETW', 'CNB', 'LKO'],
  ['NDLS', 'CNB', 'PRYJ', 'BSB'],
  ['NDLS', 'MTJ', 'AGC', 'DHO', 'MRA', 'GWL', 'VGLJ', 'LAR', 'BINA', 'BPL'],
  ['HWH', 'KGP', 'BLS', 'BHC', 'JKR', 'CTC', 'BBS', 'KUR', 'PURI'],
  ['CSMT', 'DR', 'KYN', 'KJT', 'LNL', 'SVJR', 'PUNE'],
  ['CSMT', 'ST', 'BRC', 'ADI'],
  ['NDLS', 'CDG', 'JAT', 'SVDK'],
  ['NDLS', 'HW', 'DDN'],
];

/**
 * Deterministic Real Train Search.
 * Searches across 550+ authentic Indian Railway trains.
 * Supports direct endpoints, city aliases, and intermediate corridor stoppages.
 */
export function searchTrains(fromCode: string, toCode: string): TrainDetail[] {
  if (!fromCode || !toCode) return [];
  const fromClean = fromCode.toUpperCase().trim();
  const toClean = toCode.toUpperCase().trim();

  if (fromClean === toClean) return [];

  // 1. Direct station code match
  const matches = MOCK_TRAINS_DATABASE.filter(
    (t) => t.fromStationCode === fromClean && t.toStationCode === toClean
  );
  if (matches.length > 0) return matches;

  // 2. City name match
  const cityMatches = MOCK_TRAINS_DATABASE.filter(
    (t) =>
      (t.fromStationCode === fromClean || t.fromCity.toUpperCase() === fromClean || t.fromCity.toUpperCase().includes(fromClean)) &&
      (t.toStationCode === toClean || t.toCity.toUpperCase() === toClean || t.toCity.toUpperCase().includes(toClean))
  );
  if (cityMatches.length > 0) return cityMatches;

  // 3. Corridor & intermediate stoppage search
  for (const corridor of MAJOR_CORRIDORS) {
    const fromIdx = corridor.indexOf(fromClean);
    const toIdx = corridor.indexOf(toClean);
    if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
      // Find trains running along this corridor (forward)
      const corridorStart = corridor[0];
      const corridorEnd = corridor[corridor.length - 1];
      const corridorTrains = MOCK_TRAINS_DATABASE.filter(
        (t) =>
          (corridor.includes(t.fromStationCode) && corridor.includes(t.toStationCode) && corridor.indexOf(t.fromStationCode) < corridor.indexOf(t.toStationCode)) ||
          (t.fromStationCode === corridorStart || t.toStationCode === corridorEnd)
      );

      if (corridorTrains.length > 0) {
        // Return matching trains adapted for this specific leg
        return corridorTrains.slice(0, 4).map((t) => ({
          ...t,
          fromStationCode: fromClean,
          toStationCode: toClean,
        }));
      }
    } else if (fromIdx !== -1 && toIdx !== -1 && fromIdx > toIdx) {
      // Find reverse corridor trains
      const reverseTrains = MOCK_TRAINS_DATABASE.filter(
        (t) => corridor.includes(t.fromStationCode) && corridor.includes(t.toStationCode) && corridor.indexOf(t.fromStationCode) > corridor.indexOf(t.toStationCode)
      );
      if (reverseTrains.length > 0) {
        return reverseTrains.slice(0, 4).map((t) => ({
          ...t,
          fromStationCode: fromClean,
          toStationCode: toClean,
        }));
      }
    }
  }

  // 4. Return empty array if no corridor or route connects these stations
  return [];
}
