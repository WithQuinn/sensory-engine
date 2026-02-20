# Sensory Engine Development Workspace

## Project Overview

The Sensory Engine transforms travel photos, voice notes, and context into rich, emotionally resonant memories. Part of the **Quinn** travel experience platform.

**Current Status:** Phase 1 Production-Ready (68% complete, 0 blockers)
**Test Coverage:** 318 automated tests (254 unit + 64 integration)
**Performance:** Venue enrichment optimized (50% faster, 1201ms → 600-800ms)

## Project Structure

```
sensory-engine/
├── lib/                         # Core business logic
│   ├── sensoryValidation.ts     # Zod schemas (single source of truth)
│   ├── sensoryData.ts           # Wikipedia enrichment + caching
│   ├── sensoryPrompts.ts        # Claude synthesis prompts
│   ├── weatherData.ts           # OpenWeather integration
│   ├── excitementEngine.ts      # Fame + transcendence scoring
│   ├── audioProcessing.ts       # Audio analysis utilities
│   ├── rateLimit.ts             # 30 req/min rate limiting
│   ├── telemetry.ts             # Structured logging with PII redaction
│   ├── validation.ts            # CSRF validation, error builders
│   └── venueCache.ts            # TTL-based in-memory cache
├── app/
│   ├── api/
│   │   └── synthesize-sense/    # Main synthesis endpoint
│   │       └── route.ts         # API handler with CSRF protection
│   ├── components/
│   │   ├── SensoryAgentUI.tsx   # Main React UI component
│   │   └── NarrativeRatingPrompt.tsx  # Quality feedback UI
│   └── sense/
│       └── page.tsx             # Route page
├── tests/
│   ├── unit/                    # 254 unit tests
│   │   └── lib/                 # Core logic tests
│   └── integration/             # 64 integration tests
│       └── api/                 # API endpoint tests
├── docs/
│   ├── sensory-agent-user-story.md     # Product requirements
│   ├── sensory-agent-epics.md          # Feature breakdown
│   ├── performance-metrics.md          # Baseline tracking
│   └── sprint-1-venue-enrichment.md    # Sprint deep-dive
├── benchmarks/
│   └── establish-baselines.ts   # Performance measurement script
├── PHASE-1-ROADMAP.md           # Production readiness tracker
├── DEPLOYMENT.md                # Vercel deployment guide
├── OPTIMIZATION-WORKFLOW.md     # Development methodology
├── ERROR-CLASSIFICATION.md      # Error handling guide
├── TELEMETRY-TAXONOMY.md        # PostHog event definitions
└── PERFORMANCE-BASELINES.md     # Performance targets

```

## Release Notes

After completing a development session or major deliverable, create release notes in **two categories**:

### Two Types of Release Notes

**1. Customer-Facing** — `docs/release_notes/customer/YYYY-MM-DD.md`
- What users can see, feel, or benefit from
- Frame in terms of user value, not technical implementation
- Examples: faster synthesis, better memories, improved UX, bug fixes users would notice

**2. Internal** — `docs/release_notes/internal/YYYY-MM-DD.md`
- Infra, CI/CD, testing, monitoring, planning, refactoring, tooling, docs
- Anything that doesn't directly change the user experience
- Examples: added contract tests, updated CI pipeline, refactored API layer, added telemetry

### Rules

1. **One file per type per day** — If multiple updates happen on the same day (even across contributors), merge them into the same file. Append new sections, don't create a second file.
2. **File name is just the date** — `YYYY-MM-DD.md` (no topic slug). The date IS the identifier.
3. **A session may produce both types** — e.g., a performance optimization goes in `customer/` (users feel it) and the contract tests added alongside go in `internal/`.
4. **If a change spans both** — Put the user-facing impact in `customer/`, the technical details in `internal/`. Don't duplicate.

### Customer Release Note Guidelines

**Before writing, answer:**
1. What problem does this solve for users?
2. How does this improve their experience?
3. What can users do now that they couldn't before?

**If unclear, ASK before writing.**

| Technical Change | Customer Value Framing |
|-----------------|------------------------|
| "Added venue enrichment caching" | "Famous landmarks now load instantly—no waiting for Wikipedia" |
| "Implemented CSRF protection" | "Enhanced security protection for your memories" |
| "Refactored synthesis prompts" | "More emotionally accurate memories with better detail" |
| "Optimized photo processing" | "50-photo batches process 2x faster" |

### Internal Release Note Guidelines

Focus on:
- What changed and why
- Impact on developer workflow, reliability, or cost
- Decisions made and alternatives considered
- Links to issues/PRs

**This applies to all contributors** (developers, AI assistants, product team).

## API Development Pattern

When creating or modifying API routes, follow this pattern to ensure type safety:

1. **Define schemas in `lib/sensoryValidation.ts`** - request AND response schemas using Zod
2. **API route imports from sensoryValidation.ts** - validate input with `schema.safeParse()`
3. **Components import types from sensoryValidation.ts** - never define inline interfaces for API data
4. **Mock fixtures must be schema-validated** - use `schema.parse()` in test fixtures

### Example
```typescript
// lib/sensoryValidation.ts
export const SynthesisRequestSchema = z.object({
  venue: z.object({
    name: z.string(),
    destination: z.string().optional(),
  }).optional(),
  photos: z.array(PhotoSchema).optional(),
});
export type SynthesisRequest = z.infer<typeof SynthesisRequestSchema>;

// app/api/synthesize-sense/route.ts
import { SynthesisRequestSchema } from '@/lib/sensoryValidation';
const validation = SynthesisRequestSchema.safeParse(data);

// app/components/SensoryAgentUI.tsx
import type { SynthesisRequest } from '@/lib/sensoryValidation';

// tests/fixtures/api-fixtures.ts
import { SynthesisRequestSchema } from '@/lib/sensoryValidation';
export const mockRequest = SynthesisRequestSchema.parse({ ... }); // Fails at test startup if wrong
```

### Why This Matters
- **Type mismatches caught at compile time** - API returns `emotions: string[]` but component expects `emotions: string`? TypeScript error.
- **Mock drift detected immediately** - Test fixtures validated against schemas fail fast if shape is wrong.
- **Single source of truth** - No duplicate interface definitions across files.

## Definition of Done (Feature Checklist)

Every feature or PR must satisfy:

### Core (all changes)
- [ ] Telemetry coverage (anonymous PostHog events for new interactions)
- [ ] Security non-regression (no new PII, input validation, rate limiting)
- [ ] Test coverage (unit + integration, 70% line / 60% branch)
- [ ] Type check passes (`npm run type-check`)
- [ ] Pre-commit hook passes (no secrets, tests pass, type-check clean)

### UI Changes
- [ ] Loading state shown for all async operations > 500ms
- [ ] Tested at mobile viewport (375px width)
- [ ] Feature purpose clear without developer explanation
- [ ] Fallback/error states produce distinct, reasonable output
- [ ] Screenshots captured at desktop + mobile for PR review

### API Changes
- [ ] Error messages don't leak internal details
- [ ] Response schemas defined in `lib/sensoryValidation.ts`
- [ ] External API responses validated with Zod (OpenWeather, Wikipedia, Claude)
- [ ] Rate limiting enforced (30 req/min default)
- [ ] CSRF protection in place (origin validation)

### Model Changes

**CRITICAL:** Contract tests MUST pass before deploying model switches.

- [ ] **Contract tests run** - `npm run test:contract` passes with real API
- [ ] **Model documented** - Update API route comments with new model name
- [ ] **Token limits verified** - New model can handle max expected response size
- [ ] **Cost impact assessed** - Is the new model cost-effective for this endpoint?

**When required:**
- Switching Claude models (Sonnet ↔ Haiku, version upgrades)
- Changing prompt structure significantly
- Upgrading `@anthropic-ai/sdk` package

**Why this matters:** Integration tests mock the API and won't catch model incompatibility. The 2026-02-08 Haiku incident in Travel repo showed all tests can pass while production returns 500 errors.

**See:** `tests/contract/README.md` for contract testing guide (TO BE CREATED)

### Performance/UX Testing

**CRITICAL:** Test BOTH typical AND edge-case journeys.

- [ ] **Typical journey** - Tested with full input (venue + photos + audio)
- [ ] **Minimal journey** - Tested with venue only (no photos, no audio)
- [ ] **Performance targets met** - See `PERFORMANCE-BASELINES.md` for benchmarks
- [ ] **Edge cases covered** - No venue, 50+ photos, long audio notes

**Why this matters:** Different input types trigger different code paths (synthesis vs enrichment vs fallback). Optimizing one flow doesn't optimize the others. Always test both paths.

**See:** `PERFORMANCE-BASELINES.md` for target metrics

### Third-Party Integrations

**CRITICAL:** Every external service must be reviewed for privacy implications.

- [ ] **Privacy impact assessed** - Complete third-party security checklist (see below)
- [ ] **Privacy controls enabled** - Verify default config doesn't violate Quinn principles:
  - [ ] No Session Replay or similar recording features
  - [ ] No console log capture (may contain venue names, destinations)
  - [ ] IP collection disabled (`sendDefaultPii: false` or equivalent)
  - [ ] `beforeSend` or equivalent hook to strip PII from error reports
- [ ] **Data flow documented** - What data goes where? Retention policy?
- [ ] **Secrets in environment variables** - No hardcoded API keys, DSNs, or tokens

**Current External Services:**
- ✅ **Claude API** (Anthropic) - Synthesis generation
- ✅ **Wikipedia API** - Venue enrichment
- ✅ **OpenWeather API** - Weather data
- ✅ **PostHog** - Anonymous telemetry

**See:** Travel repo's `docs/THIRD_PARTY_SECURITY_CHECKLIST.md` for full checklist

**Why this matters:** The Sentry incident in Travel repo showed that even well-known services can violate privacy principles if defaults are accepted uncritically. Session Replay was recording user itinerary text in violation of "delete user data immediately" principle.

### Automated Enforcement (Pre-commit Hook)

**All commits are automatically blocked unless:**
- ✅ No secrets detected (API keys, tokens)
- ✅ Type check passes (`npm run type-check`)
- ✅ Unit tests pass (`npm run test:unit`)

This is enforced by pre-commit hook - you cannot commit broken code.

**To bypass in emergency:** `git commit --no-verify` (use sparingly!)

## Performance Optimization Workflow

Sensory Engine uses **depth-first, measurement-driven optimization**:

### 5-Day Sprint Cycle

```
Day 1: Choose & Baseline
  ↓
Day 2-3: Code Optimization
  ↓
Day 4: Measure & Validate
  ↓
Day 5: Document & Commit
```

### Commit Message Format

```
Performance: [change description] ([% improvement], [old] → [new])

- Optimization detail 1
- Optimization detail 2

Benchmarks:
  Before: 1200ms
  After:  500ms

Tests: ✅ All 318 tests passing
```

### Current Sprint Status

**Sprint 1: Venue Enrichment** ✅ **COMPLETE**
- Parallelization: 50% faster (1201ms → 600-800ms)
- Caching: 24-hour TTL, 95%+ success rate
- Multi-strategy fallback

**Sprint 2: Claude Synthesis** ⏳ **QUEUED**
**Sprint 3: Photo Processing** ⏳ **QUEUED**
**Sprint 4: Transcendence Scoring** ⏳ **QUEUED**
**Sprint 5: UI Performance** ⏳ **QUEUED**

**See:** `OPTIMIZATION-WORKFLOW.md` for complete methodology

## Performance Targets

| Component | Baseline | Target | Status |
|-----------|----------|--------|--------|
| Venue Enrichment | 1201ms | 500ms | 🎯 50% achieved |
| Claude Synthesis | 2801ms | 1800ms | ⏳ Queued |
| Photo Batch (50) | 1546ms | 1200ms | ⏳ Queued |
| UI/FCP | TBD | <1000ms | ⏳ Queued |
| **Overall** | **~6500ms** | **<4300ms** | 🎯 34% target |

## Testing Strategy

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

# Type checking
npm run type-check
```

### Test Coverage

- **Unit Tests:** 254 tests for all lib modules
- **Integration Tests:** 64 API endpoint tests with mocked Wikipedia/OpenWeather/Claude
- **E2E Tests:** ⏳ TODO - Full user journey scenarios
- **Contract Tests:** ⏳ TODO - Real API validation (optional)

### Pre-Commit Hook

Automatic security + test validation before each commit:

```
✅ No hardcoded secrets detected
✅ Type check passing
✅ All unit tests passing
```

## Key GitHub Issues

- **Issue #69** - Production Readiness ✅ **COMPLETE** (Feb 12, 2026)
  - All core infrastructure files created
  - CSRF protection implemented
  - Integration testing (12 scenarios)
  - Structured logging with PII redaction
  - Venue caching with TTL
  - Performance baselines established

**See:** `ISSUE_69_UPDATE.md` for full details

## Recent Work

### Session: February 18, 2026

**Objective:** Verify production readiness and create deployment guide

**Completed:**
1. ✅ Verified all critical blockers resolved (C1, C2, C3)
2. ✅ Confirmed Zod validation for all external APIs
3. ✅ Created `DEPLOYMENT.md` with Vercel deployment instructions
4. ✅ Updated `PHASE-1-ROADMAP.md` with accurate completion status
5. ✅ Identified optional quality improvements (H2, H6, M2, L1-L3)

**Status:** ✅ **PRODUCTION-READY** (0 deployment blockers)

**Next Steps:**
- Deploy to Vercel staging
- Complete optional quality improvements (10-16 hours)
- Start Sprint 2: Claude Synthesis optimization

### Session: February 12, 2026 (Issue #69)

**Objective:** Resolve all critical production blockers

**Completed:**
1. ✅ Created missing lib files (`rateLimit.ts`, `telemetry.ts`, `validation.ts`)
2. ✅ Implemented CSRF protection in API route
3. ✅ Added integration testing (12 scenarios: timeout, concurrent, failures)
4. ✅ Structured logging with PII redaction
5. ✅ Venue caching with TTL and auto-cleanup
6. ✅ Error classification system documented
7. ✅ Performance baselines established
8. ✅ Telemetry taxonomy defined (15+ events)
9. ✅ API parallelization (33% latency reduction)

**Test Results:** 318 tests passing (254 unit + 64 integration)

**Files Modified:**
- `lib/rateLimit.ts` - New (108 LOC)
- `lib/telemetry.ts` - New (207 LOC)
- `lib/validation.ts` - New (167 LOC)
- `lib/venueCache.ts` - New (TTL-based caching)
- `app/api/synthesize-sense/route.ts` - CSRF + rate limiting
- `ERROR-CLASSIFICATION.md` - New documentation
- `PERFORMANCE-BASELINES.md` - New documentation
- `TELEMETRY-TAXONOMY.md` - New documentation

## Environment Variables

### Required Variables

```bash
# Claude API Configuration
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx
CLAUDE_MODEL=claude-sonnet-4-20250514

# Weather API Configuration
OPENWEATHER_API_KEY=your_openweather_api_key_here

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# CSRF Protection
ALLOWED_ORIGINS=https://your-deployment-url.vercel.app,http://localhost:3000
```

### Optional Variables

```bash
# Rate Limiting (testing only)
RATE_LIMIT_BYPASS_TOKEN=

# CSRF Token Secret (optional)
CSRF_SECRET=your-secret-key-here

# Environment
NODE_ENV=production
```

**See:** `.env.example` for complete reference

## Deployment

### Quick Deploy to Vercel

```bash
# Login to Vercel (one-time setup)
npx vercel login

# Deploy (from project root)
cd /Users/sachinverma/Downloads/Quinn/Sensory-Engine
npx vercel

# Production deployment
npx vercel --prod
```

**See:** `DEPLOYMENT.md` for complete deployment guide

### Deployment Checklist

- [ ] All environment variables configured in Vercel
- [ ] ALLOWED_ORIGINS includes production domain
- [ ] PostHog project created and KEY configured
- [ ] OpenWeather API key has sufficient quota
- [ ] Claude API key has billing configured
- [ ] Monitoring/alerts set up (Vercel dashboard)

## Key URLs

- **GitHub:** https://github.com/WithQuinn/sensory-engine
- **Vercel:** TBD (pending first deployment)
- **PostHog Dashboard:** TBD (pending configuration)
- **Related Repo:** [Quinn Travel (Fact Agent)](https://github.com/WithQuinn/travel)

## Development Principles

### Quinn Privacy Promise

Every external service must align with Quinn's privacy principles:

1. **Delete itinerary text immediately after parsing** - No user content stored in external services
2. **Log only anonymous telemetry** - Session IDs only, no user IDs
3. **No user IDs, device identifiers, or IP addresses** - Privacy-first by default
4. **Privacy is a brand differentiator** - When in doubt, choose privacy over convenience

### Optimization Philosophy

1. **Measure before optimizing** - Establish baselines with `benchmarks/establish-baselines.ts`
2. **Depth-first, not breadth-first** - Fully optimize one component before moving to next
3. **Document trade-offs** - Every optimization has costs, document them
4. **Test coverage first** - Never optimize untested code
5. **User value over benchmarks** - 500ms improvement users feel > 50ms they don't

## Architecture Decisions

### Why On-Device Processing (Future)

v1 uses cloud processing (Claude API) for synthesis. Future versions will move to on-device:
- **Privacy:** No user data leaves device
- **Speed:** No network latency
- **Cost:** No API costs per synthesis
- **Offline:** Works without internet

Current cloud approach allows us to:
- Iterate on prompt engineering quickly
- Use state-of-art models (Claude Sonnet 4)
- Gather quality feedback to train on-device models

### Why Wikipedia for Venue Enrichment

Alternatives considered:
- **Google Places API:** Rich data but requires Places API credits, quota limits
- **Wikidata:** More structured but harder to parse, less rich descriptions
- **Wikipedia:** Free, rich descriptions, good for "transcendence" (fame) scoring

Trade-offs:
- ✅ Free, no API limits
- ✅ Rich historical/cultural context
- ⚠️ 67% → 95% success rate (after multi-strategy fallback)
- ⚠️ No real-time data (hours, reviews)

### Why PostHog for Telemetry

Alternatives considered:
- **Google Analytics:** Privacy concerns, overkill for MVP
- **Mixpanel:** Expensive, complex setup
- **PostHog:** Open-source, privacy-friendly, self-hostable

Configuration:
- `autocapture: false` - Only track explicit events
- No PII in event properties
- Anonymous session IDs only
- 90-day retention, can be deleted on request

## Documentation

- **README.md** - Project overview and quick start
- **PHASE-1-ROADMAP.md** - Production readiness tracker
- **DEPLOYMENT.md** - Vercel deployment guide
- **OPTIMIZATION-WORKFLOW.md** - Development methodology
- **ERROR-CLASSIFICATION.md** - Error handling guide
- **TELEMETRY-TAXONOMY.md** - PostHog event definitions
- **PERFORMANCE-BASELINES.md** - Performance targets
- **CONTRIBUTING.md** - How to contribute
- **SEPARATION.md** - Why Sensory Engine is separate from Travel repo
- **docs/sensory-agent-user-story.md** - Product requirements
- **docs/sensory-agent-epics.md** - Feature breakdown
- **docs/sprint-1-venue-enrichment.md** - Sprint 1 deep-dive

## Related Repositories

- **[Quinn Travel](https://github.com/WithQuinn/travel)** - Main Fact Agent platform (itinerary parsing, venue suggestions)
- **Sensory Engine** ← You are here (photo/audio synthesis into memories)

### Integration Points

Sensory Engine will eventually merge back into Travel repo when:
1. ✅ Production-ready (COMPLETE)
2. ✅ Security audit passed (COMPLETE)
3. ⏳ Sprint 2-5 optimizations complete (OPTIONAL)
4. ⏳ User feedback incorporated

**See:** `SEPARATION.md` for why we developed separately

## Questions or Need Help?

- **Documentation:** Check `docs/` directory
- **Performance:** See `OPTIMIZATION-WORKFLOW.md`
- **Deployment:** See `DEPLOYMENT.md`
- **Issues:** Open an issue on GitHub
- **Security:** Review `ERROR-CLASSIFICATION.md` and third-party security checklist

---

Built with 💜 for emotional, sensory-rich travel memories.

**Last Updated:** February 20, 2026
**Production Status:** ✅ Ready to Deploy
**Current Phase:** Phase 1 Complete (68%), Phase 2 Queued
