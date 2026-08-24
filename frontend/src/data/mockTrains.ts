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

/**
 * Deterministic Real Train Search.
 * Searches across 550+ authentic Indian Railway trains.
 * If NO train exists for the requested route, returns [] (EMPTY ARRAY).
 * NEVER fabricates fake/hallucinated trains!
 */
export function searchTrains(fromCode: string, toCode: string): TrainDetail[] {
  if (!fromCode || !toCode) return [];
  const fromClean = fromCode.toUpperCase().trim();
  const toClean = toCode.toUpperCase().trim();

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

  // 3. Return empty array if not found — do NOT show fake trains
  return [];
}
