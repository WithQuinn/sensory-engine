import { describe, it, expect } from 'vitest';
import {
  // Enums
  LightingEnum,
  EnergyEnum,
  VenueCategoryEnum,
  DetectionTriggerEnum,
  ProcessingTierEnum,
  // Input schemas
  PhotoReferenceSchema,
  AudioInputSchema,
  CompanionInputSchema,
  SensoryInputSchema,
  // Output schemas
  AtmosphereSchema,
  MemoryAnchorsSchema,
  NarrativesSchema,
  // Helpers
  validateSensoryInput,
  safeParseSensoryInput,
  calculateTranscendence,
  getTranscendenceTier,
  TRANSCENDENCE_WEIGHTS,
  type TranscendenceFactors,
} from '@/lib/sensoryValidation';

// =============================================================================
// ENUM SCHEMAS
// =============================================================================

describe('LightingEnum', () => {
  it('accepts valid lighting values', () => {
    expect(LightingEnum.parse('golden_hour')).toBe('golden_hour');
    expect(LightingEnum.parse('bright')).toBe('bright');
    expect(LightingEnum.parse('overcast')).toBe('overcast');
    expect(LightingEnum.parse('night')).toBe('night');
    expect(LightingEnum.parse('indoor_warm')).toBe('indoor_warm');
    expect(LightingEnum.parse('indoor_cool')).toBe('indoor_cool');
  });

  it('rejects invalid lighting values', () => {
    expect(() => LightingEnum.parse('sunny')).toThrow();
    expect(() => LightingEnum.parse('dark')).toThrow();
    expect(() => LightingEnum.parse('')).toThrow();
  });
});

describe('EnergyEnum', () => {
  it('accepts valid energy values', () => {
    expect(EnergyEnum.parse('tranquil')).toBe('tranquil');
    expect(EnergyEnum.parse('calm')).toBe('calm');
    expect(EnergyEnum.parse('lively')).toBe('lively');
    expect(EnergyEnum.parse('energetic')).toBe('energetic');
    expect(EnergyEnum.parse('chaotic')).toBe('chaotic');
  });

  it('rejects invalid energy values', () => {
    expect(() => EnergyEnum.parse('quiet')).toThrow();
    expect(() => EnergyEnum.parse('loud')).toThrow();
  });
});

describe('VenueCategoryEnum', () => {
  it('accepts all valid venue categories', () => {
    const validCategories = ['landmark', 'dining', 'shopping', 'nature', 'event', 'accommodation', 'transit', 'other'];
    validCategories.forEach(cat => {
      expect(VenueCategoryEnum.parse(cat)).toBe(cat);
    });
  });

  it('rejects invalid categories', () => {
    expect(() => VenueCategoryEnum.parse('temple')).toThrow();
    expect(() => VenueCategoryEnum.parse('museum')).toThrow();
    expect(() => VenueCategoryEnum.parse('restaurant')).toThrow();
  });
});

describe('DetectionTriggerEnum', () => {
  it('accepts valid detection triggers', () => {
    expect(DetectionTriggerEnum.parse('photos')).toBe('photos');
    expect(DetectionTriggerEnum.parse('dwell')).toBe('dwell');
    expect(DetectionTriggerEnum.parse('calendar')).toBe('calendar');
    expect(DetectionTriggerEnum.parse('manual')).toBe('manual');
  });
});

describe('ProcessingTierEnum', () => {
  it('accepts valid processing tiers', () => {
    expect(ProcessingTierEnum.parse('full')).toBe('full');
    expect(ProcessingTierEnum.parse('reduced_cloud')).toBe('reduced_cloud');
    expect(ProcessingTierEnum.parse('local_only')).toBe('local_only');
    expect(ProcessingTierEnum.parse('offline')).toBe('offline');
  });
});

// =============================================================================
// PHOTO REFERENCE SCHEMA
// =============================================================================

describe('PhotoReferenceSchema', () => {
  it('accepts valid photo reference with all fields', () => {
    const result = PhotoReferenceSchema.safeParse({
      local_id: 'PHAsset-123',
      captured_at: '2025-04-15T10:30:00Z',
      location_extracted: true,
      local_analysis: {
        scene_type: 'temple',
        lighting: 'golden_hour',
        indoor_outdoor: 'outdoor',
        face_count: 3,
        crowd_level: 'moderate',
        energy_level: 'calm',
        basic_emotion: 'happy',
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts photo reference with null local_id (web upload)', () => {
    const result = PhotoReferenceSchema.safeParse({
      local_id: null,
      captured_at: '2025-04-15T10:30:00Z',
      location_extracted: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts photo reference without local_analysis (optional)', () => {
    const result = PhotoReferenceSchema.safeParse({
      local_id: null,
      captured_at: null,
    });
    expect(result.success).toBe(true);
  });

  it('defaults location_extracted to false', () => {
    const result = PhotoReferenceSchema.parse({
      local_id: null,
      captured_at: null,
    });
    expect(result.location_extracted).toBe(false);
  });

  it('rejects invalid datetime format for captured_at', () => {
    const result = PhotoReferenceSchema.safeParse({
      local_id: null,
      captured_at: 'invalid-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid lighting enum in local_analysis', () => {
    const result = PhotoReferenceSchema.safeParse({
      local_id: null,
      captured_at: null,
      local_analysis: {
        scene_type: 'temple',
        lighting: 'sunny', // Invalid
        indoor_outdoor: 'outdoor',
        face_count: 0,
        crowd_level: null,
        energy_level: null,
        basic_emotion: null,
      },
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// AUDIO INPUT SCHEMA
// =============================================================================

describe('AudioInputSchema', () => {
  it('accepts valid audio input', () => {
    const result = AudioInputSchema.safeParse({
      duration_seconds: 15,
      recorded_at: '2025-04-15T10:30:00Z',
      transcript: 'This is amazing!',
      sentiment_score: 0.8,
      sentiment_keywords: ['amazing', 'beautiful'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts audio with null transcript (not yet transcribed)', () => {
    const result = AudioInputSchema.safeParse({
      duration_seconds: 10,
      recorded_at: '2025-04-15T10:30:00Z',
      transcript: null,
      sentiment_score: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects duration over 300 seconds (5 minutes)', () => {
    const result = AudioInputSchema.safeParse({
      duration_seconds: 301,
      recorded_at: '2025-04-15T10:30:00Z',
      transcript: null,
      sentiment_score: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative duration', () => {
    const result = AudioInputSchema.safeParse({
      duration_seconds: -5,
      recorded_at: '2025-04-15T10:30:00Z',
      transcript: null,
      sentiment_score: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects sentiment score outside -1 to 1 range', () => {
    const tooHigh = AudioInputSchema.safeParse({
      duration_seconds: 10,
      recorded_at: '2025-04-15T10:30:00Z',
      transcript: null,
      sentiment_score: 1.5,
    });
    expect(tooHigh.success).toBe(false);

    const tooLow = AudioInputSchema.safeParse({
      duration_seconds: 10,
      recorded_at: '2025-04-15T10:30:00Z',
      transcript: null,
      sentiment_score: -1.5,
    });
    expect(tooLow.success).toBe(false);
  });

  it('accepts sentiment at boundary values', () => {
    const minSentiment = AudioInputSchema.safeParse({
      duration_seconds: 10,
      recorded_at: '2025-04-15T10:30:00Z',
      transcript: null,
      sentiment_score: -1,
    });
    expect(minSentiment.success).toBe(true);

    const maxSentiment = AudioInputSchema.safeParse({
      duration_seconds: 10,
      recorded_at: '2025-04-15T10:30:00Z',
      transcript: null,
      sentiment_score: 1,
    });
    expect(maxSentiment.success).toBe(true);
  });

  it('defaults sentiment_keywords to empty array', () => {
    const result = AudioInputSchema.parse({
      duration_seconds: 10,
      recorded_at: '2025-04-15T10:30:00Z',
      transcript: null,
      sentiment_score: null,
    });
    expect(result.sentiment_keywords).toEqual([]);
  });
});

// =============================================================================
// COMPANION INPUT SCHEMA
// =============================================================================

describe('CompanionInputSchema', () => {
  it('accepts valid companion with all fields', () => {
    const result = CompanionInputSchema.safeParse({
      name: 'Mom',
      relationship: 'family',
      detected_from_photo: false,
      age_group: 'adult',
    });
    expect(result.success).toBe(true);
  });

  it('accepts companion with minimal fields', () => {
    const result = CompanionInputSchema.safeParse({
      name: 'Sarah',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = CompanionInputSchema.safeParse({
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid relationship types', () => {
    const relationships = ['family', 'friend', 'partner', 'colleague', 'other'];
    relationships.forEach(rel => {
      const result = CompanionInputSchema.safeParse({
        name: 'Test',
        relationship: rel,
      });
      expect(result.success).toBe(true);
    });
  });

  it('rejects invalid relationship type', () => {
    const result = CompanionInputSchema.safeParse({
      name: 'Test',
      relationship: 'stranger',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid age groups', () => {
    const ageGroups = ['child', 'teen', 'adult', 'senior'];
    ageGroups.forEach(age => {
      const result = CompanionInputSchema.safeParse({
        name: 'Test',
        age_group: age,
      });
      expect(result.success).toBe(true);
    });
  });

  it('defaults detected_from_photo to false', () => {
    const result = CompanionInputSchema.parse({
      name: 'Test',
    });
    expect(result.detected_from_photo).toBe(false);
  });
});

// =============================================================================
// SENSORY INPUT SCHEMA
// =============================================================================

describe('SensoryInputSchema', () => {
  const validInput = {
    photos: { count: 5, refs: [] },
    audio: null,
    venue: { name: 'Senso-ji Temple' },
    companions: [],
    captured_at: '2025-04-15T10:30:00Z',
  };

  it('accepts valid minimal input', () => {
    const result = SensoryInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('requires at least 1 photo', () => {
    const result = SensoryInputSchema.safeParse({
      ...validInput,
      photos: { count: 0, refs: [] },
    });
    expect(result.success).toBe(false);
  });

  it('accepts input with full audio data', () => {
    const result = SensoryInputSchema.safeParse({
      ...validInput,
      audio: {
        duration_seconds: 15,
        recorded_at: '2025-04-15T10:30:00Z',
        transcript: null,
        sentiment_score: 0.8,
        sentiment_keywords: ['Japan', 'dream'],
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts venue with coordinates', () => {
    const result = SensoryInputSchema.safeParse({
      ...validInput,
      venue: {
        name: 'Senso-ji Temple',
        category: 'landmark',
        coordinates: { lat: 35.7148, lon: 139.7967 },
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts null venue', () => {
    const result = SensoryInputSchema.safeParse({
      ...validInput,
      venue: null,
    });
    expect(result.success).toBe(true);
  });

  it('requires venue name to be non-empty', () => {
    const result = SensoryInputSchema.safeParse({
      ...validInput,
      venue: { name: '' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts companions array', () => {
    const result = SensoryInputSchema.safeParse({
      ...validInput,
      companions: [
        { name: 'Mom', relationship: 'family' },
        { name: 'Max', relationship: 'family', age_group: 'child' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('requires valid datetime for captured_at', () => {
    const result = SensoryInputSchema.safeParse({
      ...validInput,
      captured_at: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional duration_minutes', () => {
    const result = SensoryInputSchema.safeParse({
      ...validInput,
      duration_minutes: 45,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration_minutes).toBe(45);
    }
  });

  it('provides default detection values', () => {
    const result = SensoryInputSchema.parse(validInput);
    expect(result.detection.trigger).toBe('manual');
    expect(result.detection.confidence).toBe(1.0);
    expect(result.detection.signals).toContain('user_initiated');
  });

  it('accepts custom detection values', () => {
    const result = SensoryInputSchema.safeParse({
      ...validInput,
      detection: {
        trigger: 'photos',
        confidence: 0.85,
        signals: ['burst_detected', 'same_location'],
      },
    });
    expect(result.success).toBe(true);
  });

  it('provides default preferences', () => {
    const result = SensoryInputSchema.parse(validInput);
    expect(result.preferences.enable_cloud_synthesis).toBe(true);
    expect(result.preferences.include_companion_insights).toBe(true);
  });

  it('accepts custom preferences', () => {
    const result = SensoryInputSchema.safeParse({
      ...validInput,
      preferences: {
        enable_cloud_synthesis: false,
        include_companion_insights: false,
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preferences.enable_cloud_synthesis).toBe(false);
    }
  });
});

// =============================================================================
// OUTPUT SCHEMAS
// =============================================================================

describe('AtmosphereSchema', () => {
  it('accepts valid atmosphere', () => {
    const result = AtmosphereSchema.safeParse({
      lighting: 'golden_hour',
      energy: 'calm',
      setting: 'outdoor',
      crowd_feel: 'moderate',
    });
    expect(result.success).toBe(true);
  });

  it('requires all fields', () => {
    const result = AtmosphereSchema.safeParse({
      lighting: 'bright',
      energy: 'calm',
      // missing setting and crowd_feel
    });
    expect(result.success).toBe(false);
  });
});

describe('NarrativesSchema', () => {
  it('accepts valid narratives', () => {
    const result = NarrativesSchema.safeParse({
      short: 'A beautiful morning at the temple.',
      medium: 'We walked through the ancient gates as incense filled the air.',
      full: 'A longer narrative about the complete experience at the temple with all details.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short narrative over 280 characters', () => {
    const result = NarrativesSchema.safeParse({
      short: 'a'.repeat(281),
      medium: 'Test medium',
      full: 'Test full',
    });
    expect(result.success).toBe(false);
  });

  it('accepts short narrative at exactly 280 characters', () => {
    const result = NarrativesSchema.safeParse({
      short: 'a'.repeat(280),
      medium: 'Test medium',
      full: 'Test full',
    });
    expect(result.success).toBe(true);
  });
});

describe('MemoryAnchorsSchema', () => {
  it('accepts valid memory anchors', () => {
    const result = MemoryAnchorsSchema.safeParse({
      sensory_anchor: 'Incense curling through golden light',
      emotional_anchor: 'The moment Mom smiled',
      unexpected_anchor: null,
      shareable_anchor: 'The iconic gate photo',
      family_anchor: 'Max running ahead excitedly',
    });
    expect(result.success).toBe(true);
  });

  it('requires sensory and emotional anchors', () => {
    const result = MemoryAnchorsSchema.safeParse({
      unexpected_anchor: null,
      shareable_anchor: null,
      family_anchor: null,
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

describe('validateSensoryInput', () => {
  it('returns parsed input for valid data', () => {
    const input = {
      photos: { count: 1, refs: [] },
      captured_at: '2025-04-15T10:30:00Z',
    };
    const result = validateSensoryInput(input);
    expect(result.photos.count).toBe(1);
    expect(result.detection.trigger).toBe('manual'); // Default
  });

  it('throws for invalid input', () => {
    expect(() => validateSensoryInput({ photos: { count: 0 } })).toThrow();
  });
});

describe('safeParseSensoryInput', () => {
  it('returns success true for valid input', () => {
    const result = safeParseSensoryInput({
      photos: { count: 1, refs: [] },
      captured_at: '2025-04-15T10:30:00Z',
    });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it('returns success false with errors for invalid input', () => {
    const result = safeParseSensoryInput({
      photos: { count: 0 },
      captured_at: 'invalid',
    });
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('includes field path in error messages', () => {
    const result = safeParseSensoryInput({
      photos: { count: 0 },
      captured_at: '2025-04-15T10:30:00Z',
    });
    expect(result.success).toBe(false);
    expect(result.errors!.some(e => e.includes('photos'))).toBe(true);
  });
});

// =============================================================================
// TRANSCENDENCE SCORING
// =============================================================================

describe('TRANSCENDENCE_WEIGHTS', () => {
  it('has all required factor weights', () => {
    expect(TRANSCENDENCE_WEIGHTS.emotion_intensity).toBeDefined();
    expect(TRANSCENDENCE_WEIGHTS.atmosphere_quality).toBeDefined();
    expect(TRANSCENDENCE_WEIGHTS.novelty_factor).toBeDefined();
    expect(TRANSCENDENCE_WEIGHTS.fame_score).toBeDefined();
    expect(TRANSCENDENCE_WEIGHTS.weather_match).toBeDefined();
    expect(TRANSCENDENCE_WEIGHTS.companion_engagement).toBeDefined();
    expect(TRANSCENDENCE_WEIGHTS.intent_match).toBeDefined();
    expect(TRANSCENDENCE_WEIGHTS.surprise_factor).toBeDefined();
  });

  it('weights sum to 1.0', () => {
    const sum = Object.values(TRANSCENDENCE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

describe('calculateTranscendence', () => {
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

  it('returns 0.5 when all factors are 0.5', () => {
    expect(calculateTranscendence(baseFactors)).toBeCloseTo(0.5, 2);
  });

  it('returns value close to 1 when all factors are 1', () => {
    const highFactors: TranscendenceFactors = {
      emotion_intensity: 1,
      atmosphere_quality: 1,
      novelty_factor: 1,
      fame_score: 1,
      weather_match: 1,
      companion_engagement: 1,
      intent_match: 1,
      surprise_factor: 1,
    };
    expect(calculateTranscendence(highFactors)).toBeCloseTo(1.0, 2);
  });

  it('returns 0 when all factors are 0', () => {
    const lowFactors: TranscendenceFactors = {
      emotion_intensity: 0,
      atmosphere_quality: 0,
      novelty_factor: 0,
      fame_score: 0,
      weather_match: 0,
      companion_engagement: 0,
      intent_match: 0,
      surprise_factor: 0,
    };
    expect(calculateTranscendence(lowFactors)).toBe(0);
  });

  it('clamps result to 0-1 range', () => {
    // Even with edge cases, should stay in range
    const result = calculateTranscendence(baseFactors);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('emotion_intensity has highest weight impact', () => {
    const emotionHigh: TranscendenceFactors = { ...baseFactors, emotion_intensity: 1 };
    const surpriseHigh: TranscendenceFactors = { ...baseFactors, surprise_factor: 1 };

    // Emotion (0.25 weight) should impact more than surprise (0.05 weight)
    const emotionScore = calculateTranscendence(emotionHigh);
    const surpriseScore = calculateTranscendence(surpriseHigh);
    expect(emotionScore).toBeGreaterThan(surpriseScore);
  });
});

describe('getTranscendenceTier', () => {
  it('returns "peak" for score >= 0.85', () => {
    expect(getTranscendenceTier(0.85)).toBe('peak');
    expect(getTranscendenceTier(0.9)).toBe('peak');
    expect(getTranscendenceTier(1.0)).toBe('peak');
  });

  it('returns "highlight" for score >= 0.7 and < 0.85', () => {
    expect(getTranscendenceTier(0.7)).toBe('highlight');
    expect(getTranscendenceTier(0.75)).toBe('highlight');
    expect(getTranscendenceTier(0.84)).toBe('highlight');
  });

  it('returns "memorable" for score >= 0.5 and < 0.7', () => {
    expect(getTranscendenceTier(0.5)).toBe('memorable');
    expect(getTranscendenceTier(0.6)).toBe('memorable');
    expect(getTranscendenceTier(0.69)).toBe('memorable');
  });

  it('returns "normal" for score >= 0.3 and < 0.5', () => {
    expect(getTranscendenceTier(0.3)).toBe('normal');
    expect(getTranscendenceTier(0.4)).toBe('normal');
    expect(getTranscendenceTier(0.49)).toBe('normal');
  });

  it('returns "forgettable" for score < 0.3', () => {
    expect(getTranscendenceTier(0.29)).toBe('forgettable');
    expect(getTranscendenceTier(0.1)).toBe('forgettable');
    expect(getTranscendenceTier(0)).toBe('forgettable');
  });
});
