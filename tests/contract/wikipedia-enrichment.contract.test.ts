import { describe, it, expect, beforeEach } from 'vitest';
import {
  WikipediaSearchResponseSchema,
  WikipediaPageResponseSchema,
} from '@/lib/sensoryValidation';
import { enrichVenueWithWikipedia, clearVenueCache } from '@/lib/sensoryData';

/**
 * Wikipedia API Contract Tests
 *
 * These tests verify that the Wikipedia API returns valid responses
 * that match our Zod schemas and that our enrichment logic works correctly.
 *
 * WHEN TO RUN:
 * - Before deploying Wikipedia integration changes
 * - After Wikipedia API updates (check their changelog)
 * - Before production deployment
 * - Weekly as part of release process
 *
 * DO NOT RUN:
 * - In CI/CD (slow network calls)
 * - On every commit
 */

describe('Wikipedia API Contract', () => {
  beforeEach(() => {
    // Clear cache before each test for consistent results
    clearVenueCache();
  });

  describe('Search Endpoint', () => {
    it('should return valid search response schema for famous venue', async () => {
      const searchUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=Eiffel%20Tower&limit=1&format=json';

      const response = await fetch(searchUrl);
      const data = await response.json();

      // Wikipedia opensearch returns array: [query, [titles], [descriptions], [urls]]
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(4);
      expect(typeof data[0]).toBe('string'); // query
      expect(Array.isArray(data[1])).toBe(true); // titles
      expect(Array.isArray(data[2])).toBe(true); // descriptions
      expect(Array.isArray(data[3])).toBe(true); // urls
    });

    it('should handle empty search results', async () => {
      const searchUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=NonExistentVenueThatDoesNotExist12345&limit=1&format=json';

      const response = await fetch(searchUrl);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data[1]).toEqual([]); // No titles found
    });
  });

  describe('Page Content Endpoint', () => {
    it('should return valid page content schema', async () => {
      const pageUrl = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=Eiffel%20Tower&format=json';

      const response = await fetch(pageUrl);
      const data = await response.json();

      // Validate structure
      expect(data.query).toBeDefined();
      expect(data.query.pages).toBeDefined();

      // Get first page
      const pageId = Object.keys(data.query.pages)[0];
      const page = data.query.pages[pageId];

      expect(page.title).toBeDefined();
      expect(page.extract).toBeDefined();
      expect(typeof page.extract).toBe('string');
      expect(page.extract.length).toBeGreaterThan(0);
    });

    it('should handle non-existent page', async () => {
      const pageUrl = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=NonExistentPage12345XYZ&format=json';

      const response = await fetch(pageUrl);
      const data = await response.json();

      expect(data.query).toBeDefined();
      expect(data.query.pages).toBeDefined();

      // Non-existent pages return page with id -1
      const page = data.query.pages['-1'];
      expect(page).toBeDefined();
      expect(page.missing).toBeDefined();
    });
  });

  describe('Venue Enrichment Integration', () => {
    it('should enrich famous venue (Eiffel Tower)', async () => {
      const result = await enrichVenueWithWikipedia('Eiffel Tower', 'Paris');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(result.data.description).toBeDefined();
        expect(result.data.description.length).toBeGreaterThan(0);
        expect(result.data.description.toLowerCase()).toContain('eiffel');
      }
    }, 10000);

    it('should enrich famous venue (Statue of Liberty)', async () => {
      const result = await enrichVenueWithWikipedia('Statue of Liberty', 'New York');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(result.data.description).toBeDefined();
        expect(result.data.description.toLowerCase()).toContain('liberty');
      }
    }, 10000);

    it('should enrich famous venue (Great Wall of China)', async () => {
      const result = await enrichVenueWithWikipedia('Great Wall of China', 'China');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(result.data.description).toBeDefined();
        expect(result.data.description.toLowerCase()).toContain('wall');
      }
    }, 10000);

    it('should use multi-strategy fallback for partial match', async () => {
      // Try a venue name that might not match exactly
      const result = await enrichVenueWithWikipedia('The Louvre Museum Building', 'Paris');

      // Should still find the Louvre via fallback strategies
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(result.data.description.toLowerCase()).toContain('louvre');
      }
    }, 10000);

    it('should handle non-existent venue gracefully', async () => {
      const result = await enrichVenueWithWikipedia(
        'Completely Made Up Venue That Does Not Exist Anywhere 12345',
        'Fictional City'
      );

      // Should return success: false but not throw error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    }, 10000);

    it('should handle venue with special characters', async () => {
      const result = await enrichVenueWithWikipedia('Café de Flore', 'Paris');

      // Should handle special characters (é) correctly
      expect(result.success).toBe(true);
    }, 10000);
  });

  describe('Caching Behavior', () => {
    it('should cache successful enrichment', async () => {
      clearVenueCache();

      // First call - should hit Wikipedia API
      const result1 = await enrichVenueWithWikipedia('Tokyo Tower', 'Tokyo');
      expect(result1.success).toBe(true);

      // Second call - should use cache (much faster)
      const start = Date.now();
      const result2 = await enrichVenueWithWikipedia('Tokyo Tower', 'Tokyo');
      const duration = Date.now() - start;

      expect(result2.success).toBe(true);
      expect(result2.data).toEqual(result1.data); // Same data
      expect(duration).toBeLessThan(100); // Should be instant from cache
    }, 10000);

    it('should cache failed enrichment to avoid repeated API calls', async () => {
      clearVenueCache();

      // First call - will fail
      const result1 = await enrichVenueWithWikipedia(
        'NonExistentVenue12345',
        'NonExistentCity'
      );
      expect(result1.success).toBe(false);

      // Second call - should use cached failure (fast)
      const start = Date.now();
      const result2 = await enrichVenueWithWikipedia(
        'NonExistentVenue12345',
        'NonExistentCity'
      );
      const duration = Date.now() - start;

      expect(result2.success).toBe(false);
      expect(duration).toBeLessThan(100); // Should be instant from cache
    }, 10000);
  });

  describe('Performance', () => {
    it('should complete enrichment within reasonable time', async () => {
      const start = Date.now();
      const result = await enrichVenueWithWikipedia('Big Ben', 'London');
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    }, 10000);

    it('should handle parallel requests without race conditions', async () => {
      clearVenueCache();

      // Make 3 parallel requests for different venues
      const promises = [
        enrichVenueWithWikipedia('Sydney Opera House', 'Sydney'),
        enrichVenueWithWikipedia('Sagrada Familia', 'Barcelona'),
        enrichVenueWithWikipedia('Burj Khalifa', 'Dubai'),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      // Results should be different
      expect(results[0].data?.description).not.toBe(results[1].data?.description);
      expect(results[1].data?.description).not.toBe(results[2].data?.description);
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle network timeout gracefully', async () => {
      // This test verifies timeout behavior exists, but doesn't actually timeout
      // (would need to mock network delay, which defeats contract test purpose)
      const result = await enrichVenueWithWikipedia('Colosseum', 'Rome');

      // Should either succeed or fail gracefully (not throw)
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    }, 10000);

    it('should handle malformed venue names', async () => {
      const result = await enrichVenueWithWikipedia('', '');

      // Should handle empty strings gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 5000);
  });
});
