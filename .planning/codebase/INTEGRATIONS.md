# External Integrations

**Analysis Date:** 2026-02-16

## APIs & External Services

**AI Synthesis:**
- Anthropic Claude (claude-sonnet-4-20250514) - Core narrative synthesis; generates emotional travel narratives from metadata
  - SDK/Client: `@anthropic-ai/sdk` ^0.24.0
  - Auth: `ANTHROPIC_API_KEY` env var
  - Usage: `app/api/synthesize-sense/route.ts` lines 320-347
  - Model: `claude-sonnet-4-20250514` (hardcoded in route, overridable via `CLAUDE_MODEL` env var)
  - Parameters: `max_tokens: 2000`, uses system prompt from `lib/sensoryPrompts.ts`
  - Fallback: `generateFallbackNarrative()` in `lib/sensoryPrompts.ts` when API unavailable

**Weather Data:**
- OpenWeatherMap API (`https://api.openweathermap.org/data/2.5/weather`) - Current weather at venue coordinates
  - SDK/Client: Native `fetch` in `lib/weatherData.ts`
  - Auth: `OPENWEATHER_API_KEY` env var
  - Privacy: Coordinates are coarsened to 0.1 degree (~11km precision) before sending; no user IDs transmitted
  - Timeout: 10 seconds (`AbortSignal.timeout(10000)`)
  - Fallback: Graceful skip; weather is optional enrichment

**Venue Enrichment:**
- Wikipedia API (`https://en.wikipedia.org/w/api.php`) - Venue historical data, categories, fame scoring
  - SDK/Client: Native `fetch` in `lib/sensoryData.ts`
  - Auth: None required (public API)
  - Endpoints used:
    - `action=query&list=search` - Venue search
    - `action=query&prop=extracts|info|categories|description` - Page detail fetch
  - Timeout: 8 seconds per request
  - Caching: In-memory TTL cache (24 hours) in `lib/sensoryData.ts` (`VENUE_CACHE` Map)
  - Strategy: Parallel multi-strategy search (full name, first word, first two words) via `searchWikipediaWithFallbacks()`
  - Fallback: Mock venue data via `getMockVenueData()` in `lib/sensoryData.ts`

## Data Storage

**Databases:**
- None - No database is configured. Application is stateless.

**File Storage:**
- Local filesystem only - No external file/blob storage detected.

**Caching:**
- In-memory only - Venue enrichment results cached in `VENUE_CACHE` Map in `lib/sensoryData.ts`
  - TTL: 24 hours (`CACHE_TTL_MS = 24 * 60 * 60 * 1000`)
  - Scope: Process-scoped (resets on server restart)
- Rate limiting uses in-memory Map in `lib/rateLimit.ts`
  - Window: 60 seconds, max 30 requests per identifier
  - Cleanup: `setInterval` every 5 minutes

## Authentication & Identity

**Auth Provider:**
- None - No user authentication system detected.
- Session tracking uses `X-Session-ID` request header (client-provided, not validated server-side)
- Client-side session ID stored in `localStorage` via `getOrCreateSessionId()` in `lib/telemetry.ts`

**CSRF Protection:**
- Origin-based validation in `lib/validation.ts` (`validateCsrfToken()`)
- Allowed origins configured via `ALLOWED_ORIGINS` env var (comma-separated)
- Optional `X-CSRF-Token` header support (token validation stubbed with TODO)
- Secret: `CSRF_SECRET` env var (optional; future token validation)

**Rate Limiting:**
- In-memory rate limiter in `lib/rateLimit.ts`
- Identifier priority: `x-api-key` header > `x-user-id` header > `x-forwarded-for` IP > `cf-connecting-ip` IP > `"unknown"`
- Bypass: `RATE_LIMIT_BYPASS_TOKEN` env var (for testing)

## Monitoring & Observability

**Error Tracking:**
- None integrated - No Sentry or equivalent.

**Logs:**
- Structured JSON logging via `lib/telemetry.ts` (`logServerEvent()`, `logError()`)
- Output: console (stdout/stderr), filtered by `NODE_ENV`
- Debug logs only shown in `development` environment
- Sensitive data auto-redacted (patterns: API keys, tokens, passwords, secrets, anthropic, openweather)
- PostHog analytics: Configured via `POSTHOG_API_KEY` env var but **not yet wired up** (tracked as TODO in `lib/telemetry.ts`)

## CI/CD & Deployment

**Hosting:**
- Not detected - No Vercel/Railway/Fly.io configuration files present.

**CI Pipeline:**
- Not detected - No `.github/workflows/`, `.gitlab-ci.yml`, or equivalent.

## Environment Configuration

**Required env vars (from `.env.example`):**
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `OPENWEATHER_API_KEY` - OpenWeatherMap API key
- `ALLOWED_ORIGINS` - CSRF-allowed origins list

**Optional env vars:**
- `CLAUDE_MODEL` - Model name override (default: `claude-sonnet-4-20250514`)
- `RATE_LIMIT_BYPASS_TOKEN` - Disable rate limiting (testing only)
- `CSRF_SECRET` - Future CSRF token secret
- `POSTHOG_API_KEY` - Analytics (not yet implemented)
- `NODE_ENV` - `development` | `production`

**Secrets location:**
- `.env` file (not committed; `.env.example` committed as template)
- `.gitignore` excludes `.env*` files

## Device-Local AI Integrations (Planned/Mocked)

**Apple Intelligence (iOS 18.1+):**
- Adapter: `lib/appleIntelligenceAdapter.ts`
- Status: **Mocked** - delegates to Phi-3; awaiting iOS 18.1 SDK
- Planned: Native MLCompute, NaturalLanguage, Vision frameworks via React Native bridge
- No cloud calls when active (privacy-first local synthesis)

**Phi-3 Mini (iOS 15-18.0, A15+ chip):**
- Adapter: `lib/phi3Adapter.ts`
- Status: **Mocked** - returns pre-written sample narratives with simulated delay
- Planned: React Native bridge to quantized Phi-3 inference (INT8 or FP16)
- No cloud calls when active (fully on-device)

## Webhooks & Callbacks

**Incoming:**
- None detected.

**Outgoing:**
- None detected.

## API Route Summary

**`POST /api/synthesize-sense`** (`app/api/synthesize-sense/route.ts`):
- Calls (in order, with parallelization where noted):
  1. `openweather` - Weather fetch (parallel with Wikipedia)
  2. `wikipedia` - Venue enrichment (parallel with OpenWeather)
  3. `claude_text` - Narrative synthesis (sequential, after enrichment)
- CORS: Wildcard `Access-Control-Allow-Origin: *` for all `/api/*` routes (via `next.config.js`)
- Response includes `processing.cloud_calls` array listing which services were invoked

---

*Integration audit: 2026-02-16*
