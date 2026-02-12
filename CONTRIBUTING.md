# Contributing to Sensory Engine

## Development Workflow

Sensory Engine uses **depth-first, measurement-driven optimization**. See `OPTIMIZATION-WORKFLOW.md` for the complete development methodology.

### Quick Start

1. **Clone and setup:**
   ```bash
   git clone https://github.com/WithQuinn/sensory-engine.git
   cd sensory-engine
   npm install
   ```

2. **Choose a sprint:**
   - Sprint 1: Venue Enrichment ✅ COMPLETE
   - Sprint 2: Claude Synthesis (queued)
   - Sprint 3: Photo Processing (queued)
   - Sprint 4: Transcendence Scoring (queued)
   - Sprint 5: UI Performance (queued)

3. **Follow the 5-day cycle:**
   - Day 1: Establish baseline
   - Day 2-3: Implement optimization
   - Day 4: Measure improvement
   - Day 5: Document & commit

## Commit Message Format

Use the performance-focused commit style:

```
Performance: [change description] ([% improvement], [old] → [new])

- Optimization detail 1
- Optimization detail 2
- Any architectural notes

Benchmarks:
  Before: [old metric]
  After:  [new metric]

Tests: ✅ All 666 tests passing
```

### Examples

```
Performance: Parallelize Wikipedia API calls (50% faster, 1200ms → 600ms)
Performance: Add venue enrichment caching (95%+ success rate, was 67%)
Performance: Optimize photo batch processing (52% faster, 50 photos)
```

## Testing Requirements

All changes must pass:

```bash
# Run all tests
npm run test:unit

# Type checking
npm run type-check

# Security checks (pre-commit hook)
# - No hardcoded secrets
# - Type validation
# - Test validation
```

### Writing Tests

1. **Unit tests** for individual functions
2. **Integration tests** for API endpoints
3. **E2E tests** for user journeys

See `tests/` directory for examples.

## Performance Benchmarking

Run baseline measurements before and after optimizations:

```bash
npx tsx benchmarks/establish-baselines.ts
```

Record results in `docs/performance-metrics.md`.

## Code Style

- **TypeScript strict mode** - No `any` types
- **Zod schemas** for all I/O - Define in `lib/sensoryValidation.ts`
- **Comments for non-obvious logic** - Avoid redundant comments
- **Error handling** - Graceful fallbacks with meaningful messages

## Before Submitting

- [ ] All tests pass (`npm run test:unit`)
- [ ] Type check passes (`npm run type-check`)
- [ ] Benchmarks measured and documented
- [ ] Performance metrics updated
- [ ] Commit message follows format
- [ ] No hardcoded secrets or API keys

## Questions?

See:
- `README.md` — Architecture overview
- `OPTIMIZATION-WORKFLOW.md` — Development methodology
- `docs/` — Sprint guides and strategy docs

---

Questions or need help? Open an issue or reach out to the Quinn team.
