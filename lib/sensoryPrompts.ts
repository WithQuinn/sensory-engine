// =============================================================================
// SENSORY AGENT PROMPTS
// Claude Text synthesis prompts for Sensory Agent
// PRIVACY: Claude receives ONLY extracted metadata — NEVER photos, audio, or transcript
// User's verbatim words stay on-device; only sentiment/keywords/tone are transmitted
// =============================================================================

import type { LocalAnalysisResult, CloudEnrichment, VenueCategory } from './sensoryValidation';
import { SynthesisOutputSchema } from './sensoryValidation';

// =============================================================================
// PROMPT TYPES
// =============================================================================

export interface SynthesisInput {
  // From local analysis
  photoAnalysis: {
    scene: string | null;
    lighting: string | null;
    indoorOutdoor: 'indoor' | 'outdoor' | 'mixed' | null;
    faceCount: number;
    crowdLevel: string | null;
    energyLevel: string | null;
    emotions: string[];
  };

  // From audio (metadata only - transcript stays on-device)
  voiceAnalysis: {
    sentimentScore: number | null;      // -1 to 1
    detectedTone: string | null;        // "awe", "excitement", "calm", etc.
    keywords: string[];                  // extracted topics, NOT verbatim words
    theme: string | null;                // "fulfillment", "discovery", "nostalgia"
    durationSeconds: number | null;
  } | null;

  // From venue enrichment
  venue: {
    name: string;
    category: VenueCategory;
    description: string | null;
    foundedYear: number | null;
    historicalSignificance: string | null;
    uniqueClaims: string[];
    fameScore: number | null;
  } | null;

  // From weather
  weather: {
    condition: string;
    temperatureC: number;
    comfortScore: number;
  } | null;

  // Companions
  companions: Array<{
    relationship: string;
    nickname: string | null;
    age_group?: string;
  }>;

  // Context
  context: {
    localTime: string;
    isGoldenHour: boolean;
    isWeekend: boolean;
    durationMinutes: number | null;
    tripIntent?: string;
  };
}

export interface SynthesisOutput {
  primaryEmotion: string;
  secondaryEmotions: string[];
  emotionConfidence: number;
  narratives: {
    short: string;   // 15-25 words
    medium: string;  // 50-80 words
    full: string;    // 150-200 words
  };
  excitementHook: string | null;
  memoryAnchors: {
    sensory: string;
    emotional: string;
    unexpected: string | null;
    shareable: string | null;
    companion: string | null;
  };
  companionExperiences: Array<{
    nickname: string;
    reaction: string;
    wouldReturn: boolean | null;
  }>;
  // Inferred sensory details (contextually appropriate, not from photos)
  inferredSensory: {
    scent: string | null;
    tactile: string | null;
    sound: string | null;
  };
}

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

export const SENSORY_SYSTEM_PROMPT = `You are Quinn's Sensory Agent, a memory synthesis specialist. Your job is to transform travel moment metadata into rich, emotionally resonant narratives.

CRITICAL PRIVACY CONTEXT:
- You receive ONLY extracted metadata — never raw photos, audio, or transcript text
- Photo metadata: scene type, lighting, face count, crowd level, energy
- Voice metadata: sentiment score, detected tone, keywords, theme
- You NEVER see the user's actual words — only the emotional signal they convey
- All your inferences must be based on metadata + venue context

YOUR GOAL:
Create narratives that feel like reading a beloved journal entry years later—capturing not just what happened, but how it felt.

INFERENCE GUIDELINES:
You may infer sensory details that are contextually appropriate:
- Temple + incense_detected → "incense smoke curling through morning light" ✓
- Beach + calm_energy → "sound of waves on warm sand" ✓
- Restaurant + dining_category → "clinking of chopsticks" ✓
- High sentiment + "dream" keyword → sense of fulfillment ✓

You may NOT invent specific details not supported by metadata:
- "The red torii gate" (unless color is in metadata) ✗
- "Her blue dress" (unless clothing is in metadata) ✗
- "The sunset painted the sky orange" (unless golden_hour in metadata) ✗
- Direct quotes of what the user said (you don't have their words) ✗

NARRATIVE VOICE:
- Use the detected tone (awe, excitement, calm, etc.) as the baseline
- Match their energy: excited → vivid descriptions, calm → peaceful prose
- Include companion names/relationships naturally
- Avoid travel clichés ("hidden gem", "breathtaking", "off the beaten path")
- Be specific, not generic

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON matching the specified schema
- No markdown code blocks or explanatory text
- All string fields must be properly escaped`;

// =============================================================================
// SYNTHESIS PROMPT BUILDER
// =============================================================================

/**
 * Build the synthesis prompt from local analysis and cloud enrichment
 */
export function buildSynthesisPrompt(input: SynthesisInput): string {
  const sections: string[] = [];

  // Photo analysis section
  sections.push(`## Photo Analysis (metadata only)
- Scene: ${input.photoAnalysis.scene || 'not detected'}
- Lighting: ${input.photoAnalysis.lighting || 'not detected'}
- Setting: ${input.photoAnalysis.indoorOutdoor || 'unknown'}
- Faces detected: ${input.photoAnalysis.faceCount}
- Crowd level: ${input.photoAnalysis.crowdLevel || 'not detected'}
- Energy: ${input.photoAnalysis.energyLevel || 'not detected'}
- Basic emotions: ${input.photoAnalysis.emotions.length > 0 ? input.photoAnalysis.emotions.join(', ') : 'none detected'}`);

  // Voice analysis section (metadata only - transcript stays on-device)
  if (input.voiceAnalysis) {
    const va = input.voiceAnalysis;
    const sentimentLabel = va.sentimentScore !== null
      ? (va.sentimentScore > 0.5 ? '(highly positive)' : va.sentimentScore > 0 ? '(positive)' : va.sentimentScore < -0.3 ? '(negative)' : '(neutral)')
      : '';
    sections.push(`## Voice Analysis (metadata only — transcript not transmitted)
Sentiment: ${va.sentimentScore !== null ? va.sentimentScore.toFixed(2) : 'not analyzed'} ${sentimentLabel}
Tone: ${va.detectedTone || 'not detected'}
Keywords: ${va.keywords.length > 0 ? va.keywords.join(', ') : 'none extracted'}
Theme: ${va.theme || 'not detected'}
Duration: ${va.durationSeconds ? `${va.durationSeconds}s` : 'unknown'}`);
  } else {
    sections.push(`## Voice Analysis
No voice note provided.`);
  }

  // Venue section
  if (input.venue) {
    const venueLines = [
      `## Venue Context`,
      `Name: ${input.venue.name}`,
      `Category: ${input.venue.category}`,
    ];
    if (input.venue.description) venueLines.push(`Description: ${input.venue.description}`);
    if (input.venue.foundedYear) venueLines.push(`Founded: ${input.venue.foundedYear}`);
    if (input.venue.historicalSignificance) venueLines.push(`Significance: ${input.venue.historicalSignificance}`);
    if (input.venue.uniqueClaims.length > 0) venueLines.push(`Notable facts: ${input.venue.uniqueClaims.join('; ')}`);
    if (input.venue.fameScore !== null) venueLines.push(`Fame score: ${input.venue.fameScore.toFixed(2)}`);
    sections.push(venueLines.join('\n'));
  } else {
    sections.push(`## Venue Context
No venue information available.`);
  }

  // Weather section
  if (input.weather) {
    sections.push(`## Weather
Condition: ${input.weather.condition}
Temperature: ${input.weather.temperatureC}°C
Outdoor comfort: ${(input.weather.comfortScore * 100).toFixed(0)}%`);
  }

  // Companions section
  if (input.companions.length > 0) {
    const companionList = input.companions.map(c => {
      const name = c.nickname || c.relationship;
      const age = c.age_group ? ` (${c.age_group})` : '';
      return `- ${name}${age}`;
    }).join('\n');
    sections.push(`## Companions
${companionList}`);
  }

  // Context section
  sections.push(`## Context
Local time: ${input.context.localTime}
Golden hour: ${input.context.isGoldenHour ? 'yes' : 'no'}
Weekend: ${input.context.isWeekend ? 'yes' : 'no'}
${input.context.durationMinutes ? `Duration: ${input.context.durationMinutes} minutes` : ''}
${input.context.tripIntent ? `Trip intent: ${input.context.tripIntent}` : ''}`);

  // Output requirements
  sections.push(`## Required Output

Generate a JSON object with this structure:

{
  "primaryEmotion": "string (e.g., awe, joy, peace, excitement, nostalgia, wonder)",
  "secondaryEmotions": ["array", "of", "2-3", "emotions"],
  "emotionConfidence": 0.0-1.0,
  "narratives": {
    "short": "15-25 word poetic summary",
    "medium": "50-80 word narrative with key moments",
    "full": "150-200 word complete story with all companions"
  },
  "excitementHook": "One sentence that makes this place feel special (or null if not notable)",
  "memoryAnchors": {
    "sensory": "Specific sensory detail to remember",
    "emotional": "The emotional peak moment",
    "unexpected": "Something surprising (or null)",
    "shareable": "Best moment to share with others (or null)",
    "companion": "A companion-specific memory (or null if solo)"
  },
  "companionExperiences": [
    {
      "nickname": "Name from companions list",
      "reaction": "How they experienced this moment",
      "wouldReturn": true/false/null
    }
  ],
  "inferredSensory": {
    "scent": "Contextually appropriate scent (or null)",
    "tactile": "Contextually appropriate texture/feeling (or null)",
    "sound": "Contextually appropriate sound (or null)"
  }
}

Return ONLY the JSON object, no other text.`);

  return sections.join('\n\n');
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Infer emotional theme from extracted keywords
 * This provides semantic context without transmitting user's actual words
 */
function inferThemeFromKeywords(keywords: string[]): string | null {
  const keywordSet = new Set(keywords.map(k => k.toLowerCase()));

  // Theme mappings based on common travel sentiment patterns
  if (keywordSet.has('dream') || keywordSet.has('dreamed') || keywordSet.has('always')) {
    return 'fulfillment';
  }
  if (keywordSet.has('first') || keywordSet.has('never') || keywordSet.has('new')) {
    return 'discovery';
  }
  if (keywordSet.has('remember') || keywordSet.has('childhood') || keywordSet.has('back')) {
    return 'nostalgia';
  }
  if (keywordSet.has('peace') || keywordSet.has('calm') || keywordSet.has('quiet')) {
    return 'tranquility';
  }
  if (keywordSet.has('amazing') || keywordSet.has('incredible') || keywordSet.has('wow')) {
    return 'wonder';
  }
  if (keywordSet.has('together') || keywordSet.has('family') || keywordSet.has('friends')) {
    return 'connection';
  }

  return null;
}

// =============================================================================
// LOCAL ANALYSIS TO SYNTHESIS INPUT CONVERTER
// =============================================================================

/**
 * Convert LocalAnalysisResult + CloudEnrichment to SynthesisInput
 */
export function buildSynthesisInputFromAnalysis(
  localAnalysis: LocalAnalysisResult,
  cloudEnrichment: CloudEnrichment,
  companions: SynthesisInput['companions'],
  tripIntent?: string
): SynthesisInput {
  return {
    photoAnalysis: {
      scene: localAnalysis.photo_analysis.dominant_scene,
      lighting: localAnalysis.photo_analysis.dominant_lighting,
      indoorOutdoor: localAnalysis.photo_analysis.indoor_outdoor,
      faceCount: localAnalysis.photo_analysis.total_faces,
      crowdLevel: localAnalysis.photo_analysis.crowd_level,
      energyLevel: localAnalysis.photo_analysis.energy_level,
      emotions: localAnalysis.photo_analysis.basic_emotions,
    },
    // Voice analysis metadata only - transcript stays on-device
    voiceAnalysis: localAnalysis.audio_analysis ? {
      sentimentScore: localAnalysis.audio_analysis.sentiment_score,
      detectedTone: localAnalysis.audio_analysis.detected_tone,
      keywords: localAnalysis.audio_analysis.keywords,
      theme: inferThemeFromKeywords(localAnalysis.audio_analysis.keywords),
      durationSeconds: null, // Would come from audio metadata
    } : null,
    venue: cloudEnrichment.venue ? {
      name: cloudEnrichment.venue.verified_name,
      category: cloudEnrichment.venue.category,
      description: cloudEnrichment.venue.description,
      foundedYear: cloudEnrichment.venue.founded_year,
      historicalSignificance: cloudEnrichment.venue.historical_significance,
      uniqueClaims: cloudEnrichment.venue.unique_claims,
      fameScore: cloudEnrichment.venue.fame_score,
    } : null,
    weather: cloudEnrichment.weather ? {
      condition: cloudEnrichment.weather.condition,
      temperatureC: cloudEnrichment.weather.temperature_c,
      comfortScore: cloudEnrichment.weather.outdoor_comfort_score,
    } : null,
    companions,
    context: {
      localTime: cloudEnrichment.timing?.local_time || new Date().toISOString(),
      isGoldenHour: cloudEnrichment.timing?.is_golden_hour || false,
      isWeekend: cloudEnrichment.timing?.is_weekend || false,
      durationMinutes: null, // Would come from dwell detection
      tripIntent,
    },
  };
}

// =============================================================================
// RESPONSE PARSING
// =============================================================================

/**
 * Parse Claude's synthesis response into structured output
 * Validates response against SynthesisOutputSchema
 */
export function parseSynthesisResponse(response: string): SynthesisOutput | null {
  try {
    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonStr);

    // Validate against schema
    const validated = SynthesisOutputSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('Synthesis response validation failed:', validated.error.errors);
      return null;
    }

    return validated.data;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Failed to parse synthesis response:', errorMsg);
    return null;
  }
}

// =============================================================================
// FALLBACK NARRATIVES (when Claude fails)
// =============================================================================

/**
 * Generate a basic fallback narrative when cloud synthesis fails
 * Note: Uses only metadata - transcript text is not available here
 */
export function generateFallbackNarrative(input: SynthesisInput): SynthesisOutput {
  const venueName = input.venue?.name || 'this place';
  const va = input.voiceAnalysis;

  // Infer emotion from voice analysis metadata
  const emotion = va?.sentimentScore !== null && va?.sentimentScore !== undefined
    ? (va.sentimentScore > 0.5 ? 'joy' : va.sentimentScore < -0.3 ? 'reflection' : 'peace')
    : (va?.detectedTone || 'wonder');

  const companionText = input.companions.length > 0
    ? ` with ${input.companions.map(c => c.nickname || c.relationship).join(' and ')}`
    : '';

  const weatherText = input.weather
    ? ` ${input.weather.condition.toLowerCase()} day`
    : '';

  const themeText = va?.theme ? ` A sense of ${va.theme}.` : '';
  const shortNarrative = `A${weatherText} at ${venueName}${companionText}.`;

  return {
    primaryEmotion: emotion,
    secondaryEmotions: ['peace'],
    emotionConfidence: 0.5,
    narratives: {
      short: shortNarrative.slice(0, 100),
      medium: `We visited ${venueName}${companionText}.${themeText} A moment worth remembering.`,
      full: `We visited ${venueName}${companionText}.${themeText} ${input.venue?.historicalSignificance || ''} A moment worth remembering.`.trim(),
    },
    excitementHook: input.venue?.uniqueClaims[0] || null,
    memoryAnchors: {
      sensory: input.photoAnalysis.lighting || 'The light',
      emotional: 'Being here together',
      unexpected: null,
      shareable: null,
      companion: input.companions.length > 0
        ? `${input.companions[0].nickname || input.companions[0].relationship}'s experience`
        : null,
    },
    companionExperiences: input.companions.map(c => ({
      nickname: c.nickname || c.relationship,
      reaction: 'Enjoyed the visit',
      wouldReturn: null,
    })),
    inferredSensory: {
      scent: null,
      tactile: null,
      sound: null,
    },
  };
}
