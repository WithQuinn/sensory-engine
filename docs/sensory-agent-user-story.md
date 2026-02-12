# Sensory Agent - User Story & Scope Document

## Executive Summary

The Sensory Agent transforms photos, voice notes, and context into rich, emotionally resonant memories. Users share a few photos, speak for 15 seconds, and Quinn synthesizes a complete journal entry — capturing not just what happened, but how it felt.

**v1 (Current):** Effortless capture — upload photos, record a voice note, get a complete memory.

**v2+ (Future):** Ambient journaling — Quinn detects meaningful moments and asks "Want to remember this?"

**Core Value Proposition:** "The best journal is the one you don't have to write."

**Design Principle:** Human confirmation required, synthesis quality first, transparent about cloud processing.

---

## User Story

**As a** traveler fully present in a destination with family or friends,

**I want** Quinn to notice my meaningful moments and offer to capture them for me,

**So that I** can:
- Stay present without worrying about journaling
- Never lose a transcendent moment because I forgot to record it
- Relive experiences with rich, accurate memories
- Share stories that capture how it truly felt
- Ensure everyone in my group had their needs met

---

## Strategic Focus: Why Travel First?

### The Beachhead Decision

Our persona research scored 5 segments. Travel ranked highest, but isn't the only opportunity:

| Segment | Score | Pull Strength | Why It Works |
|---------|-------|---------------|--------------|
| **Travelers** | 9/10 | Very High | High emotion, clear venues, natural photo-taking, time-bounded trips |
| **New Parents** | 7.5/10 | High | "First steps" moments, developmental milestones, fleeting memories |
| **Mindfulness Practitioners** | 7/10 | Medium-High | Present-moment awareness, sensory texture, daily reflection |
| **Caregivers** | Emotional | Medium | Capturing loved one's voice before memory loss — powerful but niche |
| **Event Attendees** | 6/10 | Medium | Concerts, weddings, graduations — discrete high-emotion moments |

### Why Travel Wins as Beachhead

1. **Clear trigger:** Trip = defined start/end, natural journaling moment
2. **High emotion:** Travel generates peak experiences (transcendence scores 0.7+)
3. **Photo-heavy:** Users already take 50-200 photos per trip
4. **Venue-rich:** Google Places API works best for landmarks, restaurants
5. **Monetization:** Travelers willing to pay for premium memory preservation
6. **Shareability:** Travel stories are social currency

### The Broader Opportunity

Travel is the beachhead, not the ceiling. The same synthesis engine serves:

| Segment | Adaptation Needed |
|---------|-------------------|
| **New Parents** | Replace "venue" with "milestone" (first word, first steps) |
| **Caregivers** | Audio-first capture, voice preservation priority |
| **Mindfulness** | Daily micro-moments vs trip-level synthesis |
| **Events** | Setlist integration, crowd-level detection |

**Future versions** will extend beyond travel. For now, we focus where the signal is strongest.

---

## The Vision: Ambient Journaling with Human Confirmation

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    USER LIVES THEIR LIFE                    │
│              (takes photos, enjoys moments)                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              AMBIENT SENSING (local, passive)               │
│                                                             │
│   Quinn quietly observes (all processing on-device):        │
│   • New photos appearing in library                         │
│   • Location dwell time (stayed 2+ hours somewhere)         │
│   • Calendar events ("Dinner at Sukiyabashi Jiro")          │
│   • Time patterns (weekend, vacation dates)                 │
│   • Wearable signals (heart rate, steps)                    │
│                                                             │
│   Detects: "This looks like a meaningful moment"            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              HUMAN CONFIRMATION (one prompt)                │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  📍 Senso-ji Temple                                 │   │
│   │  You were here for 2 hours this morning.            │   │
│   │  I found 12 photos from this moment.                │   │
│   │                                                     │   │
│   │  [🖼️ photo previews...]                             │   │
│   │                                                     │   │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │   │
│   │  │ Capture  │ │ Not now  │ │ Never ask again  │    │   │
│   │  └──────────┘ └──────────┘ └──────────────────┘    │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   User taps "Capture" → proceeds                            │
│   User taps "Not now" → asks again tomorrow                 │
│   User taps "Never" → deletes candidate, won't ask          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (only if user confirmed)
┌─────────────────────────────────────────────────────────────┐
│              INPUT COLLECTION (10 seconds)                  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Capture this moment                                │   │
│   │                                                     │   │
│   │  🎤 [Record voice note]  "This was magical..."      │   │
│   │  ⭐ RECOMMENDED — your voice captures emotion       │   │
│   │                                                     │   │
│   │  Photos: 12 selected [edit]                         │   │
│   │  With: Sarah, Max, Mom [edit]                       │   │
│   │                                                     │   │
│   │  ┌────────────────────────────────────────────┐    │   │
│   │  │        ✨ Capture this moment              │    │   │
│   │  └────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   Pre-filled from ambient data. User just confirms.         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              MOMENT SYNTHESIS (automatic)                   │
│                                                             │
│   Quinn processes the moment:                               │
│   • Analyzes photos for emotion, atmosphere                 │
│   • Transcribes voice note, extracts sentiment              │
│   • Fetches venue context (history, fame, weather)          │
│   • Generates narratives (short, medium, full)              │
│   • Creates memory anchors                                  │
│   • Assesses companion experiences                          │
│   • Calculates transcendence score                          │
│                                                             │
│   Returns: Complete MomentSense                             │
└─────────────────────────────────────────────────────────────┘
```

### The User Experience

**Morning:** Family visits Senso-ji Temple, takes photos, enjoys the experience.

**Evening:** Notification appears:
> 📍 **Senso-ji Temple**
> You spent 2 hours here this morning. I found 12 photos.
> **[Capture this moment]** · Not now

**User taps "Capture"** → sees pre-filled screen:
- Photos: already selected
- Venue: already identified
- Time: already known
- Companions: already detected from photos
- Optional: add voice note

**User adds voice note:** "This is the Japan I dreamed of"

**User taps "Capture"** → Quinn synthesizes everything.

**Total user effort:** One tap + optional voice note (15 seconds)

---

## Human Confirmation: The Non-Negotiables

### Why Confirmation Matters

| Risk | Without Confirmation | With Confirmation |
|------|---------------------|-------------------|
| Unwanted memories | Bad date saved as "special moment" | User chooses what to keep |
| Privacy violation | Silent surveillance feeling | Clear consent per moment |
| Noise | Dentist visit flagged as memory | User filters false positives |
| Trust | "What is Quinn doing?" | "Quinn asks, I decide" |

### Confirmation Rules

1. **Never capture without explicit consent**
   - Every moment requires a tap
   - No "auto-save" mode, ever

2. **One prompt per moment**
   - Ask once with good context
   - If "Not now" → one reminder the next day
   - If ignored twice → drop it

3. **"Never ask again" is permanent**
   - Deletes all candidate data for that moment
   - Respects user's choice absolutely

4. **Make ignoring easy**
   - Swipe to dismiss
   - No guilt, no follow-up
   - Notification disappears cleanly

5. **Show what you know**
   - "I found 12 photos" — transparent
   - "You were here for 2 hours" — explains detection
   - Never feel like magic, feel like helpful

---

## Ambient Detection: What Quinn Observes

All observation happens **locally on-device**. Nothing goes to cloud until user confirms.

### Input Sources

| Source | What's Observed | Privacy Model |
|--------|-----------------|---------------|
| **Photo Library** | New photos with location + time EXIF | Local only, never uploaded |
| **Location** | Significant stops (>30 min dwell) | On-device geofencing, no tracking server |
| **Calendar** | Event names + times | Local calendar API, names used for context |
| **Photos (faces)** | Number of people, group dynamics | On-device Vision, no facial recognition |
| **Time Patterns** | Weekend, evening, vacation dates | Local heuristics |
| **Wearables** | Heart rate, steps, elevation | On-device HealthKit, never transmitted |

---

## Audio: A First-Class Input

> *"For multiple personas, audio IS the product."*

Audio is not optional enrichment — it's a primary input that dramatically improves synthesis quality.

### Why Audio Matters

| Persona | What Audio Captures | Example |
|---------|--------------------| --------|
| **Traveler (Marco)** | Ambient soundscape | Market vendors, café chatter, street musicians |
| **Caregiver (Linda)** | Voice preservation | Mother's stories before Alzheimer's takes them |
| **Mindfulness (Aisha)** | Sensory texture | Birdsong, rainfall, sacred silence |
| **Parent** | First words | Child's voice at each developmental stage |

### Audio in the Synthesis Pipeline

| Component | Input | Output |
|-----------|-------|--------|
| **Transcription** | Voice note (15-60s) | Text transcript |
| **Sentiment Analysis** | Transcript text | Emotion score (-1 to 1), keywords |
| **Tone Matching** | Audio + transcript | Narrative voice that sounds like user |
| **Ambient Detection** | Background audio | Environmental context (busy, quiet, nature) |

### Audio Capture Modes

| Mode | Use Case | Duration |
|------|----------|----------|
| **Voice reflection** | "Tell me about this moment" | 15-30 seconds |
| **Ambient capture** | Background sounds only | 30-60 seconds |
| **Extended story** | Full memory narration | 1-3 minutes |

### Prompts That Encourage Audio

Instead of a generic microphone button, prompt with:

- "How did this moment feel?"
- "What will you remember most?"
- "Describe the sounds around you"
- "What would you tell a friend about this?"

**Design principle:** Make audio the path of least resistance. Speaking for 15 seconds beats typing for 5 minutes.

### Moment Detection Heuristics

Quinn calculates a "moment likelihood score" to decide whether to prompt:

| Signal | Weight | Example |
|--------|--------|---------|
| Dwell time > 45 min at venue | +40 | Spent real time here |
| 5+ photos in location | +30 | Captured memories |
| Location is known venue | +20 | Google Places match |
| First visit to this place | +15 | Novel experience |
| Calendar event matches | +15 | "Dinner at Jiro" |
| Weekend or vacation | +10 | Leisure time |
| Golden hour timing | +5 | Good light = memorable |
| Heart rate elevated | +5 | Excitement signal |

**Threshold:** Only prompt if score > 60

**Anti-noise:** Suppress prompts for:
- Home location
- Work location
- Routine stops (same place weekly)
- Very short visits (<15 min)

---

## Data Enrichment

Once user confirms, Quinn enriches the moment with external context.

### Venue-Specific Data

| Venue Type | Enrichment Data | Sources |
|------------|-----------------|---------|
| **Dining** | Menu, cuisine, chef info, Michelin status, dietary options, dress code | Google Places, Yelp, restaurant sites |
| **Landmarks** | History, architecture, famous visitors, UNESCO status, photography tips | Wikipedia, official sites |
| **Events/Shows** | Setlist, performers, venue capacity, seat context | Event APIs, Setlist.fm |
| **Nature** | Trail conditions, wildlife, seasonal blooms, difficulty | AllTrails, park services |
| **Shopping** | Notable brands, local specialties, bargaining norms | Google Places, travel forums |

### Weather & Environment

| Data | Source | Use |
|------|--------|-----|
| Conditions (sunny, rain) | OpenWeather | Context for experience quality |
| Temperature, humidity | OpenWeather | Comfort score |
| Sunrise/sunset | Calculated | Golden hour detection |
| Crowd level | Google Popular Times | Atmosphere context |

### Excitement & Fame

| Signal | Source | Example |
|--------|--------|---------|
| Fame score (0-1) | Wikipedia page views | Senso-ji: 0.95 |
| Unique claims | Wikipedia text | "Tokyo's oldest temple" |
| Celebrity connections | Wikipedia, news | "Featured in Lost in Translation" |
| Historical significance | Wikipedia | "Founded in 628 CE" |

---

## Output: MomentSense

The complete synthesized memory returned to user.

### Core Output

| Component | Description |
|-----------|-------------|
| **Emotion Tags** | 3-5 emotions detected (awe, joy, peace, wonder) |
| **Primary Emotion** | Dominant feeling with confidence score |
| **Atmosphere** | Lighting, energy, setting, crowd feel |
| **Transcendence Score** | 0-1 highlight worthiness |
| **Sensory Details** | Visual, audio, scent, tactile descriptions |

### Narratives

| Length | Use Case | Example |
|--------|----------|---------|
| **Short** (<280 chars) | Tweet, quick share | "Morning light at Senso-ji. Incense smoke, temple bells, ancient calm—the Japan I dreamed of." |
| **Medium** (2-3 sentences) | Instagram caption | Full sensory description |
| **Full** (paragraph) | Journal, blog | Complete story with companions |

### Memory Anchors

| Anchor Type | Purpose | Example |
|-------------|---------|---------|
| Sensory | Trigger vivid recall | "Incense smoke curling through morning light" |
| Emotional | Capture peak feeling | "The moment of awe when the gate appeared" |
| Unexpected | Preserve serendipity | "The monk who blessed us unexpectedly" |
| Shareable | Social-worthy moment | "Perfect symmetry of the torii gates" |
| Family/Group | Collective memory | "All four of us laughing at Max's reaction" |

### Companion Experiences — Unique Differentiator

> *"Companion sensing is genuinely unique. No competitor does this. It's invisible on the landing page — surface it."*

Quinn doesn't just capture *your* memory — it captures everyone's experience. This is our moat.

**Why it matters:**
- "Was this a good trip for Mom?" → Quinn knows (accessibility needs met, found peaceful spots)
- "Did Max enjoy Japan?" → Quinn knows (exceptional engagement at Pokemon Center, fascinated by temple lantern)
- "Did Sarah feel included?" → Quinn knows (got her photography moments, vegetarian options available)

For each companion present:

| Field | Description |
|-------|-------------|
| Moment highlight | What this meant to them |
| Engagement level | low / moderate / high / exceptional |
| Interests matched | What aligned with their preferences |
| Needs met | Dietary, accessibility, pace |
| Concerns | Flags for fatigue, conflicts |

**Surface this in marketing:** "Quinn remembers how everyone in your group experienced the trip — not just you."

---

## End-to-End: The Sensory Engine

This section shows the complete flow from ambient detection through synthesis to output.

### Complete System Architecture

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           QUINN SENSORY AGENT                                  ║
║                     End-to-End Ambient Journaling System                       ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                    LAYER 1: AMBIENT OBSERVATION                         │  ║
║  │                        (Always On, Always Local)                        │  ║
║  │                                                                         │  ║
║  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  ║
║  │   │  Photo   │ │ Location │ │ Calendar │ │   Time   │ │ Wearable │    │  ║
║  │   │  Library │ │  Dwell   │ │  Events  │ │ Patterns │ │  Signals │    │  ║
║  │   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘    │  ║
║  │        │            │            │            │            │           │  ║
║  │        └────────────┴─────┬──────┴────────────┴────────────┘           │  ║
║  │                           ▼                                             │  ║
║  │                 ┌──────────────────┐                                    │  ║
║  │                 │ Moment Candidate │                                    │  ║
║  │                 │    Detector      │                                    │  ║
║  │                 │  (Score > 60?)   │                                    │  ║
║  │                 └────────┬─────────┘                                    │  ║
║  └──────────────────────────┼──────────────────────────────────────────────┘  ║
║                             │                                                  ║
║                             ▼                                                  ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                    LAYER 2: HUMAN CONFIRMATION                          │  ║
║  │                         (One Prompt, User Decides)                      │  ║
║  │                                                                         │  ║
║  │   ┌─────────────────────────────────────────────────────────────────┐  │  ║
║  │   │  📍 Senso-ji Temple · 2 hours · 12 photos                       │  │  ║
║  │   │                                                                 │  │  ║
║  │   │  [✓ Capture]     [Not now]     [Never ask again]               │  │  ║
║  │   └─────────────────────────────────────────────────────────────────┘  │  ║
║  │                                                                         │  ║
║  │   ┌──────────┐         ┌──────────┐         ┌──────────────────┐       │  ║
║  │   │ Capture  │────────▶│ Continue │         │ Delete candidate │       │  ║
║  │   └──────────┘         └──────────┘         │ Mark as routine  │       │  ║
║  │                                              └──────────────────┘       │  ║
║  └──────────────────────────┬──────────────────────────────────────────────┘  ║
║                             │                                                  ║
║                             ▼                                                  ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                    LAYER 3: INPUT COLLECTION                            │  ║
║  │                      (Pre-filled, User Enriches)                        │  ║
║  │                                                                         │  ║
║  │   Auto-collected:                    User adds (optional):              │  ║
║  │   ├── Photos (from library)          ├── Voice note 🎤                  │  ║
║  │   ├── Venue (from location)          ├── Edit photo selection           │  ║
║  │   ├── Date/Time (from EXIF)          ├── Tag companions                 │  ║
║  │   ├── Duration (from dwell)          └── Link to itinerary              │  ║
║  │   └── Companions (face count)                                           │  ║
║  │                                                                         │  ║
║  │   ┌────────────────────────────────────────────────────────────────┐   │  ║
║  │   │                  ✨ Capture this moment                        │   │  ║
║  │   └────────────────────────────────────────────────────────────────┘   │  ║
║  └──────────────────────────┬──────────────────────────────────────────────┘  ║
║                             │                                                  ║
║                             ▼                                                  ║
║  ╔═════════════════════════════════════════════════════════════════════════╗  ║
║  ║                    LAYER 4: SENSORY ENGINE                              ║  ║
║  ║                   (The Intelligence Layer)                              ║  ║
║  ╠═════════════════════════════════════════════════════════════════════════╣  ║
║  ║                                                                         ║  ║
║  ║   ┌─────────────────────────────────────────────────────────────────┐  ║  ║
║  ║   │                 4A: LOCAL PROCESSING                            │  ║  ║
║  ║   │                    (On-Device First)                            │  ║  ║
║  ║   │                                                                 │  ║  ║
║  ║   │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │  ║  ║
║  ║   │  │   Speech    │ │  Sentiment  │ │    EXIF     │               │  ║  ║
║  ║   │  │Transcription│ │  Analysis   │ │ Extraction  │               │  ║  ║
║  ║   │  │  (Whisper)  │ │  (Local ML) │ │  (Metadata) │               │  ║  ║
║  ║   │  └─────────────┘ └─────────────┘ └─────────────┘               │  ║  ║
║  ║   │                                                                 │  ║  ║
║  ║   │  ┌─────────────────────────────────────────────────────────┐   │  ║  ║
║  ║   │  │              LOCAL PHOTO ANALYSIS (Privacy-First)       │   │  ║  ║
║  ║   │  │                                                         │   │  ║  ║
║  ║   │  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐ │   │  ║  ║
║  ║   │  │  │   Face    │ │  Scene    │ │ Lighting  │ │ Indoor/ │ │   │  ║  ║
║  ║   │  │  │   Count   │ │   Type    │ │Atmosphere │ │ Outdoor │ │   │  ║  ║
║  ║   │  │  │ (Vision)  │ │ (CoreML)  │ │ (CoreML)  │ │(Vision) │ │   │  ║  ║
║  ║   │  │  └───────────┘ └───────────┘ └───────────┘ └─────────┘ │   │  ║  ║
║  ║   │  │                                                         │   │  ║  ║
║  ║   │  │  ┌───────────┐ ┌───────────┐ ┌───────────┐             │   │  ║  ║
║  ║   │  │  │  Basic    │ │   Crowd   │ │  Energy   │             │   │  ║  ║
║  ║   │  │  │ Emotion   │ │   Level   │ │  Level    │             │   │  ║  ║
║  ║   │  │  │ (CoreML)  │ │ (CoreML)  │ │ (CoreML)  │             │   │  ║  ║
║  ║   │  │  └───────────┘ └───────────┘ └───────────┘             │   │  ║  ║
║  ║   │  │                                                         │   │  ║  ║
║  ║   │  │  Photos NEVER leave device for basic analysis.         │   │  ║  ║
║  ║   │  │  Cloud only used for nuanced emotion/narrative.        │   │  ║  ║
║  ║   │  └─────────────────────────────────────────────────────────┘   │  ║  ║
║  ║   │                                                                 │  ║  ║
║  ║   │  ┌─────────────┐                                               │  ║  ║
║  ║   │  │   Weather   │                                               │  ║  ║
║  ║   │  │    Fetch    │                                               │  ║  ║
║  ║   │  │ (Cached API)│                                               │  ║  ║
║  ║   │  └─────────────┘                                               │  ║  ║
║  ║   └─────────────────────────┬───────────────────────────────────────┘  ║  ║
║  ║                             │                                           ║  ║
║  ║                             ▼                                           ║  ║
║  ║   ┌─────────────────────────────────────────────────────────────────┐  ║  ║
║  ║   │                 4B: LOCAL LLM LAYER                             │  ║  ║
║  ║   │              (Try Local First, Escalate if Needed)              │  ║  ║
║  ║   │                                                                 │  ║  ║
║  ║   │  Input: Local processing results + user voice note              │  ║  ║
║  ║   │                                                                 │  ║  ║
║  ║   │  Try generating with Llama 3.2 / Phi-3 / Apple Intelligence:    │  ║  ║
║  ║   │  ├── Short narrative (< 280 chars)                              │  ║  ║
║  ║   │  ├── Basic emotion classification                               │  ║  ║
║  ║   │  └── Keyword extraction                                         │  ║  ║
║  ║   │                                                                 │  ║  ║
║  ║   │  Quality check: Is output good enough?                          │  ║  ║
║  ║   │  ├── YES → Use local result (no cloud call)                     │  ║  ║
║  ║   │  └── NO  → Escalate to Cloud Claude                             │  ║  ║
║  ║   └─────────────────────────┬───────────────────────────────────────┘  ║  ║
║  ║                             │                                           ║  ║
║  ║              ┌──────────────┴──────────────┐                           ║  ║
║  ║              ▼                              ▼                           ║  ║
║  ║   ┌──────────────────┐        ┌─────────────────────────────────────┐  ║  ║
║  ║   │  LOCAL COMPLETE  │        │    4C: CLOUD CLAUDE TEXT            │  ║  ║
║  ║   │  (No cloud call) │        │    (Metadata Only — No Photos)      │  ║  ║
║  ║   │                  │        │                                     │  ║  ║
║  ║   │  Target: 60-70%  │        │  INPUT (what Claude receives):      │  ║  ║
║  ║   │  fully local     │        │  ├── Photo analysis tags (local)    │  ║  ║
║  ║   │  (basic moments) │        │  ├── Voice metadata (sentiment, keywords, tone)          │  ║  ║
║  ║   │                  │        │  ├── Venue enrichment data          │  ║  ║
║  ║   └──────────────────┘        │  └── Weather context                │  ║  ║
║  ║                               │                                     │  ║  ║
║  ║                               │  ⚠️ Photos/audio/transcript NEVER sent         │  ║  ║
║  ║                               │                                     │  ║  ║
║  ║                               │  OUTPUT (what Claude generates):    │  ║  ║
║  ║                               │  ├── Full narrative (medium, full)  │  ║  ║
║  ║                               │  ├── Memory anchors (5 types)       │  ║  ║
║  ║                               │  ├── Companion insights             │  ║  ║
║  ║                               │  ├── Excitement hooks               │  ║  ║
║  ║                               │  └── Emotion synthesis from tags    │  ║  ║
║  ║                               └──────────────────┬──────────────────┘  ║  ║
║  ║                                                  │                      ║  ║
║  ╚══════════════════════════════════════════════════╪══════════════════════╝  ║
║                                                     │                          ║
║                                                     ▼                          ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                    LAYER 5: TRANSCENDENCE SCORING                       │  ║
║  │                       (Highlight Detection)                             │  ║
║  │                                                                         │  ║
║  │   *Weights are initial estimates — to be validated via user testing*   │  ║
║  │                                                                         │  ║
║  │   Score = weighted combination of:                                      │  ║
║  │   ├── Emotion intensity     (0.25)  │  How strongly felt?              │  ║
║  │   ├── Atmosphere quality    (0.15)  │  Golden hour, tranquil, etc.     │  ║
║  │   ├── Novelty factor        (0.15)  │  First visit? Unexpected?        │  ║
║  │   ├── Fame score            (0.10)  │  World-famous landmark?          │  ║
║  │   ├── Weather match         (0.10)  │  Perfect conditions?             │  ║
║  │   ├── Companion engagement  (0.10)  │  Everyone having a good time?    │  ║
║  │   ├── Intent match          (0.10)  │  Met or exceeded plan?           │  ║
║  │   └── Surprise factor       (0.05)  │  Serendipitous discovery?        │  ║
║  │                                                                         │  ║
║  │   Result: 0.0 ─────────────────────────────────────────────────── 1.0  │  ║
║  │           │ Forgettable │ Normal │ Memorable │ Highlight │ Peak │      │  ║
║  │           0            0.3      0.5         0.7         0.85    1.0    │  ║
║  └──────────────────────────┬──────────────────────────────────────────────┘  ║
║                             │                                                  ║
║                             ▼                                                  ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                    LAYER 6: OUTPUT ASSEMBLY                             │  ║
║  │                      (MomentSense Object)                               │  ║
║  │                                                                         │  ║
║  │   ┌─────────────────────────────────────────────────────────────────┐  │  ║
║  │   │ {                                                               │  │  ║
║  │   │   moment_id: "uuid",                                            │  │  ║
║  │   │   venue_name: "Senso-ji Temple",                                │  │  ║
║  │   │   primary_emotion: "awe",                                       │  │  ║
║  │   │   transcendence_score: 0.87,                                    │  │  ║
║  │   │   atmosphere: { lighting: "golden_hour", energy: "tranquil" },  │  │  ║
║  │   │   excitement: { fame_score: 0.95, hook: "Tokyo's oldest..." },  │  │  ║
║  │   │   memory_anchors: { sensory: "Incense smoke curling..." },      │  │  ║
║  │   │   narratives: { short: "...", medium: "...", full: "..." },     │  │  ║
║  │   │   companion_experiences: [...],                                 │  │  ║
║  │   │   processing: { local_percentage: 35, cloud_calls: [...] }      │  │  ║
║  │   │ }                                                               │  │  ║
║  │   └─────────────────────────────────────────────────────────────────┘  │  ║
║  └──────────────────────────┬──────────────────────────────────────────────┘  ║
║                             │                                                  ║
║                             ▼                                                  ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                    LAYER 7: STORAGE & DISPLAY                           │  ║
║  │                                                                         │  ║
║  │   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │  ║
║  │   │   Local     │     │   Memory    │     │    Trip     │              │  ║
║  │   │  Storage    │     │   Gallery   │     │   Summary   │              │  ║
║  │   │ (on-device) │     │    View     │     │   Builder   │              │  ║
║  │   └─────────────┘     └─────────────┘     └─────────────┘              │  ║
║  │                                                                         │  ║
║  │   Optional: Encrypted cloud sync for cross-device access               │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Sensory Engine: Detailed Processing Flow

When user taps "Capture", the Sensory Engine processes in this order:

```
TIME ──────────────────────────────────────────────────────────────────▶

 0s         1s         2s         3s         4s         5s        10s
 │          │          │          │          │          │          │
 ├──────────┴──────────┴──────────┴──────────┴──────────┴──────────┤
 │                                                                  │
 │  ┌─────────────────────────────────────────────────────────┐    │
 │  │ PARALLEL LOCAL PROCESSING (0-2 seconds)                 │    │
 │  │                                                         │    │
 │  │  Thread 1: Voice transcription (Whisper)                │    │
 │  │  Thread 2: EXIF extraction (all photos)                 │    │
 │  │  Thread 3: Face detection (Vision framework)            │    │
 │  │  Thread 4: Sentiment analysis (local classifier)        │    │
 │  │  Thread 5: Basic atmosphere (CoreML)                    │    │
 │  └─────────────────────────────────────────────────────────┘    │
 │                              │                                   │
 │                              ▼                                   │
 │  ┌─────────────────────────────────────────────────────────┐    │
 │  │ LOCAL LLM ATTEMPT (2-3 seconds)                         │    │
 │  │                                                         │    │
 │  │  Try short narrative with local model                   │    │
 │  │  Quality score: [■■■■■■■□□□] 70%                        │    │
 │  │  Threshold: 75% → Escalate to Claude                    │    │
 │  └─────────────────────────────────────────────────────────┘    │
 │                              │                                   │
 │                              ▼                                   │
 │  ┌─────────────────────────────────────────────────────────┐    │
 │  │ PARALLEL CLOUD PROCESSING (3-8 seconds)                 │    │
 │  │                                                         │    │
 │  │  ┌─────────────────┐  ┌─────────────────┐              │    │
 │  │  │ Venue Data      │  │ Weather API     │              │    │
 │  │  │ (Wikipedia API) │  │ (OpenWeather)   │              │    │
 │  │  └────────┬────────┘  └────────┬────────┘              │    │
 │  │           │                    │                        │    │
 │  │           └────────┬───────────┘                        │    │
 │  │                    ▼                                    │    │
 │  │           ┌─────────────────────────────────────┐      │    │
 │  │           │ Claude Text (metadata only)         │      │    │
 │  │           │                                     │      │    │
 │  │           │ Input: local analysis metadata only │      │    │
 │  │           │ Output: narratives, anchors, hooks  │      │    │
 │  │           │                                     │      │    │
 │  │           │ ⚠️ No photos/audio/transcript sent  │      │    │
 │  │           └─────────────────────────────────────┘      │    │
 │  └─────────────────────────────────────────────────────────┘    │
 │                              │                                   │
 │                              ▼                                   │
 │  ┌─────────────────────────────────────────────────────────┐    │
 │  │ ASSEMBLY & SCORING (8-10 seconds)                       │    │
 │  │                                                         │    │
 │  │  Combine all results → Calculate transcendence          │    │
 │  │  → Assemble MomentSense → Store locally                 │    │
 │  └─────────────────────────────────────────────────────────┘    │
 │                                                                  │
 └──────────────────────────────────────────────────────────────────┘

TOTAL: < 10 seconds from "Capture" tap to complete MomentSense
```

### What Each Engine Component Does

| Component | Input | Processing | Output |
|-----------|-------|------------|--------|
| **Voice Transcriber** | Audio file | Whisper.cpp on-device | Text transcript |
| **Sentiment Analyzer** | Transcript text | Local classifier | Score -1 to 1, keywords |
| **EXIF Extractor** | Photo files | Metadata read | Location, time, camera |
| **Face Detector** | Photos | Vision framework (local) | Count, age groups |
| **Atmosphere Classifier** | Photos | CoreML model (local) | Lighting, energy, setting |
| **Emotion Detector** | Photos | CoreML model (local) | Basic emotion tags |
| **Local LLM** | All local results | Llama/Phi inference | Short narrative attempt |
| **Claude Text** | Metadata only (no transcript) | Cloud API | Narratives, anchors, insights |
| **Venue Enricher** | Venue name | Wikipedia + Google | History, fame, practical info |
| **Weather Fetcher** | Coarse location + time | OpenWeather API | Conditions, comfort score |
| **Excitement Engine** | Venue data | Rule-based + Claude | Fame score, claims, hook |
| **Transcendence Scorer** | All outputs | Weighted formula | 0-1 score, factors |

**Note:** Claude Text receives ONLY extracted metadata — never raw photos, audio, OR transcript text. Transcripts are processed locally to extract sentiment, keywords, and tone; the verbatim user words never leave the device.

### Example: Complete Processing for Senso-ji Temple

**Input collected:**
```
Photos: 12 images (temple gate, pagoda, family selfie, etc.)
Voice note: "This is the Japan I dreamed of" (8 seconds)
Venue: Senso-ji Temple (from location)
Time: 9:30 AM, April 15, 2025 (from EXIF)
Duration: 2 hours 15 minutes (from dwell)
Companions: 4 faces detected (2 adults, 1 child, 1 senior)
```

**Local processing (0-2s):**
```
Voice transcript: "This is the Japan I dreamed of"
Sentiment: 0.85 (highly positive)
Keywords: ["Japan", "dreamed"]
Face count: 4 (adult, adult, child, senior)
Basic atmosphere: outdoor, bright, crowded
EXIF location: 35.7148° N, 139.7967° E
```

**Local LLM attempt (2-3s):**
```
Attempt: "Beautiful morning at Senso-ji Temple with family."
Quality: TBD (see Local vs Cloud Quality Test)
Decision: TBD — may be sufficient, pending validation
```

> ⚠️ **Untested assumption:** The premise that local LLMs produce "generic" output while Claude produces "emotional" output has not been empirically validated. See **Local vs Cloud Narrative Quality Test** in the Test Strategy section. If local models pass the quality threshold, this escalation step may be removed entirely.

**Cloud enrichment (3-5s):**
```
Venue data (Wikipedia):
  - Founded: 628 CE
  - Significance: Tokyo's oldest temple
  - Famous for: Kaminarimon Gate, Nakamise shopping street
  - Unique claim: "Oldest temple in Tokyo"

Weather (OpenWeather - coarse coordinates only):
  - Condition: Clear
  - Temperature: 18°C
  - Comfort score: 0.92 (perfect spring morning)
```

**Claude Text synthesis (5-8s):**
```
INPUT sent to Claude (metadata only, NO photos, NO transcript):
  - Photo analysis: {scene: "temple", lighting: "golden_hour", faces: 4,
                     crowd: "moderate", energy: "tranquil", emotion: "calm"}
  - Voice analysis: {sentiment: 0.85, tone: "awe", keywords: ["Japan", "dream"],
                     theme: "fulfillment", duration_sec: 8}
  - Venue: Senso-ji Temple, Tokyo's oldest temple, founded 628 CE
  - Weather: Clear, 18°C, perfect spring morning
  - Companions: 4 (adult, adult, child "Max", senior "Mom")

OUTPUT from Claude:
  - Primary emotion: awe (synthesized from high sentiment + temple + golden hour)
  - Secondary: joy, peace, wonder

  Narratives:
  - Short: "Morning light at Senso-ji. Incense smoke, temple bells, ancient calm."
  - Medium: "We arrived as golden light filtered through the Kaminarimon Gate. Max couldn't stop pointing at everything—the massive lantern, the incense smoke, the ancient wooden beams. Mom found a bench in the garden and just breathed."
  - Full: [paragraph with all companion details]

  Excitement hook:
  "You're standing where shoguns prayed for 400 years—Tokyo's oldest temple, founded in 628 CE."

  Memory anchors:
  - Sensory: "Incense smoke curling through morning light"
  - Emotional: "The moment of awe when the Kaminarimon Gate appeared"
  - Unexpected: "Finding a peaceful garden behind the main hall"
  - Shareable: "Perfect family selfie with the five-story pagoda"
  - Family: "Max's face when he saw the giant lantern"
```

**Note:** Claude infers the emotional quality from sentiment score (0.85) and keywords (["Japan", "dream"]) without seeing the user's actual words. The verbatim transcript "This is the Japan I dreamed of" stays on-device and is stored with the moment for the user's own reference.

**Note:** Claude infers "incense smoke" and "temple bells" from venue context (temple) + atmosphere (sacred).
These are contextually appropriate inferences, not hallucinations from seeing the photos.

**Transcendence scoring (8-9s):**
```
Emotion intensity:    0.89 × 0.25 = 0.22
Atmosphere quality:   0.90 × 0.15 = 0.14
Novelty factor:       0.85 × 0.15 = 0.13  (first temple visit)
Fame score:           0.95 × 0.10 = 0.10
Weather match:        0.92 × 0.10 = 0.09
Companion engagement: 0.80 × 0.10 = 0.08
Intent match:         0.90 × 0.10 = 0.09  (exceeded "peaceful temple for Mom")
Surprise factor:      0.70 × 0.05 = 0.04  (found hidden garden)
────────────────────────────────────
TOTAL:                         0.87  ★ HIGHLIGHT
```

**Final output (10s):**
```json
{
  "moment_id": "550e8400-e29b-41d4-a716-446655440000",
  "venue_name": "Senso-ji Temple",
  "primary_emotion": "awe",
  "emotion_confidence": 0.89,
  "transcendence_score": 0.87,
  "atmosphere": {
    "lighting": "golden_hour",
    "energy": "tranquil",
    "setting": "sacred",
    "crowd_feel": "moderate"
  },
  "excitement": {
    "fame_score": 0.95,
    "unique_claims": ["Tokyo's oldest temple"],
    "excitement_hook": "You're standing where shoguns prayed for 400 years"
  },
  "narratives": {
    "short": "Morning light at Senso-ji. Incense smoke, temple bells, ancient calm—the Japan I dreamed of.",
    "medium": "We arrived as golden light filtered through...",
    "full": "The morning we visited Senso-ji Temple..."
  },
  "memory_anchors": {
    "sensory_anchor": "Incense smoke curling through morning light",
    "emotional_anchor": "The moment of awe when the Kaminarimon Gate appeared",
    "unexpected_anchor": "Finding a peaceful garden behind the main hall",
    "shareable_anchor": "Perfect family selfie with the five-story pagoda",
    "family_anchor": "Max's face when he saw the giant lantern"
  },
  "companion_experiences": [
    { "name": "Sarah", "highlight": "Got the perfect shot of the pagoda", "engagement": "high" },
    { "name": "Max", "highlight": "Fascinated by the giant lantern", "engagement": "exceptional" },
    { "name": "Mom", "highlight": "Found peace in the garden", "engagement": "high", "needs_met": ["accessibility", "rest"] }
  ],
  "processing": {
    "local_percentage": 65,
    "cloud_calls": ["claude_text", "wikipedia", "openweather"],
    "processing_time_ms": 7500
  }
}
```

---

## Privacy Architecture: Cloud-Assisted with Local Privacy Layer

> *"Either own the cloud-assisted architecture transparently, or build the on-device pipeline first. Half-truths kill privacy products."*

**The honest truth:** Quinn uses cloud APIs for narrative synthesis and venue enrichment. We protect privacy by ensuring **photos and audio never leave the device** — only extracted metadata and text go to the cloud.

### What Stays Local vs. What Goes to Cloud

| Component | Location | What's Sent | What's NOT Sent |
|-----------|----------|-------------|-----------------|
| Ambient observation | **Local only** | Nothing | Photos, location, calendar |
| Moment candidate data | **Local only** | Nothing | All detection signals |
| Photo storage | **Local only** | Nothing | Raw image files |
| **Photo analysis** | **Local only** | Nothing | Photos never leave device |
| Speech transcription | **Local only** | Nothing | Audio never leaves device |
| Sentiment analysis | **Local only** | Nothing | — |
| Venue data fetch | **Cloud** | Venue name, coarse coordinates | User identity, precise location |
| Weather context | **Cloud** | Coarse lat/long + timestamp | User identity, precise location |
| Narrative generation | **Cloud (Claude)** | Local analysis metadata only | Raw photos, raw audio, transcript text, PII |

**Key Privacy Guarantee:** Claude receives ONLY extracted metadata — never raw photos, audio, OR transcript text. User's verbatim words stay on-device.

### Cloud Processing Transparency (UI Requirement)

Show users what's happening:

**Processing flow:**
```
┌─────────────────────────────────────────────────────────┐
│  📱 Creating your memory...                             │
│                                                         │
│  ✓ Analyzed 12 photos (on device)                       │
│  ✓ Transcribed voice note (on device)                   │
│  ✓ Detected: temple, golden hour, 4 people              │
│                                                         │
│  ☁️ Generating your story...                            │
│  • Fetching venue history (Wikipedia)                   │
│  • Getting weather context (OpenWeather)                │
│  • Writing your narrative (Claude)                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  🔒 Your photos and voice note never left       │    │
│  │  your device. Only the analysis results         │    │
│  │  were used to generate your story.              │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Transparency is non-negotiable.** Users should always know where their data goes.

### Local Photo Analysis (Privacy-First)

**Principle:** Photos NEVER leave the device. All photo analysis happens on-device via CoreML and Vision frameworks.

| Photo Analysis Task | Location | Framework | Notes |
|---------------------|----------|-----------|-------|
| Face count | **Local** | Vision | Count only, no facial recognition |
| Scene type (beach, temple, restaurant) | **Local** | CoreML | Scene classification model |
| Lighting (golden hour, overcast, night) | **Local** | CoreML | Lighting detection model |
| Indoor/outdoor detection | **Local** | Vision | Environment classification |
| Crowd level (empty, moderate, packed) | **Local** | CoreML | People density estimation |
| Energy level (tranquil, lively, chaotic) | **Local** | CoreML | Activity/motion analysis |
| Basic emotion (happy, calm, excited) | **Local** | CoreML | Expression analysis |
| Age group detection | **Local** | Vision | Child/teen/adult/senior |
| Color palette | **Local** | Vision | Dominant colors for atmosphere |
| Composition quality | **Local** | CoreML | Photo quality scoring |

**What about "deep emotion synthesis"?**

Previously considered for Claude Vision, but removed for privacy. Instead:
- Local CoreML provides basic emotion tags from photos
- Local Whisper transcribes voice, extracts sentiment/keywords/tone
- Claude Text receives ONLY extracted metadata (no photos, no transcript)
- Claude Text synthesizes emotional narrative from metadata signals

This achieves similar quality for narratives while keeping photos AND user's words on-device.

### Local vs Cloud for Other Tasks

| Task | Location | Rationale |
|------|----------|-----------|
| Photo analysis | **Local only** | Privacy — photos never leave device |
| Speech transcription | **Local only** | Privacy — audio never leaves device |
| Sentiment detection | **Local only** | Simple classification, no cloud needed |
| Short narrative | Local first | Try local LLM, fallback to Claude Text |
| Full narrative | **Cloud (Claude Text)** | Receives metadata only, not photos |
| Memory anchors | **Cloud (Claude Text)** | Evocative language from metadata |
| Companion insights | **Cloud (Claude Text)** | Inferred from face count + context |
| Venue enrichment | **Cloud** | Wikipedia, Google Places |
| Weather context | **Cloud** | OpenWeather (coarse coordinates) |

### Processing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AMBIENT LAYER                           │
│                (always local, always on)                    │
│                                                             │
│  Photo library watch · Location dwell · Calendar events     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 CONFIRMATION PROMPT                         │
│                    (local UI)                               │
│                                                             │
│  User decides: Capture / Not now / Never                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (only if "Capture")
┌─────────────────────────────────────────────────────────────┐
│               LOCAL PROCESSING LAYER                        │
│                                                             │
│  • Speech transcription (Whisper / Apple Speech)            │
│  • Sentiment scoring (local classifier)                     │
│  • EXIF extraction (location, time)                         │
│  • Face count (Vision framework, no ID)                     │
│  • Scene type, lighting, indoor/outdoor (CoreML)            │
│  • Basic emotion, crowd level, energy (CoreML)              │
│  • Photos analyzed locally — never sent to cloud for basic  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               LOCAL LLM LAYER (try first)                   │
│                                                             │
│  • Attempt short narrative with Llama/Phi/Apple Intelligence│
│  • Quality score check                                      │
│  • If sufficient → use local result                         │
│  • If insufficient → escalate to cloud                      │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
     [Quality OK]                [Needs Claude]
              │                           │
              ▼                           ▼
┌─────────────────────┐     ┌─────────────────────────────────┐
│  RETURN LOCAL       │     │      CLOUD CLAUDE TEXT          │
│  (no cloud call)    │     │      (Metadata Only — No Photos)│
│                     │     │                                 │
│  60-70% of moments  │     │  Claude receives ONLY:          │
│  complete locally   │     │  • Local photo analysis tags    │
│  with basic photo   │     │  • Voice transcript text        │
│  analysis           │     │  • Venue/weather enrichment     │
│                     │     │                                 │
│                     │     │  Claude generates:              │
│                     │     │  • Full narrative               │
│                     │     │  • Evocative memory anchors     │
│                     │     │  • Companion insights           │
│                     │     │  • Excitement hooks             │
│                     │     │                                 │
│                     │     │  ⚠️ Photos/audio/transcript NEVER sent     │
└─────────────────────┘     └─────────────────────────────────┘
```

### Privacy Commitments

1. **Photos and audio NEVER leave device** — only extracted metadata sent to cloud
2. **Raw media never stored anywhere** — processed locally, metadata extracted
3. **Cloud calls are anonymized** — no user ID sent to third parties
4. **Clear UI indicators** when cloud processing occurs
5. **User can export and delete all data** from all systems
6. **"Never ask again" truly deletes** — no hidden retention

---

## Security & Privacy Requirements

*Validated against Quinn Security Auditor (`.claude/agents/quinn-security-auditor.md`)*

### EXIF Metadata Stripping (Required)

**Requirement:** Strip all EXIF metadata before any cloud API call.

| Data Type | Contains | Risk | Mitigation |
|-----------|----------|------|------------|
| GPS coordinates | Precise location | Location tracking | Strip before cloud |
| Timestamp | Exact capture time | Activity pattern inference | Strip before cloud |
| Device info | Camera model, serial | Device fingerprinting | Strip before cloud |
| Thumbnail | Embedded preview | Data leakage | Strip before cloud |

**Implementation:**
```
Photo selected → Extract EXIF locally → Store on device →
Local analysis via CoreML (photos never leave device) →
Send metadata to Claude Text for narrative synthesis
```

EXIF data used for local processing (venue detection, time context) but never transmitted. Photos are analyzed locally; only extracted metadata goes to Claude.

### Audio Transcript Retention (Required)

**Requirement:** Transcripts deleted when moment is finalized or discarded.

| State | Transcript Retention |
|-------|---------------------|
| Recording in progress | In memory only |
| Processing | Temp file, auto-deleted on completion |
| Moment saved | Transcript stored with moment (user data) |
| Moment discarded | Transcript deleted immediately |
| App closed before save | Transcript deleted on next launch |

**No orphan transcripts.** Every transcript must be attached to a moment or deleted.

### Location Data Handling (Required)

**Requirement:** Minimize location exposure to third parties.

| API | Current | Required Change |
|-----|---------|-----------------|
| OpenWeather | Precise lat/long | **Coarse coordinates only** (round to 0.1°, ~11km) |
| Google Places | Venue name + coords | Venue name only (no coords) OR user-disclosed trade-off |
| Wikipedia | Venue name only | ✅ No change needed |
| Claude Text | Metadata only | ✅ No photos, audio, OR transcript transmitted |

**Weather API mitigation:**
```
Precise: 35.7148° N, 139.7967° E  →  Coarse: 35.7° N, 139.8° E
```

This provides weather context without precise location trail.

### Data Deletion (GDPR/CCPA Required)

**Requirement:** User can delete all data at any time.

**Deletion scope:**

| Data Type | Storage | Deletion Method |
|-----------|---------|-----------------|
| Moments | Local device | Delete from app |
| Companion profiles | Local device | Delete from app |
| Audio recordings | Local device | Deleted with moment |
| Transcripts | Local device | Deleted with moment |
| EXIF cache | Local device | Clear cache option |
| Cloud-processed results | Ephemeral (not stored) | N/A — already discarded |

**Deletion guarantees:**
1. **Complete removal** — no soft-delete, no hidden retention
2. **Immediate effect** — deletion happens synchronously
3. **Confirmation UI** — "Are you sure? This cannot be undone."
4. **Export before delete** — offer data export before deletion

**GDPR Article 17 compliance:** Right to erasure fulfilled within 24 hours for any cloud-cached data (if applicable in future versions).

### Audit Trail (v2+ Required)

**Requirement:** User-reviewable log of cloud API calls.

| Event | Logged Data | NOT Logged |
|-------|-------------|------------|
| Cloud synthesis requested | Timestamp, moment ID, services called | Photo content, audio, transcript text |
| Venue lookup | Timestamp, venue name | Coordinates |
| Weather fetch | Timestamp, coarse location | Precise coordinates |

**Audit log location:** On-device only. User can view in Settings → Privacy → API Call History.

**Retention:** 30 days, then auto-deleted. User can clear manually anytime.

### Third-Party SDK Disclosure (Required)

**Requirement:** Document all third-party services that receive user data.

| Service | Data Received | Purpose | Privacy Policy |
|---------|---------------|---------|----------------|
| Claude (Anthropic) | Extracted metadata only (NO photos/audio/transcript) | Narrative synthesis | [Link] |
| Google Places | Venue name | Venue verification | [Link] |
| OpenWeather | Coarse coordinates only (~11km) | Weather context | [Link] |
| Wikipedia | Venue name | Historical context | Public API |

**Key Privacy Guarantee:** Claude receives only text and extracted metadata — never raw photos or audio files.

**No analytics SDKs with data collection** in the Sensory Agent. PostHog telemetry is anonymized and contains no PII (see `docs/PRIVACY_PRESERVING_TELEMETRY_IMPLEMENTATION.md`).

### Security Auditor Checklist

| Requirement | Status |
|-------------|--------|
| Photos NEVER leave device | ✅ All photo analysis via local CoreML/Vision |
| Audio NEVER leaves device | ✅ All transcription via local Whisper/Apple Speech |
| Transcript NEVER leaves device | ✅ Only extracted metadata (sentiment, keywords, tone) sent |
| Only metadata transmitted to cloud | ✅ Extracted tags only, no verbatim user content |
| User consent for cloud processing | ✅ Transparent about what goes to Claude |
| Data can be fully deleted | ✅ Deletion flow defined |
| Audit trail exists | ✅ v2+ requirement defined |
| No hardcoded secrets | ⏳ Verify at implementation |
| HTTPS for all transmissions | ⏳ Verify at implementation |
| No location trails in cloud | ✅ Coarse coordinates only (~11km) |

---

## Implementation Phases

### v1: Manual Capture (Foundation)

**What ships:**
- Web UI: upload photos, record voice note, enter venue
- **Local photo analysis** (CoreML): scene type, lighting, basic emotion, crowd level
- Voice transcription and sentiment analysis (local)
- Basic narrative generation (local LLM attempt first)
- **Cloud opt-in for premium synthesis:** deep emotion, evocative anchors, full narrative
- Venue enrichment via Google Places + Wikipedia (cloud)
- Transcendence scoring

**User experience:** Upload a few photos, speak for 15 seconds, get a complete memory.

**Privacy model:** Photos analyzed locally by default. Cloud synthesis is opt-in for users who want richer narratives.

**Why this first:** Validates that local photo analysis provides acceptable quality for basic moments, while proving cloud synthesis value for premium users.

**User effort:** Medium (upload + voice note, ~60 seconds total)

**Local processing:** CoreML photo analysis, Whisper transcription, local LLM narrative attempt
**Cloud services (opt-in):** Claude Text, Google Places, OpenWeather, Wikipedia

---

### v1.5: Smart Pre-fill

**What ships:**
- Read EXIF from photos (location, time)
- Auto-suggest venue from coordinates
- Pre-fill date/time from photo metadata
- Companion detection from faces (count, not ID)

**User effort:** Medium (verify pre-filled data)

---

### v2: Ambient Detection (iOS)

**What ships:**
- Photo library monitoring (local)
- Location dwell detection (local)
- Moment candidate scoring
- One-tap confirmation prompts
- "Not now" and "Never ask again" flows

**User effort:** Low (one tap + optional voice)

---

### v2.5: Calendar + Context

**What ships:**
- Calendar event integration
- Richer context from event names
- Better moment detection accuracy
- Grouped moments (full day at Disney)

**User effort:** Low

---

### v3: Full Ambient

**What ships:**
- Wearable integration (heart rate, steps)
- Audio ambience detection (optional)
- Trip-level synthesis (multi-day summary)
- Predictive prompting (best time to ask)

**User effort:** Minimal (mostly just confirm)

---

## Test Use Cases

### Use Case 1: Famous Landmark — Family Visit (Ambient)

**What happens:**
- Family visits Senso-ji Temple, takes 12 photos, stays 2 hours
- Quinn detects: dwell time + photos + known venue
- Evening notification: "Capture this moment at Senso-ji?"
- User taps "Capture", adds voice note: "This is the Japan I dreamed of"

**Expected output:**
- Primary emotion: Awe
- Atmosphere: Golden hour, tranquil, outdoor sacred
- Transcendence: 0.87
- Excitement hook: "Tokyo's oldest temple, where shoguns prayed since 628 CE"
- Memory anchor: "Incense smoke curling through morning light"
- Companion moments: Max fascinated by lantern, Mom found peace, Sarah got perfect shot

---

### Use Case 2: Michelin Restaurant — Romantic Dinner (Calendar-Triggered)

**What happens:**
- Calendar shows "Anniversary dinner at Sukiyabashi Jiro"
- User takes 4 photos during dinner
- Quinn detects: calendar event + photos + 2.5 hour dwell
- After dinner notification: "Capture this anniversary moment?"

**Expected output:**
- Primary emotion: Joy, intimacy
- Atmosphere: Dim, intimate, formal
- Companion concerns: FLAG vegetarian at sushi restaurant
- Memory anchor: "The moment the toro hit the tongue"

---

### Use Case 3: Hidden Nature Spot — Solo Discovery (Photo-Triggered)

**What happens:**
- Solo traveler finds waterfall, takes 8 photos
- No calendar, no known venue
- Quinn detects: photo cluster + nature EXIF + 90 min dwell
- Notification: "Looks like you found something special near Nikko?"

**Expected output:**
- Primary emotion: Wonder, solitude, discovery
- Transcendence: 0.92 (high novelty, serendipity)
- Memory anchor: "The roar of water drowning out everything else"

---

### Use Case 4: Declined Moment — User Says "Never"

**What happens:**
- User at doctor's office for 2 hours
- Quinn detects dwell time, considers prompting
- Score below threshold (no photos, routine location)
- OR: User sees prompt, taps "Never ask again"

**Expected behavior:**
- All candidate data deleted immediately
- Location marked as "routine" (optional)
- No further prompts about this moment

---

### Use Case 5: Disappointing Experience — Weather Ruined Plans

**What happens:**
- Family at Tokyo Skytree, heavy rain
- Only 2 sad photos, short dwell (gave up)
- Quinn detects: known venue + photos, but low engagement signals

**Prompt behavior:**
- Still asks (user might want to remember)
- Lower confidence: "Quick visit to Tokyo Skytree?"

**Expected output (if captured):**
- Primary emotion: Disappointment
- Transcendence: 0.25 (low, acknowledges failure)
- Weather impact: Critical
- Narrative: Acknowledges disappointment authentically

---

### Use Case 6: Minimal Signal — Edge Case

**What happens:**
- User took 1 blurry photo in Tokyo
- No dwell time, no calendar, no venue match

**Expected behavior:**
- Score below threshold
- No prompt shown
- Candidate data auto-expires after 48 hours

---

## Non-Functional Requirements

### Performance
- Ambient detection: < 1% battery impact
- Moment synthesis: < 10 seconds
- Photo analysis: < 3 seconds per photo
- Local LLM inference: < 2 seconds

### Privacy
- All ambient observation: local only
- Raw media: never stored on servers
- Cloud calls: anonymized, ephemeral
- User data: exportable, deletable

### Reliability
- Offline ambient detection: must work
- Graceful cloud degradation: local fallback
- Prompt delivery: reliable notification system

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Prompt acceptance rate | 60%+ (moments captured / moments prompted) |
| "Never ask again" rate | < 10% (indicates good detection) |
| Moments per trip | 5-10 captured (vs 0-1 with manual) |
| User effort per moment | < 20 seconds average |
| Local processing rate | 60-70% fully local (basic photo analysis + simple moments) |
| Narrative share rate | 70%+ would share generated text |

---

## Dependencies

| Dependency | Status | Required For |
|------------|--------|--------------|
| Claude API (Vision + Text) | Available | Photo analysis, narratives |
| Google Places API | Available | Venue identification |
| OpenWeather API | Needs setup | Weather context |
| Wikipedia API | Available (free) | Fame, history |
| iOS Photo Library API | Available | Ambient detection |
| iOS Location Services | Available | Dwell time |
| iOS Calendar API | Available | Event context |
| HealthKit (wearables) | Available | v3 signals |
| Local LLM (Llama/Phi) | Experimental | Local narrative |
| Apple Intelligence | iOS 18+ | On-device LLM |

---

## Complete Output Schema

```json
{
  "moment_id": "uuid",
  "timestamp": "ISO datetime",
  "venue_name": "string",
  "venue_category": "landmark|dining|shopping|nature",

  "detection": {
    "trigger": "photos|dwell|calendar|manual",
    "confidence": 0.0-1.0,
    "signals": ["string"]
  },

  "emotion_tags": ["string"],
  "primary_emotion": "string",
  "emotion_confidence": 0.0-1.0,

  "atmosphere": {
    "lighting": "golden_hour|bright|overcast|night|indoor_warm|indoor_cool",
    "energy": "tranquil|calm|lively|energetic|chaotic",
    "setting": "outdoor|indoor|nature|urban|sacred|transit",
    "crowd_feel": "empty|sparse|moderate|busy|packed"
  },

  "transcendence_score": 0.0-1.0,
  "transcendence_factors": ["string"],

  "sensory_details": {
    "visual": "string",
    "audio": "string",
    "scent": "string",      // AI-inferred from context (e.g., temple → incense), not sensed
    "tactile": "string"     // AI-inferred from context (e.g., beach → sand), not sensed
  },

  "excitement": {
    "fame_score": 0.0-1.0,
    "fame_signals": ["string"],
    "unique_claims": ["string"],
    "historical_significance": "string",
    "excitement_hook": "string"
  },

  "memory_anchors": {
    "sensory_anchor": "string",
    "emotional_anchor": "string",
    "unexpected_anchor": "string",
    "shareable_anchor": "string",
    "family_anchor": "string"
  },

  "narratives": {
    "short": "string (< 280 chars)",
    "medium": "string (2-3 sentences)",
    "full": "string (paragraph)"
  },

  "companion_experiences": [{
    "name": "string",
    "relationship": "string",
    "moment_highlight": "string",
    "engagement_level": "low|moderate|high|exceptional",
    "needs_met": ["string"],
    "concerns": ["string"]
  }],

  "environment": {
    "weather": {
      "condition": "string",
      "temperature_c": "float",
      "outdoor_comfort_score": 0.0-1.0
    },
    "timing": {
      "local_time": "string",
      "is_golden_hour": "boolean"
    }
  },

  "user_reflection": {
    "voice_note_transcript": "string",
    "sentiment": -1.0-1.0,
    "keywords": ["string"]
  },

  "processing": {
    "local_percentage": 0-100,
    "cloud_calls": ["string"],
    "processing_time_ms": "int"
  }
}
```

---

## Pricing Model

Quinn is a premium experience, not a free utility. Early positioning should signal this clearly.

### Tier Structure (Placeholder)

| Tier | Price | What's Included |
|------|-------|-----------------|
| **Free Trial** | $0 | 3 moments, full synthesis, watermarked exports |
| **Quinn Premium** | $X/month | Unlimited moments, full export, companion insights, trip summaries |
| **Quinn Family** | $Y/month | Premium + shared memories, family gallery, multi-device sync |

*Exact pricing TBD after v1 validation. Structure signals premium positioning from day one.*

### Why Premium Matters

- Attracts users who value memory preservation (not just free utility seekers)
- Validates willingness to pay before scaling
- Sets expectations: this is a crafted experience, not a commodity

---

## Future Exploration: Passive Conversation Capture

> *This is a v3+ consideration that requires a new consent model. Documenting for future reference.*

### The Opportunity

The current audio model is **active** — users consciously record a voice note. The most transformative use case is **passive conversation listening**:

- Phone on the table during dinner, Quinn quietly captures the conversation
- A friend mentions a career change → Quinn surfaces a relevant book recommendation later
- Someone shares they're feeling overwhelmed → Quinn suggests checking in with them

This turns Quinn from a "smart journal" into something genuinely indispensable.

### The Tension

This directly conflicts with our core principle: **"Never capture without explicit consent."**

### Possible Consent Models

| Model | How It Works | Privacy Trade-off |
|-------|--------------|-------------------|
| **Per-conversation opt-in** | "Quinn, listen to this dinner" | High friction, high trust |
| **Wearable-triggered** | Tap AirPods to start/stop | Medium friction, clear boundary |
| **Location-based** | Only capture at "journal-worthy" venues | Lower friction, higher risk |
| **Post-hoc consent** | Capture locally, ask before processing | Complex, but preserves choice |

### Recommendation

Explore this for v3/wearables, but with explicit per-session consent. Never "always-on" without user action.

---

## LLM Evaluation Framework

*Addresses: How do we know Claude isn't hallucinating?*

### The Risk

Claude generates narratives, memory anchors, and companion insights. Without evaluation, it could:
- Invent details not present in the input ("You visited the gift shop" when no gift shop was mentioned)
- Misattribute emotions ("You felt anxious" when user said "peaceful")
- Fabricate venue facts ("Founded in 1200 CE" when Wikipedia says 628 CE)

### Evaluation Principles

1. **Factual Grounding**: Every generated fact must trace back to input
2. **Calibrated Confidence**: 0.9 confidence should mean 90% correct
3. **Tone Fidelity**: Narrative voice should match user's voice note tone
4. **No Invention**: If information isn't available, omit it — don't guess

### Evaluation Metrics

| Metric | Definition | Target | How Measured |
|--------|------------|--------|--------------|
| **Factual Accuracy** | % of generated facts traceable to input | 100% | Automated fact extraction + matching |
| **Hallucination Rate** | % of narratives containing invented details | <2% | Human review of sample outputs |
| **Emotion Accuracy** | Primary emotion matches user's stated feeling | 85%+ | Compare to voice note sentiment |
| **Confidence Calibration** | Confidence scores match actual accuracy | ±10% | Track predictions vs outcomes |
| **Anchor Quality** | Memory anchors rated "evocative" by users | 70%+ | User feedback survey |

### Automated Evaluation Tests

```
test: "Narrative contains only facts from input"
─────────────────────────────────────────────────
Input:
  venue: "Senso-ji Temple"
  voice_transcript: "This is the Japan I dreamed of"
  detected_companions: 4

Output narrative: "Morning at Senso-ji with family..."

Validation:
  ✓ "Senso-ji" — in input.venue
  ✓ "family" — inferred from 4 companions (acceptable)
  ✗ "incense smoke" — NOT in input (hallucination unless from photo)

Rule: Flag if generated fact not in {venue, transcript, photo_analysis, enrichment_data}
```

### Human-in-the-Loop Evaluation

For v1, review 10% of generated outputs:

| Check | Pass Criteria |
|-------|---------------|
| Read the narrative aloud | Does it sound natural? |
| Compare to input | Any invented details? |
| Check companion insights | Do they match photo evidence? |
| Verify venue facts | Cross-reference with Wikipedia |

### Evaluation Pipeline (CI Integration)

```
On every PR touching prompts:
1. Run against 50 test cases (golden dataset)
2. Calculate factual accuracy score
3. Flag if accuracy drops below 95%
4. Block merge if hallucination detected in any output
```

### Golden Dataset

Maintain a set of labeled test cases:

| Test Case | Input | Expected Output | Validates |
|-----------|-------|-----------------|-----------|
| Senso-ji family | 12 photos, voice note, 4 faces | Awe, family anchors | Happy path |
| Solo nature | 8 photos, no voice, 1 face | Solitude, discovery | Minimal input |
| Failed outing | 2 photos, "disappointing" voice | Disappointment acknowledged | Negative emotion |
| No venue match | Photos only, unknown location | Generic narrative, no fabricated venue | Graceful degradation |

---

## Fallback Behavior

*Addresses: What happens when things fail?*

### Failure Modes & Responses

| Component | Failure Mode | User Experience | Technical Response |
|-----------|--------------|-----------------|-------------------|
| **Claude Text** | API timeout/error | Short narrative only | Use local LLM or template-based fallback |
| **Weather API** | Timeout/error | Weather section omitted | Set `weather: null`, don't block |
| **Wikipedia** | No article found | Fame section omitted | Set `fame_score: null`, use venue name only |
| **Google Places** | No match | User enters venue manually | Prompt for venue name input |
| **Whisper** | Transcription fails | "Voice note saved, text unavailable" | Store audio, skip sentiment |
| **Local LLM** | Quality below threshold | Escalate to Claude | Threshold TBD per Local vs Cloud test |
| **All cloud** | Complete outage | Full local-only experience | Return whatever local analysis provides |

### Graceful Degradation Tiers

```
TIER 1: Full Experience (all services working)
├── Cloud photo emotion analysis
├── Full narratives (short, medium, full)
├── All memory anchors
├── Weather context
├── Fame/excitement data
├── Companion insights
└── Processing: ~35% local, ~65% cloud

TIER 2: Reduced Cloud (Claude working, others failing)
├── Cloud photo emotion analysis
├── Full narratives
├── Memory anchors
├── Weather: OMITTED
├── Fame: OMITTED (use venue name only)
├── Companion insights
└── Processing: ~50% local, ~50% cloud

TIER 3: Local + Text Only (Claude Text failing)
├── Local photo analysis only (default behavior)
├── Short narrative (local LLM or template)
├── Basic emotion from sentiment
├── No memory anchors
├── No companion insights
└── Processing: ~95% local, ~5% cloud (weather only)

TIER 4: Fully Offline (no network)
├── Local photo analysis only
├── Template-based short narrative
├── Sentiment from voice (if Whisper cached)
├── "Enhance when online" option saved
└── Processing: 100% local
```

### UI for Degraded States

**Partial degradation:**
```
┌─────────────────────────────────────────────────┐
│  📱 Your moment was captured                    │
│                                                 │
│  ✓ Photos analyzed                              │
│  ✓ Voice note transcribed                       │
│  ⚠️ Weather data unavailable                    │
│  ⚠️ Some enrichment limited                     │
│                                                 │
│  Your memory is saved. We'll enhance it when    │
│  more data becomes available.                   │
│                                                 │
│  [View Memory]  [Retry Enhancement]             │
└─────────────────────────────────────────────────┘
```

**Full offline:**
```
┌─────────────────────────────────────────────────┐
│  📱 Saved for later                             │
│                                                 │
│  Your moment is safely stored on your device.   │
│  We'll create your full memory when you're      │
│  back online.                                   │
│                                                 │
│  [View Basic Memory]  [Remind Me Later]         │
└─────────────────────────────────────────────────┘
```

### Retry Strategy

| Failure Type | Retry | Backoff | Max Attempts |
|--------------|-------|---------|--------------|
| Network timeout | Yes | Exponential (1s, 2s, 4s) | 3 |
| Rate limit (429) | Yes | Use Retry-After header | 3 |
| Server error (5xx) | Yes | Exponential | 2 |
| Client error (4xx) | No | — | 1 |
| Invalid response | No | — | 1 |

### Never Block on Optional Data

**Principle:** Core memory creation must never fail due to enrichment failures.

| Data | Required? | If Missing |
|------|-----------|------------|
| Photos | Yes (at least 1) | Cannot proceed |
| Venue | No | Use "Unknown location" |
| Voice note | No | Skip sentiment, use photo-only |
| Weather | No | Omit weather section |
| Fame/history | No | Omit excitement section |
| Companion names | No | Use "Companion 1, 2, 3" |

---

## Test Strategy

*Addresses: How do we verify privacy promises and quality in CI?*

### Test Categories

| Category | Purpose | Run When | Blocks Deploy? |
|----------|---------|----------|----------------|
| **Unit Tests** | Schema validation, scoring logic | Every commit | Yes |
| **Privacy Tests** | EXIF stripping, data isolation | Every commit | Yes |
| **Integration Tests** | API routes work end-to-end | Every PR | Yes |
| **LLM Evals** | Narrative quality, no hallucination | PR + nightly | Yes (if regression) |
| **Contract Tests** | Real API compatibility | Weekly + pre-deploy | Yes |
| **E2E Tests** | Full user flow | Daily | No (alert only) |

### Privacy Tests (Non-Negotiable)

These tests MUST pass. Failure = blocked deploy.

```typescript
// tests/privacy/exif-stripping.test.ts
describe('EXIF Stripping', () => {
  it('removes GPS data before cloud API call', async () => {
    const photoWithGPS = loadTestPhoto('with-gps.jpg');
    const apiPayload = await prepareForCloudAnalysis(photoWithGPS);

    expect(extractGPS(apiPayload.image)).toBeNull();
  });

  it('removes device info before cloud API call', async () => {
    const photo = loadTestPhoto('with-device-info.jpg');
    const apiPayload = await prepareForCloudAnalysis(photo);

    expect(extractDeviceInfo(apiPayload.image)).toBeNull();
  });

  it('preserves EXIF for local processing', async () => {
    const photo = loadTestPhoto('with-gps.jpg');
    const localResult = await processLocally(photo);

    expect(localResult.extractedLocation).toBeDefined();
  });
});

// tests/privacy/data-isolation.test.ts
describe('Data Isolation', () => {
  it('never sends raw photos in API response', async () => {
    const result = await synthesizeMoment(testInput);

    expect(result).not.toHaveProperty('rawPhotos');
    expect(JSON.stringify(result)).not.toContain('base64');
  });

  it('weather API receives coarse coordinates only', async () => {
    const spy = jest.spyOn(weatherApi, 'fetch');
    await synthesizeMoment(testInput);

    const [url] = spy.mock.calls[0];
    const coords = extractCoordsFromUrl(url);

    // Coordinates rounded to 0.1° (~11km)
    expect(coords.lat).toMatch(/^\d+\.\d$/);  // One decimal place
    expect(coords.lon).toMatch(/^\d+\.\d$/);
  });

  it('transcript deleted when moment discarded', async () => {
    const moment = await createMoment(testInput);
    await discardMoment(moment.id);

    const orphanTranscripts = await findOrphanTranscripts();
    expect(orphanTranscripts).toHaveLength(0);
  });
});
```

### LLM Evaluation Tests

```typescript
// tests/evals/narrative-quality.test.ts
describe('Narrative Quality', () => {
  const goldenDataset = loadGoldenDataset();

  it.each(goldenDataset)('$name: no hallucination', async (testCase) => {
    const result = await synthesizeMoment(testCase.input);
    const facts = extractFacts(result.narratives.short);

    for (const fact of facts) {
      const isGrounded = isFactInInput(fact, testCase.input);
      expect(isGrounded).toBe(true, `Hallucinated: "${fact}"`);
    }
  });

  it.each(goldenDataset)('$name: emotion matches input', async (testCase) => {
    const result = await synthesizeMoment(testCase.input);

    expect(result.primary_emotion).toBe(testCase.expected.emotion);
  });

  it('confidence calibration within 10%', async () => {
    const results = await Promise.all(
      goldenDataset.map(tc => synthesizeMoment(tc.input))
    );

    const calibration = calculateCalibration(results, goldenDataset);
    expect(calibration.error).toBeLessThan(0.10);
  });
});
```

### Local vs Cloud Narrative Quality Test

**Hypothesis to validate:** Local LLM narratives are insufficient for the core journaling use case.

**Why this matters:** The current architecture assumes cloud Claude produces meaningfully better narratives than on-device models. This assumption dates to v1.2 and has not been empirically validated. If local models are "good enough," we should flip to local-first (privacy win + cost reduction + offline capability).

**Test Design:**

1. **Create golden dataset** (20 representative inputs):
   - 5 high-emotion moments (transcendence ≥0.7)
   - 5 casual moments (transcendence 0.4-0.6)
   - 5 multi-companion moments
   - 5 minimal-input moments (photo + brief voice only)

2. **Generate narratives** with each model:
   - **Local A:** Llama 3.2 3B (quantized for mobile)
   - **Local B:** Apple Foundation Model (via CoreML)
   - **Cloud:** Claude 3.5 Sonnet

3. **Blind user evaluation** (n=30 users):
   - Present narrative pairs without model labels
   - Ask: "Which narrative better captures how you felt?"
   - Rate emotional resonance (1-5 scale)
   - Flag any factual errors

4. **Automated metrics:**
   - Factual accuracy (fact extraction + input matching)
   - Sentiment alignment (voice note → narrative)
   - Lexical diversity (vocabulary richness)
   - Narrative length consistency

**Pass criteria for local-first architecture:**

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| Local preferred | ≥40% of blind comparisons | Users don't strongly prefer cloud |
| Emotional resonance | Within 0.5 points of cloud (5pt scale) | Quality gap is acceptable |
| Factual accuracy | Equal or better than cloud | No accuracy sacrifice |
| Hallucination rate | ≤ cloud rate | Local shouldn't invent more |

**If local passes:**
- Flip to local-first architecture
- Cloud becomes opt-in "premium polish" only
- Update processing tiers: local_only becomes primary, not fallback
- Significant cost reduction (~$0.002/moment → ~$0)

**If local fails:**
- Document specific failure modes
- Identify which moment types need cloud
- Consider hybrid: local for casual, cloud for high-transcendence

```typescript
// tests/evals/local-vs-cloud.test.ts
describe('Local vs Cloud Quality', () => {
  const goldenDataset = loadGoldenDataset();

  it('local narrative factual accuracy >= cloud', async () => {
    for (const testCase of goldenDataset) {
      const localResult = await synthesizeLocal(testCase.input);
      const cloudResult = await synthesizeCloud(testCase.input);

      const localAccuracy = measureFactualAccuracy(localResult, testCase.input);
      const cloudAccuracy = measureFactualAccuracy(cloudResult, testCase.input);

      expect(localAccuracy).toBeGreaterThanOrEqual(cloudAccuracy * 0.95);
    }
  });

  it('local emotional resonance within threshold', async () => {
    // This requires human evaluation - run as manual test
    // See: scripts/run-blind-evaluation.ts
  });
});
```

### Coverage Targets

| Component | Line Coverage | Branch Coverage | Required |
|-----------|---------------|-----------------|----------|
| `lib/sensoryValidation.ts` | 100% | 100% | Yes |
| `lib/transcendenceScoring.ts` | 100% | 100% | Yes |
| `lib/photoAnalysis.ts` | 90% | 80% | Yes |
| `lib/audioProcessing.ts` | 90% | 80% | Yes |
| `app/api/synthesize-sense/` | 85% | 75% | Yes |
| Privacy utilities | 100% | 100% | Yes |

### CI Pipeline

```yaml
name: Sensory Agent CI

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:unit -- --coverage
      - run: npm run test:privacy  # Must pass

  llm-evals:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:evals
      - run: |
          if [ "$ACCURACY" -lt "95" ]; then
            echo "LLM accuracy dropped below 95%"
            exit 1
          fi

  integration:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:integration

  deploy-gate:
    needs: [unit-tests, llm-evals, integration]
    runs-on: ubuntu-latest
    steps:
      - run: echo "All tests passed, safe to deploy"
```

---

## Backend Data Model

*Addresses: What Supabase tables and RLS policies are needed?*

### Data Principles

1. **Minimal Storage**: Only store metadata and synthesized outputs — never raw photos/audio
2. **User Isolation**: Every query scoped to authenticated user via RLS
3. **Soft Delete**: Moments can be "deleted" but retained for GDPR export window
4. **Audit Trail**: Log all data access for privacy compliance

### Schema

```sql
-- Moments table (core)
CREATE TABLE moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Core data
  venue_name TEXT NOT NULL,
  venue_category TEXT, -- landmark, dining, nature, etc.
  captured_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,

  -- Synthesis outputs (never raw data)
  primary_emotion TEXT,
  emotion_confidence DECIMAL(3,2),
  transcendence_score DECIMAL(3,2),

  -- JSON fields for complex data
  atmosphere JSONB, -- {lighting, energy, setting, crowd_feel}
  emotion_tags TEXT[],
  narratives JSONB, -- {short, medium, full}
  memory_anchors JSONB, -- {sensory, emotional, unexpected, shareable, family}
  excitement JSONB, -- {fame_score, unique_claims, hook}
  environment JSONB, -- {weather, timing}

  -- Metadata
  processing_metadata JSONB, -- {local_percentage, cloud_calls, processing_time_ms}
  voice_transcript TEXT, -- Stored with moment (user's words)

  -- Lifecycle
  status TEXT DEFAULT 'active', -- active, deleted, exported
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Companions (per-moment)
CREATE TABLE moment_companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID REFERENCES moments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Companion data
  name TEXT NOT NULL,
  relationship TEXT, -- family, friend, partner, etc.

  -- Synthesis outputs
  moment_highlight TEXT,
  engagement_level TEXT, -- low, moderate, high, exceptional
  interests_matched TEXT[],
  needs_met TEXT[],
  concerns TEXT[],

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log (privacy compliance)
CREATE TABLE privacy_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  action TEXT NOT NULL, -- cloud_synthesis, venue_lookup, weather_fetch, data_export, data_delete
  moment_id UUID, -- NULL for account-level actions

  -- What was accessed (no content, just metadata)
  services_called TEXT[], -- ['claude_vision', 'wikipedia', 'openweather']
  coarse_location TEXT, -- '35.7, 139.8' (rounded)

  created_at TIMESTAMPTZ DEFAULT now()
);

-- User preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),

  -- Privacy settings
  cloud_synthesis_enabled BOOLEAN DEFAULT true,
  audit_log_retention_days INTEGER DEFAULT 30,

  -- Routine locations (for ambient detection suppression)
  routine_locations JSONB DEFAULT '[]', -- [{lat, lon, label}]

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Moments: users can only access their own
CREATE POLICY "Users can view own moments" ON moments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own moments" ON moments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own moments" ON moments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can soft-delete own moments" ON moments
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (status IN ('active', 'deleted'));

-- Companions: scoped through moment ownership
CREATE POLICY "Users can view own companions" ON moment_companions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companions" ON moment_companions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audit log: users can only view their own
CREATE POLICY "Users can view own audit log" ON privacy_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Audit log: only system can insert (via service role)
CREATE POLICY "System inserts audit log" ON privacy_audit_log
  FOR INSERT WITH CHECK (true); -- Controlled by service role key

-- Preferences: users manage their own
CREATE POLICY "Users manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);
```

### Data Retention & Deletion

```sql
-- GDPR deletion function
CREATE OR REPLACE FUNCTION delete_user_data(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Hard delete all user data
  DELETE FROM moment_companions WHERE user_id = target_user_id;
  DELETE FROM moments WHERE user_id = target_user_id;
  DELETE FROM privacy_audit_log WHERE user_id = target_user_id;
  DELETE FROM user_preferences WHERE user_id = target_user_id;

  -- Log the deletion (for compliance audit)
  INSERT INTO privacy_audit_log (user_id, action)
  VALUES (target_user_id, 'account_deleted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-cleanup old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM privacy_audit_log
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (via pg_cron or Edge Function)
-- SELECT cron.schedule('cleanup-audit-logs', '0 3 * * *', 'SELECT cleanup_old_audit_logs()');
```

### What's NOT Stored

| Data | Storage | Reason |
|------|---------|--------|
| Raw photos | Never | Privacy — kept on device only |
| Raw audio | Never | Privacy — kept on device only |
| Precise coordinates | Never | Privacy — only venue name or coarse location |
| EXIF metadata | Never | Privacy — extracted locally, not synced |
| Photo base64 | Never | Privacy — only synthesized outputs |

---

## Implementation Scoping

Detailed implementation phases, platform analysis, and phased rollout plan are documented separately:

**See:** [Sensory Agent Implementation Scoping](./sensory-agent-implementation-scoping.md)

---

*Document Version: 2.11*
*Last Updated: February 10, 2026*
*Author: Quinn Product Team*

**Changelog:**
- v2.11: **Transcript privacy — user's words never leave device.** Extended privacy posture to voice transcripts. Claude receives only extracted voice metadata (sentiment score, keywords, tone, theme) — NOT the verbatim transcript. User's exact words stay on-device. Updated all diagrams, tables, third-party disclosures, and security checklist. Updated sensoryPrompts.ts to use voiceAnalysis metadata instead of transcript text.
- v2.10: **Local vs Cloud Quality Test added.** Identified untested assumption that local LLMs produce inferior narratives. Added comprehensive test framework to validate whether local-first architecture is viable. If local models pass quality threshold (≥40% user preference, emotional resonance within 0.5pts), architecture flips to local-first with cloud as opt-in premium only. Updated Senso-ji example and fallback table to mark quality thresholds as TBD pending validation.
- v2.9: **Privacy hardening — removed Claude Vision entirely.** Photos NEVER leave the device. All photo analysis via CoreML/Vision frameworks on-device. Claude receives only extracted metadata, not raw photos or audio. Updated all sections: architecture diagram, processing timeline, component table, cloud services list, fallback tiers, third-party disclosure, and security checklist.
- v2.8: Pre-implementation gap closure per multi-agent validation. Added: LLM Evaluation Framework (factual grounding, hallucination prevention, calibration metrics, golden dataset), Fallback Behavior (4-tier graceful degradation, retry strategy, UI for degraded states), Test Strategy (privacy tests, LLM evals, coverage targets, CI pipeline), Backend Data Model (Supabase schema, RLS policies, GDPR deletion, audit logging).
- v2.7: Security audit validation — added Security & Privacy Requirements section per quinn-security-auditor. Includes: EXIF stripping before cloud calls, transcript retention policy, coarse coordinates for Weather API, GDPR/CCPA deletion flow, audit trail for v2+, third-party SDK disclosure.
- v2.6: Local-first photo analysis — photos never leave device for basic analysis (face count, scene type, lighting, emotion via CoreML/Vision). Cloud synthesis is opt-in for premium users only. Updated target from 40% to 60-70% local processing. Added UI mockups for local vs premium flow.
- v2.5: Addressed v2.4 review feedback — marked 40% local as aspirational, added transcendence weight disclaimer, clarified scent/tactile are AI-inferred, added pricing model section, added passive conversation exploration for v3, extracted implementation scoping to separate doc
- v2.4: Removed meta "Honest Assessment" section; wove clarity into executive summary and implementation phases naturally. v1 scope and cloud usage now clear without self-critique framing.
- v2.3: Spec critique reconciliation — cloud transparency, audio elevated to first-class input, companion sensing surfaced as differentiator, travel beachhead rationale documented
- v2.2: Added product scoping analysis, content type decision matrix, phased implementation path (web-first vs iOS-first)
- v2.1: Added complete end-to-end Sensory Engine architecture with 7-layer diagram, processing timeline, and full Senso-ji example
- v2.0: Complete rewrite with ambient journaling as baseline vision, human confirmation as core principle
- v1.2: Added Local LLM vs Cloud Claude strategy
- v1.1: Added venue-specific data enrichment, cloud/local architecture
- v1.0: Initial user story (manual input focus)
