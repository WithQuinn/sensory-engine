# Coding Conventions

**Analysis Date:** 2026-02-16

## Naming Patterns

**Files:**
- `camelCase.ts` for utility/library modules: `sensoryData.ts`, `excitementEngine.ts`, `weatherData.ts`
- `camelCase.tsx` for React components: `SensoryAgentUI.tsx`, `uiComponents.tsx`
- `kebab-case/` for Next.js route segments: `app/api/synthesize-sense/route.ts`
- Test files mirror source names with `.test.ts` suffix: `sensoryData.test.ts`, `excitementEngine.test.ts`
- E2E files use `.spec.ts` suffix: `sensory-agent.spec.ts`

**Functions:**
- `camelCase` for all functions: `calculateFameScore`, `extractFoundedYear`, `inferVenueCategory`
- Async functions named as verbs: `fetchVenueEnrichment`, `searchWikipedia`, `fetchWikipediaPage`
- Boolean-returning helpers use `is`/`has` prefix: `isGoldenHour`, `isWeekend`
- Internal/private helpers placed after main exports in file
- Helper functions grouped with section comments at end of API route files

**Variables:**
- `camelCase` for local variables: `startTime`, `processingTier`, `servicesCalled`
- `SCREAMING_SNAKE_CASE` for module-level constants: `CACHE_TTL_MS`, `VENUE_CACHE`, `TRANSCENDENCE_WEIGHTS`
- Underscore prefix for intentionally unused parameters: `_title` in `extractUniqueClaims(text: string, _title: string)`

**Types and Interfaces:**
- `PascalCase` for all types, interfaces, and Zod schemas
- Schema variables carry `Schema` suffix: `VenueEnrichmentSchema`, `SensoryInputSchema`, `MomentSenseSchema`
- Inferred types use same name without suffix: `type VenueEnrichment = z.infer<typeof VenueEnrichmentSchema>`
- Enum variables carry `Enum` suffix: `LightingEnum`, `EnergyEnum`, `VenueCategoryEnum`

**API Error Codes:**
- `SCREAMING_SNAKE_CASE` strings: `'VALIDATION_ERROR'`, `'RATE_LIMITED'`, `'SYNTHESIS_FAILED'`, `'CSRF_INVALID'`

## Code Style

**Formatting:**
- No Prettier config present; ESLint is the primary style enforcer
- TypeScript strict mode enabled (`strict: true` in `tsconfig.json`)
- ES2020 target; ESNext module format
- All files use 2-space indentation (consistent throughout codebase)

**Linting:**
- Tool: ESLint with `@typescript-eslint` plugin (config in `.eslintrc.json`)
- Key rules:
  - `@typescript-eslint/no-unused-vars`: warn, allow `^_` prefix for intentional ignores
  - `@typescript-eslint/no-explicit-any`: warn (not error; used in some places)
  - `no-console`: warn but allow `console.warn`, `console.error`, `console.log`
- Ignored paths: `node_modules/`, `.next/`, `dist/`, `build/`, `*.config.js`

**TypeScript Strictness:**
- `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` all enabled
- `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply` enabled
- `noImplicitAny`, `noImplicitThis` enabled

## File Structure Pattern

Each lib module follows a consistent section layout using section headers:

```typescript
// =============================================================================
// SECTION NAME
// Description of what this section does
// =============================================================================
```

Sections appear in this order in lib files:
1. TYPES (Zod schemas + inferred types)
2. Core logic functions
3. MAIN EXPORTED FUNCTION(S)
4. MOCK DATA FOR TESTING (at the bottom of the file)

## Import Organization

**Order:**
1. Framework/runtime imports: `import { NextRequest, NextResponse } from 'next/server'`
2. Third-party SDKs: `import Anthropic from '@anthropic-ai/sdk'`
3. Internal lib imports using `@/lib/` alias: `import { checkRateLimit } from '@/lib/rateLimit'`
4. Type-only imports last, using `type` keyword: `import type { VenueEnrichment } from '@/lib/sensoryData'`

**Path Aliases:**
- `@/` resolves to project root
- `@/lib/*` resolves to `./lib/*`
- `@/app/*` resolves to `./app/*`
- `@/tests/*` resolves to `./tests/*`

**Type Imports:**
- Named type imports use `type` keyword explicitly: `import type { SynthesisInput } from '@/lib/sensoryPrompts'`
- Inline type imports mix named values and types: `import { SensoryInputSchema, type SensoryInput } from '@/lib/sensoryValidation'`

## Error Handling

**Strategy:**
All errors are caught and result in graceful degradation rather than unhandled rejections. Network failures silently fall back to mock data.

**Patterns:**
- `try/catch` wrapping all external API calls with specific fallback return value
- Error messages use `error instanceof Error ? error.message : String(error)` pattern
- Functions return result objects: `{ success: boolean, data: T | null, error?: string }`
- API route errors use `buildErrorResponse()` from `@/lib/validation` with typed error codes
- Output always validated against Zod schema before being sent to client

```typescript
// Standard async fetch error pattern:
try {
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  const validated = Schema.safeParse(data);
  if (!validated.success) {
    console.error('Validation failed:', validated.error.errors);
    return null;
  }
  return validated.data;
} catch (error) {
  console.error('Error message:', error instanceof Error ? error.message : String(error));
  return null;
}
```

**Zod Validation:**
- Use `.safeParse()` for external data (no throw); use `.parse()` for trusted internal data
- Input validation at API boundary with `SensoryInputSchema.safeParse(body)`
- Output validation before sending: `MomentSenseSchema.safeParse(momentSense)` → return 500 if fails

## Logging

**Framework:** `logServerEvent` from `@/lib/telemetry` (structured logging)

**Console use:** `console.error` for unexpected failures, `console.log`/`console.warn` for operational info

**Patterns:**
```typescript
// Structured server event logging:
logServerEvent("info", "Synthesize sense request received", {
  requestId,
  sessionId,
  photo_count: input.photos.count,
});

// Error logging with context:
logServerEvent("error", "Output validation failed", {
  requestId,
  errors: outputValidation.error.errors.map(e => e.message),
});
```

**Log levels:** `"info"`, `"warn"`, `"error"` (string literals, not enum)

## Comments

**Section Headers:**
Use `// =============================================================================` banners for logical sections within files. Every file has at least one top-level banner with module purpose.

**JSDoc:**
Used on all exported functions with `/** ... */` syntax. Parameters explained with context, not just type. Side effects and privacy implications called out:

```typescript
/**
 * Fetch venue enrichment data from Wikipedia
 *
 * OPTIMIZATION:
 * - Step 1: Check 24-hour TTL cache (saves ~1200ms on cache hit)
 *
 * PRIVACY: Only venue name is sent to Wikipedia API (no user data)
 *
 * @param venueName - Name of the venue to look up
 * @param destination - Optional destination context for better matching
 */
```

**Inline comments:** Explain non-obvious logic, especially numeric constants and business rules:
```typescript
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24-hour TTL
return 0.1; // Base score for any known venue
```

**TODO comments:** Used for Sprint-level deferred work, include issue references:
```typescript
// TODO (Sprint 2): Replace with actual profile agent integration:
// const isFirstVisit = await profileAgent.isFirstVisit(userId, venueId);
```

**Optimization comments:** Document performance decisions inline:
```typescript
// OPTIMIZATION Step 2: Parallelize search queries (saves ~400ms)
// Sequential: search1 (400ms) → fallback search (400ms) = 800ms
// Parallel: search1 + fallbacks (parallel, 400ms) = 400ms
```

## Function Design

**Size:** Functions are kept focused and single-purpose. Helper functions extracted to private scope at bottom of file.

**Parameters:**
- Destructure complex params inline: `function buildTranscendenceFactors(params: { sentimentScore: number | null; ... })`
- Use `?` for optional params, not union with undefined

**Return Values:**
- Use discriminated unions for fallible operations: `{ success: true, data: T } | { success: false, error: string }`
- Return `null` (not `undefined`) for absent optional values
- All return types inferred from Zod schemas where possible

**Async:**
- Parallelized independent operations with `Promise.all()` or `Promise.allSettled()`
- AbortSignal timeouts on all external fetch calls: `signal: AbortSignal.timeout(8000)`

## Module Design

**Exports:**
- Named exports only; no default exports from lib modules
- API route files export named HTTP method functions: `export async function POST(...)`
- React components use named exports: `export function Button(...)`

**Barrel Files:**
- Not used; each module imports directly from specific lib files

**Schema Co-location:**
- Zod schemas and their inferred types are defined together in the same file
- API response schemas defined in `@/lib/sensoryValidation`; validation helpers in `@/lib/validation`

## React Conventions

**Component Style:**
- Function components with explicit `React.FC` or inferred return type
- `'use client'` directive at top of client components
- `useState`, `useCallback`, `useRef`, `useEffect` imported from `'react'`
- Local component types defined in a `// Types` section near top of file

**State Pattern:**
```typescript
type ProcessingState = 'idle' | 'processing' | 'success' | 'error';
const [state, setState] = useState<ProcessingState>('idle');
```

---

*Convention analysis: 2026-02-16*
