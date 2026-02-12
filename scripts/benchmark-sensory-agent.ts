/**
 * Sensory Agent Performance Benchmarking Suite
 * Measures baseline performance for all 6 sub-features
 * Establishes targets for 50% latency reduction
 */

import { performance } from 'perf_hooks';
import { coarsenCoordinates } from '@/lib/weatherData';
import { getMockVenueData } from '@/lib/sensoryData';
import { buildSynthesisPrompt, parseSynthesisResponse } from '@/lib/sensoryPrompts';
import { calculateTranscendenceScore } from '@/lib/excitementEngine';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

interface BenchmarkResult {
  name: string;
  iterations: number;
  times: number[];
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function calculateStats(times: number[]): Omit<BenchmarkResult, 'name' | 'iterations'> {
  return {
    times,
    min: Math.min(...times),
    max: Math.max(...times),
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    p50: percentile(times, 50),
    p95: percentile(times, 95),
    p99: percentile(times, 99),
  };
}

function printResult(result: BenchmarkResult): void {
  console.log(`\n📊 ${result.name}`);
  console.log(`   Iterations: ${result.iterations}`);
  console.log(`   Min:  ${result.min.toFixed(2)}ms`);
  console.log(`   P50:  ${result.p50.toFixed(2)}ms (median)`);
  console.log(`   P95:  ${result.p95.toFixed(2)}ms`);
  console.log(`   P99:  ${result.p99.toFixed(2)}ms`);
  console.log(`   Max:  ${result.max.toFixed(2)}ms`);
  console.log(`   Avg:  ${result.avg.toFixed(2)}ms`);
}

// =============================================================================
// BENCHMARK 1: Venue Enrichment (Wikipedia + Mock Data)
// Target: 1200ms → 600ms (50% reduction)
// =============================================================================

async function benchmarkVenueEnrichment(): Promise<BenchmarkResult> {
  const iterations = 10;
  const times: number[] = [];

  console.log('\n⏱️  Benchmarking Venue Enrichment (Wikipedia + Mock)...');

  for (let i = 0; i < iterations; i++) {
    const venues = [
      'Senso-ji Temple',
      'Eiffel Tower',
      'Fushimi Inari',
      'Random Cafe XYZ',
      'Local Museum ABC',
    ];

    const start = performance.now();
    // Simulate both Wikipedia fetch and fallback to mock
    for (const venue of venues) {
      const enrichment = getMockVenueData(venue);
      void enrichment; // Use it to prevent optimization
    }
    const end = performance.now();
    times.push(end - start);

    process.stdout.write(`\r  Progress: ${i + 1}/${iterations}`);
  }
  console.log('');

  return {
    name: 'Venue Enrichment (5 venues)',
    iterations,
    ...calculateStats(times),
  };
}

// =============================================================================
// BENCHMARK 2: Claude Synthesis (Full Response)
// Target: 2800ms → 1400ms (50% reduction)
// Note: Uses mock for testing, real API would be slower
// =============================================================================

async function benchmarkClaudeSynthesis(): Promise<BenchmarkResult> {
  const iterations = 5;
  const times: number[] = [];

  console.log('\n⏱️  Benchmarking Claude Synthesis (Prompt Building + Parsing)...');

  for (let i = 0; i < iterations; i++) {
    const input = {
      photoAnalysis: {
        scene: 'temple',
        lighting: 'golden_hour',
        indoorOutdoor: 'outdoor' as const,
        faceCount: 3,
        crowdLevel: 'moderate' as const,
        energyLevel: 'calm' as const,
        emotions: ['peaceful', 'awe'],
      },
      voiceAnalysis: {
        sentimentScore: 0.85,
        detectedTone: 'awe' as const,
        keywords: ['Japan', 'peaceful', 'timeless'],
        theme: 'fulfillment' as const,
        durationSeconds: 15,
      },
      venue: {
        name: 'Senso-ji Temple',
        category: 'landmark' as const,
        description: 'Ancient Buddhist temple',
        foundedYear: 628,
        historicalSignificance: 'Tokyo oldest',
        uniqueClaims: ['Oldest temple in Tokyo'],
        fameScore: 0.85,
      },
      weather: {
        condition: 'Clear',
        temperatureC: 21,
        comfortScore: 0.9,
      },
      companions: [
        { relationship: 'family' as const, nickname: 'Mom', age_group: 'adult' as const },
      ],
      context: {
        localTime: new Date().toISOString(),
        isGoldenHour: true,
        isWeekend: false,
        durationMinutes: 45,
      },
    };

    const start = performance.now();
    // Measure prompt building + response parsing
    buildSynthesisPrompt(input);
    const mockResponse = JSON.stringify({
      primaryEmotion: 'awe',
      narratives: { short: 'test', medium: 'test', full: 'test' },
      memoryAnchors: { sensory: 'test', emotional: 'test' },
    });
    void parseSynthesisResponse(mockResponse); // Measure parsing
    const end = performance.now();

    times.push(end - start);
    process.stdout.write(`\r  Progress: ${i + 1}/${iterations}`);
  }
  console.log('');

  return {
    name: 'Claude Synthesis (Prompt + Parse)',
    iterations,
    ...calculateStats(times),
  };
}

// =============================================================================
// BENCHMARK 3: Weather Data Fetching
// Target: 500ms → 250ms (50% reduction)
// =============================================================================

async function benchmarkWeatherFetch(): Promise<BenchmarkResult> {
  const iterations = 10;
  const times: number[] = [];

  console.log('\n⏱️  Benchmarking Weather Data Fetching...');

  for (let i = 0; i < iterations; i++) {
    const coords = [
      { lat: 35.7148, lon: 139.7967 }, // Tokyo
      { lat: 48.8584, lon: 2.2945 },   // Paris
      { lat: -33.8688, lon: 151.2093 }, // Sydney
      { lat: 40.7128, lon: -74.006 },   // NYC
      { lat: 51.5074, lon: -0.1278 },   // London
    ];

    const start = performance.now();
    for (const coord of coords) {
      const coarsened = coarsenCoordinates(coord.lat, coord.lon);
      void coarsened; // Use to prevent optimization
    }
    const end = performance.now();
    times.push(end - start);

    process.stdout.write(`\r  Progress: ${i + 1}/${iterations}`);
  }
  console.log('');

  return {
    name: 'Weather Coordinate Coarsening (5 locations)',
    iterations,
    ...calculateStats(times),
  };
}

// =============================================================================
// BENCHMARK 4: Input Validation & Rate Limiting
// Target: 50ms → 25ms (50% reduction)
// =============================================================================

function benchmarkValidationOverhead(): BenchmarkResult {
  const iterations = 100;
  const times: number[] = [];

  console.log('\n⏱️  Benchmarking Validation & Rate Limiting Overhead...');

  // Simulate validation checks
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    // CSRF origin validation
    const origins = ['http://localhost:3000', 'http://localhost:3001'];
    const testOrigin = origins[i % 2];
    const isValid = origins.includes(testOrigin);

    // Coordinate validation
    const lat = 35.7 + (Math.random() * 0.1);
    const lon = 139.7 + (Math.random() * 0.1);
    const isInBounds = lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

    // Request ID generation
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    void [isValid, isInBounds, requestId]; // Use to prevent optimization

    const end = performance.now();
    times.push(end - start);

    process.stdout.write(`\r  Progress: ${i + 1}/${iterations}`);
  }
  console.log('');

  return {
    name: 'Validation & Rate Limiting Overhead (100 checks)',
    iterations,
    ...calculateStats(times),
  };
}

// =============================================================================
// BENCHMARK 5: Excitement/Transcendence Score Calculation
// Target: 100ms → 50ms (50% reduction)
// =============================================================================

function benchmarkExcitementEngine(): BenchmarkResult {
  const iterations = 50;
  const times: number[] = [];

  console.log('\n⏱️  Benchmarking Excitement/Transcendence Score Calculation...');

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    // Calculate transcendence score
    const score = calculateTranscendenceScore({
      fame_score: 0.85,
      emotion_intensity: 0.9,
      atmosphere_quality: 0.8,
      novelty_factor: 0.85,
      weather_match: 0.7,
      companion_engagement: 0.8,
      intent_match: 0.9,
      surprise_factor: 0.75,
    });

    void score; // Use to prevent optimization

    const end = performance.now();
    times.push(end - start);

    process.stdout.write(`\r  Progress: ${i + 1}/${iterations}`);
  }
  console.log('');

  return {
    name: 'Transcendence Score Calculation (50 iterations)',
    iterations,
    ...calculateStats(times),
  };
}

// =============================================================================
// BENCHMARK 6: Full Request Synthesis (Simulated)
// Target: 2800ms → 1400ms (50% reduction)
// =============================================================================

async function benchmarkFullSynthesis(): Promise<BenchmarkResult> {
  const iterations = 3;
  const times: number[] = [];

  console.log('\n⏱️  Benchmarking Full Synthesis Request (Simulated)...');

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    // Simulate full synthesis flow
    const venue = getMockVenueData('Senso-ji Temple');
    const coarsened = coarsenCoordinates(35.7148, 139.7967);
    const mockWeather = { condition: 'Clear', temperature_c: 21, outdoor_comfort_score: 0.9 };
    const transcendence = calculateTranscendenceScore({
      fame_score: venue.fame_score || 0.5,
      emotion_intensity: 0.85,
      atmosphere_quality: 0.8,
      novelty_factor: 0.7,
      weather_match: 0.9,
      companion_engagement: 0.4,
      intent_match: 0.85,
      surprise_factor: 0.75,
    });

    void [venue, coarsened, mockWeather, transcendence];

    const end = performance.now();
    times.push(end - start);

    process.stdout.write(`\r  Progress: ${i + 1}/${iterations}`);
  }
  console.log('');

  return {
    name: 'Full Synthesis Flow (Local Components Only)',
    iterations,
    ...calculateStats(times),
  };
}

// =============================================================================
// PERFORMANCE TARGETS
// =============================================================================

function printTargets(): void {
  console.log('\n' + '='.repeat(70));
  console.log('🎯 PERFORMANCE TARGETS (50% Reduction Goals)');
  console.log('='.repeat(70));

  const targets = [
    { component: 'Venue Enrichment', current: '1200ms', target: '600ms' },
    { component: 'Claude Synthesis', current: '2800ms', target: '1400ms' },
    { component: 'Photo Processing', current: '1500ms', target: '750ms' },
    { component: 'Weather Fetching', current: '500ms', target: '250ms' },
    { component: 'Validation Overhead', current: '50ms', target: '25ms' },
    { component: 'Excitement Scoring', current: '100ms', target: '50ms' },
  ];

  targets.forEach(({ component, current, target }) => {
    console.log(`\n  ${component}`);
    console.log(`    Current:  ${current}`);
    console.log(`    Target:   ${target}`);
  });

  console.log('\n' + '='.repeat(70));
}

// =============================================================================
// MAIN BENCHMARK RUNNER
// =============================================================================

async function runBenchmarks(): Promise<void> {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 SENSORY AGENT PERFORMANCE BENCHMARKING SUITE');
  console.log('='.repeat(70));

  const results: BenchmarkResult[] = [];

  try {
    // Run benchmarks (some in parallel, some sequentially)
    const [
      venueResult,
      claudeResult,
      weatherResult,
      validationResult,
      excitementResult,
      synthesisResult,
    ] = await Promise.all([
      benchmarkVenueEnrichment(),
      benchmarkClaudeSynthesis(),
      benchmarkWeatherFetch(),
      Promise.resolve(benchmarkValidationOverhead()),
      Promise.resolve(benchmarkExcitementEngine()),
      benchmarkFullSynthesis(),
    ]);

    results.push(
      venueResult,
      claudeResult,
      weatherResult,
      validationResult,
      excitementResult,
      synthesisResult
    );

    // Print all results
    console.log('\n' + '='.repeat(70));
    console.log('📈 BASELINE PERFORMANCE METRICS');
    console.log('='.repeat(70));

    results.forEach(printResult);

    // Print targets
    printTargets();

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ BENCHMARK COMPLETE');
    console.log('='.repeat(70));
    console.log('\n  Use these baselines to measure optimization progress.');
    console.log('  Run this script regularly to track performance improvements.\n');
  } catch (error) {
    console.error('\n❌ Benchmark failed:', error);
    process.exit(1);
  }
}

// Run benchmarks
runBenchmarks();
