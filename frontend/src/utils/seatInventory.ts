import { StationStop } from '../data/trainStoppages';

export type LiveSeatStatus = 'AVAILABLE' | 'RAC' | 'WL';

export interface LiveSeatInventory {
  seats: number;
  waitlist: number;
  status: LiveSeatStatus;
}

const TICK_MS = 6_000;

function hash(value: string): number {
  let output = 2166136261;
  for (const char of value) output = Math.imul(output ^ char.charCodeAt(0), 16777619);
  return output >>> 0;
}

/** Simulated availability: it falls by 1–3 seats every six seconds, then WL rises to 100. */
export function liveSeatInventory(trainNumber: string, classCode: string, initialSeats: number, now = Date.now()): LiveSeatInventory {
  const key = `nirantar-seat-clock:${trainNumber}:${classCode}`;
  const startedAt = Number(localStorage.getItem(key) || now);
  if (!localStorage.getItem(key)) localStorage.setItem(key, String(startedAt));
  const ticks = Math.max(0, Math.floor((now - startedAt) / TICK_MS));
  const seed = hash(`${trainNumber}:${classCode}`);
  const depleted = Array.from({ length: ticks }, (_, i) => 1 + ((seed + i * 7) % 3)).reduce((sum, value) => sum + value, 0);
  const remaining = initialSeats - depleted;
  if (remaining > 0) return { seats: remaining, waitlist: 0, status: 'AVAILABLE' };
  const waitlist = Math.min(100, Math.max(1, Math.ceil(-remaining / 2)));
  return { seats: 0, waitlist, status: waitlist <= 12 ? 'RAC' : 'WL' };
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

  // If no individual station hit zero but route overall is WL/RAC, return the critical peak segment
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
  confirmationProbability: number; // e.g. 78%
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
  const effectiveWl = currentWl > 0 ? currentWl : 38 + (seed % 20);
  const cleared = 8 + (seed % 12);
  const initialWl = effectiveWl + cleared;

  // Probability model based on WL position and class
  let probability = Math.max(15, Math.min(96, Math.round(100 - effectiveWl * 1.35 + (seed % 10))));
  if (classCode === '3A' || classCode === 'SL') probability = Math.min(95, probability + 5);

  const threshold = comfort === 'SAFE' ? 20 : comfort === 'BALANCED' ? 38 : 55;
  const targetProb = comfort === 'SAFE' ? 80 : comfort === 'BALANCED' ? 60 : 40;
  const isInsideComfort = probability >= targetProb || effectiveWl <= threshold;

  const niraSpeech = isInsideComfort
    ? `Great news! Your waitlist WL ${effectiveWl} is moving positively (${cleared} positions cleared in the last 2h) and is within your ${comfort} comfort zone with a ${probability}% estimated confirmation chance.`
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

