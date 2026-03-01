# Quinn iOS App - User Stories v4

**Version:** 4.5
**Date:** 2026-02-28
**Authors:** Claude Sonnet (v4 rewrite + cross-repo audit), Claude Opus (v2/v3 strategy), Sachin Verma (product)
**Purpose:** iOS user stories validated against business personas (Sarah, Marco, David, Linda, Aisha), persona panel research, and ALL Quinn repos (sensory-engine, travel, business, Quinn iOS, QuinnAudio, .com, SensoryEngine). Travel is the acquisition hook. Ambient journaling is the platform.

---

## V4 Launch Constraints

### 1. Launch Personas: Sarah, Marco, and Linda Only

**David (Privacy-Conscious Engineer) and Aisha (Mindfulness Practitioner) are NOT V4 launch targets.**

Their stories are retained in this document for product completeness, but the following applies for V4:

- **GTM messaging must not address David or Aisha.** No "open source", "self-hostable", "mindfulness", "presence vs. capture" language in launch marketing, App Store copy, or acquisition campaigns.
- **Features built for David or Aisha (US-302 Edit/Override, US-501 Privacy Dashboard) are built because they improve the product for all personas** — not because we are launching to David or Aisha specifically.
- David's conversion is post-launch work: requires a public architecture doc, third-party audit, and network traffic verification. Not feasible in V4.
- Aisha's conversion requires honest copy addressing the ambient-capture paradox. Deferred to V4.1+ once we have real user language from Linda/Sarah/Marco.

> **The "David test" and "Aisha test" in the DoD are engineering quality gates, not marketing targets.** Keep them as internal quality checks.

### 2. Architecture Principle: Local-First First Iteration

**The first iteration of every feature must process all user data on-device. No user data is sent to any cloud API.**

This is an architectural constraint, not a positioning choice:

| Data Type | Rule |
|-----------|------|
| Photos | Analysed on-device via Vision/CoreML — never sent to any API |
| Voice / audio | Never transmitted |
| Voice transcript | Processed on-device via `SFSpeechRecognizer` + `NLTagger` — never transmitted |
| GPS / location | Never transmitted — only user-provided venue name used |
| Narrative generation | **On-device LLM first** (Llama 3.2 3B via MLX, Phi-3, or Apple Intelligence). SE cloud API is the quality-validated upgrade path — not the default. |
| Venue enrichment | Cloud permitted — not user-personal data ✅ |
| Weather | Cloud permitted — coarsened coordinates only ✅ |

**Impact on current stories:**
- Narrative generation (US-301) must be attempted on-device first. SE API is the fallback if the quality spike fails, not the starting point.
- `LLMParserService.swift` (Quinn iOS): replace Gemini with on-device model. Travel API is acceptable as interim if on-device quality is insufficient.
- "Deploy Sensory Engine" is a Phase 2 decision gate, not a Phase 1 prerequisite.

### 3. Telemetry Tool: PostHog iOS SDK

All telemetry uses **PostHog iOS SDK (`posthog-ios`)** — anonymous, ephemeral sessions, no user identity, no device fingerprint. See Cross-Cutting Requirements → Telemetry for the full event schema.

---

---

## How to Read This Document

Each user story includes:
- **Persona** -- which of the 5 validated business personas this story serves
- **Build Status** -- what exists in the Sensory Engine or Travel repo (reusable vs new)
- **Decision Points** -- open questions requiring product/technical decisions
- **Acceptance Criteria** -- checkboxes matching Travel repo DoD rigor
- **Privacy & Security** -- per-story privacy analysis
- **Edge Cases** -- from Sprint 1 post-mortem and persona panel learnings
- **Testing** -- unit, integration, UI, accessibility, privacy

---

## North Star

> **Ambient journaling is the platform. Travel validation is the acquisition hook.**

The iOS app captures, remembers, and narrates experiences -- for parents, caregivers, travelers, mindfulness practitioners, and anyone who wants to live in the moment and relive the full story.

Every story must pass:

1. Does this serve ambient journaling? If it's trip planning, cut it.
2. Does this require storing user data? If yes, it stays on-device.
3. Does this belong in the current phase? If not, defer.

---

## Validated Personas (from Business Repo)

### Sarah -- New Parent
- **Age:** 32, first-time mother, on parental leave from marketing
- **Core Problem:** 4,000+ unorganized baby photos. Tried Day One but abandoned it (too much effort with a newborn). Fears forgetting milestones. Feels guilty about phone use during precious moments.
- **Key Question:** "Will this drain my battery while I'm out all day with the stroller?"
- **Price Sensitivity:** $5-10/month
- **Conversion Score:** 7/10 (v3 positioning), 7.5/10 (demo)
- **Resonant Moments:** "First Giggle: It happened while you weren't even looking." | "Ordinary Tuesday: Baby in bouncer, stealing 10 minutes for coffee."

### Marco -- Experience-Seeking Traveler
- **Age:** 28, UX designer, travels 6-8 weeks/year
- **Core Problem:** Complicated relationship with Instagram. Believes best travel moments were the ones he didn't photograph. Values design above all.
- **Key Question:** "Can I see what the app actually looks like? Show me the UX."
- **Price Sensitivity:** $8-15/month for beautifully designed product
- **Conversion Score:** 4/10 (v3 positioning), 7/10 (demo) -- design-driven unlock
- **Resonant Moments:** "Unnamed Cafe, Lisbon: Solo breakfast, rain on the window, espresso." | "Getting Lost: No idea where you are, and it's perfect."

### David -- Privacy-Conscious Engineer
- **Age:** 41, senior software engineer, two kids
- **Core Problem:** Left Google Photos. Self-hosts with Immich. Deeply skeptical of privacy claims. Reads architecture docs before trusting.
- **Key Question:** "Is it open source? Where's the architecture documentation?"
- **Price Sensitivity:** $39-59/year if privacy verifiable
- **Conversion Score:** 7.5/10 (v3 positioning), 5/10 (demo -- can't verify claims)
- **What Would Convert:** Public GitHub repo with encryption schema. Network traffic audit. Third-party security review.

### Linda -- Caregiver / Memory Preservation
- **Age:** 57, recently retired teacher
- **Core Problem:** Mother (82) with early-stage Alzheimer's. Spending time capturing stories before they fade. Uses iPhone voice memos but everything scattered. Not tech-savvy.
- **Key Question:** "Could I use this when I'm visiting my mom? Would it capture her voice telling stories?"
- **Price Sensitivity:** $15-20/month -- would pay almost anything for genuine help
- **Conversion Score:** 6.5/10 (v3 positioning), **8.5/10 (demo) -- highest PMF signal across all rounds**
- **Critical Note:** Requires simplest possible language. Terms like "Sensory Agent" are alienating. Use "captures voices," "remembers the sounds," "stays private on your phone."
- **Resonant Moments:** "Sunday at Mom's Kitchen: The clatter of dishes, her humming that song, the smell of tomato sauce." | "Dad's Story, Again: He told the one about his first car. Captured forever this time."

### Aisha -- Mindfulness Practitioner
- **Age:** 35, yoga instructor, part-time wellness content creator
- **Core Problem:** Journals daily, loves richer journaling but finds digital tools soulless. Skeptical of tech co-opting mindfulness language.
- **Key Question:** "Can I correct Quinn's interpretation? If it says I felt 'joyful' but I was actually anxious, am I the authority over my own experience?"
- **Price Sensitivity:** $7/month for genuinely enhanced practice
- **Conversion Score:** 7/10 (v3 positioning), 5.5/10 (demo -- no editability shown)
- **The Paradox:** Quinn says "stop logging" but IS logging automatically. Wants this tension addressed honestly.
- **Resonant Moments:** "Morning Walk: Frost on the grass, your breath visible, the dog pulling ahead." | "Savasana: The room went quiet. Someone was crying softly. You felt held."

---

## Codebase Inventory

### What Exists (Reusable)

**Sensory Engine (Next.js -- `WithQuinn/sensory-engine`)**

| Asset | File | Reuse Strategy |
|-------|------|----------------|
| MomentSense schema | `lib/sensoryValidation.ts` | Port Zod types to Swift `@Model` classes |
| SensoryInput schema | `lib/sensoryValidation.ts` | Port to Swift structs for API payload |
| TranscendenceFactors | `lib/sensoryValidation.ts` | Port scoring weights to Swift |
| Narrative synthesis prompt | `lib/sensoryPrompts.ts` | **Port to Swift as primary path** (on-device LLM). SE API is quality-gate fallback only — see V4 Launch Constraints. |
| Fallback narrative engine | `lib/sensoryPrompts.ts` | Port to Swift — **this is now the V4 primary path, not the fallback** |
| Transcendence scoring algorithm | `lib/excitementEngine.ts` | Pure math -- direct port to Swift |
| Wikipedia venue enrichment | `lib/sensoryData.ts` | Keep server-side, iOS consumes API |
| Weather integration | `lib/weatherData.ts` | Keep server-side, 11km coarsening intact |
| Privacy architecture | `PROJECT.md` | Hybrid model already designed |

**Travel / Fact Agent (Next.js -- `WithQuinn/travel`)**

| Asset | File | Reuse Strategy |
|-------|------|----------------|
| Venue discovery flow | `app/api/parse-itinerary/route.ts` | iOS calls existing API |
| Venue suggestions + SSE streaming | `app/api/suggest-venues/route.ts` | iOS calls API, stream venue cards in real-time |
| Iterative refinement questions | `lib/smartRefinement.ts` | iOS calls API for follow-up questions per destination |
| Seed question cache | `lib/refinementCache.ts` | Instant first question for popular destinations (zero API call) |
| Venue insights cache | `lib/insightsCache.ts` | Pre-curated facts/atmosphere/poetic for 30+ venues (instant load) |
| CSRF + API client | `lib/apiClient.ts` | Pattern for secure API calls with session tokens |

**Quinn iOS App (Swift -- `WithQuinn/Quinn`)**

| Asset | File | Reuse Strategy |
|-------|------|----------------|
| ItineraryItem SwiftData model | `Features/FactAgent/ItineraryImport/Model/ItineraryItem.swift` | **Already built** -- SwiftData @Model with title, date, time, location, attendees, notes |
| Itinerary import UI | `Features/FactAgent/ItineraryImport/View/ItineraryImportView.swift` | **Already built** -- SwiftUI import screen |
| Itinerary review UI | `Features/FactAgent/ItineraryImport/View/ItineraryReviewView.swift` | **Already built** -- SwiftUI review screen |
| Import ViewModel | `Features/FactAgent/ItineraryImport/ViewModel/ItineraryImportViewModel.swift` | **Already built** -- MVVM pattern |
| LLM parser service | `Services/LLMParserService.swift` | Exists but uses Gemini -- **DECISION RESOLVED: replace with on-device LLM (Llama 3.2 3B via MLX or Apple Intelligence). Travel API acceptable as interim if on-device quality insufficient, but cloud-to-cloud (Gemini) is not permitted per V4 local-first constraint.** |
| BrandTheme | `BrandTheme.swift` | Exists but uses blue glow -- **needs update to match canonical theme** |
| Home screen shell | `Features/Home/HomeView.swift` | **Already built** -- basic home view |
| Color hex extension | `BrandTheme.swift` | **Already built** -- `Color(hex:)` utility |

**QuinnAudio iOS App (Swift -- `WithQuinn/QuinnAudio`)**

| Asset | File | Reuse Strategy |
|-------|------|----------------|
| Audio engine recorder | `QuinnAudio/Audio/AudioEngineRecorder.swift` | **Already built** -- AVAudioEngine PCM -> AAC 16kHz, pause/resume, interruption handling |
| Audio session manager | `QuinnAudio/Audio/AudioSessionManager.swift` | **Already built** -- AVAudioSession config, background recording, Bluetooth, interruption delegate |
| Audio player | `QuinnAudio/Audio/AudioPlayer.swift` | **Already built** -- playback for recorded audio |
| Recording engine protocol | `QuinnAudio/Audio/RecordingEngineProtocol.swift` | **Already built** -- abstraction layer for recorder |
| Battery monitor | `QuinnAudio/Services/BatteryMonitor.swift` | **Already built** -- real-time battery level/state, low-battery warnings at 20% |
| Low power mode monitor | `QuinnAudio/Services/LowPowerModeMonitor.swift` | **Already built** -- detects Low Power Mode for adaptive behavior |
| Device capability detection | `QuinnAudio/Utils/DeviceCapability.swift` | **Already built** -- A15-A18 Pro chip detection from device identifier, BGContinuedProcessing support check |
| Recording store | `QuinnAudio/Services/RecordingStore.swift` | **Already built** -- local storage for audio recordings |
| Notification manager | `QuinnAudio/Services/NotificationManager.swift` | **Already built** -- local notification handling |
| Recording model | `QuinnAudio/Models/Recording.swift` | **Already built** -- recording data model |
| Quinn color palette | `QuinnAudio/Theme/Colors.swift` | Exists but uses light theme -- **needs update to match canonical dark theme** |
| Typography system | `QuinnAudio/Theme/Typography.swift` | **Already built** -- San Francisco type scale with semantic styles |
| Log manager | `QuinnAudio/Services/LogManager.swift` | **Already built** -- structured logging |

**Other Repos**

| Asset | Repo | Reuse Strategy |
|-------|------|----------------|
| Interactive demo | `.com` (`quinn-demo.jsx`) | Design reference only -- React, not iOS |
| Design tokens (demo) | `.com` | `#1C1917` stone palette, `#C4B8A8` taupe -- closest to three-journeys mockup |
| SensoryEngine frontend | `SensoryEngine` (Vite/React) | Web-only, no iOS reuse |

### What Must Be Built (iOS-Native, Genuinely New)

| Component | Stories | Framework | Complexity | Notes |
|-----------|---------|-----------|------------|-------|
| CoreLocation geofencing | US-201 | CoreLocation | High | No existing code |
| PhotoKit time-window queries | US-201 | PhotoKit | Medium | No existing code |
| Vision photo analysis | US-301 | Vision, CoreML | Medium | No existing code |
| Speech transcription + NLTagger | US-202 | Speech, NaturalLanguage | Medium | No existing code (QuinnAudio has recording but not transcription) |
| Background task scheduling | US-201 | BGTaskScheduler | High | QuinnAudio has `DeviceCapability.supportsBGContinuedProcessing` check |
| SwiftUI screens (new flows) | US-002, US-301, US-302, US-303, US-401, US-501 | SwiftUI | Medium-High | US-001/US-101 import views already exist in Quinn repo |
| Edit/Override system | US-302 | SwiftUI + SwiftData | Medium | No existing code |
| Network audit log | US-501 | URLSession interceptor | Medium | No existing code |
| Processing pipeline visualization | US-501 | SwiftUI | Medium | Strongest trust builder from demo panels -- show "on device" vs "public data" in real-time |

### What Already Exists in iOS Repos (Integrate, Don't Rebuild)

| Component | Source Repo | Stories | Notes |
|-----------|-----------|---------|-------|
| Audio recording (AVAudioEngine) | QuinnAudio | US-202 | Full implementation: record, pause, resume, interruptions, background |
| Audio session management | QuinnAudio | US-202 | Configured for playAndRecord, Bluetooth, speaker routing |
| Audio playback | QuinnAudio | US-301, US-302 | Voice note player for memory review |
| Battery monitoring | QuinnAudio | US-201, US-501 | Real-time battery level, low-battery warnings -- addresses Sarah's concern |
| Low Power Mode detection | QuinnAudio | US-201 | Adaptive behavior when battery-conscious |
| Device chip detection (Swift) | QuinnAudio | US-201 | A15-A18 Pro mapping, BGContinuedProcessing support |
| Recording storage | QuinnAudio | US-202 | Local recording persistence |
| Local notifications | QuinnAudio | US-002 | Notification scheduling |
| Structured logging | QuinnAudio | All | LogManager with categories |
| SwiftData ItineraryItem | Quinn | US-101 | Model with title, date, location, attendees, confidence scores |
| Itinerary import UI + ViewModel | Quinn | US-101 | Full MVVM: import view, review view, view model |
| Home screen shell | Quinn | US-001 | Basic home view structure |
| Color hex extension | Quinn | Design System | `Color(hex:)` utility |
| Typography system | QuinnAudio | Design System | Semantic type scale (title, headline, body, caption) |

---

## Epic 0: First Run Experience

**Business Goal:** Build trust and demonstrate value within 60 seconds. Zero permissions before value. Travel discovery is the acquisition hook -- but the promise must extend beyond travel.

**Persona Panel Learnings:**
- Marco: Won't convert until he sees design quality. The first run IS the demo.
- Linda: Needs simplest possible language. Will abandon anything confusing.
- Sarah: No patience for complex onboarding with a newborn.
- David: Inspecting from moment one. Every claim must be verifiable.

**Success Metrics:**
- 80%+ of first-run users reach Discovery Complete
- 50%+ enable at least one sensor permission during onboarding
- 0 permissions requested before user has seen value
- Privacy comprehension: users can explain "your data stays on your device" in their own words

---

### US-001: First Encounter ("Where are you drawn to?")

**Primary Persona:** Marco (design-driven unlock)
**Also Serves:** Sarah (quick value), Linda (simple entry)

**As Marco (experience-seeking traveler)**
**I want to** tell Quinn where I'm thinking of going -- or just a feeling I have
**So that** Quinn shows me places I might be drawn to
**Without** signing up, giving my name, or granting any permissions first

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Itinerary parsing API | **Reuse** | Travel: `/api/parse-itinerary` | Handles destinations, regions, feelings. |
| Venue suggestion API + SSE | **Reuse** | Travel: `/api/suggest-venues` | Returns 3-5 venue cards via Server-Sent Events streaming -- cards appear one-by-one in real-time. |
| Venue insights cache | **Reuse** | Travel: `lib/insightsCache.ts` | Pre-curated fact/atmosphere/weather/poetic for 30+ popular venues. **Instant load, zero API call.** |
| Venue card data model | **Reuse** | Travel: `VenueSuggestion` type | Name, description, category, relatedTo. |
| Prose descriptions | **Reuse** | Travel: Claude prompt | Already generates evocative descriptions. |
| Mood tags | **Partial** | Travel: `insightsCache.ts` has "atmosphere" | Extend with mood/feeling tags in prompt. |
| Best time / Insider tip | **Partial** | Travel: `insightsCache.ts` has "weather" + atmosphere timing | Extend Claude prompt for insider tips. |
| Hero photos | **Partial** | Travel: Google Places photos | Needs mobile-optimized sizing. |
| Home screen shell | **Reuse** | Quinn: `HomeView.swift` | **Already built** -- basic home view. |
| SwiftUI venue card UI | **New** | -- | Match three-journeys mockup. |
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

**UX & Design (Marco's unlock -- craft matters):**
- [ ] Dark theme: `#0a0a0a` bg, `#c4b8a8` accent
- [ ] Fonts: Cormorant Garamond (headlines), DM Sans (body), DM Mono (metadata)
- [ ] Venue card swipe gesture (horizontal between venues)
- [ ] "Drawn to this" heart icon badge on hero photo
- [ ] Bottom nav: Discover (active) | Capture | Memories
- [ ] Particle animation on landing (subtle, OLED-friendly)
- [ ] Skeleton cards during processing (not spinner)
- [ ] **Marco test:** Would a UX designer screenshot this to share on Twitter/X? If not, redesign.

**Edge Cases (Sprint 1 post-mortem):**
- [ ] Vague input ("I want to relax") -> Quinn interprets intent, surfaces 3 destinations
- [ ] Nonsense input ("asdfgh") -> "We couldn't find places matching that. Try a city name or describe what you're looking for."
- [ ] No network -> "Quinn needs a connection to discover places. Connect to WiFi or mobile data to get started."
- [ ] User taps "Next place" on all venues -> "None of these spoke to you? Tell us more." with retry input
- [ ] API returns < 3 venues -> Show what's available, don't block on minimum
- [ ] Loading > 5s -> Progress text updates ("Still searching...", "Almost there...") -- **Sprint 1: never leave users without feedback > 500ms**

**Testing:**
- [ ] Unit: Venue card data model parsing from API response
- [ ] UI: Full first-run flow from landing to Discovery Complete (XCUITest)
- [ ] Performance: Landing to first venue card < 3s on WiFi
- [ ] Accessibility: VoiceOver reads venue prose descriptions naturally
- [ ] Privacy: Network inspector confirms no user ID in API calls
- [ ] Mobile: Tested on iPhone SE (smallest screen), iPhone 15 Pro Max (largest)

**Decision Points:**
- [ ] **DECISION NEEDED:** Should venue suggestions come from Travel API (existing) or a new iOS-specific endpoint? Recommendation: reuse Travel API to avoid duplication.
- [ ] **DECISION NEEDED:** Mood tags and insider tips -- extend existing Claude prompt or add a post-processing step? Recommendation: extend prompt, single API call.

---

### US-002: Permission Onboarding (Value-Framed)

**Primary Persona:** Sarah (trust with child's data)
**Also Serves:** David (verifiable claims), Linda (simple language), Aisha (philosophical honesty)

**As Sarah (new parent)**
**I want to** understand exactly what Quinn will do with my baby's photos, my location, and my notifications
**So that** I can decide which sensors to enable
**Without** feeling pressured, guilty, or confused about what I'm agreeing to

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Permission UI | **New** | -- | Three toggle cards matching mockup screen a-6. |
| iOS permission prompts | **New** | -- | CLLocationManager, PHPhotoLibrary, UNUserNotificationCenter |
| Permission state management | **New** | -- | SwiftData model tracking per-permission state |
| Graceful degradation logic | **New** | -- | App works with any combination of permissions |

#### User Journey (Maps to Mockup: First Run, Screen a-6)

1. After tapping "I'm ready" on Discovery Complete
2. Headline: "Let Quinn notice for you."
3. Subtext: "When you arrive at Fushimi Inari, Nishiki Market, or Arashiyama, Quinn will quietly catch what you might forget."
4. Three permission cards (each with toggle):
   - **Location**: "Quinn notices when you arrive at places you were drawn to. Nothing is shared."
   - **Photos**: "Photos you take nearby become part of your memory. They never leave your device."
   - **Notifications**: "A gentle nudge when Quinn has assembled a memory for you."
5. CTAs: "I'm ready" (primary) | "Maybe later" (ghost)
6. Lock icon: "Your data stays on your device"
7. Each toggle triggers native iOS permission prompt only when turned ON
8. "Maybe later" skips all permissions -- app works in degraded mode

#### Acceptance Criteria

**Functional:**
- [ ] Each permission card independently toggleable
- [ ] Toggling ON triggers the native iOS permission dialog
- [ ] "Maybe later" bypasses all permissions -- app proceeds to Home
- [ ] Permission states persisted to SwiftData -- never re-asked unless user revisits Settings
- [ ] App works with any combination of permissions (all on, all off, mixed)
- [ ] Graceful degradation per permission:
  - Location OFF: No arrival detection, manual check-in only
  - Photos OFF: No auto-linked photos, manual add later
  - Notifications OFF: Memories wait silently until user opens app

**Privacy & Security (David's requirements):**
- [ ] Permission explanations match Apple's required usage description strings exactly
- [ ] No dark patterns: "Maybe later" visually equal to "I'm ready", not hidden
- [ ] Permission state never sent to analytics (only: `permissions_onboarding_completed` count)
- [ ] No re-prompting for denied permissions -- show Settings deep-link instead
- [ ] **David test:** Would a privacy-conscious engineer share a screenshot of this onboarding as "how it should be done"?

**Language (Linda's requirement):**
- [ ] No technical jargon: "notices" not "geofences", "stays on your device" not "local-first"
- [ ] Value-framing: "Quinn will notice for you" not "we need access to..."
- [ ] Tone: invitation, not demand

**Edge Cases:**
- [ ] User enables location but denies native iOS prompt -> Toggle reverts to OFF, show: "You can enable this in Settings anytime."
- [ ] User force-quits during onboarding -> Resume from same screen on next launch
- [ ] iOS "Reduce Motion" enabled -> Simplify transitions
- [ ] User already granted permissions from previous install -> Skip to Home
- [ ] iPad layout -> Wider cards, larger toggles

**Testing:**
- [ ] Unit: Permission state management (all 8 combinations of 3 toggles)
- [ ] UI: Full onboarding flow (XCUITest)
- [ ] UI: "Maybe later" flow -> verify app works without permissions
- [ ] Privacy: Verify no permission state in telemetry payload
- [ ] Accessibility: VoiceOver describes each toggle's purpose and state

---

### US-050: Quick Capture (Phase 1 Retention Bridge)

**Primary Persona:** Marco (travel capture), Sarah (baby milestones), Linda (Mom moments)
**Also Serves:** Aisha (mindfulness journaling)

**As Marco (experience-seeking traveler)**
**I want to** quickly capture a photo, speak a few words, and jot a note
**So that** Quinn writes a short narrative about the moment — on my device, instantly
**Without** waiting for Phase 2 ambient detection to ship

**As Linda (caregiver)**
**I want to** capture a moment at mom's kitchen with a photo and a voice clip
**So that** Quinn preserves it as a mini memory while I'm still there

#### Retention Problem This Solves

Phase 1 is entirely travel discovery. A user downloading the app in Week 4 sees venue cards and a "Coming soon" Capture card — nothing to do with it. US-050 fills the Capture card with a working lightweight feature that demonstrates Quinn's personality before the full ambient engine (Phase 2) ships.

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| RecordingEngineProtocol | **Reuse** | QuinnAudio | Copied as-is — AVAudioEngine interface abstraction |
| AudioEngineRecorder | **Simplified** | QuinnAudio | Stripped: pause/resume, background lifecycle, LogManager. Keep: start/stop, PCM→AAC |
| AudioSessionManager | **Simplified** | QuinnAudio | Stripped: LogManager. Keep: configureForRecording, deactivate |
| TemplateNarrativeEngine | **New (ported)** | sensoryPrompts.ts `generateFallbackNarrative()` | ~80 template bank — zero ML, zero cloud, <100ms |
| QuickCapture @Model | **New** | -- | SwiftData model: photo, audio, note, narrativeShort, narrativeMedium |
| QuickCaptureStore | **New** | -- | File management under Documents/QuickCaptures/, EXIF-stripping, cascade delete |
| CaptureFlowViewModel | **New** | -- | 4-step orchestration: photo → voice → text → preview |
| VoiceRecorderViewModel | **New** | -- | 60s max, haptics, auto-stop, permission request |
| UI Views (6) | **New** | -- | CaptureListView, CaptureFlowView, PhotoCaptureStepView, VoiceClipStepView, TextNoteStepView, NarrativePreviewView |
| MiniMemoryCardView | **New** | -- | Reusable card component using BrandTheme tokens |
| HomeView integration | **Updated** | Quinn: HomeView.swift | Capture card: NavigationLink to CaptureListView (was disabled) |

#### Architecture Decisions

- **Template narrative only** — `TemplateNarrativeEngine.swift` ports `generateFallbackNarrative()` from `sensoryPrompts.ts`. No LLM, no cloud, zero latency. This IS the primary path for Phase 1, not a fallback.
- **NavigationLink, not TabView** — HomeView is a NavigationStack. The Capture card navigates to `CaptureListView`. TabView conversion happens when the full first-run experience (US-001) ships.
- **Single photo** — One photo per capture. Multi-photo is Phase 2 ambient detection (US-201).
- **60-second voice clip max** — Quick capture, not full voice notes (US-202 is 10 min).
- **Captures live on Capture screen only** — No Memories tab integration until Phase 2 when the full Memory model ships.
- **All files under Documents/QuickCaptures/** — Photos and audio are never transmitted. EXIF stripped from saved photos.

#### User Journey

1. Taps "Capture" on HomeView → `CaptureListView` opens
2. Empty state: "Catch a moment" + camera icon + "Tap + to start"
3. Taps "+" → `CaptureFlowView` opens full-screen
4. **Step 1 — Photo**: Take with camera or pick from library. One required. Preview shown after selection.
5. **Step 2 — Voice** (optional): Large record button + timer. 60s max. Skip button available.
6. **Step 3 — Note** (optional): Multi-line text, 500 char max. Thumbnail reminder. Soft prompt if both voice and note skipped.
7. **Step 4 — Preview**: Quinn's narrative on a MiniMemoryCardView. "Save memory" (primary) or "Edit note" (back to Step 3).
8. Saved capture appears in `CaptureListView`, newest first.

#### Acceptance Criteria

**Functional:**
- [ ] Capture card on HomeView navigates to CaptureListView (no longer disabled)
- [ ] Empty state shows "Catch a moment" with a "+" CTA
- [ ] "+" opens CaptureFlowView as fullScreenCover
- [ ] Step 1: Camera (UIImagePickerController) and library (PHPicker) both work. Photo required to advance.
- [ ] Step 2: Microphone permission requested on first entry. Record/stop by tapping button. 60s auto-stop with haptic. Skip button dismisses without recording.
- [ ] Step 3: TextEditor with 500 char max. Placeholder text visible when empty. Soft prompt if both voice and note are empty.
- [ ] Step 4: MiniMemoryCardView rendered with Quinn's narrative. "Save memory" persists to SwiftData. "Edit note" returns to Step 3.
- [ ] Saved captures appear in CaptureListView, sorted newest-first.
- [ ] Swipe-to-delete with confirmation dialog.
- [ ] Delete cascades: removes SwiftData record AND photo/audio files from disk.

**Privacy & Security:**
- [ ] Zero network requests during entire capture flow (URLSession monitor shows no outbound traffic)
- [ ] All files written to Documents/QuickCaptures/Photos/ and Documents/QuickCaptures/Audio/ only
- [ ] EXIF metadata stripped from saved JPEG photos (orientation normalized via UIGraphicsBeginImageContextWithOptions)
- [ ] QuickCapture SwiftData model not synced to iCloud (local only)

**Narrative Quality (Template Engine):**
- [ ] Non-empty short and medium outputs for all valid inputs
- [ ] Contains sensory language for notes mentioning: light, rain, quiet, warm, cold, wind, music, coffee, food, sun, walk, voice, laugh, smell, water
- [ ] Medium narrative < 200 words
- [ ] Generation < 100ms (timed assertion in unit tests)
- [ ] Deterministic: same input always produces same output

**UX & Design:**
- [ ] All colors use BrandTheme tokens (surface, accent, textPrimary, textSecondary, textMuted, purple, green, borderSubtle)
- [ ] All typography uses BrandTheme type scale (headline, body, bodyBold, caption, mono)
- [ ] MiniMemoryCardView: photo (max 200pt height), narrative in Cormorant Garamond (first sentence) / DM Sans (rest), timestamp in DM Mono
- [ ] Voice clip indicator (purple waveform icon) shown when audio present
- [ ] Haptic feedback: record start (medium impact), record stop (light impact), save success (notification success)
- [ ] **Marco test:** Would a UX designer screenshot this card to share? If not, redesign.
- [ ] **Linda test:** Would a 57-year-old teacher know what to do on each screen within 5 seconds?

**Edge Cases:**
- [ ] Camera permission denied → Library-only mode (UIImagePickerController falls back to .photoLibrary source type)
- [ ] Microphone permission denied → "Enable in Settings" banner shown, voice step skippable
- [ ] Both voice and note skipped → Soft prompt in Step 3, but user can still advance and save
- [ ] Photo save fails → Error shown, capture not saved
- [ ] Voice clip < 0.5s → Discarded (too short to be intentional), treated as skip
- [ ] App backgrounded mid-recording → Recording continues (AVAudioSession configured for playAndRecord)

**Testing:**

*Unit (QuinnTests):*
- [ ] `QuickCapture` SwiftData model: insert, fetch, delete
- [ ] `QuickCaptureStore`: photo save (verifies file exists, size > 0), audio URL creation, cascade delete
- [ ] `TemplateNarrativeEngine`: 10+ input combos — photo+note, photo+voice, morning vs evening, each sensory keyword, empty note, long note
- [ ] Narrative output: non-empty, < 200 words, generation < 100ms
- [ ] EXIF stripping: saved JPEG has no EXIF orientation data in raw bytes

*UI (QuinnUITests):*
- [ ] Full capture flow: card tap → photo → note → preview → save → appears in list
- [ ] Skip voice clip flow
- [ ] Empty state renders with CTA
- [ ] Swipe-to-delete → confirmation → removed from list

*Privacy:*
- [ ] URLSession monitor confirms zero outbound requests during full capture flow
- [ ] All written files are under Documents/QuickCaptures/

#### Persona-Specific Tests

**Marco test:** Marco photographs a rain-streaked café window and types "Rain on the window. Espresso cooling." Quinn writes: "Sunday morning. Morning light, still soft. Rain on the window. Espresso cooling. Rain giving the world a different texture. Worth keeping." Marco screenshots it.

**Linda test:** Linda visits her mother and photographs her at the kitchen table. She records a 12-second clip of her mother humming. No text note. Quinn writes: "Saturday afternoon. The afternoon in full brightness. A voice was part of it." Linda can find it, play back the audio, and show it to her sister.

---

## Epic 1: Discovery & Pre-Trip

**Business Goal:** Let users explore destinations and build anticipation. This is the acquisition hook. Must deliver value without ambient journaling features.

**Persona Alignment:** Marco (travel hook), Sarah (family trip planning), Linda (visit planning with mom)

---

### US-101: Start a Journey

**Primary Persona:** Sarah (family trip)
**Also Serves:** Marco (spontaneous travel), Linda (visiting mom's old neighborhood)

**As Sarah (new parent)**
**I want to** paste my family trip itinerary or just name where we're going
**So that** Quinn can understand the places we'll visit
**Without** needing a specific format or worrying about what happens to our data

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Itinerary parsing | **Reuse** | Travel: `/api/parse-itinerary` | Handles structured, unstructured, and low-fidelity inputs. |
| Input type classification | **Reuse** | Travel: `has_venues`, `has_intent`, `too_vague` | Auto-detects mode. |
| Venue extraction | **Reuse** | Travel: Claude prompt | Extracts venues, dates, intent signals. |
| Iterative refinement | **Reuse** | Travel: `lib/smartRefinement.ts` + `lib/refinementCache.ts` | Claude asks follow-up questions (dates, travelers, purpose). Seed questions for popular destinations = instant first question. User controls when to stop. |
| SwiftData ItineraryItem model | **Reuse** | Quinn: `ItineraryItem.swift` | **Already built** -- SwiftData @Model with title, date, location, attendees, confidence scores. Extend for Journey grouping. |
| Import UI + ViewModel | **Reuse** | Quinn: `ItineraryImportView.swift`, `ItineraryImportViewModel.swift` | **Already built** -- MVVM import + review flow. Restyle to match dark theme. |
| Home screen entry point | **Partial** | Quinn: `HomeView.swift` | Shell exists -- add "Where to next?" card. |
| LLM parser service | **Decision** | Quinn: `LLMParserService.swift` | Currently uses Gemini API. **DECISION RESOLVED: replace with on-device LLM (per V4 local-first constraint). Travel API as interim if on-device quality fails quality spike.** |

#### Acceptance Criteria

**Functional:**
- [ ] Two input modes (auto-detected):
  - **Destination mode**: City, region, or feeling -> venue suggestions
  - **Itinerary mode**: Pasted text with dates/venues -> extracted and structured
- [ ] Venue cards reuse same format from First Run
- [ ] Journey saved to SwiftData with all venue data
- [ ] Home screen updates with new journey card
- [ ] Geofences registered for venues (if Location ON) -- ties to US-201

**Local-First (V4 constraint):**
- [ ] Itinerary parsing attempted on-device first using local LLM (Llama 3.2 3B via MLX or Apple Intelligence)
- [ ] Travel API used only if on-device parsing quality fails the parsing quality spike (same spike as narrative generation, Week 4)
- [ ] Itinerary text never sent to Gemini or any cloud LLM regardless of path

**Privacy:**
- [ ] Pasted itinerary text deleted from memory after extraction
- [ ] Any API request carries no user ID
- [ ] Privacy note visible: "Your itinerary is processed once, then deleted"

**Edge Cases:**
- [ ] Empty input, single word, 5000-word itinerary, non-English text
- [ ] Linda entering "Mom's neighborhood -- Oak Street, the old bakery, the park where we used to go" -> Quinn extracts locations

**Testing:**
- [ ] Unit: Journey SwiftData model CRUD
- [ ] Integration: Full paste -> parse -> save flow
- [ ] Edge: 5+ real-world examples per mode

---

### US-102: Review Discovered Places

**Primary Persona:** Marco (curated aesthetic)
**Also Serves:** Sarah (family planning), Linda (visit planning)

**As Marco (experience-seeking traveler)**
**I want to** review the places Quinn found and mark which ones I'm drawn to
**So that** Quinn knows what to watch for when I arrive

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Venue card UI pattern | **Reuse (concept)** | Travel: `VenueSuggestionCard.tsx` | Port design to SwiftUI. |
| Pin/discard interaction | **Reuse (concept)** | Travel: `CardState { pinned, discarded }` | "Drawn to this" = pin. |
| Venue data model | **Reuse** | SE: `SensoryInputSchema.venue` | Name, category, coordinates. |
| Journey persistence | **New** | -- | SwiftData `@Model` for Journey + Venues. |

#### Acceptance Criteria

- [ ] Venue cards: hero photo, prose description, mood tag, best time, insider tip
- [ ] "Drawn to this" marks venue as part of journey
- [ ] "Next place" skips without marking
- [ ] Discovery Complete shows summary of marked venues
- [ ] Journey persisted to SwiftData
- [ ] Prose descriptions evocative, not encyclopedic
- [ ] Mood tags use feeling language (Sacred, Rhythmic, Vivid, Delicious)
- [ ] Haptic on "Drawn to this" tap

---

## Epic 2: Ambient Capture

**Business Goal:** Passively collect raw material for memories -- photos, location, audio, time -- without user action. This is the core platform differentiator. The user does nothing; Quinn notices.

**Critical insight from persona panels:** This epic must work for ALL personas, not just travelers:
- **Sarah:** Quinn notices baby's first steps at the park (geofence: "favorite park")
- **Marco:** Quinn notices arrival at Fushimi Inari (geofence: travel venue)
- **Linda:** Quinn captures mom's voice telling stories at her kitchen table (voice note)
- **Aisha:** Quinn captures the morning walk, the yoga studio session (recurring places)

**Success Metrics:**
- Arrival detection fires within 200m of marked venue/place
- 90%+ of photos taken near a marked place auto-linked correctly
- Battery impact < 5% per 8 hours of background tracking
- Zero sensor data transmitted off-device

---

### US-201: Arrival Detection & Ambient Photo Linking

**Primary Persona:** Marco (travel capture)
**Also Serves:** Sarah (park visits, baby classes), Aisha (yoga studio, walking routes)

**As Marco (experience-seeking traveler)**
**I want** Quinn to know when I arrive at places I was drawn to and automatically find the photos I take there
**So that** when the trip is over, my memories are already assembled
**Without** me having to open the app, check in, or tag anything

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Geofence trigger schema | **Schema exists** | SE: `detection.trigger = 'dwell'` | Need native CoreLocation. |
| Photo reference model | **Schema exists** | SE: `PhotoReferenceSchema.local_id` | Typed for PHAsset. Need PhotoKit. |
| Visit data model | **Schema exists** | SE: `SensoryInputSchema` | Need SwiftData model. |
| Device chip detection | **Reuse** | QuinnAudio: `DeviceCapability.swift` | **Already built** -- A15-A18 Pro, BGContinuedProcessing check |
| Battery monitoring | **Reuse** | QuinnAudio: `BatteryMonitor.swift` | **Already built** -- real-time level/state, low-battery warnings |
| Low Power Mode detection | **Reuse** | QuinnAudio: `LowPowerModeMonitor.swift` | **Already built** -- adaptive behavior when battery-conscious |
| Arrival/departure logic | **New** | -- | CLCircularRegion, 200m, 3-min dwell filter. |
| PhotoKit time-window query | **New** | -- | PHAsset date-range queries. |
| Background location | **New** | -- | UIBackgroundModes: location. |
| Location trail sampling | **New** | -- | 60s intervals during visit. |

#### Multi-Persona Scenarios

**Marco (travel):** Walks to Fushimi Inari at 7:30 AM. Quinn detects arrival. Takes 5 photos over 2 hours. Quinn links them. Never opens app.

**Sarah (parenting):** Takes baby to weekly music class. Quinn detects arrival at the studio (marked as favorite place). Sarah takes 3 photos of baby during class. Quinn links them with "Tuesday Music Class" context.

**Aisha (daily practice):** Walks to yoga studio every morning. Quinn detects the pattern. After 3 visits, suggests: "This seems like a place that matters to you. Want Quinn to notice it?"

#### Acceptance Criteria

**Functional:**
- [ ] Geofence registered for each marked place using `CLLocationManager.startMonitoring(for:)`
- [ ] Arrival: enter 200m radius + 3-minute dwell filter (prevents GPS drift false positives)
- [ ] Departure: leave radius for > 15 minutes
- [ ] During visit: PhotoKit finds photos with `creationDate` in arrival-departure window
- [ ] Also captures: arrival time, departure time, duration, weather (SE's OpenWeather API, coarsened coordinates)
- [ ] All capture data in SwiftData, encrypted with iOS Data Protection (`.completeUnlessOpen`)
- [ ] Works with app backgrounded or terminated
- [ ] iOS 20-geofence limit managed: prioritize nearest marked places, rotate by proximity

**Privacy & Security (David's requirements):**
- [ ] All capture data 100% on-device -- **enforced by architecture, not policy**
- [ ] No photo content, GPS coordinates, or timestamps sent to any server
- [ ] Telemetry: only `arrival_detected` count -- no venue names or coordinates
- [ ] User can view all captured data per place in Settings
- [ ] User can delete all data for a specific place or journey
- [ ] Auto-delete configurable: 90 days (default), 1 year, never
- [ ] **David test:** Run Wireshark during a capture session. Zero personal data in any packet.

**Battery (Sarah's #1 churn driver):**
- [ ] Between places: significant-change API only (minimal battery)
- [ ] During visit: 60-second location samples
- [ ] Use `CLCircularRegion` monitoring (iOS wakes app only on boundary crossing)
- [ ] Target: < 5% battery per 8-hour day with 3 venue visits
- [ ] **Sarah test:** Phone must not die at 3pm instead of 5pm. Battery impact visible in Settings.
- [ ] Consider batch processing: "memories process at night when plugged in" (from persona panel)

**Edge Cases:**
- [ ] GPS drift false arrival -> 3-minute dwell filter
- [ ] Two places within 200m -> Attribute based on closest + time overlap
- [ ] User takes 0 photos -> Memory from duration + location only
- [ ] Photos permission OFF but Location ON -> Capture location only
- [ ] 20-geofence limit -> Rotate by user proximity
- [ ] **Sarah edge:** Baby falls asleep in stroller, Sarah walks through 3 geofences without stopping > 3 min -> No false triggers

**Decision Points:**
- [ ] **DECISION NEEDED:** "When In Use" or "Always" location permission? "Always" enables true background detection but Apple reviews strictly. Recommendation: "When In Use" with background location updates.
- [ ] **DECISION NEEDED:** Photo matching by time-window only, or also GPS proximity? Recommendation: time-window primary, GPS as bonus.
- [ ] **TECHNICAL SPIKE:** Test CoreLocation background geofencing reliability on real iPhone 13/15 across iOS 17-18.

---

### US-202: Voice Note Capture

**Primary Persona:** Linda (capturing mom's stories) -- **highest PMF signal (8.5/10)**
**Also Serves:** Marco (travel voice notes), Aisha (post-practice reflection), Sarah (baby milestone narration)

**As Linda (caregiver)**
**I want to** record Mom telling her stories -- the one about Dad's first car, the names of her roses, the recipe she never wrote down
**So that** Quinn can preserve her voice and weave her words into a memory
**Because** her stories are fading, and I can't bear to lose them

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Audio input schema | **Reuse** | SE: `AudioInputSchema` | duration, transcript, sentiment, keywords |
| Voice analysis metadata | **Reuse** | SE: `sensoryPrompts.ts` | sentiment, tone, keywords, theme |
| Audio engine recorder | **Reuse** | QuinnAudio: `AudioEngineRecorder.swift` | **Already built** -- AVAudioEngine PCM -> AAC, pause/resume, interruption handling |
| Audio session manager | **Reuse** | QuinnAudio: `AudioSessionManager.swift` | **Already built** -- background recording, Bluetooth, speaker routing |
| Audio playback | **Reuse** | QuinnAudio: `AudioPlayer.swift` | **Already built** -- voice note playback |
| Recording data model | **Reuse** | QuinnAudio: `Recording.swift` | **Already built** -- needs extension for venue linking |
| Recording store | **Reuse** | QuinnAudio: `RecordingStore.swift` | **Already built** -- local persistence for recordings |
| Speech transcription | **New** | -- | `SFSpeechRecognizer` with `.onDevice = true` |
| Sentiment extraction | **New** | -- | `NLTagger` with `NLTagScheme.sentimentScore` |
| Keyword extraction | **New** | -- | `NLTagger` noun/verb extraction |
| Recording UI (Quinn-branded) | **Partial** | QuinnAudio has recording UI | Restyle to match Quinn dark theme. Linda-simple one-tap. |
| Audio file storage | **Partial** | QuinnAudio: `RecordingStore.swift` | Exists -- add encryption + venue/timestamp linking |

#### Multi-Persona Scenarios

**Linda (caregiving):** Visiting Mom on Sunday. Mom starts telling the story about Dad's first car. Linda taps one button. Quinn records. Later, Quinn transcribes on-device and creates a memory: "Dad's Story, Again: He told the one about his first car -- the blue Chevy that pulled to the left. He's told it a hundred times. This time you kept it."

**Sarah (parenting):** Baby says first word. Sarah grabs phone, taps record, captures 15 seconds. Quinn creates: "First Word: It was 'dada.' You weren't even sure at first, then she said it again."

**Marco (travel):** At a Lisbon cafe, rain on the window. Records 30 seconds describing the feeling. Quinn weaves his words into the memory later.

**Aisha (practice):** After savasana, records a 60-second reflection. Quinn uses her words alongside captured context to build a memory she can revisit.

#### Acceptance Criteria

**Functional:**
- [ ] **One-tap recording** -- single large button, no menus (Linda requirement)
- [ ] Tap to start, tap to stop (not press-and-hold -- Linda might have arthritic hands)
- [ ] Recording saved locally, linked to current place (if detected) or timestamp
- [ ] Supports recordings up to 10 minutes (caregiving sessions need longer than 5)
- [ ] On-device transcription via `SFSpeechRecognizer` (`.onDevice = true`)
- [ ] On-device sentiment via `NLTagger.sentimentScore`
- [ ] On-device keyword extraction: nouns + verbs (topics, not verbatim)
- [ ] Voice note metadata stored in SwiftData
- [ ] Transcribed words quotable in Quinn's narrative (styled distinctly -- italics, different background)
- [ ] **Linda's words preserved:** When Mom tells a story, Quinn quotes her: *"The blue Chevy that pulled to the left"* -- not a summary, her actual words

**Privacy (David's audit + Linda's emotional safety):**
- [ ] Audio file never leaves device -- **enforced by architecture**
- [ ] Verbatim transcript never transmitted -- only metadata (sentiment, tone, keywords)
- [ ] Transcription via Apple Speech on-device only
- [ ] No voice recognition or speaker identification
- [ ] User can delete individual voice notes
- [ ] **Linda's need:** "Nobody else hears Mom's recordings" -- emotional safety, not just technical privacy
- [ ] If on-device Speech unavailable (older device) -> Store audio, skip transcription: "Voice saved. Words will appear on newer devices."

**UX (Linda-simple, Marco-beautiful):**
- [ ] Waveform visualization during recording (purple accent: `#7c5da0`)
- [ ] Haptic pulse while recording
- [ ] Voice note player: purple waveform bars
- [ ] User's transcribed words in quotes, italic, distinct background
- [ ] **Linda test:** Can she record Mom's story in under 3 taps from any screen?
- [ ] **Marco test:** Is the waveform visualization beautiful enough to screenshot?

**Edge Cases:**
- [ ] 0-second recording -> Discard silently
- [ ] 10-minute max -> Gentle fade and save: "Recording saved. Start another if there's more."
- [ ] Background noise (Linda: Mom's kitchen with TV on; Marco: busy market) -> Transcript may be partial; save audio regardless
- [ ] No Speech framework support -> Audio saved, transcript pending
- [ ] Multiple voice notes for same place -> All linked, displayed chronologically

**Decision Points:**
- [ ] **DECISION NEEDED:** Keywords extracted on-device (`NLTagger`) or transcript to Claude? SE architecture says metadata-only. Recommendation: `NLTagger` extracts keywords, only keywords sent. Transcript stays on-device for display.
- [ ] **DECISION NEEDED:** Max recording length? 5 minutes (v3) feels short for Linda recording Mom's stories. Recommendation: 10 minutes, with option to chain.
- [ ] **TECHNICAL SPIKE:** Test `SFSpeechRecognizer` accuracy with: (a) elderly speaker (Linda's mom), (b) ambient travel noise (Marco), (c) quiet reflection (Aisha). If < 70%, show transcript with "Edit" option.

---

## Epic 3: Memory Assembly

**Business Goal:** Quinn takes raw capture data and assembles a narrative memory. The user reviews, refines, and keeps it. This is the core product.

**Critical persona panel insight:** Editability is the #1 missing feature flagged across both panels. Marco, Aisha, and Sarah all need to see that they can override Quinn's interpretation.

**Quality gate (from persona panels):** If narrative quality < 85% of Claude, average conversion drops from 7.8 to 3.2. The quality test is the decision gate.

---

### US-301: Review Quinn's Draft Memory

**Primary Persona:** Linda (mom's stories assembled)
**Also Serves:** Marco (travel memory), Sarah (baby milestone), Aisha (practice reflection)

**As Linda (caregiver)**
**I want to** see what Quinn assembled from Sunday at Mom's kitchen
**So that** I can read it, hear Mom's voice again, and know her story is preserved

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Narrative generation | **Port to Swift** | SE: `sensoryPrompts.ts` + on-device LLM | **V4 primary path: on-device LLM (Llama 3.2 3B / Apple Intelligence) with ported SE prompt. SE `/api/synthesize-sense` is the quality-spike fallback if on-device output fails the 85% quality bar.** |
| MomentSense response | **Reuse** | SE: `MomentSenseSchema` | narratives, emotions, anchors, sensory details, atmosphere, transcendence |
| Fallback narratives | **Reuse as primary** | SE: `generateFallbackNarrative()` | **Port to Swift — this IS the V4 primary path.** SE API is the upgrade path after quality validation. |
| Transcendence scoring | **Reuse** | SE: `calculateTranscendenceScore()` | Port algorithm to Swift. |
| Memory review UI | **New** | -- | Hero photo, narrative, photo strip, voice player, signal pills, CTAs. |
| Signal pills | **New** | -- | "Morning visit", "About 2 hours", "12C overcast", "Unhurried" |
| Accept/Refine flow | **New** | -- | "This feels right" / "Refine" / "Add a photo" |

#### Multi-Persona Draft Examples

**Linda sees:**
> "Sunday at Mom's Kitchen"
> *"Her humming filled the kitchen while the dishes clattered. She told the story about Dad's first car again -- the blue Chevy that pulled to the left. She's told it a hundred times. This time you kept it."*
>
> Voice note: 4:32 (purple waveform, play button)
> Signal pills: Sunday afternoon | About 2 hours | Mom's kitchen
> Mom's words: *"It was a '57 Chevy, powder blue, and it pulled to the left something awful"*

**Sarah sees:**
> "Tuesday Music Class"
> *"She clapped along this time -- both hands, more or less in rhythm. The look on her face when the tambourines came out."*
>
> Photos: 3 (baby with tambourine, group circle, tiny shoes)
> Signal pills: Tuesday morning | 45 minutes | Little Beats Studio

**Marco sees:**
> "Unnamed Cafe, Lisbon"
> *"Rain on the window, second espresso, nowhere to be. The waiter remembered your order from yesterday. These are the mornings you travel for."*
>
> Photos: 2 (rain on glass, espresso cup)
> Voice note: 0:34
> Signal pills: Morning | About an hour | 14C rain | Alone

**Aisha sees:**
> "Wednesday Savasana"
> *"The room went quiet after the last pose. Someone's breath caught -- not a sob, something gentler. You lay there longer than usual."*
>
> Signal pills: Evening | 75 minutes | Warm | Still

#### Acceptance Criteria

**Functional:**
- [ ] Home screen shows pending memories: "[N] moments waiting for you."
- [ ] Stats: memory count, photo count, voice note count, total hours remembered
- [ ] Draft memory shows:
  - Hero photo (best from linked photos -- Vision framework selection)
  - Quinn's narrative (2-3 paragraphs, evocative prose, second person "you")
  - Photo strip (horizontally scrollable + "+" for manual additions)
  - Voice note player (if recorded)
  - Signal pills (from capture data + weather)
  - User's quoted words from voice notes (italic, distinct background)
- [ ] Three CTAs: "This feels right" (primary), "Add a photo" (ghost), "Refine" (ghost)
- [ ] Narrative generated on-device by local LLM using metadata-only context (per local-first constraint). SE API used only if on-device quality spike < 85% threshold -- see Narrative Generation Pipeline below.

**Narrative Generation Pipeline (local-first):**
- [ ] iOS extracts metadata on-device:
  - Photo: scene_type, lighting, face_count, crowd_level, energy_level (Vision)
  - Voice: sentiment_score, detected_tone, keywords (Speech + NLTagger)
  - Context: arrival_time, departure_time, duration, weather
- [ ] iOS runs ported SE prompt against **on-device LLM** (Llama 3.2 3B via MLX or Apple Intelligence) with metadata as context
- [ ] On-device LLM returns narrative, emotions, sensory details — no network call
- [ ] iOS stores result in SwiftData
- [ ] **Quality spike gate:** If on-device narrative quality < 85% of SE Claude output (evaluated pre-launch), then — and only then — fall back to sending metadata to SE API. Raw photos, audio, and transcripts are never transmitted regardless.
- [ ] SE API fallback path: iOS sends ONLY metadata (`SensoryInputSchema`) — never photos, audio, or transcripts

**Narrative Quality (persona panel decision gate):**
- [ ] Narratives feel emotionally resonant, not template-driven
- [ ] Anti-cliche enforcement: no "hidden gem", "breathtaking", "unforgettable"
- [ ] Show-don't-tell: "The look on her face when the tambourines came out" not "She enjoyed music class"
- [ ] **Linda test:** Does the narrative honor Mom's story, or does it feel like the app doesn't understand?
- [ ] **Marco test:** Would he share this narrative on social media as "this is what I mean by that trip"?
- [ ] **Aisha test:** Does it capture nuance? "Someone's breath caught" not "The class was relaxing"

**Privacy:**
- [ ] Photos never sent to API -- only scene_type, lighting, crowd_level
- [ ] Voice transcript never sent -- only sentiment, tone, keywords
- [ ] GPS coordinates never sent -- only venue name
- [ ] Telemetry: `memory_reviewed` count, `accepted_without_edit` boolean -- no content

**Edge Cases:**
- [ ] Memory with 0 photos -> Narrative from location + duration + voice only
- [ ] Memory with 0 voice notes -> Narrative from photos + location
- [ ] 15-minute visit -> Shorter narrative
- [ ] User reviews 2 weeks later -> Still works
- [ ] API unavailable -> Fallback narrative, marked "Draft -- will improve when connected"
- [ ] **Linda edge:** Mom tells the same story she told last visit -> Quinn notes: "She told this story on January 12th too. Both versions saved."

**Decision Points:**
- [ ] **DECISION NEEDED:** Hero photo selection -- Vision framework "best" or first chronologically? Recommendation: Vision ranks by scene interest + quality.
- [ ] **DECISION NEEDED:** Should Quinn note recurring stories (Linda's mom repeating)? This is powerful for caregiving but could feel clinical. Recommendation: gentle note, user can dismiss.

---

### US-302: Memory Card with Edit/Override

**Primary Persona:** Marco (Quinn's interpretation must earn the user's trust)
**Also Serves:** Sarah, Linda, all personas -- editability flagged by 3/5 personas as #1 missing feature
**Note (not for GTM):** Aisha's persona panel feedback originated this insight, but the feature serves all V4 launch personas. Do not frame this as a mindfulness or presence/capture feature in marketing.

**As Marco (experience-seeking traveler)**
**I want to** see my finished memory and correct it when Quinn gets the feeling wrong
**So that** the memory reflects what I actually experienced, not what the AI inferred
**Because** if Quinn writes "peaceful" but it was actually overwhelming and beautiful, that's not my story

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Sensory anchors | **Reuse** | SE: `memoryAnchors`, `inferredSensory` | Sound, scent, tactile inferred from context. |
| Emotion tags | **Reuse** | SE: `emotion_tags[]`, `primaryEmotion` | 7 calibrated types. |
| Narrative prose | **Reuse** | SE: `narratives.full` | 150-200 words, emotion-matched tone. |
| ~~Companion experiences~~ | **Deferred** | SE: `companion_experiences[]` | Deferred to Phase 4. iOS passes empty `companions: []` until then. |
| Memory Card UI | **New** | -- | Full-screen hero, "What Quinn Noticed" section, emotion tags, footer. |
| **Edit/Override system** | **New** | -- | Edit narrative, override emotion tags, add notes. **#1 missing feature from panels.** |
| Tag search | **New** | -- | SwiftData query by emotion tag across memories. |

#### Acceptance Criteria

**Functional:**
- [ ] Memory Card contains:
  - Hero photo with scrim gradient, date + location overlay
  - Edit pencil icon (top right)
  - Narrative prose (Quinn's voice, second person)
  - User's quoted words (voice transcript) in italics
  - Quinn's observation ("Five photos, all looking up. Quinn noticed that too.")
  - **What Quinn Noticed** _(internal: sensory anchors)_:
    - Sound: from SE's `inferredSensory.sound` ("The low percussion of bamboo in wind")
    - Light: from Vision + SE's `sensoryDetails.visual` ("Grey-green, filtered through vertical lines")
    - Time: from duration + relative comparison ("Two hours. The longest pause of your trip.")
  - **Emotion Tags**: tappable pills (Still, Wonder, Solitude)
  - Footer: photo count, voice note count, duration

**Edit/Override (#1 panel gap -- flagged by 3/5 personas):**
- [ ] Tap edit pencil -> Edit mode
- [ ] **Narrative editing:** Free-text editing of Quinn's prose. User can rewrite entirely.
- [ ] **Emotion tag override:** Tap any tag to remove. "+" to add custom tag. Free text.
- [ ] **Add personal note:** User's own words alongside Quinn's, clearly distinguished
- [ ] **Override confirmation:** "Quinn suggested 'Awe' but you said 'Anxious' -- your word is kept." (Shows the override visibly, not silently)
- [ ] All edits saved to SwiftData. Original Quinn version preserved (can "Restore Quinn's version")
- [ ] **Editorial control test:** Can any user override Quinn's emotion in under 3 taps? Is their word clearly authoritative?

**What Quinn Noticed** _(internal: sensory anchors)_:
- [ ] Sound: SE infers from venue + context (Temple -> "chanting", Market -> "vendor calls")
- [ ] Light: Vision photo analysis + SE synthesis
- [ ] Time: duration + comparison ("longest pause", "shortest stop")
- [ ] Written in evocative prose -- "Grey-green filtered light", NOT "Brightness: 0.4"

**Emotion Tags:**
- [ ] Initially generated by SE
- [ ] User can: accept, remove, or add custom tags
- [ ] Tags searchable from Living Timeline (US-303)
- [ ] User's tags always take priority over Quinn's. Visual distinction: "Quinn suggested: Awe" vs "You said: Anxious"

**UX:**
- [ ] Card feels like a journal page, not a database entry
- [ ] Dark theme, Cormorant Garamond headlines, generous whitespace
- [ ] Edit mode subtle but discoverable -- pencil icon always visible
- [ ] Long-form scroll, no pagination within a memory

**Testing:**
- [ ] Unit: "What Quinn Noticed" generation from SE response
- [ ] Unit: Emotion tag CRUD + override persistence
- [ ] Unit: Narrative edit save + restore
- [ ] UI: Edit flow -- change emotion, edit narrative, add note
- [ ] Accessibility: VoiceOver reads anchors naturally

---

### US-303: Living Timeline

**Primary Persona:** Sarah (what does 6 months of Quinn look like?)
**Also Serves:** All -- archive view flagged by 3/5 personas in demo panel

**As Sarah (new parent)**
**I want to** see all my baby's memories in one flowing timeline
**So that** I can scroll through the first year and feel the arc of her growing up

This story directly addresses the persona panel gap: "What does 6 months of Quinn look like?"

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Timeline data | **Reuse** | SwiftData Journey + Memories | Query sorted by date. |
| Timeline UI | **New** | -- | Vertical connected-dot timeline from mockup. |

#### Multi-Persona Views

**Sarah:** Timeline of baby milestones -- First Giggle, First Word, Tuesday Music Classes, Park Visits. 6 months of parenthood in one scroll.

**Marco:** Timeline of Kyoto trip -- Fushimi Inari, Nishiki Market, Arashiyama. 5 days in one scroll.

**Linda:** Timeline of visits to Mom -- every Sunday, every story told, every voice preserved. A year of caregiving.

**Aisha:** Timeline of practice -- morning walks, yoga sessions, savasana reflections. Patterns emerging over months.

#### Acceptance Criteria

- [ ] All memories chronologically, grouped by journey or time period
- [ ] Each entry: timeline dot, thumbnail, date, place name, narrative excerpt, emotion tags
- [ ] Tap entry -> Full Memory Card
- [ ] During active journey: live status ("Day 3 - Noticing") with green dot
- [ ] Pending (unreviewed) memories: pulsing accent dot
- [ ] Empty state: "Your memories will appear here as Quinn notices them"
- [ ] **Sarah test:** Can she show her mother-in-law "look at everything she's done this year" by scrolling?
- [ ] **Aisha test:** Can she see patterns? ("You've been still a lot this month")
- [ ] 60fps scroll with 50+ entries
- [ ] Search by emotion tag, place, date range

---

## Epic 4: Trust & Control

**Business Goal:** Sensors presented as value, not cost. Users who decline never feel punished. Privacy is verifiable, not just claimed.

**Persona panel insight:** David converts on positioning (7.5/10) but drops on demo (5/10) because he can't verify claims. This epic bridges that gap.

---

### US-401: Contextual Sensor Nudges

**Primary Persona:** Sarah (battery-aware, gradual trust)
**Also Serves:** Marco (sees value, enables more), Linda (needs gentle guidance)

**As Sarah (new parent)**
**I want** Quinn to gently show me what I'm missing when sensors are off
**So that** I can decide to enable them when the value is obvious
**Without** being nagged while I'm exhausted with a newborn

#### Acceptance Criteria

- [ ] Two nudge types:
  - **Home nudge**: "Bring your memories to life" with sparkle icon
  - **Contextual nudge**: Where data would be ("Location was off during this visit")
- [ ] Max 1 per permission type per app session
- [ ] After dismissing 3 times: nudge stops permanently for that permission
- [ ] Tone: invitation, not warning. "Enable" not "Required."
- [ ] Sensors off = valid state, not error. No badge counts or red dots.
- [ ] **Linda test:** Is the nudge in simple language she understands?
- [ ] **David test:** Does the nudge respect his decision? No dark patterns.

---

### US-501: Privacy Dashboard & Network Audit

**Primary Persona:** David (verifiable privacy)
**Also Serves:** Sarah (child's data protection), Aisha (philosophical transparency)

**As David (privacy-conscious engineer)**
**I want to** inspect every piece of data Quinn has collected and every network call it has made
**So that** I can verify the privacy claims are real, not marketing

This story directly addresses David's conversion blocker: he went from 7.5/10 (positioning) to 5/10 (demo) because he couldn't verify claims.

#### Build Status

| Component | Status | Source | Notes |
|-----------|--------|--------|-------|
| Privacy architecture | **Reuse** | SE: hybrid model | Metadata-only to cloud already designed. |
| Network audit log | **New** | -- | URLSession interceptor logging all outbound requests. |
| Data viewer | **New** | -- | Browse all SwiftData by type, place, date. |
| Data export | **New** | -- | JSON export, human-readable. |
| Data deletion | **New** | -- | Per-place, per-journey, or everything. |

#### Acceptance Criteria

**Functional:**
- [ ] **Processing Pipeline Visualization** (strongest trust builder from demo panels):
  - Real-time display showing each processing step: "Analyzing photos... on your device", "Extracting keywords... on your device", "Fetching venue info... public data only"
  - Clear "on your device" vs "public data" badge per step
  - This single feature converted Marco (4->7) and was called "the right instinct" by David
- [ ] **Network Audit Log:** Every outbound network call logged with:
  - Timestamp, destination URL, request type
  - Payload summary (what was sent, in human-readable form)
  - "Personal data: None" badge or specific listing
- [ ] **Data Browser:** All local data browsable:
  - Photos (references, never the photo itself -- that's in Photos.app)
  - Voice notes (playable)
  - Transcripts (readable)
  - Memories (narrative, emotions, anchors)
  - Location history (map view of visits)
- [ ] **Data Export:** One-tap JSON export of all data, human-readable
- [ ] **Data Deletion:**
  - Delete per-place: removes all data for one place
  - Delete per-journey: removes entire trip
  - Delete everything: single button, irreversible, verified empty
- [ ] **Auto-delete:** Configurable retention: 90 days (default), 1 year, never
- [ ] Battery impact visible: "Quinn used X% battery today" (addresses Sarah's concern)

**Privacy & Security:**
- [ ] Network log proves "Your data stays on your device" -- user can verify
- [ ] No personal data in any logged network payload
- [ ] Export includes only user's data, no app internals
- [ ] Deletion is complete and verified -- no orphaned data
- [ ] **David test:** Can he run Wireshark alongside the network log and confirm they match?

**UX:**
- [ ] Accessible from Settings gear icon
- [ ] Not hidden -- privacy dashboard is a first-class feature
- [ ] Language: "What Quinn knows about you" not "Data management"
- [ ] **Linda test:** Can she find and delete Mom's recordings if she needs to? Is it clear?

---

## Cross-Cutting Requirements

### Telemetry Implementation

**Tool:** PostHog iOS SDK (`posthog-ios`). All events are anonymous — no user identity, no device fingerprint. Session IDs ephemeral, cleared on app close.

**Privacy constraints enforced per event:**
- Photos: never log content — only derived signals (`scene_type`, `lighting`, `crowd_level`)
- Voice: never log transcripts — only derived signals (`sentiment`, `tone`, `keywords`)
- GPS: never log coordinates — only user-provided `venue_name`

**Global event schema:**

| Event | Properties | PM / Analyst Use Case |
|-------|-----------|----------------------|
| `app_opened` | `cold_start: bool` | DAU/MAU, retention baseline |
| `capture_started` | `input_types: {photo, audio, location}` booleans | Which input combos drive full captures? |
| `capture_completed` | `photo_count: int`, `has_audio: bool`, `has_location: bool`, `duration_seconds: int` | Funnel completion rate |
| `capture_abandoned` | `step: "photo"\|"audio"\|"narrative"`, `time_elapsed_seconds: int` | Where does the funnel break? |
| `narrative_generated` | `generation_duration_ms: int`, `model: str` (e.g. `"llama-3.2-3b"` or `"se-api"`), `fallback_reason: str?` (`"quality_threshold"` \| `"network_unavailable"` \| `"low_power_mode"` \| `"device_unsupported"` — only present when `model = "se-api"`) | On-device model latency; cloud fallback rate; why fallbacks occur |
| `memory_reviewed` | *(count only — no properties)* | Are users re-opening memories? D7/D30 retention |
| `memory_accepted_without_edit` | `accepted: bool` | Narrative quality proxy |
| `memory_edited` | `fields_changed: int` | How much correction does Quinn need? |
| `memory_deleted` | *(no properties)* | Regret signal |
| `arrival_detected` | *(count only)* | Geofence reliability |
| `voice_note_recorded` | `duration_seconds: int`, `linked_to_place: bool` | Voice capture adoption; are users recording at places vs. standalone? |
| `voice_note_transcribed` | `success: bool`, `on_device: bool` | On-device Speech framework reliability |
| `sensor_nudge_shown` | `permission_type: "location"\|"photos"\|"notifications"`, `nudge_type: "home"\|"contextual"` | Which nudges are shown; never log whether user enabled |
| `sensor_nudge_dismissed` | `permission_type: str`, `dismiss_count: int` | Nudge fatigue signal |
| `privacy_dashboard_opened` | *(count only)* | Is privacy a feature users actually use? |
| `network_audit_log_viewed` | *(count only)* | Are privacy-conscious users verifying claims? |
| `onboarding_completed` | `steps_skipped: int` | Onboarding friction |
| `feedback_submitted` | `sentiment: "positive"\|"neutral"\|"negative"`, `category: str` | Qualitative signal |

**Key PM metrics:**
1. Core loop: `capture_started` → `capture_completed` funnel. Target: >60%
2. Quality: `memory_accepted_without_edit` rate. Target: >70% before launch
3. Retention: `memory_reviewed` per user at D7 and D30
4. Performance: `narrative_generated.generation_duration_ms` p50/p95 by model. Target: p50 < 3s on A15+
5. Cloud fallback rate: % of `narrative_generated` events where `model = "se-api"` — should trend toward 0% as on-device improves

---

### Privacy Architecture

**Data Classification (enforced by architecture):**

| Data Type | Storage | Encryption | Retention | Server Access |
|-----------|---------|------------|-----------|---------------|
| Destination query | Ephemeral | TLS | Deleted after response | Travel API, no user ID |
| Venue descriptions | SwiftData | iOS Data Protection | User-controlled | Generated once, stored locally |
| Location trail | SwiftData | `.completeUnlessOpen` | 90 days (configurable) | **Never** |
| Photos (references) | PhotoKit refs | iOS native | Tied to photo library | **Never** |
| Photo metadata | SwiftData | iOS Data Protection | User-controlled | SE API (scene, lighting, crowd -- not photo) |
| Voice notes | Local `.m4a` | `.completeUnlessOpen` | User-controlled | **Never** |
| Voice metadata | SwiftData | iOS Data Protection | User-controlled | SE API (sentiment, tone, keywords -- not transcript) |
| Memory narratives | SwiftData | iOS Data Protection | User-controlled | SE API generates, stored locally |
| Sensory anchors (internal term; UI label: "What Quinn Noticed") | SwiftData | iOS Data Protection | User-controlled | **Never** |
| Telemetry | Ephemeral | TLS | Aggregated, no PII | Counts only |

**Privacy Principles:**
- [ ] "Your data stays on your device" is architecture, not marketing
- [ ] Every network call auditable in Privacy Dashboard (US-501)
- [ ] Delete all data: single button, irreversible, verified
- [ ] Export all data: JSON, human-readable
- [ ] No user accounts in MVP

### Design System

**DECISION NEEDED: Canonical theme.** Three repos have divergent design tokens:

| Source | Background | Accent | Typography |
|--------|-----------|--------|------------|
| Three-journeys mockup | `#0a0a0a` dark | `#c4b8a8` warm gold | Cormorant Garamond / DM Sans / DM Mono |
| Quinn iOS (`BrandTheme.swift`) | `#0F0F0F` charcoal | Blue glow | System fonts |
| QuinnAudio (`Colors.swift`) | `#f8f8f5` light | `#EA580C` orange | San Francisco with semantic scale |
| .com demo | `#1C1917` stone | `#C4B8A8` taupe | Playfair Display / Inter / DM Mono |

**Recommendation:** Adopt three-journeys mockup as canonical (dark-first, OLED-friendly, warm gold accent). Update Quinn and QuinnAudio `BrandTheme`/`Colors.swift` to match. Reuse QuinnAudio's `Typography.swift` semantic type scale but swap to Cormorant Garamond / DM Sans.

**Canonical tokens (pending decision):**
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
2. **Capture** (microphone): Voice recording, manual photo add — **active in Phase 1 via US-050** (NavigationLink from HomeView, not a tab yet — TabView conversion happens with US-001 full first-run)
3. **Memories** (book): Home, Timeline, Memory Cards

### Accessibility

- [ ] VoiceOver for all screens
- [ ] "What Quinn Noticed" reads naturally: "Sound: The low percussion of bamboo in wind"
- [ ] Emotion tags announced as list
- [ ] Photo descriptions from Vision framework = alt text
- [ ] Dynamic Type: all text scales
- [ ] Reduce Motion: disable particle animations
- [ ] **Linda accessibility:** Large tap targets, high contrast text, no gestures that require dexterity

### Performance

- [ ] Cold launch to Home: < 2 seconds
- [ ] Venue card processing: < 3 seconds (WiFi)
- [ ] Memory narrative generation: < 5 seconds per memory
- [ ] Photo analysis (Vision): background, non-blocking, < 1s per photo
- [ ] Living Timeline scroll: 60fps with 50+ entries
- [ ] Battery: < 5% per 8-hour day with ambient capture active

---

## Prioritization Matrix

| Story | Primary Persona | User Value | Complexity | Phase | Reuse % |
|-------|----------------|-----------|------------|-------|---------|
| US-001 First Encounter | Marco | Very High (acquisition) | Medium | **1** | 75% (Travel APIs + Quinn HomeView) |
| US-002 Permissions | Sarah | High (trust) | Low | **1** | 10% (QuinnAudio NotificationManager) |
| **US-050 Quick Capture** | **Marco, Sarah, Linda** | **High (retention bridge)** | Medium | **1** | **55%** (QuinnAudio recorder/session, sensoryPrompts.ts fallback ported to Swift) |
| US-101 Start Journey | Sarah | High (utility) | Medium | **1** | **90%** (Travel APIs + Quinn ItineraryItem/Import MVVM) |
| US-102 Review Places | Marco | High (engagement) | Low | **1** | 30% (design patterns) |
| US-202 Voice Notes | **Linda** | **Very High (PMF 8.5)** | Medium | **2** | **70%** (QuinnAudio recorder/session/store + SE schema) |
| US-201 Arrival Detection | Marco | Very High (core) | **High** | **2** | 30% (SE schema + QuinnAudio battery/device) |
| US-301 Draft Memory | Linda | Very High (core) | **High** | **2** | 60% (SE API + prompts) |
| US-302 Memory Card + Edit | **Aisha** | Very High (retention) | Medium | **3** | 50% (SE anchors/emotions) |
| US-303 Living Timeline | Sarah | High (engagement) | Low | **3** | 10% (SwiftData query) |
| US-401 Sensor Nudges | Sarah | Medium (conversion) | Low | **3** | 0% |
| US-501 Privacy Dashboard | **David** | High (trust/conversion) | Medium | **3** | 5% (demo pipeline visualization concept) |

### Key Priority Changes from v3

1. **Voice Notes (US-202) elevated to Phase 2.** Linda's 8.5/10 is the strongest PMF signal. Voice capture IS the product for caregivers. It was Phase 3 in v3 -- that was wrong.
2. **Memory Card now includes Edit/Override.** Editability is #1 missing feature from panels. Not a separate story -- it's core to the card.
3. **Privacy Dashboard (US-501) added.** David converts at 7.5/10 on positioning but drops to 5/10 on demo. The dashboard bridges the gap.
4. **Living Timeline reframed.** Not just a trip view -- it's "what does 6 months look like?" Answers the demo panel's #3 gap.

### Recommended Build Order

**Phase 1 (Weeks 1-4): The Hook**
1. US-001 First Encounter + US-102 Review Places (core first-run loop)
2. US-002 Permission Onboarding
3. **US-050 Quick Capture** (retention bridge — users who arrive in Week 4 have something to do immediately)
4. US-101 Start Journey (returning user flow)
5. **Narrative quality spike** (Week 4): test on-device LLM output vs SE Claude — this is the decision gate for Phase 2 narrative strategy. SE deployment to Vercel only if quality spike fails.

**Phase 2 (Weeks 5-10): The Platform**
5. US-202 Voice Notes (**Linda's PMF -- start early**)
6. US-201 Arrival Detection + Photo Linking (hardest story)
7. US-301 Draft Memory (depends on SE deployment + Vision metadata)

**Phase 3 (Weeks 11-16): Trust & Polish**
8. US-302 Memory Card + Edit/Override (Aisha's authority)
9. US-303 Living Timeline (Sarah's archive view)
10. US-401 Sensor Nudges
11. US-501 Privacy Dashboard (David's verification)

### Critical Path

```
Deploy Sensory Engine (P0 blocker for Phase 2)
    |
    v
US-202 Voice Notes ──> US-301 Draft Memory ──> US-302 Memory Card + Edit
(Linda's PMF)              |                        |
    |                      v                        v
    v              Claude narrative gen       Aisha's override
Speech framework   (via SE API, metadata)    (edit/correct Quinn)
(on-device)

US-201 Arrival Detection ──> US-301 Draft Memory
    |
    v
Vision metadata extraction
(on-device)
```

---

## Technical Spikes (Before Phase 2)

| Spike | Question | Duration | Blocks | Persona Impact |
|-------|----------|----------|--------|----------------|
| CoreLocation reliability | Background geofencing from terminated on iPhone 13/15? | 2 days | US-201 | Marco, Sarah, Aisha |
| PhotoKit performance | 10,000+ photos by date range in < 1s? | 1 day | US-201 | Sarah (4000+ baby photos) |
| Vision framework quality | Scene/lighting/crowd matching SE schema? | 2 days | US-301 | All |
| Speech accuracy | Accuracy with: elderly speaker, travel noise, quiet reflection? | 2 days | US-202 | **Linda (critical)**, Marco, Aisha |
| On-device narrative quality | Test Llama 3.2 3B / Apple Intelligence output vs SE Claude prompt with same metadata. If on-device >= 85% quality → ship local-only. If < 85% → SE API fallback activated. | 2 days | US-301 | **All (decision gate)** |
| SE deployment | Deploy SE to Vercel only if narrative quality spike fails on-device threshold | 1 day | US-301 (conditional) | All |
| Battery impact | Real-device 8-hour test: ML + location + capture | 2 days | US-201 | **Sarah (#1 churn driver)** |

---

## Persona Panel Gaps Addressed

| Gap (from panels) | v3 Status | v4 Resolution |
|-------------------|-----------|---------------|
| **Editability (#1 missing feature)** | Not addressed | US-302 includes full edit/override system |
| **Linda caregiving (8.5/10 PMF)** | Not in stories | Voice Notes elevated to Phase 2, Linda is primary persona for US-202/US-301 |
| **Sarah's battery anxiety** | Mentioned but not persona-linked | US-201 battery criteria linked to Sarah, battery spike added, Settings display |
| **David's verification gap (7.5 -> 5)** | No verification story | US-501 Privacy Dashboard with network audit log |
| **"What does 6 months look like?"** | Basic timeline | US-303 reframed as archive view, multi-persona views |
| **Aisha's authority paradox** | Not addressed | US-302 edit/override with visible Quinn vs User distinction |
| **Marco's design bar** | Assumed | Explicit "Marco test" added to UX criteria |
| **Linda's language needs** | Not addressed | "Linda test" added throughout, no jargon, one-tap recording |
| **Narrative quality gate** | Mentioned | Explicit quality criteria per persona in US-301, spike added |
| **Batch processing for battery** | Not considered | Decision point in US-201 |

---

## What Was Cut (and Why)

| Previous Story | Decision | Reason |
|----------------|----------|--------|
| Confidence scores per field | **Cut** | Travel planning, not journaling |
| Energy Score (0-100) | **Replaced** by Sensory Anchors | Prose > numbers |
| Screenshot disable | **Cut** | Paternalistic |
| Map view for location trail | **Deferred** to Privacy Dashboard | Verification tool, not memory tool |
| Phi-3 on-device LLM | **Reinstated as V4 primary path** | Local-first constraint requires on-device narrative generation. Quality spike determines if SE API upgrade is needed. |
| Apple Intelligence adapter | **Deferred** | SDK not ready — Llama 3.2 3B via MLX is the V4 on-device model |
| Invented personas (Yuki, Marcus, Chen Family) | **Replaced** | Business personas validated through 4 rounds of panels |
| Companion tracking (per-person) | **Deferred** | "Confuses everyone" per v2 panel. SE has CompanionInput schema but messaging unclear. Revisit Phase 4. |
| Passive conversation capture | **Deferred** | Identified as future differentiator in v2.4 spec review. Privacy implications need resolution. |
| Profile agent (preference learning) | **Deferred** | Travel repo has profile agent infrastructure. Not needed for MVP. Phase 4. |
| Gemini LLM parser (Quinn iOS) | **Replaced** | On-device LLM (Llama 3.2 3B via MLX or Apple Intelligence) per V4 local-first constraint. Travel API acceptable as interim only if on-device quality fails the parsing quality spike. Cloud-to-cloud (Gemini) not permitted. |

---

## Open Questions

### Product Decisions
1. **Multi-device sync?** Not in MVP. David wants self-hosted sync. Consider Phase 4.
2. **Surprise memories (unplanned places)?** MVP captures only marked places. Aisha's yoga studio suggests: "recurring place detection" in Phase 4.
3. **Trip sharing/export?** Not in MVP. Consider JSON/PDF export in Phase 4.
4. **Parent-specific premium?** "Baby milestone book" or "first year album" -- Sarah's premium unlock.
5. **Caregiver-specific features?** "Story archive" or "voice collection" -- Linda's premium unlock.

### User Research (from panels)
1. **Narrative quality test** -- decision gate. If < 85% of Claude, reconsider architecture.
2. **"What Quinn Noticed" resonance** -- do users connect with evocative prose or does it feel pretentious?
3. **Permission conversion** -- does value-framed onboarding outperform standard iOS prompts?
4. **Linda's mom's voice** -- can Speech framework handle elderly speakers with declining articulation?
5. **Sarah's battery threshold** -- exact % where she uninstalls?

---

## Definition of Done (Global)

Every feature must satisfy:

### Core (All Changes)
- [ ] Telemetry coverage (anonymous events for new interactions)
- [ ] Security non-regression (no new PII, input validation)
- [ ] Test coverage (unit + integration, 70% line / 60% branch)
- [ ] Type safety (Swift strict concurrency, no force unwraps)

### UI Changes (Sprint 1 post-mortem)
- [ ] Loading state shown for all async operations > 500ms
- [ ] Tested at smallest viewport (iPhone SE 3rd gen, 375pt width)
- [ ] Feature purpose clear without developer explanation
- [ ] Fallback/error states produce distinct, reasonable output
- [ ] Dark mode verified (dark-first design)
- [ ] VoiceOver tested for all new screens

### API Changes
- [ ] Error messages don't leak internal details
- [ ] Response validated against schemas
- [ ] No PII in API payloads (only metadata)
- [ ] Network calls logged in Privacy Dashboard for user audit

### Privacy (Quinn-Specific)
- [ ] Raw photos never in network payload
- [ ] Raw audio never in network payload
- [ ] GPS coordinates never in network payload (except coarsened weather)
- [ ] Verbatim transcript never in network payload
- [ ] "Your data stays on your device" verified by network inspection
- [ ] Data deletion works (per-place, per-journey, everything)

### Persona Validation (New in v4)
- [ ] **Marco test:** Would a design-literate user screenshot this to share?
- [ ] **Linda test:** Can a non-tech-savvy 57-year-old complete this in under 3 taps?
- [ ] **David test:** Can a privacy engineer verify every claim?
- [ ] **Sarah test:** Does this drain battery or add guilt?
- [ ] **Aisha test:** Is the user the authority over their experience?

---

## Document History

- **v4.4** (2026-02-27): Three doc fixes from James's pre-build review: (1) US-101 voice corrected — "We want to" changed to "I want to" for consistency with all other stories; (2) US-302 companion_experiences marked as deferred to Phase 4 — iOS passes empty `companions: []` until then, prevents team from building toward deferred scope; (3) "Sensory Anchors" renamed to "What Quinn Noticed" in all customer-facing contexts — internal engineering term preserved with _(internal: sensory anchors)_ annotation. Linda found technical terms alienating per persona panel. (Opus)
- **v4.3** (2026-02-24): Six targeted fixes from constraint review: (1) US-302 primary persona reframed from Aisha to Marco — Aisha-specific language removed from acceptance criteria and GTM-bleed note added; (2) US-301 acceptance criterion rewritten — no longer implies SE API as primary path; (3) "What Was Cut" Gemini parser entry resolved (was contradicting codebase inventory); (4) US-101 explicit local-first acceptance criteria added for itinerary parsing; (5) `narrative_generated` telemetry event gains `fallback_reason` property to make cloud fallback rate actionable; (6) Missing telemetry added for US-202 (voice notes), US-401 (sensor nudges), US-501 (privacy dashboard). (Opus)
- **v4.2** (2026-02-24): Applied three V4 launch constraints from product review: (1) David and Aisha explicitly marked as non-launch-target personas — their stories retained for product completeness but excluded from GTM messaging; (2) Local-first enforced as architectural constraint — narrative generation flipped to on-device LLM primary with SE API as quality-gate fallback only; Phi-3/Llama reinstated, Gemini parser resolved to on-device; Phase 1 "Deploy SE" replaced with narrative quality spike; (3) PostHog iOS SDK specified as global telemetry tool with full event schema and PM/analyst use cases in Cross-Cutting Requirements. (Opus)
- **v4.1** (2026-02-23): Cross-repo audit against all 7 Quinn repos. Added QuinnAudio (audio recording, battery monitor, device detection) and Quinn iOS (ItineraryItem model, import MVVM, HomeView) to codebase inventory. Fixed 12 components incorrectly marked "New" that already exist. Added Travel repo features (SSE streaming, iterative refinement, venue insights cache). Added design system decision (3 divergent themes). Added processing pipeline visualization to US-501. Clarified companion tracking as deferred. (Sonnet)
- **v4.0** (2026-02-23): Rewrite against validated business personas (Sarah, Marco, David, Linda, Aisha). Replaced invented personas. Added caregiving stories (Linda PMF 8.5/10). Added editability (panel #1 gap). Added Privacy Dashboard (David's verification gap). Elevated Voice Notes to Phase 2. Added persona-specific tests to DoD. (Sonnet)
- **v3.0** (2026-02-23): Integrated Sensory Engine codebase analysis. Added build/reuse inventory. Resolved narrative strategy. (Opus)
- **v2.0** (2026-02-23): Aligned with three-journeys mockup. Replaced trip-planning with ambient-journaling. (Opus)
- **v1.0** (2026-02-21): Initial user stories. Focused on itinerary parsing. (Sonnet)
