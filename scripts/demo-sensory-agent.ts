/**
 * Demo script for Sensory Agent
 * Tests 8 use cases from the user story
 *
 * Run: npx tsx scripts/demo-sensory-agent.ts
 */

import type { SensoryInput } from '../lib/sensoryValidation';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// =============================================================================
// Test Cases from User Story
// =============================================================================

const TEST_CASES: Array<{
  name: string;
  description: string;
  input: SensoryInput;
}> = [
  {
    name: 'Senso-ji Temple (High Emotion)',
    description: 'Classic temple visit with family, high sentiment',
    input: {
      photos: { count: 12, refs: [] },
      audio: {
        duration_seconds: 8,
        recorded_at: new Date().toISOString(),
        transcript: null,
        sentiment_score: 0.85,
        sentiment_keywords: ['Japan', 'dreamed', 'peaceful'],
      },
      venue: {
        name: 'Senso-ji Temple',
        coordinates: { lat: 35.7148, lon: 139.7967 },
      },
      companions: [
        { name: 'Mom', relationship: 'family', detected_from_photo: false },
        { name: 'Max', relationship: 'family', detected_from_photo: false, age_group: 'child' },
      ],
      captured_at: new Date().toISOString(),
      detection: { trigger: 'manual', confidence: 1.0, signals: ['user_initiated'] },
      preferences: { enable_cloud_synthesis: true, include_companion_insights: true },
    },
  },
  {
    name: 'Eiffel Tower (Famous Landmark)',
    description: 'Iconic landmark with high fame score',
    input: {
      photos: { count: 8, refs: [] },
      audio: {
        duration_seconds: 12,
        recorded_at: new Date().toISOString(),
        transcript: null,
        sentiment_score: 0.92,
        sentiment_keywords: ['amazing', 'first', 'Paris'],
      },
      venue: {
        name: 'Eiffel Tower',
        coordinates: { lat: 48.8584, lon: 2.2945 },
      },
      companions: [],
      captured_at: new Date().toISOString(),
      detection: { trigger: 'manual', confidence: 1.0, signals: ['user_initiated'] },
      preferences: { enable_cloud_synthesis: true, include_companion_insights: true },
    },
  },
  {
    name: 'Local Ramen Shop (Casual Dining)',
    description: 'Low-key dining experience',
    input: {
      photos: { count: 3, refs: [] },
      audio: {
        duration_seconds: 5,
        recorded_at: new Date().toISOString(),
        transcript: null,
        sentiment_score: 0.6,
        sentiment_keywords: ['delicious', 'warm'],
      },
      venue: {
        name: 'Ichiran Ramen Shibuya',
      },
      companions: [
        { name: 'Sarah', relationship: 'friend', detected_from_photo: false },
      ],
      captured_at: new Date().toISOString(),
      detection: { trigger: 'manual', confidence: 1.0, signals: ['user_initiated'] },
      preferences: { enable_cloud_synthesis: true, include_companion_insights: true },
    },
  },
  {
    name: 'Fushimi Inari (Early Morning)',
    description: 'Shrine visit with golden hour lighting',
    input: {
      photos: { count: 20, refs: [] },
      audio: {
        duration_seconds: 15,
        recorded_at: new Date().toISOString(),
        transcript: null,
        sentiment_score: 0.88,
        sentiment_keywords: ['beautiful', 'quiet', 'peaceful', 'thousands'],
      },
      venue: {
        name: 'Fushimi Inari Shrine',
        coordinates: { lat: 34.9671, lon: 135.7727 },
      },
      companions: [],
      captured_at: '2025-04-15T06:30:00Z', // Golden hour
      detection: { trigger: 'manual', confidence: 1.0, signals: ['user_initiated'] },
      preferences: { enable_cloud_synthesis: true, include_companion_insights: true },
    },
  },
  {
    name: 'Beach Sunset (Nature)',
    description: 'Relaxing beach moment with calm sentiment',
    input: {
      photos: { count: 5, refs: [] },
      audio: {
        duration_seconds: 10,
        recorded_at: new Date().toISOString(),
        transcript: null,
        sentiment_score: 0.7,
        sentiment_keywords: ['calm', 'peace', 'waves'],
      },
      venue: {
        name: 'Waikiki Beach',
        coordinates: { lat: 21.2766, lon: -157.8266 },
      },
      companions: [
        { name: 'Partner', relationship: 'partner', detected_from_photo: false },
      ],
      captured_at: '2025-06-20T18:30:00Z', // Sunset
      detection: { trigger: 'manual', confidence: 1.0, signals: ['user_initiated'] },
      preferences: { enable_cloud_synthesis: true, include_companion_insights: true },
    },
  },
  {
    name: 'No Audio (Photos Only)',
    description: 'Test case with no voice note',
    input: {
      photos: { count: 4, refs: [] },
      audio: null,
      venue: {
        name: 'Grand Canyon',
        coordinates: { lat: 36.0544, lon: -112.1401 },
      },
      companions: [],
      captured_at: new Date().toISOString(),
      detection: { trigger: 'manual', confidence: 1.0, signals: ['user_initiated'] },
      preferences: { enable_cloud_synthesis: true, include_companion_insights: true },
    },
  },
  {
    name: 'Unknown Venue (No Enrichment)',
    description: 'Test fallback when venue not found on Wikipedia',
    input: {
      photos: { count: 2, refs: [] },
      audio: {
        duration_seconds: 8,
        recorded_at: new Date().toISOString(),
        transcript: null,
        sentiment_score: 0.5,
        sentiment_keywords: ['nice', 'quiet'],
      },
      venue: {
        name: 'Some Random Local Cafe XYZ123',
      },
      companions: [],
      captured_at: new Date().toISOString(),
      detection: { trigger: 'manual', confidence: 1.0, signals: ['user_initiated'] },
      preferences: { enable_cloud_synthesis: true, include_companion_insights: true },
    },
  },
  {
    name: 'Multi-Companion Family Trip',
    description: 'Test companion experience synthesis',
    input: {
      photos: { count: 15, refs: [] },
      audio: {
        duration_seconds: 20,
        recorded_at: new Date().toISOString(),
        transcript: null,
        sentiment_score: 0.8,
        sentiment_keywords: ['family', 'together', 'fun', 'remember'],
      },
      venue: {
        name: 'Tokyo Disneyland',
        coordinates: { lat: 35.6329, lon: 139.8804 },
      },
      companions: [
        { name: 'Dad', relationship: 'family', detected_from_photo: false, age_group: 'adult' },
        { name: 'Emma', relationship: 'family', detected_from_photo: false, age_group: 'child' },
        { name: 'Jake', relationship: 'family', detected_from_photo: false, age_group: 'teen' },
        { name: 'Grandma', relationship: 'family', detected_from_photo: false, age_group: 'senior' },
      ],
      captured_at: new Date().toISOString(),
      detection: { trigger: 'manual', confidence: 1.0, signals: ['user_initiated'] },
      preferences: { enable_cloud_synthesis: true, include_companion_insights: true },
    },
  },
];

// =============================================================================
// Runner
// =============================================================================

async function runTest(testCase: typeof TEST_CASES[0]): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testCase.name}`);
  console.log(`${testCase.description}`);
  console.log('='.repeat(60));

  try {
    const startTime = Date.now();

    const response = await fetch(`${BASE_URL}/api/synthesize-sense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': 'demo-script',
      },
      body: JSON.stringify(testCase.input),
    });

    const elapsed = Date.now() - startTime;
    const data = await response.json();

    if (!response.ok || !data.success) {
      console.log(`FAILED: ${data.error || response.statusText}`);
      return;
    }

    const moment = data.moment;
    console.log(`\nRESULT (${elapsed}ms):`);
    console.log(`  Venue: ${moment.venue_name}`);
    console.log(`  Emotion: ${moment.primary_emotion} (${(moment.emotion_confidence * 100).toFixed(0)}%)`);
    console.log(`  Transcendence: ${(moment.transcendence_score * 100).toFixed(0)}% ${moment.transcendence_score >= 0.7 ? '★ HIGHLIGHT' : ''}`);
    console.log(`\nNARRATIVE (short):`);
    console.log(`  "${moment.narratives.short}"`);
    console.log(`\nMEMORY ANCHORS:`);
    console.log(`  Sensory: ${moment.memory_anchors.sensory_anchor}`);
    console.log(`  Emotional: ${moment.memory_anchors.emotional_anchor}`);
    if (moment.excitement.excitement_hook) {
      console.log(`\nEXCITEMENT HOOK:`);
      console.log(`  "${moment.excitement.excitement_hook}"`);
    }
    console.log(`\nPROCESSING:`);
    console.log(`  Tier: ${moment.processing.tier}`);
    console.log(`  Local: ${moment.processing.local_percentage}%`);
    console.log(`  Cloud calls: ${moment.processing.cloud_calls.join(', ') || 'none'}`);

  } catch (error) {
    console.log(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function main() {
  console.log('Sensory Agent Demo');
  console.log(`API: ${BASE_URL}`);
  console.log(`Tests: ${TEST_CASES.length}`);

  for (const testCase of TEST_CASES) {
    await runTest(testCase);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('Demo complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);
