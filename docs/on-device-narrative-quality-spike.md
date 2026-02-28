# On-Device Narrative Quality Spike — Rubric & Protocol

**Purpose:** Define what "85% of Claude quality" means, provide a scoring rubric, and gate the Phase 2 architecture decision on measurable results.
**Timeline:** Week 1-2 (before Phase 1 build begins — per James's pre-build review)
**Risk:** If on-device narrative quality < 85% of Claude, average user conversion drops from 7.8 to 3.2. This is a cliff, not a slope.
**Prerequisite:** Existing `quality-evaluation-rubric.md` covers absolute narrative quality (4.0/5 gate). This document extends it with a **comparative** protocol for on-device vs. cloud.

---

## Why This Spike Exists

The v4.4 user stories commit to on-device narrative generation as the primary path, with SE API (Claude) as fallback. James flagged two problems:

1. The spike was scheduled for Week 4 with only 2 days — too late, too short
2. "85% of Claude quality" had no definition

This document fixes both. It also addresses a third concern: the spike must evaluate **device feasibility** (latency, memory, hardware floor) alongside quality. A narrative that scores 4.5/5 but takes 45 seconds to generate is not viable.

---

## Candidate Models

The spike evaluates **three** on-device candidates against the Claude baseline:

| Candidate | Runtime | Min Hardware | Context Window | Notes |
|-----------|---------|-------------|----------------|-------|
| **Claude (SE API)** | Cloud | Any iPhone | N/A | Baseline. Already integrated via `/api/synthesize-memory`. |
| **Llama 3.2 3B** | MLX Swift | A14+ (4GB+ RAM) | 128K tokens | Open weights. Requires bundling ~2GB model. |
| **Apple Intelligence** | Apple Foundation Models | A17 Pro+ (iPhone 15 Pro+) | TBD | Native iOS integration. Smaller device floor. No model bundling. Availability depends on iOS 18.x APIs. |
| **Template fallback** | On-device (no LLM) | Any iPhone | N/A | `generateFallbackNarrative()` in `sensoryPrompts.ts`. Already built. Zero latency. |

### Why Test All Three

- **Llama via MLX** is the v4.4 stated path but has unknowns: model size (~2GB download), inference speed, and memory pressure on non-Pro devices.
- **Apple Intelligence** may offer better device integration and smaller footprint but has a narrower hardware floor (A17 Pro+) and less control over prompt behavior.
- **Template fallback** already exists and ships with zero risk. Knowing its score establishes the quality floor — the minimum any on-device path must beat.

If Apple Intelligence isn't available for evaluation (API access, NDA restrictions), document why and proceed with Llama + template only.

---

## What "85% of Claude Quality" Means

We reuse the 5 dimensions from `quality-evaluation-rubric.md` but add a **comparative scoring protocol**:

### The Comparison

For each test case, generate **three or four narratives** from identical inputs:
- **Narrative A:** Claude (via SE API `synthesize-sense` endpoint)
- **Narrative B:** Llama 3.2 3B (on-device via MLX Swift)
- **Narrative C:** Apple Intelligence (if available)
- **Narrative D:** Template fallback (`generateFallbackNarrative()`)

All narratives are scored independently on the same 1-5 scale. The "85% threshold" is defined as:

```
On-device score ÷ Claude score ≥ 0.85 (per dimension average)
```

### Per-Dimension Thresholds

| Dimension | Weight | Minimum Ratio | Rationale |
|-----------|--------|---------------|-----------|
| **Evocativeness** | 30% | ≥ 0.85 | Core product magic — if narratives feel flat, Quinn is broken |
| **Specificity** | 25% | ≥ 0.80 | On-device may miss subtle detail; acceptable if compensated elsewhere |
| **Emotional Accuracy** | 20% | ≥ 0.90 | Tone mismatch is worse than missing detail — must be high |
| **Coherence** | 15% | ≥ 0.85 | Smaller models tend to lose arc on longer narratives |
| **Persona Resonance** | 10% | ≥ 0.75 | Hardest for small models; acceptable to be weaker here |

### Composite Score

```
Composite = (Evocativeness × 0.30) + (Specificity × 0.25) + (Emotional Accuracy × 0.20)
          + (Coherence × 0.15) + (Persona Resonance × 0.10)

Pass: Composite ratio ≥ 0.85
```

### What 85% Looks Like in Practice

**Claude (5/5 evocativeness):**
> "Morning light filtered through the bamboo grove, casting tiger-stripe shadows across the path. We walked slowly, breathing in wet earth and silence — three strangers in a forest that felt like a cathedral. The kind of peace you stop looking for and it finds you."

**On-device at 85% (4.25/5 — PASS):**
> "The bamboo grove was quiet in the morning light, shadows falling across the path in long stripes. Walking slowly, the air cool and earthy. A kind of peace you don't plan for — it finds you."

**On-device at 60% (3/5 — FAIL):**
> "We visited the bamboo grove in the morning. It was peaceful and the light was nice. A good experience."

**Template fallback (~2.5/5 — floor):**
> "Morning at Arashiyama Bamboo Grove. Golden light and a sense of peace. The kind of morning where time slows down. A memory to carry forward."

The 85% version shows specific sensory detail and has emotional resonance, even if the prose is simpler. The 60% version is generic. The template is functional but mechanical — no surprise, no voice.

---

## Device Feasibility Requirements

Quality alone is not enough. The on-device candidate must also meet these hardware constraints:

| Metric | Target | Unacceptable | How to Measure |
|--------|--------|-------------|----------------|
| **Medium narrative latency** | < 5 seconds | > 10 seconds | Time from SynthesisInput → medium narrative string |
| **Full narrative latency** | < 12 seconds | > 20 seconds | Time from SynthesisInput → full narrative string |
| **Peak memory** | < 3 GB | > 4 GB (OOM on 6GB devices) | Xcode memory debugger during generation |
| **Model download size** | < 2 GB | > 3 GB | Compressed model bundle size |
| **Battery impact** | < 5% per narrative | > 10% per narrative | Battery level delta across 10 generations |
| **Minimum device** | iPhone 14 (A15, 6GB) | iPhone 12 or earlier | Test on lowest-supported hardware |

### Device Test Matrix

| Device | Chip | RAM | Must Pass | Nice to Have |
|--------|------|-----|-----------|-------------|
| iPhone 14 | A15 | 6 GB | Latency + memory targets | — |
| iPhone 15 | A16 | 6 GB | Latency + memory targets | — |
| iPhone 15 Pro | A17 Pro | 8 GB | Latency + memory + Apple Intelligence | Both candidates |
| iPhone 16 Pro | A18 Pro | 8 GB | All targets | Best-case benchmark |

If Llama 3.2 3B fails memory targets on 6GB devices, the options are:
1. Restrict to Pro devices (A17 Pro+, 8GB) — reduces addressable market
2. Use a smaller quantization (Q4 vs Q8) — re-test quality at lower precision
3. Fall back to template engine on non-Pro, Llama on Pro — tiered by hardware

---

## Anti-Cliche Compliance

Both Claude and on-device outputs are checked against the banned phrase list from `sensoryPrompts.ts`. Any narrative containing these phrases scores 0 on Evocativeness regardless of other qualities:

**Banned phrases:**
- "hidden gem", "off the beaten path", "breathtaking", "unforgettable"
- "bucket list", "once in a lifetime", "picture perfect", "magical"
- "stunning", "incredible journey", "amazing experience"
- "a feast for the senses", "picture-postcard", "truly special"

**Show-don't-tell check:**
- Every narrative must contain ≥ 1 concrete sensory detail (a sound, a light quality, a texture, a smell)
- Adjectives like "beautiful", "nice", "wonderful" without supporting detail = Evocativeness capped at 3

---

## Test Cases (20 Scenarios)

Generate narratives from all candidates for each. Inputs come from real persona moments in the user stories.

### Sarah Scenarios (4 cases)
| # | Venue | Companions | Voice Sentiment | Key Challenge |
|---|-------|------------|-----------------|---------------|
| S1 | Park playground, Sunday morning | Baby (6mo), husband | 0.75 (warm, grateful) | Family warmth without sentimentality |
| S2 | Pediatrician waiting room | Baby | 0.35 (anxious, tired) | Negative emotion handled gracefully |
| S3 | Beach at sunset, first vacation | Baby, husband | 0.90 (euphoric) | High emotion without cliche |
| S4 | Home kitchen, Tuesday evening | Baby | 0.55 (content, routine) | Ordinary moment made meaningful |

### Marco Scenarios (4 cases)
| # | Venue | Companions | Voice Sentiment | Key Challenge |
|---|-------|------------|-----------------|---------------|
| M1 | Fushimi Inari Shrine, early morning | Solo | 0.80 (awed) | Famous landmark, avoid tour-guide voice |
| M2 | Hidden ramen shop, Shinjuku | Solo | 0.70 (satisfied) | Dining venue, sensory richness |
| M3 | Bamboo grove, golden hour | Solo | 0.65 (peaceful) | Nature + light, show-don't-tell |
| M4 | Shibuya Crossing, night | Solo | 0.85 (excited) | Urban energy, crowd dynamics |

### Linda Scenarios (4 cases)
| # | Venue | Companions | Voice Sentiment | Key Challenge |
|---|-------|------------|-----------------|---------------|
| L1 | Mom's kitchen, Sunday | Mom (82, Alzheimer's) | 0.60 (nostalgic, tender) | Caregiver emotion, highest PMF signal |
| L2 | Old neighborhood bakery | Mom | 0.50 (bittersweet) | Memory preservation, mixed emotions |
| L3 | Mom's garden, afternoon | Mom | 0.70 (grateful) | Simple moment, deep meaning |
| L4 | Family dinner, holiday | Mom, siblings | 0.45 (wistful) | Group dynamics, underlying sadness |

### Mixed/Edge Scenarios (8 cases)
| # | Venue | Companions | Voice Sentiment | Key Challenge |
|---|-------|------------|-----------------|---------------|
| E1 | Airport terminal | Solo | 0.20 (neutral/tired) | Low-emotion input, still meaningful |
| E2 | Hotel room, late night | Partner | 0.40 (reflective) | Private moment, restraint needed |
| E3 | Tourist trap, midday | Family (4) | 0.30 (underwhelmed) | Honest about a bad experience |
| E4 | Unknown park (no venue data) | Solo | 0.60 (curious) | Missing venue context |
| E5 | Concert venue, loud | Friends (3) | 0.95 (euphoric) | Maximum energy, avoid generic excitement |
| E6 | Cemetery, morning | Solo | -0.20 (somber) | Grief/remembrance, tone sensitivity |
| E7 | No photos, voice only | Solo | 0.55 (contemplative) | Audio-only input, sparse metadata |
| E8 | 8 photos, no voice | Partner, child | null (no voice) | Photo-rich but no sentiment signal |

### Example SynthesisInput Fixture (L1: Mom's Kitchen)

```json
{
  "photoAnalysis": {
    "scene": "kitchen interior",
    "lighting": "warm_artificial",
    "indoorOutdoor": "indoor",
    "faceCount": 2,
    "crowdLevel": "sparse",
    "energyLevel": "calm",
    "emotions": ["contentment", "tenderness"]
  },
  "voiceAnalysis": {
    "sentimentScore": 0.60,
    "detectedTone": "nostalgic",
    "keywords": ["mom", "recipe", "remember", "always"],
    "theme": "nostalgia",
    "durationSeconds": 45
  },
  "venue": {
    "name": "Home — Mom's Kitchen",
    "category": "residence",
    "description": null,
    "foundedYear": null,
    "historicalSignificance": null,
    "uniqueClaims": [],
    "fameScore": null
  },
  "weather": null,
  "companions": [
    {
      "relationship": "mother",
      "nickname": "Mom",
      "age_group": "senior"
    }
  ],
  "context": {
    "localTime": "2026-03-15T11:30:00-05:00",
    "isGoldenHour": false,
    "isWeekend": true,
    "durationMinutes": 90,
    "tripIntent": null
  }
}
```

All 20 fixtures must follow this structure. Use the `SynthesisInput` interface from `sensoryPrompts.ts` as the contract.

---

## Evaluation Protocol

### Phase 1: Generate Candidates (Day 1-3)

1. **Day 1:** Build MLX Swift prototype with Llama 3.2 3B. Confirm model loads, generates text, meets memory targets on iPhone 14.
2. **Day 2:** Create 20 `SynthesisInput` JSON fixtures matching the test cases above. Generate Claude narratives via SE API. Generate template fallback narratives via `generateFallbackNarrative()`.
3. **Day 3:** Generate Llama narratives for all 20 inputs. Iterate prompt if first-pass quality is obviously poor. If Apple Intelligence is available, generate those too.
4. **Day 3:** Record device metrics: latency per narrative (short/medium/full), peak memory, battery delta.

### Phase 2: Blind Scoring (Day 4)

**Two evaluators score independently.**

For each test case:
1. Read the input context (venue, companions, sentiment score, photo metadata)
2. Score each candidate narrative on 5 dimensions (1-5 each). Narratives are labeled A/B/C/D in randomized order — evaluator does not know which is Claude.
3. Rank all candidates: "Which feels most like Quinn?" (forced rank, not forced choice)
4. Flag any banned phrases or show-don't-tell violations

**Time budget:** ~4 min per case × 20 cases = 80 min per evaluator

### Phase 3: Unblind & Decide (Day 5)

1. Reveal candidate identities
2. Calculate per-dimension ratios (on-device ÷ Claude)
3. Calculate weighted composite score
4. Run persona-specific breakdown: do Linda scenarios pass? Marco? Edge cases?
5. Analyze "feels like Quinn" ranking distribution
6. Cross-check: device feasibility results (latency, memory)
7. **Reconciliation rule** (see below)
8. Make decision gate call

### Reconciliation: When Scores and Preference Disagree

| Scenario | Resolution |
|----------|------------|
| Composite ≥ 0.85 AND ranked #1 or #2 in ≥ 14/20 cases | **PASS** — clear |
| Composite ≥ 0.85 BUT ranked #1 or #2 in < 10/20 cases | **CONDITIONAL** — scores pass but something intangible is off. Investigate which scenarios drag preference down. Likely fixable with prompt tuning. |
| Composite < 0.85 BUT ranked #1 or #2 in ≥ 14/20 cases | **Re-score** — dimension scoring may be too strict. Recalibrate with co-evaluator on the 5 cases with largest score/preference gap. |
| Composite < 0.85 AND ranked #1 or #2 in < 10/20 cases | **FAIL or ADJUST** — per gate below |

---

## Decision Gate

### PASS (composite ratio ≥ 0.85, device feasibility met)

On-device is the primary path. SE API becomes quality-gate fallback only.

**Actions:**
- Proceed with MLX Swift integration in Phase 2
- SE API called only when on-device narrative scores < 3.5/5 (auto-detected via heuristic: check for banned phrases, minimum word count, sentiment coherence)
- Document the prompt that achieved 85%+ as the canonical on-device prompt
- Save it to `lib/onDevicePrompt.swift` in the Quinn repo

### CONDITIONAL PASS (composite 0.75-0.84)

On-device is viable but needs prompt engineering work.

**Actions:**
- Allocate 3 additional days for prompt optimization
- Re-run the bottom 5 scoring scenarios after optimization
- If re-run hits 0.85+, proceed as PASS
- If still < 0.85, escalate to ADJUST

### ADJUST (composite 0.65-0.74, OR device feasibility partially fails)

On-device works for some scenarios but not all.

**Actions:**
- Identify which persona scenarios fail (likely Linda's emotional depth or Marco's literary quality)
- Implement **tiered strategy**:
  - On-device for transcendence_score < 0.6 (routine moments)
  - SE API for transcendence_score ≥ 0.6 (high-emotion, high-stakes moments)
- If device feasibility fails on 6GB iPhones: on-device for Pro devices (8GB), template + cloud for non-Pro
- Re-estimate Phase 2 timeline (add ~1 week for tiered pipeline)
- Document the transcendence threshold and hardware tier in user stories

### FAIL (composite < 0.65, OR device feasibility fully fails)

On-device narrative quality is not viable for V4.

**Actions:**
- SE API becomes primary path for narrative generation
- **Privacy implications are bounded:** per `SENSORY_SYSTEM_PROMPT`, Claude receives ONLY extracted metadata — never photos, audio files, or transcript text. Specifically:
  - Sent to Claude: scene type, lighting, face count, crowd level, energy level, sentiment score, detected tone, keywords (not verbatim), venue name/category, weather, companion relationships
  - Never sent: raw photos, audio files, voice transcript, GPS coordinates, user identity
- Update user stories v4.5 to reflect hybrid architecture: local-first for storage/capture, cloud-assisted for narrative generation only
- Re-evaluate Apple Intelligence when iOS 18.x foundation model APIs become available
- Ship Phase 1 (travel discovery) on schedule — narrative generation isn't needed until Phase 2

---

## Phase 1 Build Dependency: Itinerary Parsing

This spike tests **narrative generation** quality. US-101 also requires on-device **itinerary parsing** (V4 local-first constraint). These are separate concerns:

- **Phase 1 (Weeks 1-4):** Itinerary parsing uses the **Travel API** (`/api/parse-itinerary`), which is deployed and production-ready. No on-device parsing needed for Phase 1 launch.
- **Phase 2 (Weeks 5-10):** On-device itinerary parsing becomes a goal. If the narrative spike shows Llama 3.2 3B handles structured extraction well, parsing is likely viable. If narrative quality fails, parsing likely fails too — same model, simpler task.

**Bottom line:** This spike's outcome informs the parsing decision, but Phase 1 is not blocked.

---

## Narrative Structure Requirements

All candidates must target these output formats from `sensoryPrompts.ts`:

### Short (15-25 words)
Single evocative line. Not a summary — a sensory or emotional hook.
```
✓ "Morning light through bamboo. The path empty. Your breath the only sound."
✗ "We visited the bamboo grove in the morning and it was peaceful."
```

### Medium (50-80 words, 2-3 sentences)
Structure: HOOK (sensory opener) → MOMENT (what happened) → EMOTION (how it felt)
Must work standalone without seeing the photo.
```
✓ "The incense hit before the gate came into view — sandalwood and
   something older, like stone holding centuries of smoke. Mom stopped
   on the threshold, one hand on the wood. Thirty years since she'd
   been here. Neither of us spoke."

✗ "We visited the temple. It was very beautiful and historic. Mom
   really enjoyed seeing it again after so many years."
```

### Full (150-200 words for Claude; 120-160 words acceptable for on-device)
Structure: SETTING → BUILD → PEAK → REFLECTION
Match tone to primary emotion. Weave companions naturally.

On-device models may produce shorter full narratives. This is acceptable if the arc is intact — a tight 130-word narrative with clear structure scores higher than a rambling 200-word narrative that loses coherence.

---

## Prompt Engineering Notes for On-Device

### Llama 3.2 3B via MLX Swift

| Capability | Claude | Llama 3.2 3B | Mitigation |
|-----------|--------|--------------|------------|
| Emotional nuance | Excellent | Moderate | Explicit emotion instruction + few-shot examples |
| Long-form coherence | Excellent | Moderate | Target 120-160 words for full narrative (vs 150-200) |
| Cliche avoidance | Good (with instruction) | Weaker | Explicit banned phrase list + negative examples in prompt |
| JSON output | Reliable | Sometimes breaks | Validate + retry with simplified schema; or generate prose only and parse separately |
| Persona voice matching | Good | Moderate | Include 1-2 exemplar narratives per emotion type in prompt |
| Sensory detail | Good | Moderate | Explicit "include one sound, one light quality, one texture" instruction |

### Recommended Prompt Strategy

1. **Compact system prompt** — Keep under 500 tokens. Include: voice guidelines, banned phrases, output structure. Drop the full inference guidelines that Claude's prompt has.
2. **Few-shot examples** — Include 2 high-scoring Claude narratives as gold-standard examples. Pick one awe/discovery and one warmth/family.
3. **Explicit structure markers** — "Write exactly 3 sentences: (1) sensory hook, (2) what happened, (3) how it felt"
4. **Banned phrase list directly in prompt** — Small models need the explicit "do NOT write" list every time.
5. **Consider prose-only output** — Generate narrative text, not JSON. Parse emotion/anchors from the text with a lightweight heuristic. This avoids JSON formatting failures.
6. **Temperature** — Test at 0.7 (default) and 0.9 (more creative). Small models often need higher temperature to avoid repetition.

### Apple Intelligence (if available)

- Use the on-device foundation model APIs (iOS 18.x)
- Prompt strategy may differ — Apple's models may respond better to system instructions than few-shot
- Key advantage: no model download, native memory management, built-in safety filters
- Key risk: less control over output format and behavior

---

## Relationship to Existing Rubric

| Document | Purpose | When |
|----------|---------|------|
| `quality-evaluation-rubric.md` | Absolute quality gate for SE narratives (4.0/5) | Week 2 of SE development (already complete) |
| **This document** | Comparative gate for on-device vs. Claude (85% ratio) | Week 1-2 before iOS build (this spike) |

Both use the same 5 dimensions. This document adds:
- Comparative (A/B/C/D) scoring protocol with blind evaluation
- Weighted composite with per-dimension thresholds
- Device feasibility requirements (latency, memory, hardware floor)
- Persona-specific test cases from iOS user stories with fixture template
- Decision gate with 4 outcomes (PASS / CONDITIONAL / ADJUST / FAIL)
- Score/preference reconciliation protocol
- Privacy implications for each outcome
- Phase 1 dependency clarification
- On-device prompt engineering guidance for multiple model candidates

---

## Schedule

| Day | Task | Time | Owner |
|-----|------|------|-------|
| **Day 1** | Build MLX Swift prototype with Llama 3.2 3B. Confirm model loads on iPhone 14. Measure baseline latency + memory. | 4h | iOS eng |
| **Day 1** | Investigate Apple Intelligence foundation model API availability. Document if usable or blocked. | 1h | iOS eng |
| **Day 2** | Create 20 `SynthesisInput` JSON fixtures (use template above) | 2h | iOS eng |
| **Day 2** | Generate Claude narratives via SE API for all 20 inputs | 1h | iOS eng |
| **Day 2** | Generate template fallback narratives via `generateFallbackNarrative()` for all 20 inputs | 30m | iOS eng |
| **Day 3** | Generate Llama narratives for all 20 inputs. Iterate prompt 2-3 times. | 4h | iOS eng |
| **Day 3** | Record device metrics: latency, peak memory, battery delta per narrative | 1h | iOS eng |
| **Day 3** | Prepare blind evaluation sheets (randomize candidate order per case) | 1h | Product |
| **Day 4** | Blind scoring — 2 evaluators, independently | 1.5h | Both evaluators |
| **Day 5** | Unblind, calculate composites, reconcile scores vs. preference, decision gate meeting | 2h | Team |

**Total:** ~18 hours across 5 days (1 working week)

---

## Success Criteria

- [ ] MLX Swift prototype runs on iPhone 14 (A15, 6GB) — model loads, generates text
- [ ] Device metrics recorded: latency, peak memory, battery impact
- [ ] 20 test cases generated with Claude, Llama, and template narratives (+ Apple Intelligence if available)
- [ ] Example SynthesisInput fixture validates against `SynthesisInput` interface
- [ ] Blind evaluation completed by 2 evaluators
- [ ] Inter-rater agreement > 0.7 (Cohen's kappa)
- [ ] Per-dimension ratios calculated for each on-device candidate
- [ ] Composite ratio calculated with weighted formula
- [ ] "Feels like Quinn" ranking analyzed and reconciled with scores
- [ ] Decision gate outcome documented (PASS / CONDITIONAL / ADJUST / FAIL)
- [ ] If PASS: canonical on-device prompt saved to repo
- [ ] If not PASS: revised architecture documented with timeline impact and privacy implications
- [ ] Phase 1 build confirmed unblocked regardless of outcome

---

*Created: 2026-02-27*
*Revised: 2026-02-27 — added device feasibility, template baseline, Apple Intelligence evaluation, SynthesisInput fixture, score/preference reconciliation, privacy implications, Phase 1 dependency note*
*Addresses: James's feedback item #1 (pull spike to Week 1-2 and define the 85% rubric)*
*Depends on: `quality-evaluation-rubric.md` (5-dimension scoring scale), `sensoryPrompts.ts` (narrative structure + template fallback), SE API (deployed at travel-omega-hazel.vercel.app)*
