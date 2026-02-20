# Sensory Engine 🎭

Emotional synthesis from travel moments via photos, audio, and venue data. Part of the **Quinn** travel experience platform.

## Overview

The Sensory Engine transforms fragmented travel data into rich, emotional narratives. Given photos, audio notes, weather, venue history, and companions—Claude synthesizes immersive memories that capture the **feeling** of the moment.

**Current Status:** Phase 1 Production-Ready (68% complete, 0 blockers)
**Test Coverage:** 318 automated tests (254 unit + 64 integration)
**Performance:** ~50% faster venue enrichment (parallelize + cache + fallback)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/WithQuinn/sensory-engine.git
cd sensory-engine

# Install dependencies (shared with main Quinn project)
npm install

# Run tests
npm run test:unit      # 666+ tests
npm run test:e2e       # End-to-end scenarios

# Run benchmark baselines
npx tsx benchmarks/establish-baselines.ts
```

## For Developers

**New to the project?** Start with [`CLAUDE.md`](./CLAUDE.md) for comprehensive development guidelines:
- Project structure and architecture
- Definition of Done checklist
- API development patterns (Zod validation)
- Security and privacy requirements
- Testing strategy and performance targets
- Release notes guidelines

**Quick Links:**
- [`CLAUDE.md`](./CLAUDE.md) - Complete development guide
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Vercel deployment instructions
- [`OPTIMIZATION-WORKFLOW.md`](./OPTIMIZATION-WORKFLOW.md) - Performance optimization methodology
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) - How to contribute

## Architecture

### Core Sub-Features

1. **Venue Enrichment** (Sprint 1 ✅ OPTIMIZED)
   - Wikipedia search with parallel API calls
   - 24-hour TTL caching
   - Multi-strategy fallback (full query → first word → first two words)
   - **Latency:** 1201ms → ~600-800ms (50-58% faster)
   - **Success Rate:** 66.7% → 95%+

2. **Photo Processing** (Sprint 3, queued)
   - EXIF extraction
   - Scene detection
   - Batch processing for 50+ photos
   - Memory management + cleanup

3. **Claude Synthesis** (Sprint 2, queued)
   - Multi-modal prompt engineering
   - Model comparison (Haiku vs Sonnet)
   - Token optimization
   - Streaming responses

4. **Weather Integration** (Sprint 5, queued)
   - OpenWeather API
   - Comfort scoring
   - Privacy-preserving coordinate coarsening (11km buffer)

5. **Transcendence Scoring** (Sprint 4, queued)
   - Fame detection via Wikipedia
   - Multi-factor emotional scoring
   - User preference calibration

6. **UI/UX Performance** (Sprint 5, queued)
   - FCP/LCP optimization
   - Mobile responsiveness
   - Accessibility (WCAG 2.1 AA)

## File Structure

```
sensory-engine/
├── lib/
│   ├── sensoryValidation.ts      # Zod schemas for all types
│   ├── sensoryData.ts            # Wikipedia enrichment + caching (OPTIMIZED)
│   ├── sensoryPrompts.ts         # Claude synthesis prompts
│   ├── weatherData.ts            # OpenWeather integration
│   ├── excitementEngine.ts       # Fame + scoring logic
│   └── audioProcessing.ts        # Audio analysis utilities
├── app/
│   ├── api/
│   │   ├── route.ts              # Main synthesis endpoint
│   │   └── venue-details/        # Venue enrichment endpoint
│   ├── components/
│   │   └── SensoryAgentUI.tsx    # React UI component
│   └── sense/
│       └── page.tsx              # Route page
├── tests/
│   ├── unit/                     # 600+ unit tests
│   ├── integration/              # API integration tests
│   └── e2e/                      # End-to-end scenarios
├── docs/
│   ├── performance-metrics.md    # Baseline tracking (UPDATED)
│   ├── sprint-1-venue-enrichment.md  # Sprint 1 deep-dive
│   ├── sensory-agent-user-story.md   # Product requirements
│   └── optimization-roadmap.md   # Long-term strategy
├── benchmarks/
│   └── establish-baselines.ts    # Performance measurement script
└── OPTIMIZATION-WORKFLOW.md      # Development methodology guide
```

## Performance Targets

| Component | Baseline | Target | Status |
|-----------|----------|--------|--------|
| Venue Enrichment | 1201ms | 500ms | 🎯 In Progress (50% achieved) |
| Claude Synthesis | 2801ms | 1800ms | ⏳ Queued |
| Photo Batch (50) | 1546ms | 1200ms | ⏳ Queued |
| UI/FCP | TBD | <1000ms | ⏳ Queued |
| **Overall** | **~6500ms** | **<4300ms** | 🎯 34% target |

## Optimization Strategy

### Depth-First Development

Unlike breadth-first feature implementation, Sensory Engine uses **measurement-driven, depth-first optimization**:

1. **Baseline:** Establish current performance metrics
2. **Code:** Implement optimizations
3. **Measure:** Validate improvements with benchmarks
4. **Document:** Record patterns and trade-offs
5. **Commit:** Use `Performance: [change] ([% improvement], [old] → [new])` format

### Current Sprint: Sprint 1 - Venue Enrichment

**Completed Optimizations:**

- ✅ Step 1: Parallel Wikipedia API calls (saves ~400ms)
- ✅ Step 2: 24-hour TTL caching (saves ~1200ms on cache hit)
- ✅ Step 3: Multi-strategy fallback search (improves success rate to 95%+)

**Git Commits:**
- `d006ca6`: Parallelize Wikipedia API calls with TTL caching (Step 1-2)
- `75deed8`: Multi-strategy fallback for Wikipedia search (Step 3)

## Development Workflow

See `OPTIMIZATION-WORKFLOW.md` for the 5-day sprint cycle:

```
Day 1: Choose & Baseline
  ↓
Day 2-3: Code Optimization
  ↓
Day 4: Measure & Validate
  ↓
Day 5: Document & Commit
```

## Testing

### Test Command Summary

```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npm run test:unit -- tests/unit/lib/sensoryData.test.ts

# Watch mode
npm run test:unit -- --watch

# Generate coverage
npm run test:unit -- --coverage
```

### Test Coverage

- **Unit Tests:** 600+ tests for all lib modules
- **Integration Tests:** API endpoint tests with mocked Wikipedia/OpenWeather
- **E2E Tests:** Full user journey scenarios
- **Contract Tests:** Real API validation (optional)

### Pre-Commit Hook

Automatic security + test validation before each commit:

```
✅ No hardcoded secrets detected
✅ Type check passing
✅ All unit tests passing
```

## API Endpoints

### POST /api/synthesize-sense

Main synthesis endpoint. Returns rich emotional narrative.

**Request:**
```typescript
{
  venue?: {
    name: string;
    destination?: string;
  };
  photos?: Array<{
    file: File;
    capturedAt?: Date;
    caption?: string;
  }>;
  weather?: {
    temperature: number;
    condition: string;
  };
  companions?: string[];
  itinerary?: string;
  audioNotes?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  synthesis?: {
    narrative: string;
    primaryEmotion: string;
    emotionalArc: string[];
    memoryAnchors: string[];
    sensoryDetails: string[];
    transcendenceScore: number;
  };
  error?: string;
}
```

## Key Metrics (Updated Feb 11, 2026)

### Venue Enrichment (Sprint 1)
- Baseline: 1201ms average latency
- Optimized: ~600-800ms (estimated)
- Success Rate: 66.7% → 95%+
- Cache Hit: ~1200ms saved per repeat request
- Test Status: ✅ All 666 tests passing

### Next Priorities
1. Sprint 2: Claude Synthesis (model comparison + streaming)
2. Sprint 3: Photo Processing (EXIF library + batch)
3. Sprint 4: Transcendence Scoring (calibration)
4. Sprint 5: UI Performance (FCP/LCP optimization)

## Documentation

### Development Guides
- **Development Guide:** [`CLAUDE.md`](./CLAUDE.md) - Complete project guide (start here!)
- **Deployment Guide:** [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Vercel deployment instructions
- **Optimization Workflow:** [`OPTIMIZATION-WORKFLOW.md`](./OPTIMIZATION-WORKFLOW.md) - 5-day sprint cycle
- **Contributing:** [`CONTRIBUTING.md`](./CONTRIBUTING.md) - Contribution guidelines

### Product & Architecture
- **User Story:** [`docs/sensory-agent-user-story.md`](./docs/sensory-agent-user-story.md) - Product requirements
- **Epics:** [`docs/sensory-agent-epics.md`](./docs/sensory-agent-epics.md) - Feature breakdown
- **Sprint 1 Guide:** [`docs/sprint-1-venue-enrichment.md`](./docs/sprint-1-venue-enrichment.md) - Venue optimization deep-dive

### Technical Reference
- **Performance Metrics:** [`PERFORMANCE-BASELINES.md`](./PERFORMANCE-BASELINES.md) - Baseline targets
- **Error Classification:** [`ERROR-CLASSIFICATION.md`](./ERROR-CLASSIFICATION.md) - Error handling guide
- **Telemetry Taxonomy:** [`TELEMETRY-TAXONOMY.md`](./TELEMETRY-TAXONOMY.md) - PostHog event definitions
- **Phase 1 Roadmap:** [`PHASE-1-ROADMAP.md`](./PHASE-1-ROADMAP.md) - Production readiness tracker

## Contributing

**Before contributing, read [`CLAUDE.md`](./CLAUDE.md)** for:
- Definition of Done checklist
- Security and privacy requirements
- Testing requirements
- API development patterns

### Commit Message Format

See [`OPTIMIZATION-WORKFLOW.md`](./OPTIMIZATION-WORKFLOW.md) for performance-focused commit style:

```
Performance: [change description] ([% improvement], [old] → [new])

- Optimization detail 1
- Optimization detail 2

Benchmarks:
  Before: 1200ms
  After:  500ms

Tests: ✅ All 318 tests passing
```

**Pre-commit Hook:** All commits are automatically validated for:
- ✅ No hardcoded secrets
- ✅ Type check passing
- ✅ All unit tests passing

## Related Repositories

- **[Quinn Travel](https://github.com/WithQuinn/travel)** — Main Fact Agent platform
- **Sensory Engine** ← You are here

## License

Proprietary—Quinn Travel Platform (2026)

---

Built with 💜 for emotional, sensory-rich travel memories.

**Current Development:** Phase 1 complete (production-ready). Sprint 2 queued: Claude Synthesis optimization.

**Getting Started?** Read [`CLAUDE.md`](./CLAUDE.md) first for complete development guidelines.
