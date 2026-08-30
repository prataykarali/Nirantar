/**
 * NIRANTAR — Central Journey Domain Types
 * ========================================
 * Single source-of-truth for the entire citizen journey state.
 * Every page component consumes these types via JourneyContext.
 *
 * Architecture Reference:
 *   - PRD §6 Journey State Machine
 *   - Architecture Doc §10 Continuous Booking
 *   - Architecture Doc §11 Payment State Machine
 *   - Development Doc §5 Core Domain Model
 */

import { Station } from '../data/stationData';
import { TrainDetail } from '../data/mockTrains';

// ═══════════════════════════════════════════════════════════════
// 1. JOURNEY STEP — matches PRD §6 state machine
// ═══════════════════════════════════════════════════════════════

export type JourneyStep =
  | 'DISCOVER'
  | 'SEARCHED'
  | 'TRAIN_SELECTED'
  | 'PASSENGER_REVIEW'
  | 'AUTH_REQUIRED'
  | 'AUTHENTICATED'
  | 'PAYMENT_READY'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_UNKNOWN'
  | 'PAYMENT_VERIFYING'
  | 'TICKET_ISSUED'
  | 'TRACKING';

// Valid step transitions — enforced by advanceStep()
export const VALID_STEP_TRANSITIONS: Record<JourneyStep, JourneyStep[]> = {
  DISCOVER: ['SEARCHED'],
  SEARCHED: ['TRAIN_SELECTED', 'DISCOVER'],
  TRAIN_SELECTED: ['PASSENGER_REVIEW', 'SEARCHED'],
  PASSENGER_REVIEW: ['AUTH_REQUIRED', 'TRAIN_SELECTED'],
  AUTH_REQUIRED: ['AUTHENTICATED', 'PASSENGER_REVIEW'],
  AUTHENTICATED: ['PAYMENT_READY'],
  PAYMENT_READY: ['PAYMENT_PROCESSING'],
  PAYMENT_PROCESSING: ['PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_UNKNOWN'],
  PAYMENT_SUCCESS: ['TICKET_ISSUED'],
  PAYMENT_FAILED: ['PAYMENT_READY', 'PASSENGER_REVIEW'],
  PAYMENT_UNKNOWN: ['PAYMENT_VERIFYING'],
  PAYMENT_VERIFYING: ['PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_UNKNOWN'],
  TICKET_ISSUED: ['TRACKING'],
  TRACKING: [],
};

// ═══════════════════════════════════════════════════════════════
// 2. PAYMENT STATE MACHINE — Architecture Doc §11
// ═══════════════════════════════════════════════════════════════

export type PaymentState =
  | 'READY'
  | 'INITIATED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'UNKNOWN'
  | 'VERIFYING'
  | 'BOOKING_CONFIRMED';

export type PaymentMethod = 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET';

export interface PaymentAttempt {
  id: string;
  journeyId: string;
  amount: number;
  method: PaymentMethod;
  state: PaymentState;
  idempotencyKey: string;
  transactionRef: string | null;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// 3. AUTHENTICATION STATE — Architecture Doc §16
// ═══════════════════════════════════════════════════════════════

export type AuthStatus = 'READY' | 'VERIFYING' | 'VERIFIED' | 'FAILED';

export interface AuthState {
  status: AuthStatus;
  userId: string | null;
  displayName: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isAuthenticated: boolean;
  failureReason: string | null;
}

// ═══════════════════════════════════════════════════════════════
// 4. PASSENGER PROFILE — Development Doc §5
// ═══════════════════════════════════════════════════════════════

export interface PassengerProfile {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  berthPreference: 'LOWER' | 'MIDDLE' | 'UPPER' | 'SIDE_LOWER' | 'SIDE_UPPER' | 'NO_PREFERENCE';
  assignedClassCode?: string;
  seniorCitizenConcession?: boolean;
  idProofType?: string;
  nationality?: string;
}

// ═══════════════════════════════════════════════════════════════
// 5. BOOKING & TICKET — Development Doc §5
// ═══════════════════════════════════════════════════════════════

export interface SeatAllotment {
  coach: string;
  seatNumber: number;
  berthType: string;
}

export interface BookingRecord {
  bookingId: string;
  journeyId: string;
  bookingReference: string;
  pnrNumber: string;
  trainNumber: string;
  trainName: string;
  classCode: string;
  passengerName?: string;
  status: 'CONFIRMED' | 'RAC' | 'WAITLIST' | 'CANCELLED';
  seatAllotment: SeatAllotment | null;
  createdAt: string;
}

export interface TicketRecord {
  ticketId: string;
  journeyId: string;
  bookingReference: string;
  pnrNumber: string;
  train: TrainDetail;
  classCode: string;
  passengers: PassengerProfile[];
  seatAllotments: SeatAllotment[];
  travelDate: string;
  origin: Station;
  destination: Station;
  status: 'ACTIVE' | 'USED' | 'CANCELLED';
  issuedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// 6. CENTRAL JOURNEY STATE — the single state object
// ═══════════════════════════════════════════════════════════════

export interface JourneyState {
  // Identity
  journeyId: string | null;
  userId: string | null;

  // Current position in the flow
  step: JourneyStep;

  // Search parameters (persist throughout)
  origin: Station | null;
  destination: Station | null;
  travelDate: string;
  passengersCount: number;
  classType: string;
  quota: string;

  // Train selection
  availableTrains: TrainDetail[];
  selectedTrain: TrainDetail | null;
  selectedClassCode: string;

  // Passengers
  passengers: PassengerProfile[];

  // Authentication
  authState: AuthState;

  // Payment
  paymentState: PaymentState;
  paymentAttempt: PaymentAttempt | null;

  // Booking & Ticket
  booking: BookingRecord | null;
  ticket: TicketRecord | null;

  // Error handling
  error: JourneyError | null;

  // Loading states
  isLoading: boolean;
  loadingMessage: string | null;
}

// ═══════════════════════════════════════════════════════════════
// 7. ERROR TYPES — 12 realistic failure states
// ═══════════════════════════════════════════════════════════════

export type JourneyErrorCode =
  | 'NO_TRAINS_FOUND'
  | 'INVALID_JOURNEY'
  | 'NETWORK_ERROR'
  | 'AI_UNAVAILABLE'
  | 'STT_UNAVAILABLE'
  | 'AUTOFILL_FAILED'
  | 'AUTH_FAILED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_UNKNOWN'
  | 'TICKET_GENERATION_FAILED'
  | 'TRACKING_UNAVAILABLE';

export interface JourneyError {
  code: JourneyErrorCode;
  whatHappened: string;
  whatToDoNext: string;
  canRetry: boolean;
  severity: 'warning' | 'error' | 'info';
}

/** Human-readable error messages for every failure state */
export const JOURNEY_ERROR_MESSAGES: Record<JourneyErrorCode, Omit<JourneyError, 'code'>> = {
  NO_TRAINS_FOUND: {
    whatHappened: 'No trains are available for this route on the selected date.',
    whatToDoNext: 'Try a different date, nearby station, or flexible class. You can also ask Nira for route suggestions.',
    canRetry: true,
    severity: 'info',
  },
  INVALID_JOURNEY: {
    whatHappened: 'The journey details are incomplete or invalid.',
    whatToDoNext: 'Please check your origin, destination, and travel date. Both stations must be different.',
    canRetry: true,
    severity: 'warning',
  },
  NETWORK_ERROR: {
    whatHappened: 'We couldn\'t connect to the server. This might be a temporary network issue.',
    whatToDoNext: 'Check your internet connection and try again. Your journey progress has been saved.',
    canRetry: true,
    severity: 'error',
  },
  AI_UNAVAILABLE: {
    whatHappened: 'Nira\'s AI assistant is temporarily unavailable.',
    whatToDoNext: 'You can continue your journey manually using the search and booking forms. All features work without AI.',
    canRetry: true,
    severity: 'warning',
  },
  STT_UNAVAILABLE: {
    whatHappened: 'Voice input is not available on this device or browser.',
    whatToDoNext: 'Please type your request instead. You can search for trains using the text input above.',
    canRetry: false,
    severity: 'info',
  },
  AUTOFILL_FAILED: {
    whatHappened: 'We couldn\'t auto-fill your passenger details from your saved profile.',
    whatToDoNext: 'Please enter passenger details manually. Your saved information may need to be updated.',
    canRetry: true,
    severity: 'warning',
  },
  AUTH_FAILED: {
    whatHappened: 'Authentication could not be completed. The credentials may be incorrect.',
    whatToDoNext: 'Please check your username and verification code, then try again. Your booking details are preserved.',
    canRetry: true,
    severity: 'error',
  },
  PAYMENT_FAILED: {
    whatHappened: 'Your payment could not be processed.',
    whatToDoNext: 'You can try again with the same or a different payment method. No amount has been deducted.',
    canRetry: true,
    severity: 'error',
  },
  PAYMENT_PROCESSING: {
    whatHappened: 'Your payment is being processed. This may take a moment.',
    whatToDoNext: 'Please wait while we confirm your transaction. Do not close this page or make another payment.',
    canRetry: false,
    severity: 'info',
  },
  PAYMENT_UNKNOWN: {
    whatHappened: 'We couldn\'t confirm your payment status yet. Your money may or may not have been deducted.',
    whatToDoNext: 'Don\'t pay again. Use "Check Payment Status" to verify your transaction before making another attempt.',
    canRetry: false,
    severity: 'warning',
  },
  TICKET_GENERATION_FAILED: {
    whatHappened: 'Your payment was successful but we couldn\'t generate your ticket immediately.',
    whatToDoNext: 'Don\'t worry — your booking is confirmed. The ticket will appear in "My Journeys" shortly. You can also contact support.',
    canRetry: true,
    severity: 'warning',
  },
  TRACKING_UNAVAILABLE: {
    whatHappened: 'Live train tracking information is temporarily unavailable.',
    whatToDoNext: 'Your ticket and booking are unaffected. Try refreshing in a few minutes, or check the station departure board.',
    canRetry: true,
    severity: 'info',
  },
};

// ═══════════════════════════════════════════════════════════════
// 8. AI CONTEXT SAFETY — Architecture Doc §15, §18
// ═══════════════════════════════════════════════════════════════

/**
 * Fields that Nira AI is ALLOWED to receive.
 * Everything else is BLOCKED BY DESIGN.
 *
 * Per PRD: "The important claim isn't 'We promise the AI won't leak credentials',
 * but 'The AI never receives the credentials.' That is much stronger."
 */
export interface NiraSafeContext {
  // Session (non-sensitive)
  isAuthenticated: boolean;
  journeyId: string | null;
  currentStep: JourneyStep;
  currentPage: string;

  // Journey (non-sensitive)
  originCity: string | null;
  originCode: string | null;
  destinationCity: string | null;
  destinationCode: string | null;
  travelDate: string | null;
  passengersCount: number;
  classPreference: string | null;

  // Train (deterministic data only)
  selectedTrainNumber: string | null;
  selectedTrainName: string | null;
  selectedClassName: string | null;

  // Payment status (not secrets)
  paymentStatus: PaymentState | null;
  bookingStatus: string | null;
}

/**
 * Fields that MUST NEVER be sent to Nira AI.
 * This type exists for documentation and compile-time awareness.
 */
export interface NiraBlockedFields {
  password: never;
  otp: never;
  upiPin: never;
  cvv: never;
  cardNumber: never;
  bankCredentials: never;
  authToken: never;
  sessionCookie: never;
  aadhaarNumber: never;
  panNumber: never;
}

// ═══════════════════════════════════════════════════════════════
// 9. INITIAL STATE FACTORY
// ═══════════════════════════════════════════════════════════════

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

export const createInitialJourneyState = (): JourneyState => ({
  journeyId: null,
  userId: null,
  step: 'DISCOVER',
  origin: null,
  destination: null,
  travelDate: tomorrow.toISOString().split('T')[0],
  passengersCount: 1,
  classType: 'All Classes',
  quota: 'General (GN)',
  availableTrains: [],
  selectedTrain: null,
  selectedClassCode: '3A',
  passengers: [],
  authState: {
    status: 'READY',
    userId: null,
    displayName: null,
    isAuthenticated: false,
    failureReason: null,
  },
  paymentState: 'READY',
  paymentAttempt: null,
  booking: null,
  ticket: null,
  error: null,
  isLoading: false,
  loadingMessage: null,
});
