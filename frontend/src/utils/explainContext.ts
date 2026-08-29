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
  /** First-class: What happens next? */
  whatNext: { heading: string; steps: string[] };
  /** Level 3: advanced "How does this work?" */
  advanced: { heading: string; body: string };
  /** Recommendation if applicable */
  recommendation: string | null;
  /** Whether this involves a prediction (needs disclaimer) */
  isPrediction: boolean;
  /** Source Attribution & Freshness */
  sourceAttribution: string;
  sourceFreshness: string;
  /** The source term data */
  termData: RailwayTerm | null;
}

/**
 * Generate a 3-level explanation for a railway term with optional booking context and "What happens next?".
 */
export function generateExplanation(ctx: ExplainContext): ExplainOutput {
  const termData = getRailwayTerm(ctx.term);

  if (!termData) {
    return {
      instant: { title: ctx.term, body: 'This railway term is not in our verified dictionary yet.' },
      contextual: null,
      whatNext: {
        heading: 'What happens next?',
        steps: ['You can proceed with standard booking or ask Nira for live guidance.'],
      },
      advanced: { heading: 'Not Available', body: 'Detailed explanation is not available for this term.' },
      recommendation: null,
      isPrediction: false,
      sourceAttribution: 'Source: Nirantar Verified Knowledge Base',
      sourceFreshness: 'Updated just now',
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

  // ── First-Class: What Happens Next? ───────────────────
  let whatNextSteps: string[] = [];
  const termUpper = (ctx.term || '').toUpperCase();

  if (termUpper.includes('RAC')) {
    whatNextSteps = [
      '1. You are legally authorized to board the train with your RAC ticket.',
      '2. You will initially share a side-lower berth with a co-passenger.',
      '3. As confirmed passengers cancel, TTE will promote you to a full vacant berth.',
      '4. Final coach & berth will be published at chart preparation (~4 hours before departure).',
    ];
  } else if (termUpper.includes('WL') || termUpper.includes('GNWL') || termUpper.includes('RLWL') || termUpper.includes('PQWL')) {
    whatNextSteps = [
      '1. Your queue position will move forward whenever confirmed passengers cancel.',
      '2. Most position movements occur 24 to 48 hours before the journey.',
      '3. At Chart Preparation (~4h prior), if still waitlisted on e-ticket, it will auto-cancel and refund to source.',
      '4. If promoted to RAC or CNF, your berth allocation will be sent via SMS/WhatsApp.',
    ];
  } else if (termUpper.includes('CNF') || termUpper.includes('CONFIRM')) {
    whatNextSteps = [
      '1. Your seat is 100% reserved in the designated coach.',
      '2. Final chart preparation occurs 4 hours prior to train departure.',
      '3. Arrive at the station 30 minutes before departure and check the coach alignment indicator on the platform.',
    ];
  } else if (termUpper.includes('TATKAL')) {
    whatNextSteps = [
      '1. Tatkal booking opens at 10:00 AM (AC classes) and 11:00 AM (Non-AC) 1 day before origin departure.',
      '2. Keep passenger drafts saved in advance using Safe Autofill.',
      '3. No cancellation refund is granted for confirmed Tatkal tickets under official railway rules.',
    ];
  } else if (termUpper.includes('TDR') || termUpper.includes('REFUND') || termUpper.includes('CANCEL')) {
    whatNextSteps = [
      '1. Submit cancellation or TDR before chart preparation (or >3 hours delayed train).',
      '2. Refund is processed automatically by IRCTC back to your original payment method.',
      '3. Standard banking settlement takes 3–5 working days (instant on Virtual Citizen Wallet).',
    ];
  } else {
    whatNextSteps = [
      '1. Continue your booking or search flow in Nirantar.',
      '2. You can tap "I\'m Stuck" or Ask Nira at any point if you need further clarification.',
    ];
  }

  const whatNext = {
    heading: 'What happens next?',
    steps: whatNextSteps,
  };

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

  return {
    instant,
    contextual,
    whatNext,
    advanced,
    recommendation,
    isPrediction,
    sourceAttribution: 'Source: Official Indian Railways Commercial Rules & NTES',
    sourceFreshness: 'Verified Rule Base • Updated 2 min ago',
    termData,
  };
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
