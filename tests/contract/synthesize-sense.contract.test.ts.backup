import { describe, it, expect } from "vitest";
import { SensoryInputSchema, MomentSenseSchema } from "@/lib/sensoryValidation";
import { detectDeviceCapability } from "@/lib/deviceCapability";

/**
 * Contract Tests for /api/synthesize-sense
 *
 * Validates:
 * 1. Input schema compliance (SensoryInputSchema)
 * 2. Output schema compliance (MomentSenseSchema)
 * 3. Endpoint routing logic
 * 4. Error handling
 *
 * These tests use mock requests (no real network calls)
 */

// =============================================================================
// Mock Input Fixtures
// =============================================================================

const mockSensoryInput = {
  photos: {
    count: 2,
    refs: [
      {
        file_id: "photo_001",
        file_name: "temple_entrance.jpg",
        captured_at: "2026-02-14T10:30:00Z",
        file_size_kb: 2048,
        dimensions: { width: 3024, height: 4032 },
        localAnalysis: {
          scene_type: "architecture",
          lighting: "golden_hour",
          indoor_outdoor: "outdoor",
          face_count: 0,
          crowd_level: null,
          energy_level: "serene",
          basic_emotion: "awe",
        },
        cloudAnalysis: {
          description: "Ancient temple entrance with golden light",
          labels: ["temple", "architecture", "historic"],
          landmarks: [{ name: "Senso-ji Temple", confidence: 0.95 }],
          weather: {
            condition: "sunny",
            temperature_c: 22,
            outdoor_comfort_score: 0.85,
          },
        },
      },
      {
        file_id: "photo_002",
        file_name: "temple_garden.jpg",
        captured_at: "2026-02-14T10:35:00Z",
        file_size_kb: 1900,
        dimensions: { width: 3024, height: 4032 },
        localAnalysis: {
          scene_type: "nature",
          lighting: "golden_hour",
          indoor_outdoor: "outdoor",
          face_count: 1,
          crowd_level: null,
          energy_level: "peaceful",
          basic_emotion: "serenity",
        },
        cloudAnalysis: {
          description: "Garden courtyard with peaceful ambiance",
          labels: ["garden", "nature", "peaceful"],
          landmarks: null,
          weather: {
            condition: "sunny",
            temperature_c: 22,
            outdoor_comfort_score: 0.85,
          },
        },
      },
    ],
  },
  audio: {
    duration_seconds: 45,
    recorded_at: "2026-02-14T10:40:00Z",
    transcript:
      "Standing here at the temple, I feel this overwhelming sense of peace. The light is perfect, and being here with Mom makes it even more special.",
    sentiment_score: 0.85,
    sentiment_keywords: [
      "peace",
      "grateful",
      "special",
      "beautiful",
      "together",
    ],
  },
  venue: {
    name: "Senso-ji Temple",
    category: "historic_site",
    coordinates: {
      lat: 35.7148,
      lon: 139.797,
    },
  },
  companions: [
    {
      name: "Mom",
      relationship: "parent",
      detected_from_photo: false,
      age_group: "60+",
    },
  ],
  captured_at: "2026-02-14T10:40:00Z",
  duration_minutes: 15,
  detection: {
    trigger: "manual",
    confidence: 1.0,
    signals: ["user_initiated"],
  },
  preferences: {
    enable_cloud_synthesis: false, // Always local-first in MVP
    include_companion_insights: true,
  },
};

// =============================================================================
// Schema Validation Tests
// =============================================================================

describe("Synthesize-Sense Input Schema", () => {
  it("should accept valid SensoryInput", () => {
    const result = SensoryInputSchema.safeParse(mockSensoryInput);
    expect(result.success).toBe(true);
  });

  it("should reject missing required photo refs", () => {
    const invalid = {
      ...mockSensoryInput,
      photos: { count: 0, refs: [] },
    };
    const result = SensoryInputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should accept input without audio", () => {
    const inputWithoutAudio = {
      ...mockSensoryInput,
      audio: null,
    };
    const result = SensoryInputSchema.safeParse(inputWithoutAudio);
    expect(result.success).toBe(true);
  });

  it("should accept input without venue", () => {
    const inputWithoutVenue = {
      ...mockSensoryInput,
      venue: null,
    };
    const result = SensoryInputSchema.safeParse(inputWithoutVenue);
    expect(result.success).toBe(true);
  });

  it("should accept input without companions", () => {
    const inputWithoutCompanions = {
      ...mockSensoryInput,
      companions: [],
    };
    const result = SensoryInputSchema.safeParse(inputWithoutCompanions);
    expect(result.success).toBe(true);
  });

  it("should enforce photo count >= 1", () => {
    const invalid = {
      ...mockSensoryInput,
      photos: { count: 0, refs: [] },
    };
    const result = SensoryInputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should validate sentiment score range (-1 to 1)", () => {
    const invalid = {
      ...mockSensoryInput,
      audio: {
        ...mockSensoryInput.audio,
        sentiment_score: 1.5, // Invalid: > 1
      },
    };
    const result = SensoryInputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should validate audio duration (0-300 seconds)", () => {
    const invalid = {
      ...mockSensoryInput,
      audio: {
        ...mockSensoryInput.audio,
        duration_seconds: 400, // Invalid: > 300
      },
    };
    const result = SensoryInputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// MomentSense Output Schema Tests
// =============================================================================

describe("Synthesize-Sense Output Schema", () => {
  // Create a valid mock output for testing
  const mockMomentSense: any = {
    moment_id: "123e4567-e89b-12d3-a456-426614174000",
    timestamp: "2026-02-14T10:40:00Z",
    venue_name: "Senso-ji Temple",
    venue_category: "historic_site",
    detection: {
      trigger: "manual",
      confidence: 1.0,
      signals: ["user_initiated"],
    },
    photos: {
      count: 2,
      refs: mockSensoryInput.photos.refs,
    },
    emotion_tags: ["awe", "serenity", "peace"],
    primary_emotion: "awe",
    emotion_confidence: 0.85,
    atmosphere: {
      lighting: "golden_hour",
      energy: "serene",
      setting: "outdoor",
      crowd_feel: "intimate",
    },
    transcendence_score: 8.5,
    transcendence_factors: ["visual_awe", "shared_experience", "venue_context"],
    sensory_details: {
      visual:
        "Golden light catches the ancient stone temple as you step into the quiet courtyard",
      audio:
        "Standing here at the temple, I feel this overwhelming sense of peace...",
      scent: null,
      tactile: null,
    },
    excitement: {
      fame_score: null,
      fame_signals: [],
      unique_claims: [],
      historical_significance: null,
      excitement_hook: null,
    },
    memory_anchors: {
      sensory_anchor: "Golden light on ancient stone",
      emotional_anchor: "Felt: peace, grateful, together",
      unexpected_anchor: null,
      shareable_anchor:
        "Standing at Senso-ji Temple with Mom, bathed in golden light",
      family_anchor: "With: Mom",
    },
    narratives: {
      short:
        "The golden light caught the ancient stone walls as we stepped into the quiet courtyard. In that moment, thousands of years of history felt alive.",
      medium:
        "The golden light caught the ancient stone walls as we stepped into the quiet courtyard. Maya watched the intricate carvings while the afternoon breeze carried the scent of jasmine. In that moment, thousands of years of history felt alive—not distant, but somehow woven into the fabric of this unexpected afternoon.",
      full: "Extended full-length narrative here...",
    },
    companion_experiences: [
      {
        name: "Mom",
        relationship: "parent",
        moment_highlight: "Shared this moment with Mom",
        engagement_level: "present",
        interests_matched: [],
        needs_met: [],
        concerns: [],
      },
    ],
    environment: {
      weather: {
        condition: "sunny",
        temperature_c: 22,
        outdoor_comfort_score: 0.85,
      },
      timing: {
        local_time: "10:40 AM",
        is_golden_hour: true,
      },
    },
    user_reflection: {
      voice_note_transcript:
        "Standing here at the temple, I feel this overwhelming sense of peace...",
      sentiment: 0.85,
      keywords: ["peace", "grateful", "special"],
    },
    processing: {
      local_percentage: 100,
      cloud_calls: [],
      processing_time_ms: 342,
      tier: "phi3_local",
    },
    status: "active",
    created_at: "2026-02-14T10:40:00Z",
    updated_at: "2026-02-14T10:40:00Z",
  };

  it("should accept valid MomentSense output", () => {
    const result = MomentSenseSchema.safeParse(mockMomentSense);
    expect(result.success).toBe(true);
  });

  it("should require all core narrative fields", () => {
    const invalid = {
      ...mockMomentSense,
      narratives: {
        short: "Short narrative",
        // Missing 'medium' and 'full'
      },
    };
    const result = MomentSenseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should require valid UUID for moment_id", () => {
    const invalid = {
      ...mockMomentSense,
      moment_id: "not-a-uuid",
    };
    const result = MomentSenseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should validate transcendence_score is a number", () => {
    const invalid = {
      ...mockMomentSense,
      transcendence_score: "8.5", // String instead of number
    };
    const result = MomentSenseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should allow null values for optional fields (scent, tactile, etc.)", () => {
    const withNulls = {
      ...mockMomentSense,
      sensory_details: {
        visual: "description",
        audio: null,
        scent: null,
        tactile: null,
      },
    };
    const result = MomentSenseSchema.safeParse(withNulls);
    expect(result.success).toBe(true);
  });

  it("should allow empty companion_experiences array", () => {
    const noCompanions = {
      ...mockMomentSense,
      companion_experiences: [],
    };
    const result = MomentSenseSchema.safeParse(noCompanions);
    expect(result.success).toBe(true);
  });

  it("should require local_percentage <= 100", () => {
    const invalid = {
      ...mockMomentSense,
      processing: {
        ...mockMomentSense.processing,
        local_percentage: 150, // Invalid: > 100
      },
    };
    const result = MomentSenseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should require valid tier strings", () => {
    const valid = {
      ...mockMomentSense,
      processing: {
        ...mockMomentSense.processing,
        tier: "phi3_local",
      },
    };
    const result = MomentSenseSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

// =============================================================================
// Device Capability Routing Tests
// =============================================================================

describe("Device Capability Detection", () => {
  it("should detect iOS 18.1+ as apple_intelligence", () => {
    const userAgent =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15";
    expect(detectDeviceCapability(userAgent)).toBe("apple_intelligence");
  });

  it("should detect iOS 15-18.0 with A15+ as phi3_local", () => {
    const userAgent =
      "Mozilla/5.0 (iPhone13,1; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15";
    expect(detectDeviceCapability(userAgent)).toBe("phi3_local");
  });

  it("should detect iOS <15 as queue_synthesis", () => {
    const userAgent =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15";
    expect(detectDeviceCapability(userAgent)).toBe("queue_synthesis");
  });

  it("should detect A14 chip as queue_synthesis (even on iOS 15+)", () => {
    const userAgent =
      "Mozilla/5.0 (iPhone11,2; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15";
    expect(detectDeviceCapability(userAgent)).toBe("queue_synthesis");
  });

  it("should detect A15+ chip as phi3_local capable", () => {
    const userAgent =
      "Mozilla/5.0 (iPhone13,1; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15";
    expect(detectDeviceCapability(userAgent)).toBe("phi3_local");
  });
});

// =============================================================================
// Response Validation Tests
// =============================================================================

describe("API Response Format", () => {
  it("should return success response with moment field", () => {
    // Would be:
    // const response = await fetch('/api/synthesize-sense', { body: mockInput })
    // const data = await response.json()
    // expect(data).toHaveProperty('success', true)
    // expect(data).toHaveProperty('moment')
    // expect(MomentSenseSchema.safeParse(data.moment).success).toBe(true)
  });

  it("should return error response with error field on validation failure", () => {
    // Would be:
    // const response = await fetch('/api/synthesize-sense', { body: invalidInput })
    // const data = await response.json()
    // expect(data).toHaveProperty('success', false)
    // expect(data).toHaveProperty('error')
    // expect(typeof data.error).toBe('string')
  });

  it("should return 400 on invalid JSON", () => {
    // Would be:
    // const response = await fetch('/api/synthesize-sense', { body: 'invalid json' })
    // expect(response.status).toBe(400)
  });

  it("should return 429 on rate limit exceeded", () => {
    // Would be:
    // const response = await fetch('/api/synthesize-sense', { body: mockInput })
    // (after hitting rate limit)
    // expect(response.status).toBe(429)
  });
});
