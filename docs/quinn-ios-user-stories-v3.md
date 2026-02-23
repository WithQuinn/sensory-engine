# Quinn iOS App - User Stories v3

**Version:** 3.0
**Date:** 2026-02-23
**Authors:** Claude Opus (strategic review), Claude Sonnet (v1), Sachin Verma (product)
**Purpose:** Comprehensive iOS user stories with build/reuse inventory, decision framework, and Definition of Done -- aligned with Sensory Engine codebase analysis and three-journeys mockup.

---

## How to Read This Document

Each user story includes:
- **Build Status** -- what exists in the Sensory Engine or Travel repo that can be reused
- **New Work** -- what must be built from scratch for iOS
- **Decision Points** -- open questions requiring product/technical decisions
- **Acceptance Criteria** -- checkboxes matching Travel repo DoD rigor
- **Privacy & Security** -- per-story privacy analysis
- **Edge Cases** -- from Sprint 1 post-mortem learnings
- **Testing** -- unit, integration, UI, accessibility, privacy
- **Definition of Done** -- feature-specific checklist

---

## North Star

> **Ambient journaling is the platform. Travel validation is the acquisition hook.**

The iOS app captures, remembers, and narrates experiences. The web Fact Agent validates venues. These are different products sharing a brand. Every story must pass:

1. Does this serve ambient journaling? If it's trip planning, cut it.
2. Does this require storing user data? If yes, it stays on-device.
3. Does this belong in the current phase? If not, defer.

---

## Codebase Inventory

### What Exists (Reusable)

| Asset | Repo | File | Reuse Strategy |
|-------|------|------|----------------|
| MomentSense schema | Sensory Engine | `lib/sensoryValidation.ts` | Port Zod types to Swift `@Model` classes |
| SensoryInput schema | Sensory Engine | `lib/sensoryValidation.ts` | Port to Swift structs for API payload |
| TranscendenceFactors | Sensory Engine | `lib/sensoryValidation.ts` | Port scoring weights to Swift |
| Narrative synthesis prompt | Sensory Engine | `lib/sensoryPrompts.ts` | Keep as-is -- iOS calls the API |
| Fallback narrative engine | Sensory Engine | `lib/sensoryPrompts.ts` | Port to Swift for offline mode |
| Transcendence scoring algorithm | Sensory Engine | `lib/excitementEngine.ts` | Pure math -- direct port to Swift |
| Wikipedia venue enrichment | Sensory Engine | `lib/sensoryData.ts` | Keep server-side, iOS consumes API |
| Weather integration | Sensory Engine | `lib/weatherData.ts` | Keep server-side, 11km coarsening intact |
| Device capability detection | Sensory Engine | `lib/deviceCapability.ts` | Replace with native `ProcessInfo` + `UIDevice` |
| Venue discovery flow | Travel | `app/api/parse-itinerary/route.ts` | iOS calls existing API |
| Venue suggestions | Travel | `app/api/suggest-venues/route.ts` | iOS calls existing API |
| Design tokens | Three-journeys mockup | `mocks/three-journeys.html` | Extract to SwiftUI `BrandTheme` |
| Privacy architecture | Sensory Engine | `PROJECT.md` | Hybrid model already designed |

### What Must Be Built (iOS-Native)

| Component | V2 Stories | Framework | Complexity |
|-----------|-----------|-----------|------------|
| CoreLocation geofencing | US-201 | CoreLocation | High |
| PhotoKit time-window queries | US-201 | PhotoKit | Medium |
| Vision photo analysis | US-302 | Vision, CoreML | Medium |
| Speech transcription | US-202 | Speech | Medium |
| SwiftData persistence | All | SwiftData | Medium |
| Background task scheduling | US-201 | BGTaskScheduler | High |
| SwiftUI screens (17 total) | All | SwiftUI | Medium-High |
| Permission management | US-002, US-401 | iOS Permissions | Low-Medium |

---

## User Personas

### Yuki - The Reflective Traveler
- **Age:** 34, University lecturer
- **Travel Style:** Slow travel, 1-2 trips/year, journals during and after
- **Pain Point:** Returns from trips with hundreds of photos but no narrative. Forgets sensory details within weeks. Existing journaling apps require too much manual input.
- **What Quinn Means to Her:** A way to keep what she felt, not just what she saw
- **Privacy Sensitivity:** High -- lives in Japan, culturally private, will not use an app that uploads photos
- **Device:** iPhone 15, always updated
- **Key Story:** US-301 (Review Draft Memory), US-302 (Memory Card)

### Marcus - The Spontaneous Explorer
- **Age:** 28, Freelance Designer
- **Travel Style:** Goes with the flow, rough plans at best
- **Pain Point:** Forgets names of places. Finds amazing spots but can't describe them to friends later. Never journals because it feels like homework.
- **What Quinn Means to Him:** Remembering without trying
- **Privacy Sensitivity:** Medium -- aware but not paranoid
- **Device:** iPhone 13
- **Key Story:** US-201 (Arrival Detection), US-001 (Discovery)

### The Chen Family
- **Parents:** Lisa (45) & David (47), **Kids:** Emma (12) & Noah (9)
- **Travel Style:** Family trips with structured activities, lots of photos
- **Pain Point:** Everyone remembers different things. Photos scattered across 3 devices.
- **What Quinn Means to Them:** A family memory vault that writes itself
- **Privacy Sensitivity:** Very high -- protective of children's data
- **Device:** Parents on iPhone 14, kids share an iPad
- **Key Story:** US-101 (Paste Trip), US-303 (Living Timeline)

---

## Epic 0: First Run Experience

**Business Goal:** Build trust and demonstrate value within 60 seconds. Zero permissions before value. Travel discovery is the acquisition hook -- not the platform.

**Success Metrics:**
- 80%+ of first-run users reach Discovery Complete
- 50%+ enable at least one sensor permission during onboarding
- 0 permissions requested before user has seen value
- Privacy comprehension: users can explain "your data stays on your device" in their own words

---

### US-001: Destination Discovery ("Where are you drawn to?")

**As Marcus (spontaneous explorer)**
**I want to** tell Quinn where I'm thinking of going -- or just a feeling I have
**So that** Quinn shows me places I might be drawn to
**Without** signing up, giving my name, or granting any permissions first

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Itinerary parsing API | **Reuse** | Travel: `/api/parse-itinerary` | Handles destinations, regions, feelings. Intent signals already implemented. |
| Venue suggestion API | **Reuse** | Travel: `/api/suggest-venues` | Returns 3-5 venue cards with descriptions. SSE streaming. |
| Venue card data model | **Reuse** | Travel: `VenueSuggestion` type | Name, description, category, relatedTo. |
| Prose descriptions | **Reuse** | Travel: Claude prompt | Already generates evocative descriptions ("Ten thousand vermilion gates climbing the mountainside"). |
| Mood tags | **New** | -- | Not in current API. Requires prompt modification to return mood/feeling tags. |
| Best time / Insider tip | **New** | -- | Not in current API. Requires prompt extension or venue enrichment. |
| Hero photos | **Partial** | Travel: Google Places photos | Exists but needs mobile-optimized sizing. |
| SwiftUI venue card UI | **New** | -- | Match three-journeys mockup (hero photo, prose, mood, CTA). |
| Particle animation (landing) | **New** | -- | OLED-friendly dark animation. |

#### User Journey (Maps to Mockup: First Run, Screens a-1 to a-5)

1. Opens Quinn for the first time
2. Sees dark, minimal landing screen with floating particles
3. Headline: "Where are you drawn to?"
4. Input field with placeholder: "A city, a region, a feeling..."
5. Types "Kyoto, Japan" (or "somewhere peaceful" or "food markets in Asia")
6. Taps "Take me there"
7. Processing screen: "Getting to know your places..." with skeleton cards
8. First venue card appears: Fushimi Inari Shrine
   - Hero photo, prose description
   - Mood: "Sacred, rhythmic"
   - Best at: "Early morning, before 8 AM"
   - Tip: "Take the full loop -- most turn back at the first viewpoint"
   - CTAs: "Drawn to this" | "Next place"
9. Swipes through 3 venue cards
10. Reaches Discovery Complete: "Three places that drew you in."
11. Bridge prompt: "Want Quinn to notice these places for you when you arrive?"
12. Taps "I'm ready" -> Permission onboarding (US-002)

#### Acceptance Criteria

**Functional:**
- [ ] No account creation, no sign-up, no login required
- [ ] Input accepts destinations ("Kyoto"), regions ("Southeast Asia"), or feelings ("somewhere quiet near water")
- [ ] Processing screen shows skeleton cards and resolving animation
- [ ] Venue cards show: hero photo, venue name + location, prose description (1-2 evocative sentences), mood tag, best time, insider tip, "Drawn to this" (primary) and "Next place" (secondary) CTAs
- [ ] Progress dots show position in venue sequence (1 of 3)
- [ ] Discovery Complete screen lists all venues the user was "drawn to"
- [ ] Bridge prompt connects discovery to ambient journaling

**Privacy & Security:**
- [ ] Zero permissions requested before Discovery Complete
- [ ] Destination query sent to existing Travel API -- no user identifier attached
- [ ] Lock icon + "Your data stays private" visible on landing screen
- [ ] No analytics tracking of destination input content (only: `discovery_started` count)
- [ ] Network calls auditable: Settings screen will show what was sent

**UX & Design (from three-journeys mockup):**
- [ ] Dark theme: `#0a0a0a` bg, `#c4b8a8` accent
- [ ] Fonts: Cormorant Garamond (headlines), DM Sans (body), DM Mono (metadata)
- [ ] Venue card swipe gesture (horizontal between venues)
- [ ] "Drawn to this" heart icon badge on hero photo
- [ ] Bottom nav: Discover (active) | Capture | Memories
- [ ] Particle animation on landing (subtle, OLED-friendly)
- [ ] Skeleton cards during processing (not spinner)

**Edge Cases (from Sprint 1 post-mortem learnings):**
- [ ] Vague input ("I want to relax") -> Quinn interprets intent, surfaces 3 destinations
- [ ] Nonsense input ("asdfgh") -> "We couldn't find places matching that. Try a city name or describe what you're looking for."
- [ ] No network -> "Quinn needs a connection to discover places. Connect to WiFi or mobile data to get started."
- [ ] User taps "Next place" on all venues (drawn to none) -> "None of these spoke to you? Tell us more about what you're looking for." with retry input
- [ ] API returns < 3 venues -> Show what's available, don't block on minimum count
- [ ] Loading takes > 5s -> Show progress text updates ("Still searching...", "Almost there...") -- **Sprint 1 lesson: never leave users with no feedback > 500ms**

**Testing:**
- [ ] Unit: Venue card data model parsing from API response
- [ ] UI: Full first-run flow from landing to Discovery Complete (XCUITest)
- [ ] Performance: Landing to first venue card < 3s on WiFi
- [ ] Accessibility: VoiceOver reads venue prose descriptions naturally
- [ ] Privacy: Network inspector confirms no user ID in API calls
- [ ] Mobile: Tested on iPhone SE (smallest screen), iPhone 15 Pro Max (largest)

**Definition of Done:**
- [ ] All functional acceptance criteria pass
- [ ] Loading states shown for all async operations > 500ms (Sprint 1 DoD)
- [ ] Tested at smallest viewport (iPhone SE) -- Sprint 1 lesson
- [ ] Feature purpose clear without developer explanation (user comprehension test)
- [ ] Telemetry: `discovery_started`, `venue_drawn_to`, `discovery_completed` events
- [ ] Security: No PII in API calls or telemetry
- [ ] Error states produce distinct, reasonable output (not just "Error")

**Decision Points:**
- [ ] **DECISION NEEDED:** Should venue suggestions come from Travel API (existing) or a new iOS-specific endpoint? Recommendation: reuse Travel API to avoid duplication.
- [ ] **DECISION NEEDED:** Mood tags and insider tips -- extend existing Claude prompt or add a post-processing step? Recommendation: extend prompt, single API call.

---

### US-002: Permission Onboarding (Value-Framed)

**As Yuki (reflective traveler)**
**I want to** understand exactly what Quinn will do with my location, photos, and notifications
**So that** I can decide which sensors to enable
**Without** feeling pressured, guilty, or confused about what I'm agreeing to

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Permission UI | **New** | -- | Three toggle cards matching mockup screen a-6. |
| iOS permission prompts | **New** | -- | `CLLocationManager.requestWhenInUseAuthorization()`, `PHPhotoLibrary.requestReadWriteAuthorization()`, `UNUserNotificationCenter.requestAuthorization()` |
| Permission state management | **New** | -- | SwiftData model tracking enabled/denied/not-asked per permission |
| Graceful degradation logic | **New** | -- | App must work with any combination of permissions |

#### User Journey (Maps to Mockup: First Run, Screen a-6)

1. After tapping "I'm ready" on Discovery Complete
2. Headline: "Let Quinn notice for you."
3. Subtext: "When you arrive at Fushimi Inari, Nishiki Market, or Arashiyama, Quinn will quietly catch what you might forget."
4. Three permission cards (each with toggle):
   - **Location**: "Quinn will know when you arrive at places you were drawn to. Nothing is shared."
   - **Photos**: "Photos you take nearby become part of your memory. They never leave your device until you say so."
   - **Notifications**: "A gentle nudge when Quinn has assembled a memory for you."
5. CTAs: "I'm ready" (primary) | "Maybe later" (ghost)
6. Lock icon: "Your data stays on your device"
7. Each toggle triggers native iOS permission prompt only when turned ON
8. "Maybe later" skips all permissions -- app works in degraded mode

#### Acceptance Criteria

**Functional:**
- [ ] Each permission card independently toggleable
- [ ] Toggling ON triggers the native iOS permission dialog for that specific sensor
- [ ] Toggling OFF (or leaving OFF) requires no native dialog
- [ ] "Maybe later" bypasses all permissions -- app proceeds to Home
- [ ] Permission states persisted to SwiftData -- never re-asked unless user revisits Settings
- [ ] App works with any combination of permissions (all on, all off, mixed)
- [ ] Graceful degradation per permission:
  - Location OFF: No arrival detection, manual check-in only
  - Photos OFF: No auto-linked photos, manual add later
  - Notifications OFF: Memories wait silently until user opens app

**Privacy & Security:**
- [ ] Permission explanations match Apple's required `NSLocationWhenInUseUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSMicrophoneUsageDescription` strings exactly
- [ ] No dark patterns: "Maybe later" visually equal to "I'm ready", not hidden or diminished
- [ ] Permission state never sent to analytics (only: `permissions_onboarding_completed` count, `sensor_count: N`)
- [ ] No re-prompting for denied permissions -- show Settings deep-link instead

**UX & Design (from mockup):**
- [ ] Toggle switches with green track when ON
- [ ] Each card: icon + title + single-sentence explanation
- [ ] Tone: value-framing ("Quinn will notice for you"), not warning ("we need access to...")
- [ ] "Your data stays on your device" with lock icon at bottom
- [ ] Smooth transition to Home after completion

**Edge Cases:**
- [ ] User enables location but denies native iOS prompt -> Toggle reverts to OFF, show: "You can enable this in Settings anytime."
- [ ] User force-quits during onboarding -> Resume from same screen on next launch
- [ ] iOS "Reduce Motion" enabled -> Simplify transitions
- [ ] User already granted permissions from a previous install -> Skip to Home (check `CLLocationManager.authorizationStatus` etc.)
- [ ] iPad layout -> Wider cards, larger toggles

**Testing:**
- [ ] Unit: Permission state management (all combinations)
- [ ] UI: Full onboarding flow (XCUITest)
- [ ] UI: "Maybe later" flow -> verify app works without permissions
- [ ] Privacy: Verify no permission state in telemetry payload
- [ ] Accessibility: VoiceOver describes each toggle's purpose and state

**Definition of Done:**
- [ ] All acceptance criteria pass
- [ ] Apple usage description strings reviewed by team (not just developer)
- [ ] No dark patterns verified by non-developer review
- [ ] Telemetry: `permissions_onboarding_completed`, `sensor_count`
- [ ] Tested with denied permissions (all 8 combinations of 3 toggles)

---

## Epic 1: Discovery & Pre-Trip

**Business Goal:** Let users explore destinations and build anticipation. This is the acquisition hook. Must deliver value without ambient journaling features.

**Success Metrics:**
- Users "drawn to" 2+ venues per discovery session
- 60%+ of users who complete First Run return to start a trip
- Venue descriptions rated "evocative" by 70%+ of testers
- Zero itinerary text stored on server after processing

---

### US-101: Paste or Describe a Trip

**As the Chen Family**
**We want to** paste our family trip itinerary or just name our destination
**So that** Quinn can understand where we're going
**Without** needing a specific format or worrying about what happens to our data

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Itinerary parsing | **Reuse** | Travel: `/api/parse-itinerary` | Handles structured (ChatGPT), unstructured (Reddit), and low-fidelity (just destination) inputs. Intent signal detection. |
| Input type classification | **Reuse** | Travel: `has_venues`, `has_intent`, `too_vague` | Auto-detects mode from input. |
| Venue extraction | **Reuse** | Travel: Claude prompt (`PARSING_PROMPT`) | Extracts venues, dates, intent signals, trip context. |
| SwiftData Journey model | **New** | -- | Persist extracted venues as a "Journey" locally. |
| Home screen "Where to next?" card | **New** | -- | Matches mockup new-trip entry point. |

#### Acceptance Criteria

**Functional:**
- [ ] Supports two input modes:
  - **Destination mode**: City, region, or feeling -> Quinn generates venue suggestions
  - **Itinerary mode**: Pasted text with dates, venues -> Quinn extracts and structures
- [ ] Quinn auto-detects mode based on input length and structure (reuses Travel's `input_type` classification)
- [ ] Destination mode: Returns 3-5 venue cards with evocative descriptions
- [ ] Itinerary mode: Extracts venues, dates, times; displays as timeline
- [ ] Both modes use same venue card format from First Run
- [ ] Extracted venues saved to SwiftData as a "Journey"
- [ ] Home screen updates to show new journey card with thumbnail

**Privacy:**
- [ ] Pasted itinerary text deleted from memory after extraction (SE's existing privacy model)
- [ ] API request carries no user ID (existing Travel API behavior)
- [ ] Privacy note visible: "Your itinerary is processed once, then deleted"

**UX:**
- [ ] Same visual language as First Run (reuse components)
- [ ] Input placeholder: "A city, a region, or paste your itinerary..."
- [ ] Processing: "Getting to know your places..." with skeleton cards
- [ ] Error: unparseable text -> "We couldn't find places in that text. Try a destination name or paste your booking confirmation."

**Testing:**
- [ ] Unit: Journey SwiftData model CRUD
- [ ] Unit: API response parsing for both modes
- [ ] Integration: Full paste -> parse -> save flow
- [ ] Edge: Empty input, single word, 5000-word itinerary, non-English text

**Definition of Done:**
- [ ] Both input modes tested with 5+ real-world examples each
- [ ] Journey persisted to SwiftData and survives app restart
- [ ] Loading state shown during API call (Sprint 1 DoD)
- [ ] Privacy note visible during processing

---

### US-102: Review Discovered Places

**As Yuki (reflective traveler)**
**I want to** review the places Quinn found and mark which ones I'm drawn to
**So that** Quinn knows what to watch for when I arrive

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Venue card UI pattern | **Reuse (concept)** | Travel: `VenueSuggestionCard.tsx`, `VenueDetailLayers.tsx` | Port design patterns to SwiftUI. Not code-portable but design-portable. |
| Pin/discard interaction | **Reuse (concept)** | Travel: `CardState { pinned, discarded }` | "Drawn to this" = pin. "Next place" = skip. |
| Venue data model | **Reuse** | SE: `SensoryInputSchema.venue` | Name, category, coordinates. |
| Journey persistence | **New** | -- | SwiftData `@Model` for Journey + Venues. |

#### Acceptance Criteria

**Functional:**
- [ ] Venue cards match mockup format: hero photo, prose description, mood tag, best time, insider tip
- [ ] "Drawn to this" marks venue as part of journey
- [ ] "Next place" skips without marking
- [ ] Discovery Complete shows summary of marked venues
- [ ] Can remove venue from summary (swipe or tap X)
- [ ] Journey persisted to SwiftData with all venue data
- [ ] Home screen updates to show new journey card
- [ ] Geofences registered for "Drawn to" venues (if Location permission granted) -- ties to US-201

**UX:**
- [ ] Prose descriptions evocative, not encyclopedic ("The crowd thins as you climb higher", not "Popular Shinto shrine with 10,000 torii gates")
- [ ] Mood tags use feeling language (Sacred, Rhythmic, Vivid, Delicious)
- [ ] Progress dots indicate position in sequence
- [ ] Haptic on "Drawn to this" tap

**Testing:**
- [ ] Unit: Journey model with venues CRUD
- [ ] UI: Full discovery flow -> review -> save (XCUITest)
- [ ] Edge: 0 venues marked, all venues marked, single venue

---

## Epic 2: Ambient Capture (During Trip)

**Business Goal:** Passively collect raw material for memories -- photos, location, audio, time -- without user action. This is the core platform differentiator. The user does nothing; Quinn notices.

**Success Metrics:**
- Arrival detection fires within 200m of marked venue
- 90%+ of photos taken near a marked venue auto-linked correctly
- Battery impact < 5% per 8 hours of background tracking
- Zero sensor data transmitted off-device

---

### US-201: Arrival Detection & Ambient Photo Linking

**As Marcus (spontaneous explorer)**
**I want** Quinn to know when I arrive at places I was drawn to and automatically find the photos I take there
**So that** when the trip is over, my memories are already assembled
**Without** me having to open the app, check in, or tag anything

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Geofence detection trigger | **Schema exists** | SE: `detection.trigger = 'dwell'` | Schema ready. Need native CoreLocation implementation. |
| Photo reference model | **Schema exists** | SE: `PhotoReferenceSchema.local_id` | Typed for PHAsset. Need PhotoKit queries. |
| Visit data model | **Schema exists** | SE: `SensoryInputSchema` (captured_at, duration_minutes, detection) | Need SwiftData model + background population. |
| Arrival/departure logic | **New** | -- | CLCircularRegion monitoring, 200m radius, 3-min dwell filter. |
| PhotoKit time-window query | **New** | -- | `PHAsset.fetchAssets(with:options:)` filtered by date range. |
| Background location modes | **New** | -- | `UIBackgroundModes: location`, significant-change between venues. |
| Location trail sampling | **New** | -- | 60s interval during visit via `allowsBackgroundLocationUpdates`. |

#### User Journey

1. Marcus enabled Location + Photos during onboarding
2. Flies to Kyoto. Doesn't open Quinn.
3. Walks to Fushimi Inari at 7:30 AM
4. Quinn detects arrival via geofence (200m radius)
5. Marcus takes 5 photos over 2 hours
6. Quinn silently links photos taken during time window to Fushimi Inari
7. Marcus walks to Nishiki Market at 11 AM
8. Quinn detects new arrival, starts new capture window
9. Marcus never opens Quinn during any of this

#### Acceptance Criteria

**Functional:**
- [ ] Geofence registered for each "Drawn to" venue using `CLLocationManager.startMonitoring(for:)`
- [ ] Arrival triggered when user enters 200m radius (`CLCircularRegion`)
- [ ] 3-minute dwell filter: must remain in radius 3+ minutes before triggering (prevents GPS drift false positives)
- [ ] Departure triggered after leaving radius for > 15 minutes
- [ ] During visit window: PhotoKit query finds photos with `creationDate` inside arrival-departure window
- [ ] Also captures: arrival time, departure time, duration, weather (from SE's OpenWeather API with coarsened coordinates)
- [ ] All capture data stored in SwiftData, encrypted with iOS Data Protection (`.completeUnlessOpen`)
- [ ] Works when app is in background or terminated (CoreLocation background modes)
- [ ] iOS 20-geofence limit managed: prioritize nearest "Drawn to" venues, rotate based on proximity

**Privacy & Security:**
- [ ] All capture data 100% on-device -- **enforced by architecture, not just policy**
- [ ] No photo content, GPS coordinates, or timestamps sent to any server
- [ ] Telemetry: only `arrival_detected` count, no venue names or coordinates
- [ ] User can view all captured data per venue in Settings
- [ ] User can delete all data for a specific venue or entire trip
- [ ] Auto-delete configurable: 90 days (default), 1 year, never
- [ ] Location trail stored with iOS Data Protection encryption

**Battery:**
- [ ] Between venues: significant-change API only (minimal battery)
- [ ] During visit: 60-second location samples via `CLLocationManager.allowsBackgroundLocationUpdates`
- [ ] Use `CLCircularRegion` monitoring (iOS wakes app only on boundary crossing -- low power)
- [ ] Target: < 5% battery impact per 8-hour day with 3 venue visits

**Edge Cases:**
- [ ] GPS drift causes false arrival -> 3-minute dwell filter prevents false trigger
- [ ] User visits venue not in journey -> Don't capture (MVP: only marked venues)
- [ ] Two venues within 200m -> Attribute based on closest + time overlap
- [ ] User takes 0 photos during visit -> Create memory with duration + location data only
- [ ] Device runs out of battery -> Gracefully resume on charge, accept data gaps
- [ ] Photos permission OFF but Location ON -> Capture location only, no photos
- [ ] 20-geofence limit hit -> Rotate geofences based on user proximity (use significant-change to detect when near a trip's region)
- [ ] User in airplane mode -> Buffer arrival event locally, link photos when available

**Testing:**
- [ ] Unit: Geofence trigger logic with mock `CLLocationCoordinate2D`
- [ ] Unit: Photo time-window matching algorithm with mock `PHAsset` dates
- [ ] Unit: 3-minute dwell filter with simulated GPS drift
- [ ] Integration: CoreLocation + PhotoKit combined flow (mocked CLLocationManager)
- [ ] Battery: Real device 8-hour test with 3 simulated venue visits
- [ ] Privacy: Network monitor confirms zero data transmission during capture
- [ ] Edge: 20-geofence rotation logic

**Decision Points:**
- [ ] **DECISION NEEDED:** Should arrival detection use "When In Use" or "Always" location permission? "Always" enables true background detection but Apple reviews these apps more strictly. Recommendation: "When In Use" with background location updates (covers most scenarios without "Always").
- [ ] **DECISION NEEDED:** Photo matching by time-window only, or also by GPS proximity? Time-window is simpler and more reliable. GPS in EXIF depends on user having Location Services on for Camera. Recommendation: time-window primary, GPS as bonus signal.
- [ ] **TECHNICAL SPIKE NEEDED:** Test CoreLocation background geofencing reliability on real iPhone 13/15 across iOS 17 and 18. Apple documentation says wake-from-terminated works, but real-world reliability varies.

**Definition of Done:**
- [ ] Arrival detection works with app backgrounded and terminated
- [ ] Photos correctly linked to venue visit with < 5% false positive rate
- [ ] Battery impact measured on real device < 5% per 8 hours
- [ ] All data encrypted at rest with iOS Data Protection
- [ ] Zero network calls during capture (verified by network inspector)
- [ ] 20-geofence rotation works when trip has > 20 venues
- [ ] Telemetry: `arrival_detected` count only

---

### US-202: Voice Note Capture

**As Yuki (reflective traveler)**
**I want to** record a quick voice note while I'm at a place
**So that** Quinn can weave my own words into the memory later
**Because** the feeling of a place is hardest to remember

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Audio input schema | **Reuse** | SE: `AudioInputSchema` | duration_seconds, transcript, sentiment_score, sentiment_keywords |
| Voice analysis metadata | **Reuse** | SE: `sensoryPrompts.ts` | sentimentScore, detectedTone, keywords, theme -- already designed for privacy (metadata only to Claude) |
| Speech transcription | **New** | -- | `SFSpeechRecognizer` with `.onDevice = true` for privacy |
| Sentiment extraction | **New** | -- | `NLTagger` with `NLTagScheme.sentimentScore` for on-device sentiment |
| Keyword extraction | **New** | -- | `NLTagger` with noun/verb extraction -- topics, not verbatim |
| Recording UI | **New** | -- | Press-hold or tap-toggle, waveform visualization |
| Audio file storage | **New** | -- | Local `.m4a`, encrypted, linked to venue visit |

#### Acceptance Criteria

**Functional:**
- [ ] Capture tab shows minimal recording interface
- [ ] Press-and-hold to record (or tap to start, tap to stop)
- [ ] Recording saved locally, linked to current venue (if detected) or timestamp
- [ ] Supports recordings up to 5 minutes (MVP)
- [ ] On-device transcription via `SFSpeechRecognizer` (`.onDevice = true`)
- [ ] On-device sentiment extraction via `NLTagger.sentimentScore`
- [ ] On-device keyword extraction: nouns + verbs (topics, not verbatim words)
- [ ] Voice note metadata (sentiment, tone, keywords) stored in SwiftData
- [ ] Transcribed words can be quoted in Quinn's draft narrative (styled differently)

**Privacy:**
- [ ] Audio file never leaves device -- **enforced by architecture**
- [ ] Verbatim transcript never transmitted -- only metadata (sentiment score, tone, topic keywords)
- [ ] Transcription via Apple Speech framework on-device only (`SFSpeechRecognizer.supportsOnDeviceRecognition`)
- [ ] No voice recognition or speaker identification
- [ ] User can delete individual voice notes
- [ ] If on-device Speech not available (older device) -> store audio locally, skip transcription, note: "Voice note saved. Transcription available on newer devices."

**UX (from mockup):**
- [ ] Waveform visualization during recording (purple accent: `#7c5da0`)
- [ ] Haptic pulse while recording
- [ ] Voice note player on memory review: purple waveform bars
- [ ] User's transcribed words in quotation marks, italic, distinct background (`memory-user-words` class from mockup)

**Testing:**
- [ ] Unit: Audio file creation and linking to venue
- [ ] Unit: Sentiment score extraction from sample transcripts
- [ ] Unit: Keyword extraction (verify topics not verbatim)
- [ ] Integration: Record -> transcribe -> extract metadata flow
- [ ] Privacy: Verify transcript and audio file never appear in network calls
- [ ] Edge: 0-second recording, 5-minute max, background noise, no Speech support

**Decision Points:**
- [ ] **DECISION NEEDED:** Should keywords be extracted on-device (`NLTagger`) or should we send the full transcript to Claude? SE's architecture says metadata-only to Claude. Recommendation: `NLTagger` extracts keywords on-device, only keywords sent to Claude. Transcript stays on-device for display in Memory Card.
- [ ] **TECHNICAL SPIKE NEEDED:** Test `SFSpeechRecognizer` accuracy with ambient travel noise (markets, streets, wind). If accuracy < 70%, consider showing transcript with "Edit" option.

**Definition of Done:**
- [ ] Voice note recorded, transcribed, and metadata extracted on-device
- [ ] Sentiment and keywords correctly extracted (validated against 10+ test recordings)
- [ ] Audio file encrypted at rest
- [ ] Verbatim transcript never in network payload (verified)
- [ ] Waveform UI matches mockup purple accent

---

## Epic 3: Memory Assembly (Post-Trip)

**Business Goal:** This is the core product. Quinn takes raw capture data and assembles a narrative memory. The user reviews, refines, and keeps it. This is what makes Quinn an ambient journal, not a travel app.

**Success Metrics:**
- 70%+ of assembled memories accepted ("This feels right") without editing
- Users add their own words to 30%+ of memories
- Sensory anchors rated "accurate" by 80%+ of users
- Memory review completed within 48 hours of trip end for 60%+ of users

---

### US-301: Review Quinn's Draft Memory

**As Yuki (reflective traveler)**
**I want to** see what Quinn assembled from my Arashiyama visit
**So that** I can relive the experience and decide if the narrative feels right

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Narrative generation (Claude) | **Reuse** | SE: `sensoryPrompts.ts` + `/api/synthesize-sense` | Production prompt with 7 emotion tones, anti-cliche, show-don't-tell. Deploy SE and call from iOS. |
| MomentSense response model | **Reuse** | SE: `MomentSenseSchema` | narratives.short/medium/full, emotion_tags, memory_anchors, sensory_details, atmosphere, transcendence_score |
| Fallback narratives (offline) | **Reuse** | SE: `generateFallbackNarrative()` | Port to Swift -- builds narratives from metadata when Claude unavailable. Emotion-specific templates with category-aware sensory anchors. |
| Transcendence scoring | **Reuse** | SE: `calculateTranscendenceScore()` | 8-factor weighted algorithm. Port math to Swift. |
| Memory review UI | **New** | -- | Hero photo, narrative prose, photo strip, voice note player, signal pills, CTAs. 17 screens from mockup. |
| Signal pills | **New** | -- | Derived from capture data: "Morning visit", "About 2 hours", "12C overcast", "Unhurried" |
| "This feels right" / "Refine" flow | **New** | -- | Accept, edit, or add photos. |

#### User Journey (Maps to Mockup: Returning, Screens b-1 to b-3)

1. Morning after returning from Kyoto
2. Opens Quinn. Lands on Home (Memories tab).
3. Sees: "3 moments from Kyoto, waiting for you."
4. Stats: "3 memories, 10 photos, 1 voice note, 5.5 hours remembered"
5. Taps "Review memories"
6. Timeline of 3 visits with thumbnails and summaries
7. Taps Arashiyama
8. Sees Quinn's draft:
   - Hero photo (best from linked photos)
   - Narrative: "You arrived at the bamboo grove just after eight, before the paths filled..."
   - Photo strip (5 photos + "+" to add more)
   - Voice note player (34 seconds, purple waveform)
   - Signal pills: "Morning visit", "About 2 hours", "12C overcast", "Unhurried"
   - Contextual nudge: "Location was off during this visit. Turn on for next time."
9. Taps "This feels right" -> Memory confirmed
10. OR taps "Refine the narrative" -> Edit screen
11. OR taps "Add a photo" -> Photo picker

#### Acceptance Criteria

**Functional:**
- [ ] Home screen shows pending memories: "[N] moments from [destination], waiting for you."
- [ ] Stats: memory count, photo count, voice note count, total hours remembered
- [ ] Memory timeline: date, venue name, one-line narrative excerpt, photo count, duration, thumbnail
- [ ] Draft memory shows:
  - Hero photo (largest/most interesting from linked photos -- selected by Vision framework analysis)
  - Quinn's narrative (2-3 paragraphs, evocative prose, second person "you")
  - Photo strip (horizontally scrollable + "+" tile for manual additions)
  - Voice note player (if recorded)
  - Signal pills (from capture data + weather API)
  - Contextual sensor nudges (if data gaps detected, from US-401)
- [ ] Three CTAs: "This feels right" (primary), "Add a photo" (ghost), "Refine the narrative" (ghost)
- [ ] Narrative generated by calling deployed Sensory Engine API with metadata-only payload

**Narrative Generation Pipeline (Key Integration):**
- [ ] iOS extracts metadata on-device:
  - Photo: scene_type, lighting, face_count, crowd_level, energy_level (Vision framework)
  - Voice: sentiment_score, detected_tone, keywords (Speech + NLTagger)
  - Context: arrival_time, departure_time, duration, weather
- [ ] iOS sends ONLY metadata to Sensory Engine API (existing `SensoryInputSchema`)
- [ ] SE returns `MomentSense` with narratives, emotion tags, sensory details, memory anchors
- [ ] iOS stores `MomentSense` in SwiftData
- [ ] If offline: use ported `generateFallbackNarrative()` from SE codebase

**Privacy:**
- [ ] Photos never sent to API -- only `scene_type`, `lighting`, `crowd_level` metadata
- [ ] Voice transcript never sent -- only `sentiment_score`, `tone`, `keywords`
- [ ] GPS coordinates never sent -- only venue name (user already provided this)
- [ ] Telemetry: `memory_reviewed` count, `accepted_without_edit` boolean -- no content

**UX (from mockup):**
- [ ] Narrative in second person ("You arrived...", "You stayed two hours")
- [ ] Voice note quoted text in italics with distinct background
- [ ] Signal pills: light background, rounded, monospace font (DM Mono)
- [ ] "This feels right" is primary action -- draft should be good enough 70%+ of the time
- [ ] "Not now" link at bottom (dismisses without accepting/rejecting)

**Edge Cases:**
- [ ] Memory with 0 photos -> Narrative from location + duration only. No photo strip.
- [ ] Memory with 0 voice notes -> No player shown. Narrative still generated.
- [ ] 15-minute visit -> Shorter narrative, fewer signal pills
- [ ] User reviews 2 weeks after trip -> Still works
- [ ] Force-quit during review -> Draft saved, resume on next open
- [ ] API unavailable (offline) -> Use fallback narrative engine, mark as "Draft - will improve when connected"
- [ ] User edits narrative then taps "This feels right" -> Save edited version, not original

**Testing:**
- [ ] Unit: MomentSense SwiftData model persistence
- [ ] Unit: Metadata extraction pipeline (Vision mock + Speech mock)
- [ ] Integration: Full capture -> metadata -> API -> narrative -> display flow
- [ ] UI: Review flow with accept, edit, add photo paths
- [ ] Offline: Fallback narrative generation
- [ ] Performance: Narrative generation < 5s per memory
- [ ] Accessibility: VoiceOver reads narrative naturally

**Decision Points:**
- [ ] **DECISION NEEDED:** Hero photo selection -- use Vision framework to pick "best" photo (highest quality, most interesting scene) or just use first photo chronologically? Recommendation: Vision framework ranks by scene interest + quality.
- [ ] **DECISION NEEDED:** Should "Refine the narrative" allow free-text editing of Quinn's prose, or just adding/removing sections? Recommendation: free-text editing -- users should own their memories.

**Definition of Done:**
- [ ] Narrative generated from real capture data (not mocked)
- [ ] Metadata-only API payload verified (no photos, audio, GPS in network calls)
- [ ] Fallback narrative works offline
- [ ] "This feels right" acceptance rate measured in telemetry
- [ ] Hero photo selected by Vision analysis (not arbitrary)
- [ ] All Sprint 1 DoD checks pass (loading states, mobile testing, user comprehension)

---

### US-302: Memory Card (Finished Memory)

**As Yuki (reflective traveler)**
**I want to** see my finished memory as a beautiful, complete card
**So that** I can revisit it anytime and feel what I felt

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Sensory anchors (Sound/Light/Time) | **Reuse** | SE: `memoryAnchors`, `inferredSensory`, `sensoryDetails` | SE already generates: sensory_anchor, emotional_anchor + inferred scent/tactile/sound from venue context. |
| Emotion tags | **Reuse** | SE: `emotion_tags[]`, `primaryEmotion` | 7 calibrated emotion types. |
| Narrative prose | **Reuse** | SE: `narratives.full` | 150-200 word full narrative, emotion-matched tone. |
| Companion experiences | **Reuse** | SE: `companion_experiences[]` | Per-person reactions, age-aware. |
| Memory Card UI | **New** | -- | Full-screen hero, sensory anchor section, emotion tag pills, footer metadata. |
| Tag editing (add/remove/custom) | **New** | -- | User-editable emotion tags. |
| Tag search | **New** | -- | SwiftData query by emotion tag across memories. |

#### Acceptance Criteria

**Functional:**
- [ ] Memory Card contains (from mockup screen b-4):
  - Hero photo with scrim gradient, date + location overlay
  - Edit pencil icon (top right, subtle)
  - Narrative prose (Quinn's voice, second person)
  - User's quoted words (from voice note transcription) in italics
  - Quinn's observation: "Five photos, all looking up. Quinn noticed that too."
  - **Sensory Anchors** section:
    - Sound: from SE's `inferredSensory.sound` (e.g., "The low percussion of bamboo in wind")
    - Light: from SE's `sensoryDetails.visual` + photo analysis (e.g., "Grey-green, filtered through vertical lines")
    - Time: from duration data + relative comparison (e.g., "Two hours. The longest pause of your trip.")
  - **Emotion Tags**: tappable pills (Still, Wonder, Solitude)
  - Footer: photo count, voice note count, duration, "Your words"
- [ ] Memory Card persisted in SwiftData
- [ ] Accessible from Memories tab -> Journey -> Memory

**Sensory Anchors (Key Differentiator):**
- [ ] Sound: from `inferredSensory.sound` (SE infers from venue category + context. Temple -> "chanting", Market -> "vendor calls and sizzling oil")
- [ ] Light: from Vision framework photo analysis (brightness, color temperature) + SE's `sensoryDetails.visual`
- [ ] Time: from duration data + comparison logic ("longest pause", "shortest stop", "right on time")
- [ ] Written in evocative prose -- "Grey-green filtered light", NOT "Brightness: 0.4"
- [ ] On-device Vision analysis feeds into SE's synthesis prompt for quality prose output

**Emotion Tags:**
- [ ] Initially generated by SE from `emotion_tags[]` + `primaryEmotion`
- [ ] User can: accept, remove, or add custom tags (free text)
- [ ] Tags searchable from Living Timeline (US-303)
- [ ] Tags stored in SwiftData, editable anytime

**UX:**
- [ ] Card feels like a journal page, not a database entry
- [ ] Dark theme, Cormorant Garamond headlines, generous whitespace
- [ ] Edit pencil subtle -- memory is meant to be read, not constantly edited
- [ ] Long-form scroll, no pagination within a memory

**Testing:**
- [ ] Unit: Sensory anchor generation from SE response
- [ ] Unit: Emotion tag CRUD in SwiftData
- [ ] Unit: Tag search across memories
- [ ] UI: Memory Card rendering with all sections
- [ ] Accessibility: "Sound: The low percussion of bamboo in wind" reads naturally in VoiceOver

**Definition of Done:**
- [ ] Sensory anchors generated for all memories (Sound, Light, Time)
- [ ] Emotion tags editable and searchable
- [ ] Memory Card visually matches mockup screen b-4
- [ ] Card readable in VoiceOver without losing emotional quality

---

### US-303: Living Timeline

**As Marcus (spontaneous explorer)**
**I want to** see all my memories from a trip in one flowing timeline
**So that** I can scroll through the whole journey and feel the arc of the trip

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Timeline data | **Reuse** | SwiftData Journey + Memories | Query all memories for a journey, sorted by date. |
| Timeline UI | **New** | -- | Vertical connected-dot timeline from mockup screen b-5. |

#### Acceptance Criteria

**Functional:**
- [ ] Shows all memories for a journey, chronologically
- [ ] Each entry: timeline dot, thumbnail, date, venue name, narrative excerpt, emotion tags, metadata
- [ ] Tap entry -> Navigate to full Memory Card
- [ ] During trip: live status ("Day 3 - Noticing") with green dot
- [ ] After trip: date range header
- [ ] Pending (unreviewed) memories: pulsing accent dot
- [ ] Empty state: "Your memories will appear here as Quinn notices them"

**UX:**
- [ ] Vertical timeline with connected dots (not flat list)
- [ ] Card backgrounds with tap feedback
- [ ] Smooth scroll, 60fps with 50+ entries
- [ ] No pagination

**Testing:**
- [ ] Unit: SwiftData query for journey memories sorted by date
- [ ] UI: Timeline with 1, 5, 20, 50 entries
- [ ] Performance: 60fps scroll with 50+ entries (Instruments profiling)

---

## Epic 4: Sensor Permission Lifecycle

**Business Goal:** Sensors presented as value, not cost. Users who decline never feel punished. Users who enable feel the difference.

---

### US-401: Contextual Sensor Nudges

**As Marcus (spontaneous explorer)**
**I want** Quinn to gently show me what I'm missing when sensors are off
**So that** I can decide to enable them when the value is obvious
**Without** being nagged, guilt-tripped, or interrupted

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Nudge logic | **New** | -- | Frequency limiting, dismiss tracking. |
| Nudge UI | **New** | -- | Two types from mockup: home nudge and contextual nudge. |

#### Acceptance Criteria

**Functional:**
- [ ] Two nudge types (from mockup):
  - **Home nudge**: "Bring your memories to life" with sparkle icon (screen b-1)
  - **Contextual nudge**: Where missing data would be ("Location was off during this visit", screen b-3)
- [ ] Max 1 per permission type per app session
- [ ] Tapping nudge opens specific permission card (not full onboarding)
- [ ] After enabling: nudge disappears, data begins flowing
- [ ] After dismissing 3 times: nudge stops for that permission

**UX:**
- [ ] Tone: invitation, not warning. "Enable" not "Required". "Bring to life" not "You're missing out."
- [ ] Sensors off = valid state, not error
- [ ] No badge counts, red dots, or aggressive visual indicators

---

## Cross-Cutting Requirements

### Privacy Architecture

**Data Classification (enforced by architecture):**

| Data Type | Storage | Encryption | Retention | Server Access |
|-----------|---------|------------|-----------|---------------|
| Destination query | Ephemeral | In-transit TLS | Deleted after API response | Travel API, no user ID |
| Venue descriptions | SwiftData | iOS Data Protection | User-controlled | Generated once, stored locally |
| Location trail | SwiftData | `.completeUnlessOpen` | 90 days (configurable) | **Never** |
| Photos (references) | PhotoKit refs | iOS native | Tied to photo library | **Never** |
| Photo metadata | SwiftData | iOS Data Protection | User-controlled | SE API (scene, lighting, crowd -- not photo) |
| Voice notes | Local `.m4a` | `.completeUnlessOpen` | User-controlled | **Never** |
| Voice metadata | SwiftData | iOS Data Protection | User-controlled | SE API (sentiment, tone, keywords -- not transcript) |
| Memory narratives | SwiftData | iOS Data Protection | User-controlled | SE API generates, stored locally |
| Sensory anchors | SwiftData | iOS Data Protection | User-controlled | **Never** (on-device + SE synthesis) |
| Telemetry | Ephemeral | In-transit TLS | Aggregated, no PII | Counts only |

**Privacy Principles (from DESIGN_PRINCIPLES.md, enforced in code):**
- [ ] "Your data stays on your device" is architecture, not marketing
- [ ] Every network call auditable in Settings
- [ ] Delete all data: single button, irreversible, verified empty
- [ ] Export all data: JSON, human-readable
- [ ] No user accounts in MVP

### Design System (from three-journeys mockup)

- **Background**: `#0a0a0a` (OLED black)
- **Surface**: `#141414` (cards)
- **Accent**: `#c4b8a8` (warm gold, sparingly)
- **Text**: `#e8e6e3` (primary), `rgba(232,230,227,0.65)` (secondary)
- **Green**: `#5a8a6a` (live indicators)
- **Purple**: `#7c5da0` (voice/audio)
- **Display**: Cormorant Garamond (headlines, venue names)
- **Body**: DM Sans (prose, UI labels)
- **Mono**: DM Mono (metadata, signal pills)

### Navigation (3 tabs)

1. **Discover** (search): Landing, venue cards, discovery
2. **Capture** (microphone): Voice recording, manual photo add
3. **Memories** (book): Home, Timeline, Memory Cards

### Accessibility

- [ ] VoiceOver for all screens
- [ ] Sensory anchors read naturally: "Sound: The low percussion of bamboo in wind"
- [ ] Emotion tags announced as list
- [ ] Photo descriptions from Vision framework = alt text
- [ ] Dynamic Type: all text scales
- [ ] Reduce Motion: disable particle animations

### Performance

- [ ] Cold launch to Home: < 2 seconds
- [ ] Venue card processing: < 3 seconds (WiFi)
- [ ] Memory narrative generation: < 5 seconds per memory
- [ ] Photo analysis (Vision): background, non-blocking, < 1s per photo
- [ ] Living Timeline scroll: 60fps with 50+ entries
- [ ] Battery: < 5% per 8-hour day with ambient capture active

---

## Prioritization Matrix

| Story | User Value | Complexity | Priority | Phase | Reuse % |
|-------|-----------|------------|----------|-------|---------|
| US-001 Discovery | Very High (acquisition) | Medium (API + UI) | **P0** | 1 | 70% (API exists) |
| US-002 Permission Onboarding | High (trust) | Low (UI only) | **P0** | 1 | 0% (native iOS) |
| US-101 Paste/Describe Trip | High (utility) | Medium (parsing) | **P0** | 1 | 80% (API exists) |
| US-102 Review Places | High (engagement) | Low (UI) | **P0** | 1 | 30% (patterns) |
| US-201 Arrival + Photo Linking | Very High (core) | **High** (background + CoreLocation + PhotoKit) | **P0** | 2 | 20% (schemas only) |
| US-301 Review Draft Memory | Very High (core) | **High** (narrative gen + UI) | **P0** | 2 | 60% (SE API + prompts) |
| US-302 Memory Card | Very High (retention) | Medium (UI + sensory) | **P0** | 2 | 50% (SE generates anchors) |
| US-303 Living Timeline | High (engagement) | Low (UI) | **P1** | 2 | 10% (SwiftData query) |
| US-202 Voice Notes | Medium (enrichment) | Medium (audio + Speech) | **P1** | 3 | 40% (SE schema) |
| US-401 Sensor Nudges | Medium (conversion) | Low (UI) | **P1** | 3 | 0% |

### Recommended Build Order

**Phase 1 (Weeks 1-4): The Hook**
1. US-001 Discovery + US-102 Review Places (core first-run loop)
2. US-002 Permission Onboarding
3. US-101 Paste/Describe Trip (returning user flow)
4. **Deploy Sensory Engine** to Vercel (replace Phi-3 mocks with Claude)

**Phase 2 (Weeks 5-10): The Platform**
5. US-201 Arrival Detection + Photo Linking (**hardest story -- start early**)
6. US-301 Review Draft Memory (depends on SE deployment + Vision metadata)
7. US-302 Memory Card (depends on US-301)
8. US-303 Living Timeline

**Phase 3 (Weeks 11-14): Enrichment**
9. US-202 Voice Notes
10. US-401 Sensor Nudges
11. Refinement based on user testing

### Critical Path

```
Deploy Sensory Engine (P0 blocker for Phase 2)
    |
    v
US-201 Arrival Detection ──> US-301 Draft Memory ──> US-302 Memory Card
    |                             |
    v                             v
Vision metadata extraction   Claude narrative generation
(on-device)                  (via SE API, metadata only)
```

---

## Technical Spikes (Before Phase 2)

| Spike | Question | Duration | Blocks |
|-------|----------|----------|--------|
| CoreLocation reliability | Does background geofencing wake app reliably from terminated state on iPhone 13/15? | 2 days | US-201 |
| PhotoKit performance | Can `PHAsset.fetchAssets` query 10,000+ photos by date range in < 1s? | 1 day | US-201 |
| Vision framework quality | Does `VNClassifyImageRequest` return scene/lighting/crowd data matching SE's schema? | 2 days | US-301 |
| Speech accuracy | What's `SFSpeechRecognizer` accuracy with travel ambient noise? | 1 day | US-202 |
| SE deployment | Deploy Sensory Engine to Vercel, verify Claude synthesis with real data | 1 day | US-301 |
| Narrative quality | Test SE's Claude prompt with real photo metadata -- is output quality sufficient? | 1 day | US-301 |

---

## What Was Cut From v1/v2 (and Why)

| Previous Story | Decision | Reason |
|----------------|----------|--------|
| Confidence scores per field | **Cut** | Travel planning, not journaling |
| Review/edit parsed data with % badges | **Cut** | Over-engineered for input step |
| Energy Score (0-100) | **Replaced** by Sensory Anchors | Prose > numbers for memories |
| Screenshot disable | **Cut** | Paternalistic |
| Map view for location trail | **Deferred** | Narrative captures place through prose, not pins |
| Phi-3 on-device LLM | **Replaced** by Claude API with metadata-only | Better quality, privacy preserved via architecture |
| Apple Intelligence adapter | **Deferred** | SDK not ready; hybrid model sufficient |

---

## Open Questions

### Product Decisions
1. **Multi-device sync?** Not in MVP. Consider iCloud in Phase 4.
2. **Surprise memories (unplanned venues)?** MVP captures only marked venues. Phase 3 could detect "new favorite spot."
3. **Trip sharing/export?** Not in MVP. Consider JSON/PDF export in Phase 3.

### User Research
1. **"This feels right" acceptance rate** -- how good must Quinn's draft be? Test with 20 real memories.
2. **Sensory anchor resonance** -- do users connect with "Sound: The low percussion of bamboo in wind"? Or does it feel pretentious?
3. **Permission conversion** -- does value-framed onboarding outperform standard iOS prompts?

---

## Definition of Done (Global)

Every feature must satisfy (adapted from Travel repo):

### Core (All Changes)
- [ ] Telemetry coverage (anonymous events for new interactions)
- [ ] Security non-regression (no new PII, input validation)
- [ ] Test coverage (unit + integration, 70% line / 60% branch)
- [ ] Type safety (Swift strict concurrency, no force unwraps)

### UI Changes (from Sprint 1 post-mortem)
- [ ] Loading state shown for all async operations > 500ms
- [ ] Tested at smallest viewport (iPhone SE 3rd gen, 375pt width)
- [ ] Feature purpose clear without developer explanation
- [ ] Fallback/error states produce distinct, reasonable output
- [ ] Dark mode verified (dark-first design)
- [ ] VoiceOver tested for all new screens

### API Changes
- [ ] Error messages don't leak internal details
- [ ] Response validated against Zod schemas (SE) / Swift Codable (iOS)
- [ ] No PII in API payloads (only metadata)
- [ ] Network calls logged in Settings for user audit

### Privacy (Quinn-Specific)
- [ ] Raw photos never in network payload
- [ ] Raw audio never in network payload
- [ ] GPS coordinates never in network payload (except coarsened weather)
- [ ] Verbatim transcript never in network payload
- [ ] "Your data stays on your device" claim verified by network inspection
- [ ] Data deletion works (single venue, whole trip, everything)

---

## Document History

- **v3.0** (2026-02-23): Comprehensive rewrite integrating Sensory Engine codebase analysis. Added build/reuse inventory per story. Resolved narrative generation strategy (hybrid: on-device extraction, Claude for prose). Added decision points, technical spikes, and Travel-repo-style DoD. (Opus)
- **v2.0** (2026-02-23): Rewrite aligned with three-journeys mockup. Replaced itinerary-planning focus with ambient-journaling focus. (Opus)
- **v1.0** (2026-02-21): Initial user stories for Quinn iOS MVP. Focused on itinerary parsing and venue validation. (Sonnet)
