import type { FairAccessTicket } from '../services/niraApi';

type Listener = (ticket: FairAccessTicket | null) => void;

let current: FairAccessTicket | null = null;
const listeners = new Set<Listener>();

export function getFairAccessTicket(): FairAccessTicket | null {
  return current;
}

export function setFairAccessTicket(ticket: FairAccessTicket | null): void {
  current = ticket;
  listeners.forEach((listener) => listener(current));
}

export function subscribeFairAccess(listener: Listener): () => void {
  listeners.add(listener);
  listener(current);
  return () => listeners.delete(listener);
}
