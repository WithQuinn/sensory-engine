# Sensory Engine - Phase 1: Production Readiness Roadmap

**Objective:** Make Sensory Engine production-ready and mergeable back into Travel repo
**Blocker:** Issue #69 requirements
**Target:** All Phase 1 work complete

---

## PRIORITY MATRIX

### 🔴 CRITICAL (Blocks Deployment) - 3 items

| # | Issue | Effort | Impact | Status |
|---|-------|--------|--------|--------|
| **C1** | Create missing lib files (rateLimit, telemetry, validation) | 4-6h | 🔥 App crashes without these | ⏳ TODO |
| **C2** | Add Zod validation to external API responses | 2-3h | 🔥 Data corruption risk | ⏳ TODO |
| **C3** | Add Zod validation to Claude API responses | 1-2h | 🔥 Invalid output responses | ⏳ TODO |

### 🟠 HIGH PRIORITY (Security/Correctness) - 6 items

| # | Issue | Effort | Impact | Status |
|---|-------|--------|--------|--------|
| **H1** | Implement CSRF protection | 2-3h | 🚨 Security vulnerability | ⏳ TODO |
| **H2** | Move hardcoded Claude model to env config | 1-2h | 🚨 Operational inflexibility | ⏳ TODO |
| **H3** | Add coordinate bounds validation (-90/90 lat, -180/180 lon) | 0.5h | ⚠️ Invalid API calls | ⏳ TODO |
| **H4** | Add aggregate timeout protection (max 30s per request) | 2-3h | ⚠️ Request hanging | ⏳ TODO |
| **H5** | Structured logging (no sensitive data in logs) | 2-3h | ⚠️ Information disclosure | ⏳ TODO |
| **H6** | Expand error path test coverage (40→70%) | 6-8h | ⚠️ Unknown failure modes | ⏳ TODO |

### 🟡 MEDIUM PRIORITY (Reliability/Quality) - 7 items

| # | Issue | Effort | Impact | Status |
|---|-------|--------|--------|--------|
| **M1** | Add cache size limits + TTL cleanup | 2-3h | 💾 Memory leak risk | ⏳ TODO |
| **M2** | Environment variable validation at startup | 1-2h | 🔧 Config failures late | ⏳ TODO |
| **M3** | Better exception handling (specific error types) | 1-2h | 🐛 Difficult debugging | ⏳ TODO |
| **M4** | Fix unsafe type assertions | 1-2h | 🎨 Data accuracy | ⏳ TODO |
| **M5** | Missing feature: isFirstVisit tracking | 3-4h | 📊 Scoring inaccuracy | ⏳ TODO |
| **M6** | API documentation/OpenAPI spec | 2-3h | 📖 Client integration | ⏳ TODO |
| **M7** | Remove other hardcoded values | 1h | 🔧 Code cleanliness | ⏳ TODO |

### 🟢 LOW PRIORITY (Nice to Have) - 3 items

| # | Issue | Effort | Impact | Status |
|---|-------|--------|--------|--------|
| **L1** | Optimize companion lookup | 0.5h | ⚡ Minor perf | ⏳ TODO |
| **L2** | Fix date/year extraction patterns | 0.5h | 📅 Data accuracy | ⏳ TODO |
| **L3** | Refactor hardcoded mappings | 1h | 🧹 Code quality | ⏳ TODO |

---

## PHASE 1 ROADMAP - Suggested Implementation Order

### **Week 1: Unblock Deployment (28-32 hours)**

#### Sprint 1.1: Infrastructure (Day 1-2) - 8-10 hours
**Goal:** Get app to run without crashes

- [ ] **C1.1** Create `lib/rateLimit.ts` (2h)
  - Implement rate limit check function
  - Return rate limit headers
  - Support optional bypass for testing

- [ ] **C1.2** Create `lib/telemetry.ts` (2h)
  - Implement structured logging
  - PostHog event tracking
  - Error event tracking

- [ ] **C1.3** Create `lib/validation.ts` (2h)
  - Export unified error response schema
  - Response builders for consistency
  - Validation utilities

- [ ] **H2** Move Claude model to env config (1h)
  - Add `CLAUDE_MODEL` env variable
  - Default to `claude-sonnet-4-20250514`
  - Load at startup

**Deliverable:** App runs without missing module errors

---

#### Sprint 1.2: Response Validation (Day 3-4) - 8-10 hours
**Goal:** Ensure all external data is validated before use

- [ ] **C2** Zod validation for external API responses (2-3h)
  - Add `WeatherResponseSchema` validation in weatherData.ts
  - Add `WikipediaDataSchema` validation in sensoryData.ts
  - Handle validation errors gracefully

- [ ] **C3** Zod validation for Claude API responses (1-2h)
  - Validate Claude response against `SynthesisOutput` schema in `parseSynthesisResponse()`
  - Return null with specific error if validation fails
  - Add tests for invalid responses

- [ ] **H3** Coordinate bounds validation (0.5h)
  - Add min/max validators to sensoryValidation.ts
  - lat: -90 to 90, lon: -180 to 180
  - Test edge cases (poles, international date line)

- [ ] **H1** Implement CSRF protection (2-3h)
  - Check origin header against whitelist
  - Implement CSRF token validation for POST
  - Test cross-origin requests blocked

**Deliverable:** All external data validated, CSRF protected, API hardened

---

#### Sprint 1.3: Testing Foundation (Day 5) - 6-8 hours
**Goal:** Achieve 70%+ test coverage for error paths

- [ ] **H6.1** Expand weatherData tests (2h)
  - Test malformed API response
  - Test missing API key
  - Test timeout scenarios
  - Test coordinate edge cases

- [ ] **H6.2** Expand sensoryData tests (2h)
  - Test Wikipedia API failures
  - Test invalid search results
  - Test cache hit/miss

- [ ] **H6.3** Expand sensoryPrompts tests (1-2h)
  - Test invalid Claude response formats
  - Test missing required fields
  - Test response parsing edge cases

- [ ] **H6.4** Expand integration tests (1-2h)
  - Test API with invalid inputs
  - Test rate limiting
  - Test error responses

**Deliverable:** 70%+ error path coverage, critical scenarios tested

---

**Week 1 Subtotal: 28-32 hours**

### **Week 2: Production Hardening (22-26 hours)**

#### Sprint 2.1: Reliability & Observability (Day 1-2) - 8-10 hours
**Goal:** Ensure production visibility and graceful degradation

- [ ] **H4** Add aggregate timeout protection (2-3h)
  - Set 30-second max total request time
  - Cancel all pending operations on timeout
  - Return partial results or error gracefully
  - Test timeout scenarios

- [ ] **H5** Structured logging (2-3h)
  - Implement structured logger (JSON format)
  - Remove sensitive data from logs
  - Add request/response logging (without PII)
  - Wire up to existing telemetry

- [ ] **M1** Cache size limits (2-3h)
  - Implement LRU cache with max size (1000 entries)
  - Add TTL-based cleanup (background task)
  - Monitor cache size metrics

- [ ] **M2** Environment variable validation (1h)
  - Create startup validation script
  - Check required env vars: ANTHROPIC_API_KEY, OPENWEATHER_API_KEY
  - Fail fast with clear messages

**Deliverable:** Production-ready observability, memory safe, config validated

---

#### Sprint 2.2: Code Quality & Data Accuracy (Day 3-4) - 8-10 hours
**Goal:** Fix data accuracy issues and improve maintainability

- [ ] **M3** Better exception handling (1-2h)
  - Create specific error types (NetworkError, TimeoutError, ValidationError)
  - Catch specific errors, not generic Error
  - Add retry logic where appropriate

- [ ] **M4** Fix unsafe type assertions (1-2h)
  - Remove hardcoded engagement_level
  - Calculate based on sentiment analysis
  - Validate all companion relationships

- [ ] **M5** Implement isFirstVisit tracking (3-4h)
  - Store visit history in database (or request param)
  - Track venue visits per user
  - Update scoring to use actual visit history
  - Add tests for scoring differences

- [ ] **M7** Remove other hardcoded values (1h)
  - Audit all hardcoded strings
  - Move to configuration or calculation
  - Document any assumptions

**Deliverable:** Data accuracy improved, scoring works correctly

---

#### Sprint 2.3: Documentation & Integration (Day 5) - 6-8 hours
**Goal:** Enable other teams to integrate with Sensory Engine

- [ ] **M6.1** Create API documentation (2-3h)
  - Document POST /api/synthesize-sense endpoint
  - Document request/response schemas with examples
  - Document error codes and handling

- [ ] **M6.2** Create OpenAPI spec (2-3h)
  - Generate OpenAPI 3.0 spec
  - Include all schemas and response codes
  - Enable auto-generating client SDKs

- [ ] **M6.3** Integration guide (1-2h)
  - How to call API from Travel repo
  - Error handling best practices
  - Example integration code

**Deliverable:** Complete API documentation, integration ready

---

**Week 2 Subtotal: 22-26 hours**

### **Week 3: Final Polish (8-10 hours)**

#### Sprint 3.1: Optimization & Edge Cases (Day 1-3) - 6-8 hours

- [ ] **L1** Optimize companion lookup (0.5h)
- [ ] **L2** Fix date/year extraction patterns (0.5h)
- [ ] **L3** Refactor hardcoded mappings (1h)
- [ ] Add edge case tests (4-6h)
  - Empty inputs
  - Missing optional fields
  - Large inputs (100 photos, 10 companions)
  - Concurrent requests

#### Sprint 3.2: Final Validation (Day 4-5) - 2-2 hours

- [ ] Run full test suite
- [ ] Type check passing
- [ ] Lint passing
- [ ] Manual testing on staging
- [ ] Security audit of changes

---

**Week 3 Subtotal: 8-10 hours**

---

## TOTAL EFFORT ESTIMATE

| Category | Hours | Days (8h/day) |
|----------|-------|---------------|
| Week 1 (Critical/Blocking) | 28-32 | 3.5-4 |
| Week 2 (Security/Quality) | 22-26 | 2.75-3.25 |
| Week 3 (Polish) | 8-10 | 1-1.25 |
| **TOTAL** | **58-68 hours** | **7.25-8.5 days** |

**Calendar Time:** 2-3 weeks (with 1-2 day buffer for testing/fixes)

---

## DEPENDENCY CHAIN

```
Week 1 CRITICAL (C1, C2, C3, H1)
  ↓
Week 1 TESTING (H6 - needs infrastructure)
  ↓
Week 2 HARDENING (H4, H5, M1, M2)
  ↓
Week 2 QUALITY (M3-M7)
  ↓
Week 3 POLISH (L1-L3)
  ↓
READY TO MERGE ✅
```

---

## GO/NO-GO CRITERIA FOR EACH PHASE

### Week 1 GO Criteria
- ✅ App starts without errors
- ✅ All external API responses validated with Zod
- ✅ CSRF protection in place
- ✅ Claude model configurable via env
- ✅ 70%+ test coverage for critical paths
- ✅ No missing imports or module errors

### Week 2 GO Criteria
- ✅ All tests passing (666+)
- ✅ Structured logging in place
- ✅ Request timeout < 30 seconds
- ✅ Cache memory-safe with size limits
- ✅ Environment variables validated at startup
- ✅ Scoring logic uses real data (isFirstVisit, engagement_level)

### Week 3 GO Criteria
- ✅ API documentation complete
- ✅ OpenAPI spec generated
- ✅ Type check passing
- ✅ Lint passing
- ✅ Manual smoke tests passed
- ✅ Ready to merge PR to main

---

## RECOMMENDED TEAM ASSIGNMENT

**Option A: Solo (Recommended for you)**
- Takes 7.25-8.5 days of focused work
- Can parallelize some tasks (tests while waiting for other fixes)
- Good understanding of entire codebase

**Option B: Two-person team**
- Person 1: Infrastructure (C1, C2, C3, H1, H4, H5)
- Person 2: Quality (M1-M7, L1-L3)
- Parallel work, 4-5 days total
- Requires good communication

---

## NEXT STEPS

1. **Review this roadmap** - Does the priority order make sense?
2. **Choose team structure** - Solo or with help?
3. **Pick start date** - Begin Week 1 immediately?
4. **Schedule milestones** - When do you want Weekly 1 GO/NO-GO?

---

## AFTER PHASE 1 COMPLETE

Once Phase 1 is done (all 3 weeks):
1. ✅ Create PR: `sensory-agent-dev` → `main`
2. ✅ Merge back into Travel repo
3. ✅ Deploy to Vercel
4. ✅ Users can now synthesize memories
5. ✅ **THEN** start Sprint 2 (Claude optimization)
6. ✅ **THEN** proceed with performance optimization

---

**Phase 1 is the foundation. Phase 2+ (optimization) builds on this solid base.**
