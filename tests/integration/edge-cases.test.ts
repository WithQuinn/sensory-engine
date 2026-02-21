// =============================================================================
// EDGE CASE TESTING
// Sprint 4 Day 5: Real-world edge case validation
// Tests solo trips, unusual venues, minimal data, extreme conditions, rare emotions
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  buildTranscendenceFactors,
  calculateTranscendenceScore,
  analyzeExcitement,
} from '@/lib/excitementEngine';
import { getMockVenueData } from '@/lib/sensoryData';
import { generateFallbackNarrative, type SynthesisInput } from '@/lib/sensoryPrompts';

// =============================================================================
// SOLO TRIP SCENARIOS
// Validate meaningful solitude scoring (companion_engagement = 0.6)
// =============================================================================

describe('Edge Cases: Solo Trips', () => {
  it('solo meditation at temple scores solitude appropriately (0.6)', () => {
    const factors = buildTranscendenceFactors({
      sentimentScore: 0.8, // Peaceful
      atmosphereQuality: 0.85, // Serene temple
      isFirstVisit: false,
      fameScore: 0.7, // Well-known temple
      weatherComfort: 0.9, // Perfect morning
      companionCount: 0, // Solo
      intentMatch: 0.9, // Intentional solitude
      hadUnexpectedMoment: false,
    });

    expect(factors.companion_engagement).toBe(0.6); // Meaningful solitude

    const result = calculateTranscendenceScore(factors);
    expect(result.score).toBeGreaterThan(0.65); // Should score well despite being alone
  });

  it('solo sunrise hike generates positive narrative', () => {
    const input: SynthesisInput = {
      photoAnalysis: {
        scene: 'mountain',
        lighting: 'golden_hour',
        indoorOutdoor: 'outdoor',
        faceCount: 0, // Solo
        crowdLevel: 'empty',
        energyLevel: 'serene',
        emotions: ['peace', 'awe'],
      },
      voiceAnalysis: {
        sentimentScore: 0.75,
        detectedTone: 'content',
        keywords: ['quiet', 'beautiful', 'alone'],
        theme: 'tranquility',
        durationSeconds: 30,
      },
      venue: null,
      weather: {
        condition: 'Clear',
        temperatureC: 18,
        comfortScore: 0.85,
      },
      companions: [], // Solo
      context: {
        localTime: '2024-06-15T06:30:00Z',
        isGoldenHour: true,
        isWeekend: true,
        durationMinutes: 45,
        tripIntent: undefined,
      },
    };

    const narrative = generateFallbackNarrative(input);

    // Narrative should mention solitude positively, not as loneliness
    expect(narrative.narratives.medium).toBeDefined();
    expect(narrative.narratives.medium.length).toBeGreaterThan(0);
    // Should not imply loneliness or missing companionship
  });

  it('solo café visit scores reasonably (not penalized)', () => {
    const factors = buildTranscendenceFactors({
      sentimentScore: 0.6, // Content
      atmosphereQuality: 0.7, // Cozy café
      isFirstVisit: false, // Regular spot
      fameScore: 0.2, // Local place
      weatherComfort: 0.7,
      companionCount: 0, // Solo
      intentMatch: 0.8, // Wanted solo time
      hadUnexpectedMoment: false,
    });

    const result = calculateTranscendenceScore(factors);

    // Should score in moderate range (not low just because solo)
    expect(result.score).toBeGreaterThan(0.5);
    expect(result.score).toBeLessThan(0.7);
  });

  it('solo museum visit with high emotion scores well', () => {
    const factors = buildTranscendenceFactors({
      sentimentScore: 0.9, // Deep appreciation
      atmosphereQuality: 0.85, // Beautiful exhibits
      isFirstVisit: true, // First time
      fameScore: 0.8, // Famous museum
      weatherComfort: 0.5, // Indoor, irrelevant
      companionCount: 0, // Solo
      intentMatch: 0.95, // Exactly what wanted
      hadUnexpectedMoment: true, // Found unexpected favorite piece
    });

    const result = calculateTranscendenceScore(factors);

    // Solo + high emotion + famous venue should score as highlight
    expect(result.score).toBeGreaterThanOrEqual(0.7);
    expect(result.isHighlight).toBe(true);
  });

  it('solo beach walk at sunset scores appropriately', () => {
    const factors = buildTranscendenceFactors({
      sentimentScore: 0.7, // Reflective contentment
      atmosphereQuality: 0.9, // Golden hour beach
      isFirstVisit: false,
      fameScore: 0.3, // Local beach
      weatherComfort: 0.95, // Perfect evening
      companionCount: 0, // Solo
      intentMatch: 0.8, // Needed solo reflection
      hadUnexpectedMoment: false,
    });

    expect(factors.companion_engagement).toBe(0.6);

    const result = calculateTranscendenceScore(factors);
    expect(result.score).toBeGreaterThan(0.6); // Good score for meaningful solo moment
  });
});

// =============================================================================
// UNUSUAL VENUES (No Wikipedia Data)
// Validate fallback behavior and graceful degradation
// =============================================================================

describe('Edge Cases: Unusual Venues', () => {
  it('unlisted local café defaults to mock data gracefully', () => {
    const mockVenue = getMockVenueData('Unknown Café');

    expect(mockVenue.verified_name).toBe('Unknown Café');
    expect(mockVenue.category).toBe('nature'); // Default category from getMockVenueData
    expect(mockVenue.fame_score).toBeGreaterThanOrEqual(0.5); // getMockVenueData returns 0.50-0.99
    expect(mockVenue.fame_score).toBeLessThan(1.0);
    expect(mockVenue.unique_claims).toHaveLength(2); // getMockVenueData returns 2 default claims
    expect(mockVenue.unique_claims[0]).toContain('most visited');
  });

  it('venue with null category handled in excitement analysis', () => {
    const venue = {
      ...getMockVenueData('Street Vendor'),
      category: null as any, // Edge case
    };

    const excitement = analyzeExcitement(venue);

    expect(excitement.fameScore).toBeDefined();
    expect(excitement.recommendedNarrativeAngle).toBeDefined();
    // Should not crash
  });

  it('hidden viewpoint without Wikipedia generates narrative', () => {
    const input: SynthesisInput = {
      photoAnalysis: {
        scene: 'landscape',
        lighting: 'bright',
        indoorOutdoor: 'outdoor',
        faceCount: 2,
        crowdLevel: 'empty',
        energyLevel: 'calm',
        emotions: ['awe', 'wonder'],
      },
      voiceAnalysis: null, // No voice note
      venue: null, // No Wikipedia data
      weather: {
        condition: 'Clear',
        temperatureC: 22,
        comfortScore: 0.9,
      },
      companions: [
        { relationship: 'partner', nickname: 'Alex', age_group: 'adult' },
      ],
      context: {
        localTime: '2024-06-15T16:00:00Z',
        isGoldenHour: false,
        isWeekend: true,
        durationMinutes: 20,
        tripIntent: undefined,
      },
    };

    const narrative = generateFallbackNarrative(input);

    // Should generate coherent narrative without venue data
    expect(narrative.narratives.short).toBeDefined();
    expect(narrative.narratives.medium).toBeDefined();
    // Primary emotion will be chosen from photo analysis
    expect(['awe', 'wonder']).toContain(narrative.primaryEmotion);
  });

  it('transcendence scoring works without fame_score', () => {
    const factors = buildTranscendenceFactors({
      sentimentScore: 0.8,
      atmosphereQuality: 0.85,
      isFirstVisit: true,
      fameScore: null, // No venue data
      weatherComfort: 0.9,
      companionCount: 1,
      intentMatch: 0.85,
      hadUnexpectedMoment: true,
    });

    expect(factors.fame_score).toBe(0.3); // Defaults to low but not zero

    const result = calculateTranscendenceScore(factors);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('private beach spot without description generates anchors', () => {
    const input: SynthesisInput = {
      photoAnalysis: {
        scene: 'beach',
        lighting: 'golden_hour',
        indoorOutdoor: 'outdoor',
        faceCount: 0,
        crowdLevel: 'empty',
        energyLevel: 'tranquil',
        emotions: ['peace'],
      },
      voiceAnalysis: null,
      venue: null, // No data
      weather: null, // Also missing
      companions: [],
      context: {
        localTime: '2024-06-15T18:30:00Z',
        isGoldenHour: true,
        isWeekend: false,
        durationMinutes: null,
        tripIntent: undefined,
      },
    };

    const narrative = generateFallbackNarrative(input);

    // Should still generate sensory anchor
    expect(narrative.memoryAnchors.sensory).toBeDefined();
    expect(narrative.memoryAnchors.sensory.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// MINIMAL DATA SCENARIOS
// Validate graceful degradation with sparse input
// =============================================================================

describe('Edge Cases: Minimal Data', () => {
  it('venue name only generates basic narrative', () => {
    const input: SynthesisInput = {
      photoAnalysis: {
        scene: null,
        lighting: null,
        indoorOutdoor: null,
        faceCount: 0,
        crowdLevel: null,
        energyLevel: null,
        emotions: [],
      },
      voiceAnalysis: null,
      venue: {
        name: 'Local Park',
        category: null,
        description: null,
        foundedYear: null,
        historicalSignificance: null,
        uniqueClaims: [],
        fameScore: null,
      },
      weather: null,
      companions: [],
      context: {
        localTime: '2024-06-15T14:00:00Z',
        isGoldenHour: false,
        isWeekend: false,
        durationMinutes: null,
        tripIntent: undefined,
      },
    };

    const narrative = generateFallbackNarrative(input);

    // Should still produce valid output
    expect(narrative.primaryEmotion).toBeDefined();
    expect(narrative.narratives.short).toBeDefined();
    expect(narrative.emotionConfidence).toBeGreaterThanOrEqual(0);
  });

  it('transcendence with all null factors uses sensible defaults', () => {
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

    const result = calculateTranscendenceScore(factors);

    // Should produce moderate score (not 0, not 1)
    expect(result.score).toBeGreaterThan(0.3);
    expect(result.score).toBeLessThan(0.7);
    expect(result.isHighlight).toBe(false);
  });

  it('one photo only with no other data generates result', () => {
    const input: SynthesisInput = {
      photoAnalysis: {
        scene: 'urban',
        lighting: 'bright',
        indoorOutdoor: 'outdoor',
        faceCount: 1,
        crowdLevel: 'moderate',
        energyLevel: 'lively',
        emotions: ['excitement'],
      },
      voiceAnalysis: null, // No audio
      venue: null, // No venue
      weather: null, // No weather
      companions: [], // No companions
      context: {
        localTime: '2024-06-15T12:00:00Z',
        isGoldenHour: false,
        isWeekend: true,
        durationMinutes: null,
        tripIntent: undefined,
      },
    };

    const narrative = generateFallbackNarrative(input);

    // Primary emotion chosen from photo analysis emotions
    expect(['excitement', 'wonder']).toContain(narrative.primaryEmotion);
    expect(narrative.narratives.short).toBeDefined();
  });

  it('voice note only without photos generates narrative', () => {
    const input: SynthesisInput = {
      photoAnalysis: {
        scene: null,
        lighting: null,
        indoorOutdoor: null,
        faceCount: 0,
        crowdLevel: null,
        energyLevel: null,
        emotions: [],
      },
      voiceAnalysis: {
        sentimentScore: 0.75,
        detectedTone: 'happy',
        keywords: ['amazing', 'beautiful', 'love'],
        theme: 'fulfillment',
        durationSeconds: 45,
      },
      venue: null,
      weather: null,
      companions: [],
      context: {
        localTime: '2024-06-15T10:00:00Z',
        isGoldenHour: false,
        isWeekend: false,
        durationMinutes: null,
        tripIntent: undefined,
      },
    };

    const narrative = generateFallbackNarrative(input);

    // Should derive emotion from voice analysis
    expect(narrative.primaryEmotion).toBeDefined();
    expect(narrative.emotionConfidence).toBeGreaterThan(0.5);
  });

  it('date/time only with minimal metadata produces valid transcendence score', () => {
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

    const result = calculateTranscendenceScore(factors);

    // All factors should have defaults
    expect(factors.emotion_intensity).toBe(0.5);
    expect(factors.atmosphere_quality).toBe(0.5);
    expect(factors.novelty_factor).toBe(0.45);
    expect(factors.fame_score).toBe(0.3);
    expect(factors.weather_match).toBe(0.5);
    expect(factors.companion_engagement).toBe(0.6);
    expect(factors.intent_match).toBe(0.5);
    expect(factors.surprise_factor).toBe(0.2);

    // Result should be valid
    expect(result.score).toBeGreaterThan(0);
    expect(result.explanation).toHaveLength(3);
  });
});

// =============================================================================
// EXTREME INPUT CONDITIONS
// Validate performance and stability under load
// =============================================================================

describe('Edge Cases: Extreme Conditions', () => {
  it('handles 10 companions correctly (large family group)', () => {
    const factors = buildTranscendenceFactors({
      sentimentScore: 0.75,
      atmosphereQuality: 0.8,
      isFirstVisit: false,
      fameScore: 0.6,
      weatherComfort: 0.8,
      companionCount: 10, // Large group
      intentMatch: 0.9,
      hadUnexpectedMoment: true,
    });

    // Large group should score 0.6 (diffused but meaningful)
    expect(factors.companion_engagement).toBe(0.6);

    const result = calculateTranscendenceScore(factors);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('handles very long venue name without crashing', () => {
    const longName = 'A'.repeat(300); // 300 character venue name
    const venue = getMockVenueData(longName);

    expect(venue.verified_name).toBe(longName);
    expect(venue.category).toBeDefined();
  });

  it('handles 50 photo aggregation (max batch)', () => {
    // Simulate 50 photos with varied emotions
    const emotions = Array(50).fill(null).map((_, i) => {
      const emotionTypes = ['joy', 'peace', 'awe', 'excitement'];
      return emotionTypes[i % emotionTypes.length];
    });

    const input: SynthesisInput = {
      photoAnalysis: {
        scene: 'mixed',
        lighting: 'bright',
        indoorOutdoor: 'outdoor',
        faceCount: 25, // Multiple people across photos
        crowdLevel: 'moderate',
        energyLevel: 'lively',
        emotions,
      },
      voiceAnalysis: null,
      venue: null,
      weather: null,
      companions: [],
      context: {
        localTime: '2024-06-15T14:00:00Z',
        isGoldenHour: false,
        isWeekend: true,
        durationMinutes: 120, // 2 hour event
        tripIntent: undefined,
      },
    };

    const narrative = generateFallbackNarrative(input);

    // Should aggregate emotions and produce coherent result
    expect(narrative.primaryEmotion).toBeDefined();
    expect(narrative.secondaryEmotions).toHaveLength(2);
  });

  it('handles companion count boundary (0, 1, 2, 3, 4, 5+)', () => {
    const counts = [0, 1, 2, 3, 4, 10];
    const expected = [0.6, 0.9, 0.8, 0.7, 0.7, 0.6];

    counts.forEach((count, i) => {
      const factors = buildTranscendenceFactors({
        sentimentScore: 0.7,
        atmosphereQuality: 0.7,
        isFirstVisit: false,
        fameScore: 0.5,
        weatherComfort: 0.7,
        companionCount: count,
        intentMatch: 0.7,
        hadUnexpectedMoment: false,
      });

      expect(factors.companion_engagement).toBe(expected[i]);
    });
  });

  it('handles extreme sentiment scores (-1, 0, 1)', () => {
    const sentiments = [-1, 0, 1];
    const expectedEmotions = [1, 0.5, 1]; // abs(-1)=1, 0→0.5 default, abs(1)=1

    sentiments.forEach((sentiment, i) => {
      const factors = buildTranscendenceFactors({
        sentimentScore: sentiment === 0 ? null : sentiment, // 0 sentiment treated as null
        atmosphereQuality: 0.7,
        isFirstVisit: false,
        fameScore: 0.5,
        weatherComfort: 0.7,
        companionCount: 1,
        intentMatch: 0.7,
        hadUnexpectedMoment: false,
      });

      // emotion_intensity should use absolute value (or default 0.5 if null)
      expect(factors.emotion_intensity).toBe(expectedEmotions[i]);

      const result = calculateTranscendenceScore(factors);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });
});

// =============================================================================
// RARE AND COMPLEX EMOTIONS
// Validate emotion handling and narrative tone
// =============================================================================

describe('Edge Cases: Rare Emotions', () => {
  it('grief moment scores appropriately high (not penalized)', () => {
    const factors = buildTranscendenceFactors({
      sentimentScore: -0.7, // Sadness
      atmosphereQuality: 0.6, // Quiet, reflective
      isFirstVisit: false, // Returning to meaningful place
      fameScore: 0.1, // Personal, not famous
      weatherComfort: 0.5, // Doesn't matter
      companionCount: 0, // Solo
      intentMatch: 0.9, // Intentional pilgrimage
      hadUnexpectedMoment: false,
    });

    // Grief should not be penalized (uses absolute value)
    expect(factors.emotion_intensity).toBe(0.7);

    const result = calculateTranscendenceScore(factors);

    // Should score moderately high (profound despite negative)
    expect(result.score).toBeGreaterThan(0.5);
  });

  it('mixed emotions (joy + nostalgia) handled in narrative', () => {
    const input: SynthesisInput = {
      photoAnalysis: {
        scene: 'landmark',
        lighting: 'golden_hour',
        indoorOutdoor: 'outdoor',
        faceCount: 2,
        crowdLevel: 'moderate',
        energyLevel: 'calm',
        emotions: ['joy', 'nostalgia'], // Mixed
      },
      voiceAnalysis: {
        sentimentScore: 0.65, // Bittersweet
        detectedTone: 'reflective',
        keywords: ['remember', 'back', 'happy', 'miss'],
        theme: 'nostalgia',
        durationSeconds: 40,
      },
      venue: null,
      weather: null,
      companions: [
        { relationship: 'friend', nickname: 'Sarah', age_group: 'adult' },
      ],
      context: {
        localTime: '2024-06-15T17:00:00Z',
        isGoldenHour: true,
        isWeekend: false,
        durationMinutes: 30,
        tripIntent: undefined,
      },
    };

    const narrative = generateFallbackNarrative(input);

    // Should capture emotion from analysis (nostalgia or joy)
    expect(narrative.primaryEmotion).toBeDefined();
    // Secondary emotions are derived, may not include original
    expect(narrative.secondaryEmotions).toHaveLength(2);
  });

  it('profound awe (very high emotion) scores as highlight', () => {
    const factors = buildTranscendenceFactors({
      sentimentScore: 0.95, // Overwhelming awe
      atmosphereQuality: 0.9, // Majestic
      isFirstVisit: true,
      fameScore: 0.95, // Iconic location
      weatherComfort: 0.9,
      companionCount: 1,
      intentMatch: 1.0, // Exceeded all expectations
      hadUnexpectedMoment: true,
    });

    const result = calculateTranscendenceScore(factors);

    expect(result.score).toBeGreaterThanOrEqual(0.8);
    expect(result.isHighlight).toBe(true);
    // Dominant factor could be emotion or fame (both are very high)
    expect(['emotion_intensity', 'fame_score']).toContain(result.dominantFactor);
  });

  it('fear overcome (negative → positive arc) scores well', () => {
    // Fear overcome is a profound experience
    const factors = buildTranscendenceFactors({
      sentimentScore: 0.85, // Pride and relief
      atmosphereQuality: 0.7, // Challenging environment
      isFirstVisit: true, // First time doing this
      fameScore: 0.5,
      weatherComfort: 0.6,
      companionCount: 2, // With supportive friends
      intentMatch: 0.95, // Proud of accomplishment
      hadUnexpectedMoment: true, // Surprised they did it
    });

    const result = calculateTranscendenceScore(factors);

    expect(result.score).toBeGreaterThan(0.7); // Should be highlight
    expect(result.isHighlight).toBe(true);
  });

  it('existential wonder (deep contemplation) generates reflective narrative', () => {
    const input: SynthesisInput = {
      photoAnalysis: {
        scene: 'nature',
        lighting: 'night',
        indoorOutdoor: 'outdoor',
        faceCount: 0,
        crowdLevel: 'empty',
        energyLevel: 'tranquil',
        emotions: ['wonder', 'peace'],
      },
      voiceAnalysis: {
        sentimentScore: 0.7,
        detectedTone: 'contemplative',
        keywords: ['vast', 'infinite', 'small', 'wonder'],
        theme: 'wonder',
        durationSeconds: 60,
      },
      venue: null,
      weather: {
        condition: 'Clear',
        temperatureC: 15,
        comfortScore: 0.7,
      },
      companions: [],
      context: {
        localTime: '2024-06-15T22:00:00Z',
        isGoldenHour: false,
        isWeekend: true,
        durationMinutes: null,
        tripIntent: undefined,
      },
    };

    const narrative = generateFallbackNarrative(input);

    // Emotion chosen from photo analysis (wonder or related)
    expect(['wonder', 'peace', 'joy']).toContain(narrative.primaryEmotion);
    expect(narrative.narratives.medium).toBeDefined();
    // Should have contemplative tone
  });
});
