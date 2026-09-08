/**
 * NIRANTAR — Deterministic Mock Railway Provider
 * ===============================================
 * Generates high-fidelity simulated train telemetry adhering strictly
 * to the PRD integrity rule: "Never present simulated positions as official Indian Railways GPS."
 * All outputs have mode="SIMULATED" and source="mock".
 */

import { NormalizedTelemetry, RouteGeometry, StationBoardItem, RailwayDataProvider, SimulationScenario } from '../types';
import { STATION_COORDINATES } from '../../../data/stationGeoCoordinates';

interface RouteDefinition {
  trainNumber: string;
  trainName: string;
  stationCodes: string[];
  departureTime: string;
  arrivalTime: string;
  avgSpeedKmh: number;
}

const PRESET_ROUTES: Record<string, RouteDefinition> = {
  // 12919: Malwa SF Express (Indore - NDLS - Katra)
  '12919': {
    trainNumber: '12919',
    trainName: 'Malwa Superfast Express',
    stationCodes: ['BPL', 'VGLJ', 'GWL', 'AGC', 'MTJ', 'NDLS', 'CDG', 'JAT', 'SVDK'],
    departureTime: '12:15',
    arrivalTime: '16:30',
    avgSpeedKmh: 82,
  },
  // 12841: Coromandel Express (Howrah - Chennai)
  '12841': {
    trainNumber: '12841',
    trainName: 'Coromandel Express',
    stationCodes: ['HWH', 'KGP', 'BBS', 'PURI', 'SC', 'MAS'],
    departureTime: '15:20',
    arrivalTime: '17:00',
    avgSpeedKmh: 86,
  },
  // 12302: Howrah Rajdhani Express
  '12302': {
    trainNumber: '12302',
    trainName: 'Howrah Rajdhani Express',
    stationCodes: ['NDLS', 'CNB', 'PRYJ', 'DDU', 'GAYA', 'DHN', 'ASN', 'HWH'],
    departureTime: '16:55',
    arrivalTime: '09:55',
    avgSpeedKmh: 94,
  },
  // 12951: Mumbai Rajdhani Express
  '12951': {
    trainNumber: '12951',
    trainName: 'Mumbai Rajdhani Express',
    stationCodes: ['MMCT', 'ST', 'BRC', 'KOTA', 'NDLS'],
    departureTime: '17:00',
    arrivalTime: '08:32',
    avgSpeedKmh: 96,
  },
  // 22436: Varanasi Vande Bharat Express
  '22436': {
    trainNumber: '22436',
    trainName: 'Varanasi Vande Bharat Express',
    stationCodes: ['NDLS', 'CNB', 'PRYJ', 'BSB'],
    departureTime: '06:00',
    arrivalTime: '14:00',
    avgSpeedKmh: 105,
  },
  // 12863: Howrah - SMVB Express
  '12863': {
    trainNumber: '12863',
    trainName: 'Howrah - SMVB Superfast Express',
    stationCodes: ['HWH', 'KGP', 'BBS', 'MAS', 'SBC', 'SMVB'],
    departureTime: '23:55',
    arrivalTime: '06:45',
    avgSpeedKmh: 78,
  },
};

export class MockRailwayProvider implements RailwayDataProvider {
  private activeScenario: SimulationScenario = 'NORMAL';
  private manualDelayMinutes = 0;
  private manualPlatform: string | null = null;
  private isCancelled = false;
  private highDensityActive = false;

  public setScenario(scenario: SimulationScenario): void {
    this.activeScenario = scenario;
    switch (scenario) {
      case 'NORMAL':
      case 'RESET':
        this.manualDelayMinutes = 0;
        this.manualPlatform = null;
        this.isCancelled = false;
        this.highDensityActive = false;
        break;
      case 'DELAY_5':
        this.manualDelayMinutes = 5;
        break;
      case 'DELAY_15':
        this.manualDelayMinutes = 15;
        break;
      case 'PLATFORM_CHANGE':
        this.manualPlatform = 'Platform 2';
        break;
      case 'HIGH_DENSITY':
        this.highDensityActive = true;
        break;
      case 'CANCELLATION':
        this.isCancelled = true;
        break;
    }
  }

  public getActiveScenario(): SimulationScenario {
    return this.activeScenario;
  }

  public isHighDensity(): boolean {
    return this.highDensityActive;
  }

  /**
   * Generates deterministic simulated telemetry.
   */
  public async getLiveTrainStatus(trainNumber: string): Promise<NormalizedTelemetry> {
    const num = trainNumber.trim();
    const route = PRESET_ROUTES[num] || PRESET_ROUTES['12919'];

    // Resolve stations
    const stations = route.stationCodes.map((code) => {
      const geo = STATION_COORDINATES[code] || {
        code,
        name: code,
        latitude: 28.6,
        longitude: 77.2,
        platforms: 5,
      };
      return geo;
    });

    const totalStops = stations.length;
    const nowSec = Math.floor(Date.now() / 1000);

    // Compute progress across route using cycle time of ~120s per segment for demo
    const segmentDurationSec = 45;
    const currentSegmentIndex = Math.min(
      totalStops - 2,
      Math.floor((nowSec / segmentDurationSec) % (totalStops - 1))
    );
    const segmentProgress = ((nowSec % segmentDurationSec) / segmentDurationSec) * 100;

    const fromStation = stations[currentSegmentIndex];
    const toStation = stations[currentSegmentIndex + 1];

    // Interpolate coordinates along geodesic line
    const t = segmentProgress / 100;
    const lat = fromStation.latitude + (toStation.latitude - fromStation.latitude) * t;
    const lng = fromStation.longitude + (toStation.longitude - fromStation.longitude) * t;

    // Calculate heading/bearing
    const dLon = ((toStation.longitude - fromStation.longitude) * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos((toStation.latitude * Math.PI) / 180);
    const x =
      Math.cos((fromStation.latitude * Math.PI) / 180) * Math.sin((toStation.latitude * Math.PI) / 180) -
      Math.sin((fromStation.latitude * Math.PI) / 180) *
        Math.cos((toStation.latitude * Math.PI) / 180) *
        Math.cos(dLon);
    const bearingRad = Math.atan2(y, x);
    const bearingDegrees = Math.round(((bearingRad * 180) / Math.PI + 360) % 360);

    const speed = this.isCancelled
      ? 0
      : segmentProgress < 5 || segmentProgress > 95
      ? 24 // slowing down near station
      : route.avgSpeedKmh + (nowSec % 7) - 3;

    const currentPlatform = this.manualPlatform || (currentSegmentIndex % 2 === 0 ? 'Platform 4' : 'Platform 1');
    const delay = this.manualDelayMinutes;

    const status = this.isCancelled
      ? 'cancelled'
      : segmentProgress < 8
      ? 'at_station'
      : 'running';

    return {
      trainNumber: num,
      trainName: route.trainName,
      status,
      delayMinutes: delay,
      latitude: Math.round(lat * 10000) / 10000,
      longitude: Math.round(lng * 10000) / 10000,
      speedKmh: speed,
      bearingDegrees,
      segmentProgress: Math.round(segmentProgress),
      currentStationCode: fromStation.code,
      currentStationName: fromStation.name,
      nextStationCode: toStation.code,
      nextStationName: toStation.name,
      platform: currentPlatform,
      providerUpdatedAt: new Date(Date.now() - 6000).toISOString(),
      fetchedAt: new Date().toISOString(),
      source: 'mock',
      mode: 'SIMULATED',
      sourceFreshnessSeconds: 6,
      message: this.isCancelled
        ? 'Train service cancelled by operational control.'
        : delay > 0
        ? `Running with +${delay} min delay due to signal clearance.`
        : 'Running on time on normal schedule.',
    };
  }

  /**
   * Generates route geometry and stops.
   */
  public async getTrainRoute(trainNumber: string): Promise<RouteGeometry> {
    const num = trainNumber.trim();
    const route = PRESET_ROUTES[num] || PRESET_ROUTES['12919'];

    const stops = route.stationCodes.map((code, idx) => {
      const geo = STATION_COORDINATES[code] || {
        code,
        name: code,
        latitude: 28.6,
        longitude: 77.2,
        platforms: 5,
      };
      return {
        code: geo.code,
        name: geo.name,
        platform: `Platform ${(idx % 4) + 1}`,
        scheduledArr: `1${idx}:10`,
        scheduledDep: `1${idx}:15`,
        distanceKm: idx * 140,
        latitude: geo.latitude,
        longitude: geo.longitude,
        haltMins: 5,
      };
    });

    const coordinates: [number, number][] = stops.map((s) => [s.longitude, s.latitude]);

    return {
      trainNumber: num,
      coordinates,
      stops,
      totalDistanceKm: (stops.length - 1) * 140,
    };
  }

  /**
   * Generates live station board.
   */
  public async getStationBoard(stationCode: string): Promise<StationBoardItem[]> {
    const code = stationCode.toUpperCase();
    return [
      {
        stationCode: code,
        trainNumber: '12919',
        trainName: 'Malwa Superfast Express',
        arrival: '14:30',
        departure: '14:40',
        platform: 'Platform 4',
        delayMinutes: this.manualDelayMinutes,
        status: this.manualDelayMinutes > 0 ? 'DELAYED' : 'ON_TIME',
      },
      {
        stationCode: code,
        trainNumber: '12302',
        trainName: 'Howrah Rajdhani Express',
        arrival: '16:55',
        departure: '17:05',
        platform: 'Platform 1',
        delayMinutes: 0,
        status: 'ON_TIME',
      },
      {
        stationCode: code,
        trainNumber: '22436',
        trainName: 'Varanasi Vande Bharat',
        arrival: '06:00',
        departure: '06:10',
        platform: 'Platform 16',
        delayMinutes: 0,
        status: 'ON_TIME',
      },
    ];
  }
}

export const mockRailwayProvider = new MockRailwayProvider();
