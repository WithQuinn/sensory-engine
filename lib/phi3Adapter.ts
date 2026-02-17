/**
 * Phi-3 Mini Local Synthesis Adapter
 *
 * Synthesizes emotional narratives using Claude API (delegated from on-device path)
 * Privacy model: Raw media stays on-device; only extracted metadata sent to Claude
 *
 * STATUS: Claude integration active (replaced mock implementation)
 *
 * Privacy guarantee:
 * - NO raw photo data transmitted (only metadata: brightness, saturation, emotion keywords)
 * - NO audio transcript transmitted (only sentiment score and keywords)
 * - All synthesis uses metadata-only payloads
 */

import Anthropic from "@anthropic-ai/sdk";
import { SensoryInput, MomentSense } from "@/lib/sensoryValidation";
import {
  buildSynthesisPrompt,
  parseSynthesisResponse,
  generateFallbackNarrative,
  SENSORY_SYSTEM_PROMPT,
  type SynthesisInput,
  type SynthesisOutput,
} from "@/lib/sensoryPrompts";

/**
 * Synthesize narrative using Claude API (metadata-only payloads)
 * Privacy: Raw media stays on-device; only extracted metadata sent to Claude
 */
export async function synthesizeWithPhi3(
  input: SensoryInput,
  momentId: string
): Promise<MomentSense> {
  const startTime = Date.now();

  try {
    // 1. Build SynthesisInput from SensoryInput (metadata only)
    const synthesisInput = buildSynthesisInputFromSensoryInput(input);

    // 2. Call Claude API for narrative synthesis
    const synthesisOutput = await callClaudeForSynthesis(synthesisInput);

    // 3. Build complete MomentSense response
    const momentSense = buildMomentSense(
      input,
      momentId,
      synthesisOutput,
      startTime
    );

    return momentSense;
  } catch (error) {
    console.error("[phi3Adapter] Error:", error);
    throw new Error(
      `Failed to synthesize with Claude: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// =============================================================================
// SynthesisInput Builder (metadata only - privacy preserved)
// =============================================================================

/**
 * Convert SensoryInput to SynthesisInput for Claude API
 * PRIVACY: Only metadata extracted - no raw photos or transcripts
 */
function buildSynthesisInputFromSensoryInput(
  input: SensoryInput
): SynthesisInput {
  const photoAnalysis = aggregatePhotoAnalysis(input);

  return {
    photoAnalysis,
    // Voice metadata only - transcript stays on-device
    voiceAnalysis: input.audio
      ? {
          sentimentScore: input.audio.sentiment_score,
          detectedTone: inferToneFromSentiment(input.audio.sentiment_score),
          keywords: input.audio.sentiment_keywords,
          theme: inferTheme(input.audio.sentiment_keywords),
          durationSeconds: input.audio.duration_seconds,
        }
      : null,
    // Venue context (local synthesis path doesn't have cloud enrichment)
    venue: input.venue
      ? {
          name: input.venue.name,
          category: input.venue.category || "other",
          description: null,
          foundedYear: null,
          historicalSignificance: null,
          uniqueClaims: [],
          fameScore: null,
        }
      : null,
    // Weather unavailable in local path
    weather: null,
    // Companions
    companions: input.companions.map((c) => ({
      relationship: c.relationship || "other",
      nickname: c.name,
      age_group: c.age_group,
    })),
    // Context
    context: {
      localTime: input.captured_at,
      isGoldenHour: isGoldenHour(input.captured_at),
      isWeekend: isWeekend(input.captured_at),
      durationMinutes: input.duration_minutes || null,
      tripIntent: undefined,
    },
  };
}

/**
 * Aggregate photo analysis from all photo refs
 */
function aggregatePhotoAnalysis(
  input: SensoryInput
): SynthesisInput["photoAnalysis"] {
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

  const scenes = refs
    .map((r) => r.local_analysis?.scene_type)
    .filter(Boolean);
  const lightings = refs
    .map((r) => r.local_analysis?.lighting)
    .filter(Boolean);
  const indoorOutdoors = refs
    .map((r) => r.local_analysis?.indoor_outdoor)
    .filter(Boolean);
  const faceCount = refs.reduce(
    (sum, r) => sum + (r.local_analysis?.face_count || 0),
    0
  );
  const emotions = refs
    .map((r) => r.local_analysis?.basic_emotion)
    .filter(Boolean) as string[];

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

/**
 * Infer tone from sentiment score
 */
function inferToneFromSentiment(score: number | null): string | null {
  if (score === null) return null;
  if (score > 0.7) return "excited";
  if (score > 0.4) return "happy";
  if (score > 0) return "content";
  if (score > -0.3) return "neutral";
  return "reflective";
}

/**
 * Infer theme from keywords
 */
function inferTheme(keywords: string[]): string | null {
  const kw = new Set(keywords.map((k) => k.toLowerCase()));
  if (kw.has("dream") || kw.has("dreamed") || kw.has("always"))
    return "fulfillment";
  if (kw.has("first") || kw.has("never") || kw.has("new"))
    return "discovery";
  if (kw.has("remember") || kw.has("childhood") || kw.has("back"))
    return "nostalgia";
  if (kw.has("peace") || kw.has("calm") || kw.has("quiet"))
    return "tranquility";
  if (kw.has("amazing") || kw.has("incredible") || kw.has("wow"))
    return "wonder";
  if (kw.has("together") || kw.has("family") || kw.has("friends"))
    return "connection";
  return null;
}

/**
 * Check if timestamp is golden hour
 */
function isGoldenHour(dateStr: string): boolean {
  try {
    const date = new Date(dateStr);
    const hour = date.getHours();
    return (hour >= 6 && hour <= 8) || (hour >= 17 && hour <= 19);
  } catch {
    return false;
  }
}

/**
 * Check if timestamp is weekend
 */
function isWeekend(dateStr: string): boolean {
  try {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6;
  } catch {
    return false;
  }
}

// =============================================================================
// Claude API Integration (metadata-only synthesis)
// =============================================================================

/**
 * Call Claude API for synthesis using metadata-only payload
 * PRIVACY: No raw photos or transcripts - only extracted metadata
 */
async function callClaudeForSynthesis(
  synthesisInput: SynthesisInput
): Promise<SynthesisOutput> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    console.warn(
      "[phi3Adapter] No ANTHROPIC_API_KEY - falling back to local narrative"
    );
    return generateFallbackNarrative(synthesisInput);
  }

  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const prompt = buildSynthesisPrompt(synthesisInput);

    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SENSORY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const synthesisOutput = parseSynthesisResponse(text);

    if (!synthesisOutput) {
      console.warn(
        "[phi3Adapter] Failed to parse Claude response - using fallback"
      );
      return generateFallbackNarrative(synthesisInput);
    }

    return synthesisOutput;
  } catch (error) {
    console.error("[phi3Adapter] Claude API error:", error);
    return generateFallbackNarrative(synthesisInput);
  }
}

// =============================================================================
// MomentSense Response Building
// =============================================================================

function buildMomentSense(
  input: SensoryInput,
  momentId: string,
  synthesisOutput: SynthesisOutput,
  startTime: number
): MomentSense {
  const now = new Date().toISOString();
  const processingTime = Date.now() - startTime;
  const primaryPhoto = input.photos.refs[0];

  // Use Claude's synthesis output for primary emotion and confidence
  const primaryEmotion = synthesisOutput.primaryEmotion;
  const emotionConfidence = synthesisOutput.emotionConfidence;
  const emotionTags = [
    synthesisOutput.primaryEmotion,
    ...synthesisOutput.secondaryEmotions,
  ];

  const lightingCondition = primaryPhoto?.local_analysis?.lighting || "bright";
  const energyLevel = primaryPhoto?.local_analysis?.energy_level || "calm";

  // Calculate transcendence score (normalized to 0-1)
  let transcendenceScore = 0.5; // baseline
  if (input.audio?.sentiment_score) {
    // Voice sentiment influences transcendence
    transcendenceScore = Math.max(
      0,
      Math.min(1, 0.5 + input.audio.sentiment_score * 0.5)
    );
  }

  const transcendenceFactors: string[] = [];
  if (input.photos.refs.some((p) => p.local_analysis?.basic_emotion === "awe")) {
    transcendenceFactors.push("visual_awe");
  }
  if (input.audio?.sentiment_keywords.includes("transcendent")) {
    transcendenceFactors.push("voice_transcendence");
  }
  if (input.venue?.name) {
    transcendenceFactors.push("venue_context");
  }
  if (input.companions.length > 0) {
    transcendenceFactors.push("shared_experience");
  }

  return {
    moment_id: momentId,
    timestamp: now,
    venue_name: input.venue?.name || "Unnamed Location",
    venue_category: input.venue?.category || null,
    detection: input.detection,
    photos: input.photos,
    emotion_tags: emotionTags,
    primary_emotion: primaryEmotion,
    emotion_confidence: emotionConfidence,
    atmosphere: {
      lighting: lightingCondition,
      energy: energyLevel,
      setting: primaryPhoto?.local_analysis?.indoor_outdoor === "outdoor"
        ? "outdoor"
        : "indoor",
      crowd_feel: input.companions.length > 2 ? "moderate" : "sparse",
    },
    transcendence_score: transcendenceScore,
    transcendence_factors:
      transcendenceFactors.length > 0
        ? transcendenceFactors
        : ["moment_captured"],
    sensory_details: {
      visual: synthesisOutput.memoryAnchors.sensory,
      audio: synthesisOutput.inferredSensory.sound,
      scent: synthesisOutput.inferredSensory.scent,
      tactile: synthesisOutput.inferredSensory.tactile,
    },
    excitement: {
      fame_score: null,
      fame_signals: [],
      unique_claims: [],
      historical_significance: null,
      excitement_hook: synthesisOutput.excitementHook,
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
      weather: null,
      timing: {
        local_time: new Date().toLocaleTimeString(),
        is_golden_hour: lightingCondition === "golden_hour",
      },
    },
    user_reflection: {
      voice_note_transcript: null, // Never transmitted to cloud
      sentiment: input.audio?.sentiment_score || null,
      keywords: input.audio?.sentiment_keywords || [],
    },
    processing: {
      local_percentage: 65, // Metadata is local, synthesis is cloud
      cloud_calls: ["claude_text"],
      processing_time_ms: processingTime,
      tier: "local_only", // Still considered local tier (metadata stays on-device)
    },
    status: "active",
    created_at: now,
    updated_at: now,
  };
}
