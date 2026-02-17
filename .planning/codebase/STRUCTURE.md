# Codebase Structure

**Analysis Date:** 2026-02-16

## Directory Layout

```
Sensory-Engine/                      # Project root
├── app/                             # Next.js App Router — pages and API routes
│   ├── api/
│   │   └── synthesize-sense/
│   │       └── route.ts             # POST /api/synthesize-sense (main endpoint)
│   ├── components/
│   │   └── SensoryAgentUI.tsx       # Full-page client component (UI entry point)
│   ├── sense/
│   │   └── page.tsx                 # /sense route — renders SensoryAgentUI
│   └── layout.tsx                   # Root layout (minimal; wraps all pages)
├── lib/                             # All shared business logic and utilities
│   ├── sensoryValidation.ts         # Zod schemas — source of truth for all types
│   ├── sensoryPrompts.ts            # Claude prompt building + response parsing
│   ├── sensoryData.ts               # Wikipedia/venue enrichment fetching
│   ├── weatherData.ts               # OpenWeather API integration
│   ├── excitementEngine.ts          # Transcendence scoring and excitement hooks
│   ├── synthesisQueue.ts            # IndexedDB queue for deferred synthesis (iOS <15)
│   ├── deviceCapability.ts          # iOS version/chip detection and routing
│   ├── appleIntelligenceAdapter.ts  # Apple Intelligence synthesis adapter (mocked)
│   ├── phi3Adapter.ts               # Phi-3 Mini local synthesis adapter (mocked)
│   ├── venueCache.ts                # TTL in-memory cache for venue enrichment
│   ├── rateLimit.ts                 # In-memory sliding-window rate limiter
│   ├── telemetry.ts                 # Structured logging + session ID management
│   ├── validation.ts                # API response builders, CSRF, request ID utils
│   ├── uiComponents.tsx             # Reusable React UI primitives (Button, Card, etc.)
│   └── uiTheme.ts                   # Design tokens (colors, spacing, border radius)
├── tests/                           # All test suites
│   ├── unit/
│   │   └── lib/                     # Unit tests mirroring lib/ structure
│   │       ├── excitementEngine.test.ts
│   │       ├── sensoryData.test.ts
│   │       ├── sensoryPrompts.test.ts
│   │       ├── sensoryValidation.test.ts
│   │       └── weatherData.test.ts
│   ├── integration/
│   │   └── api/                     # Integration tests for the API route
│   │       ├── synthesize-sense.test.ts
│   │       ├── error-paths.test.ts
│   │       └── performance-scenarios.test.ts
│   ├── contract/
│   │   └── synthesize-sense.contract.test.ts  # API contract/schema tests
│   └── e2e/
│       └── sensory-agent.spec.ts    # End-to-end browser tests
├── scripts/                         # Developer tooling
│   ├── benchmark-sensory-agent.ts   # Performance benchmarking script
│   └── demo-sensory-agent.ts        # Demo/manual testing script
├── benchmarks/
│   └── establish-baselines.ts       # Baseline performance measurements
├── docs/                            # Architecture and product documentation
│   ├── sensory-agent-user-story.md  # Canonical spec (v2.8) — schema source
│   ├── sensory-agent-epics.md
│   ├── sensory-agent-implementation-scoping.md
│   ├── quality-evaluation-rubric.md
│   ├── evaluation-spreadsheet-template.md
│   ├── performance-metrics.md
│   └── sprint-1-venue-enrichment.md
├── .planning/
│   └── codebase/                    # GSD codebase analysis documents
├── next.config.js                   # Next.js config (CORS headers, env vars)
├── tsconfig.json                    # TypeScript config (strict mode, path aliases)
├── vitest.config.ts                 # Vitest test runner config
├── .eslintrc.json                   # ESLint rules
├── .env.example                     # Required environment variable template
├── demo.html                        # Standalone HTML demo (no build required)
├── package.json                     # Dependencies and npm scripts
└── README.md                        # Project overview and setup guide
```

## Directory Purposes

**`app/`:**
- Purpose: Next.js App Router application code — pages, layouts, and API routes
- Contains: One API route handler, one UI page, one root layout, one large client component
- Key files: `app/api/synthesize-sense/route.ts`, `app/components/SensoryAgentUI.tsx`

**`lib/`:**
- Purpose: All business logic, utilities, and shared modules; framework-agnostic where possible
- Contains: 15 TypeScript/TSX files covering validation, AI adapters, external APIs, caching, telemetry, and UI primitives
- Key files: `lib/sensoryValidation.ts` (type contracts), `lib/sensoryPrompts.ts` (Claude integration), `lib/excitementEngine.ts` (scoring)

**`tests/`:**
- Purpose: Test suite organized by test type (unit → integration → contract → e2e)
- Contains: Vitest-based unit and integration tests; e2e spec; contract test
- Key files: `tests/unit/lib/sensoryValidation.test.ts`, `tests/integration/api/synthesize-sense.test.ts`

**`scripts/`:**
- Purpose: Developer scripts for benchmarking and manual demo testing
- Contains: Runnable TypeScript files (not part of production build)

**`benchmarks/`:**
- Purpose: Performance baseline scripts for establishing and tracking API latency targets
- Contains: `establish-baselines.ts`

**`docs/`:**
- Purpose: Product and architecture documentation; the canonical user story (`sensory-agent-user-story.md`) defines the schema used in `lib/sensoryValidation.ts`

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes
- Committed: No (in `.gitignore`)

**`.planning/`:**
- Purpose: GSD planning and codebase analysis artifacts
- Generated: By GSD commands
- Committed: Yes (planning artifacts tracked in git)

## Key File Locations

**Entry Points:**
- `app/api/synthesize-sense/route.ts`: The only API endpoint; handles all synthesis requests
- `app/sense/page.tsx`: The only UI page; delegates entirely to `SensoryAgentUI`
- `app/layout.tsx`: Root Next.js layout

**Configuration:**
- `next.config.js`: Next.js configuration (CORS headers, `NEXT_PUBLIC_APP_NAME`)
- `tsconfig.json`: TypeScript config with path aliases (`@/*`, `@/lib/*`, `@/app/*`, `@/tests/*`)
- `vitest.config.ts`: Test runner configuration
- `.eslintrc.json`: Linting rules
- `.env.example`: Documents required environment variables

**Core Logic:**
- `lib/sensoryValidation.ts`: Zod schemas — the single source of truth for all data shapes; edit this when changing the data model
- `lib/sensoryPrompts.ts`: Claude prompt templates and response parsing
- `lib/sensoryData.ts`: Wikipedia API integration for venue enrichment
- `lib/weatherData.ts`: OpenWeather API integration
- `lib/excitementEngine.ts`: Transcendence and excitement scoring algorithms
- `lib/deviceCapability.ts`: iOS device routing logic

**Caching and Infrastructure:**
- `lib/venueCache.ts`: In-memory TTL cache (singleton exported as `venueCache`)
- `lib/rateLimit.ts`: In-memory sliding-window rate limiter
- `lib/telemetry.ts`: Structured logging and session management

**UI:**
- `app/components/SensoryAgentUI.tsx`: Full client-side UI (~1300 lines); contains multiple sub-components
- `lib/uiComponents.tsx`: Reusable primitives (Button, Card, Pill, Input, LoadingState, Divider, EmotionTag)
- `lib/uiTheme.ts`: Design tokens (THEME, SPACING, BORDER_RADIUS)

**Testing:**
- `tests/unit/lib/`: Unit test files, one per lib module
- `tests/integration/api/`: Integration tests for the API route including error paths and performance
- `tests/contract/synthesize-sense.contract.test.ts`: Schema contract validation
- `tests/e2e/sensory-agent.spec.ts`: Browser-level end-to-end test

## Naming Conventions

**Files:**
- Library modules: camelCase (e.g., `sensoryValidation.ts`, `excitementEngine.ts`, `rateLimit.ts`)
- React components: PascalCase (e.g., `SensoryAgentUI.tsx`, `uiComponents.tsx`)
- Test files: mirror source filename + `.test.ts` suffix for unit/integration (e.g., `excitementEngine.test.ts`); `.spec.ts` for e2e (e.g., `sensory-agent.spec.ts`); `.contract.test.ts` for contract tests
- Route files: Next.js convention `route.ts`

**Directories:**
- kebab-case for multi-word directories (e.g., `synthesize-sense/`, `unit/lib/`)
- lowercase single-word (e.g., `app/`, `lib/`, `tests/`)

**Exports:**
- Named exports throughout (no default exports from lib modules)
- API route: named export `export async function POST(...)`
- Pages: default export (Next.js requirement)
- Singletons: exported as named const (e.g., `export const venueCache = new VenueCache()`)

**Types:**
- Zod schemas: PascalCase + `Schema` suffix (e.g., `SensoryInputSchema`, `MomentSenseSchema`)
- Inferred types: PascalCase without suffix (e.g., `type SensoryInput = z.infer<typeof SensoryInputSchema>`)
- Enums: PascalCase + `Enum` suffix for Zod enum (e.g., `LightingEnum`); inferred type without suffix (e.g., `type Lighting`)

## Where to Add New Code

**New API endpoint:**
- Create `app/api/{endpoint-name}/route.ts` following the pattern in `app/api/synthesize-sense/route.ts`
- Add validation schemas to `lib/sensoryValidation.ts` or a new validation file
- Add utility functions to a new `lib/{feature}.ts` module

**New lib module:**
- Implementation: `lib/{moduleName}.ts`
- Unit test: `tests/unit/lib/{moduleName}.test.ts`
- Import using path alias: `import { ... } from '@/lib/{moduleName}'`

**New UI page:**
- Page component: `app/{page-name}/page.tsx`
- Supporting client component: `app/components/{ComponentName}.tsx`

**New reusable UI primitive:**
- Add to `lib/uiComponents.tsx` following the existing `React.forwardRef` pattern
- Add any new design tokens to `lib/uiTheme.ts`

**New external API integration:**
- Implement as `lib/{serviceName}Data.ts` or `lib/{serviceName}Adapter.ts`
- Add response schema to `lib/sensoryValidation.ts`
- Add caching if needed (follow `lib/venueCache.ts` pattern)
- Add unit test in `tests/unit/lib/`
- Add integration test in `tests/integration/api/`

**New synthesis engine adapter:**
- Create `lib/{engine}Adapter.ts` implementing the `(input: SensoryInput, momentId: string) => Promise<MomentSense>` signature
- Register in device routing logic in `app/api/synthesize-sense/route.ts`

**Utilities:**
- Shared helpers: `lib/validation.ts` (API/request utilities) or a new `lib/{concern}.ts` module
- Scripts for one-off tasks: `scripts/{task-name}.ts`

## Special Directories

**`.next/`:**
- Purpose: Next.js build artifacts, webpack chunks, server app pages
- Generated: Yes (by `next build` / `next dev`)
- Committed: No

**`node_modules/`:**
- Purpose: Installed npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No

**`.planning/`:**
- Purpose: GSD orchestration artifacts (phase plans, codebase analysis)
- Generated: By GSD commands
- Committed: Yes

**`docs/`:**
- Purpose: Canonical product specifications and implementation guides; `docs/sensory-agent-user-story.md` is the authoritative schema definition referenced in `lib/sensoryValidation.ts`
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-02-16*
