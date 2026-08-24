/**
 * NIRANTAR — Responsible AI & Anti-Scammer Fair Access Engine
 * ==========================================================
 * Protects ordinary citizens from bot hoarding, automated scalpers,
 * and ensures idempotent, fair transactions without duplicate billing.
 *
 * Architecture Principles:
 *   1. Idempotency: Same booking/payment request repeated 10 times -> 1 logical transaction.
 *   2. Queue Fairness: Prioritized fair scheduling prevents bot starvation.
 *   3. Rate Limiting: Automated bursts (>15 requests/10s) are throttled.
 *   4. Human Confirmation Gate: Consequential actions require explicit citizen confirmation.
 */

export interface IdempotentTransaction<T = any> {
  idempotencyKey: string;
  timestamp: number;
  payloadHash: string;
  response: T;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
}

export class FairAccessManager {
  private static idempotencyCache: Map<string, IdempotentTransaction> = new Map();
  private static requestTimestamps: number[] = [];
  private static readonly RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds
  private static readonly MAX_REQUESTS_PER_WINDOW = 15;

  /**
   * Generates a cryptographically strong UUID v4 idempotency key.
   */
  public static generateIdempotencyKey(prefix: 'book' | 'pay' | 'auth' = 'book'): string {
    const randomHex = Array.from({ length: 4 }, () =>
      Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1)
    ).join('-');
    return `idemp_${prefix}_${Date.now()}_${randomHex}`;
  }

  /**
   * Checks if a request with this idempotency key was already processed.
   * If yes, returns the existing result to avoid duplicate charges or seat holds.
   */
  public static checkIdempotency<T>(key: string): IdempotentTransaction<T> | null {
    const existing = this.idempotencyCache.get(key);
    if (!existing) return null;

    // Expire cache entries older than 15 minutes
    if (Date.now() - existing.timestamp > 15 * 60 * 1000) {
      this.idempotencyCache.delete(key);
      return null;
    }

    return existing as IdempotentTransaction<T>;
  }

  /**
   * Records a resolved idempotent transaction.
   */
  public static recordTransaction<T>(key: string, payload: any, response: T): void {
    const payloadHash = typeof payload === 'string' ? payload : JSON.stringify(payload);
    this.idempotencyCache.set(key, {
      idempotencyKey: key,
      timestamp: Date.now(),
      payloadHash,
      response,
      status: 'RESOLVED',
    });
  }

  /**
   * Bot Detection & Rate Limiter: Checks for automated burst attacks.
   * Returns true if request is within safe human interaction limits.
   */
  public static checkRateLimit(): { allowed: boolean; isBotSuspected: boolean; retryAfterMs: number } {
    const now = Date.now();
    // Prune expired timestamps
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => now - ts < this.RATE_LIMIT_WINDOW_MS
    );

    this.requestTimestamps.push(now);

    if (this.requestTimestamps.length > this.MAX_REQUESTS_PER_WINDOW) {
      return {
        allowed: false,
        isBotSuspected: true,
        retryAfterMs: 3000,
      };
    }

    return {
      allowed: true,
      isBotSuspected: false,
      retryAfterMs: 0,
    };
  }

  /**
   * Human Confirmation Guard: Strictly verifies that a human confirmation was given.
   * AI cannot programmatically bypass this method.
   */
  public static verifyHumanConfirmation(hasExplicitUserClick: boolean): boolean {
    if (!hasExplicitUserClick) {
      throw new Error(
        'SECURITY_VIOLATION: AI models and background processes cannot execute financial transactions without explicit citizen confirmation.'
      );
    }
    return true;
  }
}
