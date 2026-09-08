/**
 * NIRANTAR — Railway In-Memory & Resilient Telemetry Cache
 * ==========================================================
 * Implements PRD Section 6:
 *  - Cache key: railway:live:{trainNumber}:{journeyDate}
 *  - Refresh window: 15–30s
 *  - Upstream request deduplication (one upstream call serves many viewers)
 *  - Fallback preservation: stores last good response for CACHED mode
 */

import { NormalizedTelemetry, RouteGeometry, StationBoardItem } from './types';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

export class RailwayTelemetryCache {
  private static instance: RailwayTelemetryCache;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private lastGoodTelemetry: Map<string, NormalizedTelemetry> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();

  public static getInstance(): RailwayTelemetryCache {
    if (!RailwayTelemetryCache.instance) {
      RailwayTelemetryCache.instance = new RailwayTelemetryCache();
    }
    return RailwayTelemetryCache.instance;
  }

  public getLiveKey(trainNumber: string, journeyDate?: string): string {
    const date = journeyDate || new Date().toISOString().split('T')[0];
    return `railway:live:${trainNumber}:${date}`;
  }

  public getRouteKey(trainNumber: string): string {
    return `railway:route:${trainNumber}`;
  }

  public getStationKey(stationCode: string): string {
    return `railway:station:${stationCode.toUpperCase()}`;
  }

  /**
   * Retrieves an item from cache if valid.
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      return null; // Expired
    }
    return entry.data as T;
  }

  /**
   * Stores an item with a specific TTL in seconds (default: 20s for telemetry).
   */
  public set<T>(key: string, data: T, ttlSeconds = 20): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      cachedAt: now,
      expiresAt: now + ttlSeconds * 1000,
    });
  }

  /**
   * Stores the last known good telemetry response to serve CACHED state on failures.
   */
  public recordLastGood(trainNumber: string, telemetry: NormalizedTelemetry): void {
    this.lastGoodTelemetry.set(trainNumber, telemetry);
  }

  /**
   * Retrieves the last known good telemetry response.
   */
  public getLastGood(trainNumber: string): NormalizedTelemetry | null {
    const item = this.lastGoodTelemetry.get(trainNumber);
    if (!item) return null;

    // Return as CACHED with calculated freshness seconds
    const freshnessSeconds = Math.max(0, Math.round((Date.now() - new Date(item.fetchedAt).getTime()) / 1000));
    return {
      ...item,
      mode: 'CACHED',
      sourceFreshnessSeconds: freshnessSeconds,
    };
  }

  /**
   * Request Deduplication: prevents multiple concurrent fetches for the same key.
   */
  public deduplicate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = this.pendingRequests.get(key);
    if (existing) {
      return existing;
    }

    const promise = fetcher()
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Clear cache for testing or reset.
   */
  public clear(): void {
    this.cache.clear();
    this.lastGoodTelemetry.clear();
    this.pendingRequests.clear();
  }
}

export const railwayCache = RailwayTelemetryCache.getInstance();
