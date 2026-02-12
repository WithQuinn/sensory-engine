import { describe, it, expect } from 'vitest';
import {
  generateExcitementHook,
  extractUniqueFacts,
  suggestNarrativeAngle,
  calculateTranscendenceScore,
  buildTranscendenceFactors,
  analyzeExcitement,
  getMockTranscendenceResult,
} from '@/lib/excitementEngine';
import type { VenueEnrichment } from '@/lib/sensoryData';
import type { TranscendenceFactors } from '@/lib/sensoryValidation';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const mockVenueHighFame: VenueEnrichment = {
  verified_name: 'Eiffel Tower',
  category: 'landmark',
  description: 'Iconic iron lattice tower on the Champ de Mars in Paris',
  founded_year: 1889,
  historical_significance: 'Built for the 1889 World\'s Fair. Symbol of French engineering.',
  unique_claims: ['Most-visited paid monument in the world', 'Was the tallest structure until 1930'],
  fame_score: 0.95,
  source: 'wikipedia',
  fetched_at: new Date().toISOString(),
};

const mockVenueHistorical: VenueEnrichment = {
  verified_name: 'Senso-ji Temple',
  category: 'landmark',
  description: 'Ancient Buddhist temple in Asakusa, Tokyo',
  founded_year: 645,
  historical_significance: 'Tokyo\'s oldest temple, dedicated to Kannon.',
  unique_claims: [],
  fame_score: 0.7,
  source: 'wikipedia',
  fetched_at: new Date().toISOString(),
};

const mockVenueDining: VenueEnrichment = {
  verified_name: 'Ichiran Ramen',
  category: 'dining',
  description: 'Famous tonkotsu ramen chain known for individual booths',
  founded_year: 1960,
  historical_significance: null,
  unique_claims: ['Pioneered the individual booth dining concept'],
  fame_score: 0.5,
  source: 'wikipedia',
  fetched_at: new Date().toISOString(),
};

const mockVenueNature: VenueEnrichment = {
  verified_name: 'Grand Canyon',
  category: 'nature',
  description: 'Steep-sided canyon carved by the Colorado River',
  founded_year: null,
  historical_significance: 'Formed over 5-6 million years of geological history.',
  unique_claims: ['One of the Seven Natural Wonders of the World'],
  fame_score: 0.92,
  source: 'wikipedia',
  fetched_at: new Date().toISOString(),
};

// =============================================================================
// generateExcitementHook
// =============================================================================

describe('generateExcitementHook', () => {
  it('returns null for null venue', () => {
    expect(generateExcitementHook(null)).toBeNull();
  });

  it('returns first unique claim for high fame venues (>= 0.8)', () => {
    const hook = generateExcitementHook(mockVenueHighFame);
    expect(hook).toBe('Most-visited paid monument in the world');
  });

  it('returns years-based hook for historical venues (>100 years old)', () => {
    const hook = generateExcitementHook(mockVenueHistorical);
    const expectedYears = new Date().getFullYear() - 645;
    expect(hook).toBe(`${expectedYears} years of history await you here`);
  });

  it('returns historical significance for venues without high fame or old age', () => {
    const venue: VenueEnrichment = {
      ...mockVenueDining,
      founded_year: 2020, // Recent
      fame_score: 0.4,
      unique_claims: [],
      historical_significance: 'A local favorite spot.',
    };
    expect(generateExcitementHook(venue)).toBe('A local favorite spot');
  });

  it('returns description as fallback', () => {
    const venue: VenueEnrichment = {
      ...mockVenueDining,
      founded_year: null,
      fame_score: 0.3,
      unique_claims: [],
      historical_significance: null,
    };
    expect(generateExcitementHook(venue)).toBe(venue.description);
  });

  it('truncates long historical significance to first sentence', () => {
    const venue: VenueEnrichment = {
      ...mockVenueDining,
      founded_year: null,
      fame_score: 0.3,
      unique_claims: [],
      historical_significance: 'Short sentence. This is a longer second sentence that should not appear.',
    };
    expect(generateExcitementHook(venue)).toBe('Short sentence');
  });
});

// =============================================================================
// extractUniqueFacts
// =============================================================================

describe('extractUniqueFacts', () => {
  it('returns empty array for null venue', () => {
    expect(extractUniqueFacts(null)).toEqual([]);
  });

  it('includes unique claims from venue', () => {
    const facts = extractUniqueFacts(mockVenueHighFame);
    expect(facts).toContain('Most-visited paid monument in the world');
    expect(facts).toContain('Was the tallest structure until 1930');
  });

  it('includes age fact for venues older than 50 years', () => {
    const facts = extractUniqueFacts(mockVenueHistorical);
    const expectedYears = new Date().getFullYear() - 645;
    expect(facts).toContainEqual(expect.stringContaining(`Established in 645`));
    expect(facts).toContainEqual(expect.stringContaining(`${expectedYears} years ago`));
  });

  it('includes landmark recognition for high fame landmarks', () => {
    const facts = extractUniqueFacts(mockVenueHighFame);
    expect(facts).toContain('Widely recognized cultural landmark');
  });

  it('limits facts to 5 items', () => {
    const venueWithManyFacts: VenueEnrichment = {
      ...mockVenueHighFame,
      unique_claims: ['Fact 1', 'Fact 2', 'Fact 3', 'Fact 4', 'Fact 5', 'Fact 6', 'Fact 7'],
    };
    const facts = extractUniqueFacts(venueWithManyFacts);
    expect(facts.length).toBeLessThanOrEqual(5);
  });
});

// =============================================================================
// suggestNarrativeAngle
// =============================================================================

describe('suggestNarrativeAngle', () => {
  it('returns null for null venue', () => {
    expect(suggestNarrativeAngle(null)).toBeNull();
  });

  it('returns "significance" for high fame venues (>= 0.8)', () => {
    expect(suggestNarrativeAngle(mockVenueHighFame)).toBe('significance');
  });

  it('returns "historical" for pre-1900 venues', () => {
    expect(suggestNarrativeAngle(mockVenueHistorical)).toBe('historical');
  });

  it('returns "sensory" for nature venues', () => {
    const natureVenue: VenueEnrichment = {
      ...mockVenueNature,
      fame_score: 0.5, // Lower fame to avoid significance override
    };
    expect(suggestNarrativeAngle(natureVenue)).toBe('sensory');
  });

  it('returns "culinary" for dining venues', () => {
    const diningVenue: VenueEnrichment = {
      ...mockVenueDining,
      fame_score: 0.3,
      founded_year: 2000, // Recent
    };
    expect(suggestNarrativeAngle(diningVenue)).toBe('culinary');
  });

  it('returns "experiential" as default', () => {
    const genericVenue: VenueEnrichment = {
      verified_name: 'Local Shop',
      category: 'shopping',
      description: 'A small local shop',
      founded_year: 2010,
      historical_significance: null,
      unique_claims: [],
      fame_score: 0.2,
      source: 'mock',
      fetched_at: new Date().toISOString(),
    };
    expect(suggestNarrativeAngle(genericVenue)).toBe('experiential');
  });

  it('prioritizes fame over historical', () => {
    const oldAndFamous: VenueEnrichment = {
      ...mockVenueHistorical,
      fame_score: 0.9,
    };
    expect(suggestNarrativeAngle(oldAndFamous)).toBe('significance');
  });
});

// =============================================================================
// calculateTranscendenceScore
// =============================================================================

describe('calculateTranscendenceScore', () => {
  const baseFactors: TranscendenceFactors = {
    emotion_intensity: 0.5,
    atmosphere_quality: 0.5,
    novelty_factor: 0.5,
    fame_score: 0.5,
    weather_match: 0.5,
    companion_engagement: 0.5,
    intent_match: 0.5,
    surprise_factor: 0.5,
  };

  it('calculates weighted score correctly', () => {
    const result = calculateTranscendenceScore(baseFactors);
    // All 0.5 factors should yield 0.5 total (weights sum to 1)
    expect(result.score).toBe(0.5);
  });

  it('marks as highlight when score >= 0.7', () => {
    const highFactors: TranscendenceFactors = {
      emotion_intensity: 0.9,
      atmosphere_quality: 0.85,
      novelty_factor: 0.8,
      fame_score: 0.9,
      weather_match: 0.8,
      companion_engagement: 0.7,
      intent_match: 0.8,
      surprise_factor: 0.6,
    };
    const result = calculateTranscendenceScore(highFactors);
    expect(result.isHighlight).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('marks as non-highlight when score < 0.7', () => {
    const lowFactors: TranscendenceFactors = {
      emotion_intensity: 0.3,
      atmosphere_quality: 0.4,
      novelty_factor: 0.3,
      fame_score: 0.2,
      weather_match: 0.5,
      companion_engagement: 0.3,
      intent_match: 0.4,
      surprise_factor: 0.2,
    };
    const result = calculateTranscendenceScore(lowFactors);
    expect(result.isHighlight).toBe(false);
    expect(result.score).toBeLessThan(0.7);
  });

  it('identifies correct dominant factor', () => {
    const emotionDominant: TranscendenceFactors = {
      emotion_intensity: 1.0,
      atmosphere_quality: 0.1,
      novelty_factor: 0.1,
      fame_score: 0.1,
      weather_match: 0.1,
      companion_engagement: 0.1,
      intent_match: 0.1,
      surprise_factor: 0.1,
    };
    const result = calculateTranscendenceScore(emotionDominant);
    expect(result.dominantFactor).toBe('emotion_intensity');
  });

  it('returns factors in result', () => {
    const result = calculateTranscendenceScore(baseFactors);
    expect(result.factors).toEqual(baseFactors);
  });

  it('rounds score to 2 decimal places', () => {
    const result = calculateTranscendenceScore(baseFactors);
    const decimalPlaces = (result.score.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });
});

// =============================================================================
// buildTranscendenceFactors
// =============================================================================

describe('buildTranscendenceFactors', () => {
  it('builds factors with all null inputs using defaults', () => {
    const factors = buildTranscendenceFactors({
      sentimentScore: null,
      atmosphereQuality: null,
      isFirstVisit: false,
      fameScore: null,
      weatherComfort: null,
      companionCount: 0,
      intentMatch: null,
      hadUnexpectedMoment: false,
    });

    expect(factors.emotion_intensity).toBe(0.5);
    expect(factors.atmosphere_quality).toBe(0.5);
    expect(factors.novelty_factor).toBe(0.4); // Not first visit
    expect(factors.fame_score).toBe(0.3);
    expect(factors.weather_match).toBe(0.5);
    expect(factors.companion_engagement).toBe(0.3); // 0 companions
    expect(factors.intent_match).toBe(0.5);
    expect(factors.surprise_factor).toBe(0.2); // No unexpected moment
  });

  it('gives higher novelty for first visits', () => {
    const firstVisit = buildTranscendenceFactors({
      sentimentScore: null,
      atmosphereQuality: null,
      isFirstVisit: true,
      fameScore: null,
      weatherComfort: null,
      companionCount: 0,
      intentMatch: null,
      hadUnexpectedMoment: false,
    });

    expect(firstVisit.novelty_factor).toBe(0.85);
  });

  it('maps positive sentiment to higher emotion intensity', () => {
    const positive = buildTranscendenceFactors({
      sentimentScore: 0.9,
      atmosphereQuality: null,
      isFirstVisit: false,
      fameScore: null,
      weatherComfort: null,
      companionCount: 0,
      intentMatch: null,
      hadUnexpectedMoment: false,
    });

    expect(positive.emotion_intensity).toBe(0.9);
  });

  it('maps negative sentiment to lower emotion intensity (halved)', () => {
    const negative = buildTranscendenceFactors({
      sentimentScore: -0.8,
      atmosphereQuality: null,
      isFirstVisit: false,
      fameScore: null,
      weatherComfort: null,
      companionCount: 0,
      intentMatch: null,
      hadUnexpectedMoment: false,
    });

    // -0.8 → abs(0.8) * 0.5 = 0.4
    expect(negative.emotion_intensity).toBe(0.4);
  });

  it('scales companion engagement with count, capped at 0.9', () => {
    const oneCompanion = buildTranscendenceFactors({
      sentimentScore: null,
      atmosphereQuality: null,
      isFirstVisit: false,
      fameScore: null,
      weatherComfort: null,
      companionCount: 1,
      intentMatch: null,
      hadUnexpectedMoment: false,
    });
    expect(oneCompanion.companion_engagement).toBe(0.5); // 0.3 + 1*0.2

    const fourCompanions = buildTranscendenceFactors({
      sentimentScore: null,
      atmosphereQuality: null,
      isFirstVisit: false,
      fameScore: null,
      weatherComfort: null,
      companionCount: 4,
      intentMatch: null,
      hadUnexpectedMoment: false,
    });
    expect(fourCompanions.companion_engagement).toBe(0.9); // Capped

    const tenCompanions = buildTranscendenceFactors({
      sentimentScore: null,
      atmosphereQuality: null,
      isFirstVisit: false,
      fameScore: null,
      weatherComfort: null,
      companionCount: 10,
      intentMatch: null,
      hadUnexpectedMoment: false,
    });
    expect(tenCompanions.companion_engagement).toBe(0.9); // Still capped at 0.9
  });

  it('gives higher surprise factor for unexpected moments', () => {
    const unexpected = buildTranscendenceFactors({
      sentimentScore: null,
      atmosphereQuality: null,
      isFirstVisit: false,
      fameScore: null,
      weatherComfort: null,
      companionCount: 0,
      intentMatch: null,
      hadUnexpectedMoment: true,
    });

    expect(unexpected.surprise_factor).toBe(0.8);
  });

  it('uses provided values when not null', () => {
    const factors = buildTranscendenceFactors({
      sentimentScore: 0.7,
      atmosphereQuality: 0.85,
      isFirstVisit: true,
      fameScore: 0.9,
      weatherComfort: 0.75,
      companionCount: 2,
      intentMatch: 0.8,
      hadUnexpectedMoment: true,
    });

    expect(factors.atmosphere_quality).toBe(0.85);
    expect(factors.fame_score).toBe(0.9);
    expect(factors.weather_match).toBe(0.75);
    expect(factors.intent_match).toBe(0.8);
  });

  it('rounds all factors to 2 decimal places', () => {
    const factors = buildTranscendenceFactors({
      sentimentScore: 0.333333,
      atmosphereQuality: 0.777777,
      isFirstVisit: true,
      fameScore: 0.555555,
      weatherComfort: 0.888888,
      companionCount: 3,
      intentMatch: 0.123456,
      hadUnexpectedMoment: false,
    });

    Object.values(factors).forEach((value) => {
      const decimalPlaces = (value.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });
});

// =============================================================================
// analyzeExcitement
// =============================================================================

describe('analyzeExcitement', () => {
  it('returns full analysis for venue', () => {
    const result = analyzeExcitement(mockVenueHighFame);

    expect(result.fameScore).toBe(0.95);
    expect(result.excitementHook).toBe('Most-visited paid monument in the world');
    expect(result.uniqueFacts.length).toBeGreaterThan(0);
    expect(result.historicalContext).toBe('Built for the 1889 World\'s Fair. Symbol of French engineering.');
    expect(result.recommendedNarrativeAngle).toBe('significance');
  });

  it('handles null venue gracefully', () => {
    const result = analyzeExcitement(null);

    expect(result.fameScore).toBe(0);
    expect(result.excitementHook).toBeNull();
    expect(result.uniqueFacts).toEqual([]);
    expect(result.historicalContext).toBeNull();
    expect(result.recommendedNarrativeAngle).toBeNull();
  });

  it('extracts historical context from venue', () => {
    const result = analyzeExcitement(mockVenueHistorical);
    expect(result.historicalContext).toBe('Tokyo\'s oldest temple, dedicated to Kannon.');
  });
});

// =============================================================================
// getMockTranscendenceResult
// =============================================================================

describe('getMockTranscendenceResult', () => {
  it('returns highlight scenario by default', () => {
    const result = getMockTranscendenceResult();
    expect(result.isHighlight).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it('returns highlight scenario when specified', () => {
    const result = getMockTranscendenceResult('highlight');
    expect(result.isHighlight).toBe(true);
    expect(result.score).toBe(0.87);
  });

  it('returns moderate scenario', () => {
    const result = getMockTranscendenceResult('moderate');
    expect(result.isHighlight).toBe(false);
    expect(result.score).toBe(0.55);
  });

  it('returns low scenario', () => {
    const result = getMockTranscendenceResult('low');
    expect(result.isHighlight).toBe(false);
    expect(result.score).toBe(0.35);
  });

  it('includes all factor fields', () => {
    const result = getMockTranscendenceResult();
    expect(result.factors).toHaveProperty('emotion_intensity');
    expect(result.factors).toHaveProperty('atmosphere_quality');
    expect(result.factors).toHaveProperty('novelty_factor');
    expect(result.factors).toHaveProperty('fame_score');
    expect(result.factors).toHaveProperty('weather_match');
    expect(result.factors).toHaveProperty('companion_engagement');
    expect(result.factors).toHaveProperty('intent_match');
    expect(result.factors).toHaveProperty('surprise_factor');
  });
});
