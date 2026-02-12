/**
 * Venue Enrichment Response Cache
 * TTL-based in-memory caching for venue data
 * Reduces repeated Wikipedia/OpenWeather calls for same venues
 */

import { type VenueEnrichment } from '@/lib/sensoryData';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

class VenueCache {
  private cache: Map<string, CacheEntry<VenueEnrichment>> = new Map();
  private readonly defaultTTLMs = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  /**
   * Get venue from cache
   * Returns null if not found or expired
   */
  get(venueName: string): VenueEnrichment | null {
    const key = this.normalizeKey(venueName);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set venue in cache
   */
  set(venueName: string, data: VenueEnrichment, ttlMs?: number): void {
    const key = this.normalizeKey(venueName);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs: ttlMs || this.defaultTTLMs,
    });
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    entries: Array<{ key: string; age: number; ttl: number; expired: boolean }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => {
      const age = now - entry.timestamp;
      const expired = age > entry.ttlMs;
      return {
        key,
        age,
        ttl: entry.ttlMs,
        expired,
      };
    });

    return {
      size: this.cache.size,
      entries,
    };
  }

  /**
   * Start automatic cleanup interval
   * Removes expired entries every 30 seconds
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30 * 1000); // 30 seconds
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttlMs) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[VenueCache] Cleaned up ${removed} expired entries`);
    }
  }

  /**
   * Normalize venue name for consistent cache keys
   */
  private normalizeKey(venueName: string): string {
    return venueName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_-]/g, '');
  }
}

// Singleton instance
export const venueCache = new VenueCache();

/**
 * Cache hit/miss tracking
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
}

class CacheMetricsTracker {
  private hits = 0;
  private misses = 0;

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  getMetrics(): CacheMetrics {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

export const cacheMetrics = new CacheMetricsTracker();
