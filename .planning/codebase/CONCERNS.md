# Codebase Concerns

**Analysis Date:** 2026-02-16

---

## Tech Debt

**Apple Intelligence Adapter is a complete stub:**
- Issue: `lib/appleIntelligenceAdapter.ts` contains zero real implementation. It simply delegates every call to `synthesizeWithPhi3`. The file comment states "waiting for iOS 18.1 SDK" and the entire real implementation is commented out pseudocode. iOS 18.1 has been released for well over a year.
- Files: `lib/appleIntelligenceAdapter.ts`
- Impact: All iOS 18.1+ "local synthesis" requests silently fall through to Phi-3 mock responses (random pre-written narratives), not Apple Intelligence. The routing code in the route handler believes it is calling Apple Intelligence when it is not.
- Fix approach: Implement real Apple Intelligence integration using the iOS native SDK, or explicitly remove the routing tier and document that only cloud synthesis is supported.

**Phi-3 Adapter is a mock with simulated latency:**
- Issue: `lib/phi3Adapter.ts` function `runPhi3Inference` is explicitly a stub that sleeps 200-800ms and returns one of three hardcoded narrative strings at random. The comment reads "TODO: Replace with actual Phi-3 inference when SDK available."
- Files: `lib/phi3Adapter.ts` (lines 139-156)
- Impact: Any iOS 15+ device routed to "local synthesis" receives a random boilerplate narrative unrelated to the user's actual photos, audio, or venue. This is functionally misleading — the output claims to be synthesized from the user's data.
- Fix approach: Integrate actual Phi-3 Mini inference, or gate this routing path behind a feature flag and document that it is not production-ready.

**Duplicate venue cache implementations:**
- Issue: Two separate in-memory venue caches exist. `lib/sensoryData.ts` maintains a module-level `VENUE_CACHE: Map<string, CacheEntry>` with 24-hour TTL, and `lib/venueCache.ts` exports a separate `VenueCache` class singleton with 5-minute TTL and its own cleanup interval. Neither imports the other; `venueCache.ts` is never referenced from the main API route.
- Files: `lib/sensoryData.ts` (lines 341-373), `lib/venueCache.ts`
- Impact: `lib/venueCache.ts` is dead code — never used by the route handler. The cache in `sensoryData.ts` is used. Memory leak risk if `venueCache.ts` is ever imported because it starts a `setInterval` in the constructor and has no lifecycle cleanup at module level.
- Fix approach: Remove `lib/venueCache.ts` or make it the single caching layer and have `sensoryData.ts` use it.

**Rate limiter bypasses all checks when bypass token is set:**
- Issue: `lib/rateLimit.ts` line 26-28: `if (BYPASS_TOKEN) { return true; }` — if the env var `RATE_LIMIT_BYPASS_TOKEN` is set to any non-empty string (even accidentally), ALL rate limiting is disabled globally for every request.
- Files: `lib/rateLimit.ts` (lines 17, 26-28)
- Impact: Any misconfigured deployment environment with this env var set runs with no rate limiting at all, regardless of the bypass token value in the request. The intent was likely to compare the header token, not simply check if the env var exists.
- Fix approach: Change logic to compare incoming request header against the stored bypass token value, not just check presence of the env var.

**`isFirstVisit` heuristic is incorrect by design:**
- Issue: In `app/api/synthesize-sense/route.ts` lines 356-360, `isFirstVisit` is determined by `!sessionId || sessionId === "unknown"`. A comment acknowledges this: "Track actual visit history per user/venue to determine isFirstVisit. Currently assumes first visit by default. See Issue #69." This means the `novelty_factor` component of every transcendence score is hardcoded to 0.85 (first visit) whenever no session ID header is present, which is the case for most web requests.
- Files: `app/api/synthesize-sense/route.ts` (lines 354-371)
- Impact: Transcendence scores are systematically inflated for all requests without a session ID. The novelty factor (15% weight) is always maximum, skewing results.
- Fix approach: Integrate with a Profile Agent visit history store, or at minimum return `false` (not first visit) as the safe default rather than `true`.

**`hadUnexpectedMoment` is permanently hardcoded to `false`:**
- Issue: `buildTranscendenceFactors` is always called with `hadUnexpectedMoment: false` in `app/api/synthesize-sense/route.ts` line 371. The surprise factor (5% weight) is always set to 0.2.
- Files: `app/api/synthesize-sense/route.ts` (line 371), `lib/excitementEngine.ts` (line 217)
- Impact: Minor score deflation. More importantly, the feature is documented in the schema but never populated.
- Fix approach: Detect unexpected moments from synthesized output or user signals, or remove the parameter until it can be properly computed.

**`intentMatch` is always null:**
- Issue: `synthesisInput.context.tripIntent` is set to `undefined` (line 308 in route.ts), and `buildTranscendenceFactors` is called with `intentMatch: null`. This means the intent_match factor (10% weight) always defaults to 0.5.
- Files: `app/api/synthesize-sense/route.ts` (lines 308, 370), `lib/excitementEngine.ts` (line 214)
- Impact: Intent matching is 10% of the transcendence formula but is never computed.
- Fix approach: Accept trip intent from the client request or Profile Agent, or remove from scoring until implemented.

**`SensoryInputSchema` does not validate `venue` presence when required:**
- Issue: The schema marks `venue` as `nullable().default(null)`. However, without a venue name the Wikipedia enrichment call is skipped entirely and the Anthropic prompt section for venue is empty. The API succeeds but returns a generic narrative with no venue context.
- Files: `lib/sensoryValidation.ts` (lines 166-170), `app/api/synthesize-sense/route.ts` (lines 237-256)
- Impact: Clients can submit requests without a venue and receive a synthesis — the narrative quality degrades silently.
- Fix approach: Either require venue in schema or explicitly document and test the no-venue degraded path.

---

## Security Considerations

**CORS configuration allows all origins (`*`):**
- Risk: `next.config.js` lines 18-22 set `Access-Control-Allow-Origin: *` and `Access-Control-Allow-Credentials: true` on all `/api/*` routes. This combination is invalid per the CORS spec — browsers reject credentialed requests with wildcard origin — but it also signals the CORS policy was not carefully considered.
- Files: `next.config.js` (lines 14-23)
- Current mitigation: None. The wildcard will cause credentialed cross-origin requests to fail silently in browsers.
- Recommendations: Set `ALLOWED_ORIGINS` env var to actual allowed origins. Update `next.config.js` to reflect the same list used in `validateCsrfToken`. Remove the wildcard.

**CSRF token validation is incomplete:**
- Risk: `lib/validation.ts` `validateCsrfToken` (lines 133-167) only compares origin/referer headers. When a cross-origin request is detected, the comment at line 159 reads "TODO: Validate token against server-side store" — the actual CSRF token value is never verified. Any request with a matching origin passes.
- Files: `lib/validation.ts` (lines 133-167)
- Current mitigation: Origin header check provides some protection.
- Recommendations: Implement server-side CSRF token storage (e.g., signed session tokens) and validate incoming `X-CSRF-Token` headers against them.

**`ALLOWED_ORIGINS` env var defaults to empty string, allowing all origins:**
- Risk: `lib/validation.ts` line 142: `const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',')`. If the env var is not set, `allowedOrigins` is `['']`. The check `allowedOrigins.includes(origin)` then only blocks requests, never passes them — but an empty string in the array means any `origin` header that is empty or missing passes through. Effectively, no origin is blocked by default if the env var is omitted.
- Files: `lib/validation.ts` (lines 142-147)
- Recommendations: Set a safe default that blocks all external origins, or throw a startup error if `ALLOWED_ORIGINS` is not configured.

**Rate limit identifier falls back to `'unknown'` for all requests without IP headers:**
- Risk: `lib/validation.ts` line 117: if no API key, user ID, or IP headers are present, the identifier is `'unknown'`. All such requests share the same rate limit bucket, meaning 30 requests from any single such client exhausts the limit for all others in the same bucket.
- Files: `lib/validation.ts` (lines 103-119), `lib/rateLimit.ts`
- Current mitigation: Rate limit applies, but incorrectly scoped.
- Recommendations: Use a combination of heuristics or require `X-Session-ID` for rate limit granularity.

**In-memory rate limit map is not cleaned up between serverless cold starts:**
- Risk: `lib/rateLimit.ts` stores rate limit state in a module-level `Map`. In serverless/edge deployments (Vercel), each function instance has its own memory. Rate limits are per-instance, not global. Users can bypass limits by triggering new instances.
- Files: `lib/rateLimit.ts` (lines 12-108)
- Current mitigation: None.
- Recommendations: Use a distributed store (Redis, Upstash) for rate limiting in serverless environments.

**Synthesis queue `processQueuedRequests` sends requests without CSRF token or session ID:**
- Risk: `lib/synthesisQueue.ts` line 366-370: the retry `fetch` call sends only `Content-Type` header, omitting `X-CSRF-Token` and `X-Session-ID`. The API would reject these retries with a 403 CSRF error.
- Files: `lib/synthesisQueue.ts` (lines 366-370)
- Current mitigation: Currently the queue is only used for iOS <15 devices; it cannot process retries.
- Recommendations: Include necessary auth headers in retry requests.

---

## Performance Bottlenecks

**`analyzeImageLocally` iterates pixel array twice for brightness and saturation:**
- Problem: `app/components/SensoryAgentUI.tsx` (lines 232-255) iterates `pixels.length / 4` pixels twice — once for brightness and once for saturation. A 4K image has ~8M pixels; this is ~16M iterations on the main thread.
- Files: `app/components/SensoryAgentUI.tsx` (lines 219-279)
- Cause: Two separate `for` loops over the same `Uint8ClampedArray`.
- Improvement path: Combine into a single pass computing brightness, saturation, and hue simultaneously. Also consider downsampling the canvas before analysis (e.g., 100x100 thumbnail).

**Canvas-based image analysis runs synchronously and blocks UI:**
- Problem: `analyzeImageLocally` is `async` but the pixel iteration loop is synchronous and runs on the main thread. For large photos (10+ MP from modern iPhones), this blocks rendering.
- Files: `app/components/SensoryAgentUI.tsx` (lines 219-279)
- Cause: No Web Worker or `requestAnimationFrame` chunking.
- Improvement path: Offload pixel analysis to a Web Worker, or downsample image to a fixed max dimension before canvas rendering.

**Multi-photo upload is sequential, not parallel:**
- Problem: `handlePhotoSelect` in `SensoryAgentUI.tsx` (lines 561-601) processes photos in a `for` loop with sequential `await extractExifData` and `await analyzeImageLocally` per file.
- Files: `app/components/SensoryAgentUI.tsx` (lines 571-590)
- Cause: `for` loop with `await` instead of `Promise.all`.
- Improvement path: Process all files with `Promise.all` or `Promise.allSettled` and merge results.

**Wikipedia search runs 3 parallel strategies regardless of cache:**
- Problem: `searchWikipediaWithFallbacks` in `lib/sensoryData.ts` (lines 252-278) always fires all 3 search strategies (full query, first word, first two words) in parallel. If the first strategy succeeds, the other two responses are discarded. This wastes 2 Wikipedia API calls on every cache miss.
- Files: `lib/sensoryData.ts` (lines 252-278)
- Cause: Optimization comment says "parallel", but sequential-with-fallback would be more efficient.
- Improvement path: Try strategies sequentially with a short timeout, or use only the full query and fall back only on failure.

**`setInterval` runs in module scope for both rate limiter and venue cache:**
- Problem: `lib/rateLimit.ts` line 108 and `lib/venueCache.ts` (constructor) each start `setInterval` at module load time. In serverless environments, these timers may run in warm function instances and accumulate across invocations.
- Files: `lib/rateLimit.ts` (line 108), `lib/venueCache.ts` (lines 94-98)
- Cause: Singleton cleanup pattern designed for long-running processes, not serverless.
- Improvement path: Use lazy cleanup triggered at request time, or use external TTL-aware stores.

---

## Fragile Areas

**`parseSynthesisResponse` returns `null` silently on LLM formatting errors:**
- Files: `lib/sensoryPrompts.ts` (lines 363-389)
- Why fragile: Claude is instructed to return raw JSON, but if it wraps output in any unexpected format beyond a leading code fence (e.g., explanation before JSON), `JSON.parse` throws and the entire synthesis falls back to `generateFallbackNarrative`. There is no retry or partial-parse logic.
- Safe modification: Add regex extraction for `{...}` block before giving up, and log the raw response for debugging. Consider adding a retry with stricter prompt enforcement.
- Test coverage: Tested in `tests/unit/lib/sensoryPrompts.test.ts` but only for known failure cases.

**`aggregatePhotoAnalysis` uses only the first photo's lighting/crowd/energy:**
- Files: `app/api/synthesize-sense/route.ts` (lines 566-595)
- Why fragile: Lines 590-592 take `refs[0]?.local_analysis?.crowd_level` and `refs[0]?.local_analysis?.energy_level` without aggregation. For multi-photo uploads, the first photo's metadata dominates. A photo set that transitions from indoor to outdoor would misreport.
- Safe modification: Compute mode or majority vote across all refs rather than always taking index 0.

**`SensoryOutputSchema` in `sensoryValidation.ts` and `SynthesisOutput` interface in `sensoryPrompts.ts` are duplicated:**
- Files: `lib/sensoryValidation.ts` (lines 726-755), `lib/sensoryPrompts.ts` (lines 71-99)
- Why fragile: The Zod schema `SynthesisOutputSchema` and the TypeScript `SynthesisOutput` interface define the same shape in two places. If the schema changes, the interface must be manually kept in sync. Currently the interface is used as the return type but the Zod type is used for validation — a mismatch could cause silent type errors.
- Safe modification: Remove the manual interface in `sensoryPrompts.ts` and use `z.infer<typeof SynthesisOutputSchema>` as the type everywhere.

**Device chip detection relies on fragile User-Agent number parsing:**
- Files: `lib/deviceCapability.ts` (lines 74-102)
- Why fragile: The chip map uses hardcoded iPhone model number to chip mapping. Model numbers 12 and 11 are assigned to two different values in a non-obvious mapping that does not match Apple's actual numbering (e.g., iPhone 12 mini is model 13,4 but is mapped as 12). New iPhone models will not be detected and will fall through to `"queue_synthesis"` default, denying them local synthesis.
- Safe modification: Add tests for new model numbers on each iOS release, or use a more robust detection strategy (e.g., `navigator.hardwareConcurrency`, WebAssembly SIMD detection on client side).
- Test coverage: Not tested.

**`localPercentage` is a hardcoded constant, not computed:**
- Files: `app/api/synthesize-sense/route.ts` (line 379)
- Why fragile: `const localPercentage = processingTier === "local_only" ? 95 : 65`. These values are arbitrary and do not reflect actual processing distribution. The processing transparency field in the API response is misleading.
- Safe modification: Track which operations ran locally vs. cloud and compute the percentage dynamically.

---

## Scaling Limits

**In-memory venue cache (`VENUE_CACHE` in `sensoryData.ts`) is unbounded:**
- Current capacity: Grows indefinitely per server instance with no size cap.
- Limit: Memory exhaustion if many unique venues are queried (possible in production with a global travel app).
- Scaling path: Add LRU eviction with a max size (e.g., 1000 entries), or use Redis.

**Rate limit map is unbounded and per-instance:**
- Current capacity: One entry per unique identifier per server instance.
- Limit: In serverless, no global rate limiting. On a long-running server, the map grows unbounded with unique IPs.
- Scaling path: Use Redis/Upstash for distributed rate limiting with built-in key expiry.

**`processQueuedRequests` in `synthesisQueue.ts` processes queue items sequentially:**
- Current capacity: One queued item at a time (sequential `for` loop at lines 357-400).
- Limit: If a user has many queued items, processing stalls.
- Scaling path: Use `Promise.allSettled` with a concurrency limit (e.g., 3 parallel).

---

## Dependencies at Risk

**`@anthropic-ai/sdk` version `^0.24.0` but route uses model `claude-sonnet-4-20250514`:**
- Risk: SDK version 0.24.0 predates the `claude-sonnet-4-20250514` model (May 2025). The model string is passed as a plain string, so the SDK may not validate it, but there is a risk that the pinned SDK version is incompatible with new API behaviors for newer models.
- Files: `app/api/synthesize-sense/route.ts` (line 326), `package.json`
- Impact: Potential API incompatibility; SDK may lack support for newer response features.
- Migration plan: Update `@anthropic-ai/sdk` to latest stable release and verify response parsing.

**`next: ^14.0.0` is significantly behind current (Next.js 15+):**
- Risk: Next.js 14 has known security advisories and performance gaps compared to 15.x. The `^` range means `npm install` will install the latest 14.x, not 15.
- Files: `package.json`
- Impact: Missing App Router improvements, server action stability, and security patches.
- Migration plan: Upgrade to Next.js 15 following the migration guide; test API route behavior with new request/response APIs.

---

## Missing Critical Features

**No persistence layer — moments are never stored:**
- Problem: The API synthesizes a `MomentSense` and returns it to the client, but there is no database write. No moments are persisted server-side. If the client loses the response (network error, app crash), the moment is lost.
- Blocks: Building a moments history view, sharing features, or the Profile Agent integration described in docs.

**No authentication — API is fully unauthenticated:**
- Problem: The API has no user authentication. There is no user identity attached to any request. Rate limiting falls back to IP address which is unreliable behind proxies.
- Blocks: User-specific history, Profile Agent integration, personalization, per-user visit tracking.

**EXIF GPS extraction is not implemented:**
- Problem: `extractExifData` in `SensoryAgentUI.tsx` (lines 93-115) reads the file header to verify JPEG magic bytes but then immediately returns `coordinates: null`. The comment says "Extract GPS from EXIF" but the GPS parsing code was never written. The variable `const coordinates = null` (line 106) is a placeholder.
- Files: `app/components/SensoryAgentUI.tsx` (lines 93-115)
- Blocks: Automatic coordinate extraction from photos, which would enable weather enrichment without user manually providing venue name.

**Synthesis queue is never processed on web:**
- Problem: `processQueuedRequests` in `lib/synthesisQueue.ts` is defined but never called from `SensoryAgentUI.tsx` or any other web entry point. Queued items are written to IndexedDB and then never retried.
- Files: `lib/synthesisQueue.ts` (lines 340-410), `app/components/SensoryAgentUI.tsx`
- Blocks: The degraded iOS <15 path — users on those devices receive a placeholder narrative that is never upgraded.

---

## Test Coverage Gaps

**`deviceCapability.ts` has zero test coverage:**
- What's not tested: Chip detection from user agent strings, iOS version parsing edge cases, routing decisions for iOS 18.1+ vs 15-18.0.
- Files: `lib/deviceCapability.ts`
- Risk: A wrong chip map entry silently routes users to wrong synthesis path.
- Priority: High

**`appleIntelligenceAdapter.ts` and `phi3Adapter.ts` have no unit tests:**
- What's not tested: The mock inference path, context extraction, `buildMomentSense` assembly in Phi-3.
- Files: `lib/appleIntelligenceAdapter.ts`, `lib/phi3Adapter.ts`
- Risk: When real SDK integration is added, no regression baseline exists.
- Priority: High

**`synthesisQueue.ts` queue operations have no tests:**
- What's not tested: IndexedDB write, retry logic, `cleanupOldRequests`, degraded response assembly.
- Files: `lib/synthesisQueue.ts`
- Risk: Queue logic is fragile and untested; the retry path sends malformed requests (missing CSRF header).
- Priority: High

**`rateLimit.ts` bypass behavior is not tested:**
- What's not tested: The `BYPASS_TOKEN` env var behavior (bypasses all limits when set to any value).
- Files: `lib/rateLimit.ts`
- Risk: An accidental env var in production disables all rate limiting silently.
- Priority: Medium

**`SensoryAgentUI.tsx` component has no tests:**
- What's not tested: Photo upload flow, sentiment slider auto-population, CSRF-missing fetch call, error state rendering.
- Files: `app/components/SensoryAgentUI.tsx`
- Risk: The fetch call at line 680 does not include `X-CSRF-Token` header, which will cause 403 errors in production if CSRF validation is correctly enforced. This gap is not caught by any test.
- Priority: High

**E2E tests exist but test runner (`vitest`) was not installed when `test-results.log` was captured:**
- What's not tested: Full user flow from photo upload through synthesis display.
- Files: `tests/e2e/sensory-agent.spec.ts`, `test-results.log`
- Risk: No end-to-end confidence that the web UI + API route work together.
- Priority: Medium

---

## Known Bugs

**`SensoryAgentUI.tsx` fetch call is missing `X-CSRF-Token` header:**
- Symptoms: In production with a properly configured `ALLOWED_ORIGINS`, the web client will receive 403 CSRF validation failures because the fetch at line 680 only sends `Content-Type` and `X-Session-ID` headers, not `X-CSRF-Token`.
- Files: `app/components/SensoryAgentUI.tsx` (lines 680-687)
- Trigger: Any request where `validateCsrfToken` requires a token (cross-origin or when ALLOWED_ORIGINS is properly configured).
- Workaround: Currently masked because `ALLOWED_ORIGINS` defaults to empty string and the validation is lenient.

**`WikipediaSearchResponseSchema` fails on the actual Wikipedia API response format:**
- Symptoms: The schema requires `batchcomplete: z.boolean()` but the Wikipedia API returns `batchcomplete: ""` (empty string) on success, not `true`. This causes `validated.success === false` on every Wikipedia response, falling through to mock venue data.
- Files: `lib/sensoryValidation.ts` (lines 642-656), `lib/sensoryData.ts` (lines 232-243)
- Trigger: Any request with a venue name that attempts a real Wikipedia lookup.
- Workaround: Falls back to `getMockVenueData` silently; users do not see an error but get generic mock venue info.

**`extractFoundedYear` third pattern matches any 3-4 digit number:**
- Symptoms: The regex `(\d{3,4})\s*(?:CE|AD|BC)?` at line 115 of `lib/sensoryData.ts` has no anchoring keyword requirement. It will match any year-like number in the text (e.g., "population of 1200", "area of 450 hectares") and return it as a founded year.
- Files: `lib/sensoryData.ts` (lines 114-130)
- Trigger: Venue descriptions with numerical content not related to founding dates.
- Workaround: Earlier patterns run first; the third pattern is a last resort. But false positives from the fallback pattern are not caught.

---

*Concerns audit: 2026-02-16*
