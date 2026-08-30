import rawData from './realTrainsData.json';
import { findStation } from './stationData';

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

export const TRAIN_12232: TrainDetail = {
  trainNumber: '12232',
  trainName: 'Chandigarh - Lucknow SF Express',
  trainType: 'SUPERFAST',
  fromStationCode: 'CDG',
  fromStationName: 'Chandigarh Junction',
  fromCity: 'Chandigarh',
  toStationCode: 'LKO',
  toStationName: 'Lucknow Charbagh NR',
  toCity: 'Lucknow',
  departureTime: '21:05',
  arrivalTime: '08:25',
  durationHours: '11h 20m',
  distanceKm: 647,
  runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  classes: [
    {
      classCode: '3A',
      className: 'AC 3 Tier',
      fare: 1040,
      status: 'GNWL-42',
      availableSeats: 0,
      confirmationProbability: 62,
    },
    {
      classCode: '2A',
      className: 'AC 2 Tier',
      fare: 1480,
      status: 'WL-8',
      availableSeats: 0,
      confirmationProbability: 84,
    },
    {
      classCode: 'SL',
      className: 'Sleeper',
      fare: 385,
      status: 'WL-32',
      availableSeats: 0,
      confirmationProbability: 62,
    },
    {
      classCode: '1A',
      className: 'AC 1st Class',
      fare: 2490,
      status: 'WL-2',
      availableSeats: 0,
      confirmationProbability: 91,
    },
  ],
  rating: 4.6,
  punctualityScore: 92,
  pantryAvailable: true,
  cleanlinessScore: 94,
  aiRecommendationReason: 'High probability of confirmation (78%) via dynamic cancellation balance',
};

export const TRAIN_12863: TrainDetail = {
  trainNumber: '12863',
  trainName: 'Howrah - KSR Bengaluru SF Express',
  trainType: 'SUPERFAST',
  fromStationCode: 'HWH',
  fromStationName: 'Howrah Junction',
  fromCity: 'Kolkata',
  toStationCode: 'SBC',
  toStationName: 'KSR Bengaluru',
  toCity: 'Bengaluru',
  departureTime: '20:35',
  arrivalTime: '06:45',
  durationHours: '34h 10m',
  distanceKm: 1957,
  runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  classes: [
    {
      classCode: '3A',
      className: 'AC 3 Tier',
      fare: 1960,
      status: 'GNWL-42',
      availableSeats: 0,
      confirmationProbability: 62,
    },
    {
      classCode: '2A',
      className: 'AC 2 Tier',
      fare: 2840,
      status: 'WL-8',
      availableSeats: 0,
      confirmationProbability: 84,
    },
    {
      classCode: 'SL',
      className: 'Sleeper',
      fare: 740,
      status: 'WL-32',
      availableSeats: 0,
      confirmationProbability: 62,
    },
    {
      classCode: '1A',
      className: 'AC 1st Class',
      fare: 4890,
      status: 'WL-2',
      availableSeats: 0,
      confirmationProbability: 91,
    },
  ],
  rating: 4.8,
  punctualityScore: 94,
  pantryAvailable: true,
  cleanlinessScore: 95,
  aiRecommendationReason: 'High probability of confirmation (78%) via dynamic cancellation balance on Howrah-Bengaluru line',
  isFastest: false,
  isBestValue: true,
};

export const TRAIN_12864: TrainDetail = {
  trainNumber: '12864',
  trainName: 'KSR Bengaluru - Howrah SF Express',
  trainType: 'SUPERFAST',
  fromStationCode: 'SBC',
  fromStationName: 'KSR Bengaluru',
  fromCity: 'Bengaluru',
  toStationCode: 'HWH',
  toStationName: 'Howrah Junction',
  toCity: 'Kolkata',
  departureTime: '10:35',
  arrivalTime: '19:55',
  durationHours: '33h 20m',
  distanceKm: 1957,
  runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  classes: [
    {
      classCode: '3A',
      className: 'AC 3 Tier',
      fare: 1960,
      status: 'GNWL-42',
      availableSeats: 0,
      confirmationProbability: 62,
    },
    {
      classCode: '2A',
      className: 'AC 2 Tier',
      fare: 2840,
      status: 'WL-8',
      availableSeats: 0,
      confirmationProbability: 84,
    },
    {
      classCode: 'SL',
      className: 'Sleeper',
      fare: 740,
      status: 'WL-32',
      availableSeats: 0,
      confirmationProbability: 62,
    },
    {
      classCode: '1A',
      className: 'AC 1st Class',
      fare: 4890,
      status: 'WL-2',
      availableSeats: 0,
      confirmationProbability: 91,
    },
  ],
  rating: 4.8,
  punctualityScore: 94,
  pantryAvailable: true,
  cleanlinessScore: 95,
  aiRecommendationReason: 'High probability of confirmation (78%) via dynamic cancellation balance',
  isFastest: false,
  isBestValue: true,
};

export const MOCK_TRAINS_DATABASE: TrainDetail[] = [
  TRAIN_12863,
  TRAIN_12864,
  TRAIN_12232,
  ...(rawData.trains as TrainDetail[]),
];

const MAJOR_CORRIDORS: string[][] = [
  ['NDLS', 'GZB', 'ALJN', 'TDL', 'ETW', 'CNB', 'FTP', 'PRYJ', 'MZP', 'DDU', 'SSM', 'DOS', 'GAYA', 'KQR', 'GMO', 'DHN', 'ASN', 'DGR', 'BWN', 'HWH', 'SDAH'],
  ['NDLS', 'MTJ', 'BTE', 'SWM', 'KOTA', 'RMA', 'BWM', 'NAD', 'RTM', 'DHD', 'GDA', 'BRC', 'BH', 'ST', 'NVS', 'BL', 'VAPI', 'BVI', 'CSMT', 'MMCT'],
  ['NDLS', 'MTJ', 'AGC', 'GWL', 'VGLJ', 'BINA', 'BPL', 'ET', 'NGP', 'SEGM', 'CD', 'BPQ', 'SKZR', 'RDM', 'KZJ', 'SC', 'VKB', 'WADI', 'RC', 'MALM', 'GTL', 'ATP', 'DMM', 'HUP', 'YNK', 'SBC'],
  ['HWH', 'SRC', 'KGP', 'BLS', 'BHC', 'JKR', 'CTC', 'BBS', 'KUR', 'BAM', 'VSKP', 'RJY', 'BZA', 'OGL', 'RU', 'KPD', 'JTJ', 'BWT', 'KJM', 'SMVB', 'SBC'],
  ['NDLS', 'GZB', 'ALJN', 'TDL', 'ETW', 'CNB', 'PRYJ', 'DDU', 'BXR', 'ARA', 'PNBE', 'BJU', 'KGG', 'NNA', 'KIR', 'BOE', 'KNE', 'AUB', 'NJP'],
  ['HWH', 'SDAH', 'BWN', 'BHP', 'RPH', 'MLDT', 'BOE', 'KNE', 'AUB', 'NJP'],
  ['NDLS', 'GZB', 'MB', 'BE', 'SPN', 'BLP', 'LKO', 'BBK', 'AY', 'AYC', 'BSB'],
  ['HWH', 'SRC', 'KGP', 'BLS', 'BHC', 'JKR', 'CTC', 'BBS', 'KUR', 'PURI'],
  ['CSMT', 'DR', 'TNA', 'KYN', 'KJT', 'LNL', 'SVJR', 'PUNE', 'DD', 'SUR', 'KLBG', 'WADI'],
  ['CSMT', 'BVI', 'VAPI', 'BL', 'ST', 'BH', 'BRC', 'ANND', 'ND', 'ADI', 'MSH', 'PNU', 'ABR', 'FA', 'MJ', 'AII', 'JP'],
  ['NDLS', 'UMB', 'CDG', 'LDH', 'JUC', 'ASR', 'PTKC', 'KTHU', 'JAT', 'UHP', 'SVDK'],
  ['NDLS', 'GZB', 'MTC', 'MOZ', 'TPZ', 'RK', 'HW', 'DDN'],
];

function simpleHash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h);
}

/**
 * Randomize Train Availability across all trains:
 * Generates realistic WL, RAC, scarce/low-seats (<10), and available statuses.
 * Keeps hardcoded explicit waitlist trains (12232, 12863, 12864) intact.
 */
export function randomizeTrainAvailability(trains: TrainDetail[], seedDate?: string): TrainDetail[] {
  const explicitHardcodedWl = new Set(['12232', '12863', '12864']);

  return trains.map((t) => {
    // If it is explicitly hardcoded WL train, preserve its hand-tuned configuration
    if (explicitHardcodedWl.has(t.trainNumber)) {
      return t;
    }

    const updatedClasses = t.classes.map((cls) => {
      const seed = simpleHash(`${t.trainNumber}:${cls.classCode}:${seedDate || 'nirantar_trains'}`);
      const roll = seed % 100;

      // 1. ~25% Chance: WAITLIST (WL / GNWL / RLWL)
      if (roll < 25) {
        const quota = (seed % 3 === 0) ? 'RLWL' : (seed % 5 === 0) ? 'PQWL' : 'GNWL';
        const wlNumber = 4 + (seed % 35);
        const prob = Math.max(45, Math.min(94, 98 - Math.round(wlNumber * 1.3)));
        return {
          ...cls,
          status: `${quota}-${wlNumber}`,
          availableSeats: 0,
          confirmationProbability: prob,
        };
      }

      // 2. ~10% Chance: RAC (Reservation Against Cancellation)
      if (roll < 35) {
        const racNum = 2 + (seed % 8);
        return {
          ...cls,
          status: `RAC-${racNum}`,
          availableSeats: 0,
          confirmationProbability: 95,
        };
      }

      // 3. ~15% Chance: LOW SEAT COUNT (< 10 seats)
      if (roll < 50) {
        const lowSeats = 2 + (seed % 8); // 2 to 9 seats
        return {
          ...cls,
          status: 'AVAILABLE',
          availableSeats: lowSeats,
          confirmationProbability: 98,
        };
      }

      // 4. ~50% Chance: ABUNDANT AVAILABLE SEATS (>= 10 seats)
      const normalSeats = 14 + (seed % 68); // 14 to 81 seats
      return {
        ...cls,
        status: 'AVAILABLE',
        availableSeats: normalSeats,
        confirmationProbability: 99,
      };
    });

    return {
      ...t,
      classes: updatedClasses,
    };
  });
}

/**
 * Deterministic Real Train Search.
 * Searches across 1,000+ authentic Indian Railway trains.
 * Supports direct endpoints, city aliases, and intermediate corridor stoppages.
 * If either station is unrecognized / unavailable, DENIES and returns an empty array.
 */
export function searchTrains(fromCode: string, toCode: string, date?: string): TrainDetail[] {
  if (!fromCode || !toCode) return [];
  const fromClean = fromCode.toUpperCase().trim();
  const toClean = toCode.toUpperCase().trim();

  if (fromClean === toClean) return [];

  // Strict Validation: Both stations MUST exist in the verified station network
  const validFromStation = findStation(fromClean);
  const validToStation = findStation(toClean);

  if (!validFromStation || !validToStation) {
    // DENY: Unknown or off-network station requested
    return [];
  }

  const fromCodeCanonical = validFromStation.code;
  const toCodeCanonical = validToStation.code;

  // 1. Direct station code match
  const matches = MOCK_TRAINS_DATABASE.filter(
    (t) =>
      (t.fromStationCode === fromClean && t.toStationCode === toClean) ||
      (t.fromStationCode === fromCodeCanonical && t.toStationCode === toCodeCanonical)
  );
  if (matches.length > 0) return randomizeTrainAvailability(matches, date);

  // 2. City name match
  const cityMatches = MOCK_TRAINS_DATABASE.filter(
    (t) =>
      (t.fromStationCode === fromCodeCanonical || t.fromCity.toUpperCase() === validFromStation.city.toUpperCase()) &&
      (t.toStationCode === toCodeCanonical || t.toCity.toUpperCase() === validToStation.city.toUpperCase())
  );
  if (cityMatches.length > 0) return randomizeTrainAvailability(cityMatches, date);

  // 3. Corridor & intermediate stoppage search
  for (const corridor of MAJOR_CORRIDORS) {
    const fromIdx = corridor.indexOf(fromCodeCanonical);
    const toIdx = corridor.indexOf(toCodeCanonical);
    if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
      const corridorStart = corridor[0];
      const corridorEnd = corridor[corridor.length - 1];
      const corridorTrains = MOCK_TRAINS_DATABASE.filter(
        (t) =>
          (corridor.includes(t.fromStationCode) && corridor.includes(t.toStationCode) && corridor.indexOf(t.fromStationCode) < corridor.indexOf(t.toStationCode)) ||
          (t.fromStationCode === corridorStart || t.toStationCode === corridorEnd)
      );

      if (corridorTrains.length > 0) {
        const sliced = corridorTrains.slice(0, 4).map((t) => ({
          ...t,
          fromStationCode: fromCodeCanonical,
          fromStationName: validFromStation.name,
          fromCity: validFromStation.city,
          toStationCode: toCodeCanonical,
          toStationName: validToStation.name,
          toCity: validToStation.city,
        }));
        return randomizeTrainAvailability(sliced, date);
      }
    } else if (fromIdx !== -1 && toIdx !== -1 && fromIdx > toIdx) {
      const reverseTrains = MOCK_TRAINS_DATABASE.filter(
        (t) => corridor.includes(t.fromStationCode) && corridor.includes(t.toStationCode) && corridor.indexOf(t.fromStationCode) > corridor.indexOf(t.toStationCode)
      );
      if (reverseTrains.length > 0) {
        const sliced = reverseTrains.slice(0, 4).map((t) => ({
          ...t,
          fromStationCode: fromCodeCanonical,
          fromStationName: validFromStation.name,
          fromCity: validFromStation.city,
          toStationCode: toCodeCanonical,
          toStationName: validToStation.name,
          toCity: validToStation.city,
        }));
        return randomizeTrainAvailability(sliced, date);
      }
    }
  }

  // 4. Dynamic authentic train synthesis for any valid Indian station pair
  const hash = Math.abs(fromCodeCanonical.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31 + toCodeCanonical.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  const baseNum1 = 12000 + (hash % 800);
  const baseNum2 = 22000 + ((hash * 7) % 600);
  const baseNum3 = 12800 + ((hash * 13) % 400);

  const synthesized: TrainDetail[] = [
    {
      trainNumber: `${baseNum2}`,
      trainName: `${validFromStation.city} - ${validToStation.city} Vande Bharat Express`,
      trainType: 'VANDE_BHARAT',
      fromStationCode: validFromStation.code,
      fromStationName: validFromStation.name,
      fromCity: validFromStation.city,
      toStationCode: validToStation.code,
      toStationName: validToStation.name,
      toCity: validToStation.city,
      departureTime: '06:00',
      arrivalTime: '14:20',
      durationHours: '8h 20m',
      distanceKm: 750,
      runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sun'],
      rating: 4.9,
      punctualityScore: 98,
      pantryAvailable: true,
      cleanlinessScore: 99,
      isFastest: true,
      aiRecommendationReason: 'Fastest daytime express with executive comfort and high punctuality (98%)',
      classes: [
        { classCode: 'CC', className: 'AC Chair Car', fare: 1650, status: 'AVAILABLE', availableSeats: 54, cateringIncluded: true, confirmationProbability: 98 },
        { classCode: 'EC', className: 'Exec. Chair Car', fare: 2890, status: 'AVAILABLE', availableSeats: 16, cateringIncluded: true, confirmationProbability: 99 },
      ],
    },
    {
      trainNumber: `${baseNum1}`,
      trainName: `${validFromStation.city} - ${validToStation.city} Superfast Express`,
      trainType: 'SUPERFAST',
      fromStationCode: validFromStation.code,
      fromStationName: validFromStation.name,
      fromCity: validFromStation.city,
      toStationCode: validToStation.code,
      toStationName: validToStation.name,
      toCity: validToStation.city,
      departureTime: '16:55',
      arrivalTime: '08:35',
      durationHours: '15h 40m',
      distanceKm: 1240,
      runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      rating: 4.8,
      punctualityScore: 95,
      pantryAvailable: true,
      cleanlinessScore: 96,
      isBestValue: true,
      aiRecommendationReason: 'Overnight journey with optimal sleeper and AC berth availability',
      classes: [
        { classCode: '3A', className: 'AC 3 Tier', fare: 1870, status: 'AVAILABLE', availableSeats: 42, cateringIncluded: true, confirmationProbability: 96 },
        { classCode: '2A', className: 'AC 2 Tier', fare: 2650, status: 'AVAILABLE', availableSeats: 18, cateringIncluded: true, confirmationProbability: 98 },
        { classCode: '1A', className: 'AC 1st Class', fare: 4120, status: 'AVAILABLE', availableSeats: 6, cateringIncluded: true, confirmationProbability: 99 },
        { classCode: 'SL', className: 'Sleeper', fare: 650, status: 'AVAILABLE', availableSeats: 78, cateringIncluded: false, confirmationProbability: 91 },
      ],
    },
    {
      trainNumber: `${baseNum3}`,
      trainName: `${validFromStation.city} - ${validToStation.city} SF Mail`,
      trainType: 'MAIL_EXPRESS',
      fromStationCode: validFromStation.code,
      fromStationName: validFromStation.name,
      fromCity: validFromStation.city,
      toStationCode: validToStation.code,
      toStationName: validToStation.name,
      toCity: validToStation.city,
      departureTime: '20:30',
      arrivalTime: '14:45',
      durationHours: '18h 15m',
      distanceKm: 1390,
      runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      rating: 4.6,
      punctualityScore: 92,
      pantryAvailable: true,
      cleanlinessScore: 93,
      classes: [
        { classCode: '3A', className: 'AC 3 Tier', fare: 1740, status: 'AVAILABLE', availableSeats: 28, cateringIncluded: false, confirmationProbability: 94 },
        { classCode: 'SL', className: 'Sleeper', fare: 580, status: 'AVAILABLE', availableSeats: 94, cateringIncluded: false, confirmationProbability: 89 },
      ],
    },
  ];

  return randomizeTrainAvailability(synthesized, date);
}
