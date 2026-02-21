// =============================================================================
// TRANSCENDENCE SCORING ANALYSIS
// Test current scoring with variety of scenarios to identify issues
// =============================================================================

import { buildTranscendenceFactors, calculateTranscendenceScore } from '../lib/excitementEngine';

// =============================================================================
// TEST SCENARIOS
// =============================================================================

const scenarios = [
  {
    name: "Famous Landmark - First Visit - Perfect Day",
    description: "Eiffel Tower, first time, sunny, with partner, exceeded expectations",
    params: {
      sentimentScore: 0.9,  // Very positive
      atmosphereQuality: 0.85,  // Beautiful
      isFirstVisit: true,
      fameScore: 0.95,  // Iconic
      weatherComfort: 0.9,  // Perfect weather
      companionCount: 1,  // Partner
      intentMatch: 0.95,  // Exceeded expectations
      hadUnexpectedMoment: true,
    },
    expectedScore: ">0.80 (highlight)",
  },
  {
    name: "Local Café - Solo - Repeat Visit",
    description: "Favorite neighborhood café, morning coffee alone, nice day",
    params: {
      sentimentScore: 0.6,  // Pleasant
      atmosphereQuality: 0.7,  // Cozy
      isFirstVisit: false,  // Regular spot
      fameScore: 0.2,  // Local, not famous
      weatherComfort: 0.7,  // Nice day
      companionCount: 0,  // Solo
      intentMatch: 0.8,  // Exactly what needed
      hadUnexpectedMoment: false,
    },
    expectedScore: "0.45-0.55 (moderate)",
  },
  {
    name: "Unmarked Nature Spot - First Visit - Awe",
    description: "Hidden waterfall, no Wikipedia page, discovered by accident, profound moment",
    params: {
      sentimentScore: 0.95,  // Awe
      atmosphereQuality: 0.9,  // Stunning
      isFirstVisit: true,  // Discovery
      fameScore: 0.0,  // Unknown
      weatherComfort: 0.5,  // Overcast but fine
      companionCount: 0,  // Solo discovery
      intentMatch: 0.2,  // Unplanned
      hadUnexpectedMoment: true,  // Total surprise
    },
    expectedScore: "0.60-0.70 (should be higher due to profound emotion + discovery)",
  },
  {
    name: "Tourist Trap - Disappointing",
    description: "Famous restaurant, long-awaited, but disappointing food, crowded, overpriced",
    params: {
      sentimentScore: -0.4,  // Disappointed
      atmosphereQuality: 0.3,  // Crowded, rushed
      isFirstVisit: true,
      fameScore: 0.7,  // Famous
      weatherComfort: 0.5,  // Irrelevant (indoor)
      intentMatch: 0.2,  // Failed expectations
      hadUnexpectedMoment: false,
    },
    expectedScore: "0.35-0.45 (low despite fame)",
  },
  {
    name: "Family Trip - High Engagement",
    description: "Theme park with kids, exhausting but magical, everyone engaged",
    params: {
      sentimentScore: 0.75,  // Joy despite fatigue
      atmosphereQuality: 0.8,  // Lively, fun
      isFirstVisit: false,  // Been before
      fameScore: 0.6,  // Disneyland
      weatherComfort: 0.8,  // Great day
      companionCount: 4,  // 2 adults + 2 kids
      intentMatch: 0.9,  // Perfect family day
      hadUnexpectedMoment: true,  // Kid's reaction
    },
    expectedScore: "0.70-0.80 (highlight for families)",
  },
  {
    name: "Romantic Sunset - Two People",
    description: "Beach sunset with partner, intimate moment, simple but profound",
    params: {
      sentimentScore: 0.85,  // Deep contentment
      atmosphereQuality: 0.9,  // Perfect light
      isFirstVisit: false,  // Favorite spot
      fameScore: 0.3,  // Local beach
      weatherComfort: 0.95,  // Golden hour perfection
      companionCount: 1,  // Just two
      intentMatch: 0.85,  // Exactly what wanted
      hadUnexpectedMoment: false,
    },
    expectedScore: "0.65-0.75 (should be high due to emotion + atmosphere)",
  },
  {
    name: "Grief Moment - Highly Emotional",
    description: "Visiting late parent's favorite place, deeply emotional, meaningful",
    params: {
      sentimentScore: -0.7,  // Sadness but meaningful
      atmosphereQuality: 0.6,  // Quiet, reflective
      isFirstVisit: false,  // Returning
      fameScore: 0.1,  // Personal, not famous
      weatherComfort: 0.5,  // Doesn't matter
      companionCount: 0,  // Solo
      intentMatch: 0.9,  // Intentional pilgrimage
      hadUnexpectedMoment: false,
    },
    expectedScore: "Should be moderate-high (profound despite negative emotion)",
  },
  {
    name: "Minimal Data - Unknown Venue",
    description: "No venue data, few photos, no voice note, but pleasant",
    params: {
      sentimentScore: null,  // No voice note
      atmosphereQuality: null,  // No photo analysis
      isFirstVisit: false,  // Unknown
      fameScore: null,  // No venue data
      weatherComfort: null,  // No weather
      companionCount: 0,
      intentMatch: null,
      hadUnexpectedMoment: false,
    },
    expectedScore: "0.40-0.50 (defaults to moderate)",
  },
];

// =============================================================================
// RUN ANALYSIS
// =============================================================================

console.log("\n=== TRANSCENDENCE SCORING ANALYSIS ===\n");

scenarios.forEach((scenario, index) => {
  console.log(`\n${index + 1}. ${scenario.name}`);
  console.log(`   ${scenario.description}`);
  console.log(`   Expected: ${scenario.expectedScore}\n`);

  const factors = buildTranscendenceFactors(scenario.params);
  const result = calculateTranscendenceScore(factors);

  console.log(`   ACTUAL SCORE: ${result.score} ${result.isHighlight ? '⭐ HIGHLIGHT' : ''}`);
  console.log(`   Dominant factor: ${result.dominantFactor}`);
  console.log(`\n   Factor Breakdown:`);

  const factorEntries = Object.entries(factors) as [keyof typeof factors, number][];
  factorEntries
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, value]) => {
      const percentage = (value * 100).toFixed(0);
      const bar = '█'.repeat(Math.floor(value * 20));
      console.log(`   ${key.padEnd(25)} ${bar} ${percentage}%`);
    });

  console.log('\n   ---');
});

// =============================================================================
// ISSUE SUMMARY
// =============================================================================

console.log("\n\n=== IDENTIFIED ISSUES ===\n");

const issues = [
  {
    issue: "First visit bonus too high",
    current: "0.85 vs 0.40 (2.1x multiplier)",
    problem: "Dominates scoring even when other factors are low",
    suggestion: "0.75 vs 0.45 (1.67x multiplier) - still significant but not overwhelming",
  },
  {
    issue: "Companion engagement assumes more = better",
    current: "Solo: 0.3, Couple: 0.5, Family: 0.9",
    problem: "Romantic moments for two score lower than family crowds",
    suggestion: "Context-aware: solo can be 0.8 (solitude), couple can be 0.9 (intimacy)",
  },
  {
    issue: "Negative emotions penalized too much",
    current: "Negative sentiment * 0.5",
    problem: "Grief, overcoming fear, meaningful sadness are transcendent too",
    suggestion: "Use absolute value without penalty, add 'emotion_depth' factor",
  },
  {
    issue: "Fame weight same as weather",
    current: "Fame: 10%, Weather: 10%",
    problem: "Perfect weather shouldn't matter as much as Eiffel Tower",
    suggestion: "Fame: 15%, Weather: 5%",
  },
  {
    issue: "No score explanation",
    current: "Just a number 0.87",
    problem: "Users don't know WHY this moment scored high",
    suggestion: "Return top 3 factors: 'High emotion (89%), Famous landmark (95%), Perfect weather (90%)'",
  },
  {
    issue: "Intent match defaults to 0.5 when missing",
    current: "Assumes neutral when no data",
    problem: "Inflates scores artificially",
    suggestion: "If null, don't include in score (reweight others)",
  },
];

issues.forEach((issue, i) => {
  console.log(`${i + 1}. ${issue.issue}`);
  console.log(`   Current: ${issue.current}`);
  console.log(`   Problem: ${issue.problem}`);
  console.log(`   Suggested: ${issue.suggestion}\n`);
});

console.log("\n=== END ANALYSIS ===\n");
