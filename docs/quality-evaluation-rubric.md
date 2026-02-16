# Sensory Engine MVP - Quality Evaluation Rubric

**Purpose:** Ensure narrative quality meets 4.0+ average before MVP launch
**Timeline:** Week 2 evaluation (50 narratives, 2 evaluators, 3 days)
**Gate:** If <4.0 average, iterate synthesis prompt and re-evaluate
**Impact:** Conversion 6.4/10 if pass, 3.2/10 if fail

---

## Overview

This rubric measures narrative quality across 5 dimensions using a 1-5 point scale. All dimensions are required for MVP. **Universal minimum: 4.0/5 average across all narratives.**

### Why These 5 Dimensions?

- **Evocativeness** → Captures emotional essence (top user priority from persona research)
- **Specificity** → References actual input details (prevents generic/template output)
- **Emotional Accuracy** → Matches user's sentiment (tone personalization validation)
- **Coherence** → Logical narrative arc (storytelling quality)
- **Persona Resonance** → Personal & meaningful (self-learning system target)

---

## Scoring Scale (1-5 per Dimension)

### 1 = Poor
- Fails to meet the dimension's core requirement
- Generic, template-like, or nonsensical
- No connection to input data or user sentiment
- Would not use this output

### 2 = Below Average
- Partially addresses the dimension
- Some connection to input or sentiment, but weak
- Noticeable gaps or awkwardness
- Would likely edit significantly

### 3 = Adequate
- Meets the basic requirement
- Clear connection to input/sentiment
- Serviceable but not compelling
- Might edit for polish

### 4 = Good
- Clearly meets the dimension well
- Strong connection to input/sentiment
- No major issues
- Would accept as-is or minor tweaks only

### 5 = Excellent
- Exceeds expectations
- Exceptional connection to input/sentiment
- Compelling and well-crafted
- Would share/show others

---

## Dimension Details & Rubrics

### 1. EVOCATIVENESS
**Definition:** Does the narrative capture the *feeling* and *emotional essence* of the moment?

| Score | Indicator | Example | Test |
|-------|-----------|---------|------|
| 1 | No emotional resonance | "I took a photo at a temple." | Reads like a fact, not a feeling |
| 2 | Minimal emotional content | "It was nice to be there." | Vague, generic emotion |
| 3 | Clear emotion, but muted | "I felt peaceful at the temple." | Says the feeling but doesn't show it |
| 4 | Vivid emotional language | "The golden light filled me with peace..." | Shows the feeling through sensory detail |
| 5 | Deeply moving | "Standing in that ancient courtyard, time seemed to pause. The light, the silence, the weight of centuries—it all became one moment of perfect clarity." | Transports reader into the moment |

**Scoring Tips:**
- Listen for: sensory language, emotional depth, vivid verbs, metaphors
- Avoid: generic adjectives (nice, good, beautiful without context)
- Ask: "Would this move someone emotionally if they read it?"

---

### 2. SPECIFICITY
**Definition:** Does the narrative reference *actual details* from the photos, voice, venue, or companions?

| Score | Indicator | Example | Test |
|-------|-----------|---------|------|
| 1 | Completely generic | "Traveling is great." | Could be any moment |
| 2 | Vague reference | "Somewhere beautiful." | No real details |
| 3 | Generic + one detail | "At the temple, I saw old buildings." | Basic detail, generic language |
| 4 | Specific details embedded | "The golden light caught the carved wooden doors as Mom pointed at the gardeners raking the gravel." | Uses multiple specific details |
| 5 | Rich specific detail | "That particular angle of light on the 200-year-old gate—the way it cast shadows on the moss—that's what I'll remember." | Specific enough you could identify the moment |

**Scoring Tips:**
- Check: Does the narrative mention observable details from the photos?
- Validate: Can you trace details back to input (photo descriptions, voice keywords, venue name)?
- Red flag: If narrative could apply to 100 different moments, it's not specific enough
- Ask: "Would the user recognize their moment in this narrative?"

---

### 3. EMOTIONAL ACCURACY
**Definition:** Does the *tone and sentiment* of the narrative match the *user's sentiment* (from voice)?

| Score | Indicator | Example Mismatch | Test |
|-------|-----------|------------------|------|
| 1 | Completely wrong tone | User voiced "sad and reflective" → Narrative is "exciting and energetic" | Tone contradicts input |
| 2 | Misaligned tone | User: 0.3 sentiment (sad) → Narrative: upbeat | Wrong emotional direction |
| 3 | Neutral tone (safe) | User: excited (0.8) → Narrative: matter-of-fact | Doesn't capture user's feeling |
| 4 | Matching tone | User: peaceful (0.6) → Narrative: calm, reflective language | Tone aligns with sentiment |
| 5 | Perfect tone match | User: nostalgic (0.55) → Narrative: wistful, memory-focused, gentle language | Captures user's emotional nuance |

**Voice Sentiment Guide:**
```
Sentiment Score (from voice):
  0.85-1.0  = Very positive, excited, euphoric → Energetic, vivid, enthusiastic language
  0.6-0.84  = Positive, happy, grateful → Warm, appreciative, upbeat language
  0.4-0.59  = Slightly positive, content → Gentle, pleasant, calm language
  0.2-0.39  = Neutral-ish, okay → Matter-of-fact, observational language
  0.0-0.19  = Slightly negative, pensive → Thoughtful, reflective language
 -0.2-0.0  = Neutral/ambiguous → Balanced, non-committal language
 -0.4--0.2 = Negative, sad, contemplative → Somber, introspective language
 <-0.4     = Very negative, melancholic → Mournful, poignant language
```

**Scoring Tips:**
- Cross-reference: Always check input voice_sentiment score
- Listen for: Word choice, sentence length, pacing, punctuation matching tone
- Ask: "If I read this aloud, would it sound like the user's voice sentiment?"

---

### 4. COHERENCE
**Definition:** Does the narrative *flow logically* and *form a compelling arc*?

| Score | Indicator | Example | Test |
|-------|-----------|---------|------|
| 1 | Disjointed | Sentences jump between unrelated topics | Hard to follow the story |
| 2 | Weak flow | Ideas connect but awkwardly | Reader has to work to understand |
| 3 | Basic flow | Clear beginning-middle-end, but mechanical | Feels like a summary, not a story |
| 4 | Good flow | Natural progression, clear arc | Easy to follow, feels intentional |
| 5 | Compelling arc | Opening hooks → rises → peaks → resonant close | Reader is engaged throughout |

**Coherence Structure Guide:**
```
✓ Strong Arc:
  - Opening: Establishes setting/mood/moment
  - Rising: Adds detail, builds emotional weight
  - Peak: The core insight or feeling
  - Close: Resonates with the opening, leaves reader moved

✗ Weak Arc:
  - Lists facts without building
  - Jumps between ideas
  - Ends abruptly or trails off
  - Feels like documentation, not story
```

**Scoring Tips:**
- Read aloud: Does it feel natural or forced?
- Check transitions: Do ideas connect smoothly?
- Ask: "Would I want to read this again?" (if yes → 4+, if unsure → 2-3, if no → 1)

---

### 5. PERSONA RESONANCE
**Definition:** Does the narrative *feel personal* and *match the user's values*?

| Score | Indicator | Example | Test |
|-------|-----------|---------|------|
| 1 | Generic for anyone | "Traveling is fun." | No personal touch |
| 2 | Surface attempt | "I liked being there." | Vague personalization |
| 3 | Somewhat personal | "I was with my family and felt peaceful." | States the persona element |
| 4 | Personal voice | "My mom loves these quiet gardens. Watching her notice the moss—that's the real trip for me." | Reflects user's values (family, observation) |
| 5 | Deeply resonant | "This is the trip I promised myself: not destinations, but moments where I feel understood by someone I love. This was one." | Captures user's deeper values & identity |

**Persona Guide** (from user research):
```
Marco (Traveler):
  • Values: Novelty, discovery, iconic moments
  • Reads like: Adventure, exploration, excitement
  • Red flag: Too introspective or family-focused

David (Privacy-conscious):
  • Values: Independence, authenticity, moments alone
  • Reads like: Introspective, honest, solo reflection
  • Red flag: Overly social or sentimental

Sarah (Parent):
  • Values: Family, children, legacy, simplicity
  • Reads like: Warm, child-centered, grounded
  • Red flag: Too philosophical or adventure-focused

Aisha (Mindfulness):
  • Values: Presence, depth, awareness, stillness
  • Reads like: Contemplative, sensory, meditative
  • Red flag: Rushed, superficial, excitement-focused

Linda (Caregiver):
  • Values: Family legacy, emotion, love, meaning
  • Reads like: Emotional, tender, relationship-focused
  • Red flag: Too detached or individual-focused
```

**Scoring Tips:**
- Consider: What does this person care about? Does the narrative reflect that?
- Ask: "Would this person feel *seen* by this narrative?"
- Note: You may not know the user's full persona from input alone—score based on what's evident

---

## Evaluation Process

### Before You Start

1. **Calibration (30 min with co-evaluator)**
   - Score 5 sample narratives together
   - Discuss disagreements >1 point
   - Align on rubric interpretation
   - Document calibration notes

2. **Prepare Scoring Setup**
   - Open Google Sheet (shared with co-evaluator)
   - Have rubric open in separate window
   - Clear space for 60-90 sec per narrative

### Scoring a Narrative

**Step 1: Read the narrative** (no judgment pass)
- Read once, straight through
- Notice first impressions

**Step 2: Score each dimension independently** (1 min per dimension)
- Ask: Does this dimension meet the definition?
- Pick 1-5 based on rubric examples
- Note: Don't overthink—rubric should guide quick decisions

**Step 3: Calculate average** (10 sec)
- Sum the 5 scores
- Divide by 5
- Record in spreadsheet

**Step 4: Add notes** (10-30 sec, optional)
- If score <4: Why did it miss?
- If score 5: What made it exceptional?
- Flagged disagreement with co-evaluator? Note it

### Time Budget

```
Per narrative: ~90 seconds
  • Read: 20 sec
  • Score 5 dimensions: 50 sec
  • Record + notes: 20 sec

50 narratives × 90 sec ÷ 60 min/hr = 75 minutes per evaluator
2 evaluators working in parallel = ~90 minutes total time (1.5 hours)
Across 3 days (Days 2-5) = 30 min per day per evaluator
```

---

## Pass / Fail Decision

### Scoring Results Template

```
Total Narratives Scored: 50
Evaluators: [Name 1], [Name 2]

Average Score: _____ / 5.0
  (Sum all averages / 50)

Dimension Averages:
  Evocativeness:     _____ / 5.0
  Specificity:       _____ / 5.0
  Emotional Accuracy: _____ / 5.0
  Coherence:         _____ / 5.0
  Persona Resonance: _____ / 5.0

Evaluator Agreement:
  Narratives with <1pt difference: _____ / 50 (__%)
  Narratives with 1-2pt difference: _____ / 50 (__%)
  Narratives with >2pt difference (flag for discussion): _____ / 50 (__%)

Weak Dimensions (if any):
  [List any dimension <4.0, note why]

Outliers:
  [Note any narratives <3.5 or >4.5, patterns?]
```

### Decision Gate

| Average Score | Decision | Action |
|---------------|----------|--------|
| **≥4.0** | ✅ PASS | Proceed to Phase 3 (learning system) |
| **3.5-3.99** | ⚠️ ITERATE | Identify weak dimension, adjust prompt, re-eval 10 narratives |
| **<3.5** | ❌ HOLD | Major redesign needed, new batch of narratives, re-eval all 50 |

---

## Persona-Specific Targets (Aspirational, Not Blockers)

These are *nice-to-have* targets, not launch requirements. Universal minimum (4.0+) applies to all.

### Marco (Traveler) - 10 narratives
Target:
- Evocativeness: 4.5+
- Specificity: 4.0+
- Persona Resonance: 4.0+ (adventure/discovery focused)

If underperforming: Add more sensory/discovery language, bold descriptors

### David (Privacy-conscious) - 10 narratives
Target:
- Coherence: 4.0+
- Evocativeness: 4.0+
- Persona Resonance: 4.0+ (introspective/honest)

If underperforming: More reflective tone, reduce group/social language

### Sarah (Parent) - 10 narratives
Target:
- Overall: 4.0+ (no weak dimension)
- Family/child details emphasized

If underperforming: Ensure warm, grounded tone, reference family moments

### Aisha (Mindfulness) - 10 narratives
Target:
- Evocativeness: 4.5+
- Specificity: 4.0+
- Persona Resonance: 4.0+ (contemplative/presence)

If underperforming: Add sensory detail, slow pace, meditative language

### Linda (Caregiver) - 10 narratives
Target:
- Emotional Accuracy: 4.5+
- Evocativeness: 4.0+
- Persona Resonance: 4.0+ (legacy/love focused)

If underperforming: Emphasize emotional depth, relationship, memory

---

## Common Scoring Pitfalls

### ❌ Don't Score Based On:
- Your personal taste ("I like poetry" → 5 stars)
- Whether you'd write it that way
- Grammar/spelling (assume Claude outputs are clean)
- Length (short ≠ low quality)
- How "smart" the narrative sounds

### ✅ Do Score Based On:
- Rubric criteria (evocativeness, specificity, etc.)
- Input data match (are details from photos/voice present?)
- User sentiment alignment (does tone match voice?)
- Narrative flow (is it coherent?)
- Personal resonance (would the *user* connect with it?)

### 🚩 Red Flags (Usually <4)
- "Could be any moment" → Low specificity
- "Doesn't sound like their sentiment" → Low emotional accuracy
- "Jumps around" → Low coherence
- "Could be a template" → Low evocativeness or persona resonance
- "I had to work to understand it" → Low coherence

---

## Scoring Examples

### Example 1: Marco's Temple Moment

**Input:**
- Photos: 2 images (ancient temple gate, garden with people)
- Voice: "Standing here at the temple, I feel this overwhelming sense of peace. The light is perfect, and being here with Mom makes it even more special." (Sentiment: 0.85)
- Venue: Senso-ji Temple, Tokyo
- Companions: Mom

**Generated Narrative:**
"The golden light caught the ancient stone walls as we stepped into the quiet courtyard. Maya pointed at everything, Mom finding a quiet bench in the garden. The kind of moment you dream about before a trip, and then it actually happens."

**Scoring:**

| Dimension | Score | Why |
|-----------|-------|-----|
| Evocativeness | 4 | Vivid imagery ("golden light caught stone walls"), emotional word ("dream about"), shows not tells |
| Specificity | 4 | References gate, courtyard, garden, Mom's behavior (bench), but "Maya" is wrong name |
| Emotional Accuracy | 5 | Voice is peaceful/grateful (0.85) → narrative matches with "quiet," "dream," "happens" |
| Coherence | 4 | Clear arc: opening (light), middle (family moment), close (wish fulfilled). Natural flow |
| Persona Resonance | 4 | Marco values novelty/discovery—narrative captures "dream moment" but could emphasize discovery more |
| **Average** | **4.2** | ✅ PASS |

---

### Example 2: Sarah's Family Photo

**Input:**
- Photos: 1 image (family at monument)
- Voice: "The kids were so happy here. This is the kind of memory I want them to have." (Sentiment: 0.7)
- Venue: Statue of Liberty, NYC
- Companions: Kids (2), Husband

**Generated Narrative:**
"The kids were excited by the monument. Everyone felt happy. It was a good trip."

**Scoring:**

| Dimension | Score | Why |
|-----------|-------|-----|
| Evocativeness | 2 | Generic language ("happy," "good," "excited"), no emotional depth |
| Specificity | 1 | No details about which kids, which monument features, how family interacted |
| Emotional Accuracy | 2 | Voice is warm/grateful (0.7) but narrative is matter-of-fact, not warm |
| Coherence | 1 | Reads like a summary, no arc, abrupt |
| Persona Resonance | 1 | Sarah values family legacy/memory—narrative is too generic, no personal voice |
| **Average** | **1.4** | ❌ FAIL |

**Why <4:** Reads like a template. Needs: specific details (kids' reactions, monument features), warmer tone, emotional depth about legacy/memory, natural flow.

---

## Tips for Consistent Scoring

### For Both Evaluators

1. **Set a rhythm:** 90 sec per narrative, don't overthink
2. **Use the rubric:** If unsure, re-read the dimension description
3. **Compare to examples:** Does it feel like the 3, 4, or 5-level example?
4. **Flag disagreements:** If you and co-evaluator differ >1 point, discuss briefly
5. **Note patterns:** Are all Marco narratives scoring low on specificity? Flag for adjustment
6. **Take breaks:** Every 10 narratives, step away 5 min

### For Disagreements

If evaluator scores differ by >1 point on a narrative:

1. **Re-read the narrative together** (no discussion yet)
2. **Each shares rubric justification** (why you picked that score?)
3. **Agree on one score** (usually one is wrong, or both are)
4. **Move on** (don't spend >5 min on one narrative)

If pattern of disagreement (e.g., always disagree on "Evocativeness"):
- Revisit calibration examples
- Align on what "vivid" vs "muted" looks like
- Retro-score a few earlier narratives if needed

---

## Week 2 Schedule

| Day | Task | Time | Owner |
|-----|------|------|-------|
| **Day 1 (Mon)** | Create rubric + spreadsheet | 2h | Product Lead |
| **Day 2 (Tue)** | Calibration session | 0.5h | Both evaluators |
| | Start scoring (20 narratives) | 1.5h | Both (parallel) |
| **Day 3 (Wed)** | Score remaining (30 narratives) | 2.5h | Both (parallel) |
| **Day 4 (Thu)** | Consolidate scores | 1h | Product Lead |
| | Decision gate meeting | 0.5h | Both |
| **Day 5 (Fri)** | Finalize report + next steps | 1h | Product Lead |

**Total:** ~9 hours (very manageable)

---

## Success Criteria

✅ Rubric clear enough for fast scoring (90 sec per narrative)
✅ Both evaluators >0.8 agreement (Cohen's kappa)
✅ All 50 narratives scored
✅ Average calculated
✅ Gate decision made (PASS/ITERATE/HOLD)
✅ If PASS: Proceed to Phase 3
✅ If ITERATE: Document changes, re-score subset
✅ If HOLD: Document major issues, redesign synthesis approach

---

*Rubric created: February 15, 2026*
*Ready for Week 2 evaluation*
*Launch gate: Quality 4.0+ average or don't ship*
