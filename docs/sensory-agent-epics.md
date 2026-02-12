# Sensory Agent - Epics & Sub-Stories (v2)

## Revision Notes
- Split large E1 (Core Infrastructure) into focused epics
- Merged small epics into logical groupings
- Defined clear MVP milestones
- Added "Sprint-able" estimates
- Clearer dependencies

---

## Epic Overview

| Epic | Name | Size | Milestone | Dependencies |
|------|------|------|-----------|--------------|
| E1 | Schemas & Types | S | MVP | None |
| E2 | Photo Analysis | M | MVP | E1 |
| E3 | Synthesis API | M | MVP | E1, E2 |
| E4 | Sense UI | M | MVP | E3 |
| E5 | Venue Data | M | v1.1 | E1 |
| E6 | Weather | S | v1.1 | E5 |
| E7 | Excitement & Fame | S | v1.1 | E5 |
| E8 | Narratives & Anchors | M | v1.1 | E2, E3 |
| E9 | Audio & Voice | M | v1.2 | E3 |
| E10 | Companions | M | v1.3 | E2, Profile Agent |
| E11 | Intent & Trip Context | M | v1.3 | E5, Fact Agent |
| E12 | Recommendations | S | v1.3 | E5, E10 |

**Size Key:** S = 1-2 days, M = 3-5 days, L = 1+ week

---

## Milestones

### MVP: "Photo → Feeling" (E1-E4)
Upload photos + venue → Get emotions, atmosphere, basic narrative

**What ships:**
- Upload 1-10 photos
- Enter venue name + date
- Get: emotion tags, primary emotion, atmosphere, short narrative
- Basic transcendence score
- Working UI at `/sense`

**What's NOT in MVP:**
- Audio/voice notes
- Venue enrichment (Wikipedia, etc.)
- Weather integration
- Companion sensing
- Itinerary linking
- Recommendations

---

### v1.1: "Rich Context" (E5-E8)
Add venue intelligence, weather, fame, and polished narratives

**What ships:**
- Wikipedia/Google Places venue data
- Weather conditions
- Fame score + excitement hooks
- Memory anchors
- Full narrative (short/medium/full)
- Improved transcendence scoring

---

### v1.2: "Full Multi-Modal" (E9)
Add audio and voice note processing

**What ships:**
- Ambient audio analysis
- Voice note transcription
- Sentiment from voice
- Audio-informed narratives

---

### v1.3: "Personalized" (E10-E12)
Add companion awareness, intent matching, and recommendations

**What ships:**
- Link companions from Profile Agent
- Per-companion experience assessment
- Link itinerary from Fact Agent
- Intent match (met/exceeded/failed)
- Smart recommendations

---

## E1: Schemas & Types

**Goal:** Type-safe foundation for all sensory agent data.

**Size:** Small (1-2 days)

**Milestone:** MVP

### Stories

#### E1.1: Input Schemas
Define all input validation schemas.

```typescript
// What we're building:
SensoryMomentInputSchema {
  photos: File[] (1-10, max 10MB each)
  audio?: File (max 50MB, 5 min)
  voiceNote?: File (max 20MB, 2 min)
  venueName: string
  dateTime: ISO datetime
  timezone: string
  companions?: CompanionRef[]
  itineraryRef?: string
}
```

**Acceptance Criteria:**
- [ ] Photo validation (count, size, MIME types)
- [ ] Audio validation (size, duration, MIME types)
- [ ] Required vs optional fields clear
- [ ] Exported TypeScript types

---

#### E1.2: Output Schemas
Define the complete MomentSense output structure.

```typescript
// Core output (MVP)
MomentSenseSchema {
  momentId: uuid
  timestamp: ISO datetime
  venueName: string

  // Emotions
  emotionTags: string[] (3-5)
  primaryEmotion: string
  emotionConfidence: 0-1

  // Atmosphere
  atmosphere: {
    lighting: enum
    energy: enum
    setting: enum
    crowdFeel: enum
  }

  // Score
  transcendenceScore: 0-1

  // Narrative (MVP: short only)
  narratives: {
    short: string (<280 chars)
    medium?: string
    full?: string
  }

  // Processing metadata
  processing: {
    photosAnalyzed: number
    processingTimeMs: number
  }
}
```

**Acceptance Criteria:**
- [ ] All enums defined (lighting, energy, setting, crowd)
- [ ] Score ranges validated (0-1)
- [ ] Optional fields for progressive enhancement
- [ ] Matches user story appendix schema

---

#### E1.3: Enum Definitions
Define all classification enums.

**Acceptance Criteria:**
- [ ] `EmotionType`: awe, joy, peace, wonder, excitement, contentment, surprise, gratitude, nostalgia, frustration, disappointment, fatigue
- [ ] `LightingType`: golden_hour, bright, overcast, night, indoor_warm, indoor_cool
- [ ] `EnergyType`: tranquil, calm, lively, energetic, chaotic
- [ ] `SettingType`: outdoor, indoor, nature, urban, sacred, transit
- [ ] `CrowdType`: empty, sparse, moderate, busy, packed
- [ ] `VenueCategory`: landmark, dining, shopping, nature

---

## E2: Photo Analysis

**Goal:** Extract emotions and atmosphere from photos using Claude Vision.

**Size:** Medium (3-5 days)

**Milestone:** MVP

**Depends on:** E1

### Stories

#### E2.1: Single Photo Analysis
Analyze one photo for emotions and atmosphere.

**Acceptance Criteria:**
- [ ] Accept base64 image (JPEG, PNG, HEIC)
- [ ] Return: emotion_tags (3-5), primary_emotion, confidence
- [ ] Return: lighting, energy, setting, crowd_feel
- [ ] Return: visual_description (1-2 sentences)
- [ ] Processing < 3 seconds
- [ ] Handle photos without people
- [ ] Handle blurry/low-quality gracefully

**Prompt Structure:**
```
Analyze this travel photo. Extract:
1. Emotions (what feelings does this evoke?)
2. Atmosphere (lighting, energy, setting)
3. Visual description (evocative 1-2 sentences)

Return JSON only.
```

---

#### E2.2: Multi-Photo Aggregation
Combine analysis from multiple photos into unified result.

**Acceptance Criteria:**
- [ ] Analyze up to 10 photos (parallel)
- [ ] Aggregate emotions (weighted by confidence)
- [ ] Aggregate atmosphere (mode for each dimension)
- [ ] Combine visual descriptions
- [ ] Handle conflicting signals (some happy, some tired)

---

#### E2.3: Face & Group Detection
Detect people and group dynamics (without identification).

**Acceptance Criteria:**
- [ ] Count faces/people visible
- [ ] Group size: solo, couple, small_group (3-5), large_group (6+)
- [ ] Detect interactions: posing, pointing, laughing, resting
- [ ] Age groups present: child, adult, senior
- [ ] NO facial recognition or identification

---

#### E2.4: Photo Analysis Prompt
Create the Claude Vision prompt for photo analysis.

**Acceptance Criteria:**
- [ ] Structured output (JSON)
- [ ] Covers all required fields
- [ ] Handles edge cases in prompt
- [ ] Security: no prompt injection from image text
- [ ] File: `lib/sensoryPrompts.ts`

---

## E3: Synthesis API

**Goal:** Main API endpoint that orchestrates moment sensing.

**Size:** Medium (3-5 days)

**Milestone:** MVP

**Depends on:** E1, E2

### Stories

#### E3.1: API Route Setup
Create the POST endpoint with validation and rate limiting.

**Acceptance Criteria:**
- [ ] Route: `POST /api/synthesize-sense`
- [ ] Accept multipart form data
- [ ] Validate input against schema (E1)
- [ ] Rate limit: 10/minute
- [ ] CSRF protection
- [ ] Return MomentSense or error

---

#### E3.2: Photo Processing Pipeline
Process uploaded photos through Claude Vision.

**Acceptance Criteria:**
- [ ] Convert uploaded files to base64
- [ ] Call photo analysis (E2) for each photo
- [ ] Aggregate results
- [ ] Track processing time

---

#### E3.3: Basic Transcendence Score
Calculate simple transcendence score from emotions.

**MVP Formula:**
```
transcendence =
  emotion_intensity * 0.5 +    // How strong is the primary emotion?
  atmosphere_quality * 0.3 +   // How good is the atmosphere?
  photo_count_factor * 0.2     // More photos = more memorable?
```

**Acceptance Criteria:**
- [ ] Score 0.0 to 1.0
- [ ] Higher for strong positive emotions
- [ ] Lower for negative emotions or uncertainty
- [ ] Explain in response (top factors)

---

#### E3.4: Basic Narrative Generation
Generate short narrative from analysis.

**Acceptance Criteria:**
- [ ] < 280 characters
- [ ] Include venue name
- [ ] Include primary emotion
- [ ] Evocative, not generic
- [ ] Example: "Morning light at Senso-ji. The incense, the crowds, the ancient calm—a moment of pure awe."

---

#### E3.5: Error Handling & Degradation
Handle failures gracefully.

**Acceptance Criteria:**
- [ ] If Claude fails: return partial results + error flag
- [ ] If 1 photo fails: continue with others
- [ ] If all photos fail: return error with helpful message
- [ ] Timeout after 30 seconds
- [ ] Never expose internal errors to client

---

## E4: Sense UI

**Goal:** Frontend interface for capturing moments.

**Size:** Medium (3-5 days)

**Milestone:** MVP

**Depends on:** E3

### Stories

#### E4.1: Page Route
Create the `/sense` route.

**Acceptance Criteria:**
- [ ] Route: `app/sense/page.tsx`
- [ ] Renders SensoryAgentUI component
- [ ] Matches app styling

---

#### E4.2: Photo Upload
Multi-photo upload with preview.

**Acceptance Criteria:**
- [ ] Drag & drop zone
- [ ] Click to select files
- [ ] Accept JPEG, PNG, HEIC
- [ ] 1-10 photos required
- [ ] Max 10MB per photo
- [ ] Thumbnail preview
- [ ] Remove individual photos
- [ ] Reorder capability (optional)

---

#### E4.3: Venue & DateTime Input
Basic moment metadata.

**Acceptance Criteria:**
- [ ] Venue name text input
- [ ] Google Places autocomplete (optional enhancement)
- [ ] Date picker
- [ ] Time picker
- [ ] Timezone auto-detect

---

#### E4.4: Submit & Loading
Handle form submission.

**Acceptance Criteria:**
- [ ] Submit button with validation
- [ ] Loading state with progress
- [ ] "Analyzing your moment..." messaging
- [ ] Cancel capability

---

#### E4.5: Results Display
Show the MomentSense output.

**Acceptance Criteria:**
- [ ] Primary emotion (large, prominent)
- [ ] Emotion tags (pill/chip style)
- [ ] Atmosphere summary
- [ ] Transcendence score (visual: ★ rating or percentage)
- [ ] Short narrative (copy button)
- [ ] "Capture another moment" action

---

#### E4.6: Telemetry Integration
Track usage events.

**Acceptance Criteria:**
- [ ] `moment_capture_started`
- [ ] `photos_uploaded` (count)
- [ ] `synthesis_requested`
- [ ] `synthesis_completed` (time, score)
- [ ] `synthesis_failed` (error type)
- [ ] `narrative_copied`

---

## E5: Venue Data

**Goal:** Enrich moments with venue context from external sources.

**Size:** Medium (3-5 days)

**Milestone:** v1.1

**Depends on:** E1

### Stories

#### E5.1: Venue Category Classification
Auto-detect venue type.

**Acceptance Criteria:**
- [ ] Categories: landmark, dining, shopping, nature
- [ ] Infer from name + Google Places types
- [ ] Confidence score
- [ ] Handle ambiguous (temple that's also garden)

---

#### E5.2: Wikipedia Fetching
Get historical/cultural data.

**Acceptance Criteria:**
- [ ] Search Wikipedia API by venue name + location
- [ ] Extract: summary, founding date, significance
- [ ] Handle multiple results (pick best match)
- [ ] Handle no results gracefully
- [ ] Cache for 7 days

---

#### E5.3: Google Places Enrichment
Get practical venue data.

**Acceptance Criteria:**
- [ ] Fetch: rating, review_count, price_level
- [ ] Fetch: address, types
- [ ] Use existing venue-details patterns
- [ ] Cache for 24 hours

---

#### E5.4: Venue Data API Route
Separate endpoint for venue enrichment.

**Acceptance Criteria:**
- [ ] Route: `POST /api/fetch-venue-data`
- [ ] Input: venue_name, location
- [ ] Output: category, wikipedia_summary, google_data
- [ ] Can be called independently of synthesis

---

## E6: Weather

**Goal:** Add weather context to moments.

**Size:** Small (1-2 days)

**Milestone:** v1.1

**Depends on:** E5 (for location)

### Stories

#### E6.1: OpenWeather Integration
Fetch weather for location + time.

**Acceptance Criteria:**
- [ ] Current weather for live moments
- [ ] Historical weather for past moments (if API supports)
- [ ] Return: condition, temp, feels_like, humidity
- [ ] Return: wind, visibility
- [ ] Cache for 1 hour

---

#### E6.2: Comfort Score
Calculate outdoor comfort.

**Acceptance Criteria:**
- [ ] Score 0.0 to 1.0
- [ ] Factors: temp (ideal 18-24°C), humidity (<70%), no rain
- [ ] Explain: "Perfect spring weather" or "Too hot and humid"

---

#### E6.3: Golden Hour Detection
Detect special lighting conditions.

**Acceptance Criteria:**
- [ ] Calculate sunrise/sunset for location + date
- [ ] Golden hour = within 1 hour of either
- [ ] Return: is_golden_hour, minutes_to_golden_hour
- [ ] Factor into atmosphere analysis

---

## E7: Excitement & Fame

**Goal:** Identify famous venues and generate excitement hooks.

**Size:** Small (1-2 days)

**Milestone:** v1.1

**Depends on:** E5 (Wikipedia data)

### Stories

#### E7.1: Fame Score
Calculate venue fame.

**Acceptance Criteria:**
- [ ] Score 0.0 to 1.0
- [ ] Signals: Wikipedia article length, infobox presence, "famous" keywords
- [ ] Thresholds: <0.3 local, 0.3-0.6 regional, >0.6 famous
- [ ] Return fame_signals array

---

#### E7.2: Unique Claims
Find superlatives.

**Acceptance Criteria:**
- [ ] Detect: oldest, largest, first, only, tallest
- [ ] Extract from Wikipedia summary
- [ ] Verify claim is about THIS venue
- [ ] Examples: "Tokyo's oldest temple"

---

#### E7.3: Excitement Hook
Generate compelling hook.

**Acceptance Criteria:**
- [ ] 1-2 sentences max
- [ ] Personalized: "You're standing where..."
- [ ] Based on fame signals + unique claims
- [ ] Example: "You're standing where shoguns prayed for 400 years"

---

## E8: Narratives & Anchors

**Goal:** Generate polished narratives and memorable anchors.

**Size:** Medium (3-5 days)

**Milestone:** v1.1

**Depends on:** E2, E3

### Stories

#### E8.1: Medium Narrative
Instagram-length caption.

**Acceptance Criteria:**
- [ ] 2-3 sentences
- [ ] More descriptive than short
- [ ] Works without seeing photo
- [ ] Includes specific sensory details

---

#### E8.2: Full Narrative
Journal/blog paragraph.

**Acceptance Criteria:**
- [ ] 100-200 words
- [ ] Full story arc
- [ ] Includes: setting, emotions, details
- [ ] Match tone to detected emotion

---

#### E8.3: Memory Anchors
Generate 5 types of anchors.

**Acceptance Criteria:**
- [ ] Sensory anchor: specific sensory detail ("incense smoke curling")
- [ ] Emotional anchor: peak emotional moment
- [ ] Unexpected anchor: surprise element
- [ ] Shareable anchor: social-media-worthy element
- [ ] Group anchor: collective memory (null if solo)

---

#### E8.4: Narrative Prompts
Claude prompts for narrative generation.

**Acceptance Criteria:**
- [ ] Prompt produces consistent quality
- [ ] Handles different emotion types appropriately
- [ ] Incorporates all available data (venue, weather, etc.)
- [ ] Never generic or clichéd

---

## E9: Audio & Voice

**Goal:** Process ambient audio and voice notes.

**Size:** Medium (3-5 days)

**Milestone:** v1.2

**Depends on:** E3

### Stories

#### E9.1: Audio Upload & Validation
Accept audio file uploads.

**Acceptance Criteria:**
- [ ] Accept MP3, M4A, WAV
- [ ] Max 5 minutes duration
- [ ] Max 50MB file size
- [ ] Duration detection on client

---

#### E9.2: Ambient Sound Analysis
Classify soundscape.

**Acceptance Criteria:**
- [ ] Types: nature, urban, crowd, music, sacred, quiet, traffic
- [ ] Energy: calm, moderate, lively, intense
- [ ] Audio description: "temple bells echoing, soft murmur of prayers"
- [ ] Use Claude for analysis

---

#### E9.3: Voice Note Transcription
Transcribe user reflection.

**Acceptance Criteria:**
- [ ] Accurate transcription (>95% for clear speech)
- [ ] Language detection
- [ ] Preserve original wording
- [ ] Extract sentiment: -1.0 to 1.0

---

#### E9.4: Quote Extraction
Find quotable phrases.

**Acceptance Criteria:**
- [ ] 1-2 key quotes from voice note
- [ ] < 50 words each
- [ ] Emotionally resonant
- [ ] Use in narratives

---

## E10: Companions

**Goal:** Personalize experience for each companion.

**Size:** Medium (3-5 days)

**Milestone:** v1.3

**Depends on:** E2, Profile Agent

### Stories

#### E10.1: Companion Linking
Connect to Profile Agent.

**Acceptance Criteria:**
- [ ] Fetch saved companions from Profile Agent
- [ ] Multi-select for moment
- [ ] Display key info (name, relationship, needs)
- [ ] Allow "solo" option

---

#### E10.2: Per-Companion Highlights
Generate highlight for each companion.

**Acceptance Criteria:**
- [ ] One highlight per companion
- [ ] Based on their interests + photo analysis
- [ ] Example: "Max was fascinated by the giant lantern"

---

#### E10.3: Needs Assessment
Check if companion needs were met.

**Acceptance Criteria:**
- [ ] Check dietary needs vs venue
- [ ] Check accessibility vs venue
- [ ] Flag concerns (vegetarian at sushi restaurant)
- [ ] Return: needs_met[], concerns[]

---

#### E10.4: Engagement Levels
Assess each companion's engagement.

**Acceptance Criteria:**
- [ ] Level: low, moderate, high, exceptional
- [ ] Infer from photos if possible
- [ ] Consider context (child at museum)

---

## E11: Intent & Trip Context

**Goal:** Connect moments to itinerary and trip journey.

**Size:** Medium (3-5 days)

**Milestone:** v1.3

**Depends on:** E5, Fact Agent

### Stories

#### E11.1: Itinerary Linking
Connect to Fact Agent.

**Acceptance Criteria:**
- [ ] Fetch parsed trips from Fact Agent
- [ ] Match venue to itinerary entry
- [ ] Show original plan for this venue

---

#### E11.2: Expectation Match
Compare actual vs planned.

**Acceptance Criteria:**
- [ ] Status: exceeded, met, partially, not_met
- [ ] Exceeded in: array of positives
- [ ] Fell short in: array of negatives
- [ ] Surprise factor: unexpected discoveries

---

#### E11.3: Trip Context
Track position in trip.

**Acceptance Criteria:**
- [ ] Day of trip, total days
- [ ] Trip phase: early, middle, late
- [ ] Venues visited today/trip
- [ ] Novelty factor (first temple vs fifth)

---

#### E11.4: Fatigue Estimation
Estimate tiredness.

**Acceptance Criteria:**
- [ ] Level: fresh, moderate, tired, exhausted
- [ ] Factors: day, venues today, time of day
- [ ] Child/senior adjusted separately

---

## E12: Recommendations

**Goal:** Suggest next actions based on moment.

**Size:** Small (1-2 days)

**Milestone:** v1.3

**Depends on:** E5, E10

### Stories

#### E12.1: Similar Venues
"More like this" suggestions.

**Acceptance Criteria:**
- [ ] 2-3 similar venues
- [ ] Based on category, vibe, what worked
- [ ] Include reason

---

#### E12.2: Contrast Venues
Suggest variety.

**Acceptance Criteria:**
- [ ] 1-2 contrasting experiences
- [ ] After temples → markets
- [ ] Explain the contrast

---

#### E12.3: Rest Assessment
Know when to stop.

**Acceptance Criteria:**
- [ ] Rest needed: boolean
- [ ] Reason: "Kids have been walking 3 hours"
- [ ] Nearby rest option

---

## Updated Transcendence Score

Integrated into E3 (basic) and enhanced in E8.

**Full Formula (v1.1+):**
```
transcendence =
  emotion_intensity * 0.25 +
  atmosphere_quality * 0.15 +
  novelty_factor * 0.15 +
  fame_score * 0.10 +
  weather_match * 0.10 +
  companion_engagement * 0.10 +
  intent_match * 0.10 +
  surprise_factor * 0.05
```

---

## Dependency Graph

```
E1 (Schemas)
├── E2 (Photos) ──────┬── E3 (Synthesis API) ── E4 (UI) ──→ MVP
│                     │
├── E5 (Venue Data) ──┼── E6 (Weather) ─────────────────→ v1.1
│   │                 │
│   └── E7 (Fame) ────┤
│                     │
└── E8 (Narratives) ──┘

E9 (Audio/Voice) ── depends on E3 ──────────────────────→ v1.2

E10 (Companions) ── depends on E2 + Profile Agent ─────→ v1.3
E11 (Intent/Trip) ── depends on E5 + Fact Agent ───────→ v1.3
E12 (Recommendations) ── depends on E5, E10 ───────────→ v1.3
```

---

## File Mapping

| Epic | Files Created |
|------|---------------|
| E1 | `lib/sensoryValidation.ts` |
| E2 | `lib/sensoryPrompts.ts` (photo prompts) |
| E3 | `app/api/synthesize-sense/route.ts` |
| E4 | `app/sense/page.tsx`, `app/components/SensoryAgentUI.tsx` |
| E5 | `lib/sensoryData.ts`, `app/api/fetch-venue-data/route.ts` |
| E6 | `lib/weatherData.ts` |
| E7 | `lib/excitementEngine.ts` |
| E8 | `lib/sensoryPrompts.ts` (narrative prompts) |
| E9 | `lib/audioProcessing.ts` |
| E10 | (uses Profile Agent, minimal new code) |
| E11 | (uses Fact Agent, minimal new code) |
| E12 | (logic in synthesis API) |

---

## Sprint Plan

### Sprint 1: MVP Foundation
- E1: Schemas (2 days)
- E2: Photo Analysis (3 days)
- **Demo:** Analyze single photo → get emotions

### Sprint 2: MVP Complete
- E3: Synthesis API (3 days)
- E4: Sense UI (3 days)
- **Demo:** Full upload → results flow

### Sprint 3: Rich Context
- E5: Venue Data (3 days)
- E6: Weather (2 days)
- E7: Excitement (2 days)
- **Demo:** Photo + venue → enriched results

### Sprint 4: Polish
- E8: Narratives & Anchors (4 days)
- Transcendence scoring improvements (1 day)
- **Demo:** Beautiful narratives, memory anchors

### Sprint 5: Multi-Modal
- E9: Audio & Voice (5 days)
- **Demo:** Full multi-modal sensing

### Sprint 6: Personalization
- E10: Companions (4 days)
- E11: Intent & Trip (4 days)
- E12: Recommendations (2 days)
- **Demo:** Complete v1.3

---

*Document Version: 2.0*
*Revised: February 2025*
*Changes: Restructured epics, clearer MVP, sprint plan*
