/**
 * NIRANTAR — High-Throughput Client Rate Limiter
 * ===============================================
 * Implements a 5-response/second burst limiter with multi-user/client isolation.
 * Supports:
 *  - 5 requests / second burst ceiling (enabling fast multi-turn interactions)
 *  - Client-session partitioning so distinct users have dedicated throughput allocations
 */

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  errorMessage?: string;
}

class MultiUserRateLimiter {
  private clientTimestamps: Map<string, number[]> = new Map();

  /**
   * Get or initialize a unique client identifier for this session.
   */
  private getClientKey(category: string, clientId?: string): string {
    const id = clientId || this.getOrCreateSessionId();
    return `${id}::${category}`;
  }

  private getOrCreateSessionId(): string {
    try {
      let sid = sessionStorage.getItem('nirantar_session_id');
      if (!sid) {
        sid = `usr_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
        sessionStorage.setItem('nirantar_session_id', sid);
      }
      return sid;
    } catch {
      return 'default_client';
    }
  }

  /**
   * Check and consume a request.
   * Default: 5 requests per second (1,000ms window).
   */
  public checkLimit(
    category: string,
    maxPerWindow = 5,
    windowMs = 1000,
    clientId?: string
  ): RateLimitStatus {
    const key = this.getClientKey(category, clientId);
    const now = Date.now();
    const windowStart = now - windowMs;

    let records = this.clientTimestamps.get(key) || [];
    records = records.filter((ts) => ts > windowStart);

    if (records.length >= maxPerWindow) {
      const oldest = records[0];
      const resetInSeconds = Math.max(0.2, (oldest + windowMs - now) / 1000);
      this.clientTimestamps.set(key, records);
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds: Number(resetInSeconds.toFixed(1)),
        errorMessage: `Throughput limit (${maxPerWindow} req/sec). Please wait ${resetInSeconds.toFixed(1)}s.`,
      };
    }

    records.push(now);
    this.clientTimestamps.set(key, records);

    return {
      allowed: true,
      remaining: maxPerWindow - records.length,
      resetInSeconds: 0,
    };
  }

  /**
   * Peek without consuming quota.
   */
  public peek(
    category: string,
    maxPerWindow = 5,
    windowMs = 1000,
    clientId?: string
  ): RateLimitStatus {
    const key = this.getClientKey(category, clientId);
    const now = Date.now();
    const windowStart = now - windowMs;

    let records = this.clientTimestamps.get(key) || [];
    records = records.filter((ts) => ts > windowStart);
    this.clientTimestamps.set(key, records);

    if (records.length >= maxPerWindow) {
      const oldest = records[0];
      const resetInSeconds = Math.max(0.2, (oldest + windowMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds: Number(resetInSeconds.toFixed(1)),
        errorMessage: `Limit reached (${maxPerWindow} req/sec).`,
      };
    }

    return {
      allowed: true,
      remaining: maxPerWindow - records.length,
      resetInSeconds: 0,
    };
  }
}

export const aiRateLimiter = new MultiUserRateLimiter();
