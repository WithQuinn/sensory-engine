# Technology Stack

**Analysis Date:** 2026-02-16

## Languages

**Primary:**
- TypeScript 5.3+ - All application code (`app/`, `lib/`, `tests/`)
- TSX - React components (`app/components/SensoryAgentUI.tsx`, `app/layout.tsx`, `lib/uiComponents.tsx`)

**Secondary:**
- HTML - Static demo page (`demo.html`)

## Runtime

**Environment:**
- Node.js >= 18.0.0 (required by `engines` in `package.json`)

**Package Manager:**
- npm >= 9.0.0
- Lockfile: `package-lock.json` (present)

**Module System:**
- ESModules (`"type": "module"` in `package.json`)

## Frameworks

**Core:**
- Next.js 14.x - Full-stack React framework (`next.config.js`, App Router pattern in `app/`)
- React 18.x - UI library (`app/components/`, `lib/uiComponents.tsx`)

**Testing:**
- Vitest 1.x - Unit/integration test runner (`vitest.config.ts`)
- Playwright 1.40+ - E2E testing (`tests/e2e/`)
- `@testing-library/react` 14.x - Component testing utilities

**Build/Dev:**
- SWC - Compiler/minifier (enabled via `swcMinify: true` in `next.config.js`)
- TypeScript compiler with incremental builds (`tsconfig.json` has `"incremental": true`)
- ESLint 6+ with TypeScript rules (`.eslintrc.json`)

## Key Dependencies

**Critical:**
- `@anthropic-ai/sdk` ^0.24.0 - Primary AI synthesis engine; used in `app/api/synthesize-sense/route.ts` to call Claude claude-sonnet-4-20250514 for narrative generation
- `zod` ^3.22.4 - Runtime validation for all inputs/outputs; used extensively in `lib/sensoryValidation.ts`, `lib/weatherData.ts`, `lib/sensoryData.ts`, `lib/validation.ts`

**Infrastructure:**
- `next` ^14.0.0 - App Router, API Routes, server-side rendering
- `react` / `react-dom` ^18.0.0 - Component rendering

## Configuration

**Environment:**
- Configuration via environment variables (see `.env.example` for full list)
- Key required vars:
  - `ANTHROPIC_API_KEY` - Claude API key (sk-ant-...)
  - `OPENWEATHER_API_KEY` - OpenWeather API key
  - `ALLOWED_ORIGINS` - Comma-separated CSRF-allowed origins (e.g. `http://localhost:3000`)
- Optional vars:
  - `CLAUDE_MODEL` - Model override (default: `claude-sonnet-4-20250514`)
  - `RATE_LIMIT_BYPASS_TOKEN` - Bypass rate limiting in tests
  - `CSRF_SECRET` - Future token-based CSRF validation
  - `POSTHOG_API_KEY` - Analytics (not yet wired up)
  - `NODE_ENV` - `development` | `production`

**Build:**
- `next.config.js` - Next.js configuration (strict mode, SWC minification, CORS headers for `/api/*`)
- `tsconfig.json` - TypeScript configuration (strict mode, ES2020 target, path aliases `@/*`, `@/lib/*`, `@/app/*`, `@/tests/*`)
- `.eslintrc.json` - ESLint with `@typescript-eslint` recommended rules
- `vitest.config.ts` - Vitest with Node environment, `@` path alias

**TypeScript Strictness:**
- Full strict mode enabled: `strict`, `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `noUnusedLocals`, `noUnusedParameters`

## Platform Requirements

**Development:**
- Node.js >= 18.0.0, npm >= 9.0.0
- `npm run dev` starts Next.js dev server
- `npm run test:unit` runs Vitest unit + integration tests
- `npm run test:e2e` runs Playwright end-to-end tests
- `npm run benchmark` runs `benchmarks/establish-baselines.ts` via tsx

**Production:**
- Next.js server deployment (standard `next build` + `next start`)
- No containerization or cloud-provider-specific config detected
- Deployed build output in `.next/` directory

---

*Stack analysis: 2026-02-16*
