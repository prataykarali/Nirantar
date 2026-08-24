/**
 * NIRANTAR — Journey API Client
 * ==============================
 * Typed API client for all backend journey endpoints.
 * Maps API errors to JourneyError objects with user-friendly messages.
 *
 * Architecture Reference:
 *   - Architecture Doc §14 API Layer
 *   - Development Doc §15 Backend API Design
 */

import type {
  JourneyState,
  JourneyError,
  JourneyErrorCode,
  PaymentAttempt,
  PaymentMethod,
  PaymentState,
  BookingRecord,
  TicketRecord,
  PassengerProfile,
  AuthState,
  JOURNEY_ERROR_MESSAGES,
} from '../types/journey';
import { TrainDetail } from '../data/mockTrains';
import { Station } from '../data/stationData';

import { apiBase } from '../lib/apiBase';

const API_BASE = apiBase();

// ═══════════════════════════════════════════════════════════════
// Error Mapping
// ═══════════════════════════════════════════════════════════════

function createJourneyError(
  code: JourneyErrorCode,
  serverMessage?: string
): JourneyError {
  // Import the error messages inline to avoid circular dependency
  const messages: Record<JourneyErrorCode, Omit<JourneyError, 'code'>> = {
    NO_TRAINS_FOUND: {
      whatHappened: 'No trains are available for this route on the selected date.',
      whatToDoNext: 'Try a different date, nearby station, or flexible class.',
      canRetry: true,
      severity: 'info',
    },
    INVALID_JOURNEY: {
      whatHappened: 'The journey details are incomplete or invalid.',
      whatToDoNext: 'Please check your origin, destination, and travel date.',
      canRetry: true,
      severity: 'warning',
    },
    NETWORK_ERROR: {
      whatHappened: 'We couldn\'t connect to the server.',
      whatToDoNext: 'Check your internet connection and try again. Your progress is saved.',
      canRetry: true,
      severity: 'error',
    },
    AI_UNAVAILABLE: {
      whatHappened: 'Nira\'s AI assistant is temporarily unavailable.',
      whatToDoNext: 'Continue manually using search and booking forms.',
      canRetry: true,
      severity: 'warning',
    },
    STT_UNAVAILABLE: {
      whatHappened: 'Voice input is not available.',
      whatToDoNext: 'Please type your request instead.',
      canRetry: false,
      severity: 'info',
    },
    AUTOFILL_FAILED: {
      whatHappened: 'Auto-fill couldn\'t load your saved details.',
      whatToDoNext: 'Please enter passenger details manually.',
      canRetry: true,
      severity: 'warning',
    },
    AUTH_FAILED: {
      whatHappened: 'Authentication could not be completed.',
      whatToDoNext: 'Check your credentials and try again. Booking details are preserved.',
      canRetry: true,
      severity: 'error',
    },
    PAYMENT_FAILED: {
      whatHappened: 'Your payment could not be processed.',
      whatToDoNext: 'Try again with the same or a different payment method.',
      canRetry: true,
      severity: 'error',
    },
    PAYMENT_PROCESSING: {
      whatHappened: 'Your payment is being processed.',
      whatToDoNext: 'Please wait. Do not close this page or make another payment.',
      canRetry: false,
      severity: 'info',
    },
    PAYMENT_UNKNOWN: {
      whatHappened: 'We couldn\'t confirm your payment status.',
      whatToDoNext: 'Don\'t pay again. Check payment status first.',
      canRetry: false,
      severity: 'warning',
    },
    TICKET_GENERATION_FAILED: {
      whatHappened: 'Payment succeeded but ticket generation is delayed.',
      whatToDoNext: 'Your booking is confirmed. Ticket will appear in My Journeys.',
      canRetry: true,
      severity: 'warning',
    },
    TRACKING_UNAVAILABLE: {
      whatHappened: 'Live tracking is temporarily unavailable.',
      whatToDoNext: 'Your ticket is unaffected. Try again in a few minutes.',
      canRetry: true,
      severity: 'info',
    },
  };

  const msg = messages[code];
  return {
    code,
    whatHappened: serverMessage || msg.whatHappened,
    whatToDoNext: msg.whatToDoNext,
    canRetry: msg.canRetry,
    severity: msg.severity,
  };
}

async function safeFetch<T>(
  url: string,
  options?: RequestInit,
  errorCode: JourneyErrorCode = 'NETWORK_ERROR'
): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw createJourneyError(errorCode, body?.detail || body?.message);
    }
    return res.json();
  } catch (err) {
    if ((err as JourneyError).code) throw err;
    throw createJourneyError('NETWORK_ERROR', (err as Error).message);
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. JOURNEY ENDPOINTS
// ═══════════════════════════════════════════════════════════════

export interface CreateJourneyRequest {
  originCode: string;
  destinationCode: string;
  travelDate: string;
  passengersCount: number;
  classType?: string;
  quota?: string;
}

export interface CreateJourneyResponse {
  journeyId: string;
  step: string;
  createdAt: string;
}

export async function apiCreateJourney(req: CreateJourneyRequest): Promise<CreateJourneyResponse> {
  return safeFetch<CreateJourneyResponse>(
    `${API_BASE}/journeys`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin_code: req.originCode,
        destination_code: req.destinationCode,
        travel_date: req.travelDate,
        passengers_count: req.passengersCount,
        class_type: req.classType,
        quota: req.quota,
      }),
    },
    'INVALID_JOURNEY'
  );
}

export async function apiGetJourney(journeyId: string): Promise<JourneyState> {
  return safeFetch<JourneyState>(
    `${API_BASE}/journeys/${journeyId}`,
    undefined,
    'NETWORK_ERROR'
  );
}

export async function apiAdvanceStep(journeyId: string, step: string): Promise<{ step: string }> {
  return safeFetch<{ step: string }>(
    `${API_BASE}/journeys/${journeyId}/step`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
    },
    'NETWORK_ERROR'
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. TRAIN SEARCH ENDPOINTS
// ═══════════════════════════════════════════════════════════════

export async function apiSearchTrains(
  fromCode: string,
  toCode: string,
  date?: string
): Promise<{ trains: TrainDetail[] }> {
  const params = new URLSearchParams({ from: fromCode, to: toCode });
  if (date) params.append('date', date);

  return safeFetch<{ trains: TrainDetail[] }>(
    `${API_BASE}/trains/search?${params}`,
    undefined,
    'NO_TRAINS_FOUND'
  );
}

export async function apiGetTrainDetails(trainNumber: string): Promise<TrainDetail> {
  return safeFetch<TrainDetail>(
    `${API_BASE}/trains/${trainNumber}`,
    undefined,
    'NETWORK_ERROR'
  );
}

// ═══════════════════════════════════════════════════════════════
// 3. PASSENGER ENDPOINTS
// ═══════════════════════════════════════════════════════════════

export async function apiSavePassengers(
  journeyId: string,
  passengers: PassengerProfile[]
): Promise<{ saved: boolean }> {
  return safeFetch<{ saved: boolean }>(
    `${API_BASE}/journeys/${journeyId}/passengers`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passengers }),
    },
    'NETWORK_ERROR'
  );
}

// ═══════════════════════════════════════════════════════════════
// 4. PAYMENT ENDPOINTS — Architecture Doc §11
// ═══════════════════════════════════════════════════════════════

export async function apiCreatePayment(
  journeyId: string,
  amount: number,
  method: PaymentMethod
): Promise<PaymentAttempt> {
  return safeFetch<PaymentAttempt>(
    `${API_BASE}/payments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        journey_id: journeyId,
        amount,
        method,
        idempotency_key: `${journeyId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      }),
    },
    'PAYMENT_FAILED'
  );
}

export async function apiGetPaymentStatus(paymentId: string): Promise<PaymentAttempt> {
  return safeFetch<PaymentAttempt>(
    `${API_BASE}/payments/${paymentId}`,
    undefined,
    'PAYMENT_UNKNOWN'
  );
}

/**
 * Verify an UNKNOWN payment.
 * CRITICAL: This is the ONLY way to resolve UNKNOWN state.
 * NEVER auto-retry a payment when state is UNKNOWN.
 */
export async function apiVerifyPayment(paymentId: string): Promise<PaymentAttempt> {
  return safeFetch<PaymentAttempt>(
    `${API_BASE}/payments/${paymentId}/verify`,
    { method: 'POST' },
    'PAYMENT_UNKNOWN'
  );
}

/**
 * Demo-only: Force a payment state transition for testing.
 * Not available in production.
 */
export async function apiMockPaymentResult(
  paymentId: string,
  result: 'SUCCESS' | 'FAILED' | 'UNKNOWN'
): Promise<PaymentAttempt> {
  return safeFetch<PaymentAttempt>(
    `${API_BASE}/payments/${paymentId}/mock-result`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result }),
    },
    'PAYMENT_FAILED'
  );
}

// ═══════════════════════════════════════════════════════════════
// 5. AUTHENTICATION ENDPOINTS — Architecture Doc §16
// ═══════════════════════════════════════════════════════════════

/**
 * Mock login with synthetic credentials.
 * The LLM NEVER receives these credentials.
 * They go directly to the auth service.
 */
export async function apiMockLogin(
  username: string,
  _password: string // marked with _ to emphasize: NEVER send to AI
): Promise<AuthState> {
  return safeFetch<AuthState>(
    `${API_BASE}/auth/mock-login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: _password }),
    },
    'AUTH_FAILED'
  );
}

/**
 * Mock OTP verification with synthetic values.
 * The LLM NEVER receives the OTP.
 */
export async function apiMockVerify(
  userId: string,
  _otp: string // marked with _ to emphasize: NEVER send to AI
): Promise<AuthState> {
  return safeFetch<AuthState>(
    `${API_BASE}/auth/mock-verify`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, otp: _otp }),
    },
    'AUTH_FAILED'
  );
}

export async function apiGetSession(): Promise<AuthState> {
  return safeFetch<AuthState>(
    `${API_BASE}/auth/session`,
    undefined,
    'AUTH_FAILED'
  );
}

// ═══════════════════════════════════════════════════════════════
// 6. TICKET ENDPOINTS
// ═══════════════════════════════════════════════════════════════

export async function apiGetTicket(journeyId: string): Promise<TicketRecord> {
  return safeFetch<TicketRecord>(
    `${API_BASE}/journeys/${journeyId}/ticket`,
    undefined,
    'TICKET_GENERATION_FAILED'
  );
}

// ═══════════════════════════════════════════════════════════════
// 7. MY JOURNEYS
// ═══════════════════════════════════════════════════════════════

export async function apiGetMyJourneys(userId?: string): Promise<{ journeys: JourneyState[] }> {
  const params = userId ? `?user_id=${userId}` : '';
  return safeFetch<{ journeys: JourneyState[] }>(
    `${API_BASE}/journeys${params}`,
    undefined,
    'NETWORK_ERROR'
  );
}
