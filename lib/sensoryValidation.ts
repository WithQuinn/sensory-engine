// =============================================================================
// SENSORY AGENT VALIDATION SCHEMAS
// Zod schemas for all Sensory Agent inputs, outputs, and intermediate types
// Based on: docs/sensory-agent-user-story.md v2.8
// =============================================================================

import { z } from 'zod';

// =============================================================================
// ENUMS - Strict categorical values from the story
// =============================================================================

export const LightingEnum = z.enum([
  'golden_hour',
  'bright',
  'overcast',
  'night',
  'indoor_warm',
  'indoor_cool',
]);
export type Lighting = z.infer<typeof LightingEnum>;

export const EnergyEnum = z.enum([
  'tranquil',
  'calm',
  'lively',
  'energetic',
  'chaotic',
]);
export type Energy = z.infer<typeof EnergyEnum>;

export const SettingEnum = z.enum([
  'outdoor',
  'indoor',
  'nature',
  'urban',
  'sacred',
  'transit',
]);
export type Setting = z.infer<typeof SettingEnum>;

export const CrowdFeelEnum = z.enum([
  'empty',
  'sparse',
  'moderate',
  'busy',
  'packed',
]);
export type CrowdFeel = z.infer<typeof CrowdFeelEnum>;

export const VenueCategoryEnum = z.enum([
  'landmark',
  'dining',
  'shopping',
  'nature',
  'event',
  'accommodation',
  'transit',
  'other',
]);
export type VenueCategory = z.infer<typeof VenueCategoryEnum>;

export const EngagementLevelEnum = z.enum([
  'low',
  'moderate',
  'high',
  'exceptional',
]);
export type EngagementLevel = z.infer<typeof EngagementLevelEnum>;

export const DetectionTriggerEnum = z.enum([
  'photos',
  'dwell',
  'calendar',
  'manual',
]);
export type DetectionTrigger = z.infer<typeof DetectionTriggerEnum>;

export const ProcessingTierEnum = z.enum([
  'full',           // All services working
  'reduced_cloud',  // Claude works, enrichment fails
  'local_only',     // Claude Text fails, local analysis only
  'offline',        // No network
]);
export type ProcessingTier = z.infer<typeof ProcessingTierEnum>;

export const MomentStatusEnum = z.enum([
  'active',
  'deleted',
  'exported',
]);
export type MomentStatus = z.infer<typeof MomentStatusEnum>;

// =============================================================================
// INPUT SCHEMAS - What the user/client provides
// =============================================================================

/**
 * Photo reference - forward compatible for iOS PHAsset IDs
 * v1 Web: local_id is null (photos analyzed and discarded)
 * v2+ iOS: local_id contains PHAsset identifier for re-display
 */
export const PhotoReferenceSchema = z.object({
  local_id: z.string().nullable(),
  captured_at: z.string().datetime().nullable(),
  location_extracted: z.boolean().default(false),
  // Local analysis results (populated after on-device processing)
  local_analysis: z.object({
    scene_type: z.string().nullable(),
    lighting: LightingEnum.nullable(),
    indoor_outdoor: z.enum(['indoor', 'outdoor']).nullable(),
    face_count: z.number().nullable(),
    crowd_level: CrowdFeelEnum.nullable(),
    energy_level: EnergyEnum.nullable(),
    basic_emotion: z.string().nullable(),
  }).optional(),
});
export type PhotoReference = z.infer<typeof PhotoReferenceSchema>;

/**
 * Audio input metadata
 * Audio blob itself is handled separately (not in JSON)
 */
export const AudioInputSchema = z.object({
  duration_seconds: z.number().min(0).max(300), // Max 5 minutes
  recorded_at: z.string().datetime(),
  // Populated after transcription
  transcript: z.string().nullable(),
  sentiment_score: z.number().min(-1).max(1).nullable(), // -1 negative, +1 positive
  sentiment_keywords: z.array(z.string()).default([]),
});
export type AudioInput = z.infer<typeof AudioInputSchema>;

/**
 * Companion input - user-provided or face-detected
 */
export const CompanionInputSchema = z.object({
  name: z.string().min(1),
  relationship: z.enum(['family', 'friend', 'partner', 'colleague', 'other']).optional(),
  // From face detection (optional)
  detected_from_photo: z.boolean().default(false),
  age_group: z.enum(['child', 'teen', 'adult', 'senior']).optional(),
});
export type CompanionInput = z.infer<typeof CompanionInputSchema>;

/**
 * Main input schema - what the client sends to synthesize a moment
 */
export const SensoryInputSchema = z.object({
  // Photos (required - at least 1)
  photos: z.object({
    count: z.number().min(1),
    refs: z.array(PhotoReferenceSchema).default([]),
  }),

  // Audio (optional - highly recommended)
  audio: AudioInputSchema.nullable().default(null),

  // Venue (optional - may auto-detect from EXIF)
  venue: z.object({
    name: z.string().min(1),
    category: VenueCategoryEnum.optional(),
    coordinates: z.object({
      lat: z.number(),
      lon: z.number(),
    }).optional(),
  }).nullable().default(null),

  // Companions (optional - may detect from faces)
  companions: z.array(CompanionInputSchema).default([]),

  // Context
  captured_at: z.string().datetime(),
  duration_minutes: z.number().min(0).optional(),

  // Detection metadata (for v2+ ambient detection)
  detection: z.object({
    trigger: DetectionTriggerEnum,
    confidence: z.number().min(0).max(1),
    signals: z.array(z.string()),
  }).default({
    trigger: 'manual',
    confidence: 1.0,
    signals: ['user_initiated'],
  }),

  // User preferences for this synthesis
  preferences: z.object({
    enable_cloud_synthesis: z.boolean().default(true),
    include_companion_insights: z.boolean().default(true),
  }).default({}),
});
export type SensoryInput = z.infer<typeof SensoryInputSchema>;

// =============================================================================
// PROCESSING SCHEMAS - Intermediate results during synthesis
// =============================================================================

/**
 * Local analysis results - from on-device processing
 */
export const LocalAnalysisResultSchema = z.object({
  // Photo analysis aggregate
  photo_analysis: z.object({
    dominant_scene: z.string().nullable(),
    dominant_lighting: LightingEnum.nullable(),
    indoor_outdoor: z.enum(['indoor', 'outdoor', 'mixed']).nullable(),
    total_faces: z.number(),
    crowd_level: CrowdFeelEnum.nullable(),
    energy_level: EnergyEnum.nullable(),
    basic_emotions: z.array(z.string()),
  }),

  // Audio analysis
  audio_analysis: z.object({
    transcript: z.string(),
    sentiment_score: z.number().min(-1).max(1),
    keywords: z.array(z.string()),
    detected_tone: z.string().nullable(), // excited, calm, nostalgic, etc.
  }).nullable(),

  // EXIF extraction
  exif_data: z.object({
    location: z.object({
      lat: z.number(),
      lon: z.number(),
    }).nullable(),
    timestamps: z.array(z.string().datetime()),
    camera_info: z.string().nullable(),
  }).nullable(),

  processing_time_ms: z.number(),
});
export type LocalAnalysisResult = z.infer<typeof LocalAnalysisResultSchema>;

/**
 * Cloud enrichment results - from external APIs
 */
export const CloudEnrichmentSchema = z.object({
  // Venue data (Wikipedia + Google Places)
  venue: z.object({
    verified_name: z.string(),
    category: VenueCategoryEnum,
    description: z.string().nullable(),
    founded_year: z.number().nullable(),
    historical_significance: z.string().nullable(),
    unique_claims: z.array(z.string()),
    fame_score: z.number().min(0).max(1).nullable(),
  }).nullable(),

  // Weather (OpenWeather - coarse coordinates only)
  weather: z.object({
    condition: z.string(),
    temperature_c: z.number(),
    humidity_percent: z.number().optional(),
    outdoor_comfort_score: z.number().min(0).max(1),
  }).nullable(),

  // Timing
  timing: z.object({
    local_time: z.string(),
    is_golden_hour: z.boolean(),
    is_weekend: z.boolean(),
  }).nullable(),

  // Services called (for transparency)
  services_called: z.array(z.string()),
  processing_time_ms: z.number(),
});
export type CloudEnrichment = z.infer<typeof CloudEnrichmentSchema>;

/**
 * Transcendence scoring factors - inputs to the weighted formula
 * Weights from story (marked as initial estimates):
 *   emotion_intensity: 0.25, atmosphere_quality: 0.15, novelty_factor: 0.15,
 *   fame_score: 0.10, weather_match: 0.10, companion_engagement: 0.10,
 *   intent_match: 0.10, surprise_factor: 0.05
 */
export const TranscendenceFactorsSchema = z.object({
  emotion_intensity: z.number().min(0).max(1),
  atmosphere_quality: z.number().min(0).max(1),
  novelty_factor: z.number().min(0).max(1),
  fame_score: z.number().min(0).max(1),
  weather_match: z.number().min(0).max(1),
  companion_engagement: z.number().min(0).max(1),
  intent_match: z.number().min(0).max(1),
  surprise_factor: z.number().min(0).max(1),
});
export type TranscendenceFactors = z.infer<typeof TranscendenceFactorsSchema>;

// =============================================================================
// OUTPUT SCHEMAS - The complete synthesized memory (MomentSense)
// =============================================================================

/**
 * Atmosphere - lighting, energy, setting, crowd feel
 */
export const AtmosphereSchema = z.object({
  lighting: LightingEnum,
  energy: EnergyEnum,
  setting: SettingEnum,
  crowd_feel: CrowdFeelEnum,
});
export type Atmosphere = z.infer<typeof AtmosphereSchema>;

/**
 * Sensory details - visual, audio, scent, tactile
 * Note: scent and tactile are AI-inferred from context, not sensed
 */
export const SensoryDetailsSchema = z.object({
  visual: z.string(),
  audio: z.string().nullable(),
  scent: z.string().nullable(),   // AI-inferred (e.g., temple → incense)
  tactile: z.string().nullable(), // AI-inferred (e.g., beach → sand)
});
export type SensoryDetails = z.infer<typeof SensoryDetailsSchema>;

/**
 * Excitement data - fame, unique claims, hook
 */
export const ExcitementSchema = z.object({
  fame_score: z.number().min(0).max(1).nullable(),
  fame_signals: z.array(z.string()),
  unique_claims: z.array(z.string()),
  historical_significance: z.string().nullable(),
  excitement_hook: z.string().nullable(),
});
export type Excitement = z.infer<typeof ExcitementSchema>;

/**
 * Memory anchors - evocative phrases for recall
 */
export const MemoryAnchorsSchema = z.object({
  sensory_anchor: z.string(),      // Trigger vivid recall
  emotional_anchor: z.string(),    // Capture peak feeling
  unexpected_anchor: z.string().nullable(), // Preserve serendipity
  shareable_anchor: z.string().nullable(),  // Social-worthy moment
  family_anchor: z.string().nullable(),     // Collective memory
});
export type MemoryAnchors = z.infer<typeof MemoryAnchorsSchema>;

/**
 * Narratives - short, medium, full lengths
 */
export const NarrativesSchema = z.object({
  short: z.string().max(280),      // Tweet-length
  medium: z.string(),              // 2-3 sentences
  full: z.string(),                // Full paragraph
});
export type Narratives = z.infer<typeof NarrativesSchema>;

/**
 * Companion experience - per-person synthesis
 */
export const CompanionExperienceSchema = z.object({
  name: z.string(),
  relationship: z.string().optional(),
  moment_highlight: z.string(),
  engagement_level: EngagementLevelEnum,
  interests_matched: z.array(z.string()),
  needs_met: z.array(z.string()),
  concerns: z.array(z.string()),
});
export type CompanionExperience = z.infer<typeof CompanionExperienceSchema>;

/**
 * Environment - weather and timing context
 */
export const EnvironmentSchema = z.object({
  weather: z.object({
    condition: z.string(),
    temperature_c: z.number(),
    outdoor_comfort_score: z.number().min(0).max(1),
  }).nullable(),
  timing: z.object({
    local_time: z.string(),
    is_golden_hour: z.boolean(),
  }),
});
export type Environment = z.infer<typeof EnvironmentSchema>;

/**
 * User reflection - voice note analysis
 */
export const UserReflectionSchema = z.object({
  voice_note_transcript: z.string().nullable(),
  sentiment: z.number().min(-1).max(1).nullable(),
  keywords: z.array(z.string()),
});
export type UserReflection = z.infer<typeof UserReflectionSchema>;

/**
 * Processing metadata - transparency about local vs cloud
 */
export const ProcessingMetadataSchema = z.object({
  local_percentage: z.number().min(0).max(100),
  cloud_calls: z.array(z.string()),
  processing_time_ms: z.number(),
  tier: ProcessingTierEnum,
});
export type ProcessingMetadata = z.infer<typeof ProcessingMetadataSchema>;

/**
 * MomentSense - The complete synthesized memory
 * This is the main output of the Sensory Agent
 */
export const MomentSenseSchema = z.object({
  // Identity
  moment_id: z.string().uuid(),
  timestamp: z.string().datetime(),

  // Venue
  venue_name: z.string(),
  venue_category: VenueCategoryEnum.nullable(),

  // Detection (how this moment was identified)
  detection: z.object({
    trigger: DetectionTriggerEnum,
    confidence: z.number().min(0).max(1),
    signals: z.array(z.string()),
  }),

  // Photos (forward-compatible)
  photos: z.object({
    count: z.number(),
    refs: z.array(PhotoReferenceSchema),
  }),

  // Emotions
  emotion_tags: z.array(z.string()),
  primary_emotion: z.string(),
  emotion_confidence: z.number().min(0).max(1),

  // Atmosphere
  atmosphere: AtmosphereSchema,

  // Transcendence
  transcendence_score: z.number().min(0).max(1),
  transcendence_factors: z.array(z.string()), // Human-readable factors

  // Sensory details (visual, audio, scent, tactile)
  sensory_details: SensoryDetailsSchema,

  // Excitement (fame, claims, hook)
  excitement: ExcitementSchema,

  // Memory anchors
  memory_anchors: MemoryAnchorsSchema,

  // Narratives
  narratives: NarrativesSchema,

  // Companion experiences
  companion_experiences: z.array(CompanionExperienceSchema),

  // Environment
  environment: EnvironmentSchema,

  // User reflection
  user_reflection: UserReflectionSchema,

  // Processing transparency
  processing: ProcessingMetadataSchema,

  // Lifecycle
  status: MomentStatusEnum.default('active'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type MomentSense = z.infer<typeof MomentSenseSchema>;

// =============================================================================
// API RESPONSE SCHEMAS
// =============================================================================

/**
 * Synthesis API success response
 */
export const SynthesisSuccessResponseSchema = z.object({
  success: z.literal(true),
  moment: MomentSenseSchema,
});
export type SynthesisSuccessResponse = z.infer<typeof SynthesisSuccessResponseSchema>;

/**
 * Synthesis API error response
 */
export const SynthesisErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  error_code: z.enum([
    'INVALID_INPUT',
    'NO_PHOTOS',
    'PROCESSING_FAILED',
    'CLOUD_UNAVAILABLE',
    'RATE_LIMITED',
    'INTERNAL_ERROR',
  ]),
  // Partial result if available (graceful degradation)
  partial_moment: MomentSenseSchema.partial().optional(),
});
export type SynthesisErrorResponse = z.infer<typeof SynthesisErrorResponseSchema>;

/**
 * Synthesis API response (success or error)
 */
export const SynthesisResponseSchema = z.discriminatedUnion('success', [
  SynthesisSuccessResponseSchema,
  SynthesisErrorResponseSchema,
]);
export type SynthesisResponse = z.infer<typeof SynthesisResponseSchema>;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate sensory input before processing
 */
export function validateSensoryInput(input: unknown): SensoryInput {
  return SensoryInputSchema.parse(input);
}

/**
 * Validate MomentSense output
 */
export function validateMomentSense(output: unknown): MomentSense {
  return MomentSenseSchema.parse(output);
}

/**
 * Safe parse with error details
 */
export function safeParseSensoryInput(input: unknown): {
  success: boolean;
  data?: SensoryInput;
  errors?: string[];
} {
  const result = SensoryInputSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  };
}

// =============================================================================
// TRANSCENDENCE SCORING
// =============================================================================

/**
 * Transcendence score weights (from story - marked as initial estimates)
 */
export const TRANSCENDENCE_WEIGHTS = {
  emotion_intensity: 0.25,
  atmosphere_quality: 0.15,
  novelty_factor: 0.15,
  fame_score: 0.10,
  weather_match: 0.10,
  companion_engagement: 0.10,
  intent_match: 0.10,
  surprise_factor: 0.05,
} as const;

/**
 * Calculate transcendence score from factors
 */
export function calculateTranscendence(factors: TranscendenceFactors): number {
  const score = Object.entries(TRANSCENDENCE_WEIGHTS).reduce(
    (sum, [key, weight]) => {
      const value = factors[key as keyof TranscendenceFactors] ?? 0;
      return sum + value * weight;
    },
    0
  );
  // Clamp to 0-1 range
  return Math.max(0, Math.min(1, score));
}

/**
 * Get transcendence tier label
 */
export function getTranscendenceTier(score: number): string {
  if (score >= 0.85) return 'peak';
  if (score >= 0.7) return 'highlight';
  if (score >= 0.5) return 'memorable';
  if (score >= 0.3) return 'normal';
  return 'forgettable';
}
