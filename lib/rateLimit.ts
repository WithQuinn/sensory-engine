/**
 * Rate Limiting Module
 * Prevents API abuse and manages request quotas
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit tracking
const rateLimitMap = new Map<string, RateLimitEntry>();

// Configuration
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // 30 requests per minute
const BYPASS_TOKEN = process.env.RATE_LIMIT_BYPASS_TOKEN; // Optional override for testing

/**
 * Check if request should be rate limited
 * @param identifier - Unique identifier (IP, user ID, API key)
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(identifier: string): boolean {
  // Allow bypass for testing
  if (BYPASS_TOKEN) {
    return true;
  }

  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  // First request or window expired
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return true;
  }

  // Check if limit exceeded
  if (entry.count >= MAX_REQUESTS) {
    return false;
  }

  // Increment and allow
  entry.count += 1;
  return true;
}

/**
 * Get rate limit headers for response
 * @param identifier - Unique identifier
 * @returns Object with rate limit headers
 */
export function getRateLimitHeaders(identifier: string): Record<string, string> {
  const entry = rateLimitMap.get(identifier);

  if (!entry) {
    return {
      'X-RateLimit-Limit': String(MAX_REQUESTS),
      'X-RateLimit-Remaining': String(MAX_REQUESTS),
      'X-RateLimit-Reset': String(Date.now() + WINDOW_MS),
    };
  }

  const now = Date.now();
  const remaining = Math.max(0, MAX_REQUESTS - entry.count);
  const resetTime = entry.resetTime > now ? entry.resetTime : now + WINDOW_MS;

  return {
    'X-RateLimit-Limit': String(MAX_REQUESTS),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(resetTime),
  };
}

/**
 * Reset rate limit for testing
 * @param identifier - Unique identifier to reset (or all if not provided)
 */
export function resetRateLimit(identifier?: string): void {
  if (identifier) {
    rateLimitMap.delete(identifier);
  } else {
    rateLimitMap.clear();
  }
}

/**
 * Cleanup expired entries (should run periodically)
 */
export function cleanupExpiredLimits(): void {
  const now = Date.now();
  const expired: string[] = [];

  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      expired.push(key);
    }
  }

  expired.forEach(key => rateLimitMap.delete(key));
}

// Cleanup every 5 minutes
setInterval(cleanupExpiredLimits, 5 * 60 * 1000);
