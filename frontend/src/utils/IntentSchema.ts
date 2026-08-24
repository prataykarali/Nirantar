/**
 * NIRANTAR — 3-Layer AI Architecture: Layer 3 Intent Schema & Validator
 * =====================================================================
 * Constrained 12-Intent & 10-Entity Domain Model for Responsible AI.
 *
 * Architecture Reference:
 *   - 3-Layer AI Architecture PRD
 *   - Safe Assist Rules -> LLM Layer -> Intent Validation -> Journey Engine
 */

import { Station, findStation } from '../data/stationData';

export type NirantarIntent =
  | 'SEARCH_TRAIN'
  | 'SEARCH_TRAINS'
  | 'COMPARE_TRAINS'
  | 'TRACK_TRAIN'
  | 'VIEW_TICKET'
  | 'VIEW_PAYMENT'
  | 'START_BOOKING'
  | 'BOOKING_HELP'
  | 'PAYMENT_HELP'
  | 'NAVIGATE'
  | 'AUTOFILL_HELP'
  | 'CANCEL_HELP'
  | 'GENERAL_HELP';

export const VALID_INTENTS: NirantarIntent[] = [
  'SEARCH_TRAIN',
  'SEARCH_TRAINS',
  'COMPARE_TRAINS',
  'TRACK_TRAIN',
  'VIEW_TICKET',
  'VIEW_PAYMENT',
  'START_BOOKING',
  'BOOKING_HELP',
  'PAYMENT_HELP',
  'NAVIGATE',
  'AUTOFILL_HELP',
  'CANCEL_HELP',
  'GENERAL_HELP',
];

export interface NirantarEntities {
  origin?: string;
  destination?: string;
  from?: Station | null;
  to?: Station | null;
  date?: string;
  dateLabel?: string;
  time?: string; // 'morning' | 'afternoon' | 'evening' | 'night'
  timeOfDay?: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Anytime';
  passengers?: number;
  class?: string; // '1A' | '2A' | '3A' | '3E' | 'SL' | 'CC' | 'EC' | '2S'
  budget?: 'cheap' | 'flexible' | 'premium';
  preference?: 'fastest' | 'cheapest' | 'comfort' | 'morning' | 'evening' | 'direct';
  train?: string; // train number or name e.g. '12951' | 'Rajdhani'
  trainNumber?: string;
  booking_id?: string; // PNR or booking reference
  pnr?: string;
}

export interface StructuredIntentResponse {
  intent: NirantarIntent;
  entities: NirantarEntities;
  confidence: number; // 0.0 to 1.0
  sourceLayer: 'LAYER_1_SAFE_ASSIST' | 'LAYER_2_LLM' | 'FALLBACK';
  explanation?: string; // Natural language explanation / response for the citizen
  isActionSafe: boolean;
  rawTranscript?: string;
  source?: string;
  fallbackReason?: string | null;
  uiActionCue?: {
    targetPage?: string;
    spotlightTarget?: string;
    actionPrompt?: string;
  };
}

/**
 * Validates any JSON / object output against the strict 12-intent Nirantar schema.
 */
export function validateIntentSchema(raw: any, fallbackConfidence = 0.5): StructuredIntentResponse {
  if (!raw || typeof raw !== 'object') {
    return {
      intent: 'GENERAL_HELP',
      entities: {},
      confidence: 0.1,
      sourceLayer: 'FALLBACK',
      explanation: "I'm here to help you search trains, auto-book tickets, or track live running status.",
      isActionSafe: true,
    };
  }

  // 1. Validate Intent
  let intent: NirantarIntent = 'GENERAL_HELP';
  if (typeof raw.intent === 'string') {
    const upper = raw.intent.toUpperCase().trim() as NirantarIntent;
    if (VALID_INTENTS.includes(upper)) {
      intent = upper;
    }
  }

  // 2. Validate & Sanitize 10 Constrained Entities
  const rawEntities = raw.entities || {};
  const sanitizedEntities: NirantarEntities = {};

  if (typeof rawEntities.origin === 'string' && rawEntities.origin.trim()) {
    const originStr = rawEntities.origin.trim();
    sanitizedEntities.origin = originStr;
    sanitizedEntities.from = findStation(originStr) || rawEntities.from || null;
  } else if (rawEntities.from) {
    sanitizedEntities.from = rawEntities.from;
    sanitizedEntities.origin = rawEntities.from.city;
  }

  if (typeof rawEntities.destination === 'string' && rawEntities.destination.trim()) {
    const destStr = rawEntities.destination.trim();
    sanitizedEntities.destination = destStr;
    sanitizedEntities.to = findStation(destStr) || rawEntities.to || null;
  } else if (rawEntities.to) {
    sanitizedEntities.to = rawEntities.to;
    sanitizedEntities.destination = rawEntities.to.city;
  }

  if (typeof rawEntities.date === 'string' && rawEntities.date.trim()) {
    sanitizedEntities.date = rawEntities.date.trim();
  }
  if (typeof rawEntities.dateLabel === 'string' && rawEntities.dateLabel.trim()) {
    sanitizedEntities.dateLabel = rawEntities.dateLabel.trim();
  }
  if (typeof rawEntities.time === 'string' && rawEntities.time.trim()) {
    sanitizedEntities.time = rawEntities.time.trim();
  }
  if (typeof rawEntities.timeOfDay === 'string') {
    sanitizedEntities.timeOfDay = rawEntities.timeOfDay;
  }
  if (typeof rawEntities.passengers === 'number' && !isNaN(rawEntities.passengers)) {
    sanitizedEntities.passengers = Math.min(6, Math.max(1, Math.floor(rawEntities.passengers)));
  } else if (typeof rawEntities.passengers === 'string') {
    const parsed = parseInt(rawEntities.passengers, 10);
    if (!isNaN(parsed)) sanitizedEntities.passengers = Math.min(6, Math.max(1, parsed));
  }
  if (typeof rawEntities.class === 'string' && rawEntities.class.trim()) {
    sanitizedEntities.class = rawEntities.class.trim().toUpperCase();
  }
  if (['cheap', 'flexible', 'premium'].includes(rawEntities.budget)) {
    sanitizedEntities.budget = rawEntities.budget;
  }
  if (['fastest', 'cheapest', 'comfort', 'morning', 'evening', 'direct'].includes(rawEntities.preference)) {
    sanitizedEntities.preference = rawEntities.preference;
  }
  if (typeof rawEntities.train === 'string' && rawEntities.train.trim()) {
    sanitizedEntities.train = rawEntities.train.trim();
    sanitizedEntities.trainNumber = sanitizedEntities.train;
  } else if (typeof rawEntities.trainNumber === 'string') {
    sanitizedEntities.trainNumber = rawEntities.trainNumber.trim();
    sanitizedEntities.train = sanitizedEntities.trainNumber;
  }
  if (typeof rawEntities.booking_id === 'string' && rawEntities.booking_id.trim()) {
    sanitizedEntities.booking_id = rawEntities.booking_id.trim();
    sanitizedEntities.pnr = sanitizedEntities.booking_id;
  } else if (typeof rawEntities.pnr === 'string') {
    sanitizedEntities.pnr = rawEntities.pnr.trim();
    sanitizedEntities.booking_id = sanitizedEntities.pnr;
  }

  const confidence =
    typeof raw.confidence === 'number' && !isNaN(raw.confidence)
      ? Math.max(0, Math.min(1, raw.confidence))
      : fallbackConfidence;

  const sourceLayer =
    raw.sourceLayer === 'LAYER_1_SAFE_ASSIST' || raw.sourceLayer === 'LAYER_2_LLM'
      ? raw.sourceLayer
      : 'LAYER_2_LLM';

  return {
    intent,
    entities: sanitizedEntities,
    confidence,
    sourceLayer,
    explanation: typeof raw.explanation === 'string' ? raw.explanation : undefined,
    isActionSafe: true,
    rawTranscript: raw.rawTranscript || undefined,
    source: raw.source || undefined,
    fallbackReason: raw.fallbackReason || undefined,
    uiActionCue: raw.uiActionCue && typeof raw.uiActionCue === 'object' ? raw.uiActionCue : undefined,
  };
}
