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
