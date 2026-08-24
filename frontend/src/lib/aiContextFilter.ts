/**
 * NIRANTAR — AI Context Safety Filter
 * ====================================
 * Ensures Nira AI NEVER receives sensitive data.
 *
 * Architecture Rule (PRD §4, Architecture Doc §15):
 *   "The AI never receives the credentials."
 *   AI context ≠ credential context ≠ payment-secret context.
 *
 * This module provides a single function that extracts ONLY
 * the safe context fields from the full JourneyState.
 */

import type { JourneyState, NiraSafeContext } from '../types/journey';

/**
 * Extract only the fields that Nira AI is permitted to see.
 * Everything else (passwords, OTPs, PINs, CVVs, tokens) is
 * structurally excluded — the AI never receives them because
 * they never exist in this output type.
 */
export function extractNiraSafeContext(
  state: JourneyState,
  currentPage: string
): NiraSafeContext {
  return {
    // Session (non-sensitive)
    isAuthenticated: state.authState.isAuthenticated,
    journeyId: state.journeyId,
    currentStep: state.step,
    currentPage,

    // Journey (non-sensitive)
    originCity: state.origin?.city ?? null,
    originCode: state.origin?.code ?? null,
    destinationCity: state.destination?.city ?? null,
    destinationCode: state.destination?.code ?? null,
    travelDate: state.travelDate || null,
    passengersCount: state.passengersCount,
    classPreference: state.classType || null,

    // Train (deterministic data only — no fares in AI context)
    selectedTrainNumber: state.selectedTrain?.trainNumber ?? null,
    selectedTrainName: state.selectedTrain?.trainName ?? null,
    selectedClassName: state.selectedClassCode || null,

    // Payment status (not secrets)
    paymentStatus: state.paymentState || null,
    bookingStatus: state.booking?.status ?? null,
  };
}

/**
 * Validate that a payload intended for AI does not contain
 * any blocked sensitive fields. Returns true if safe.
 *
 * This is a defense-in-depth check — the primary protection
 * is structural (NiraSafeContext type), but this runtime check
 * catches any accidental leakage.
 */
const BLOCKED_PATTERNS = [
  'password', 'otp', 'upiPin', 'upi_pin', 'cvv', 'cardNumber',
  'card_number', 'bankCredential', 'bank_credential', 'authToken',
  'auth_token', 'sessionCookie', 'session_cookie', 'accessToken',
  'access_token', 'aadhaar', 'pan_number', 'panNumber', 'pin',
  'secret', 'credential', 'bearer',
];

export function validateAiPayloadSafety(payload: Record<string, unknown>): {
  safe: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const jsonStr = JSON.stringify(payload).toLowerCase();

  for (const pattern of BLOCKED_PATTERNS) {
    if (jsonStr.includes(pattern.toLowerCase())) {
      violations.push(pattern);
    }
  }

  return {
    safe: violations.length === 0,
    violations,
  };
}
