/**
 * ═══════════════════════════════════════════════════════════════
 * NIRANTAR EXPLAIN — Context Engine
 * ═══════════════════════════════════════════════════════════════
 *
 * Takes booking/waitlist state and produces personalized
 * interpretations. All deterministic — zero LLM calls.
 */

import { getRailwayTerm, RailwayTerm } from '../data/railwayTerms';

export interface ExplainContext {
  term: string;
  currentValue?: number;    // e.g. current WL position = 6
  initialValue?: number;    // e.g. booked at WL 12
  probability?: number;     // e.g. 87%
  daysRemaining?: number;   // e.g. 4 days
  passengerName?: string;   // e.g. "Anusuya Nita"
  classCode?: string;       // e.g. "3A"
  quotaType?: string;       // e.g. "GNWL"
}

export interface ExplainOutput {
  /** Level 1: instant 2-line explanation */
  instant: { title: string; body: string };
  /** Level 2: contextual "What does this mean for me?" */
  contextual: { heading: string; body: string } | null;
  /** Level 3: advanced "How does this work?" */
  advanced: { heading: string; body: string };
  /** Recommendation if applicable */
  recommendation: string | null;
  /** Whether this involves a prediction (needs disclaimer) */
  isPrediction: boolean;
  /** The source term data */
  termData: RailwayTerm | null;
}

/**
 * Generate a 3-level explanation for a railway term with optional booking context.
 */
export function generateExplanation(ctx: ExplainContext): ExplainOutput {
  const termData = getRailwayTerm(ctx.term);

  if (!termData) {
    return {
      instant: { title: ctx.term, body: 'This railway term is not in our verified dictionary yet.' },
      contextual: null,
      advanced: { heading: 'Not Available', body: 'Detailed explanation is not available for this term.' },
      recommendation: null,
      isPrediction: false,
      termData: null,
    };
  }

  // ── Level 1: Instant ─────────────────────────────────
  const instant = {
    title: `${termData.id} = ${termData.short}`,
    body: termData.simple,
  };

  // ── Level 2: Contextual (personalized) ───────────────
  let contextual: ExplainOutput['contextual'] = null;

  const hasMovement = ctx.currentValue !== undefined && ctx.initialValue !== undefined;
  const hasProbability = ctx.probability !== undefined;
  const movement = hasMovement ? (ctx.initialValue! - ctx.currentValue!) : 0;

  if (hasMovement || hasProbability) {
    const passengerLabel = ctx.passengerName || 'You';
    const parts: string[] = [];

    if (hasMovement && movement > 0) {
      parts.push(`${passengerLabel} started at ${ctx.quotaType || termData.id} ${ctx.initialValue} and ${movement > 0 ? 'improved' : 'moved'} to ${ctx.quotaType || termData.id} ${ctx.currentValue}.`);
      parts.push(`${movement} position${movement > 1 ? 's' : ''} have cleared.`);
    } else if (hasMovement && movement === 0) {
      parts.push(`${passengerLabel}'s position has not changed yet (${ctx.quotaType || termData.id} ${ctx.currentValue}).`);
    }

    if (hasProbability) {
      parts.push(`Current estimated confirmation chance: ${ctx.probability}%.`);
    }

    if (ctx.daysRemaining !== undefined) {
      parts.push(`${ctx.daysRemaining} day${ctx.daysRemaining !== 1 ? 's' : ''} remaining before departure.`);
    }

    contextual = {
      heading: 'What does this mean for me?',
      body: parts.join('\n'),
    };
  } else {
    // Generic contextual from the term itself
    contextual = {
      heading: 'Why does this matter?',
      body: `${termData.why_it_matters}\n\n${termData.example}`,
    };
  }

  // ── Level 3: Advanced ────────────────────────────────
  const advanced = {
    heading: 'How does this work?',
    body: termData.how_it_works,
  };

  // ── Recommendation ───────────────────────────────────
  let recommendation: string | null = null;

  if (hasMovement || hasProbability) {
    const prob = ctx.probability ?? 50;
    if (prob >= 85) {
      recommendation = 'Looking good! Continue monitoring. High likelihood of confirmation.';
    } else if (prob >= 60) {
      recommendation = 'Moderate chances. Keep watching — most movement happens 24–48 hours before departure.';
    } else if (prob >= 35) {
      recommendation = 'Consider having a backup plan. Chances are below average for this route.';
    } else {
      recommendation = 'Low probability of confirmation. Consider rebooking on an alternate train or upgrading your class.';
    }
  }

  // ── Prediction flag ──────────────────────────────────
  const isPrediction = termData.category === 'prediction' || hasProbability;

  return { instant, contextual, advanced, recommendation, isPrediction, termData };
}

/**
 * Generate an "Explain My Ticket" summary for all passengers.
 * Fully deterministic — zero LLM.
 */
export interface PassengerExplainEntry {
  name: string;
  displayName: string;  // Anonymized if privacy ON
  quotaType: string;
  initialWl: number;
  currentWl: number;
  probability: number;
  positionsCleared: number;
}

export interface TicketExplanation {
  headline: string;
  overallStatus: 'positive' | 'moderate' | 'caution';
  passengerSummaries: string[];
  recommendation: string;
  disclaimer: string;
}

export function explainMyTicket(
  passengers: PassengerExplainEntry[],
  daysRemaining: number,
  privacyOn: boolean
): TicketExplanation {
  if (passengers.length === 0) {
    return {
      headline: 'No passengers found in your booking.',
      overallStatus: 'moderate',
      passengerSummaries: [],
      recommendation: 'Please check your PNR or booking reference.',
      disclaimer: '',
    };
  }

  const avgProb = Math.round(passengers.reduce((sum, p) => sum + p.probability, 0) / passengers.length);
  const totalCleared = passengers.reduce((sum, p) => sum + p.positionsCleared, 0);
  const allConfirming = passengers.every((p) => p.currentWl <= 0 || p.probability >= 90);

  const overallStatus: TicketExplanation['overallStatus'] =
    avgProb >= 80 ? 'positive' : avgProb >= 50 ? 'moderate' : 'caution';

  const statusEmoji = overallStatus === 'positive' ? '🟢' : overallStatus === 'moderate' ? '🟡' : '🟠';

  const headline = allConfirming
    ? `${statusEmoji} Your ticket is moving positively.`
    : avgProb >= 50
      ? `${statusEmoji} Your ticket has moderate confirmation chances.`
      : `${statusEmoji} Your ticket needs attention.`;

  const passengerSummaries = passengers.map((p) => {
    const name = privacyOn ? p.displayName : p.name;
    const moved = p.positionsCleared;
    return `${name}: ${p.quotaType} ${p.initialWl} → ${p.quotaType} ${p.currentWl} (${moved} cleared, ${p.probability}% est.)`;
  });

  let recommendation: string;
  if (avgProb >= 80) {
    recommendation = 'Continue monitoring. Nirantar will alert you if your status changes significantly.';
  } else if (avgProb >= 50) {
    recommendation = `Keep watching — most movement happens 24–48 hours before departure. You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining.`;
  } else {
    recommendation = 'Consider booking an alternative train as a backup. Your current chances are below average.';
  }

  return {
    headline,
    overallStatus,
    passengerSummaries,
    recommendation,
    disclaimer: 'Nirantar estimate — not an official Indian Railways guarantee.',
  };
}
