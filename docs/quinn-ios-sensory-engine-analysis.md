# Sensory Engine Alignment Analysis for Quinn iOS

**Date:** 2026-02-23
**Author:** Claude Opus (analysis session)
**Purpose:** Assess alignment between Sensory Engine (web) and V2 iOS user stories

---

## Repos Analyzed

| Repo | Location | Status |
|------|----------|--------|
| **Sensory Engine** | `github.com/WithQuinn/sensory-engine` (main branch) | Phase 1 Production-Ready (68% complete) |
| **Travel (Fact Agent)** | `github.com/WithQuinn/travel` (feature/profile-agent) | Production on Vercel |
| **V2 User Stories** | `/Users/sachinverma/Downloads/Quinn-iOS-User-Stories-v2.md` | Draft (Opus review) |

---

## Sensory Engine: What's Built

### Production Code (318 tests passing)

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| Zod Schema System | `lib/sensoryValidation.ts` | 764 | Production -- SensoryInput, MomentSense, TranscendenceFactors, CloudEnrichment, LocalAnalysisResult. Forward-compatible with iOS PHAsset IDs. |
| Claude Narrative Synthesis | `lib/sensoryPrompts.ts` | 704 | Production -- Full prompt engineering with 7 emotion-specific tones. Anti-cliche enforcement. Show-don't-tell guidelines. |
| Transcendence Scoring | `lib/excitementEngine.ts` | 352 | Production -- 8-factor weighted formula calibrated through scenario analysis. |
| Wikipedia Venue Enrichment | `lib/sensoryData.ts` | ~400 | Optimized -- Multi-strategy fallback (95% success), 24hr TTL cache, parallel API calls (50% faster). |
| Weather Integration | `lib/weatherData.ts` | ~200 | Production -- OpenWeather API with 11km coordinate coarsening for privacy. |
| Fallback Narrative Engine | `lib/sensoryPrompts.ts` | ~300 | Production -- Emotion-aware narratives from metadata alone when Claude fails. |
| Device Capability Routing | `lib/deviceCapability.ts` | 147 | Designed -- Apple Intelligence / Phi-3 / Queue routing by iOS version + chip. |
| API Endpoint | `app/api/synthesize-sense/route.ts` | 210 | Production -- CSRF, rate limiting, Zod validation, structured logging. |
| Rate Limiting | `lib/rateLimit.ts` | 108 | Production -- 30 req/min sliding window. |
| Telemetry | `lib/telemetry.ts` | 207 | Production -- Structured logging with PII redaction. |

### Hybrid Privacy Model (Already Implemented)

```
ON-DEVICE (never transmitted):
├── Raw photos
├── Raw audio / voice notes
├── Verbatim transcript text
├── GPS coordinates (precise)
└── Video files

SENT TO CLAUDE (metadata only):
├── Photo: scene_type, lighting, face_count, crowd_level, energy_level, basic_emotion
├── Audio: sentiment_score (-1 to 1), detected_tone, keywords (topics, NOT verbatim), theme
├── Venue: name, category (from user input or enrichment)
├── Weather: condition, temperature, comfort_score (coarsened coordinates)
├── Context: local_time, is_golden_hour, is_weekend, duration_minutes
└── Companions: relationship, age_group (no names in synthesis prompt)
```

### Key Schemas (Forward-Compatible with iOS)

**SensoryInput** -- What client sends:
- `photos.refs[].local_id` -- Already typed for PHAsset identifiers
- `detection.trigger` -- Enum includes 'dwell' (geofence), 'photos', 'calendar', 'manual'
- `preferences.enable_cloud_synthesis` -- Toggle for offline mode

**MomentSense** -- Complete synthesized memory:
- `narratives.short/medium/full` -- Three lengths of evocative prose
- `memory_anchors` -- sensory, emotional, unexpected, shareable, family
- `transcendence_score` (0-1) + `transcendence_factors`
- `sensory_details` -- visual, audio, scent (inferred), tactile (inferred)
- `emotion_tags[]` + `primary_emotion` + `emotion_confidence`
- `atmosphere` -- lighting, energy, setting, crowd_feel
- `processing` -- local_percentage, cloud_calls, tier

**TranscendenceFactors** -- 8-factor weighted scoring:
- emotion_intensity (30%), fame_score (15%), atmosphere_quality (12%)
- novelty_factor (12%), companion_engagement (12%), intent_match (10%)
- weather_match (5%), surprise_factor (4%)

---

## Alignment with V2 User Stories

### Direct Matches

| V2 Concept | SE Equivalent | Reuse Strategy |
|------------|---------------|----------------|
| Sensory Anchors (Sound/Light/Time) | `memoryAnchors.sensory_anchor` + `inferredSensory` | Port schema to SwiftData, keep Claude prompt |
| Emotion Tags (Still, Wonder, Solitude) | `emotion_tags[]` + `primaryEmotion` + 7 calibrated types | Direct port |
| Quinn's Draft Narrative | `narratives.short/medium/full` | Keep API, consume from iOS |
| Memory Card | `MomentSense` schema | SwiftData @Model from Zod schema |
| Highlight Detection | `transcendenceScore >= 0.7` | Port algorithm to Swift |
| Photo Analysis Signals | `LocalAnalysisResult.photo_analysis` | Schema ready, needs Vision framework |
| Voice Note Metadata | `audio_analysis` (sentiment, tone, keywords) | Schema ready, needs Speech framework |
| Arrival Detection | `detection.trigger = 'dwell'` | Schema supports it, needs CoreLocation |
| Privacy Architecture | Metadata-only to cloud | Already implemented correctly |

### Gaps (iOS-Specific, Not in SE)

| Gap | V2 Story | Complexity | Notes |
|-----|----------|------------|-------|
| CoreLocation geofencing | US-201 | High | CLCircularRegion, 20 geofence limit, background modes |
| PhotoKit integration | US-201 | Medium | PHAsset date-range queries, time-window matching |
| Vision framework | US-302 | Medium | VNClassifyImageRequest, scene/lighting/crowd analysis |
| Speech framework | US-202 | Medium | SFSpeechRecognizer on-device mode |
| SwiftData persistence | All stories | Medium | Schema migration strategy needed |
| SwiftUI three-tab nav | All stories | Low | Discover / Capture / Memories |
| Background processing | US-201 | High | BGTaskScheduler, background location |
| First Run / Onboarding | US-001, US-002 | Low-Medium | UI only, uses existing venue API |

---

## Decision: Narrative Generation Strategy

**Resolved by Sensory Engine architecture:**

On-device CoreML extracts structured metadata from photos (Vision) and voice (Speech). Only metadata is sent to Claude API. Claude returns evocative prose. Raw media never leaves device.

This satisfies:
- V2's "no photos or audio to cloud" requirement
- Quality prose ("The low percussion of bamboo in wind") via Claude
- Privacy claim: "Your photos, voice, and videos never leave your device"
- Offline fallback: template-based narratives from metadata alone

---

## Recommended iOS Build Strategy

1. **Deploy Sensory Engine** -- Replace Phi-3 mocks with real Claude calls (P0 in PROJECT.md)
2. **Build iOS capture layer** -- Vision, Speech, CoreLocation, PhotoKit populate existing schemas
3. **Port data models** -- Zod schemas → SwiftData @Model classes
4. **Build UI** -- Three-journeys mockup screens in SwiftUI
5. **Consume SE API** -- iOS app calls deployed Sensory Engine for narrative synthesis

---

**Analysis saved: 2026-02-23**
