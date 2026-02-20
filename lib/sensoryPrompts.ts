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
Match tone to primary emotion:
- AWE: Reverent, expansive language. Focus on scale, history, significance
- JOY: Bright, energetic. Short sentences. Vivid colors and movement
- PEACE: Gentle, flowing. Longer sentences. Soft sensory details
- EXCITEMENT: Quick pace. Specific moments. Dynamic action
- GRATITUDE: Warm, reflective. Personal connections. Quiet appreciation
- NOSTALGIA: Wistful, comparing then/now. Sensory triggers to memory
- WONDER: Childlike curiosity. Questions. Fresh perspective

Include companion names/relationships naturally:
✓ "Max's hand in mine as we climbed the steps"
✗ "I was with Max and he enjoyed it"

AVOID CLICHÉS - Never use:
"hidden gem", "off the beaten path", "breathtaking", "unforgettable", "bucket list", "once in a lifetime", "picture perfect", "magical", "stunning", "incredible journey"

BE SPECIFIC - Show, don't tell:
✓ "The monk's voice echoed across empty stone"
✗ "The temple was very spiritual and peaceful"

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
    "medium": "2-3 sentences (50-80 words). Structure: HOOK (sensory opener) → MOMENT (what happened) → EMOTION (how it felt). Must work standalone without photo.",
    "full": "150-200 words. Structure: SETTING (where/when/who) → BUILD (the experience unfolding) → PEAK (emotional high point) → REFLECTION (meaning/feeling). Include all companions naturally. Match tone to primary emotion."
  },
  "excitementHook": "One sentence that makes this place feel special (or null if not notable)",
  "memoryAnchors": {
    "sensory": "Specific sensory detail to remember (e.g., 'incense smoke curling through morning light', not 'nice smell')",
    "emotional": "The emotional peak moment (specific, not generic)",
    "unexpected": "Something surprising (or null)",
    "shareable": "Best moment to share with others (or null)",
    "companion": "A companion-specific memory (or null if solo)"
  },
  "companionExperiences": [
    {
      "nickname": "Name from companions list",
      "reaction": "How they experienced this moment (specific, natural)",
      "wouldReturn": true/false/null
    }
  ],
  "inferredSensory": {
    "scent": "Contextually appropriate scent (or null)",
    "tactile": "Contextually appropriate texture/feeling (or null)",
    "sound": "Contextually appropriate sound (or null)"
  }
}

## Narrative Quality Guidelines

MEDIUM NARRATIVE (2-3 sentences, 50-80 words):
✓ GOOD: "Morning light filtered through the temple gates, casting long shadows across ancient stone. We walked slowly, breathing in incense and quiet—three strangers in a place that felt like home. That kind of peace you can't plan for."
✗ BAD: "We visited the beautiful temple. It was amazing and breathtaking. The experience was unforgettable."

Structure: Sensory hook → What happened → How it felt
Must work standalone (reader doesn't see the photo)
Specific details over generic adjectives
Natural voice, not tour guide voice

FULL NARRATIVE (150-200 words):
Must have clear story arc: Setting → Build → Peak → Reflection
Match tone to emotion (awe = reverent, joy = bright, peace = gentle)
Weave companions in naturally (not "Mom enjoyed it, Max enjoyed it")
Include time/place markers ("morning light", "after lunch", "as the sun set")
Specific sensory moments that anchor the memory

AVOID CLICHÉS:
✗ "hidden gem", "off the beaten path", "breathtaking", "unforgettable"
✗ "bucket list", "once in a lifetime", "picture perfect", "magical"
✗ Generic superlatives without specific details
✓ Specific observations that show, not tell

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
 * Generate enhanced fallback narrative when cloud synthesis fails
 * Note: Uses only metadata - transcript text is not available here
 */
export function generateFallbackNarrative(input: SynthesisInput): SynthesisOutput {
  const venueName = input.venue?.name || 'this place';
  const va = input.voiceAnalysis;

  // Infer emotion from voice analysis metadata
  const primaryEmotion = va?.sentimentScore !== null && va?.sentimentScore !== undefined
    ? (va.sentimentScore > 0.5 ? 'joy' : va.sentimentScore < -0.3 ? 'reflection' : 'peace')
    : (va?.detectedTone || 'wonder');

  // Build emotion-aware context
  const lighting = input.photoAnalysis.lighting;
  const timeOfDay = input.context.isGoldenHour ? 'golden hour' : extractTimeOfDay(input.context.localTime);
  const venueCategory = input.venue?.category || 'place';
  const crowdLevel = input.photoAnalysis.crowdLevel;

  // Emotion-specific secondary emotions
  const secondaryEmotions = getSecondaryEmotions(primaryEmotion, input);

  // Build companion references
  const companions = input.companions;
  const companionNames = companions.map(c => c.nickname || c.relationship);

  // Generate emotion-appropriate narratives
  const narratives = buildEmotionNarratives(
    primaryEmotion,
    venueName,
    venueCategory,
    companionNames,
    lighting,
    timeOfDay,
    crowdLevel,
    input.weather,
    input.venue,
    va
  );

  // Generate sensory anchors based on venue category
  const sensoryAnchor = buildSensoryAnchor(venueCategory, lighting, input.venue);
  const emotionalAnchor = buildEmotionalAnchor(primaryEmotion, companionNames.length > 0);

  return {
    primaryEmotion,
    secondaryEmotions,
    emotionConfidence: 0.6,
    narratives,
    excitementHook: input.venue?.uniqueClaims[0] || null,
    memoryAnchors: {
      sensory: sensoryAnchor,
      emotional: emotionalAnchor,
      unexpected: null,
      shareable: null,
      companion: companions.length > 0
        ? `${companionNames[0]}'s ${primaryEmotion === 'joy' ? 'delight' : primaryEmotion === 'awe' ? 'wonder' : 'experience'}`
        : null,
    },
    companionExperiences: companions.map(c => ({
      nickname: c.nickname || c.relationship,
      reaction: getCompanionReaction(primaryEmotion, c.age_group),
      wouldReturn: null,
    })),
    inferredSensory: {
      scent: null,
      tactile: null,
      sound: null,
    },
  };
}

// =============================================================================
// FALLBACK NARRATIVE HELPERS
// =============================================================================

function extractTimeOfDay(localTime: string): string {
  try {
    const date = new Date(localTime);
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  } catch {
    return 'day';
  }
}

function getSecondaryEmotions(primaryEmotion: string, input: SynthesisInput): string[] {
  const emotionMap: Record<string, string[]> = {
    joy: ['excitement', 'gratitude'],
    awe: ['wonder', 'peace'],
    peace: ['contentment', 'gratitude'],
    excitement: ['joy', 'wonder'],
    gratitude: ['peace', 'contentment'],
    nostalgia: ['peace', 'wonder'],
    wonder: ['awe', 'curiosity'],
    reflection: ['peace', 'nostalgia'],
  };
  return emotionMap[primaryEmotion] || ['peace', 'contentment'];
}

function buildEmotionNarratives(
  emotion: string,
  venueName: string,
  venueCategory: string,
  companionNames: string[],
  lighting: string | null,
  timeOfDay: string,
  crowdLevel: string | null,
  weather: SynthesisInput['weather'],
  venue: SynthesisInput['venue'],
  voiceAnalysis: SynthesisInput['voiceAnalysis']
): { short: string; medium: string; full: string } {
  const companionPhrase = companionNames.length > 0
    ? companionNames.length === 1
      ? ` with ${companionNames[0]}`
      : ` with ${companionNames.slice(0, -1).join(', ')} and ${companionNames[companionNames.length - 1]}`
    : '';

  const weatherContext = weather
    ? weather.condition.toLowerCase().includes('sun') || weather.condition.toLowerCase().includes('clear')
      ? 'clear skies'
      : weather.condition.toLowerCase()
    : '';

  const lightingContext = lighting === 'golden_hour'
    ? 'golden light'
    : lighting === 'night'
    ? 'evening glow'
    : lighting;

  const crowdContext = crowdLevel === 'empty' || crowdLevel === 'sparse'
    ? 'quiet and unhurried'
    : crowdLevel === 'packed' || crowdLevel === 'busy'
    ? 'bustling with energy'
    : '';

  // Emotion-specific openers and closers
  const openers: Record<string, string> = {
    awe: `${timeOfDay === 'morning' ? 'Morning' : timeOfDay === 'evening' ? 'Evening' : timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} at ${venueName}`,
    joy: `${weatherContext ? weatherContext + ' at' : 'At'} ${venueName}`,
    peace: `${crowdContext ? 'A ' + crowdContext.split(' ')[0] + ' moment' : timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} at ${venueName}`,
    excitement: `${venueName}${companionPhrase}`,
    gratitude: `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} light at ${venueName}`,
    nostalgia: `Returning to ${venueName}`,
    wonder: `Discovering ${venueName}`,
    reflection: `An afternoon at ${venueName}`,
  };

  const short = openers[emotion] || `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} at ${venueName}`;

  // Medium narrative (50-80 words, 2-3 sentences)
  let medium = short + companionPhrase + '. ';

  if (emotion === 'awe') {
    const histContext = venue?.historicalSignificance || (venueCategory === 'landmark' ? 'The weight of history' : 'The weight of this place');
    medium += `${histContext}. `;
    medium += voiceAnalysis?.theme === 'fulfillment' ? 'A dream realized.' : 'Moments like these remind you what matters.';
  } else if (emotion === 'joy') {
    const lightAndContext = lightingContext ? lightingContext.charAt(0).toUpperCase() + lightingContext.slice(1) + ' and' : 'Everything';
    medium += `${lightAndContext} ${crowdContext || 'alive with possibility'}. `;

    if (companionNames.length > 0) {
      const companionEmotion = companionNames[0].toLowerCase().includes('child') || companionNames[0].toLowerCase() === 'max' ? 'wonder' : 'smile';
      medium += `${companionNames[0]}'s ${companionEmotion} said it all.`;
    } else {
      medium += 'Pure, simple joy.';
    }
  } else if (emotion === 'peace') {
    const crowdOrStill = crowdContext ? crowdContext.charAt(0).toUpperCase() + crowdContext.slice(1) : 'Stillness';
    medium += `${crowdOrStill}. `;
    const companionGratitude = companionNames.length > 0 ? ", and you're grateful for who you're with" : '';
    medium += `The kind of ${timeOfDay} where time slows down${companionGratitude}.`;
  } else {
    medium += `${lightingContext || weatherContext || 'The atmosphere'}. `;
    const themeOrMemory = voiceAnalysis?.theme ? `A sense of ${voiceAnalysis.theme}.` : 'A moment worth remembering.';
    medium += themeOrMemory;
  }

  // Full narrative (150-200 words)
  let full = `${short}${companionPhrase}. `;

  // Setting
  const settingWeather = weatherContext ? weatherContext.charAt(0).toUpperCase() + weatherContext.slice(1) + ', ' : '';
  const settingLight = lightingContext ? 'casting ' + lightingContext : '';
  full += `${settingWeather}${timeOfDay} ${settingLight}. `;

  const venueDesc = venue?.description || (venueCategory === 'landmark' ? 'A place steeped in history' : venueCategory === 'nature' ? 'Nature in its quiet power' : 'A place that draws you in');
  full += `${venueDesc}. `;

  // Build
  const buildCrowd = crowdContext ? crowdContext.charAt(0).toUpperCase() + crowdContext.slice(1) + ', ' : '';
  const buildAction = venueCategory === 'landmark' ? 'walked through' : venueCategory === 'dining' ? 'settled in' : 'explored';
  const buildPace = crowdLevel === 'busy' || crowdLevel === 'packed' ? 'among the crowds' : 'at our own pace';
  full += `${buildCrowd}we ${buildAction} ${buildPace}. `;

  // Peak
  if (companionNames.length > 0) {
    const companionAction = emotion === 'awe' ? 'stood silent, taking it in' : emotion === 'joy' ? "couldn't stop smiling" : emotion === 'peace' ? 'seemed completely at ease' : 'was fully present';
    full += `${companionNames[0]} ${companionAction}. `;
  }

  const placeContext = venueCategory === 'landmark' ? 'places like this' : 'moments like these';
  const peakDetail = venue?.historicalSignificance || venue?.uniqueClaims[0] || `There's something about ${placeContext}`;
  full += `${peakDetail}. `;

  // Reflection
  const reflectionText = voiceAnalysis?.theme === 'fulfillment' ? 'Everything we hoped for' :
    voiceAnalysis?.theme === 'discovery' ? 'Discovery in every corner' :
    voiceAnalysis?.theme === 'connection' ? 'Connection deeper than words' :
    `The kind of ${emotion} that stays with you`;
  full += `${reflectionText}. `;

  const closing = companionNames.length > 0 ?
    (companionNames.length === 1 ? 'Grateful we experienced this together.' : 'Grateful we shared this.') :
    'A memory to carry forward.';
  full += closing;

  return {
    short: short.slice(0, 100),
    medium: medium.slice(0, 150),
    full: full.slice(0, 300),
  };
}

function buildSensoryAnchor(venueCategory: string, lighting: string | null, venue: SynthesisInput['venue']): string {
  const categoryAnchors: Record<string, string> = {
    landmark: lighting === 'golden_hour' ? 'Golden light on ancient stone' : lighting === 'night' ? 'Evening glow illuminating history' : 'The weight of centuries in the air',
    dining: 'Aromas and quiet conversation',
    nature: lighting === 'golden_hour' ? 'Sunlight through leaves' : 'Earth and open sky',
    shopping: 'Color and movement everywhere',
  };

  return venue?.category ? (categoryAnchors[venue.category] || 'The light and atmosphere') : 'The moment itself';
}

function buildEmotionalAnchor(emotion: string, hasCompanions: boolean): string {
  const anchors: Record<string, { solo: string; group: string }> = {
    awe: { solo: 'Standing in wonder', group: 'Sharing this sense of awe' },
    joy: { solo: 'Pure delight', group: 'Laughter and lightness together' },
    peace: { solo: 'Finding stillness', group: 'Quiet togetherness' },
    excitement: { solo: 'Energy and discovery', group: 'Shared excitement' },
    gratitude: { solo: 'Deep appreciation', group: 'Grateful for this time together' },
    nostalgia: { solo: 'Memories surfacing', group: 'Remembering together' },
    wonder: { solo: 'Eyes wide open', group: 'Discovering together' },
    reflection: { solo: 'Quiet reflection', group: 'Reflecting together' },
  };

  const anchor = anchors[emotion] || { solo: 'The feeling itself', group: 'Being here together' };
  return hasCompanions ? anchor.group : anchor.solo;
}

function getCompanionReaction(emotion: string, ageGroup?: string): string {
  const isChild = ageGroup === 'child';

  const reactions: Record<string, { adult: string; child: string }> = {
    awe: { adult: 'Moved by the magnitude of this place', child: 'Wide-eyed wonder at everything' },
    joy: { adult: 'Radiant and fully present', child: 'Pure delight and energy' },
    peace: { adult: 'Visibly at ease and content', child: 'Calm and curious' },
    excitement: { adult: 'Energized and engaged', child: 'Bouncing with excitement' },
    gratitude: { adult: 'Deeply appreciative', child: 'Happy to be here' },
    nostalgia: { adult: 'Reflective and warm', child: 'Curious about the history' },
    wonder: { adult: 'Curious and engaged', child: 'Asking questions about everything' },
    reflection: { adult: 'Thoughtful and present', child: 'Taking it all in' },
  };

  const reaction = reactions[emotion] || { adult: 'Engaged and present', child: 'Curious and interested' };
  return isChild ? reaction.child : reaction.adult;
}
