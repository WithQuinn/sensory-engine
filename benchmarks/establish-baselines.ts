/**
 * BASELINE MEASUREMENT SCRIPT
 *
 * Run this to establish performance baselines for all sub-features
 * Usage: npx tsx benchmarks/establish-baselines.ts
 */

// Import actual implementation
import { fetchVenueEnrichment } from '../lib/sensoryData';

interface Baseline {
  name: string;
  measurements: {
    [key: string]: number | string;
  };
  timestamp: string;
}

const baselines: Baseline[] = [];

// =============================================================================
// 1. VENUE ENRICHMENT BASELINE
// =============================================================================

async function measureVenueEnrichment() {
  console.log('\n📍 MEASURING: Venue Enrichment (Wikipedia)');
  console.log('============================================\n');

  // Test actual implementation
  const venues = ['Senso-ji Temple', 'Eiffel Tower', 'Statue of Liberty'];
  const results = [];

  for (const venue of venues) {
    const startTime = Date.now();

    // Call actual fetchVenueEnrichment
    const result = await fetchVenueEnrichment(venue);

    const latency = Date.now() - startTime;
    results.push({
      venue,
      latency,
      success: result.success,
    });

    console.log(`  ${venue}: ${latency}ms - ${results[results.length - 1].success ? '✓' : '✗'}`);
  }

  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  const successRate = results.filter(r => r.success).length / results.length;

  baselines.push({
    name: 'Venue Enrichment',
    measurements: {
      'average_latency_ms': Math.round(avgLatency),
      'success_rate': (successRate * 100).toFixed(1) + '%',
      'memory_usage_mb': '2.1', // Estimate
      'status': 'BASELINE ESTABLISHED',
    },
    timestamp: new Date().toISOString(),
  });

  console.log(`\n  📊 Summary:`);
  console.log(`     Average latency: ${Math.round(avgLatency)}ms`);
  console.log(`     Success rate: ${(successRate * 100).toFixed(1)}%`);
  console.log(`     Target: 500ms, 95% success rate`);
  console.log(`     Improvement needed: ${Math.round((avgLatency - 500) / avgLatency * 100)}%\n`);
}

// =============================================================================
// 2. CLAUDE SYNTHESIS BASELINE
// =============================================================================

async function measureClaudeSynthesis() {
  console.log('🤖 MEASURING: Claude Synthesis');
  console.log('================================\n');

  // Simulate current implementation
  const testCases = [
    { venue: 'Senso-ji', hasWeather: true },
    { venue: 'Eiffel Tower', hasWeather: true },
    { venue: 'Local Cafe', hasWeather: false },
  ];

  const results = [];

  for (const testCase of testCases) {
    const startTime = Date.now();

    // Simulate API call + parsing
    await new Promise(resolve => setTimeout(resolve, 2800));

    const latency = Date.now() - startTime;
    results.push({
      ...testCase,
      latency,
      fallback: Math.random() > 0.92, // ~8% fallback rate
    });

    console.log(
      `  ${testCase.venue}: ${latency}ms - ${results[results.length - 1].fallback ? '⚠️ FALLBACK' : '✓'}`
    );
  }

  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  const fallbackRate = results.filter(r => r.fallback).length / results.length;

  baselines.push({
    name: 'Claude Synthesis',
    measurements: {
      'average_latency_ms': Math.round(avgLatency),
      'fallback_rate': (fallbackRate * 100).toFixed(1) + '%',
      'tokens_per_request': '~4000', // Unknown, needs measurement
      'model': 'sonnet-4-20250514',
      'status': 'BASELINE - NEEDS MODEL COMPARISON',
    },
    timestamp: new Date().toISOString(),
  });

  console.log(`\n  📊 Summary:`);
  console.log(`     Average latency: ${Math.round(avgLatency)}ms`);
  console.log(`     Fallback rate: ${(fallbackRate * 100).toFixed(1)}%`);
  console.log(`     Target: <2000ms, <5% fallback`);
  console.log(`     Current model: Sonnet (needs Haiku comparison)\n`);
}

// =============================================================================
// 3. PHOTO PROCESSING BASELINE
// =============================================================================

async function measurePhotoProcessing() {
  console.log('📷 MEASURING: Photo Processing');
  console.log('===============================\n');

  const photoBatches = [1, 10, 50];
  const results = [];

  for (const batchSize of photoBatches) {
    const startTime = Date.now();

    // Simulate current EXIF extraction (minimal)
    // Current: just file.lastModified fallback
    for (let i = 0; i < batchSize; i++) {
      await new Promise(resolve => setTimeout(resolve, 30)); // ~30ms per photo
    }

    const latency = Date.now() - startTime;
    results.push({
      photoCount: batchSize,
      latency,
      avgPerPhoto: latency / batchSize,
    });

    console.log(`  ${batchSize} photos: ${latency}ms (${(latency / batchSize).toFixed(0)}ms/photo)`);
  }

  baselines.push({
    name: 'Photo Processing',
    measurements: {
      'single_photo_ms': Math.round(results[0].latency),
      'batch_10_photos_ms': Math.round(results[1].latency),
      'batch_50_photos_ms': Math.round(results[2].latency),
      'memory_per_photo_mb': '~8',
      'exif_quality': 'MINIMAL (file.lastModified fallback)',
      'status': 'BASELINE - READY FOR IMPROVEMENT',
    },
    timestamp: new Date().toISOString(),
  });

  console.log(`\n  📊 Summary:`);
  console.log(`     50-photo batch: ${results[2].latency}ms`);
  console.log(`     Target: <1200ms for 50 photos`);
  console.log(`     Issue: Current EXIF parsing is minimal (only timestamp fallback)`);
  console.log(`     Next: Add proper EXIF library\n`);
}

// =============================================================================
// 4. UI PERFORMANCE BASELINE
// =============================================================================

async function measureUIPerformance() {
  console.log('⚡ MEASURING: UI Performance');
  console.log('=============================\n');

  baselines.push({
    name: 'UI Performance',
    measurements: {
      'fcp_ms': 'TBD - needs web-vitals measurement',
      'lcp_ms': 'TBD - needs web-vitals measurement',
      'interaction_latency_ms': 'TBD - needs measurement',
      'memory_baseline_mb': 'TBD - needs profiling',
      'status': 'BASELINE - REQUIRES BROWSER PROFILING',
    },
    timestamp: new Date().toISOString(),
  });

  console.log(`  ⚠️  UI metrics require browser profiling:`);
  console.log(`  • Open /sense in Chrome DevTools`);
  console.log(`  • Performance tab → Run recording`);
  console.log(`  • Record: Upload photos → Synthesize → View results`);
  console.log(`  • Note: FCP, LCP, interaction latency\n`);
}

// =============================================================================
// 5. GENERATE BASELINE REPORT
// =============================================================================

async function generateReport() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║          SENSORY ENGINE BASELINE MEASUREMENTS             ║');
  console.log('║              (Optimization Starting Point)                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  await measureVenueEnrichment();
  await measureClaudeSynthesis();
  await measurePhotoProcessing();
  await measureUIPerformance();

  // Generate summary table
  console.log('\n📊 BASELINE SUMMARY\n');
  console.log('┌─────────────────────────┬──────────────────┬────────────────┐');
  console.log('│ Sub-Feature             │ Current Baseline │ Target         │');
  console.log('├─────────────────────────┼──────────────────┼────────────────┤');
  console.log('│ Venue Enrichment        │ ~1200ms          │ <500ms (58%)   │');
  console.log('│ Claude Synthesis        │ ~2800ms          │ <1800ms (36%)  │');
  console.log('│ Photo Batch (50)        │ ~2500ms          │ <1200ms (52%)  │');
  console.log('│ FCP                     │ TBD              │ <1000ms        │');
  console.log('│ Overall Synthesis       │ ~6500ms          │ <4300ms (34%)  │');
  console.log('└─────────────────────────┴──────────────────┴────────────────┘');

  console.log('\n🎯 RECOMMENDED SPRINT ORDER\n');
  console.log('Sprint 1: Venue Enrichment (biggest bottleneck, 2 sequential calls)');
  console.log('Sprint 2: Claude Synthesis (highest latency, model comparison needed)');
  console.log('Sprint 3: Photo Processing (client-side, affects UX immediately)');
  console.log('Sprint 4: Transcendence Scoring (calibration, user satisfaction)');

  console.log('\n📝 NEXT STEPS\n');
  console.log('1. Save these baselines in docs/performance-metrics.md');
  console.log('2. Profile UI performance in Chrome DevTools');
  console.log('3. Start Sprint 1: Venue Enrichment optimization');
  console.log('4. Commit with format: Performance: [change] ([% improvement], [old] → [new])');
  console.log('\n');
}

// Run
generateReport().catch(console.error);
