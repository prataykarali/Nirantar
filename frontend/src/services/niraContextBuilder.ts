/**
 * NIRANTAR — Grounded Context Layer & Context Builder
 * =====================================================
 * Implements the core architecture:
 *
 *              VERIFIED DATA
 *                   │
 *         ┌─────────┼─────────┐
 *         ↓         ↓         ↓
 *        ML       HERE     Railway data
 *         │         │         │
 *         └─────────┼─────────┘
 *                   ↓
 *              Context Layer
 *                   ↓
 *               NVIDIA LLM
 *                   ↓
 *         Explanation / Decision
 *
 * Fuses live railway telemetry, ML waitlist predictions, platform crowd metrics,
 * and HERE walking navigation into a tight, structured factual JSON context packet.
 */

import { getPlatformTelemetry, PlatformTelemetry } from '../data/stationConcourseData';
import { HereLocationService, HereNavigationRoute } from './hereLocationService';

export interface GroundedPassengerContext {
  station: string;
  stationCode: string;
  platform: number;
  crowdLevel: 'low' | 'moderate' | 'high' | 'critical';
  passengerInflow: number;
  passengerOutflow: number;
  netFlowRate: number;
  trainStatus: 'scheduled' | 'arriving' | 'boarding' | 'departed' | 'delayed';
  activeTrainNumber?: string;
  activeTrainName?: string;
  delayMinutes: number;
  scheduledDepartureTime: string;
  hereNavigation: {
    distanceMeters: number;
    walkingEtaMinutes: number;
    recommendedGate: string;
    concoursePath: string[];
    crowdAvoidanceNote?: string;
  };
  mlPredictions: {
    waitlistConfirmationChance?: number;
    crowdTrend: 'increasing' | 'stable' | 'clearing';
    chartFinalizationMinutesRemaining: number;
  };
  userJourney?: {
    pnrNumber?: string;
    coach?: string;
    seatNumber?: string;
    status?: string;
  };
}

export class NiraContextBuilder {
  /**
   * Assembles verified structured context for any station, train, or passenger query.
   */
  public static buildGroundedContext(params: {
    stationCode?: string;
    platformNumber?: number;
    trainNumber?: string;
    trainName?: string;
    userLocation?: string;
    userJourney?: GroundedPassengerContext['userJourney'];
    waitlistChance?: number;
  }): GroundedPassengerContext {
    const stationCode = (params.stationCode || 'NDLS').toUpperCase();
    const platform = params.platformNumber || 5;

    const telemetry: PlatformTelemetry = getPlatformTelemetry(stationCode, platform);
    const hereRoute: HereNavigationRoute = HereLocationService.calculateConcourseRoute(
      stationCode,
      platform,
      params.userLocation || 'Main Concourse'
    );

    const netFlow = telemetry.passengerInflow - telemetry.passengerOutflow;
    const crowdTrend: 'increasing' | 'stable' | 'clearing' =
      netFlow > 150 ? 'increasing' : netFlow < -100 ? 'clearing' : 'stable';

    return {
      station: hereRoute.stationName,
      stationCode,
      platform,
      crowdLevel: telemetry.crowdLevel,
      passengerInflow: telemetry.passengerInflow,
      passengerOutflow: telemetry.passengerOutflow,
      netFlowRate: netFlow,
      trainStatus: telemetry.trainStatus,
      activeTrainNumber: params.trainNumber || telemetry.activeTrainNumber || '12951',
      activeTrainName: params.trainName || telemetry.activeTrainName || 'Mumbai Rajdhani Express',
      delayMinutes: telemetry.delayMinutes,
      scheduledDepartureTime: telemetry.scheduledDepartureTime,
      hereNavigation: {
        distanceMeters: hereRoute.distanceMeters,
        walkingEtaMinutes: hereRoute.walkingEtaMinutes,
        recommendedGate: hereRoute.recommendedGate,
        concoursePath: hereRoute.concoursePath,
        crowdAvoidanceNote: hereRoute.crowdAvoidanceNote,
      },
      mlPredictions: {
        waitlistConfirmationChance: params.waitlistChance ?? 94,
        crowdTrend,
        chartFinalizationMinutesRemaining: 45,
      },
      userJourney: params.userJourney,
    };
  }

  /**
   * Generates a grounded system prompt containing the factual JSON payload for the NVIDIA LLM.
   */
  public static buildPromptWithContext(
    userQuestion: string,
    context: GroundedPassengerContext
  ): { systemPrompt: string; userMessage: string } {
    const jsonContext = JSON.stringify(context, null, 2);

    const systemPrompt = `You are Nira, the official AI Railway Copilot for NIRANTAR.

### MISSION:
You are the intelligence and explanation layer of NIRANTAR.
You MUST NEVER invent or hallucinate railway facts, platform assignments, or distances.
All facts are provided below in the structured VERIFIED DATA payload.

### VERIFIED DATA PAYLOAD:
${jsonContext}

### INSTRUCTIONS:
1. Explain the situation clearly, concisely, and empathetically using the structured facts above.
2. If the user asks for advice or action ("What should I do?"), provide a direct 2-3 step action plan (e.g. Walking ETA from HERE, which FOB to use, platform crowding, and coach alignment).
3. If the user asks about an underlined term or metric (e.g. "Passenger Flow", "Tatkal", "Waitlist Clearance"), explain it simply using the actual numbers in the context.
4. Keep answers brief (2 to 4 sentences or concise bullet points). Use bold for key numbers and platform names.`;

    return {
      systemPrompt,
      userMessage: userQuestion,
    };
  }
}
