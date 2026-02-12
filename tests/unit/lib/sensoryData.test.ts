import { describe, it, expect } from 'vitest';
import {
  calculateFameScore,
  extractFoundedYear,
  extractUniqueClaims,
  inferVenueCategory,
  getMockVenueEnrichment,
  getMockVenueData,
  FAMOUS_VENUE_MOCKS,
  VenueEnrichmentSchema,
} from '@/lib/sensoryData';

// =============================================================================
// calculateFameScore
// =============================================================================

describe('calculateFameScore', () => {
  it('returns 0.1 base score when no Wikipedia article', () => {
    expect(calculateFameScore(false, 0, [], null)).toBe(0.1);
  });

  it('returns 0.3 base score for having Wikipedia article', () => {
    expect(calculateFameScore(true, 0, [], null)).toBe(0.3);
  });

  it('adds 0.1 for extract length > 500 characters', () => {
    expect(calculateFameScore(true, 501, [], null)).toBe(0.4);
  });

  it('adds 0.2 for extract length > 1500 characters', () => {
    expect(calculateFameScore(true, 1501, [], null)).toBe(0.5);
  });

  it('adds 0.1 for significant categories', () => {
    const categories = ['Historic sites', 'Landmarks'];
    expect(calculateFameScore(true, 0, categories, null)).toBe(0.4);
  });

  it('adds extra 0.1 for UNESCO/World Heritage', () => {
    const categories = ['World Heritage Sites'];
    expect(calculateFameScore(true, 0, categories, null)).toBe(0.5); // 0.3 base + 0.1 category + 0.1 UNESCO
  });

  it('adds 0.1 for venues older than 100 years', () => {
    const oldYear = new Date().getFullYear() - 150;
    expect(calculateFameScore(true, 0, [], oldYear)).toBe(0.4);
  });

  it('does not add age bonus for venues under 100 years old', () => {
    const recentYear = new Date().getFullYear() - 50;
    expect(calculateFameScore(true, 0, [], recentYear)).toBe(0.3);
  });

  it('caps fame score at 1.0', () => {
    // Maximum possible: 0.3 (wiki) + 0.2 (length) + 0.1 (category) + 0.1 (unesco) + 0.1 (age) = 0.8
    const categories = ['UNESCO World Heritage Sites', 'Historic landmarks'];
    expect(calculateFameScore(true, 2000, categories, 1000)).toBeLessThanOrEqual(1.0);
  });

  it('returns score rounded to 2 decimal places', () => {
    const score = calculateFameScore(true, 600, [], null);
    const decimalPlaces = (score.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });

  it('handles empty categories array', () => {
    expect(() => calculateFameScore(true, 500, [], null)).not.toThrow();
  });
});

// =============================================================================
// extractFoundedYear
// =============================================================================

describe('extractFoundedYear', () => {
  it('extracts year from "founded in YYYY" pattern', () => {
    expect(extractFoundedYear('The temple was founded in 628 CE.')).toBe(628);
  });

  it('extracts year from "established YYYY" pattern', () => {
    expect(extractFoundedYear('Established 1889 for the World Fair.')).toBe(1889);
  });

  it('extracts year from "built in YYYY" pattern', () => {
    expect(extractFoundedYear('The tower was built in 1889.')).toBe(1889);
  });

  it('extracts year from "dates back to YYYY" pattern', () => {
    expect(extractFoundedYear('The tradition dates back to 1500.')).toBe(1500);
  });

  it('extracts year from "since YYYY" pattern', () => {
    expect(extractFoundedYear('A landmark since 1920.')).toBe(1920);
  });

  it('returns null for text without year patterns', () => {
    expect(extractFoundedYear('A beautiful place to visit.')).toBeNull();
  });

  it('returns null for empty text', () => {
    expect(extractFoundedYear('')).toBeNull();
  });

  it('ignores future years', () => {
    const futureYear = new Date().getFullYear() + 10;
    expect(extractFoundedYear(`Built in ${futureYear}.`)).toBeNull();
  });

  it('handles 3-digit years', () => {
    expect(extractFoundedYear('Founded in 711 AD.')).toBe(711);
  });

  it('extracts first valid year when multiple present', () => {
    const text = 'Founded in 1800, rebuilt in 1950.';
    expect(extractFoundedYear(text)).toBe(1800);
  });
});

// =============================================================================
// extractUniqueClaims
// =============================================================================

describe('extractUniqueClaims', () => {
  it('extracts superlative claims', () => {
    const text = 'This is the oldest temple in Tokyo.';
    const claims = extractUniqueClaims(text, 'Temple');
    expect(claims.some(c => c.toLowerCase().includes('oldest'))).toBe(true);
  });

  it('extracts "known for" claims', () => {
    const text = 'It is known for its beautiful gardens and peaceful atmosphere.';
    const claims = extractUniqueClaims(text, 'Garden');
    expect(claims.some(c => c.toLowerCase().includes('known for'))).toBe(true);
  });

  it('extracts UNESCO mentions', () => {
    const text = 'A UNESCO World Heritage Site since 1993.';
    const claims = extractUniqueClaims(text, 'Site');
    expect(claims.some(c => c.includes('UNESCO'))).toBe(true);
  });

  it('limits claims to 3 items', () => {
    const text = `
      The oldest museum in the world.
      The largest collection of art.
      The most visited attraction.
      Known for its architecture.
      Famous for its gardens.
    `;
    const claims = extractUniqueClaims(text, 'Museum');
    expect(claims.length).toBeLessThanOrEqual(3);
  });

  it('returns empty array for text without claims', () => {
    const text = 'A nice place to visit with family.';
    const claims = extractUniqueClaims(text, 'Place');
    expect(claims).toEqual([]);
  });

  it('capitalizes first letter of claims', () => {
    const text = 'the oldest temple in the region.';
    const claims = extractUniqueClaims(text, 'Temple');
    claims.forEach(claim => {
      expect(claim[0]).toBe(claim[0].toUpperCase());
    });
  });

  it('filters out very short claims (< 10 chars)', () => {
    const text = 'The oldest in Tokyo.'; // "oldest in Tokyo" is short
    const claims = extractUniqueClaims(text, 'Temple');
    claims.forEach(claim => {
      expect(claim.length).toBeGreaterThanOrEqual(10);
    });
  });

  it('removes duplicate claims', () => {
    const text = 'The oldest temple. Again, the oldest temple in Tokyo.';
    const claims = extractUniqueClaims(text, 'Temple');
    const uniqueClaims = [...new Set(claims)];
    expect(claims.length).toBe(uniqueClaims.length);
  });
});

// =============================================================================
// inferVenueCategory
// =============================================================================

describe('inferVenueCategory', () => {
  it('returns "landmark" for temples', () => {
    expect(inferVenueCategory(['Religious buildings', 'Temples'], 'An ancient temple')).toBe('landmark');
  });

  it('returns "landmark" for museums', () => {
    expect(inferVenueCategory(['Museums in Tokyo'], 'A famous art museum')).toBe('landmark');
  });

  it('returns "landmark" for monuments', () => {
    expect(inferVenueCategory(['Monuments'], 'Historic monument')).toBe('landmark');
  });

  it('returns "dining" for restaurants', () => {
    expect(inferVenueCategory(['Restaurants'], 'A ramen restaurant')).toBe('dining');
  });

  it('returns "dining" for cafes', () => {
    expect(inferVenueCategory(['Cafes'], 'A cozy cafe')).toBe('dining');
  });

  it('returns "nature" for parks', () => {
    expect(inferVenueCategory(['Parks'], 'A beautiful park')).toBe('nature');
  });

  it('returns "nature" for beaches', () => {
    expect(inferVenueCategory(['Beaches'], 'Sandy beach')).toBe('nature');
  });

  it('returns "nature" for gardens', () => {
    expect(inferVenueCategory(['Botanical gardens'], 'A beautiful garden')).toBe('nature');
  });

  it('returns "shopping" for markets', () => {
    expect(inferVenueCategory(['Markets'], 'A busy market')).toBe('shopping');
  });

  it('returns "accommodation" for hotels', () => {
    expect(inferVenueCategory(['Hotels'], 'A luxury hotel')).toBe('accommodation');
  });

  it('returns "event" for theaters', () => {
    // Note: 'Historic' matches landmark keywords first, so use theater without historic
    expect(inferVenueCategory(['Theatres'], 'A famous theatre')).toBe('event');
  });

  it('returns "transit" for stations', () => {
    expect(inferVenueCategory(['Railway stations'], 'Main train station')).toBe('transit');
  });

  it('returns "other" for unmatched categories', () => {
    expect(inferVenueCategory(['Random category'], 'Some place')).toBe('other');
  });

  it('prioritizes first matching category', () => {
    // Both temple (landmark) and restaurant (dining) keywords present
    // Should return first match based on order
    const result = inferVenueCategory(['Temples'], 'Temple restaurant');
    expect(result).toBe('landmark');
  });

  it('searches both categories and text', () => {
    // No category keyword, but text contains keyword
    expect(inferVenueCategory([], 'A beautiful temple in Kyoto')).toBe('landmark');
  });
});

// =============================================================================
// getMockVenueEnrichment
// =============================================================================

describe('getMockVenueEnrichment', () => {
  it('returns valid VenueEnrichment structure', () => {
    const enrichment = getMockVenueEnrichment('Test Venue');
    const result = VenueEnrichmentSchema.safeParse(enrichment);
    expect(result.success).toBe(true);
  });

  it('uses venue name as verified_name', () => {
    const enrichment = getMockVenueEnrichment('My Test Venue');
    expect(enrichment.verified_name).toBe('My Test Venue');
  });

  it('generates description containing venue name', () => {
    const enrichment = getMockVenueEnrichment('Cool Place');
    expect(enrichment.description).toContain('Cool Place');
  });

  it('generates deterministic but varied data', () => {
    const e1 = getMockVenueEnrichment('Place A');
    const e2 = getMockVenueEnrichment('Place B');
    // Different names should produce different fame scores
    expect(e1.fame_score).not.toBe(e2.fame_score);
  });

  it('same name produces same output (deterministic)', () => {
    const e1 = getMockVenueEnrichment('Test Place');
    const e2 = getMockVenueEnrichment('Test Place');
    expect(e1).toEqual(e2);
  });

  it('generates fame_score between 0.5 and 1.0', () => {
    const enrichment = getMockVenueEnrichment('Any Venue');
    expect(enrichment.fame_score).toBeGreaterThanOrEqual(0.5);
    expect(enrichment.fame_score).toBeLessThanOrEqual(1.0);
  });

  it('generates founded_year between 1900 and 2025', () => {
    const enrichment = getMockVenueEnrichment('Old Place');
    expect(enrichment.founded_year).toBeGreaterThanOrEqual(1900);
    expect(enrichment.founded_year).toBeLessThanOrEqual(2025);
  });

  it('generates wikipedia_url with encoded name', () => {
    const enrichment = getMockVenueEnrichment('Test Venue');
    expect(enrichment.wikipedia_url).toContain('Test_Venue');
    expect(enrichment.wikipedia_url).toContain('en.wikipedia.org');
  });

  it('includes unique_claims array', () => {
    const enrichment = getMockVenueEnrichment('Famous Place');
    expect(Array.isArray(enrichment.unique_claims)).toBe(true);
    expect(enrichment.unique_claims.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// getMockVenueData
// =============================================================================

describe('getMockVenueData', () => {
  it('returns famous venue data for Senso-ji', () => {
    const data = getMockVenueData('Senso-ji Temple');
    expect(data.verified_name).toBe('Senso-ji');
    expect(data.founded_year).toBe(628);
  });

  it('returns famous venue data for Eiffel Tower', () => {
    const data = getMockVenueData('Eiffel Tower');
    expect(data.verified_name).toBe('Eiffel Tower');
    expect(data.fame_score).toBe(0.99);
  });

  it('returns famous venue data for Fushimi Inari', () => {
    const data = getMockVenueData('Fushimi Inari Shrine');
    expect(data.verified_name).toBe('Fushimi Inari-taisha');
    expect(data.unique_claims).toContain('Over 10,000 torii gates');
  });

  it('is case-insensitive for famous venue matching', () => {
    const data = getMockVenueData('senso-ji');
    expect(data.verified_name).toBe('Senso-ji');
  });

  it('falls back to generated mock for unknown venues', () => {
    const data = getMockVenueData('Some Random Local Cafe');
    expect(data.verified_name).toBe('Some Random Local Cafe');
    // Should have generated mock structure
    expect(data.fame_score).toBeGreaterThanOrEqual(0.5);
  });

  it('partial matching works for famous venues', () => {
    const data = getMockVenueData('Visit the Eiffel Tower at night');
    expect(data.verified_name).toBe('Eiffel Tower');
  });
});

// =============================================================================
// FAMOUS_VENUE_MOCKS
// =============================================================================

describe('FAMOUS_VENUE_MOCKS', () => {
  it('contains expected famous venues', () => {
    expect(FAMOUS_VENUE_MOCKS['Senso-ji']).toBeDefined();
    expect(FAMOUS_VENUE_MOCKS['Eiffel Tower']).toBeDefined();
    expect(FAMOUS_VENUE_MOCKS['Fushimi Inari']).toBeDefined();
  });

  it('all mocks are valid VenueEnrichment', () => {
    Object.values(FAMOUS_VENUE_MOCKS).forEach(mock => {
      const result = VenueEnrichmentSchema.safeParse(mock);
      expect(result.success).toBe(true);
    });
  });

  it('all mocks have high fame scores', () => {
    Object.values(FAMOUS_VENUE_MOCKS).forEach(mock => {
      expect(mock.fame_score).toBeGreaterThanOrEqual(0.9);
    });
  });

  it('all mocks have unique_claims', () => {
    Object.values(FAMOUS_VENUE_MOCKS).forEach(mock => {
      expect(mock.unique_claims.length).toBeGreaterThan(0);
    });
  });

  it('all mocks have historical_significance', () => {
    Object.values(FAMOUS_VENUE_MOCKS).forEach(mock => {
      expect(mock.historical_significance).toBeTruthy();
    });
  });

  it('all mocks use landmark category', () => {
    Object.values(FAMOUS_VENUE_MOCKS).forEach(mock => {
      expect(mock.category).toBe('landmark');
    });
  });
});
