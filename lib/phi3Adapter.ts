/**
 * Phi-3 Mini Local Synthesis Adapter
 *
 * Synthesizes emotional narratives using Phi-3 Mini (3.8B parameter model)
 * Runs entirely on-device (iOS 15+), no cloud calls for personal data
 *
 * STATUS: Interface designed, mock implementation (await Phi-3 SDK)
 *
 * When SDK available, will use:
 * - React Native bridge to Phi-3 inference runtime
 * - Quantized model (INT8 or FP16 for speed)
 * - Local tokenizer (no API calls)
 */

import { SensoryInput, MomentSense } from "@/lib/sensoryValidation";

// =============================================================================
// Mock Synthesis (while waiting for real Phi-3 SDK)
// Replace with actual inference when SDK available
// =============================================================================

interface SynthesisPromptContext {
  venue_name: string;
  photos_count: number;
  has_voice: boolean;
  sentiment_keywords: string[];
  voice_sentiment: number | null;
  companions: Array<{ name: string; relationship?: string }>;
  detected_emotion: string;
}

/**
 * Synthesize narrative using Phi-3 local inference
 */
export async function synthesizeWithPhi3(
  input: SensoryInput,
  momentId: string
): Promise<MomentSense> {
  const startTime = Date.now();

  try {
    // 1. Extract key signals from input
    const context = extractContext(input);

    // 2. Build synthesis prompt
    const prompt = buildSynthesisPrompt(context);

    // 3. Run inference (mocked for now)
    const narrative = await runPhi3Inference(prompt);

    // 4. Build complete MomentSense response
    const momentSense = buildMomentSense(input, momentId, narrative, startTime);

    return momentSense;
  } catch (error) {
    console.error("[phi3Adapter] Error:", error);
    throw new Error(
      `Failed to synthesize with Phi-3: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// =============================================================================
// Context Extraction
// =============================================================================

function extractContext(input: SensoryInput): SynthesisPromptContext {
  const primaryPhoto = input.photos.refs[0];
  const detectedEmotion = primaryPhoto?.local_analysis?.basic_emotion || "wonder";

  return {
    venue_name: input.venue?.name || "a special place",
    photos_count: input.photos.count,
    has_voice: !!input.audio,
    sentiment_keywords: input.audio?.sentiment_keywords || [],
    voice_sentiment: input.audio?.sentiment_score || null,
    companions: input.companions,
    detected_emotion: detectedEmotion,
  };
}

// =============================================================================
// Prompt Engineering
// =============================================================================

function buildSynthesisPrompt(context: SynthesisPromptContext): string {
  const sentimentTone = describeSentimentTone(context.voice_sentiment);
  const companionContext =
    context.companions.length > 0
      ? `with ${context.companions.map((c) => c.name).join(", ")}`
      : "solo";

  const basePrompt = `You are a poetic narrative synthesizer for travel moments. Create a vivid, emotionally resonant short narrative (100-150 words) of this moment:

Venue: ${context.venue_name}
Photos: ${context.photos_count} image(s) captured
Setting: ${companionContext}
Mood: ${context.detected_emotion}
Voice sentiment: ${sentimentTone}
Keywords from user: ${context.sentiment_keywords.join(", ") || "none"}

Write a narrative that:
- Captures the emotional essence of the moment
- References specific details from photos/voice
- Matches the user's sentiment tone
- Feels personal and specific (not generic)
- Includes vivid sensory details

Narrative:`;

  return basePrompt;
}

function describeSentimentTone(sentiment: number | null): string {
  if (sentiment === null || sentiment === undefined) {
    return "neutral";
  }

  // sentiment is -1 to 1
  if (sentiment > 0.7) return "very positive, excited";
  if (sentiment > 0.4) return "positive, happy";
  if (sentiment > 0.2) return "slightly positive, content";
  if (sentiment > -0.2) return "neutral";
  if (sentiment > -0.4) return "slightly negative, reflective";
  if (sentiment > -0.7) return "negative, contemplative";
  return "very negative, somber";
}

// =============================================================================
// Mock Inference (Replace with real Phi-3 when SDK available)
// =============================================================================

/**
 * Mock implementation of Phi-3 inference
 * Returns a plausible narrative for testing
 *
 * TODO: Replace with actual Phi-3 inference when SDK available
 */
async function runPhi3Inference(_prompt: string): Promise<string> {
  // Simulate network/inference latency (200-800ms typical)
  const delay = Math.random() * 600 + 200;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Mock response (would be actual Phi-3 output in production)
  const mockNarratives = [
    "The golden light caught the ancient stone walls as we stepped into the quiet courtyard. Maya pointed at the intricate carvings while the afternoon breeze carried the scent of jasmine. In that moment, thousands of years of history felt alive—not distant, but somehow woven into the fabric of this unexpected afternoon. We stood together in silence, knowing this was the moment we'd remember most.",

    "The rain drummed softly against the café window as I watched the steam rise from my cup. Everything felt quiet, intentional. The waiter remembered my order from yesterday, and that small gesture—that human continuity—suddenly felt profound. Travel isn't always about the extraordinary destinations. Sometimes it's about these small moments of being known in a new place.",

    "Three generations stood on that lookout point—the city sprawling beneath us like a golden circuit board. My mother squeezed my hand. The kids ran circles around the safety railing, their laughter cutting through the wind. This was why we came. Not for the guidebook moments, but for this: the impossible beauty of ordinary family time in an extraordinary place.",
  ];

  // Return a random mock narrative (for testing)
  const randomIndex = Math.floor(Math.random() * mockNarratives.length);
  return mockNarratives[randomIndex];
}

// =============================================================================
// MomentSense Response Building
// =============================================================================

function buildMomentSense(
  input: SensoryInput,
  momentId: string,
  narrative: string,
  startTime: number
): MomentSense {
  const now = new Date().toISOString();
  const processingTime = Date.now() - startTime;
  const primaryPhoto = input.photos.refs[0];

  const detectedEmotion =
    primaryPhoto?.local_analysis?.basic_emotion || "Transcendence";
  const lightingCondition = primaryPhoto?.local_analysis?.lighting || "bright";
  const energyLevel = primaryPhoto?.local_analysis?.energy_level || "calm";

  // Calculate transcendence score (0-10)
  let transcendenceScore = 5; // baseline
  if (input.audio?.sentiment_score) {
    // Voice sentiment influences transcendence
    transcendenceScore = Math.max(
      1,
      Math.min(10, 5 + input.audio.sentiment_score * 5)
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
    emotion_tags: input.audio?.sentiment_keywords || [detectedEmotion],
    primary_emotion: detectedEmotion,
    emotion_confidence: input.audio?.sentiment_score
      ? Math.abs(input.audio.sentiment_score)
      : 0.6,
    atmosphere: {
      lighting: lightingCondition,
      energy: energyLevel,
      setting: "indoor" as const,
      crowd_feel: input.companions.length > 2 ? "moderate" : "sparse",
    },
    transcendence_score: transcendenceScore,
    transcendence_factors:
      transcendenceFactors.length > 0
        ? transcendenceFactors
        : ["moment_captured"],
    sensory_details: {
      visual: narrative.substring(0, 100), // First 100 chars as visual anchor
      audio: input.audio?.transcript?.substring(0, 100) || null,
      scent: null, // TODO: scent detection in v1.1
      tactile: null, // TODO: tactile inference in v1.1
    },
    excitement: {
      fame_score: null, // TODO: venue fame scoring with Fact Agent
      fame_signals: [],
      unique_claims: [],
      historical_significance: null,
      excitement_hook: null,
    },
    memory_anchors: {
      sensory_anchor: narrative.substring(0, 150),
      emotional_anchor: `Felt: ${input.audio?.sentiment_keywords.join(", ") || detectedEmotion}`,
      unexpected_anchor: null,
      shareable_anchor: narrative.substring(0, 200),
      family_anchor:
        input.companions.length > 0
          ? `With: ${input.companions.map((c) => c.name).join(", ")}`
          : null,
    },
    narratives: {
      short: narrative,
      medium: narrative + "\n\n[Extended narrative available in full view]",
      full: narrative + "\n\n[Full narrative with extended sensory details]",
    },
    companion_experiences: input.companions.map((c) => ({
      name: c.name,
      relationship: c.relationship,
      moment_highlight: `Shared this moment with ${c.name}`,
      engagement_level: "moderate" as const,
      interests_matched: [],
      needs_met: [],
      concerns: [],
    })),
    environment: {
      weather: null, // TODO: Cloud enrichment from Fact Agent in v1.1
      timing: {
        local_time: new Date().toLocaleTimeString(),
        is_golden_hour: lightingCondition === "golden_hour",
      },
    },
    user_reflection: {
      voice_note_transcript: input.audio?.transcript || null,
      sentiment: input.audio?.sentiment_score || null,
      keywords: input.audio?.sentiment_keywords || [],
    },
    processing: {
      local_percentage: 100,
      cloud_calls: [],
      processing_time_ms: processingTime,
      tier: "local_only",
    },
    status: "active",
    created_at: now,
    updated_at: now,
  };
}
