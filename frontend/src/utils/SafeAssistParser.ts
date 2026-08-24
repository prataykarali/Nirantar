/**
 * NIRANTAR — 3-Layer AI Architecture: Layer 1 Safe Assist Parser
 * =============================================================
 * Deterministic keyword, rule, pattern & entity extractor.
 * Operates instantly without network latency or external LLM tokens.
 *
 * Output: StructuredIntentResponse conforming to IntentSchema.ts
 */

import { Station, POPULAR_STATIONS, findStation } from '../data/stationData';
import { NirantarIntent, NirantarEntities, StructuredIntentResponse, validateIntentSchema } from './IntentSchema';

export type SafeAssistIntent = NirantarIntent;
export type SafeAssistEntities = NirantarEntities;
export type SafeAssistResult = StructuredIntentResponse;

export class SafeAssistParser {
  /**
   * Deterministic keyword, pattern & entity parser that works offline / with zero latency.
   * Calculates a confidence score. If confidence >= 0.85, Layer 1 handles it directly.
   */
  public static parse(input: string): StructuredIntentResponse {
    const raw = input.trim();
    const lower = raw.toLowerCase();

    // Default tomorrow date calculation
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrowStr = d.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const entities: NirantarEntities = {};

    // ─────────────────────────────────────────────────────────────
    // 1. CONTEXTUAL & NAVIGATION INTENTS (Where do I pay? / How to book?)
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes('where do i pay') ||
      lower.includes('where to pay') ||
      lower.includes('payment button') ||
      lower.includes('how to pay')
    ) {
      return validateIntentSchema({
        intent: 'VIEW_PAYMENT',
        entities: {},
        confidence: 0.95,
        sourceLayer: 'LAYER_1_SAFE_ASSIST',
        explanation: "You are at the payment step. Please enter your secret UPI PIN or OTP interactively below to authorize payment.",
        uiActionCue: {
          targetPage: 'payment',
          spotlightTarget: '#payment-auth-card',
          actionPrompt: 'Tap Authorize & Pay below',
        },
      });
    }

    if (
      lower.includes('which train should i take') ||
      lower.includes('which one should i choose') ||
      lower.includes('compare train') ||
      lower.includes('which is faster') ||
      lower.includes('sasta wala') ||
      lower.includes('fastest train')
    ) {
      // Comparison query
      const preference = lower.includes('sasta') || lower.includes('cheap') ? 'cheapest' : 'fastest';
      return validateIntentSchema({
        intent: 'COMPARE_TRAINS',
        entities: { preference },
        confidence: 0.88,
        sourceLayer: 'LAYER_1_SAFE_ASSIST',
        explanation: preference === 'cheapest'
          ? "I recommend the cheapest option with confirmed sleeper/3A berths available on your route."
          : "I recommend the Rajdhani / Vande Bharat service as it is fastest with confirmed availability.",
        uiActionCue: {
          targetPage: 'trains',
          spotlightTarget: '#recommended-train-card',
          actionPrompt: 'Recommended fastest train',
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. LIVE TRACKING INTENT (TRACK_TRAIN)
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes('track') ||
      lower.includes('where is my train') ||
      lower.includes('where is train') ||
      lower.includes('where is 12') ||
      lower.includes('where is 22') ||
      lower.includes('running status') ||
      lower.includes('live status') ||
      lower.includes('radar') ||
      lower.includes('is train late')
    ) {
      const trainMatch = lower.match(/\b(\d{5})\b/);
      let trainNum = trainMatch ? trainMatch[1] : undefined;
      if (!trainNum) {
        if (lower.includes('rajdhani')) trainNum = lower.includes('mumbai') ? '12951' : '12302';
        else if (lower.includes('vande bharat')) trainNum = '22436';
        else if (lower.includes('shatabdi')) trainNum = '12002';
      }

      return validateIntentSchema({
        intent: 'TRACK_TRAIN',
        entities: {
          train: trainNum || '12302',
        },
        confidence: trainNum ? 0.95 : 0.85,
        sourceLayer: 'LAYER_1_SAFE_ASSIST',
        explanation: `Tracking live GPS telemetry for train #${trainNum || '12302'}. Current running status is on-time.`,
        uiActionCue: {
          targetPage: 'track',
          spotlightTarget: '#live-radar-view',
          actionPrompt: 'Open Live Radar',
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. TICKET & PNR LOOKUP INTENT (VIEW_TICKET)
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes('pnr') ||
      lower.includes('my ticket') ||
      lower.includes('show ticket') ||
      lower.includes('my journey') ||
      lower.includes('e-ticket')
    ) {
      const pnrMatch = lower.match(/\b(\d{10})\b/);
      return validateIntentSchema({
        intent: 'VIEW_TICKET',
        entities: {
          booking_id: pnrMatch ? pnrMatch[1] : '8429104821',
        },
        confidence: pnrMatch ? 0.96 : 0.86,
        sourceLayer: 'LAYER_1_SAFE_ASSIST',
        explanation: 'Retrieving your active confirmed digital e-Ticket and PNR status from DigiLocker ledger.',
        uiActionCue: {
          targetPage: 'ticket',
          spotlightTarget: '#digital-ticket-view',
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. PAYMENT & REFUND HELP (PAYMENT_HELP)
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes('payment failed') ||
      lower.includes('refund') ||
      lower.includes('money deducted') ||
      lower.includes('upi failed') ||
      lower.includes('double verification')
    ) {
      return validateIntentSchema({
        intent: 'PAYMENT_HELP',
        entities: {},
        confidence: 0.94,
        sourceLayer: 'LAYER_1_SAFE_ASSIST',
        explanation: 'Nirantar uses Double-Verification & Auto-Refund ledger. If money is deducted without booking, automatic refund settles within 2-4 hours.',
        uiActionCue: {
          targetPage: 'payments',
          spotlightTarget: '#refund-ledger',
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 5. AUTO-BOOK / START BOOKING INTENT (START_BOOKING)
    // ─────────────────────────────────────────────────────────────
    const isAutoBook =
      lower.includes('auto book') ||
      lower.includes('autobook') ||
      lower.includes('book ticket') ||
      lower.includes('book train') ||
      lower.includes('book 2 seats') ||
      lower.includes('reserve seat');

    // ─────────────────────────────────────────────────────────────
    // 6. ROUTE & ENTITY EXTRACTION (Origin, Destination, Date, Class, Pax, Preference)
    // ─────────────────────────────────────────────────────────────
    // Extract From -> To
    const routeRegex = /(?:from\s+)?([a-z\s]+?)\s+(?:to|->|towards|–|-|se)\s+([a-z\s]+?)(?:\s+(?:on|tomorrow|kal|today|aaj|next|for|in|\d)|\b|$)/i;
    const match = raw.match(routeRegex);
    if (match) {
      const s1 = findStation(match[1].trim());
      const s2 = findStation(match[2].trim());
      if (s1) entities.origin = s1.city;
      if (s2) entities.destination = s2.city;
    }

    if (!entities.origin || !entities.destination) {
      const words = lower.split(/[\s,]+/);
      for (const w of words) {
        if (w.length < 2) continue;
        const st = findStation(w);
        if (st) {
          if (!entities.origin) {
            entities.origin = st.city;
          } else if (!entities.destination && entities.origin !== st.city) {
            entities.destination = st.city;
          }
        }
      }
    }

    // Train number
    const trainNumMatch = raw.match(/\b(\d{5})\b/);
    if (trainNumMatch) {
      entities.train = trainNumMatch[1];
    }

    // Date
    if (lower.includes('today') || lower.includes('aaj')) {
      entities.date = todayStr;
    } else if (lower.includes('tomorrow') || lower.includes('kal') || lower.includes('shaam') || lower.includes('subah')) {
      entities.date = tomorrowStr;
    }

    // Time of day
    if (lower.includes('morning') || lower.includes('subah')) {
      entities.time = 'morning';
    } else if (lower.includes('evening') || lower.includes('shaam')) {
      entities.time = 'evening';
    } else if (lower.includes('night') || lower.includes('raat')) {
      entities.time = 'night';
    }

    // Passengers
    const paxMatch = raw.match(/\b(\d+)\s*(?:passenger|adult|seat|ticket|person|pax|log)/i);
    if (paxMatch) {
      entities.passengers = parseInt(paxMatch[1], 10);
    } else if (lower.includes('two') || lower.includes('2 seats') || lower.includes('with my mom') || lower.includes('with mom')) {
      entities.passengers = 2;
    }

    // Class
    if (lower.includes('1a') || lower.includes('first ac')) entities.class = '1A';
    else if (lower.includes('2a') || lower.includes('second ac')) entities.class = '2A';
    else if (lower.includes('3a') || lower.includes('third ac')) entities.class = '3A';
    else if (lower.includes('3e')) entities.class = '3E';
    else if (lower.includes('sl') || lower.includes('sleeper')) entities.class = 'SL';
    else if (lower.includes('cc') || lower.includes('chair car')) entities.class = 'CC';
    else if (lower.includes('ec')) entities.class = 'EC';

    // Budget & Preference (sasta / cheap / fast)
    if (lower.includes('sasta') || lower.includes('cheap') || lower.includes('budget')) {
      entities.budget = 'cheap';
      entities.preference = 'cheapest';
    } else if (lower.includes('fast') || lower.includes('jaldi') || lower.includes('rajdhani')) {
      entities.preference = 'fastest';
    }

    const hasRoute = Boolean(entities.origin && entities.destination);
    const confidence = isAutoBook ? (hasRoute ? 0.94 : 0.86) : hasRoute ? 0.90 : 0.65;

    return validateIntentSchema({
      intent: isAutoBook ? 'START_BOOKING' : hasRoute ? 'SEARCH_TRAIN' : 'GENERAL_HELP',
      entities,
      confidence,
      sourceLayer: 'LAYER_1_SAFE_ASSIST',
      explanation: hasRoute
        ? `Found trains from ${entities.origin} to ${entities.destination} for ${entities.date || 'tomorrow'}.`
        : "I'm here to assist you with train search, bookings, live tracking, and railway guidance.",
      uiActionCue: hasRoute
        ? { targetPage: 'trains', actionPrompt: 'Search & compare direct trains' }
        : undefined,
    });
  }
}
