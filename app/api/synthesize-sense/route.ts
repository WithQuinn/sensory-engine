import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rateLimit";
import { logServerEvent } from "@/lib/telemetry";
import {
  SensoryInputSchema,
  MomentSenseSchema,
  type SensoryInput,
  type MomentSense,
  type ProcessingTier,
  type Lighting,
  type Energy,
  type Setting,
  type CrowdFeel,
} from "@/lib/sensoryValidation";
import {
  buildErrorResponse,
  getRequestIdentifier,
  validateCsrfToken,
  generateRequestId
} from "@/lib/validation";
import { fetchWeather } from "@/lib/weatherData";
import { fetchVenueEnrichment, getMockVenueData } from "@/lib/sensoryData";
import {
  SENSORY_SYSTEM_PROMPT,
  buildSynthesisPrompt,
  parseSynthesisResponse,
  generateFallbackNarrative,
  type SynthesisInput,
} from "@/lib/sensoryPrompts";
import {
  calculateTranscendenceScore,
  buildTranscendenceFactors,
  analyzeExcitement,
} from "@/lib/excitementEngine";

// =============================================================================
// POST /api/synthesize-sense
// Main Sensory Agent synthesis endpoint
// PRIVACY: Receives only metadata - no photos, audio, or transcript text
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const now = new Date().toISOString();
  const requestId = generateRequestId();

  // ---------------------------------------------------------------------------
  // 0. CSRF Protection
  // ---------------------------------------------------------------------------
  const csrfToken = request.headers.get("X-CSRF-Token");
  const isOriginValid = validateCsrfToken(request, csrfToken);

  if (!isOriginValid) {
    logServerEvent("csrf_validation_failed", requestId, {
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
    });

    return NextResponse.json(
      buildErrorResponse(
        "CSRF validation failed",
        "CSRF_INVALID",
        { requestId },
        requestId
      ),
      { status: 403 }
    );
  }

  // ---------------------------------------------------------------------------
  // 1. Rate Limiting
  // ---------------------------------------------------------------------------
  const identifier = getRequestIdentifier(request);
  const allowed = checkRateLimit(identifier);
  const rateLimitHeaders = getRateLimitHeaders(identifier);

  if (!allowed) {
    return NextResponse.json(
      buildErrorResponse(
        "Rate limit exceeded. Please try again later.",
        "RATE_LIMITED",
        { requestId },
        requestId
      ),
      {
        status: 429,
        headers: rateLimitHeaders,
      }
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Parse and Validate Request Body
  // ---------------------------------------------------------------------------
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      buildErrorResponse(
        "Invalid JSON in request body",
        "VALIDATION_ERROR",
        { requestId },
        requestId
      ),
      {
        status: 400,
        headers: rateLimitHeaders,
      }
    );
  }

  const validation = SensoryInputSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      buildErrorResponse(
        validation.error.errors[0]?.message || "Invalid request",
        "VALIDATION_ERROR",
        { errors: validation.error.errors, requestId },
        requestId
      ),
      {
        status: 400,
        headers: rateLimitHeaders,
      }
    );
  }

  const input: SensoryInput = validation.data;
  const sessionId = request.headers.get("X-Session-ID");

  logServerEvent("synthesize_sense_request", sessionId, {
    photo_count: input.photos.count,
    has_audio: !!input.audio,
    has_venue: !!input.venue,
    companion_count: input.companions.length,
  });

  // ---------------------------------------------------------------------------
  // 3. Fetch Cloud Enrichment Data (Weather + Venue)
  // ---------------------------------------------------------------------------
  let processingTier: ProcessingTier = "full";
  const servicesCalled: string[] = [];

  // Weather (if coordinates available)
  let weatherData = null;
  if (input.venue?.coordinates) {
    const weatherResult = await fetchWeather(
      input.venue.coordinates.lat,
      input.venue.coordinates.lon
    );
    if (weatherResult.success && weatherResult.data) {
      weatherData = weatherResult.data;
      servicesCalled.push("openweather");
    }
  }

  // Venue enrichment (Wikipedia)
  let venueEnrichment = null;
  if (input.venue?.name) {
    const venueResult = await fetchVenueEnrichment(input.venue.name);
    if (venueResult.success && venueResult.data) {
      venueEnrichment = venueResult.data;
      servicesCalled.push("wikipedia");
    } else {
      venueEnrichment = getMockVenueData(input.venue.name);
      servicesCalled.push("mock_venue");
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Build Synthesis Input (metadata only - no transcript)
  // ---------------------------------------------------------------------------
  const photoAnalysis = aggregatePhotoAnalysis(input);

  const synthesisInput: SynthesisInput = {
    photoAnalysis,
    voiceAnalysis: input.audio
      ? {
          sentimentScore: input.audio.sentiment_score,
          detectedTone: inferToneFromSentiment(input.audio.sentiment_score),
          keywords: input.audio.sentiment_keywords,
          theme: inferTheme(input.audio.sentiment_keywords),
          durationSeconds: input.audio.duration_seconds,
        }
      : null,
    venue: venueEnrichment
      ? {
          name: venueEnrichment.verified_name,
          category: venueEnrichment.category,
          description: venueEnrichment.description,
          foundedYear: venueEnrichment.founded_year,
          historicalSignificance: venueEnrichment.historical_significance,
          uniqueClaims: venueEnrichment.unique_claims,
          fameScore: venueEnrichment.fame_score,
        }
      : null,
    weather: weatherData
      ? {
          condition: weatherData.condition,
          temperatureC: weatherData.temperature_c,
          comfortScore: weatherData.outdoor_comfort_score,
        }
      : null,
    companions: input.companions.map((c) => ({
      relationship: c.relationship || "other",
      nickname: c.name,
      age_group: c.age_group,
    })),
    context: {
      localTime: input.captured_at,
      isGoldenHour: isGoldenHour(input.captured_at),
      isWeekend: isWeekend(input.captured_at),
      durationMinutes: input.duration_minutes || null,
      tripIntent: undefined,
    },
  };

  // ---------------------------------------------------------------------------
  // 5. Call Claude for Synthesis (or use fallback)
  // ---------------------------------------------------------------------------
  let synthesisOutput;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (anthropicKey) {
    try {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const prompt = buildSynthesisPrompt(synthesisInput);

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: SENSORY_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";
      synthesisOutput = parseSynthesisResponse(text);
      servicesCalled.push("claude_text");

      if (!synthesisOutput) {
        synthesisOutput = generateFallbackNarrative(synthesisInput);
        processingTier = "local_only";
      }
    } catch (error) {
      console.error("Claude synthesis error:", error);
      synthesisOutput = generateFallbackNarrative(synthesisInput);
      processingTier = "local_only";
    }
  } else {
    synthesisOutput = generateFallbackNarrative(synthesisInput);
    processingTier = "local_only";
  }

  // ---------------------------------------------------------------------------
  // 6. Calculate Transcendence Score
  // ---------------------------------------------------------------------------
  const excitementAnalysis = analyzeExcitement(venueEnrichment);

  // TODO: Track actual visit history per user/venue to determine isFirstVisit
  // For now, assume first visit. This should integrate with Profile Agent's
  // visit history once available. See Issue #69.
  const isFirstVisit = true;

  const transcendenceFactors = buildTranscendenceFactors({
    sentimentScore: input.audio?.sentiment_score ?? null,
    atmosphereQuality: calculateAtmosphereQuality(photoAnalysis),
    isFirstVisit,
    fameScore: venueEnrichment?.fame_score ?? null,
    weatherComfort: weatherData?.outdoor_comfort_score ?? null,
    companionCount: input.companions.length,
    intentMatch: null,
    hadUnexpectedMoment: false,
  });

  const transcendenceResult = calculateTranscendenceScore(transcendenceFactors);

  // ---------------------------------------------------------------------------
  // 7. Assemble Final MomentSense Output (matching schema exactly)
  // ---------------------------------------------------------------------------
  const processingTime = Date.now() - startTime;
  const localPercentage = processingTier === "local_only" ? 95 : 65;

  // Map lighting to valid enum value
  const lightingMap: Record<string, Lighting> = {
    golden_hour: "golden_hour",
    bright: "bright",
    dim: "overcast",
    night: "night",
    mixed: "bright",
  };

  // Map energy to valid enum value
  const energyMap: Record<string, Energy> = {
    serene: "tranquil",
    calm: "calm",
    lively: "lively",
    energetic: "energetic",
    intense: "chaotic",
  };

  // Map crowd to valid enum value
  const crowdMap: Record<string, CrowdFeel> = {
    empty: "empty",
    sparse: "sparse",
    moderate: "moderate",
    busy: "busy",
    packed: "packed",
  };

  // Map setting
  const settingMap: Record<string, Setting> = {
    indoor: "indoor",
    outdoor: "outdoor",
    mixed: "outdoor",
  };

  const momentSense: MomentSense = {
    moment_id: crypto.randomUUID(),
    timestamp: input.captured_at,
    venue_name: input.venue?.name || "Unknown Location",
    venue_category: venueEnrichment?.category ?? null,

    detection: {
      trigger: input.detection?.trigger || "manual",
      confidence: input.detection?.confidence || 1.0,
      signals: [],
    },

    photos: {
      count: input.photos.count,
      refs: input.photos.refs,
    },

    emotion_tags: [synthesisOutput.primaryEmotion, ...synthesisOutput.secondaryEmotions],
    primary_emotion: synthesisOutput.primaryEmotion,
    emotion_confidence: synthesisOutput.emotionConfidence,

    atmosphere: {
      lighting: lightingMap[photoAnalysis.lighting || "bright"] || "bright",
      energy: energyMap[photoAnalysis.energyLevel || "calm"] || "calm",
      setting: settingMap[photoAnalysis.indoorOutdoor || "outdoor"] || "outdoor",
      crowd_feel: crowdMap[photoAnalysis.crowdLevel || "moderate"] || "moderate",
    },

    transcendence_score: transcendenceResult.score,
    transcendence_factors: [
      `Emotion: ${(transcendenceFactors.emotion_intensity * 100).toFixed(0)}%`,
      `Atmosphere: ${(transcendenceFactors.atmosphere_quality * 100).toFixed(0)}%`,
      `Fame: ${(transcendenceFactors.fame_score * 100).toFixed(0)}%`,
    ],

    sensory_details: {
      visual: synthesisOutput.memoryAnchors.sensory || "The scene before you",
      audio: synthesisOutput.inferredSensory.sound,
      scent: synthesisOutput.inferredSensory.scent,
      tactile: synthesisOutput.inferredSensory.tactile,
    },

    excitement: {
      fame_score: venueEnrichment?.fame_score ?? null,
      fame_signals: [],
      unique_claims: excitementAnalysis.uniqueFacts,
      historical_significance: venueEnrichment?.historical_significance ?? null,
      excitement_hook: excitementAnalysis.excitementHook,
    },

    memory_anchors: {
      sensory_anchor: synthesisOutput.memoryAnchors.sensory,
      emotional_anchor: synthesisOutput.memoryAnchors.emotional,
      unexpected_anchor: synthesisOutput.memoryAnchors.unexpected,
      shareable_anchor: synthesisOutput.memoryAnchors.shareable,
      family_anchor: synthesisOutput.memoryAnchors.companion,
    },

    narratives: {
      short: synthesisOutput.narratives.short,
      medium: synthesisOutput.narratives.medium,
      full: synthesisOutput.narratives.full,
    },

    companion_experiences: synthesisOutput.companionExperiences.map((ce) => {
      // Look up original companion to get the actual relationship
      const originalCompanion = input.companions.find(
        (c) => c.name === ce.nickname || c.name?.toLowerCase() === ce.nickname?.toLowerCase()
      );
      return {
        name: ce.nickname,
        relationship: originalCompanion?.relationship || "other",
        moment_highlight: ce.reaction,
        engagement_level: "moderate" as const,
        interests_matched: [],
        needs_met: [],
        concerns: [],
      };
    }),

    environment: {
      weather: weatherData
        ? {
            condition: weatherData.condition,
            temperature_c: weatherData.temperature_c,
            outdoor_comfort_score: weatherData.outdoor_comfort_score,
          }
        : null,
      timing: {
        local_time: formatLocalTime(input.captured_at),
        is_golden_hour: synthesisInput.context.isGoldenHour,
      },
    },

    user_reflection: {
      voice_note_transcript: null, // Never sent to cloud - stays on device
      sentiment: input.audio?.sentiment_score ?? null,
      keywords: input.audio?.sentiment_keywords ?? [],
    },

    processing: {
      tier: processingTier,
      local_percentage: localPercentage,
      cloud_calls: servicesCalled,
      processing_time_ms: processingTime,
    },

    status: "active",
    created_at: now,
    updated_at: now,
  };

  // Validate output - return 500 if validation fails (don't send invalid data)
  const outputValidation = MomentSenseSchema.safeParse(momentSense);
  if (!outputValidation.success) {
    console.error("MomentSense validation failed:", outputValidation.error.errors);
    logServerEvent("synthesize_sense_validation_error", sessionId, {
      errors: outputValidation.error.errors.map((e) => e.message),
    });
    // Return 500 - don't send invalid response to client
    const errorResponse: ErrorResponse = {
      success: false,
      error: "Internal error: synthesis output validation failed",
    };
    return NextResponse.json(errorResponse, {
      status: 500,
      headers: rateLimitHeaders,
    });
  }

  logServerEvent("synthesize_sense_success", sessionId, {
    processing_time_ms: processingTime,
    tier: processingTier,
    transcendence_score: transcendenceResult.score,
    is_highlight: transcendenceResult.isHighlight,
  });

  return NextResponse.json(
    { success: true, moment: momentSense },
    { status: 200, headers: rateLimitHeaders }
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function aggregatePhotoAnalysis(input: SensoryInput): SynthesisInput["photoAnalysis"] {
  const refs = input.photos.refs;
  if (refs.length === 0) {
    return {
      scene: null,
      lighting: null,
      indoorOutdoor: null,
      faceCount: 0,
      crowdLevel: null,
      energyLevel: null,
      emotions: [],
    };
  }

  const scenes = refs.map((r) => r.local_analysis?.scene_type).filter(Boolean);
  const lightings = refs.map((r) => r.local_analysis?.lighting).filter(Boolean);
  const indoorOutdoors = refs.map((r) => r.local_analysis?.indoor_outdoor).filter(Boolean);
  const faceCount = refs.reduce((sum, r) => sum + (r.local_analysis?.face_count || 0), 0);
  const emotions = refs.map((r) => r.local_analysis?.basic_emotion).filter(Boolean) as string[];

  return {
    scene: scenes[0] || null,
    lighting: lightings[0] || null,
    indoorOutdoor: indoorOutdoors[0] || null,
    faceCount,
    crowdLevel: refs[0]?.local_analysis?.crowd_level || null,
    energyLevel: refs[0]?.local_analysis?.energy_level || null,
    emotions: Array.from(new Set(emotions)),
  };
}

function inferToneFromSentiment(score: number | null): string | null {
  if (score === null) return null;
  if (score > 0.7) return "excited";
  if (score > 0.4) return "happy";
  if (score > 0) return "content";
  if (score > -0.3) return "neutral";
  return "reflective";
}

function inferTheme(keywords: string[]): string | null {
  const kw = new Set(keywords.map((k) => k.toLowerCase()));
  if (kw.has("dream") || kw.has("dreamed") || kw.has("always")) return "fulfillment";
  if (kw.has("first") || kw.has("never") || kw.has("new")) return "discovery";
  if (kw.has("remember") || kw.has("childhood") || kw.has("back")) return "nostalgia";
  if (kw.has("peace") || kw.has("calm") || kw.has("quiet")) return "tranquility";
  if (kw.has("amazing") || kw.has("incredible") || kw.has("wow")) return "wonder";
  if (kw.has("together") || kw.has("family") || kw.has("friends")) return "connection";
  return null;
}

function isGoldenHour(dateStr: string): boolean {
  try {
    const date = new Date(dateStr);
    const hour = date.getHours();
    return (hour >= 6 && hour <= 8) || (hour >= 17 && hour <= 19);
  } catch {
    return false;
  }
}

function isWeekend(dateStr: string): boolean {
  try {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6;
  } catch {
    return false;
  }
}

function formatLocalTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Unknown time";
  }
}

function calculateAtmosphereQuality(
  photoAnalysis: SynthesisInput["photoAnalysis"]
): number {
  let score = 0.5;
  if (photoAnalysis.lighting === "golden_hour") score += 0.3;
  if (photoAnalysis.lighting === "bright") score += 0.1;
  if (photoAnalysis.energyLevel === "serene" || photoAnalysis.energyLevel === "calm")
    score += 0.1;
  return Math.min(1, score);
}
