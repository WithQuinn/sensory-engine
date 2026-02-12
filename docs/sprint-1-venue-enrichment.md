# Sprint 1: Venue Enrichment Optimization

## Goal
Reduce Wikipedia venue enrichment from ~1200ms to <500ms (58% improvement)

---

## CURRENT BOTTLENECK

### Issue 1: Sequential API Calls
Current code (`lib/sensoryData.ts`):
```typescript
// ❌ SLOW: Sequential (search then page)
const searchResult = await searchWikipedia(searchQuery);    // ~300-400ms

if (!searchResult) {
  const fallbackResult = await searchWikipedia(venueName); // +300-400ms (sequential!)
  if (!fallbackResult) {
    return { success: false };
  }
}

const wikiData = await fetchWikipediaPage(pageTitle);      // +300-400ms (sequential!)
// Total: ~900-1200ms
```

### Issue 2: No Caching
- Same venue searched every time
- Missing simple TTL cache
- Could save 1200ms on repeat requests

### Issue 3: Low Success Rate (~78%)
- No intelligent fallback
- Should try multiple search strategies

---

## OPTIMIZATION STRATEGY

### Step 1: Parallel API Calls (Target: -400ms)

```typescript
// ✅ FAST: Parallel search + fallback search
async function fetchVenueEnrichment(venueName: string): Promise<VenueFetchResult> {
  const searchQuery = venueName;

  // Parallel searches: main + fallback
  const [primaryResult, fallbackResult] = await Promise.all([
    searchWikipedia(searchQuery),
    searchWikipedia(venueName.split(' ')[0]) // Search just first word as fallback
  ]);

  const searchResult = primaryResult || fallbackResult;

  if (!searchResult) {
    return { success: false };
  }

  // Page fetch (already optimized - single call)
  const pageTitle = searchResult.title;
  const wikiData = await fetchWikipediaPage(pageTitle);

  if (!wikiData) {
    return { success: false };
  }

  // ... rest of enrichment logic
}
```

**Expected improvement:** ~300-400ms saved
- Before: search (400ms) + fallback search (0ms, already checked) + page (400ms) = 800ms
- After: search parallel fallback (400ms) + page (400ms) = 400ms saved

### Step 2: Add Caching (Target: -200ms)

```typescript
// Simple in-memory cache with TTL
interface CacheEntry {
  data: VenueEnrichment;
  timestamp: number;
}

const CACHE: Map<string, CacheEntry> = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

async function fetchVenueEnrichment(venueName: string): Promise<VenueFetchResult> {
  // Check cache first
  const cached = CACHE.get(venueName.toLowerCase());
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[Cache HIT] ${venueName}`);
    return { success: true, data: cached.data };
  }

  // ... optimization from Step 1 (parallel calls)

  // Cache result before returning
  if (success && data) {
    CACHE.set(venueName.toLowerCase(), {
      data,
      timestamp: Date.now(),
    });
  }

  return { success, data };
}
```

**Expected improvement:** ~200ms for cached requests
- First request: 500ms
- Repeat requests: ~10ms (cache hit)

### Step 3: Better Fallback Strategy (Target: Improved success rate)

```typescript
async function searchWikipediaWithFallbacks(query: string): Promise<SearchResult | null> {
  // Strategy: Try multiple search approaches in parallel
  const searches = [
    searchWikipedia(query),                           // Full query
    searchWikipedia(query.split(' ')[0]),            // First word
    searchWikipedia(query.split(' ').slice(0, 2).join(' ')), // First two words
  ];

  const results = await Promise.allSettled(searches);

  // Return first successful result
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }

  return null;
}
```

**Expected improvement:** Success rate 78% → 95%

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Code Changes
- [ ] Update `fetchVenueEnrichment()` with parallel searches
- [ ] Add caching layer with TTL
- [ ] Implement multi-strategy fallback
- [ ] Update types/interfaces if needed
- [ ] Ensure existing tests still pass (666+ test suite)

### Phase 2: Measurement & Validation
- [ ] Benchmark: Run 100 requests, measure before/after
- [ ] Cache hit rate: Should see ~60% cache hits on real usage
- [ ] Success rate: Measure against known venues
- [ ] Memory usage: Monitor cache size
- [ ] Quality: Verify enrichment is same quality

### Phase 3: Testing
- [ ] Update integration tests for caching behavior
- [ ] Test cache expiration
- [ ] Test fallback strategies
- [ ] Test error cases
- [ ] Run full 666+ test suite

### Phase 4: Documentation
- [ ] Document cache strategy in code
- [ ] Update `/docs/performance-metrics.md`
- [ ] Record optimization patterns discovered
- [ ] Document trade-offs (memory for speed)

---

## MEASUREMENT PROTOCOL

### Before Optimization
```bash
# Run baseline 100 times
for i in {1..100}; do
  time curl -X POST http://localhost:3000/api/synthesize-sense \
    -d '{"venue": {"name": "Senso-ji Temple"}}'
done
```

**Record:**
- Average latency: ___ ms
- Worst case: ___ ms
- Success rate: ___ %

### After Optimization
```bash
# Same test, should see improvement
```

**Record:**
- Average latency: ___ ms (target: <500ms)
- Worst case: ___ ms
- Success rate: ___ % (target: >95%)
- Cache hit rate: ___ %

---

## COMMIT MESSAGE FORMAT

After completing all changes:

```
Performance: Parallel Wikipedia calls (58% faster, 1200ms → 500ms)

- Parallelize search + fallback search
- Add 24-hour TTL caching
- Implement multi-strategy fallback
- Improve success rate: 78% → 95%

Benchmarks:
  Before: 1200ms avg, 78% success
  After:  500ms avg, 95% success
  Cache:  +60% hit rate on real usage

Tests: All 666+ tests passing
```

---

## EXPECTED TIMELINE

- **Day 1:** Code changes (parallel + caching)
- **Day 2:** Testing & benchmarking
- **Day 3:** Refinement & fallback optimization
- **Day 4:** Performance validation
- **Day 5:** Documentation & commit

---

## SUCCESS CRITERIA

✅ **Performance**
- [ ] Average latency: <500ms (was 1200ms)
- [ ] Cached requests: <50ms
- [ ] No regression in synthesis quality

✅ **Reliability**
- [ ] Success rate: >95% (was 78%)
- [ ] All 666+ tests passing
- [ ] No memory leaks from cache

✅ **Code Quality**
- [ ] Clear comments explaining cache strategy
- [ ] TypeScript strict mode passing
- [ ] No console errors

✅ **Documentation**
- [ ] Metrics updated in `/docs/performance-metrics.md`
- [ ] Optimization pattern documented
- [ ] Commit message includes before/after numbers

---

## QUESTIONS TO ANSWER

Before moving to Sprint 2, you should understand:

1. **Why parallel?**
   - Sequential = wait for first call before starting second
   - Parallel = both start at same time, wait for slowest
   - Saves time if both are slow

2. **Why caching?**
   - Wikipedia data for "Eiffel Tower" doesn't change hourly
   - 1-day TTL is reasonable trade-off
   - Cache hit rate should be 60%+ on real users

3. **Why multiple fallback strategies?**
   - "Senso-ji Temple" → try full → first word "Senso-ji" → first two words "Senso-ji Temple"
   - Increases chance of finding result

4. **Memory vs Speed trade-off:**
   - Cache uses some memory (estimate: 100 venues × 2KB = 200KB)
   - Worth it to save 1200ms on repeat requests

---

## MOVING TO SPRINT 2

After completing Sprint 1 and reaching:
- ✅ 500ms venue enrichment
- ✅ 95% success rate
- ✅ All tests passing
- ✅ Metrics documented

You'll have proven the pattern and can apply same approach to Claude Synthesis optimization in Sprint 2.
