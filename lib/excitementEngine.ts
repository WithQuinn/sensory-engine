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

  // Find dominant factor
  const weightedFactors = Object.entries(factors).map(([key, value]) => ({
    key: key as keyof TranscendenceFactors,
    weighted: value * TRANSCENDENCE_WEIGHTS[key as keyof typeof TRANSCENDENCE_WEIGHTS],
  }));
  weightedFactors.sort((a, b) => b.weighted - a.weighted);
  const dominantFactor = weightedFactors[0].key;

  return {
    score: roundedScore,
    factors,
    isHighlight: roundedScore >= 0.7,
    dominantFactor,
  };
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
  // Map -1..1 to 0..1, with positive emotions scoring higher
  const emotionIntensity = sentimentScore !== null
    ? Math.abs(sentimentScore) * (sentimentScore > 0 ? 1 : 0.5)
    : 0.5;

  // Atmosphere quality: direct from photo analysis
  const atmosphere = atmosphereQuality ?? 0.5;

  // Novelty: first visits score higher
  const novelty = isFirstVisit ? 0.85 : 0.4;

  // Fame: direct from venue enrichment
  const fame = fameScore ?? 0.3;

  // Weather: direct from comfort score
  const weather = weatherComfort ?? 0.5;

  // Companion engagement: more companions = potentially higher
  // Capped at 0.9 for 4+ companions
  const companionEngagement = Math.min(0.9, 0.3 + companionCount * 0.2);

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
    },
  };

  return scenarios[scenario] || scenarios.highlight;
}
