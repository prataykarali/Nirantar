/**
 * NIRANTAR — Nira Planner & Journey Orchestration Engine
 * ========================================================
 * Implements the State-Aware Nira architecture:
 * 1. Compact sanitized context.
 * 2. Slot-fills journey parameters (origin, destination, passengers, email delimiter).
 * 3. Domain handlers: Food yes/no, travel duration, number of stops, journey history, wallet/transactions.
 * 4. Confirmation announcements and live tracking choices.
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
    // 0A. CANCEL TRIP / CANCEL BOOKING INTENTS (ALWAYS ALLOWED)
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes('cancel trip') ||
      lower.includes('cancel booking') ||
      lower.includes('cancel my booking') ||
      lower.includes('cancel my trip') ||
      lower.includes('cancel ticket') ||
      lower.includes('stop booking') ||
      lower === 'cancel'
    ) {
      return {
        intent: 'CANCEL_TRIP',
        message: 'Your trip booking has been cancelled and saved progress has been cleared. Where would you like to travel next?',
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
    // 0B. RESET / START OVER INTENTS
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
    // 0C. SLOT FILLING: "I WANT TO BOOK A TRAIN/TICKET" (MISSING STATIONS)
    // ─────────────────────────────────────────────────────────────
    const isGenericBookingQuery =
      lower === 'i want to book a ticket' ||
      lower === 'i want to book a train' ||
      lower === 'i want to book train' ||
      lower === 'book train' ||
      lower === 'book a train' ||
      lower === 'book ticket' ||
      lower === 'book a ticket' ||
      lower === 'reserve ticket' ||
      lower === 'train booking' ||
      lower === 'ticket booking';

    const hasRouteSpecifier = lower.includes(' to ') || lower.includes(' from ') || /\b\d{5}\b/.test(lower);

    if (isGenericBookingQuery || ((lower.includes('book') || lower.includes('reserve')) && !hasRouteSpecifier && !lower.includes('payment') && !lower.includes('autofill') && !lower.includes('passenger') && !lower.includes('tatkal'))) {
      return {
        intent: 'ASK_FOR_STATIONS',
        message: "Sure! Where would you like to travel? Please tell me your **origin and destination stations** (for example: *'Delhi to Mumbai'* or *'Bengaluru to Chennai'*) or a specific train number/name.",
        actionCue: { type: 'NONE', requiresConfirmation: false },
        clarificationRequired: true,
        missingSlots: ['origin', 'destination'],
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 1. DOMAIN FEATURE: FOOD / MEALS / CATERING (YES / NO)
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes('food') ||
      lower.includes('meal') ||
      lower.includes('catering') ||
      lower.includes('lunch') ||
      lower.includes('dinner') ||
      lower.includes('breakfast') ||
      lower.includes('chai') ||
      lower.includes('tea')
    ) {
      return {
        intent: 'EXPLAIN_FOOD',
        message: `🍽️ **Food & Onboard Catering Options**:
• **Vande Bharat, Rajdhani & Shatabdi Express**: Gourmet catering (Breakfast, Lunch, Evening Snacks, Dinner) is available. You can choose **Opt-in (Yes)** or **Opt-out (No)** during booking to save on catering charges.
• **Mail / Express Trains**: Standard IRCTC pantry car services and station e-Catering deliver fresh hot meals directly to your berth.
• **Dietary Preferences**: 100% FSSAI-certified Veg, Jain Meals, and Non-Veg selections are available onboard.`,
        actionCue: { type: 'NONE', requiresConfirmation: false },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 2. DOMAIN FEATURE: TRAVEL TIME / DURATION
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes('time required') ||
      lower.includes('travel time') ||
      lower.includes('how long') ||
      lower.includes('duration') ||
      lower.includes('journey time') ||
      lower.includes('how many hours')
    ) {
      return {
        intent: 'EXPLAIN_DURATION',
        message: `⏱️ **Travel Time & Duration Breakdown**:
• **#12951 Mumbai Rajdhani (Delhi → Mumbai)**: 15 hours 40 minutes (Fastest overnight superfast)
• **#12302 Howrah Rajdhani (Delhi → Kolkata)**: 17 hours 10 minutes
• **#22436 Vande Bharat Express (Delhi → Varanasi)**: 8 hours flat
• **#20642 Vande Bharat Express (Bengaluru → Coimbatore)**: 4 hours 15 minutes
• **Express Trains (Standard)**: 18 to 26 hours depending on stops and route.`,
        actionCue: { type: 'NONE', requiresConfirmation: false },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 3. DOMAIN FEATURE: NUMBER OF STOPS / HALTS
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes('number of stops') ||
      lower.includes('how many stops') ||
      lower.includes('how many halts') ||
      lower.includes('stoppages') ||
      lower.includes('halts') ||
      lower.includes('stations in between')
    ) {
      return {
        intent: 'EXPLAIN_STOPS',
        message: `📍 **Train Stoppages & Halts Breakdown**:
• **#12951 Mumbai Rajdhani**: 6 Major Halts (Kota, Ratlam, Vadodara, Surat, Borivali, Mumbai Central)
• **#12302 Howrah Rajdhani**: 5 Major Halts (Kanpur Central, Prayagraj Jn, Pt. Deen Dayal Upadhyaya, Gaya Jn, Dhanbad Jn)
• **#22436 Vande Bharat (NDLS → BSB)**: 2 Technical Express Halts (Kanpur Central, Prayagraj Jn)
• **#20642 Vande Bharat (SBC → CBE)**: 4 Halts (Hosur, Dharmapuri, Salem, Erode, Tiruppur)`,
        actionCue: { type: 'NONE', requiresConfirmation: false },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 4. DOMAIN FEATURE: MY JOURNEY HISTORY & BOOKINGS
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes('journey history') ||
      lower.includes('my journeys') ||
      lower.includes('my journey') ||
      lower.includes('past booking') ||
      lower.includes('my bookings') ||
      lower.includes('past journey') ||
      lower.includes('ticket history')
    ) {
      return {
        intent: 'NAVIGATE_MY_JOURNEYS',
        message: 'Opening your **My Journeys** dashboard with active bookings, past trips, and DigiLocker-verified e-Tickets ready for download.',
        actionCue: {
          type: 'NAVIGATE',
          target: 'myjourneys',
          requiresConfirmation: false,
        },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 5. DOMAIN FEATURE: TRANSACTION HISTORY & CITIZEN WALLET
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes('transaction history') ||
      lower.includes('payment history') ||
      lower.includes('wallet balance') ||
      lower.includes('citizen wallet') ||
      lower.includes('my transactions') ||
      lower.includes('wallet details')
    ) {
      const balance = context.payment.walletBalance || 10000;
      return {
        intent: 'NAVIGATE_PAYMENTS',
        message: `💳 **Nirantar Citizen Virtual Wallet & Payments**:
• **Active Balance**: ₹${balance.toLocaleString('en-IN')}.00
• **Government Travel Credit**: ₹10,000.00 Pre-loaded
• **Settlement Status**: 100% Instant 1-click checkout & instant reversal on cancellation. Opening Payments history below.`,
        actionCue: {
          type: 'NAVIGATE',
          target: 'payments',
          requiresConfirmation: false,
        },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 6. MULTI-TRAIN TRACKING INTENTS & OPTIONS
    // ─────────────────────────────────────────────────────────────
    if (
      lower.includes('where is my train') ||
      lower.includes('track') ||
      lower.includes('running status') ||
      lower.includes('live status') ||
      lower.includes('gps radar')
    ) {
      return {
        intent: 'TRACK_TRAIN',
        message: `🚆 **Live High-Speed GPS Radar Telemetry (3 Active Corridors)**:
1. **#12302 Howrah Rajdhani**: Cruising at 118 km/h • Approaching Prayagraj Jn (Platform 4 • Doors Right) in 3m
2. **#12951 Mumbai Rajdhani**: Cruising at 124 km/h • 5m Before Time • Next: Vadodara Jn (Platform 2)
3. **#22436 Vande Bharat**: Cruising at 132 km/h • Right on Time • Next: Kanpur Central (Platform 1)`,
        actionCue: {
          type: 'OPEN_TRACKING',
          target: context.journey.selectedTrainNumber || '12302',
          requiresConfirmation: false,
        },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 7. CONTEXTUAL DISTRACTION QUESTIONS (DO NOT RESET APPLICATION)
    // ─────────────────────────────────────────────────────────────
    if (lower.includes('how much') || lower.includes('cost') || lower.includes('fare') || lower.includes('price')) {
      const fare = context.journey.fare || context.payment.amount || 2120;
      const train = context.journey.selectedTrainName || 'your selected train';
      return {
        intent: 'ANSWER_FARE',
        message: `The total fare for ${train} in ${context.journey.selectedClassCode || '3A'} is ₹${fare.toLocaleString('en-IN')}. Your active screen is preserved below.`,
        actionCue: { type: 'NONE', requiresConfirmation: false },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 8. RAILWAY KNOWLEDGE & DOMAIN INQUIRIES (TATKAL, CANCELLATION, PNR)
    // ─────────────────────────────────────────────────────────────
    if (lower.includes('tatkal') || lower.includes('tq')) {
      return {
        intent: 'EXPLAIN_TATKAL',
        message: `⚡ **Tatkal Quota Guidelines (IRCTC / Indian Railways)**:
• **AC Classes (2A/3A/CC/EC)**: Booking window opens daily at **10:00 AM**, 1 day before journey date.
• **Non-AC Classes (SL/2S)**: Booking window opens daily at **11:00 AM**.
• **Charges**: Extra 10% to 30% of base fare (min ₹100, max ₹500 depending on class).
• **Refund Policy**: Zero refund on cancellation of confirmed Tatkal tickets.`,
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
• **< 4 hours (Chart Prepared)**: No refund for confirmed tickets.`,
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
• For morning trains (departing before 14:00), the first chart is prepared by 20:00 previous evening.`,
        actionCue: { type: 'NONE', requiresConfirmation: false },
        source: 'SAFE_ASSIST_DETERMINISTIC',
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 9. PAYMENT FAILURE RECOVERY (EXACT USER REQUIREMENTS)
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

    // ─────────────────────────────────────────────────────────────
    // 10. TASK STACK INTERRUPTED TASK RESUME
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
    // 11. UNKNOWN / GENERAL QUESTION -> DELEGATE TO LLM
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
      case 'completion':
      case 'ticket':
      case 'myjourneys':
        return {
          intent: 'BOOKING_CONFIRMED',
          message: '🎉 Congrats! Your train seat is confirmed! PNR: #2847 5896 1234 • Seat: S5-36 (Confirmed). Your DigiLocker-verified e-Ticket is ready for download!',
          actionCue: { type: 'NONE', requiresConfirmation: false },
          source: 'SAFE_ASSIST_DETERMINISTIC',
        };
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
          message: `You are on Step 2 (Passenger & Booking Workspace) for #${context.journey.selectedTrainNumber || '12951'} ${context.journey.selectedTrainName || 'Mumbai Rajdhani'}. Please enter passenger details in the format: [Name], [Age], [Gender], [Berth], [Mobile], [Email]!`,
          actionCue: { type: 'NONE', requiresConfirmation: false },
          source: 'SAFE_ASSIST_DETERMINISTIC',
        };
      case 'payment':
        return {
          intent: 'PAYMENT_GUIDANCE',
          message: `You are at the secure payment step for ₹${context.payment.amount || 4240}. Choose your payment method or use your Nirantar Citizen Virtual Wallet (₹${context.payment.walletBalance.toLocaleString('en-IN')} balance) below.`,
          actionCue: { type: 'HIGHLIGHT', target: 'citizen-wallet-card', requiresConfirmation: false },
          source: 'SAFE_ASSIST_DETERMINISTIC',
        };
      case 'track':
        return {
          intent: 'TRACKING_GUIDANCE',
          message: `Live GPS tracking is active for #${context.tracking.activeTrainNumber || '12302'}. Next stoppage: Prayagraj Junction (Platform 4 • Doors opening on RIGHT SIDE).`,
          actionCue: { type: 'NONE', requiresConfirmation: false },
          source: 'SAFE_ASSIST_DETERMINISTIC',
        };
      default:
        return {
          intent: 'GENERAL_HELP',
          message: "I'm Nira, your state-aware journey copilot. I can search trains, auto-fill passengers, explain food & halts, or track live running status.",
          actionCue: { type: 'NONE', requiresConfirmation: false },
          source: 'SAFE_ASSIST_DETERMINISTIC',
        };
    }
  }
}
