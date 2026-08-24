/**
 * NIRANTAR — Formal State Machine & State Transition Engine
 * ==========================================================
 * Explicit state definitions for Booking, Tracking, and Journey lifecycle.
 * Validates all transitions deterministically. LLM proposes actions, but
 * the state transition engine authoritatively validates legality!
 */

export type BookingState =
  | 'IDLE'
  | 'SEARCHING'
  | 'RESULTS'
  | 'TRAIN_SELECTED'
  | 'PASSENGER_DETAILS'
  | 'REVIEW'
  | 'AUTHENTICATION'
  | 'PAYMENT_READY'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_UNKNOWN'
  | 'CONFIRMED'
  | 'TICKET_VIEW';

export type TrackingState =
  | 'TRACKING_IDLE'
  | 'TRAIN_SELECTED_FOR_TRACKING'
  | 'TRACKING_ACTIVE'
  | 'TRACKING_UNAVAILABLE'
  | 'TRACKING_COMPLETE';

export type JourneyLifecycleState =
  | 'NO_ACTIVE_JOURNEY'
  | 'ACTIVE_BOOKING'
  | 'INTERRUPTED_BOOKING'
  | 'BOOKING_CONFIRMED'
  | 'TRIP_IN_PROGRESS'
  | 'TRIP_COMPLETED';

// Allowed Booking Transitions Mapping
const ALLOWED_BOOKING_TRANSITIONS: Record<BookingState, BookingState[]> = {
  IDLE: ['SEARCHING', 'RESULTS', 'TRAIN_SELECTED', 'TICKET_VIEW'],
  SEARCHING: ['RESULTS', 'IDLE'],
  RESULTS: ['TRAIN_SELECTED', 'SEARCHING', 'IDLE'],
  TRAIN_SELECTED: ['PASSENGER_DETAILS', 'RESULTS', 'IDLE'],
  PASSENGER_DETAILS: ['REVIEW', 'TRAIN_SELECTED', 'RESULTS', 'IDLE', 'TICKET_VIEW'],
  REVIEW: ['AUTHENTICATION', 'PAYMENT_READY', 'PASSENGER_DETAILS', 'RESULTS', 'IDLE'],
  AUTHENTICATION: ['PAYMENT_READY', 'REVIEW', 'IDLE'],
  PAYMENT_READY: ['PAYMENT_PROCESSING', 'REVIEW', 'IDLE'],
  PAYMENT_PROCESSING: ['PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_UNKNOWN'],
  PAYMENT_SUCCESS: ['CONFIRMED', 'TICKET_VIEW'],
  PAYMENT_FAILED: ['PAYMENT_READY', 'REVIEW', 'IDLE'],
  PAYMENT_UNKNOWN: ['PAYMENT_PROCESSING', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'REVIEW'],
  CONFIRMED: ['TICKET_VIEW', 'IDLE'],
  TICKET_VIEW: ['IDLE', 'RESULTS', 'SEARCHING'],
};

export class StateTransitionEngine {
  public static canTransition(current: BookingState, next: BookingState): boolean {
    if (current === next) return true;
    const allowed = ALLOWED_BOOKING_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  public static transition(
    current: BookingState,
    next: BookingState,
    reason?: string
  ): { success: boolean; state: BookingState; error?: string } {
    if (this.canTransition(current, next)) {
      return { success: true, state: next };
    }
    const errorMsg = `Illegal state transition attempted from ${current} to ${next} (${reason || 'no reason provided'})`;
    console.warn(`[StateTransitionEngine] ${errorMsg}`);
    return { success: false, state: current, error: errorMsg };
  }

  public static mapPageToBookingState(page: string, fallback: BookingState = 'IDLE'): BookingState {
    switch (page) {
      case 'home':
      case 'discover':
        return 'IDLE';
      case 'trains':
      case 'results':
        return 'RESULTS';
      case 'workspace':
      case 'booking':
        return 'PASSENGER_DETAILS';
      case 'payment':
        return 'PAYMENT_READY';
      case 'ticket':
      case 'completion':
        return 'TICKET_VIEW';
      default:
        return fallback;
    }
  }
}
