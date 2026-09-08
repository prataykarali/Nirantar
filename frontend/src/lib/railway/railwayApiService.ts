/**
 * NIRANTAR — Central Railway API Service & State Machine
 * ========================================================
 * Implements the full PRD v2 flow:
 *   Browser -> /api/trains/:id/live (or client provider) -> cache -> deduplication -> normalize
 *   Fallback chain: LIVE -> CACHED -> SIMULATED
 *   Integrity guarantee: Never fake LIVE; clearly tag every output.
 */

import { NormalizedTelemetry, RouteGeometry, StationBoardItem, SimulationScenario, DataMode } from './types';
import { RailRadarProvider } from './providers/railRadarProvider';
import { mockRailwayProvider, MockRailwayProvider } from './providers/mockProvider';
import { railwayCache } from './cache';

export class RailwayApiService {
  private static instance: RailwayApiService;
  private railRadarProvider: RailRadarProvider;
  private mockProvider: MockRailwayProvider;
  private preferSimulation = false;
  private listeners: Set<(telemetry: NormalizedTelemetry) => void> = new Set();

  constructor() {
    this.railRadarProvider = new RailRadarProvider();
    this.mockProvider = mockRailwayProvider;
  }

  public static getInstance(): RailwayApiService {
    if (!RailwayApiService.instance) {
      RailwayApiService.instance = new RailwayApiService();
    }
    return RailwayApiService.instance;
  }

  public setPreferSimulation(enabled: boolean): void {
    this.preferSimulation = enabled;
  }

  public isPreferSimulation(): boolean {
    return this.preferSimulation;
  }

  public setRailRadarApiKey(key: string): void {
    this.railRadarProvider.setApiKey(key);
  }

  public subscribe(callback: (telemetry: NormalizedTelemetry) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(telemetry: NormalizedTelemetry): void {
    this.listeners.forEach((fn) => {
      try {
        fn(telemetry);
      } catch (err) {
        console.error('Telemetry subscriber error:', err);
      }
    });
  }

  /**
   * Retrieves live train running telemetry with full fallback resilience:
   * 1. Check in-memory cache
   * 2. Try RailRadar API (direct or via backend /api/trains/[number]/live)
   * 3. On 429/503/error, return last good CACHED response with timestamp
   * 4. If no cache, return SIMULATED demo response
   */
  public async getLiveTrainStatus(
    trainNumber = '12919',
    forceLive = false
  ): Promise<NormalizedTelemetry> {
    const cleanNumber = trainNumber.trim() || '12919';
    const cacheKey = railwayCache.getLiveKey(cleanNumber);

    // If explicit simulation mode is on, bypass upstream
    if (this.preferSimulation) {
      const simulated = await this.mockProvider.getLiveTrainStatus(cleanNumber);
      this.notify(simulated);
      return simulated;
    }

    // 1. Check cache first unless forceLive
    if (!forceLive) {
      const cached = railwayCache.get<NormalizedTelemetry>(cacheKey);
      if (cached) {
        const freshness = Math.max(0, Math.round((Date.now() - new Date(cached.fetchedAt).getTime()) / 1000));
        return {
          ...cached,
          sourceFreshnessSeconds: freshness,
        };
      }
    }

    // 2. Execute deduplicated fetch
    return railwayCache.deduplicate(cacheKey, async () => {
      try {
        let telemetry: NormalizedTelemetry | null = null;

        // Try backend proxy first if in browser environment
        if (typeof window !== 'undefined') {
          try {
            const proxyRes = await fetch(`/api/trains/${cleanNumber}/live`, {
              signal: AbortSignal.timeout(6000),
            });
            if (proxyRes.ok) {
              telemetry = await proxyRes.json();
            }
          } catch {
            // Backend proxy failed or not hosted; proceed to direct provider
          }
        }

        // Try direct RailRadar provider if proxy didn't return
        if (!telemetry && this.railRadarProvider.hasKey()) {
          telemetry = await this.railRadarProvider.getLiveTrainStatus(cleanNumber);
        }

        if (telemetry && telemetry.mode === 'LIVE') {
          // Success! Save to cache and record last known good
          railwayCache.set(cacheKey, telemetry, 25); // 25 second TTL
          railwayCache.recordLastGood(cleanNumber, telemetry);
          this.notify(telemetry);
          return telemetry;
        }

        // Upstream didn't succeed; throw to trigger fallback
        throw new Error('PROVIDER_UNAVAILABLE: No direct live telemetry returned.');
      } catch (err: any) {
        // 3. Fallback: Check if last good response exists -> return as CACHED
        const lastGood = railwayCache.getLastGood(cleanNumber);
        if (lastGood) {
          const freshness = Math.max(0, Math.round((Date.now() - new Date(lastGood.fetchedAt).getTime()) / 1000));
          const cachedResult: NormalizedTelemetry = {
            ...lastGood,
            mode: 'CACHED',
            sourceFreshnessSeconds: freshness,
            message: `Serving cached telemetry (${freshness}s ago). Upstream rate-limit or network retry active.`,
          };
          this.notify(cachedResult);
          return cachedResult;
        }

        // 4. Fallback: No cache available -> use deterministic SIMULATED
        const simulated = await this.mockProvider.getLiveTrainStatus(cleanNumber);
        this.notify(simulated);
        return simulated;
      }
    });
  }

  /**
   * Retrieves route coordinates and station stops.
   */
  public async getTrainRoute(trainNumber = '12919'): Promise<RouteGeometry> {
    const cleanNumber = trainNumber.trim() || '12919';
    const cacheKey = railwayCache.getRouteKey(cleanNumber);

    const cached = railwayCache.get<RouteGeometry>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      if (this.railRadarProvider.hasKey()) {
        const route = await this.railRadarProvider.getTrainRoute(cleanNumber);
        railwayCache.set(cacheKey, route, 3600); // 1 hour TTL for route
        return route;
      }
    } catch {
      // Fallback to mock route
    }

    const mockRoute = await this.mockProvider.getTrainRoute(cleanNumber);
    railwayCache.set(cacheKey, mockRoute, 3600);
    return mockRoute;
  }

  /**
   * Retrieves station board for arrivals/departures.
   */
  public async getStationBoard(stationCode = 'NDLS'): Promise<StationBoardItem[]> {
    const code = stationCode.toUpperCase();
    const cacheKey = railwayCache.getStationKey(code);

    const cached = railwayCache.get<StationBoardItem[]>(cacheKey);
    if (cached) return cached;

    try {
      if (this.railRadarProvider.hasKey()) {
        const board = await this.railRadarProvider.getStationBoard(code);
        railwayCache.set(cacheKey, board, 30);
        return board;
      }
    } catch {
      // Fallback to mock board
    }

    const mockBoard = await this.mockProvider.getStationBoard(code);
    railwayCache.set(cacheKey, mockBoard, 30);
    return mockBoard;
  }

  /**
   * Triggers a simulation scenario on the Demo Control Panel.
   */
  public triggerScenario(scenario: SimulationScenario): void {
    this.mockProvider.setScenario(scenario);
    if (scenario !== 'NORMAL' && scenario !== 'RESET') {
      this.preferSimulation = true;
    } else {
      this.preferSimulation = false;
    }
  }

  public getActiveScenario(): SimulationScenario {
    return this.mockProvider.getActiveScenario();
  }

  public isHighDensity(): boolean {
    return this.mockProvider.isHighDensity();
  }
}

export const railwayApiService = RailwayApiService.getInstance();
