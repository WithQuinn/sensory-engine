# Testing Patterns

**Analysis Date:** 2026-02-16

## Test Framework

**Runner:**
- Vitest 1.x for unit and integration tests
- Config: `vitest.config.ts` (project root)
- Environment: `node` (not jsdom)
- Globals: enabled (no need to import `describe`, `it`, `expect`)

**E2E Framework:**
- Playwright 1.40.x
- Config: not present (uses defaults; `npm run test:e2e` invokes `playwright test`)

**Assertion Library:**
- Vitest built-in (`expect`) for unit/integration
- `@testing-library/jest-dom` present in devDependencies (not observed in active use)
- `@testing-library/react` present but not used in current tests

**Run Commands:**
```bash
npm run test:unit          # Run unit + integration tests (vitest run)
npm run test:unit:watch    # Watch mode for unit + integration
npm run test:integration   # Run integration tests only
npm run test:e2e           # Run Playwright E2E tests
npm test                   # Run unit + integration (no E2E)
```

## Test File Organization

**Location:** Separate `tests/` directory (not co-located with source)

**Structure:**
```
tests/
├── unit/
│   └── lib/
│       ├── sensoryValidation.test.ts   # Schema and validation helper tests
│       ├── sensoryData.test.ts         # Wikipedia fetch, fame scoring, mock data
│       ├── sensoryPrompts.test.ts      # Prompt building and parsing
│       ├── excitementEngine.test.ts    # Transcendence scoring and excitement analysis
│       └── weatherData.test.ts        # Weather fetch and processing
├── integration/
│   └── api/
│       ├── synthesize-sense.test.ts    # Full API route integration tests
│       ├── error-paths.test.ts         # Error handling and CSRF paths
│       └── performance-scenarios.test.ts # Latency and throughput tests
├── contract/
│   └── synthesize-sense.contract.test.ts # Schema contract validation
└── e2e/
    └── sensory-agent.spec.ts           # Playwright browser tests
```

**Naming:**
- Unit test files: `{libName}.test.ts`
- Integration test files: `{feature}.test.ts` or `{area}.test.ts`
- Contract tests: `{endpoint}.contract.test.ts`
- E2E specs: `{feature}.spec.ts`

## Test Structure

**Suite Organization:**
```typescript
// Section headers mirror source file sections
describe('calculateFameScore', () => {
  it('returns 0.1 base score when no Wikipedia article', () => { ... });
  it('adds 0.1 for extract length > 500 characters', () => { ... });
  it('caps fame score at 1.0', () => { ... });
});
```

**Patterns:**
- Top-level `describe` named after the exported function being tested
- Nested `describe` groups for thematic sub-categories within integration tests
- Test descriptions written as human-readable sentences starting with verb: "returns", "accepts", "rejects", "adds", "handles"
- Section-header comments `// ===` used between test suites to match source file structure

**Integration Test Organization:**
Nested `describe` blocks group by behavior category:
```typescript
describe('POST /api/synthesize-sense', () => {
  describe('successful requests', () => { ... });
  describe('validation errors', () => { ... });
  describe('graceful degradation', () => { ... });
  describe('privacy', () => { ... });
  describe('Claude response handling', () => { ... });
  describe('photo and audio data', () => { ... });
  describe('companion handling', () => { ... });
  describe('timing and context', () => { ... });
  describe('output structure', () => { ... });
});
```

## Mocking

**Framework:** Vitest's `vi` object (`vi.mock`, `vi.fn`, `vi.stubEnv`)

**Module Mocking:**
```typescript
// Mock entire module with class replacement
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));
```

**Global Fetch Mocking:**
```typescript
const mockFetch = vi.fn();
global.fetch = mockFetch;
```

**Environment Variable Mocking:**
```typescript
// In beforeEach:
vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
vi.stubEnv('OPENWEATHER_API_KEY', 'test-weather-key');

// In afterEach:
vi.unstubAllEnvs();
```

**Mock Lifecycle:**
```typescript
beforeEach(() => {
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
  mockCreate.mockClear();  // Reset call history, keep mock
  mockFetch.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});
```

**What to Mock:**
- External network calls: Anthropic SDK, `global.fetch` (for Wikipedia, OpenWeather)
- Environment variables: `ANTHROPIC_API_KEY`, `OPENWEATHER_API_KEY`
- Module-level SDK instances (via `vi.mock`)

**What NOT to Mock:**
- Internal lib functions (test them directly as pure units)
- Zod schemas (test parsing directly)
- Next.js `NextRequest`/`NextResponse` (used directly with real constructors)

## Fixtures and Factories

**Test Data Pattern:**
Named constant fixtures defined at top of test file before all suites:
```typescript
const mockVenueHighFame: VenueEnrichment = {
  verified_name: 'Eiffel Tower',
  category: 'landmark',
  description: 'Iconic iron lattice tower on the Champ de Mars in Paris',
  founded_year: 1889,
  historical_significance: 'Built for the 1889 World\'s Fair...',
  unique_claims: ['Most-visited paid monument in the world'],
  fame_score: 0.95,
  wikipedia_url: 'https://en.wikipedia.org/wiki/Eiffel_Tower',
};
```

**Spread Override Pattern:**
```typescript
// Base fixture + inline override
const withNulls = {
  ...mockMomentSense,
  sensory_details: { visual: 'description', audio: null, scent: null, tactile: null },
};
```

**validInput Fixture:**
Integration tests define a `const validInput = {...}` block as the reusable base request body for the test suite.

**Mock Response Helper Functions:**
```typescript
function setClaudeResponse(response: object) {
  mockCreate.mockResolvedValueOnce({
    content: [{ type: 'text', text: JSON.stringify(response) }],
  });
}

function setClaudeError(error: Error) {
  mockCreate.mockRejectedValueOnce(error);
}

function setWikipediaSearchResponse(title: string) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ query: { search: [{ pageid: 123, title }] } }),
  });
}

function setWeatherResponse(data: { condition: string; temp: number; humidity: number }) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ weather: [...], main: { temp: data.temp, humidity: data.humidity, ... } }),
  });
}
```

**Request Factory:**
Integration tests use a `createRequest(body)` factory with auto-incrementing IP to avoid rate limiting:
```typescript
let requestCounter = 0;
function createRequest(body: unknown): NextRequest {
  requestCounter++;
  return new NextRequest('http://localhost/api/synthesize-sense', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': `10.2.${Math.floor(requestCounter / 256)}.${requestCounter % 256}`,
      'X-Session-ID': `test-session-${requestCounter}`,
    },
    body: JSON.stringify(body),
  });
}
```

**Location:** Fixtures are inline in test files; no separate fixtures directory. Source lib files include `getMock*` functions for test use.

## Coverage

**Requirements:** Not configured (no coverage threshold in `vitest.config.ts`)

**View Coverage:**
```bash
# Not configured; would use:
npx vitest run --coverage
```

## Test Types

**Unit Tests (`tests/unit/lib/`):**
- Scope: Single exported function at a time
- No external calls (pure functions tested directly)
- Boundary value testing (min, max, edge cases)
- Validates against Zod schemas directly: `VenueEnrichmentSchema.safeParse(enrichment)`

**Integration Tests (`tests/integration/api/`):**
- Scope: Full Next.js API route handler (`POST` function)
- Mocks: Anthropic SDK, `global.fetch` for Wikipedia and OpenWeather
- Uses real `NextRequest` / `NextResponse` objects
- Validates HTTP status codes and full response shape
- Tests graceful degradation (Claude failure, Wikipedia failure, no API key)

**Contract Tests (`tests/contract/`):**
- Scope: Schema validation and endpoint routing logic
- Uses Zod schemas directly to validate mock payloads
- Validates device capability detection logic
- Contains stub test bodies for future API contract tests (incomplete, with TODO-style comments)

**E2E Tests (`tests/e2e/`):**
- Framework: Playwright
- Scope: Browser-level UI flows (`/sense` page)
- Tests: form visibility, keyboard navigation, responsive layout at 375px
- Assertions are mostly existence/visibility checks (tests are lightweight)

## Common Patterns

**Async Testing:**
```typescript
it('returns 200 with synthesized moment for valid input', async () => {
  setWikipediaSearchResponse('Senso-ji');
  setWikipediaPageResponse({ title: 'Senso-ji', extract: '...' });
  setWeatherResponse({ condition: 'Clear', temp: 21, humidity: 45 });
  setClaudeResponse(validClaudeResponse);

  const request = createRequest({ photos: { count: 5, refs: [] }, ... });
  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
});
```

**Schema Validation Testing:**
```typescript
it('accepts valid audio input', () => {
  const result = AudioInputSchema.safeParse({ duration_seconds: 15, ... });
  expect(result.success).toBe(true);
});

it('rejects duration over 300 seconds', () => {
  const result = AudioInputSchema.safeParse({ duration_seconds: 301, ... });
  expect(result.success).toBe(false);
});
```

**Error Testing:**
```typescript
it('throws for invalid input', () => {
  expect(() => validateSensoryInput({ photos: { count: 0 } })).toThrow();
});
```

**Graceful Degradation Testing:**
```typescript
it('falls back to local processing when Claude fails', async () => {
  setClaudeError(new Error('API rate limit exceeded'));
  // ... setup other mocks ...
  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(200);    // Still 200, not 500
  expect(data.success).toBe(true);
  expect(data.moment.processing.tier).toBe('local_only');
});
```

**Boundary Value Testing:**
```typescript
it('accepts sentiment at boundary values', () => {
  const minSentiment = AudioInputSchema.safeParse({ sentiment_score: -1, ... });
  expect(minSentiment.success).toBe(true);

  const maxSentiment = AudioInputSchema.safeParse({ sentiment_score: 1, ... });
  expect(maxSentiment.success).toBe(true);
});

it('rejects sentiment score outside -1 to 1 range', () => {
  const tooHigh = AudioInputSchema.safeParse({ sentiment_score: 1.5, ... });
  expect(tooHigh.success).toBe(false);
});
```

**Floating Point Assertions:**
```typescript
expect(calculateTranscendence(baseFactors)).toBeCloseTo(0.5, 2);
expect(sum).toBeCloseTo(1.0, 10);
```

## Known Testing Issues

**Contract tests are incomplete:** `tests/contract/synthesize-sense.contract.test.ts` contains several `describe` blocks with empty `it()` bodies (stub/TODO format). The "API Response Format" suite has four tests with no assertions.

**E2E tests are minimal:** `tests/e2e/sensory-agent.spec.ts` contains mostly existence checks rather than behavioral flows. Many assertions use `toBeDefined()` which always passes.

**No coverage enforcement:** `vitest.config.ts` has no coverage thresholds configured.

**Mock data schema drift:** Contract test `mockSensoryInput` uses fields (`file_id`, `file_name`, `dimensions`, `cloudAnalysis`) not present in the actual `PhotoReferenceSchema`, indicating the contract fixture is out of date.

---

*Testing analysis: 2026-02-16*
