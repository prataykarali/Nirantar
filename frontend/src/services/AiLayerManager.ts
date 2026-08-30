/**
 * NIRANTAR — 3-Layer AI Architecture Manager
 * ==========================================
 * Orchestrates Layer 1 (Safe Assist) -> Layer 2 (LLM Layer) -> Layer 3 (Intent Validation).
 *
 * Architecture Principles:
 *   1. Deterministic First: Keyword/regex rules run in 0ms offline.
 *   2. Constrained LLM: Only called when confidence < 0.85; outputs strict 12-intent schema.
 *   3. Zero Financial Execution: LLM never directly executes bookings or payments.
 */

import { SafeAssistParser } from '../utils/SafeAssistParser';
import { StructuredIntentResponse, validateIntentSchema, NirantarIntent } from '../utils/IntentSchema';
import { streamNiraChat } from './niraApi';

const SYSTEM_INTENT_PROMPT = `You are Nirantar's AI Intent Parser for Indian Railway services.
Your role is to analyze citizen queries (English or spoken text) and classify them into ONE of the following 12 strictly valid intents:
- SEARCH_TRAIN: Search/find trains between stations.
- COMPARE_TRAINS: Explain differences between trains, recommend best/cheapest/fastest option.
- TRACK_TRAIN: Check live train GPS running status, delays, platform numbers.
- VIEW_TICKET: Look up confirmed e-ticket or PNR status.
- VIEW_PAYMENT: Citizen asks where to pay or seeks payment button.
- START_BOOKING: Citizen wants to book a ticket, Tatkal ticket, or reserve seats.
- BOOKING_HELP: Assistance with passenger forms, quotas, or concessions.
- PAYMENT_HELP: Help regarding UPI failure, refund status, or double-verification.
- NAVIGATE: Citizen wants to navigate to a specific page.
- AUTOFILL_HELP: Help with SafeAssist passenger profile autofill.
- CANCEL_HELP: Help with ticket cancellation or refund rules.
- GENERAL_HELP: General greetings or railway questions.

Entities to extract (if present):
- origin (city/station)
- destination (city/station)
- date (e.g. 'tomorrow', 'today', '2026-08-25')
- time (e.g. 'morning', 'evening', 'night')
- passengers (integer 1-6)
- class (e.g. '1A', '2A', '3A', 'SL', 'CC')
- budget ('cheap' | 'flexible' | 'premium')
- preference ('fastest' | 'cheapest' | 'comfort')
- train (train number or name e.g. '12951' | 'Rajdhani')
- booking_id (PNR number)

IMPORTANT:
1. Always respond in JSON format with keys: { "intent": string, "entities": object, "explanation": string }.
2. "explanation" should be a friendly, concise 1-2 sentence response for the citizen.
3. NEVER assume banking credentials, NEVER attempt to execute payment.`;

export class AiLayerManager {
  /**
   * Processes citizen query through the 3-Layer AI pipeline.
   */
  public static async processQuery(
    query: string,
    onToken?: (token: string) => void
  ): Promise<StructuredIntentResponse> {
    const raw = query.trim();

    // ─────────────────────────────────────────────────────────────
    // LAYER 1: SAFE ASSIST (Deterministic Rules & Keyword Engine)
    // ─────────────────────────────────────────────────────────────
    const layer1Result = SafeAssistParser.parse(raw);
    if (layer1Result.confidence >= 0.85) {
      return layer1Result;
    }

    // ─────────────────────────────────────────────────────────────
    // LAYER 2: LLM LAYER (NVIDIA NIM / OpenAI-compatible endpoint)
    // ─────────────────────────────────────────────────────────────
    try {
      let accumulated = '';
      const prompt = `${SYSTEM_INTENT_PROMPT}\n\nCitizen Query: "${raw}"\n\nJSON Output:`;

      await new Promise<void>((resolve, reject) => {
        streamNiraChat(
          prompt,
          'en',
          (token) => {
            accumulated += token;
            if (onToken) onToken(token);
          },
          () => resolve(),
          (err) => reject(err),
          []
        );
      });

      // ─────────────────────────────────────────────────────────────
      // LAYER 3: INTENT SCHEMA VALIDATION & SANITIZATION
      // ─────────────────────────────────────────────────────────────
      // Parse JSON from LLM output
      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return validateIntentSchema({
            ...parsed,
            confidence: 0.92,
            sourceLayer: 'LAYER_2_LLM',
          });
        } catch {
          // JSON parsing failed, use fallback validation
        }
      }

      // If text explanation was streamed without strict JSON
      return validateIntentSchema({
        intent: layer1Result.intent,
        entities: layer1Result.entities,
        confidence: 0.80,
        sourceLayer: 'LAYER_2_LLM',
        explanation: accumulated.replace(/```json|```/g, '').trim(),
      });
    } catch {
      // Graceful fallback to Layer 1 result if cloud inference is unavailable
      return layer1Result;
    }
  }
}
