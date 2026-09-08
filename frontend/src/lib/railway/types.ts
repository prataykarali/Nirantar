/**
 * NIRANTAR GENOVATE 2.0 — Railway Telemetry & Live Data Types
 * ============================================================
 * Strictly adheres to Nirantar_GENOVATE_2_PRD_v2_REALTIME.pdf
 */

export type DataMode = 'LIVE' | 'CACHED' | 'SIMULATED';

export type TrainOperationalStatus =
  | 'running'
  | 'at_station'
  | 'scheduled'
  | 'cancelled'
  | 'unknown';

export interface NormalizedTelemetry {
  trainNumber: string;
  trainName?: string;
  status: TrainOperationalStatus;
  delayMinutes: number | null;
  latitude: number | null;
  longitude: number | null;
  speedKmh: number | null;
  bearingDegrees: number | null;
  segmentProgress: number | null; // 0 to 100 percentage between stations
  currentStationCode?: string;
  currentStationName?: string;
  nextStationCode?: string;
  nextStationName?: string;
  platform?: string | null;
  distanceToNextHaltKm?: number | null;
  providerUpdatedAt: string; // ISO string from upstream
  fetchedAt: string;         // ISO string when Nirantar fetched/normalized
  source: 'railradar' | 'mock';
  mode: DataMode;
  sourceFreshnessSeconds?: number;
  message?: string;
}

export interface StationBoardItem {
  stationCode: string;
  trainNumber: string;
  trainName: string;
  arrival: string;
  departure: string;
  platform: string;
  delayMinutes: number;
  status: 'ON_TIME' | 'DELAYED' | 'ARRIVED' | 'DEPARTED' | 'CANCELLED';
}

export interface RouteStationStop {
  code: string;
  name: string;
  platform: string;
  scheduledArr: string;
  scheduledDep: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
  haltMins: number;
}

export interface RouteGeometry {
  trainNumber: string;
  coordinates: [number, number][]; // [longitude, latitude] pairs for GeoJSON
  stops: RouteStationStop[];
  totalDistanceKm: number;
}

export interface PassengerLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number | null;
  speed?: number | null;
  nearestStationCode?: string;
  nearestStationName?: string;
  distanceToStationKm?: number;
  walkingEtaMinutes?: number;
  lastSeenAt: string;
}

export type SimulationScenario =
  | 'NORMAL'
  | 'DELAY_5'
  | 'DELAY_15'
  | 'PLATFORM_CHANGE'
  | 'HIGH_DENSITY'
  | 'CANCELLATION'
  | 'RESET';

export interface SimulationEvent {
  id: string;
  scenario: SimulationScenario;
  timestamp: string;
  title: string;
  description: string;
  payload: Record<string, any>;
}

export interface PredictionRequest {
  stationId: string;
  platformId: string | number;
  currentDensity: number;      // 0 to 100 %
  arrivingTrains: number;
  delayMinutes: number;
  horizonMinutes: number;     // 5, 10, or 15
}

export interface PredictionResponse {
  stationId: string;
  platformId: string | number;
  predictedDensity: number;
  congestionProbability: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  recommendedAction: string;
  explanation: string;
  forecastTimeSeries: Array<{
    timeMinutes: number;
    density: number;
    inflow: number;
    risk: 'Low' | 'Medium' | 'High' | 'Critical';
  }>;
  modelVersion: string;
  generatedAt: string;
}

export interface RazorpayServiceOrder {
  id: string;
  orderId: string;
  serviceId: string;
  serviceName: string;
  amount: number;       // in paise, e.g. 5000 = ₹50
  currency: string;     // 'INR'
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  passengerName: string;
  stationCode: string;
  platform: string;
  createdAt: string;
}

export interface RazorpayPaymentVerify {
  orderId: string;
  paymentId: string;
  signature: string;
  serviceId: string;
  amount: number;
}

export interface RailwayDataProvider {
  getLiveTrainStatus(trainNumber: string): Promise<NormalizedTelemetry>;
  getTrainRoute(trainNumber: string): Promise<RouteGeometry>;
  getStationBoard(stationCode: string): Promise<StationBoardItem[]>;
}
