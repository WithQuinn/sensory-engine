// =============================================================================
// EXCITEMENT ENGINE
// Fame detection and excitement scoring for Sensory Agent
// Generates "excitement hooks" that make moments feel special
// =============================================================================

import { TRANSCENDENCE_WEIGHTS, type TranscendenceFactors } from './sensoryValidation';
import type { VenueEnrichment } from './sensoryData';

// =============================================================================
// TYPES
// =============================================================================

export interface ExcitementResult {
  fameScore: number;
  excitementHook: string | null;
  uniqueFacts: string[];
  historicalContext: string | null;
  recommendedNarrativeAngle: string | null;
}

export interface TranscendenceResult {
  score: number;
  factors: TranscendenceFactors;
  isHighlight: boolean; // score >= 0.7
  dominantFactor: keyof TranscendenceFactors;
  explanation: string[]; // Top 3 contributing factors in human-readable form
}

// =============================================================================
// EXCITEMENT HOOK GENERATION
// =============================================================================

/**
 * Generate an excitement hook for a venue
 */
export function generateExcitementHook(venue: VenueEnrichment | null): string | null {
  if (!venue) return null;

  // High fame score venues get priority
  if (venue.fame_score && venue.fame_score >= 0.8) {
    // Use the first unique claim if available
    if (venue.unique_claims.length > 0) {
      return venue.unique_claims[0];
    }
  }

  // Historical venues
  if (venue.founded_year) {
    const yearsOld = new Date().getFullYear() - venue.founded_year;
    if (yearsOld > 100) {
      return `${yearsOld} years of history await you here`;
    }
  }

  // Use historical significance if available
  if (venue.historical_significance) {
    // Extract key phrase (first sentence, trimmed)
    const firstSentence = venue.historical_significance.split('.')[0];
    if (firstSentence.length < 100) {
      return firstSentence;
    }
  }

  // Use description as fallback
  if (venue.description) {
    return venue.description;
  }

  return null;
}

/**
 * Extract unique facts that can enhance narratives
 */
export function extractUniqueFacts(venue: VenueEnrichment | null): string[] {
  if (!venue) return [];

  const facts: string[] = [];

  // Add unique claims
  facts.push(...venue.unique_claims);

  // Add historical context
  if (venue.founded_year) {
    const yearsOld = new Date().getFullYear() - venue.founded_year;
    if (yearsOld > 50) {
      facts.push(`Established in ${venue.founded_year} (${yearsOld} years ago)`);
    }
  }

  // Add category-specific facts
  if (venue.category === 'landmark' && venue.fame_score && venue.fame_score > 0.7) {
    facts.push('Widely recognized cultural landmark');
  }

  return facts.slice(0, 5); // Limit to 5 facts
}

/**
 * Suggest a narrative angle based on venue characteristics
 */
export function suggestNarrativeAngle(venue: VenueEnrichment | null): string | null {
  if (!venue) return null;

  // High fame: emphasize the significance
  if (venue.fame_score && venue.fame_score >= 0.8) {
    return 'significance'; // Focus on why this place matters
  }

  // Historical: emphasize the journey through time
  if (venue.founded_year && venue.founded_year < 1900) {
    return 'historical'; // Focus on connection to the past
  }

  // Nature venues: emphasize the sensory experience
  if (venue.category === 'nature') {
    return 'sensory'; // Focus on sights, sounds, feelings
  }

  // Dining: emphasize the taste and atmosphere
  if (venue.category === 'dining') {
    return 'culinary'; // Focus on flavors and company
  }

  return 'experiential'; // Default: focus on the moment itself
}

// =============================================================================
// TRANSCENDENCE SCORING
// =============================================================================

/**
 * Calculate transcendence score from individual factors
 * Uses weights defined in sensoryValidation.ts
 */
export function calculateTranscendenceScore(factors: TranscendenceFactors): TranscendenceResult {
  // Calculate weighted sum
  const score =
    factors.emotion_intensity * TRANSCENDENCE_WEIGHTS.emotion_intensity +
    factors.atmosphere_quality * TRANSCENDENCE_WEIGHTS.atmosphere_quality +
    factors.novelty_factor * TRANSCENDENCE_WEIGHTS.novelty_factor +
    factors.fame_score * TRANSCENDENCE_WEIGHTS.fame_score +
    factors.weather_match * TRANSCENDENCE_WEIGHTS.weather_match +
    factors.companion_engagement * TRANSCENDENCE_WEIGHTS.companion_engagement +
    factors.intent_match * TRANSCENDENCE_WEIGHTS.intent_match +
    factors.surprise_factor * TRANSCENDENCE_WEIGHTS.surprise_factor;

  // Round to 2 decimal places
  const roundedScore = Math.round(score * 100) / 100;

  // Find dominant factor and build explanation
  const weightedFactors = Object.entries(factors).map(([key, value]) => ({
    key: key as keyof TranscendenceFactors,
    value,
    weighted: value * TRANSCENDENCE_WEIGHTS[key as keyof typeof TRANSCENDENCE_WEIGHTS],
  }));
  weightedFactors.sort((a, b) => b.weighted - a.weighted);
  const dominantFactor = weightedFactors[0].key;

  // Generate human-readable explanation of top 3 factors
  const explanation = weightedFactors.slice(0, 3).map((f) => {
    const percentage = Math.round(f.value * 100);
    const label = formatFactorLabel(f.key);
    return `${label} (${percentage}%)`;
  });

  return {
    score: roundedScore,
    factors,
    isHighlight: roundedScore >= 0.7,
    dominantFactor,
    explanation,
  };
}

/**
 * Format factor key into human-readable label
 */
function formatFactorLabel(key: keyof TranscendenceFactors): string {
  const labels: Record<keyof TranscendenceFactors, string> = {
    emotion_intensity: 'Strong emotion',
    atmosphere_quality: 'Great atmosphere',
    novelty_factor: 'First-time discovery',
    fame_score: 'Iconic location',
    weather_match: 'Perfect weather',
    companion_engagement: 'Meaningful connection',
    intent_match: 'Met expectations',
    surprise_factor: 'Unexpected moment',
  };
  return labels[key];
}

/**
 * Build transcendence factors from available data
 */
export function buildTranscendenceFactors(params: {
  sentimentScore: number | null;       // -1 to 1
  atmosphereQuality: number | null;    // 0 to 1 (from photo analysis)
  isFirstVisit: boolean;
  fameScore: number | null;            // 0 to 1
  weatherComfort: number | null;       // 0 to 1
  companionCount: number;
  intentMatch: number | null;          // 0 to 1 (how well it matched trip goals)
  hadUnexpectedMoment: boolean;
}): TranscendenceFactors {
  const {
    sentimentScore,
    atmosphereQuality,
    isFirstVisit,
    fameScore,
    weatherComfort,
    companionCount,
    intentMatch,
    hadUnexpectedMoment,
  } = params;

  // Emotion intensity: derived from sentiment
  // Use absolute value - deep emotions are transcendent regardless of valence
  // Grief, awe, fear overcome are as meaningful as joy
  const emotionIntensity = sentimentScore !== null
    ? Math.abs(sentimentScore)
    : 0.5;

  // Atmosphere quality: direct from photo analysis
  const atmosphere = atmosphereQuality ?? 0.5;

  // Novelty: first visits score higher, but not overwhelming
  // Tuned from 0.85/0.40 (2.1x) to 0.75/0.45 (1.67x)
  const novelty = isFirstVisit ? 0.75 : 0.45;

  // Fame: direct from venue enrichment
  const fame = fameScore ?? 0.3;

  // Weather: direct from comfort score
  const weather = weatherComfort ?? 0.5;

  // Companion engagement: context-aware scoring
  // Solo can be profound (solitude, self-discovery): 0.6
  // Couple/intimate (1-2): 0.8-0.9 (deep connection)
  // Small group (3-4): 0.7 (shared experience)
  // Large group (5+): 0.6 (diffused attention)
  const companionEngagement =
    companionCount === 0 ? 0.6  // Solo: meaningful solitude
    : companionCount === 1 ? 0.9  // Couple: intimate connection
    : companionCount === 2 ? 0.8  // Trio: close bonds
    : companionCount <= 4 ? 0.7   // Small group: shared experience
    : 0.6;                         // Large group: diffused but still meaningful

  // Intent match: how well the experience matched goals
  const intent = intentMatch ?? 0.5;

  // Surprise: unexpected moments add to the experience
  const surprise = hadUnexpectedMoment ? 0.8 : 0.2;

  return {
    emotion_intensity: Math.round(emotionIntensity * 100) / 100,
    atmosphere_quality: Math.round(atmosphere * 100) / 100,
    novelty_factor: Math.round(novelty * 100) / 100,
    fame_score: Math.round(fame * 100) / 100,
    weather_match: Math.round(weather * 100) / 100,
    companion_engagement: Math.round(companionEngagement * 100) / 100,
    intent_match: Math.round(intent * 100) / 100,
    surprise_factor: Math.round(surprise * 100) / 100,
  };
}

// =============================================================================
// FULL EXCITEMENT ANALYSIS
// =============================================================================

/**
 * Run full excitement analysis on a venue
 */
export function analyzeExcitement(venue: VenueEnrichment | null): ExcitementResult {
  const fameScore = venue?.fame_score ?? 0;
  const excitementHook = generateExcitementHook(venue);
  const uniqueFacts = extractUniqueFacts(venue);
  const historicalContext = venue?.historical_significance ?? null;
  const recommendedNarrativeAngle = suggestNarrativeAngle(venue);

  return {
    fameScore,
    excitementHook,
    uniqueFacts,
    historicalContext,
    recommendedNarrativeAngle,
  };
}

// =============================================================================
// MOCK DATA FOR TESTING
// =============================================================================

/**
 * Generate mock transcendence result for testing
 */
export function getMockTranscendenceResult(scenario: 'highlight' | 'moderate' | 'low' = 'highlight'): TranscendenceResult {
  const scenarios: Record<string, TranscendenceResult> = {
    highlight: {
      score: 0.87,
      factors: {
        emotion_intensity: 0.89,
        atmosphere_quality: 0.90,
        novelty_factor: 0.85,
        fame_score: 0.95,
        weather_match: 0.92,
        companion_engagement: 0.80,
        intent_match: 0.90,
        surprise_factor: 0.70,
      },
      isHighlight: true,
      dominantFactor: 'fame_score',
      explanation: ['Iconic location (95%)', 'Perfect weather (92%)', 'Great atmosphere (90%)'],
    },
    moderate: {
      score: 0.55,
      factors: {
        emotion_intensity: 0.60,
        atmosphere_quality: 0.55,
        novelty_factor: 0.40,
        fame_score: 0.50,
        weather_match: 0.70,
        companion_engagement: 0.60,
        intent_match: 0.55,
        surprise_factor: 0.30,
      },
      isHighlight: false,
      dominantFactor: 'weather_match',
      explanation: ['Perfect weather (70%)', 'Meaningful connection (60%)', 'Strong emotion (60%)'],
    },
    low: {
      score: 0.35,
      factors: {
        emotion_intensity: 0.30,
        atmosphere_quality: 0.40,
        novelty_factor: 0.20,
        fame_score: 0.30,
        weather_match: 0.50,
        companion_engagement: 0.40,
        intent_match: 0.35,
        surprise_factor: 0.10,
      },
      isHighlight: false,
      dominantFactor: 'weather_match',
      explanation: ['Perfect weather (50%)', 'Great atmosphere (40%)', 'Meaningful connection (40%)'],
    },
  };

  return scenarios[scenario] || scenarios.highlight;
}
