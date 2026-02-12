# Sensory Agent — v2 Implementation Scoping

**Date:** February 8, 2026
**Status:** Planning
**Related:** [Sensory Agent User Story](./sensory-agent-user-story.md)

---

## Context

v1 (manual capture) and v1.5 (smart pre-fill) are already implemented via the Fact Agent web app. This analysis focuses on scoping **v2 (Ambient Detection)** into smaller, deliverable increments.

### Key Question: What's the Fastest Path to Meaningful Ambient Journaling?

The full v2 vision (photo library monitoring, location dwell, calendar events → ambient moment detection) requires iOS native app infrastructure. Before committing to that build, we can validate the **journaling synthesis quality** using web-accessible ambient signals.

---

## Content Type Decision Matrix

| Content Type | Journaling Value | Ambient Capture Potential | Feasibility by Platform | Implementation Complexity | Processing Needs | User Effort | Bang for Buck |
|--------------|------------------|---------------------------|-------------------------|---------------------------|------------------|-------------|---------------|
| **Photos** | HIGH - Visual memory, emotion analysis, location (EXIF), companions (faces) | HIGH - Library monitoring (iOS), Upload trigger (Web) | iOS: Native API ✅ / PWA: Manual upload ⚠️ / Web: Manual upload ⚠️ | Medium - Vision API, EXIF parsing, face detection | Cloud (Claude Vision) + Local (EXIF) | LOW (iOS) / MEDIUM (Web) | ⭐⭐⭐⭐⭐ |
| **Audio/Voice** | VERY HIGH - Raw emotion, tone, spontaneous thoughts, "how it felt" | MEDIUM - Requires active recording | iOS: Native ✅ / PWA: MediaRecorder ✅ / Web: MediaRecorder ✅ | LOW - Whisper transcription, sentiment analysis | Local (Whisper.cpp) + Cloud sentiment | MEDIUM (15-30s) | ⭐⭐⭐⭐⭐ |
| **Location** | MEDIUM - Venue context, geography, dwell time | VERY HIGH - Fully passive background tracking | iOS: CoreLocation ✅ / PWA: Geolocation ⚠️ / Web: Geolocation ⚠️ | LOW - Coordinate logging, reverse geocoding | Cloud (Google Places API) | ZERO | ⭐⭐⭐⭐ |
| **Calendar** | HIGH - Intent, companions (attendees), pre-planned context | VERY HIGH - Fully passive read access | iOS: EventKit ✅ / PWA: No API ❌ / Web: No API ❌ | LOW - Event parsing, name matching | Local only | ZERO | ⭐⭐⭐⭐ (iOS only) |
| **Text Notes** | MEDIUM - Explicit thoughts, structured reflection | ZERO - Requires active writing | All platforms ✅ | VERY LOW | Local or Cloud LLM | HIGH (typing) | ⭐⭐ |
| **Video** | VERY HIGH - Motion, sound, full immersion | MEDIUM - Library monitoring (iOS), Upload trigger (Web) | iOS: Native ✅ / PWA: Manual ⚠️ / Web: Manual ⚠️ | VERY HIGH - Video processing, storage, ML | Cloud (expensive) | LOW (iOS) / HIGH (Web) | ⭐⭐ |
| **Wearables** | LOW-MEDIUM - Physiological excitement, activity level | VERY HIGH - Fully passive background sync | iOS: HealthKit ✅ / PWA: No API ❌ / Web: No API ❌ | MEDIUM - HealthKit integration | Local only | ZERO | ⭐⭐⭐ (iOS only) |

---

## Platform Feasibility Breakdown

### iOS Native App

| Content | API Available | Background Support | Battery Impact | Privacy Controls |
|---------|---------------|-------------------|----------------|------------------|
| Photos | ✅ PHPhotoLibrary | ✅ Yes (with limits) | Low | User grants once |
| Audio | ✅ AVAudioRecorder | ⚠️ Requires foreground | Medium | Microphone permission |
| Location | ✅ CoreLocation | ✅ Yes (significant change mode) | Low-Medium | Location permission (granular) |
| Calendar | ✅ EventKit | ✅ Yes | Negligible | Calendar permission |
| Wearables | ✅ HealthKit | ✅ Yes | Negligible | Health data permission |

**Time to MVP:** 3-4 weeks (app foundation + first moment synthesis)

### Progressive Web App (PWA)

| Content | API Available | Background Support | Limitations |
|---------|---------------|-------------------|-------------|
| Photos | ⚠️ File upload only | ❌ No | User must manually select files |
| Audio | ✅ MediaRecorder | ⚠️ Foreground only | Works in browser, no background |
| Location | ✅ Geolocation API | ❌ No (foreground only) | Battery drain if polling |
| Calendar | ❌ No access | ❌ No | Would need manual entry or Google Calendar OAuth |
| Wearables | ❌ No access | ❌ No | Impossible without native app |

**Time to MVP:** 2-3 days (extend current Fact Agent)

### Web App (Current Fact Agent)

| Content | API Available | User Experience |
|---------|---------------|-----------------|
| Photos | ✅ File upload | User manually uploads after trip |
| Audio | ✅ MediaRecorder | User records 15-30s voice note during input |
| Location | ✅ Geolocation (live only) | "Get current location" button, or EXIF extraction from photos |
| Calendar | ❌ Manual entry only | User types event names manually |

**Time to MVP:** 2-3 days (add audio recording to existing flow)

---

## Recommended Implementation Path

### Phase 1: Voice Note Enrichment (Web-first) — 2-3 days

**What ships:**
- Add audio recording to current Fact Agent validation flow
- User flow: Paste itinerary → Validate venues → 🎤 "Tell me about this trip" (15-30s)
- Quinn transcribes voice (Whisper API), extracts sentiment, merges with venue context
- Output: Trip narrative that sounds like the user's voice + tone

**Why this wins:**
- ✅ Works on existing web platform (no iOS app needed)
- ✅ Dramatically improves journaling quality with minimal user effort
- ✅ Low implementation complexity (MediaRecorder API + Whisper)
- ✅ Tests core thesis: "Can users narrate in 15 seconds vs typing for 5 minutes?"
- ✅ **Immediate customer value:** "Your trip story, in your words"

**Technical components:**
- MediaRecorder API (browser native)
- Whisper API for transcription (OpenAI or local Whisper.cpp)
- Sentiment analysis on transcript
- Enhanced Claude synthesis prompt with voice context

**User effort:** 15-30 seconds of speaking (vs 5+ minutes of typing)

---

### Phase 2: Photo Upload + Voice (Web) — +1-2 days

**What ships:**
- Add photo upload to Fact Agent
- Extract EXIF (location, timestamps) to auto-suggest venues
- Combine photos + voice note + EXIF context
- Claude Vision analyzes photo emotion → richer narratives

**This is essentially v1.5++ from the original vision, achievable on web.**

**User flow:**
1. Upload 5-10 photos from trip
2. Quinn auto-fills venues from EXIF location data
3. Record voice note: "This is the Japan I dreamed of"
4. Quinn synthesizes: photos (emotion) + voice (tone) + venues (context)

**User effort:** Upload photos + 15-30s voice (vs full manual entry)

---

### Phase 3: iOS Native — Ambient Detection — 3-4 weeks

**Only build this when:**
- ✅ Phase 1/2 validate that synthesis quality is "magical enough"
- ✅ User feedback confirms: "I want this to be automatic"
- ✅ Team commits to iOS app as strategic platform

**What ships:**
- Photo library monitoring (detect new photos automatically)
- Location dwell time tracking (detect 2-hour temple visit)
- Calendar event correlation (match "Dinner at Jiro" with photos)
- Evening notification: "📍 Senso-ji Temple · 2 hours · 12 photos — Capture this?"
- One-tap confirmation → synthesis

**This unlocks true ambient journaling.**

---

## Success Metrics by Phase

| Phase | Key Metric | Target | Validates |
|-------|------------|--------|-----------|
| **Phase 1 (Voice)** | % users who record voice note | 60%+ | "Is voice effort acceptable?" |
| **Phase 1** | User shares generated narrative | 70%+ | "Is synthesis quality good enough?" |
| **Phase 2 (Photos)** | % venues auto-filled from EXIF | 80%+ | "Does EXIF pre-fill work?" |
| **Phase 2** | Transcendence score avg | >0.6 | "Are photos + voice → better stories?" |
| **Phase 3 (iOS)** | Prompt acceptance rate | 60%+ | "Does ambient detection feel helpful, not creepy?" |
| **Phase 3** | "Never ask again" rate | <10% | "Is detection accuracy good?" |

---

## Decision: Start with Phase 1 or Jump to Phase 3?

**Arguments for Phase 1 (Web voice):**
- ✅ Validate synthesis quality fast (days, not weeks)
- ✅ Low risk — extends existing Fact Agent
- ✅ Immediate customer value (better trip narratives)
- ✅ Proves journaling quality before committing to iOS infrastructure

**Arguments for Phase 3 (iOS native):**
- ✅ Tests full ambient detection thesis immediately
- ✅ Unlocks true "zero-effort journaling"
- ❌ 3-4 week investment before first user feedback
- ❌ Higher risk if synthesis quality isn't good enough yet

**Recommendation:** **Start with Phase 1.** Prove the synthesis is magical with voice enrichment on web, then commit to iOS native if users say "I wish this was automatic."

---

## Open Questions for Team Discussion

1. **Platform priority:** Web-first (fast iteration) or iOS-first (full ambient vision)?
2. **Voice recording:** During validation flow, or post-validation as optional enrichment?
3. **EXIF privacy:** Auto-extract location from photos, or require user confirmation first?
4. **Calendar integration:** Worth building Google Calendar OAuth for web, or wait for iOS EventKit?
5. **Synthesis scope:** Full MomentSense output (all fields from schema), or simplified v1 (just narratives)?
