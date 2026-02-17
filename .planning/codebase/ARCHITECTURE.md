# Architecture

**Analysis Date:** 2026-02-16

## Pattern Overview

**Overall:** Next.js App Router API + Privacy-First Local-First Processing Pipeline

**Key Characteristics:**
- Single API endpoint (`POST /api/synthesize-sense`) orchestrates all synthesis logic
- Privacy-first design: photos, audio, and voice transcripts never leave the device; only metadata (sentiment scores, keywords, analysis results) is transmitted to the server
- Device-capability routing: iOS devices are routed to local inference (Apple Intelligence, Phi-3) before falling back to cloud (Anthropic Claude)
- Graceful degradation at every layer: if any external service (weather, venue, Claude) fails, the pipeline continues with fallbacks
- Zod schemas serve as the contract between all layers — inputs and outputs are validated at entry and exit points of the API

## Layers

**UI Layer:**
- Purpose: React client component for submitting sensory data and displaying MomentSense results
- Location: `app/components/SensoryAgentUI.tsx`, `app/sense/page.tsx`
- Contains: Client-side form handling, local photo analysis simulation, session ID management, telemetry calls
- Depends on: `lib/telemetry.ts`, `lib/uiComponents.tsx`, `lib/uiTheme.ts`, `lib/sensoryValidation.ts` (types only)
- Used by: Next.js routing via `app/sense/page.tsx`

**API Route Layer:**
- Purpose: Receives, validates, and orchestrates the full synthesis pipeline
- Location: `app/api/synthesize-sense/route.ts`
- Contains: CSRF check, rate limiting, input validation, device routing, parallel data fetching, Claude API call, output assembly, output validation
- Depends on: All `lib/` modules
- Used by: Client UI and external callers (iOS app, demo)

**Device Capability Layer:**
- Purpose: Routes synthesis to the appropriate engine based on client device
- Location: `lib/deviceCapability.ts`, `lib/appleIntelligenceAdapter.ts`, `lib/phi3Adapter.ts`
- Contains: iOS version/chip detection, local synthesis adapters (currently mocked)
- Depends on: `lib/sensoryValidation.ts`
- Used by: `app/api/synthesize-sense/route.ts`

**Enrichment Layer:**
- Purpose: Fetches contextual data from external APIs to enrich synthesis
- Location: `lib/weatherData.ts`, `lib/sensoryData.ts`, `lib/venueCache.ts`
- Contains: OpenWeather API integration, Wikipedia venue enrichment, TTL-based in-memory cache, mock fallbacks
- Depends on: `lib/sensoryValidation.ts` (for OpenWeather/Wikipedia response schemas)
- Used by: `app/api/synthesize-sense/route.ts`

**Synthesis Layer:**
- Purpose: Builds prompts for, calls, and parses responses from Claude (Anthropic)
- Location: `lib/sensoryPrompts.ts`
- Contains: `SENSORY_SYSTEM_PROMPT`, `buildSynthesisPrompt()`, `parseSynthesisResponse()`, `generateFallbackNarrative()`
- Depends on: `lib/sensoryValidation.ts`
- Used by: `app/api/synthesize-sense/route.ts`

**Scoring Layer:**
- Purpose: Computes transcendence and excitement scores to identify highlight moments
- Location: `lib/excitementEngine.ts`
- Contains: `analyzeExcitement()`, `calculateTranscendenceScore()`, `buildTranscendenceFactors()`
- Depends on: `lib/sensoryValidation.ts`, `lib/sensoryData.ts`
- Used by: `app/api/synthesize-sense/route.ts`

**Validation/Schema Layer:**
- Purpose: Single source of truth for all data shapes; Zod schemas for inputs, outputs, enums, and intermediary types
- Location: `lib/sensoryValidation.ts` (primary), `lib/validation.ts` (API utilities)
- Contains: `SensoryInputSchema`, `MomentSenseSchema`, `SynthesisOutputSchema`, all enums (Lighting, Energy, Setting, CrowdFeel, etc.), TRANSCENDENCE_WEIGHTS
- Depends on: `zod`
- Used by: All other lib modules and the API route

**Infrastructure Layer:**
- Purpose: Cross-cutting concerns shared across the pipeline
- Location: `lib/rateLimit.ts`, `lib/telemetry.ts`
- Contains: In-memory rate limiter (30 req/min sliding window), structured JSON logging with sensitive-data redaction, session ID management
- Depends on: Nothing (no external dependencies)
- Used by: `app/api/synthesize-sense/route.ts`, `app/components/SensoryAgentUI.tsx`

**Shared UI Primitives:**
- Purpose: Reusable styled components consistent across Quinn agents
- Location: `lib/uiComponents.tsx`, `lib/uiTheme.ts`
- Contains: Button, Card, Pill, Input, LoadingState, Divider, EmotionTag; THEME, SPACING, BORDER_RADIUS constants
- Depends on: React
- Used by: `app/components/SensoryAgentUI.tsx`

## Data Flow

**Primary Cloud Synthesis Flow (web/desktop):**

1. Client (`SensoryAgentUI.tsx`) performs local photo analysis in-browser (no uploads) and assembles a `SensoryInput` payload (counts, metadata, sentiment scores only)
2. Client POSTs payload to `POST /api/synthesize-sense` with CSRF token and session ID headers
3. Route validates CSRF token via `lib/validation.ts`
4. Route checks rate limit via `lib/rateLimit.ts`
5. Route validates request body against `SensoryInputSchema` (Zod)
6. Route detects device capability (`lib/deviceCapability.ts`) — for web/desktop, device capability is null and falls through
7. Route fetches weather (`lib/weatherData.ts`) and venue enrichment (`lib/sensoryData.ts`) in parallel via `Promise.all()`
8. Route assembles `SynthesisInput` from validated input + enrichment data
9. Route calls Anthropic Claude (`claude-sonnet-4-20250514`) via `lib/sensoryPrompts.ts`
10. Route computes transcendence score via `lib/excitementEngine.ts`
11. Route assembles final `MomentSense` object and validates it against `MomentSenseSchema`
12. Route returns `{ success: true, moment: MomentSense }` to client
13. Client renders results in `SensoryAgentUI.tsx`

**iOS Local Synthesis Flow (Apple Intelligence / Phi-3):**

1. Steps 1–6 same as above
2. Device capability detected as `apple_intelligence` or `phi3_local`
3. Route delegates to `lib/appleIntelligenceAdapter.ts` or `lib/phi3Adapter.ts` — currently mocked, delegates to Phi-3
4. No external Anthropic call is made; local adapter returns `MomentSense` directly
5. Route returns result; cloud enrichment (weather/venue) is skipped in local path

**iOS Queued Synthesis Flow (iOS <15):**

1. Steps 1–6 same as above
2. Device capability detected as `queue_synthesis`
3. Route queues request in IndexedDB (`lib/synthesisQueue.ts`) and returns a degraded 202 response immediately

**State Management:**
- Server-side: All state is request-scoped; rate limit uses in-memory Map (not shared across serverless instances); venue cache uses in-memory singleton with TTL
- Client-side: React `useState` in `SensoryAgentUI.tsx`; session ID persisted in `localStorage` via `lib/telemetry.ts`

## Key Abstractions

**SensoryInput:**
- Purpose: The contract for what the client sends to the API — metadata only, no raw media
- Examples: `lib/sensoryValidation.ts` (SensoryInputSchema), `app/api/synthesize-sense/route.ts`
- Pattern: Zod schema with `safeParse()` for validation at API boundary

**MomentSense:**
- Purpose: The fully assembled output — a rich narrative moment object returned to the client
- Examples: `lib/sensoryValidation.ts` (MomentSenseSchema), `app/api/synthesize-sense/route.ts`
- Pattern: Built step-by-step in the route handler, then validated against MomentSenseSchema before sending

**SynthesisInput / SynthesisOutput:**
- Purpose: Internal types passed between the route and the prompts module; SynthesisInput is what Claude sees
- Examples: `lib/sensoryPrompts.ts`
- Pattern: Plain interfaces (not Zod schemas), used only server-side

**VenueEnrichment:**
- Purpose: Normalized venue data from Wikipedia + mock fallback
- Examples: `lib/sensoryData.ts` (VenueEnrichmentSchema)
- Pattern: Cached in `lib/venueCache.ts` singleton with 5-minute TTL

**ProcessingTier:**
- Purpose: Tracks which synthesis path was used (`full`, `local_only`) for transparency to client
- Examples: `lib/sensoryValidation.ts`, `app/api/synthesize-sense/route.ts`
- Pattern: Enum set during route execution; included in `MomentSense.processing.tier`

**DeviceCapability:**
- Purpose: Classifies iOS device into one of three synthesis paths
- Examples: `lib/deviceCapability.ts`
- Pattern: Pure function returning `"apple_intelligence" | "phi3_local" | "queue_synthesis"`

## Entry Points

**API Endpoint:**
- Location: `app/api/synthesize-sense/route.ts`
- Triggers: HTTP POST from client or external callers
- Responsibilities: Full orchestration of the synthesis pipeline — security, enrichment, AI, scoring, response assembly

**UI Page:**
- Location: `app/sense/page.tsx`
- Triggers: Browser navigation to `/sense`
- Responsibilities: Renders `SensoryAgentUI` client component

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: All page renders
- Responsibilities: Provides `<html>` and `<body>` wrappers (minimal; no providers yet)

## Error Handling

**Strategy:** Graceful degradation with structured error codes

**Patterns:**
- CSRF failure → 403 with `CSRF_INVALID` code, logged via `logServerEvent`
- Rate limit exceeded → 429 with `RATE_LIMITED` code and `X-RateLimit-*` headers
- Invalid request body → 400 with `VALIDATION_ERROR` code and Zod error details
- External service failure (weather, venue, Claude) → caught per-service; pipeline continues with null/mock data
- Output validation failure → 500 with `SYNTHESIS_FAILED` code; invalid data is never returned to client
- All errors use `buildErrorResponse()` from `lib/validation.ts` for consistent shape: `{ success: false, error, code, requestId }`
- All error codes typed as enum in `lib/validation.ts`: `VALIDATION_ERROR | RATE_LIMITED | CSRF_INVALID | SYNTHESIS_FAILED | EXTERNAL_API_ERROR | INTERNAL_ERROR`

## Cross-Cutting Concerns

**Logging:** Structured JSON via `lib/telemetry.ts`; `logServerEvent(level, message, data)` used throughout route handler; sensitive field values (API keys, tokens) are automatically redacted; stack traces only in development

**Validation:** Zod schemas in `lib/sensoryValidation.ts` and `lib/validation.ts`; `safeParse()` used at API boundary (not `parse()`) to avoid unhandled throws; output also validated before sending

**Authentication:** No user authentication implemented; request identity for rate limiting is derived from `X-Api-Key` header > `X-User-ID` header > `X-Forwarded-For` IP (see `lib/validation.ts` `getRequestIdentifier()`)

**CSRF:** Origin-based check + optional `X-CSRF-Token` header; allowed origins configured via `ALLOWED_ORIGINS` env var; implementation has a noted TODO for server-side token store

**Caching:** Venue enrichment cached in-memory via `lib/venueCache.ts` singleton (5-min TTL, 30-sec cleanup); rate limit state in-memory Map in `lib/rateLimit.ts`; no Redis or distributed cache

---

*Architecture analysis: 2026-02-16*
