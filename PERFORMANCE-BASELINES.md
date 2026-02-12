# Performance Baselines - Sensory Agent v1

**Established:** 2026-02-12
**Measurement Method:** Local component benchmarking (excludes network latency)
**Goal:** 50% latency reduction across all sub-features

## Local Processing Baselines

These measurements represent local processing only and don't include network latency from external APIs.

### 1. Venue Enrichment (Mock Data + Calculation)
**Metric:** Processing 5 venues
**Baseline:** 0.05ms average, 0.21ms P95
**Target:** 0.025ms average (50% reduction)

Local processing is negligible. Optimization focus:
- Cache venue enrichment responses (TTL: 5 min)
- Pre-warm cache with popular venues
- Parallel Wikipedia queries when available

---

### 2. Claude Synthesis (Prompt Building + Response Parsing)
**Metric:** Build prompt + parse mock response
**Baseline:** 0.45ms average, 1.79ms P95
**Target:** 0.22ms average (50% reduction)

Local processing is fast. Optimization focus:
- Cache prompt templates
- Parallel Claude requests (requires queue)
- Response streaming for large synthesis

---

### 3. Weather Data Processing (Coordinate Coarsening)
**Metric:** Coarsen 5 coordinate sets
**Baseline:** 0.01ms average, 0.03ms P95
**Target:** 0.005ms average (50% reduction)

Local processing is negligible. Optimization focus:
- Client-side coordinate coarsening (pre-request)
- Cache weather responses by coarsened coordinate
- Parallel weather queries

---

### 4. Validation & Rate Limiting
**Metric:** 100 validation checks
**Baseline:** ~0.00ms average (negligible)
**Target:** Further optimization unlikely

✅ Already optimal - proceed with production deployment.

---

### 5. Excitement/Transcendence Scoring
**Metric:** 50 score calculations
**Baseline:** 0.01ms average, 0.14ms P99
**Target:** 0.005ms average (50% reduction)

Local processing is fast. Optimization focus:
- Memoize score calculations for same inputs
- Pre-compute venue fame tiers
- Cache score distribution percentiles

---

### 6. Full Synthesis Flow (Local Components)
**Metric:** Complete local synthesis simulation
**Baseline:** 0.01ms average, 0.02ms P95
**Target:** 0.005ms average (50% reduction)

✅ Local processing is fast enough - bottleneck is external APIs.

---

## Network Latency Baselines (Real API calls)

These measurements will be taken during integration testing with real APIs:

| Component | API | Expected P95 | Target P95 |
|-----------|-----|--------------|-----------|
| Venue Enrichment | Wikipedia | 800ms | 400ms |
| Weather Fetching | OpenWeather | 300ms | 150ms |
| Sentiment Analysis | Local ML | 400ms | 200ms |
| Claude Synthesis | Claude API | 2200ms | 1100ms |
| **Total End-to-End** | Combined | **3700ms** | **1850ms** |

---

## Optimization Strategy

### Phase 1: Quick Wins (2-3 hours)
1. ✅ Implement response caching (TTL: 5 min)
2. ✅ Parallel API calls using Promise.all()
3. ✅ Client-side coordinate coarsening
4. Expected improvement: 30-40% reduction

### Phase 2: Advanced Optimizations (3-5 hours)
1. Request deduplication (same venue within 1 min)
2. Response streaming for large synthesized narratives
3. Claude prompt optimization (shorter but equally effective)
4. Expected improvement: 40-50% total reduction

### Phase 3: Production Hardening (2-3 hours)
1. Cache invalidation strategy
2. Fallback chain optimization
3. Timeout tuning based on P95 metrics
4. Expected improvement: 50% target achieved

---

## Measurement Instructions

To re-run benchmarks and track progress:

```bash
# Run benchmarks
npx tsx scripts/benchmark-sensory-agent.ts

# For real API benchmarks (requires API keys):
ANTHROPIC_API_KEY=... OPENWEATHER_API_KEY=... npm run benchmark
```

## Success Criteria

✅ Achieved when:
- P95 latency: 3700ms → 1850ms
- P99 latency: < 2200ms
- Cache hit rate: > 60% for venue queries
- Error fallback latency: < 500ms

---

## Notes

- Local processing overhead is < 2ms (negligible)
- Main optimization opportunities are in external API latency
- Response caching and parallel requests offer best ROI
- Client-side processing should focus on parallel computation
