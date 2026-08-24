/**
 * NIRANTAR — Nira Planner & Journey Orchestration Engine
 * ========================================================
 * Implements the State-Aware Nira architecture:
 * 1. Builds compact sanitized context.
 * 2. Matches deterministic state-aware intents & railway knowledge base.
 * 3. Passes unknown questions through to LLM (without getting stuck in repeating greetings).
 * 4. Passes output through ActionPolicyEngine for execution.
 */

import { Station, POPULAR_STATIONS, findStation } from '../data/stationData';
import { searchTrains, TrainDetail, MOCK_TRAINS_DATABASE } from '../data/mockTrains';
import { PiiRedactor } from './PiiRedactor';
import { NirantarActionCue, ActionPolicyEngine } from '../actions/ActionPolicy';
import { BookingState } from '../state/JourneyStateMachine';

export interface NiraSanitizedContext {
  page: string;
  bookingState: BookingState;
  journey: {
    origin?: string;
    destination?: string;
    travelDate?: string;
    passengersCount: number;
    selectedTrainNumber?: string;
    selectedTrainName?: string;
    selectedClassCode?: string;
    fare?: number;
  };
  booking: {
    step: string;
    completedSteps: string[];
    pendingSteps: string[];
  };
  payment: {
    status: string;
    amount: number;
    walletBalance: number;
  };
  tracking: {
    activeTrainNumber?: string;
    currentSpeed?: number;
    nextStation?: string;
    platform?: string;
    eta?: string;
  };
  interruptedTask?: {
    hasTask: boolean;
    title?: string;
  };
  allowedActions: string[];
}

export interface NiraPlannerResponse {
  intent: string;
  message: string;
  actionCue: NirantarActionCue;
  suggestedBookingState?: BookingState;
  clarificationRequired?: boolean;
  missingSlots?: string[];
  shouldPassToLlm?: boolean;
  source: 'SAFE_ASSIST_DETERMINISTIC' | 'LLM_NVIDIA' | 'FALLBACK';
}

export class NiraPlanner {
  /**
   * Evaluates user query in the exact context of the active Journey State.
   */
  public static async planResponse(
    rawQuery: string,
    context: NiraSanitizedContext
  ): Promise<NiraPlannerResponse> {
    const cleanQuery = PiiRedactor.redact(rawQuery.trim());
    const lower = cleanQuery.toLowerCase();

    // ─────────────────────────────────────────────────────────────
    // 0. RESET / START OVER INTENTS
    // ─────────────────────────────────────────────────────────────
    if (
      lower === 'reset' ||
      lower === 'clear' ||
      lower.includes('reset journey') ||
      lower.includes('start over') ||
      lower.includes('restart') ||
      lower.includes('new search')
    ) {
      return {
        intent: 'RESET_JOURNEY',
        message: "I've reset your journey state and returned to the home search. Where would you like to travel?",
        actionCue: {
          type: 'NAVIGATE',
          target: 'home',
          requiresConfirmation: false,
        },
        suggestedBookingState: 'IDLE',
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 1. CONTEXTUAL DISTRACTION QUESTIONS (DO NOT RESET APPLICATION)
    // ─────────────────────────────────────────────────────────────
    if (lower.includes('how much') || lower.includes('cost') || lower.includes('fare') || lower.includes('price')) {
      const fare = context.journey.fare || context.payment.amount || 2120;
      const train = context.journey.selectedTrainName || 'your selected train';
      return {
        intent: 'ANSWER_FARE',
        message: `The total fare for ${train} in ${context.journey.selectedClassCode || '3A'} is ₹${fare.toLocaleString('en-IN')}. Your progress is saved below.`,
        actionCue: { type: 'NONE', requiresConfirmation: false },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    if (lower.includes('which train') || lower.includes('what train did i select') || lower.includes('selected train')) {
      const trainName = context.journey.selectedTrainName || '12951 Mumbai Rajdhani Express';
      const time = '16:55';
      return {
        intent: 'ANSWER_TRAIN_DETAILS',
        message: `You have selected #${context.journey.selectedTrainNumber || '12951'} ${trainName}, departing at ${time} from ${context.journey.origin || 'Delhi'} to ${context.journey.destination || 'Mumbai'}.`,
        actionCue: {
          type: 'HIGHLIGHT',
          target: context.journey.selectedTrainNumber ? `train_${context.journey.selectedTrainNumber}` : undefined,
          style: 'GREEN_ARROW',
          requiresConfirmation: false,
        },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 2. RAILWAY KNOWLEDGE & DOMAIN INQUIRIES (TATKAL, CANCELLATION, PNR, RULES)
    // ─────────────────────────────────────────────────────────────
    if (lower.includes('tatkal') || lower.includes('tq')) {
      return {
        intent: 'EXPLAIN_TATKAL',
        message: `⚡ **Tatkal Quota Guidelines (IRCTC / Indian Railways)**:
• **AC Classes (2A/3A/CC/EC)**: Booking window opens daily at **10:00 AM**, 1 day before journey date.
• **Non-AC Classes (SL/2S)**: Booking window opens daily at **11:00 AM**.
• **Charges**: Extra 10% to 30% of base fare (min ₹100, max ₹500 depending on class).
• **Refund Policy**: Zero refund on cancellation of confirmed Tatkal tickets.

*(Your active screen is preserved above)*`,
        actionCue: { type: 'NONE', requiresConfirmation: false },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    if (lower.includes('cancel') || lower.includes('refund')) {
      return {
        intent: 'EXPLAIN_CANCELLATION',
        message: `🎫 **Ticket Cancellation & Refund Rules**:
• **> 48 hours before departure**: Flat clerkage (₹240 for 1A/EC, ₹200 for 2A, ₹180 for 3A/CC, ₹120 for SL).
• **12 to 48 hours**: 25% deduction of total fare.
• **4 to 12 hours**: 50% deduction of total fare.
• **< 4 hours (Chart Prepared)**: No refund for confirmed tickets.

*(Your active screen is preserved above)*`,
        actionCue: { type: 'NONE', requiresConfirmation: false },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    if (lower.includes('pnr') || lower.includes('chart')) {
      return {
        intent: 'EXPLAIN_PNR',
        message: `📋 **PNR & Charting Guidelines**:
• PNR (Passenger Name Record) is a 10-digit unique booking identifier.
• Reservation charts are finalized **4 hours before departure** from train origin.
• For morning trains (departing before 14:00), the first chart is prepared by 20:00 previous evening.

*(Your active screen is preserved above)*`,
        actionCue: { type: 'NONE', requiresConfirmation: false },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    if (lower.includes('food') || lower.includes('meal') || lower.includes('catering')) {
      return {
        intent: 'EXPLAIN_FOOD',
        message: `🍽️ **Onboard Catering & Meals**:
Nirantar does not directly place onboard food orders in this prototype, but on premium trains (Rajdhani, Shatabdi, Vande Bharat), meals are provided or available via IRCTC e-Catering at major junction halts.

*(Your active screen is preserved above)*`,
        actionCue: { type: 'NONE', requiresConfirmation: false },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    if (lower.includes('what can you do') || lower.includes('help me') || lower.includes('features')) {
      return {
        intent: 'EXPLAIN_CAPABILITIES',
        message: `🤖 **Here is how I can assist your railway journey**:
1. **Find & Compare Trains**: Search 550+ routes, sort by fastest or cheapest.
2. **Safe Passenger Autofill**: Type or speak passenger names to populate forms live.
3. **Live GPS Radar**: Track train speed, next stoppage, and deboarding platform.
4. **Instant Citizen Wallet**: Use ₹10,000 pre-loaded credit for 1-click test checkout.
5. **Zero Data Loss Recovery**: Resume interrupted bookings if payments fail or you jump between tabs.`,
        actionCue: { type: 'NONE', requiresConfirmation: false },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 3. DISCOVERY COMPARISON & SORTING
    // ─────────────────────────────────────────────────────────────
    if (lower.includes('cheapest') || lower.includes('sasta')) {
      return {
        intent: 'SORT_TRAINS',
        message: 'The cheapest available option is highlighted below.',
        actionCue: {
          type: 'SET_SORT',
          parameters: { sortMode: 'cheapest' },
          target: 'train_cheapest',
          requiresConfirmation: false,
        },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    if (lower.includes('fastest') || lower.includes('jaldi')) {
      return {
        intent: 'SORT_TRAINS',
        message: 'I have sorted the schedule by travel duration with the fastest superfast train highlighted.',
        actionCue: {
          type: 'SET_SORT',
          parameters: { sortMode: 'fastest' },
          target: 'train_12951',
          requiresConfirmation: false,
        },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 4. PAYMENT FAILURE RECOVERY (EXACT USER REQUIREMENTS)
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes('transaction fail') ||
      lower.includes('payment fail') ||
      lower.includes('failed') ||
      lower.includes('retry')
    ) {
      return {
        intent: 'PAYMENT_FAILURE_RECOVERY',
        message:
          "OH no ! It seems transaction failed but ive saved your exact progress to continue ! wanna retry?",
        actionCue: {
          type: 'NAVIGATE',
          target: 'payment',
          requiresConfirmation: false,
        },
        suggestedBookingState: 'PAYMENT_FAILED',
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    if (lower.includes('where do i pay') || lower.includes('where to pay')) {
      return {
        intent: 'NAVIGATE_PAYMENT',
        message: `You are at the secure payment step! Total amount to be debited is ₹${context.payment.amount || 4240}. You can use your Nirantar Citizen Wallet (₹${context.payment.walletBalance.toLocaleString('en-IN')} balance) or UPI.`,
        actionCue: {
          type: 'HIGHLIGHT',
          target: 'citizen-wallet-card',
          requiresConfirmation: false,
        },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 5. TASK STACK INTERRUPTED TASK RESUME
    // ─────────────────────────────────────────────────────────────
    if (lower.includes('resume') || lower.includes('continue booking') || lower.includes('go back to booking')) {
      return {
        intent: 'RESUME_TASK',
        message: 'Resuming your saved booking journey with zero data loss.',
        actionCue: {
          type: 'RESUME_TASK',
          requiresConfirmation: false,
        },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 6. TRACKING REQUEST
    // ─────────────────────────────────────────────────────────────
    if (lower.includes('where is my train') || lower.includes('track') || lower.includes('running status')) {
      const trainNo = context.journey.selectedTrainNumber || '12951';
      return {
        intent: 'TRACK_TRAIN',
        message: `Live GPS Satellite Telemetry for #${trainNo}: Approaching Prayagraj Jn (Platform 4 • Doors opening on RIGHT SIDE) in 3 mins.`,
        actionCue: {
          type: 'OPEN_TRACKING',
          target: trainNo,
          requiresConfirmation: false,
        },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 7. UNKNOWN / GENERAL QUESTION -> DELEGATE TO LLM (DO NOT REPEAT GREETING)
    // ─────────────────────────────────────────────────────────────
    return {
      intent: 'PASS_THROUGH_TO_LLM',
      message: '',
      actionCue: { type: 'NONE', requiresConfirmation: false },
      shouldPassToLlm: true,
      source: 'LLM_NVIDIA',
    };
  }

  public static generateStateAwareGreeting(context: NiraSanitizedContext): NiraPlannerResponse {
    switch (context.page) {
      case 'trains':
      case 'results':
        return {
          intent: 'DISCOVERY_GUIDANCE',
          message: `Viewing trains from ${context.journey.origin || 'Delhi'} to ${context.journey.destination || 'Mumbai'}. Would you like to sort by fastest or compare prices?`,
          actionCue: { type: 'NONE', requiresConfirmation: false },
          source: 'SAFE_ASSIST_DETERMINISTIC',
        };
      case 'workspace':
      case 'booking':
        return {
          intent: 'BOOKING_GUIDANCE',
          message: `You're at the Passenger Workspace for #${context.journey.selectedTrainNumber || '12951'} ${context.journey.selectedTrainName || 'Mumbai Rajdhani'}. Tell me your passenger details or say "Autofill" to prepare details safely!`,
          actionCue: { type: 'NONE', requiresConfirmation: false },
          source: 'SAFE_ASSIST_DETERMINISTIC',
        };
      case 'payment':
        return {
          intent: 'PAYMENT_GUIDANCE',
          message: `You are at the secure payment step for ₹${context.payment.amount || 4240}. You can use your Nirantar Citizen Virtual Wallet (₹${context.payment.walletBalance.toLocaleString('en-IN')} balance) or UPI.`,
          actionCue: { type: 'HIGHLIGHT', target: 'citizen-wallet-card', requiresConfirmation: false },
          source: 'SAFE_ASSIST_DETERMINISTIC',
        };
      case 'track':
        return {
          intent: 'TRACKING_GUIDANCE',
          message: `Live GPS tracking is active for #${context.tracking.activeTrainNumber || '12951'}. Next stoppage: Prayagraj Junction (Platform 4).`,
          actionCue: { type: 'NONE', requiresConfirmation: false },
          source: 'SAFE_ASSIST_DETERMINISTIC',
        };
      default:
        return {
          intent: 'GENERAL_HELP',
          message: "I'm Nira, your state-aware journey copilot. I can search trains, live auto-fill passengers, explain fares, or track live running status.",
          actionCue: { type: 'NONE', requiresConfirmation: false },
          source: 'SAFE_ASSIST_DETERMINISTIC',
        };
    }
  }
}
