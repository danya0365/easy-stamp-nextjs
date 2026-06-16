export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets (only meaningful when !allowed). */
  retryAfterSec: number;
}

export interface IRateLimitRepository {
  /**
   * Fixed-window counter. Records one hit for `key`; returns whether it stays
   * within `limit` hits per `windowMs`. First hit (or after the window resets)
   * always allowed.
   */
  hit(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}
