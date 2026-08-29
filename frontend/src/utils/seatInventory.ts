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
export function allocatePassengerSeats(
  passengers: Array<{ id?: string; name?: string; assignedClassCode?: string; berthPreference?: string }>,
  primaryClass = '3A',
  bookingSeed?: string
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

  Object.entries(passengersByClass).forEach(([cls, group]) => {
    const coachList = classCoachesMap[cls] || ['B4'];
    const maxCapacity = classCapacities[cls] || 64;
    
    // Choose dynamic coach & starting seat based on seed or random
    const seedVal = bookingSeed ? hash(`${bookingSeed}:${cls}`) : (Date.now() ^ Math.floor(Math.random() * 100000));
    const coachCode = coachList[Math.abs(seedVal) % coachList.length];
    
    // Starting seat randomly distributed between 1 and (maxCapacity - group.length - 2)
    const availableSpan = Math.max(1, maxCapacity - group.length - 3);
    const startSeat = 1 + (Math.abs(seedVal >> 3) % availableSpan);

    group.forEach(({ p, idx }, offset) => {
      const seatNumber = startSeat + offset;
      
      // Compute authentic berth type based on seat number and class
      let calculatedBerth = 'Lower Berth';
      if (cls === '3A' || cls === 'SL' || cls === '3E') {
        const mod = seatNumber % 8;
        if (mod === 1 || mod === 4) calculatedBerth = 'Lower Berth';
        else if (mod === 2 || mod === 5) calculatedBerth = 'Middle Berth';
        else if (mod === 3 || mod === 6) calculatedBerth = 'Upper Berth';
        else if (mod === 7) calculatedBerth = 'Side Lower';
        else calculatedBerth = 'Side Upper';
      } else if (cls === '2A') {
        const mod = seatNumber % 6;
        if (mod === 1 || mod === 3) calculatedBerth = 'Lower Berth';
        else if (mod === 2 || mod === 4) calculatedBerth = 'Upper Berth';
        else if (mod === 5) calculatedBerth = 'Side Lower';
        else calculatedBerth = 'Side Upper';
      } else if (cls === '1A') {
        calculatedBerth = seatNumber % 2 === 1 ? 'Lower Berth' : 'Upper Berth';
      } else if (cls === 'CC' || cls === 'EC') {
        const mod = seatNumber % 5;
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
        seatNumber,
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
  now = Date.now()
): LiveSeatInventory {
  const seed = hash(`${trainNumber}:${classCode}:inventory`);

  // Category specific baseline settings
  const isWaitlistFlagship = trainNumber === '12232' || trainNumber === '12863' || trainNumber === '12864' || trainNumber === '12245';
  let baseWl = isWaitlistFlagship ? 42 : 14;
  let velocity = 4.2;
  let occupancy = 98;
  let racCount = 2;

  if (isWaitlistFlagship) {
    baseWl = 42;
    velocity = 5.6;
    occupancy = 99;
    racCount = 2;
  } else {
    switch (classCode) {
      case 'SL':
        baseWl = 42; // Starts at 42 and clears dynamically
        velocity = 4.8;
        occupancy = 98;
        racCount = 4;
        break;
      case '3A':
      case '3E':
        baseWl = 42; // Starts at 42 and clears dynamically
        velocity = 3.8;
        occupancy = 96;
        racCount = 2;
        break;
      case '2A':
        baseWl = 18 + (seed % 6);
        velocity = 2.2;
        occupancy = 94;
        racCount = 2;
        break;
      case '1A':
        baseWl = 6 + (seed % 3);
        velocity = 1.0;
        occupancy = 90;
        racCount = 0;
        break;
      case 'CC':
        baseWl = 24 + (seed % 8);
        velocity = 3.2;
        occupancy = 95;
        racCount = 0;
        break;
      case 'EC':
        baseWl = 8 + (seed % 4);
        velocity = 1.4;
        occupancy = 91;
        racCount = 0;
        break;
      default:
        baseWl = 42;
        velocity = 3.8;
        occupancy = 95;
        racCount = 2;
    }
  }

  // Dynamic simulated drop from 42 down to 1-2 over time
  const elapsedSecs = Math.floor((now / 1000) % 3600);
  const dropped = Math.min(baseWl - 2, Math.floor((elapsedSecs % 60) * (baseWl / 18)));
  const currentWl = Math.max(1, baseWl - Math.max(dropped, 40)); // Drops down to 1-2 in real-time
  const cleared = baseWl - currentWl;

  if (initialSeats > 0 && currentWl <= 0) {
    return {
      seats: initialSeats,
      waitlist: 0,
      racCount: 0,
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
    racCount: currentWl <= 2 ? 2 : racCount,
    status: currentWl <= 2 ? 'RAC' : 'WL',
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
  const initialWl = trainNumber === '12232' || trainNumber === '12863' || trainNumber === '12864' || trainNumber === '12245' || classCode === '3A' || classCode === 'SL' ? 42 : 28;
  const effectiveWl = currentWl > 0 ? currentWl : 2;
  const cleared = Math.max(0, initialWl - effectiveWl);

  // Scaled probability from 62% at WL 42 to 98% at WL 1-2
  let probability = Math.min(99, Math.max(50, Math.round(62 + ((initialWl - effectiveWl) / Math.max(1, initialWl - 1)) * 36)));
  if (effectiveWl <= 2) probability = 98;
  else if (effectiveWl <= 5) probability = 94;
  else if (effectiveWl <= 10) probability = 88;

  const threshold = comfort === 'SAFE' ? 12 : comfort === 'BALANCED' ? 24 : 45;
  const targetProb = comfort === 'SAFE' ? 80 : comfort === 'BALANCED' ? 60 : 40;
  const isInsideComfort = probability >= targetProb || effectiveWl <= threshold;

  const niraSpeech = isInsideComfort
    ? `Great news! Your waitlist WL ${effectiveWl} is moving rapidly (${cleared} positions cleared from WL ${initialWl}) and is within your ${comfort} comfort zone with a ${probability}% estimated confirmation chance.`
    : `Don't panic yet! Your waitlist moved from WL ${initialWl} → WL ${effectiveWl} (${cleared} cleared). It is currently outside your ${comfort} range, but Nira is watching it live as chart preparation approaches.`;

  return {
    currentWl: effectiveWl,
    initialWl,
    clearedCount: cleared,
    confirmationProbability: probability,
    comfortLevel: comfort,
    trendText: `Moving faster than average • ${cleared} passengers ahead cleared status • Last movement 2m ago`,
    isInsideComfort,
    niraSpeech,
    comfortThreshold: threshold,
    lastMovementHoursAgo: 2,
  };
}
