import { StationStop } from '../data/trainStoppages';

export type LiveSeatStatus = 'AVAILABLE' | 'RAC' | 'WL';

export interface LiveSeatInventory {
  seats: number;
  waitlist: number;
  racCount: number;         // Actual number of RAC passengers (e.g. 2, 4, or 0)
  status: LiveSeatStatus;
  initialWaitlist: number;
  positionsCleared: number;
  cancellationVelocity: number; // e.g. 3.4/hr
  occupancyPercent: number;
}

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

export interface PassengerSeatAllocation {
  passengerId: string;
  passengerName: string;
  classCode: string;
  coachCode: string;
  coachLabel: string;
  seatNumber: number;
  berthType: string;
}

/**
 * Assigns realistic, distinct coaches and seat numbers to all booked passengers.
 * If multiple passengers share a class, they share the primary coach with adjacent/distributed seats.
 * If passengers have different classes (e.g. 1 3A + 1 SL), they are placed in their respective coaches.
 */
export const OCCUPIED_SEATS_STORAGE_KEY = 'nirantar_occupied_seats_registry';

/**
 * Returns the list of occupied seat numbers for a given train and coach from persistent storage.
 */
export function getOccupiedSeatsForTrain(trainNumber: string, coachCode: string): number[] {
  try {
    const raw = localStorage.getItem(OCCUPIED_SEATS_STORAGE_KEY);
    if (!raw) return [];
    const map: Record<string, number[]> = JSON.parse(raw);
    return map[`${trainNumber}:${coachCode}`] || [];
  } catch {
    return [];
  }
}

/**
 * Registers newly booked seat numbers for a train and coach in persistent storage so they cannot be double-booked.
 */
export function registerOccupiedSeats(trainNumber: string, coachCode: string, seatNumbers: number[]): void {
  try {
    const raw = localStorage.getItem(OCCUPIED_SEATS_STORAGE_KEY);
    const map: Record<string, number[]> = raw ? JSON.parse(raw) : {};
    const key = `${trainNumber}:${coachCode}`;
    const existing = map[key] || [];
    const merged = Array.from(new Set([...existing, ...seatNumbers]));
    map[key] = merged;
    localStorage.setItem(OCCUPIED_SEATS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Failed to register occupied seats in persistent store:', e);
  }
}

/**
 * Assigns realistic, distinct coaches and UNIQUE seat numbers to all booked passengers.
 * Guaranteed: No two passengers on the same train ever get the same seat number.
 */
export function allocatePassengerSeats(
  passengers: Array<{ id?: string; name?: string; assignedClassCode?: string; berthPreference?: string }>,
  primaryClass = '3A',
  bookingSeed?: string,
  trainNumber = '12951'
): PassengerSeatAllocation[] {
  const classCoachesMap: Record<string, string[]> = {
    '1A': ['H1'],
    '2A': ['A1', 'A2'],
    '3A': ['B1', 'B2', 'B3', 'B4', 'B5'],
    '3E': ['M1', 'M2'],
    'SL': ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
    'CC': ['C1', 'C2', 'C3'],
    'EC': ['E1', 'E2'],
    '2S': ['D1', 'D2'],
  };

  const classCapacities: Record<string, number> = {
    '1A': 24,
    '2A': 46,
    '3A': 64,
    '3E': 72,
    'SL': 72,
    'CC': 72,
    'EC': 40,
    '2S': 108,
  };

  if (!passengers || passengers.length === 0) return [];

  const passengersByClass: Record<string, Array<{ p: typeof passengers[0]; idx: number }>> = {};
  passengers.forEach((p, idx) => {
    const pClass = p.assignedClassCode || primaryClass || '3A';
    if (!passengersByClass[pClass]) passengersByClass[pClass] = [];
    passengersByClass[pClass].push({ p, idx });
  });

  const result: PassengerSeatAllocation[] = new Array(passengers.length);
  const newlyAllocatedInThisRun = new Set<string>();

  Object.entries(passengersByClass).forEach(([cls, group]) => {
    const coachList = classCoachesMap[cls] || ['B4'];
    const maxCapacity = classCapacities[cls] || 64;
    
    // Choose coach deterministically based on seed or random
    const seedVal = bookingSeed ? hash(`${bookingSeed}:${cls}:${trainNumber}`) : (Date.now() ^ Math.floor(Math.random() * 100000));
    const coachCode = coachList[Math.abs(seedVal) % coachList.length];
    
    // Fetch persistently occupied seats on this train coach
    const occupiedSeats = new Set(getOccupiedSeatsForTrain(trainNumber, coachCode));

    // Starting search position
    let candidateSeat = 1 + (Math.abs(seedVal >> 3) % Math.max(1, maxCapacity - group.length - 2));

    group.forEach(({ p, idx }) => {
      // Find the next available seat that is NOT already occupied in persistent store or in this run
      while (
        occupiedSeats.has(candidateSeat) ||
        newlyAllocatedInThisRun.has(`${trainNumber}:${coachCode}:${candidateSeat}`)
      ) {
        candidateSeat = (candidateSeat % maxCapacity) + 1;
      }

      const assignedSeatNumber = candidateSeat;
      newlyAllocatedInThisRun.add(`${trainNumber}:${coachCode}:${assignedSeatNumber}`);
      candidateSeat = (candidateSeat % maxCapacity) + 1;
      
      // Compute authentic berth type based on seat number and class
      let calculatedBerth = 'Lower Berth';
      if (cls === '3A' || cls === 'SL' || cls === '3E') {
        const mod = assignedSeatNumber % 8;
        if (mod === 1 || mod === 4) calculatedBerth = 'Lower Berth';
        else if (mod === 2 || mod === 5) calculatedBerth = 'Middle Berth';
        else if (mod === 3 || mod === 6) calculatedBerth = 'Upper Berth';
        else if (mod === 7) calculatedBerth = 'Side Lower';
        else calculatedBerth = 'Side Upper';
      } else if (cls === '2A') {
        const mod = assignedSeatNumber % 6;
        if (mod === 1 || mod === 3) calculatedBerth = 'Lower Berth';
        else if (mod === 2 || mod === 4) calculatedBerth = 'Upper Berth';
        else if (mod === 5) calculatedBerth = 'Side Lower';
        else calculatedBerth = 'Side Upper';
      } else if (cls === '1A') {
        calculatedBerth = assignedSeatNumber % 2 === 1 ? 'Lower Berth' : 'Upper Berth';
      } else if (cls === 'CC' || cls === 'EC') {
        const mod = assignedSeatNumber % 5;
        calculatedBerth = (mod === 1 || mod === 0) ? 'Window Seat' : (mod === 3) ? 'Middle Seat' : 'Aisle Seat';
      }

      // Respect explicit user preference if specified
      let finalBerth = calculatedBerth;
      if (p.berthPreference && p.berthPreference !== 'NO_PREFERENCE') {
        finalBerth = `${p.berthPreference.replace('_', ' ')} Berth`;
      }

      result[idx] = {
        passengerId: p.id || `p_${idx + 1}`,
        passengerName: p.name || `Passenger ${idx + 1}`,
        classCode: cls,
        coachCode,
        coachLabel: `${coachCode} (${cls})`,
        seatNumber: assignedSeatNumber,
        berthType: finalBerth,
      };
    });
  });

  return result;
}

/**
 * Generates the authentic berth/seat layout for a specific coach class and exact RAC count.
 * Exactly lights up only the required RAC berths (1 Side-Lower per 2 RAC passengers).
 * First AC (1A) and Chair Cars (CC/EC) NEVER have RAC.
 */
export function getCoachBerthLayout(
  coachCode: string,
  classCode: string,
  racCount = 0,
  isUserCoach = false,
  userSeatNumber?: number | number[] | Array<{ seatNumber: number; passengerName?: string }>
): SeatBerth[] {
  const seats: SeatBerth[] = [];

  const getUserSeatInfo = (num: number): { isUser: boolean; name?: string } => {
    if (!isUserCoach || userSeatNumber === undefined) return { isUser: false };
    if (Array.isArray(userSeatNumber)) {
      for (const item of userSeatNumber) {
        if (typeof item === 'number' && item === num) {
          return { isUser: true };
        } else if (typeof item === 'object' && item !== null && (item as any).seatNumber === num) {
          return { isUser: true, name: (item as any).passengerName };
        }
      }
      return { isUser: false };
    }
    return { isUser: userSeatNumber === num };
  };

  // Chair car layout: CC / EC (NEVER HAS RAC)
  if (classCode === 'CC' || classCode === 'EC') {
    const totalSeats = classCode === 'EC' ? 40 : 72;
    const types = classCode === 'EC' ? ['W', 'A', 'A', 'W'] : ['W', 'M', 'A', 'A', 'W'];
    for (let i = 1; i <= totalSeats; i++) {
      const type = types[(i - 1) % types.length];
      const userInfo = getUserSeatInfo(i);
      seats.push({
        num: i,
        type,
        status: 'CNF',
        label: userInfo.isUser ? (userInfo.name ? userInfo.name.split(' ')[0].toUpperCase() : 'YOU') : 'CNF',
        isUserSeat: userInfo.isUser,
      });
    }
    return seats;
  }

  // 1st AC layout: H1 (24 berths: 6 cabins)
  if (classCode === '1A') {
    const cabinPattern = ['LB', 'UB', 'LB', 'UB'];
    for (let i = 1; i <= 24; i++) {
      const type = cabinPattern[(i - 1) % cabinPattern.length];
      const userInfo = getUserSeatInfo(i);
      seats.push({
        num: i,
        type,
        status: 'CNF',
        label: userInfo.isUser ? (userInfo.name ? userInfo.name.split(' ')[0].toUpperCase() : 'YOU') : 'CNF',
        isUserSeat: userInfo.isUser,
      });
    }
    return seats;
  }

  // Number of Side Lower berths needed to accommodate racCount (only if this is user's coach)
  const activeRacBerthSlots = isUserCoach ? Math.min(3, Math.ceil(racCount / 2)) : 0;

  // 2-Tier AC layout: A1, A2 (9 bays * 6 berths = 54 berths)
  if (classCode === '2A') {
    const berth2APattern = ['LB', 'UB', 'LB', 'UB', 'SL', 'SU'];
    for (let bay = 0; bay < 9; bay++) {
      const base = bay * 6;
      for (let pos = 0; pos < 6; pos++) {
        const num = base + pos + 1;
        const type = berth2APattern[pos];
        const isSideLower = type === 'SL';
        const racSlotIndex = isSideLower ? bay + 1 : undefined;
        const userInfo = getUserSeatInfo(num);
        const isRac = isUserCoach && !userInfo.isUser && isSideLower && (racSlotIndex || 0) <= activeRacBerthSlots;
        
        let label = 'CNF';
        if (userInfo.isUser) {
          label = userInfo.name ? userInfo.name.split(' ')[0].toUpperCase() : 'YOU';
        } else if (isRac) {
          label = racSlotIndex === 1 ? 'RAC 1/2' : racSlotIndex === 2 ? 'RAC 3/4' : 'RAC 5/6';
        }

        seats.push({
          num,
          type,
          status: isRac ? 'RAC' : 'CNF',
          label,
          isUserSeat: userInfo.isUser,
        });
      }
    }
    return seats;
  }

  // Standard 3-Tier (3A & SL): 9 bays * 8 berths = 72 berths
  // Bay pattern: 1-LB, 2-MB, 3-UB, 4-LB, 5-MB, 6-UB, 7-SL, 8-SU
  const berthPattern = ['LB', 'MB', 'UB', 'LB', 'MB', 'UB', 'SL', 'SU'];
  for (let bay = 0; bay < 9; bay++) {
    const base = bay * 8;
    for (let pos = 0; pos < 8; pos++) {
      const num = base + pos + 1;
      const type = berthPattern[pos];
      const isSideLower = type === 'SL';
      const racSlotIndex = isSideLower ? bay + 1 : undefined;
      const userInfo = getUserSeatInfo(num);
      const isRac = isUserCoach && !userInfo.isUser && isSideLower && (racSlotIndex || 0) <= activeRacBerthSlots;

      let label = 'CNF';
      if (userInfo.isUser) {
        label = userInfo.name ? userInfo.name.split(' ')[0].toUpperCase() : 'YOU';
      } else if (isRac) {
        label = racSlotIndex === 1 ? 'RAC 1/2' : racSlotIndex === 2 ? 'RAC 3/4' : 'RAC 5/6';
      }

      seats.push({
        num,
        type,
        status: isRac ? 'RAC' : 'CNF',
        label,
        isUserSeat: userInfo.isUser,
      });
    }
  }

  return seats;
}

/**
 * Realistic per-category dynamic seed and depletion rate calculation.
 * Sleeper drops faster (high volume), 1A drops slower.
 */
export function liveSeatInventory(
  trainNumber: string,
  classCode: string,
  initialSeats = 0,
  now = Date.now(),
  declaredStatus?: string
): LiveSeatInventory {
  const seed = Math.abs(hash(`${trainNumber}:${classCode}:inventory`));
  const rawStatus = (declaredStatus || '').toUpperCase().trim();
  const isExplicitWlTrain =
    trainNumber === '12232' ||
    trainNumber === '12863' ||
    trainNumber === '12864' ||
    trainNumber === '12245' ||
    rawStatus.includes('WL') ||
    rawStatus.includes('GNWL') ||
    rawStatus.includes('RLWL') ||
    rawStatus.includes('PQWL');

  const isExplicitRac = rawStatus.includes('RAC');
  const isExplicitAvailable = rawStatus.includes('AVAILABLE') || rawStatus === 'CNF' || rawStatus === 'CONFIRMED' || (!isExplicitWlTrain && !isExplicitRac && initialSeats > 0);

  // 1. AVAILABLE SEATS: Realistic positive confirmed seat inventory
  if (isExplicitAvailable) {
    const elapsedMins = Math.floor((now / 60000) % 60);
    const fluctuation = elapsedMins % 3;
    const baseSeats = initialSeats > 0 ? initialSeats : (18 + (seed % 42));
    const dynamicSeats = Math.max(1, baseSeats - fluctuation);
    return {
      seats: dynamicSeats,
      waitlist: 0,
      racCount: 0,
      status: 'AVAILABLE',
      initialWaitlist: 0,
      positionsCleared: 0,
      cancellationVelocity: 0,
      occupancyPercent: Math.min(96, 68 + (seed % 24)),
    };
  }

  // 2. RAC: Reservation Against Cancellation
  if (isExplicitRac) {
    const parsed = parseWaitlistStatus(rawStatus);
    const racNum = parsed.number > 0 ? parsed.number : (1 + (seed % 6));
    return {
      seats: 0,
      waitlist: 0,
      racCount: racNum,
      status: 'RAC',
      initialWaitlist: 0,
      positionsCleared: 0,
      cancellationVelocity: 2.4,
      occupancyPercent: 97,
    };
  }

  // 3. WAITLIST: Live decreasing waitlist position
  const parsed = parseWaitlistStatus(rawStatus);
  const baseWl = parsed.number > 0 ? parsed.number : (isExplicitWlTrain ? 42 : (8 + (seed % 28)));
  const velocity = isExplicitWlTrain ? 5.6 : 3.8;
  const occupancy = 99;

  // Dynamic simulated drop from base WL over time
  const elapsedSecs = Math.floor((now / 1000) % 3600);
  const maxDrop = Math.max(0, baseWl - 1);
  const dropped = Math.min(maxDrop, Math.floor((elapsedSecs % 60) * (baseWl / 30)));
  const currentWl = Math.max(1, baseWl - dropped);
  const cleared = baseWl - currentWl;

  return {
    seats: 0,
    waitlist: currentWl,
    racCount: 0,
    status: 'WL',
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
  quotaType: string;
}

/**
 * Robustly parses waitlist status strings like 'GNWL-18', 'WL-12', 'RLWL-6', 'PQWL 24', 'RAC 2/100'
 */
export function parseWaitlistStatus(statusStr?: string): {
  statusType: 'AVAILABLE' | 'RAC' | 'WAITLIST';
  quotaType: 'GNWL' | 'RLWL' | 'PQWL' | 'RAC' | 'WL';
  number: number;
} {
  if (!statusStr) return { statusType: 'AVAILABLE', quotaType: 'GNWL', number: 0 };
  const s = statusStr.trim().toUpperCase();

  if (s.includes('AVAILABLE') || s === 'CNF' || s === 'CONFIRMED') {
    return { statusType: 'AVAILABLE', quotaType: 'GNWL', number: 0 };
  }

  const quota: 'GNWL' | 'RLWL' | 'PQWL' | 'RAC' | 'WL' =
    s.includes('RLWL') ? 'RLWL' :
    s.includes('PQWL') ? 'PQWL' :
    s.includes('RAC') ? 'RAC' :
    s.includes('GNWL') ? 'GNWL' : 'WL';

  const numMatch = s.match(/\b(?:GNWL|RLWL|PQWL|WL|RAC)[\s\-_]*(\d+)\b/) || s.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 0;

  return {
    statusType: s.includes('RAC') ? 'RAC' : 'WAITLIST',
    quotaType: quota,
    number: num,
  };
}

/**
 * Calculates a realistic dynamic initial waitlist position based on train number, class code, and route demand.
 */
export function getDynamicInitialWaitlist(
  trainNumber: string,
  classCode: string = '3A',
  customStatus?: string
): { initialWl: number; quotaType: string } {
  const parsed = parseWaitlistStatus(customStatus);
  const seed = Math.abs(hash(`${trainNumber}:${classCode}:${new Date().getDate()}`));
  
  let dynamicRandomWl = 18;
  switch (classCode.toUpperCase()) {
    case '1A':
    case 'EC':
      dynamicRandomWl = 4 + (seed % 6); // 4 to 9
      break;
    case '2A':
      dynamicRandomWl = 8 + (seed % 12); // 8 to 19
      break;
    case '3A':
    case '3E':
      dynamicRandomWl = 14 + (seed % 22); // 14 to 35
      break;
    case 'CC':
      dynamicRandomWl = 9 + (seed % 16); // 9 to 24
      break;
    case 'SL':
      dynamicRandomWl = 16 + (seed % 32); // 16 to 47
      break;
    default:
      dynamicRandomWl = 14 + (seed % 20); // 14 to 33
  }

  if (parsed.number > 0 && parsed.number !== 2 && parsed.number !== 42) {
    return { initialWl: parsed.number, quotaType: parsed.quotaType };
  }

  return { initialWl: dynamicRandomWl, quotaType: parsed.quotaType || 'GNWL' };
}

/**
 * High-precision mathematical confirmation probability function.
 * Factors in quota type, travel class pool size, and percentage of queue cleared.
 */
export function calculateCalibratedProbability(
  initialWl: number,
  currentWl: number,
  classCode: string = '3A',
  quotaType: string = 'GNWL'
): number {
  if (currentWl <= 0) return 100;
  if (currentWl <= 2) return 98;
  if (currentWl <= 5) return 94;
  if (currentWl <= 8) return 90;

  const quotaFactor = quotaType === 'PQWL' ? 0.68 : quotaType === 'RLWL' ? 0.84 : 1.0;
  const classFactor = classCode === '1A' || classCode === 'EC' ? 0.85 : classCode === '2A' ? 0.92 : 1.0;

  const safeInitial = Math.max(1, initialWl);
  const clearedRatio = Math.max(0, (safeInitial - currentWl) / safeInitial);

  // Baseline probability starting at ~58% - 66% and smoothly saturating to 99%
  const baseProb = 58 * quotaFactor * classFactor;
  const growth = clearedRatio * (98 - baseProb);
  const calculated = Math.round(baseProb + growth);

  return Math.min(99, Math.max(20, calculated));
}

export interface TelemetryStage {
  wl: number;
  delay: number;
  msg: string;
  odds: number;
}

/**
 * Generates dynamic, realistic multi-stage telemetry sequence for any initial queue position W0.
 */
export function generateDynamicTelemetryStages(
  initialWl: number,
  classCode: string = '3A',
  quotaType: string = 'GNWL'
): TelemetryStage[] {
  const w0 = Math.max(1, initialWl);
  const stages: TelemetryStage[] = [];

  // Stage 0: Initial
  stages.push({
    wl: w0,
    delay: 3500,
    msg: `Corridor radar active: scanning cancellation queue (${quotaType} ${w0})...`,
    odds: calculateCalibratedProbability(w0, w0, classCode, quotaType),
  });

  if (w0 > 25) {
    const s1 = Math.round(w0 * 0.78);
    stages.push({
      wl: s1,
      delay: 4200,
      msg: `${w0 - s1} cancellations cleared ahead in ${quotaType} quota 📉`,
      odds: calculateCalibratedProbability(w0, s1, classCode, quotaType),
    });

    const s2 = Math.round(w0 * 0.55);
    stages.push({
      wl: s2,
      delay: 4500,
      msg: `${w0 - s2} cumulative positions absorbed • Velocity rising 🚀`,
      odds: calculateCalibratedProbability(w0, s2, classCode, quotaType),
    });

    const s3 = Math.round(w0 * 0.32);
    stages.push({
      wl: s3,
      delay: 4500,
      msg: `Corridor quota rebalancing: ${w0 - s3} positions cleared ✨`,
      odds: calculateCalibratedProbability(w0, s3, classCode, quotaType),
    });
  } else if (w0 > 10) {
    const s1 = Math.round(w0 * 0.65);
    stages.push({
      wl: s1,
      delay: 4200,
      msg: `${w0 - s1} cancellations cleared in primary quota ahead 📉`,
      odds: calculateCalibratedProbability(w0, s1, classCode, quotaType),
    });

    const s2 = Math.round(w0 * 0.35);
    stages.push({
      wl: s2,
      delay: 4500,
      msg: `Corridor quota rebalancing: ${w0 - s2} positions cleared ✨`,
      odds: calculateCalibratedProbability(w0, s2, classCode, quotaType),
    });
  } else if (w0 > 4) {
    const s1 = Math.round(w0 * 0.5);
    stages.push({
      wl: s1,
      delay: 4200,
      msg: `${w0 - s1} cancellations cleared ahead in quota 📉`,
      odds: calculateCalibratedProbability(w0, s1, classCode, quotaType),
    });
  }

  // Pre-RAC buffer stage
  if (w0 > 5) {
    stages.push({
      wl: 5,
      delay: 4500,
      msg: 'Emergency & Tatkal unallocated quota buffers released 🟢',
      odds: calculateCalibratedProbability(w0, 5, classCode, quotaType),
    });
  }

  // RAC Assurance stage
  stages.push({
    wl: 2,
    delay: 4500,
    msg: 'RAC Threshold Crossed • Guaranteed Berth Allocated! 🎫',
    odds: 98,
  });

  // Final 100% CNF stage
  stages.push({
    wl: 0,
    delay: 5000,
    msg: '🎉 100% CONFIRMED! Official Berth Allocated in Coach 🥳',
    odds: 100,
  });

  return stages;
}

/** Interprets waitlist state, velocity, and comfort thresholds dynamically. */
export function getWaitlistWatchProjection(
  trainNumber: string,
  classCode: string,
  currentWl: number,
  comfort: ComfortLevel = 'BALANCED',
  customInitialWl?: number,
  customQuota: string = 'GNWL'
): WaitlistWatchState {
  const dynamicWlData = getDynamicInitialWaitlist(trainNumber, classCode);
  const initialWl = customInitialWl && customInitialWl > 0 ? customInitialWl : dynamicWlData.initialWl;
  const effectiveWl = currentWl > 0 ? currentWl : 2;
  const cleared = Math.max(0, initialWl - effectiveWl);

  const probability = calculateCalibratedProbability(initialWl, effectiveWl, classCode, customQuota);

  const threshold = comfort === 'SAFE' ? Math.round(initialWl * 0.3) : comfort === 'BALANCED' ? Math.round(initialWl * 0.6) : initialWl;
  const targetProb = comfort === 'SAFE' ? 80 : comfort === 'BALANCED' ? 60 : 40;
  const isInsideComfort = probability >= targetProb || effectiveWl <= threshold;

  const niraSpeech = isInsideComfort
    ? `Great news! Your waitlist ${customQuota} ${effectiveWl} is moving rapidly (${cleared} positions cleared from initial ${initialWl}) and is within your ${comfort} comfort zone with a ${probability}% estimated confirmation chance.`
    : `Don't panic yet! Your waitlist moved from ${customQuota} ${initialWl} → ${effectiveWl} (${cleared} cleared). It is currently outside your ${comfort} range, but Nira is watching live telemetry as chart preparation approaches.`;

  return {
    currentWl: effectiveWl,
    initialWl,
    clearedCount: cleared,
    confirmationProbability: probability,
    comfortLevel: comfort,
    trendText: `Moving faster than average • ${cleared} passengers ahead cleared • Last movement 2m ago`,
    isInsideComfort,
    niraSpeech,
    comfortThreshold: threshold,
    lastMovementHoursAgo: 2,
    quotaType: customQuota,
  };
}

// ═══════════════════════════════════════════════════════════════════
// REPRESENTATIVE 1-OF-EACH COACH SHOWCASE & 3-4 SEGMENT BAY RADAR
// ═══════════════════════════════════════════════════════════════════

export interface RepresentativeCoachInfo {
  classCode: string;
  className: string;
  representativeCode: string;
  label: string;
  capacity: number;
  seatsAvailable: number;
  description: string;
  accentColor: string;
}

export interface SegmentBerth {
  num: number;
  type: string;          // 'LB' | 'MB' | 'UB' | 'SL' | 'SU' | 'W' | 'M' | 'A'
  fullTypeName: string;  // 'Lower Berth' | 'Middle Berth' | 'Window Seat'
  isUserSeat?: boolean;
  passengerName?: string;
  occupancyStatus: 'USER_BOOKED' | 'OCCUPIED' | 'VACANT' | 'REALLOCATED';
  coPassengerDetails?: {
    travelFrom: string;
    travelTo: string;
    deboardsAtStationIndex: number;
    deboardsAtStationName: string;
  };
  isBesideUser?: boolean;
}

export interface CoachBay {
  bayIndex: number;
  bayLabel: string;
  cabinType: 'STANDARD_BAY' | 'CABIN' | 'COUPE' | 'CHAIR_ROW';
  mainCabinBerths: SegmentBerth[];
  sideBayBerths: SegmentBerth[];
  hasCurtain?: boolean;
  hasDoor?: boolean;
  hasCabinet?: boolean;
}

export interface MidJourneyReallocation {
  id: string;
  trainNumber?: string;
  pnrNumber?: string;
  passengerName: string;
  fromCoach: string;
  fromSeat: number | string;
  fromBerthType: string;
  toCoach: string;
  toSeat: number;
  toBerthType: string;
  effectiveFromStation: string;
  effectiveFromStationCode: string;
  approvedBy: string;
  timestamp: string;
  status: 'APPROVED' | 'PENDING';
}

/**
 * Returns exactly 1 representative coach for core train classes (3A, 2A, 1A, and SL if present).
 */
export function getRepresentativeCoaches(
  trainNumber: string,
  availableClasses?: Array<{ classCode: string; className?: string }>
): RepresentativeCoachInfo[] {
  const classMetadata: Record<string, { repCode: string; name: string; cap: number; available: number; desc: string; color: string }> = {
    '1A': { repCode: 'H1', name: 'AC 1st Class', cap: 24, available: 4, desc: 'Lockable 4-Berth Cabins & 2-Berth Private Coupes with Velvet Bedding', color: '#9333EA' },
    '2A': { repCode: 'A1', name: 'AC 2 Tier', cap: 48, available: 6, desc: 'Curtained 4-Berth Cabins & 2-Berth Side Bay (No Middle Berths)', color: '#4F46E5' },
    '3A': { repCode: 'B4', name: 'AC 3 Tier', cap: 64, available: 14, desc: 'Standard 8-Berth Bays (6 Main Cabin + 2 Side Berths) with Climate Control', color: '#7C3AED' },
    '3E': { repCode: 'M1', name: '3-Tier Economy', cap: 72, available: 18, desc: 'Modern High-Density Modular 8-Berth Bays with Individual AC Vents', color: '#0284C7' },
    'SL': { repCode: 'S2', name: 'Sleeper Class', cap: 72, available: 22, desc: 'Open-Window 8-Berth Bays (Traditional Non-AC Indian Railways Travel)', color: '#D97706' },
    'EC': { repCode: 'E1', name: 'Executive Class', cap: 48, available: 8, desc: '2x2 Luxury Rotating Reclining Seats with Foldable Tables & USB-C', color: '#7C3AED' },
    'EA': { repCode: 'EA1', name: 'Anubhuti Luxury', cap: 48, available: 5, desc: 'Ultra-Luxury 2x2 Pushback Recliner Seats with Individual LCD Touchscreens', color: '#9333EA' },
    'CC': { repCode: 'C3', name: 'AC Chair Car', cap: 75, available: 24, desc: '3x2 Ergonomic Reclining Seats with Overhead Reading Lights & Power Ports', color: '#2563EB' },
    '2S': { repCode: 'D1', name: 'Second Seating', cap: 108, available: 35, desc: 'High-Capacity 3x3 Cushioned Seating for Daylight Regional Commuting', color: '#059669' },
  };

  let classCodes = (availableClasses && availableClasses.length > 0)
    ? Array.from(new Set(availableClasses.map((c) => c.classCode))).filter((cc) => classMetadata[cc])
    : [];

  if (classCodes.length === 0) {
    if (trainNumber.startsWith('2243') || trainNumber.startsWith('2083') || trainNumber.startsWith('222')) {
      classCodes = ['EC', 'CC'];
    } else if (trainNumber.startsWith('1200')) {
      classCodes = ['EC', 'CC'];
    } else {
      classCodes = ['3A', '2A', '1A', 'SL'];
    }
  }

  // Sort logically: 1A, 2A, 3A, 3E, SL, EC, EA, CC, 2S
  const order: Record<string, number> = { '1A': 1, '2A': 2, '3A': 3, '3E': 4, 'SL': 5, 'EC': 6, 'EA': 7, 'CC': 8, '2S': 9 };
  classCodes.sort((a, b) => (order[a] || 99) - (order[b] || 99));

  return classCodes.map((cc) => {
    const meta = classMetadata[cc] || {
      repCode: `${cc}1`,
      name: `${cc} Class`,
      cap: 64,
      available: 10,
      desc: 'Standard Indian Railway Coach',
      color: '#7C3AED',
    };
    return {
      classCode: cc,
      className: meta.name,
      representativeCode: meta.repCode,
      label: `${meta.repCode} (${cc})`,
      capacity: meta.cap,
      seatsAvailable: meta.available,
      description: meta.desc,
      accentColor: meta.color,
    };
  });
}

/**
 * Builds realistic rectangular segment bays/coupes with live vacancy tracking (NO stranger names).
 */
export function getCoachSegmentBays(
  classCode: string,
  currentStationIndex = 0,
  routeStations: StationStop[] = [],
  userBookedSeats: Array<{ seatNumber: number; passengerName?: string; berthType?: string }> = [],
  activeReallocations: MidJourneyReallocation[] = [],
  segmentCount = 8
): CoachBay[] {
  const bays: CoachBay[] = [];
  const defaultRoute = routeStations.length > 0 ? routeStations : [
    { code: 'NDLS', name: 'New Delhi', platform: 'Pf 14', distanceKm: 0, scheduledArr: '00:00', scheduledDep: '16:55', haltMins: 0 },
    { code: 'KOTA', name: 'Kota Junction', platform: 'Pf 1', distanceKm: 465, scheduledArr: '21:30', scheduledDep: '21:40', haltMins: 10 },
    { code: 'RTM', name: 'Ratlam Junction', platform: 'Pf 4', distanceKm: 731, scheduledArr: '00:45', scheduledDep: '00:50', haltMins: 5 },
    { code: 'BRC', name: 'Vadodara Junction', platform: 'Pf 2', distanceKm: 992, scheduledArr: '04:10', scheduledDep: '04:18', haltMins: 8 },
    { code: 'ST', name: 'Surat', platform: 'Pf 1', distanceKm: 1122, scheduledArr: '05:40', scheduledDep: '05:45', haltMins: 5 },
    { code: 'MMCT', name: 'Mumbai Central', platform: 'Pf 3', distanceKm: 1386, scheduledArr: '08:35', scheduledDep: '08:35', haltMins: 0 },
  ];

  const userSeatNums = userBookedSeats.map((s) => s.seatNumber);

  // Helper to construct a single berth
  const buildBerth = (seatNum: number, typeCode: string, fullType: string, bayIdx: number): SegmentBerth => {
    // Check if reallocated / requested by user
    const reallocatedItem = activeReallocations.find((r) => r.toSeat === seatNum);
    if (reallocatedItem) {
      return {
        num: seatNum,
        type: typeCode,
        fullTypeName: fullType,
        isUserSeat: true,
        passengerName: reallocatedItem.passengerName,
        occupancyStatus: 'REALLOCATED',
      };
    }

    // Check if user booked seat
    const userSeat = userBookedSeats.find((s) => s.seatNumber === seatNum);
    if (userSeat) {
      return {
        num: seatNum,
        type: typeCode,
        fullTypeName: userSeat.berthType || fullType,
        isUserSeat: true,
        passengerName: userSeat.passengerName || 'You',
        occupancyStatus: 'USER_BOOKED',
      };
    }

    // Stoppage where this occupied berth deboards (ONLY 2 to 3 stoppages away from terminal platform)
    const totalStoppages = defaultRoute.length;
    const minDeboardIdx = Math.max(1, totalStoppages - 3);
    const maxDeboardIdx = Math.max(minDeboardIdx, totalStoppages - 2);
    const deboardStnIndex = minDeboardIdx + ((seatNum * 3 + bayIdx) % (maxDeboardIdx - minDeboardIdx + 1));
    const deboardStn = defaultRoute[deboardStnIndex] || defaultRoute[totalStoppages - 2] || defaultRoute[totalStoppages - 1];
    const stopsFromTerminal = totalStoppages - 1 - deboardStnIndex;

    // If current station has reached or passed deboarding station, seat is VACANT!
    const isDeboarded = currentStationIndex >= deboardStnIndex;

    // Check if this berth is right beside the user's seat in the bay
    const isBeside = userSeatNums.some((uNum) => {
      const diff = Math.abs(uNum - seatNum);
      return diff <= 2;
    });

    if (isDeboarded) {
      return {
        num: seatNum,
        type: typeCode,
        fullTypeName: fullType,
        occupancyStatus: 'VACANT',
        isBesideUser: isBeside,
        coPassengerDetails: {
          travelFrom: defaultRoute[0].name,
          travelTo: deboardStn.name,
          deboardsAtStationIndex: deboardStnIndex,
          deboardsAtStationName: `${deboardStn.name} (${stopsFromTerminal} stops from terminal)`,
        },
      };
    }

    return {
      num: seatNum,
      type: typeCode,
      fullTypeName: fullType,
      occupancyStatus: 'OCCUPIED',
      isBesideUser: isBeside,
      coPassengerDetails: {
        travelFrom: defaultRoute[0].name,
        travelTo: deboardStn.name,
        deboardsAtStationIndex: deboardStnIndex,
        deboardsAtStationName: `${deboardStn.name} (${stopsFromTerminal} stops from terminal)`,
      },
    };
  };

  // 1. CLASS 1A: 4-Berth Cabins & 2-Berth Coupes with Lockable Doors (24 Berths)
  if (classCode === '1A') {
    const cabinDefs = [
      { type: 'CABIN' as const, label: 'Cabin A (4-Berth Private Cabin)', count: 4, base: 1 },
      { type: 'COUPE' as const, label: 'Coupe B (2-Berth Private Coupe)', count: 2, base: 5 },
      { type: 'CABIN' as const, label: 'Cabin C (4-Berth Private Cabin)', count: 4, base: 7 },
      { type: 'COUPE' as const, label: 'Coupe D (2-Berth Private Coupe)', count: 2, base: 11 },
      { type: 'CABIN' as const, label: 'Cabin E (4-Berth Private Cabin)', count: 4, base: 13 },
      { type: 'COUPE' as const, label: 'Coupe F (2-Berth Private Coupe)', count: 2, base: 17 },
      { type: 'CABIN' as const, label: 'Cabin G (4-Berth Private Cabin)', count: 4, base: 19 },
      { type: 'COUPE' as const, label: 'Coupe H (2-Berth Private Coupe)', count: 2, base: 23 },
    ];

    cabinDefs.forEach((def, idx) => {
      const mainBerths: SegmentBerth[] = [];
      if (def.count === 4) {
        mainBerths.push(
          buildBerth(def.base, 'LB', 'Lower Berth', idx + 1),
          buildBerth(def.base + 1, 'UB', 'Upper Berth', idx + 1),
          buildBerth(def.base + 2, 'LB', 'Lower Berth', idx + 1),
          buildBerth(def.base + 3, 'UB', 'Upper Berth', idx + 1)
        );
      } else {
        mainBerths.push(
          buildBerth(def.base, 'LB', 'Lower Berth', idx + 1),
          buildBerth(def.base + 1, 'UB', 'Upper Berth', idx + 1)
        );
      }

      bays.push({
        bayIndex: idx + 1,
        bayLabel: def.label,
        cabinType: def.type,
        hasDoor: true,
        hasCabinet: true,
        mainCabinBerths: mainBerths,
        sideBayBerths: [],
      });
    });

    return bays;
  }

  // 2. CLASS 2A: 6-Berth Curtained Bays (4 Main Cabin + 2 Side Berths, NO Middle Berths - 48 Berths)
  if (classCode === '2A') {
    const totalBays = segmentCount || 8;
    for (let b = 0; b < totalBays; b++) {
      const base = b * 6;
      bays.push({
        bayIndex: b + 1,
        bayLabel: `Bay ${b + 1} (Berths ${base + 1}–${base + 6})`,
        cabinType: 'STANDARD_BAY',
        hasCurtain: true,
        mainCabinBerths: [
          buildBerth(base + 1, 'LB', 'Lower Berth', b + 1),
          buildBerth(base + 2, 'UB', 'Upper Berth', b + 1),
          buildBerth(base + 3, 'LB', 'Lower Berth', b + 1),
          buildBerth(base + 4, 'UB', 'Upper Berth', b + 1),
        ],
        sideBayBerths: [
          buildBerth(base + 5, 'SL', 'Side Lower', b + 1),
          buildBerth(base + 6, 'SU', 'Side Upper', b + 1),
        ],
      });
    }
    return bays;
  }

  // 3. CLASS CC / EC / EA / 2S: Chair Car Rows (Window, Middle, Aisle)
  if (classCode === 'CC' || classCode === 'EC' || classCode === 'EA' || classCode === '2S') {
    const isExecutive = classCode === 'EC' || classCode === 'EA';
    const totalRows = segmentCount || (isExecutive ? 12 : 15);

    for (let r = 0; r < totalRows; r++) {
      if (isExecutive) {
        // Executive Class: 2x2 Seating (Window, Aisle || Aisle, Window)
        const base = r * 4;
        bays.push({
          bayIndex: r + 1,
          bayLabel: `Row ${r + 1} (Executive 2x2 Reclining Seats ${base + 1}–${base + 4})`,
          cabinType: 'CHAIR_ROW',
          mainCabinBerths: [
            buildBerth(base + 1, 'W', 'Window Seat (Left)', r + 1),
            buildBerth(base + 2, 'A', 'Aisle Seat (Left)', r + 1),
          ],
          sideBayBerths: [
            buildBerth(base + 3, 'A', 'Aisle Seat (Right)', r + 1),
            buildBerth(base + 4, 'W', 'Window Seat (Right)', r + 1),
          ],
        });
      } else if (classCode === '2S') {
        // 2S: 3x3 Seating
        const base = r * 6;
        bays.push({
          bayIndex: r + 1,
          bayLabel: `Row ${r + 1} (Second Seating 3x3 Seats ${base + 1}–${base + 6})`,
          cabinType: 'CHAIR_ROW',
          mainCabinBerths: [
            buildBerth(base + 1, 'W', 'Window Seat (Left)', r + 1),
            buildBerth(base + 2, 'M', 'Middle Seat (Left)', r + 1),
            buildBerth(base + 3, 'A', 'Aisle Seat (Left)', r + 1),
          ],
          sideBayBerths: [
            buildBerth(base + 4, 'A', 'Aisle Seat (Right)', r + 1),
            buildBerth(base + 5, 'M', 'Middle Seat (Right)', r + 1),
            buildBerth(base + 6, 'W', 'Window Seat (Right)', r + 1),
          ],
        });
      } else {
        // CC: 3x2 Seating (Window, Middle, Aisle || Aisle, Window)
        const base = r * 5;
        bays.push({
          bayIndex: r + 1,
          bayLabel: `Row ${r + 1} (Chair Car 3x2 Seats ${base + 1}–${base + 5})`,
          cabinType: 'CHAIR_ROW',
          mainCabinBerths: [
            buildBerth(base + 1, 'W', 'Window Seat (Left)', r + 1),
            buildBerth(base + 2, 'M', 'Middle Seat (Left)', r + 1),
            buildBerth(base + 3, 'A', 'Aisle Seat (Left)', r + 1),
          ],
          sideBayBerths: [
            buildBerth(base + 4, 'A', 'Aisle Seat (Right)', r + 1),
            buildBerth(base + 5, 'W', 'Window Seat (Right)', r + 1),
          ],
        });
      }
    }
    return bays;
  }

  // 4. CLASS 3A / 3E / SL: 8-Berth Bays (6 Main Cabin + 2 Side Berths)
  const totalBays = segmentCount || (classCode === 'SL' || classCode === '3E' ? 9 : 8);
  for (let b = 0; b < totalBays; b++) {
    const base = b * 8;
    bays.push({
      bayIndex: b + 1,
      bayLabel: `Bay ${b + 1} (Berths ${base + 1}–${base + 8})`,
      cabinType: 'STANDARD_BAY',
      hasCurtain: classCode === '3A',
      mainCabinBerths: [
        buildBerth(base + 1, 'LB', 'Lower Berth', b + 1),
        buildBerth(base + 2, 'MB', 'Middle Berth', b + 1),
        buildBerth(base + 3, 'UB', 'Upper Berth', b + 1),
        buildBerth(base + 4, 'LB', 'Lower Berth', b + 1),
        buildBerth(base + 5, 'MB', 'Middle Berth', b + 1),
        buildBerth(base + 6, 'UB', 'Upper Berth', b + 1),
      ],
      sideBayBerths: [
        buildBerth(base + 7, 'SL', 'Side Lower', b + 1),
        buildBerth(base + 8, 'SU', 'Side Upper', b + 1),
      ],
    });
  }

  return bays;
}

