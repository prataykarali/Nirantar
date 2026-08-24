/**
 * NIRANTAR — Typed UI Event Vocabulary
 * =====================================
 * Central event definitions for the UI Event Bus.
 * Every user action / navigation emits a typed UI event.
 */

export type NirantarEventType =
  | 'PAGE_CHANGED'
  | 'SEARCH_INITIATED'
  | 'SEARCH_COMPLETED'
  | 'TRAIN_SELECTED'
  | 'SORT_CHANGED'
  | 'FILTER_CHANGED'
  | 'BOOKING_STEP_CHANGED'
  | 'PASSENGERS_UPDATED'
  | 'AUTOFILL_TRIGGERED'
  | 'PAYMENT_STARTED'
  | 'PAYMENT_METHOD_CHANGED'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_UNKNOWN'
  | 'TICKET_OPENED'
  | 'TRACKING_STARTED'
  | 'TASK_INTERRUPTED'
  | 'TASK_RESUMED'
  | 'GUIDANCE_TRIGGERED'
  | 'NIRA_OPENED'
  | 'NIRA_CLOSED';

export interface NirantarUiEvent<T = any> {
  eventId: string;
  eventType: NirantarEventType;
  timestamp: string;
  sourcePage: string;
  payload: T;
}
