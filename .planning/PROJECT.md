# Sensory Engine MVP Fixes

## What This Is

The Sensory Engine transforms travel moments (photos, voice, venue context) into emotionally resonant narratives with self-learning capabilities. It's a privacy-first system for the Quinn travel app where raw media never leaves the device — only extracted metadata and context are sent to Claude for narrative synthesis. This milestone focuses on fixing critical implementation gaps identified in the PM risk analysis.

## Core Value

Transform raw travel inputs into narratives that capture the *feeling* of a moment — while ensuring photos, voice, and videos never leave the user's device.

## Requirements

### Validated

<!-- Shipped and confirmed working from existing codebase. -->

- ✓ Photo metadata extraction (brightness, saturation, hue analysis) — existing
- ✓ Venue enrichment via Wikipedia API with mock fallback — existing
- ✓ Weather enrichment via OpenWeather API — existing
- ✓ Transcendence scoring with weighted factors — existing (needs calibration)
- ✓ Graceful degradation architecture (external services fail safely) — existing
- ✓ Rate limiting (in-memory, 30 req/min sliding window) — existing
- ✓ Zod schema validation at API boundaries — existing
- ✓ Device capability routing (iOS version detection) — existing (stubbed)
- ✓ Structured JSON telemetry logging — existing

### Active

<!-- P0-P3 fixes for this milestone. -->

**P0 — Critical:**
- [ ] Replace Phi-3 mock with real Claude API call (metadata-only payload, privacy-preserving)
- [ ] Fix isFirstVisit flag (currently hardcoded to true when no session ID)

**P1 — High:**
- [ ] Build NarrativeRatingPrompt feedback UI (1-5 star rating post-synthesis)
- [ ] Setup PostHog analytics (new project, add SDK, wire events)
- [ ] Move Claude model identifier to environment variable

**P2 — Medium:**
- [ ] Enhance photo analysis with EXIF metadata extraction (GPS → location name)
- [ ] Design feedback persistence schema (ratings, edits for self-learning)

**P3 — Low:**
- [ ] Add real voice/audio transcription support (local transcription, keywords to Claude)
- [ ] Implement self-learning weight adjustment based on user feedback

### Out of Scope

<!-- Explicit boundaries for this milestone. -->

- Apple Intelligence SDK integration — not needed with hybrid approach
- Local LLM inference (Phi-3) — replaced by Claude with metadata-only payload
- Full 4-week MVP feature delivery — this is a fix-focused milestone
- Android support — iOS first per product decision
- Sending raw photos/audio to cloud — violates privacy positioning
- User authentication system — not needed for current scope
- Cross-moment pattern learning — defer to v2

## Context

**Privacy Architecture (Hybrid Approach):**
- Raw media (photos, audio, video) → stays on device, never transmitted
- Extracted metadata → sent to Claude for narrative synthesis
  - Photo: brightness, saturation, lighting, colors, scene keywords
  - Audio: sentiment scores, transcribed keywords (not full transcript)
  - Context: location name, weather, time, companion count
- Privacy claim: "Your photos, voice, and videos never leave your device"

**Codebase State:**
- ~80% code coverage of original MVP plan
- Critical paths have stubbed implementations (Phi-3 mock returns random narratives)
- Several hardcoded values affect scoring accuracy (isFirstVisit, intentMatch)
- Wikipedia schema validation bug causes fallback to mock data
- No persistence layer — moments not stored server-side

**Architecture:**
- Next.js App Router with single API endpoint (`POST /api/synthesize-sense`)
- Layers: UI → API Route → Device Capability → Enrichment → Synthesis → Scoring

**Key Files:**
- `app/api/synthesize-sense/route.ts` — main synthesis orchestration
- `lib/phi3Adapter.ts` — currently mocked, will be replaced with Claude call
- `lib/sensoryValidation.ts` — Zod schemas for all data shapes
- `lib/excitementEngine.ts` — transcendence scoring logic
- `app/components/SensoryAgentUI.tsx` — client UI component

## Constraints

- **Privacy**: Raw photos, voice, and videos must never leave the device. Only derived metadata transmitted.
- **Existing stack**: Next.js 14, TypeScript, Zod, Anthropic SDK
- **iOS-first**: Target iPhone A15+ (iOS 15+), Android deferred

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid privacy model | Raw media on-device, metadata to Claude | ✓ Good |
| Claude for narratives | Superior quality vs local LLM, privacy preserved via metadata-only | — Pending |
| PostHog for analytics | Industry standard, privacy-respecting | — Pending |
| Fix-focused milestone | Ship fixes before adding new features | — Pending |

---
*Last updated: 2026-02-16 after initialization*
