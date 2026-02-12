# Sensory Engine: Optimization-Focused Development Workflow

## Your New Development Loop (vs Old Approach)

### OLD WORKFLOW ❌
```
Build full feature → Write tests → Deploy → (Maybe optimize later)
```

### NEW WORKFLOW ✅
```
Choose sub-feature → Baseline → Code → Measure → Document → Commit
```

---

## THE 5-DAY SPRINT CYCLE

### Day 1: Choose & Baseline
```bash
# Pick ONE sub-feature (e.g., Venue Enrichment)
# Establish performance baseline
npx tsx benchmarks/establish-baselines.ts

# Document current state
# Update: docs/performance-metrics.md
```

**Deliverable:** Baseline numbers (latency, success rate, memory)

---

### Day 2-3: Code Optimization
```typescript
// Identify the bottleneck
// Before: Sequential API calls
const search = await searchWikipedia();     // 400ms
const page = await fetchPage();             // 400ms
// Total: 800ms

// After: Parallel calls
const [search, page] = await Promise.all([
  searchWikipedia(),
  fallbackSearch()
]); // Total: 400ms (saved 400ms!)
```

**Deliverable:** Working optimization + all tests passing

---

### Day 4: Measure & Validate
```bash
# Run benchmarks again
npx tsx benchmarks/establish-baselines.ts

# Expected output:
# Before: 1200ms
# After:  500ms
# Improvement: 58%
```

**Deliverable:** Performance numbers + validation that quality didn't degrade

---

### Day 5: Document & Commit
```bash
# Update metrics
# vim docs/performance-metrics.md

# Commit with NEW STYLE:
git add .
git commit -m "Performance: Parallel Wikipedia calls (58% faster, 1200ms → 500ms)"

# Or longer form:
git commit -m "Performance: Parallel Wikipedia calls (58% faster, 1200ms → 500ms)

- Parallelize search + fallback search
- Add 24-hour TTL caching
- Implement multi-strategy fallback

Benchmarks:
  Before: 1200ms avg, 78% success
  After:  500ms avg, 95% success
"
```

**Deliverable:** Commit with clear metrics + updated docs

---

## COMMIT MESSAGE STYLE GUIDE

### Format: `[Type]: [Change] ([Improvement %], [Old] → [New])`

### Examples

#### Performance (✨ Recommended)
```
Performance: Parallel Wikipedia calls (58% faster, 1200ms → 500ms)
Performance: Add Claude synthesis caching (40% faster, avg 2800ms → 1680ms)
Performance: Optimize photo batch processing (52% faster, 50 photos in 1200ms)
```

#### Fix
```
Fix: Handle missing API key gracefully (95% → 98% success rate)
Fix: Prevent memory leaks in photo processing
```

#### Feature (Rare in optimization sprints)
```
Feature: Scene detection for photo analysis (new capability)
```

#### Cleanup
```
Cleanup: Consolidate caching logic (no perf change)
```

---

## SPRINT PRIORITY ORDER

```
1️⃣ Sprint 1: Venue Enrichment     (Est: 58% improvement)
2️⃣ Sprint 2: Claude Synthesis     (Est: 36% improvement)
3️⃣ Sprint 3: Photo Processing     (Est: 52% improvement)
4️⃣ Sprint 4: Transcendence Score  (Est: Accuracy improvement)
5️⃣ Sprint 5: UI Performance       (Est: 33% improvement)
```

---

## KEY METRICS TO TRACK

### For Each Sub-Feature

```
✅ Performance:      Latency (ms), throughput (req/sec)
✅ Reliability:      Success rate (%), error rate (%)
✅ Quality:          No regression in output quality
✅ Memory:           Usage (MB), leaks (0)
✅ Test Coverage:    All 666+ tests still passing
```

### Example: Venue Enrichment

| Metric | Before | Target | Status |
|--------|--------|--------|--------|
| Latency | 1200ms | <500ms | ⏳ |
| Success | 78% | >95% | ⏳ |
| Cache Hit | 0% | >60% | ⏳ |
| Memory | 2.1MB | <1.5MB | ⏳ |
| Tests | 666+ passing | 666+ passing | ✅ |

---

## TOOLS & COMMANDS

### Benchmarking
```bash
# Establish baselines
npx tsx benchmarks/establish-baselines.ts

# Run specific benchmark
npx tsx benchmarks/venue-enrichment.bench.ts
npx tsx benchmarks/claude-synthesis.bench.ts
```

### Testing (Keep regression-free)
```bash
# Run all 666+ tests before/after changes
npm run test:unit

# Run specific test file
npm run test:unit -- tests/integration/api/synthesize-sense.test.ts
```

### Profiling
```bash
# Node profiling (CPU)
node --prof app/api/synthesize-sense/route.ts
node --prof-process isolate-*.log > profile.txt

# Memory profiling
npm run debug -- app/api/synthesize-sense/route.ts
```

---

## BEFORE STARTING EACH SPRINT

### Checklist
- [ ] Read sprint-specific guide (e.g., `docs/sprint-1-venue-enrichment.md`)
- [ ] Understand current bottleneck (why this sub-feature first?)
- [ ] Run baselines to document current state
- [ ] Plan optimization approach
- [ ] Ensure all 666+ tests pass (baseline)

### Example for Sprint 1
```bash
# Read the plan
cat docs/sprint-1-venue-enrichment.md

# Run baselines
npx tsx benchmarks/establish-baselines.ts
# Output: 1200ms venue enrichment baseline

# Verify tests pass
npm run test:unit
# All 666+ tests should pass

# Now: Proceed with optimization
```

---

## TROUBLESHOOTING

### Tests Failing After Optimization?
1. Your optimization broke something (revert & try different approach)
2. Test assumptions changed (update test, but verify logic is correct)

```bash
# Run tests with verbose output
npm run test:unit -- --reporter=verbose

# Run single test
npm run test:unit -- tests/integration/api/synthesize-sense.test.ts
```

### Performance Didn't Improve?
1. Bottleneck is elsewhere (profile to find it)
2. Optimization didn't apply (check if code path is actually used)
3. Database/network is bottleneck (not your code)

```bash
# Add timing logs
console.time('venue-search');
const result = await searchWikipedia();
console.timeEnd('venue-search');
```

### Quality Regressed?
1. Run same input before/after
2. Compare outputs
3. Adjust optimization or revert

```bash
// Before optimization
const moment1 = await synthesize({ venue: 'Eiffel Tower' });

// After optimization
const moment2 = await synthesize({ venue: 'Eiffel Tower' });

// Compare narratives, scores, emotion
console.log('Quality match:', JSON.stringify(moment1) === JSON.stringify(moment2));
```

---

## SUCCESS PATTERN

Each sprint should follow this pattern:

```
✅ Baseline established (1200ms)
  ↓
✅ Optimization implemented (parallel calls)
  ↓
✅ Tests still pass (666+)
  ↓
✅ Metrics improved (500ms)
  ↓
✅ Commit with clear message (58% faster)
  ↓
✅ Document pattern for future sprints
  ↓
🎯 Ready for Sprint 2
```

---

## WHEN TO MOVE TO NEXT SPRINT

Only start next sprint when:
- [ ] Performance target achieved (or close)
- [ ] Reliability improved (success rate, error rate)
- [ ] All 666+ tests passing
- [ ] Code is documented
- [ ] Metrics captured in `/docs/performance-metrics.md`
- [ ] Commit message includes before/after numbers

---

## RESOURCES

- 📋 Full Roadmap: `docs/optimization-roadmap.md`
- 📊 Metrics Tracking: `docs/performance-metrics.md`
- 🎯 Sprint 1 Deep-Dive: `docs/sprint-1-venue-enrichment.md`
- 📈 Benchmarks: `benchmarks/*.bench.ts`
- 🧪 Test Suite: 666+ tests in `tests/`

---

## QUICK START (THIS WEEK)

1. **Today:** Read this file + `docs/optimization-roadmap.md`
2. **Tomorrow:** Run `benchmarks/establish-baselines.ts` and document results
3. **Next:** Start Sprint 1 - Venue Enrichment optimization
4. **Commit style:** Use `Performance:` prefix with % improvement

---

**Remember:** You have 666+ tests backing you. Go deep, measure, document, commit. 🚀
