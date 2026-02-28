# On-Device Narrative Quality Spike — Rubric & Protocol

**Purpose:** Define what "85% of Claude quality" means, provide a scoring rubric, and gate the Phase 2 architecture decision on measurable results.
**Timeline:** Week 1-2 (before Phase 1 build begins — per James's pre-build review)
**Risk:** If on-device narrative quality < 85% of Claude, average user conversion drops from 7.8 to 3.2. This is the single highest-risk decision in the iOS build.
**Prerequisite:** Existing `quality-evaluation-rubric.md` covers absolute narrative quality (4.0/5 gate). This document extends it with a **comparative** protocol for on-device vs. cloud.

---

## Why This Spike Exists

The v4.4 user stories commit to on-device narrative generation (Llama 3.2 3B via MLX) as the primary path, with SE API (Claude) as fallback. James flagged two problems:

1. The spike was scheduled for Week 4 with only 2 days — too late, too short
2. "85% of Claude quality" had no definition

This document fixes both.

---

## What "85% of Claude Quality" Means

We reuse the 5 dimensions from `quality-evaluation-rubric.md` but add a **comparative scoring protocol**:

### The Comparison

For each test case, generate **two narratives** from identical inputs:
- **Narrative A:** Claude (via SE API `synthesize-sense` endpoint)
- **Narrative B:** Llama 3.2 3B (on-device via MLX Swift)

Both narratives are scored independently on the same 1-5 scale. The "85% threshold" is defined as:

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

The difference: the 85% version shows specific sensory detail and has emotional resonance, even if the prose is simpler. The 60% version is generic and could describe any grove anywhere.

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

Generate both Claude and on-device narratives for each. Inputs come from real persona moments in the user stories.

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

---

## Evaluation Protocol

### Phase 1: Generate Pairs (Day 1-2)

1. Build 20 `SynthesisInput` objects matching the test cases above
2. For each input, call:
   - SE API (`/api/synthesize-memory`) → Claude narrative
   - MLX Swift prototype → Llama 3.2 3B narrative
3. Strip all metadata — evaluator sees only the narrative text and the input context
4. Randomize A/B order per case (evaluator doesn't know which is Claude)

### Phase 2: Blind Scoring (Day 3-4)

**Two evaluators score independently.**

Per narrative:
1. Read input context (venue, companions, sentiment, photos)
2. Read Narrative A — score 5 dimensions (1-5 each)
3. Read Narrative B — score 5 dimensions (1-5 each)
4. Record which narrative "feels more like Quinn" (forced choice)
5. Flag any banned phrases or show-don't-tell violations

**Time budget:** ~3 min per pair × 20 pairs = 60 min per evaluator

### Phase 3: Unblind & Analyze (Day 5)

1. Reveal which was Claude vs. on-device
2. Calculate per-dimension ratios
3. Calculate composite score
4. Run persona-specific analysis (do Linda scenarios pass? Marco?)
5. Check "feels more like Quinn" preference distribution

---

## Decision Gate

### PASS (composite ratio ≥ 0.85)

On-device is the primary path. SE API becomes quality-gate fallback only.

**Actions:**
- Proceed with MLX Swift integration in Phase 2
- SE API called only when on-device narrative scores < 3.5/5 (auto-detected via simple heuristic)
- Document the prompt that achieved 85%+ as the canonical on-device prompt

### CONDITIONAL PASS (composite 0.75-0.84)

On-device is viable but needs prompt engineering.

**Actions:**
- Allocate 3 additional days for prompt optimization
- Re-run bottom 5 scenarios after optimization
- If re-run hits 0.85+, proceed as PASS
- If still < 0.85, escalate to ADJUST

### ADJUST (composite 0.65-0.74)

On-device works for some scenarios but not all.

**Actions:**
- Identify which persona scenarios fail (likely Linda's emotional depth or Marco's literary quality)
- Implement tiered strategy: on-device for simple moments, SE API for high-transcendence moments
- Define the transcendence score threshold that triggers cloud fallback
- Re-estimate Phase 2 timeline (add ~1 week for tiered pipeline)

### FAIL (composite < 0.65)

On-device narrative quality is not viable for V4.

**Actions:**
- SE API becomes primary path (reverses V4 local-first constraint for narratives only)
- Document privacy implications: narrative metadata (not transcript/photos) sent to Claude
- Update user stories v4.5 to reflect hybrid architecture
- Re-evaluate if Apple Intelligence APIs (iOS 18.x) improve the calculus
- Ship Phase 1 (travel discovery) while architecture decision is revised

---

## Narrative Structure Requirements

Both Claude and on-device must target these output formats from `sensoryPrompts.ts`:

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

### Full (150-200 words)
Structure: SETTING → BUILD → PEAK → REFLECTION
Match tone to primary emotion. Weave companions naturally.

---

## Prompt Engineering Notes for On-Device

Llama 3.2 3B has known limitations vs. Claude:

| Capability | Claude | Llama 3.2 3B | Mitigation |
|-----------|--------|--------------|------------|
| Emotional nuance | Excellent | Moderate | Explicit emotion instruction in prompt |
| Long-form coherence | Excellent | Moderate | Shorter full narratives (120-150 words vs 150-200) |
| Cliche avoidance | Good (with instruction) | Weaker | Stronger negative examples in prompt |
| JSON output | Reliable | Sometimes breaks | Validate + retry with simplified schema |
| Persona voice matching | Good | Moderate | Include 1-2 exemplar narratives per persona in prompt |
| Sensory detail | Good | Moderate | Explicit "include one sound, one light quality" instruction |

### Recommended Prompt Strategy for On-Device

1. **Shorter system prompt** — Llama 3.2 3B has 4K context; trim to essentials
2. **Few-shot examples** — Include 2 high-scoring narratives as examples (from Claude output)
3. **Explicit structure** — "Write exactly 3 sentences: sensory hook, what happened, how it felt"
4. **Banned phrase list in prompt** — Small models need explicit "do NOT write" lists
5. **Simplified JSON** — Generate `short` and `medium` only; derive `full` from chaining

---

## Relationship to Existing Rubric

| Document | Purpose | When |
|----------|---------|------|
| `quality-evaluation-rubric.md` | Absolute quality gate for SE narratives (4.0/5) | Week 2 of SE development (already complete) |
| **This document** | Comparative gate for on-device vs. Claude (85% ratio) | Week 1-2 before iOS build (this spike) |

Both use the same 5 dimensions. This document adds:
- Comparative (A/B) scoring protocol
- Weighted composite with per-dimension thresholds
- Persona-specific test cases from iOS user stories
- Decision gate with 4 outcomes (PASS / CONDITIONAL / ADJUST / FAIL)
- On-device prompt engineering guidance

---

## Schedule

| Day | Task | Time | Owner |
|-----|------|------|-------|
| **Day 1** | Build MLX Swift prototype with Llama 3.2 3B | 4h | iOS eng |
| **Day 2** | Create 20 SynthesisInput test fixtures | 2h | iOS eng |
| **Day 2** | Generate Claude narratives via SE API | 1h | iOS eng |
| **Day 3** | Generate on-device narratives, iterate prompt | 4h | iOS eng |
| **Day 3** | Prepare blind evaluation sheets | 1h | Product |
| **Day 4** | Blind scoring — 2 evaluators | 1.5h | Both evaluators |
| **Day 5** | Unblind, analyze, decision gate meeting | 2h | Team |

**Total:** ~15.5 hours across 5 days (1 working week)

---

## Success Criteria

- [ ] 20 test cases generated with both Claude and on-device narratives
- [ ] Blind evaluation completed by 2 evaluators
- [ ] Inter-rater agreement > 0.7 (Cohen's kappa)
- [ ] Per-dimension ratios calculated
- [ ] Composite ratio calculated
- [ ] Decision gate outcome documented (PASS / CONDITIONAL / ADJUST / FAIL)
- [ ] If PASS: canonical on-device prompt saved to repo
- [ ] If not PASS: revised architecture documented with timeline impact

---

*Created: 2026-02-27*
*Addresses: James's feedback items #1 (pull spike to Week 1-2) and #1a (define 85% rubric)*
*Depends on: `quality-evaluation-rubric.md` (5-dimension scoring scale), `sensoryPrompts.ts` (narrative structure)*
