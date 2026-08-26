import { StationStop } from '../data/trainStoppages';

export type LiveSeatStatus = 'AVAILABLE' | 'RAC' | 'WL';

export interface LiveSeatInventory {
  seats: number;
  waitlist: number;
  status: LiveSeatStatus;
  initialWaitlist: number;
  positionsCleared: number;
  cancellationVelocity: number; // e.g. 3.4/hr
  occupancyPercent: number;
}

const TICK_MS = 6_000;

function hash(value: string): number {
  let output = 2166136261;
  for (const char of value) output = Math.imul(output ^ char.charCodeAt(0), 16777619);
  return output >>> 0;
}

export interface CoachInfo {
  code: string;       // e.g. 'S1', 'B4', 'A1', 'H1', 'C1', 'E1'
  classCode: string;  // e.g. 'SL', '3A', '2A', '1A', 'CC', 'EC'
  className: string;  // e.g. 'Sleeper', 'AC 3 Tier'
  label: string;      // e.g. 'S1 (SL)'
  capacity: number;
}

/**
 * Dynamically builds authentic coach composition based strictly on the train's actual classes.
 * Trains like Vande Bharat (CC, EC) will only have C1-C8 and E1-E2.
 * Rajdhani will have B1-B6, A1-A2, H1.
 * Express trains will have S1-S6, B1-B4, A1, H1.
 */
export function getTrainCoaches(trainNumber: string, availableClasses: Array<{ classCode: string; className?: string }>): CoachInfo[] {
  const coaches: CoachInfo[] = [];
  const classCodes = (availableClasses && availableClasses.length > 0)
    ? availableClasses.map((c) => c.classCode)
    : ['3A', '2A', 'SL'];

  classCodes.forEach((cc) => {
    switch (cc) {
      case 'SL':
        coaches.push(
          { code: 'S1', classCode: 'SL', className: 'Sleeper', label: 'S1 (SL)', capacity: 72 },
          { code: 'S2', classCode: 'SL', className: 'Sleeper', label: 'S2 (SL)', capacity: 72 },
          { code: 'S3', classCode: 'SL', className: 'Sleeper', label: 'S3 (SL)', capacity: 72 }
        );
        break;
      case '3A':
        coaches.push(
          { code: 'B1', classCode: '3A', className: 'AC 3 Tier', label: 'B1 (3A)', capacity: 64 },
          { code: 'B2', classCode: '3A', className: 'AC 3 Tier', label: 'B2 (3A)', capacity: 64 },
          { code: 'B3', classCode: '3A', className: 'AC 3 Tier', label: 'B3 (3A)', capacity: 64 },
          { code: 'B4', classCode: '3A', className: 'AC 3 Tier', label: 'B4 (3A)', capacity: 64 }
        );
        break;
      case '3E':
        coaches.push(
          { code: 'M1', classCode: '3E', className: 'AC 3 Economy', label: 'M1 (3E)', capacity: 72 },
          { code: 'M2', classCode: '3E', className: 'AC 3 Economy', label: 'M2 (3E)', capacity: 72 }
        );
        break;
      case '2A':
        coaches.push(
          { code: 'A1', classCode: '2A', className: 'AC 2 Tier', label: 'A1 (2A)', capacity: 46 },
          { code: 'A2', classCode: '2A', className: 'AC 2 Tier', label: 'A2 (2A)', capacity: 46 }
        );
        break;
      case '1A':
        coaches.push(
          { code: 'H1', classCode: '1A', className: 'AC 1st Class', label: 'H1 (1A)', capacity: 24 }
        );
        break;
      case 'CC':
        coaches.push(
          { code: 'C1', classCode: 'CC', className: 'AC Chair Car', label: 'C1 (CC)', capacity: 73 },
          { code: 'C2', classCode: 'CC', className: 'AC Chair Car', label: 'C2 (CC)', capacity: 73 },
          { code: 'C3', classCode: 'CC', className: 'AC Chair Car', label: 'C3 (CC)', capacity: 73 }
        );
        break;
      case 'EC':
        coaches.push(
          { code: 'E1', classCode: 'EC', className: 'Exec. Chair Car', label: 'E1 (EC)', capacity: 56 },
          { code: 'E2', classCode: 'EC', className: 'Exec. Chair Car', label: 'E2 (EC)', capacity: 56 }
        );
        break;
      case '2S':
        coaches.push(
          { code: 'D1', classCode: '2S', className: '2nd Sitting', label: 'D1 (2S)', capacity: 108 },
          { code: 'D2', classCode: '2S', className: '2nd Sitting', label: 'D2 (2S)', capacity: 108 }
        );
        break;
      default:
        coaches.push({ code: 'B1', classCode: cc, className: 'Standard', label: `B1 (${cc})`, capacity: 64 });
    }
  });

  return coaches;
}

export interface SeatBerth {
  num: number;
  type: string;     // 'LB' | 'MB' | 'UB' | 'SL' | 'SU' | 'W' | 'M' | 'A'
  status: 'CNF' | 'RAC' | 'WL';
  label?: string;
  isUserSeat?: boolean;
}

/**
 * Generates the authentic berth/seat layout for a specific coach class.
 */
export function getCoachBerthLayout(coachCode: string, classCode: string, userWlPosition = 14): SeatBerth[] {
  const seats: SeatBerth[] = [];

  if (classCode === 'CC' || classCode === 'EC') {
    // Chair car layout: 2x3 for CC, 2x2 for EC
    const totalSeats = classCode === 'EC' ? 16 : 20;
    const types = classCode === 'EC' ? ['W', 'A', 'A', 'W'] : ['W', 'M', 'A', 'A', 'W'];
    for (let i = 1; i <= totalSeats; i++) {
      const type = types[(i - 1) % types.length];
      seats.push({
        num: i,
        type,
        status: i > totalSeats - 2 ? 'RAC' : 'CNF',
        label: i > totalSeats - 2 ? 'RAC' : 'CNF',
      });
    }
    return seats;
  }

  if (classCode === '2A') {
    // 2-Tier AC: 6 berths per bay (no middle berth: LB, UB, LB, UB, SL, SU)
    const bayPattern = [
      { type: 'LB', isRac: false },
      { type: 'UB', isRac: false },
      { type: 'LB', isRac: false },
      { type: 'UB', isRac: false },
      { type: 'SL', isRac: true, label: 'RAC 1/2' },
      { type: 'SU', isRac: false },
      { type: 'LB', isRac: false },
      { type: 'UB', isRac: false },
      { type: 'LB', isRac: false },
      { type: 'UB', isRac: false },
      { type: 'SL', isRac: true, label: 'RAC 3/4' },
      { type: 'SU', isRac: false },
      { type: 'LB', isRac: false },
      { type: 'UB', isRac: false },
      { type: 'LB', isRac: false },
      { type: 'UB', isRac: false },
      { type: 'SL', isRac: true, label: 'RAC 5/6' },
      { type: 'SU', isRac: false },
    ];
    bayPattern.forEach((bp, idx) => {
      seats.push({
        num: idx + 1,
        type: bp.type,
        status: bp.isRac ? 'RAC' : 'CNF',
        label: bp.label || 'CNF',
      });
    });
    return seats;
  }

  if (classCode === '1A') {
    // 1st AC: 4 berths per cabin (LB, UB, LB, UB)
    const cabinPattern = ['LB', 'UB', 'LB', 'UB', 'LB', 'UB', 'LB', 'UB', 'LB', 'UB', 'LB', 'UB'];
    cabinPattern.forEach((type, idx) => {
      seats.push({
        num: idx + 1,
        type,
        status: 'CNF',
        label: 'CNF',
      });
    });
    return seats;
  }

  // Standard 3-Tier (3A & SL): 8 berths per bay (LB, MB, UB, LB, MB, UB, SL, SU)
  const standardBay = [
    { num: 1, type: 'LB', status: 'CNF' },
    { num: 2, type: 'MB', status: 'CNF' },
    { num: 3, type: 'UB', status: 'CNF' },
    { num: 4, type: 'LB', status: 'CNF' },
    { num: 5, type: 'MB', status: 'CNF' },
    { num: 6, type: 'UB', status: 'CNF' },
    { num: 7, type: 'SL', status: 'RAC', label: 'RAC 1/2' },
    { num: 8, type: 'SU', status: 'CNF' },
    { num: 9, type: 'LB', status: 'CNF' },
    { num: 10, type: 'MB', status: 'CNF' },
    { num: 11, type: 'UB', status: 'CNF' },
    { num: 12, type: 'LB', status: 'CNF' },
    { num: 13, type: 'MB', status: 'CNF' },
    { num: 14, type: 'UB', status: 'CNF' },
    { num: 15, type: 'SL', status: 'RAC', label: 'RAC 3/4' },
    { num: 16, type: 'SU', status: 'CNF' },
    { num: 17, type: 'LB', status: 'CNF' },
    { num: 18, type: 'MB', status: 'CNF' },
    { num: 19, type: 'UB', status: 'CNF' },
    { num: 20, type: 'LB', status: 'CNF' },
    { num: 21, type: 'MB', status: 'CNF' },
    { num: 22, type: 'UB', status: 'CNF' },
    { num: 23, type: 'SL', status: 'RAC', label: 'RAC 5/6' },
    { num: 24, type: 'SU', status: 'CNF' },
  ];

  return standardBay.map((s) => ({
    num: s.num,
    type: s.type,
    status: s.status as any,
    label: s.label || 'CNF',
  }));
}

/**
 * Realistic per-category dynamic seed and depletion rate calculation.
 * Sleeper drops faster (high volume), 1A drops slower.
 */
export function liveSeatInventory(
  trainNumber: string,
  classCode: string,
  initialSeats = 0,
  now = Date.now()
): LiveSeatInventory {
  const seed = hash(`${trainNumber}:${classCode}:inventory`);

  // Category specific baseline settings
  let baseWl = 14;
  let velocity = 3.4;
  let occupancy = 94;

  switch (classCode) {
    case 'SL':
      baseWl = 28 + (seed % 16); // 28 to 44
      velocity = 4.8;
      occupancy = 98;
      break;
    case '3A':
    case '3E':
      baseWl = 12 + (seed % 10); // 12 to 22
      velocity = 3.4;
      occupancy = 94;
      break;
    case '2A':
      baseWl = 6 + (seed % 6);   // 6 to 12
      velocity = 1.8;
      occupancy = 91;
      break;
    case '1A':
      baseWl = 2 + (seed % 3);   // 2 to 4
      velocity = 0.8;
      occupancy = 86;
      break;
    case 'CC':
      baseWl = 10 + (seed % 8);  // 10 to 18
      velocity = 2.6;
      occupancy = 92;
      break;
    case 'EC':
      baseWl = 3 + (seed % 4);   // 3 to 6
      velocity = 1.1;
      occupancy = 88;
      break;
    default:
      baseWl = 14;
      velocity = 3.0;
      occupancy = 93;
  }

  // Gradual simulated drop based on clock
  const elapsedSecs = Math.floor((now / 1000) % 3600);
  const dropped = Math.floor((elapsedSecs / 120) * (velocity / 3.0));
  const currentWl = Math.max(1, baseWl - dropped);
  const cleared = baseWl - currentWl;

  if (initialSeats > 0 && currentWl <= 0) {
    return {
      seats: initialSeats,
      waitlist: 0,
      status: 'AVAILABLE',
      initialWaitlist: baseWl,
      positionsCleared: cleared,
      cancellationVelocity: velocity,
      occupancyPercent: occupancy,
    };
  }

  return {
    seats: 0,
    waitlist: currentWl,
    status: currentWl <= 4 ? 'RAC' : 'WL',
    initialWaitlist: baseWl,
    positionsCleared: cleared,
    cancellationVelocity: velocity,
    occupancyPercent: occupancy,
  };
}

export interface StationLoadProjection {
  boarding: number;
  alighting: number;
  vacantSeats: number;
}

/** Deterministic passenger-flow projection for the demo route timeline. */
export function stationLoadProjection(trainNumber: string, stops: StationStop[], index: number, capacity = 72): StationLoadProjection {
  const seed = hash(`${trainNumber}:${stops[index]?.code || index}`);
  let onboard = Math.round(capacity * 0.74);
  for (let i = 0; i <= index; i += 1) {
    const currentSeed = hash(`${trainNumber}:${stops[i]?.code || i}`);
    const alighting = i === 0 ? 0 : i === stops.length - 1 ? onboard : 2 + (currentSeed % 11);
    const boarding = i === stops.length - 1 ? 0 : 1 + ((currentSeed >>> 4) % 10);
    onboard = Math.max(0, Math.min(capacity, onboard - alighting + boarding));
  }
  const alighting = index === 0 ? 0 : index === stops.length - 1 ? Math.min(capacity, onboard + 2) : 2 + (seed % 11);
  const boarding = index === stops.length - 1 ? 0 : 1 + ((seed >>> 4) % 10);
  return { boarding, alighting, vacantSeats: Math.max(0, capacity - onboard) };
}

export interface NoSeatSegment {
  fromStation: string;
  fromPlatform: string;
  fromCode: string;
  toStation: string;
  toPlatform: string;
  toCode: string;
  startIndex: number;
  endIndex: number;
}

/** Finds all route segments where projected vacancies drop to zero. */
export function getNoSeatSegments(
  trainNumber: string,
  stops: StationStop[],
  capacity = 72
): NoSeatSegment[] {
  const segments: NoSeatSegment[] = [];
  if (!stops || stops.length < 2) return segments;

  for (let i = 0; i < stops.length - 1; i++) {
    const load = stationLoadProjection(trainNumber, stops, i, capacity);
    if (load.vacantSeats === 0) {
      const from = stops[i];
      const to = stops[i + 1];
      segments.push({
        fromStation: from.name,
        fromPlatform: from.platform,
        fromCode: from.code,
        toStation: to.name,
        toPlatform: to.platform,
        toCode: to.code,
        startIndex: i,
        endIndex: i + 1,
      });
    }
  }

  if (segments.length === 0 && stops.length >= 2) {
    const seed = hash(`${trainNumber}:peak`);
    const mid = Math.min(stops.length - 2, 1 + (seed % (stops.length - 1)));
    const from = stops[mid];
    const to = stops[mid + 1] || stops[stops.length - 1];
    segments.push({
      fromStation: from.name,
      fromPlatform: from.platform,
      fromCode: from.code,
      toStation: to.name,
      toPlatform: to.platform,
      toCode: to.code,
      startIndex: mid,
      endIndex: mid + 1,
    });
  }

  return segments;
}

export type ComfortLevel = 'SAFE' | 'BALANCED' | 'FLEXIBLE';

export interface WaitlistWatchState {
  currentWl: number;
  initialWl: number;
  clearedCount: number;
  confirmationProbability: number;
  comfortLevel: ComfortLevel;
  trendText: string;
  isInsideComfort: boolean;
  niraSpeech: string;
  comfortThreshold: number;
  lastMovementHoursAgo: number;
}

/** Interprets waitlist state, velocity, and comfort thresholds to reduce emotional uncertainty. */
export function getWaitlistWatchProjection(
  trainNumber: string,
  classCode: string,
  currentWl: number,
  comfort: ComfortLevel = 'BALANCED'
): WaitlistWatchState {
  const seed = hash(`${trainNumber}:${classCode}:watch`);
  const effectiveWl = currentWl > 0 ? currentWl : 14 + (seed % 10);
  const cleared = 4 + (seed % 8);
  const initialWl = effectiveWl + cleared;

  let probability = Math.max(15, Math.min(96, Math.round(100 - effectiveWl * 1.45 + (seed % 8))));
  if (classCode === '3A' || classCode === 'SL') probability = Math.min(95, probability + 4);
  if (classCode === '1A') probability = Math.min(98, probability + 10);

  const threshold = comfort === 'SAFE' ? 12 : comfort === 'BALANCED' ? 24 : 45;
  const targetProb = comfort === 'SAFE' ? 80 : comfort === 'BALANCED' ? 60 : 40;
  const isInsideComfort = probability >= targetProb || effectiveWl <= threshold;

  const niraSpeech = isInsideComfort
    ? `Great news! Your waitlist WL ${effectiveWl} is moving positively (${cleared} positions cleared) and is within your ${comfort} comfort zone with a ${probability}% estimated confirmation chance.`
    : `Don't panic yet! Your waitlist moved from WL ${initialWl} → WL ${effectiveWl} (${cleared} cleared). It is currently outside your ${comfort} range, but Nira is watching it live as chart preparation approaches.`;

  return {
    currentWl: effectiveWl,
    initialWl,
    clearedCount: cleared,
    confirmationProbability: probability,
    comfortLevel: comfort,
    trendText: `Moving faster than average • ${cleared} passengers ahead cleared status • Last movement 2h ago`,
    isInsideComfort,
    niraSpeech,
    comfortThreshold: threshold,
    lastMovementHoursAgo: 2,
  };
}
