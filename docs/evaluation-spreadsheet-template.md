# Sensory Engine MVP - Quality Evaluation Spreadsheet Template

## Instructions

1. **Create a new Google Sheet** in your Google Drive
2. **Copy this structure** into the sheet
3. **Share with co-evaluator** (give edit access)
4. **Fill in during Week 2** evaluation (Days 2-4)
5. **Use for consolidation** on Day 4-5

---

## Spreadsheet Structure

### Columns (A-M)

```
A: Narrative ID
B: Persona
C: Photo Count
D: Has Voice
E: Generated Narrative (text)
F: Evocativeness (1-5)
G: Specificity (1-5)
H: Emotional Accuracy (1-5)
I: Coherence (1-5)
J: Persona Resonance (1-5)
K: Average Score (F+G+H+I+J)/5
L: Evaluator
M: Notes
```

---

## Google Sheets Template

Copy this into your Google Sheet (or use the HTML below to get the structure):

### Header Row (Row 1)

| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Narrative ID** | **Persona** | **Photo Count** | **Has Voice** | **Generated Narrative** | **Evocativeness** | **Specificity** | **Emotional Accuracy** | **Coherence** | **Persona Resonance** | **Average** | **Evaluator** | **Notes** |

### Example Data Rows (Rows 2-51)

Rows 2-51 for 50 narratives:

```
Row 2:  NARR_001 | Marco | 2 | Yes | [narrative text...] | [1-5] | [1-5] | [1-5] | [1-5] | [1-5] | =AVERAGE(F2:J2) | [Name] | [notes]
Row 3:  NARR_002 | David | 1 | Yes | [narrative text...] | [1-5] | [1-5] | [1-5] | [1-5] | [1-5] | =AVERAGE(F3:J3) | [Name] | [notes]
...
Row 51: NARR_050 | Linda | 3 | Yes | [narrative text...] | [1-5] | [1-5] | [1-5] | [1-5] | [1-5] | =AVERAGE(F51:J51) | [Name] | [notes]
```

### Calculation Rows (After Row 51)

```
Row 52: [blank] | [blank] | [blank] | [blank] | SUMMARY | [blank] | [blank] | [blank] | [blank] | [blank] | [blank] | [blank] | [blank]

Row 53: Dimension Averages:
  - Row 53 Col F: =AVERAGE(F2:F51) [Evocativeness Avg]
  - Row 53 Col G: =AVERAGE(G2:G51) [Specificity Avg]
  - Row 53 Col H: =AVERAGE(H2:H51) [Emotional Accuracy Avg]
  - Row 53 Col I: =AVERAGE(I2:I51) [Coherence Avg]
  - Row 53 Col J: =AVERAGE(J2:J51) [Persona Resonance Avg]

Row 54: Overall Average:
  - Row 54 Col F: =AVERAGE(K2:K51) [Universal Average - GATE CRITERIA]

Row 55: [blank] | Evaluator 1 Agreement: | [count narratives you both scored]
Row 56: [blank] | Evaluator 2 Agreement: | [count narratives you both scored]
Row 57: [blank] | Disagreement >1pt: | [count]
```

---

## Google Sheets Setup (Step-by-Step)

### 1. Create New Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click "+ New" → "Blank spreadsheet"
3. Name it: `Sensory Engine MVP - Quality Evaluation`

### 2. Format Header Row

1. Select Row 1 (click row number)
2. Right-click → "Insert 1 above" (makes room)
3. Fill in column headers (A-M) from template above
4. Format: **Bold**, light gray background (to distinguish)
5. Freeze row: `View` → `Freeze` → `1 row`

### 3. Prepare Data Rows

1. Fill Column A (Rows 2-51): `NARR_001` through `NARR_050`
2. Fill Column B: Persona assignments (10 Marco, 10 David, 10 Sarah, 10 Aisha, 10 Linda)
   - Rows 2-11: Marco
   - Rows 12-21: David
   - Rows 22-31: Sarah
   - Rows 32-41: Aisha
   - Rows 42-51: Linda
3. Fill Column C: Photo count (from generated input)
4. Fill Column D: "Yes" or "No" (has voice)
5. Fill Column E: The generated narrative text (full text, or link to external doc if too long)

### 4. Add Formulas

1. **Average Formula (Column K):**
   - Click K2
   - Type: `=AVERAGE(F2:J2)`
   - Press Enter
   - Copy down to K51 (select K2, then drag to K51)

2. **Dimension Averages (Row 53):**
   - F53: `=AVERAGE(F2:F51)`
   - G53: `=AVERAGE(G2:G51)`
   - H53: `=AVERAGE(H2:H51)`
   - I53: `=AVERAGE(I2:I51)`
   - J53: `=AVERAGE(J2:J51)`

3. **Overall Average (Row 54, Column F):**
   - F54: `=AVERAGE(K2:K51)` ← **THIS IS YOUR GATE CRITERIA**

### 5. Share & Permissions

1. Click "Share" (top right)
2. Add co-evaluator email
3. Permissions: "Editor"
4. Message: "Let's evaluate these narratives! Read the rubric first (docs/quality-evaluation-rubric.md), then we'll do calibration on [DATE]."

### 6. Optional: Conditional Formatting

To visually highlight scores:

1. Select F2:J51 (all scoring cells)
2. `Format` → `Conditional formatting`
3. Format rules:
   - `5.0` → Green background
   - `4.0-4.9` → Light green
   - `3.0-3.9` → Yellow
   - `2.0-2.9` → Orange
   - `1.0-1.9` → Red background

---

## Evaluation Workflow

### Day 2 (Calibration)

1. Both evaluators read 5 sample narratives
2. Both score independently (don't discuss yet)
3. Compare scores
4. Discuss disagreements >1 point
5. Align on rubric interpretation
6. Fill in calibration notes in separate cells (outside main 50)

### Days 2-4 (Scoring)

**Parallel workflow (both evaluators working simultaneously):**

1. Evaluator 1: Scores narratives 1-25 (Column L: put your name)
2. Evaluator 2: Scores narratives 26-50 (Column L: put your name)
3. Both work at own pace (90 sec per narrative)
4. Update shared sheet as you go
5. Each scoring session: 25 narratives × 90 sec = 37.5 minutes ≈ 45 min with breaks

### Day 4 (Consolidation)

1. Review all scores
2. Identify narratives where you both scored (overlap of 5-10 for agreement check)
3. Calculate dimension averages (Row 53)
4. Calculate overall average (Row 54, F54 = GATE CRITERIA)
5. Check if >1pt disagreements need discussion
6. Create summary report (below)

---

## Scoring Tips in Spreadsheet

### Column E (Narrative Text)

**If narrative is long (>500 chars):**
- Link to external Google Doc instead of pasting full text
- Or: Put first 100 chars in E, full text in separate "Narratives" sheet

### Column L (Evaluator Name)

- Put your name so you know who scored what
- Helps identify scoring patterns (e.g., "Does Evaluator A score higher on Evocativeness?")

### Column M (Notes)

**Add notes for:**
- Scores <4: "Why did this miss?" (e.g., "Too generic language" or "Wrong tone")
- Scores 5: "What made this excellent?" (e.g., "Vivid sensory detail" or "Perfect tone match")
- Disagreements: "We scored this 4 vs 3, discussed, agreed on 3.5" (round to nearest 0.5)
- Patterns: "This persona consistently low on Specificity—prompt issue?"

---

## Consolidation Report (Day 4-5)

After scoring all 50, fill in this report in the spreadsheet (below Row 60):

```
QUALITY EVALUATION REPORT
========================

Date: [Date]
Evaluators: [Name 1], [Name 2]

OVERALL RESULTS:
  Total Narratives: 50
  Overall Average: [F54 value] / 5.0

  GATE RESULT: [✅ PASS if ≥4.0 | ⚠️ ITERATE if 3.5-3.99 | ❌ HOLD if <3.5]

DIMENSION AVERAGES:
  Evocativeness:       [F53] / 5.0
  Specificity:         [G53] / 5.0
  Emotional Accuracy:  [H53] / 5.0
  Coherence:           [I53] / 5.0
  Persona Resonance:   [J53] / 5.0

PERSONA PERFORMANCE:
  Marco (NARR_001-010):
    Average: [AVERAGE(K2:K11)]
    Notes: [Any patterns? High/low dimensions?]

  David (NARR_011-020):
    Average: [AVERAGE(K12:K21)]
    Notes:

  Sarah (NARR_021-030):
    Average: [AVERAGE(K22:K31)]
    Notes:

  Aisha (NARR_031-040):
    Average: [AVERAGE(K32:K41)]
    Notes:

  Linda (NARR_041-050):
    Average: [AVERAGE(K42:K51)]
    Notes:

EVALUATOR AGREEMENT:
  Narratives scored by both: [count]
  Average disagreement: [average |Evaluator1 - Evaluator2| per narrative]
  Cohen's Kappa: [if you calculate inter-rater reliability]

  Notes on disagreement patterns:
  [Any systematic differences? E.g., "Evaluator A scores Evocativeness 0.5pt higher"]

WEAK DIMENSIONS (if any):
  [List any dimension <4.0, with narratives and improvement suggestions]
  Example: "Specificity averaging 3.7 (narratives NARR_005, NARR_012, NARR_017)
           → Need more specific photo/venue details in prompt"

STRONG DIMENSIONS:
  [List any dimension >4.2, note what's working]
  Example: "Emotional Accuracy averaging 4.4 → Sentiment-aware prompting is effective"

NEXT STEPS:
  [Based on gate result:]

  ✅ If PASS (≥4.0):
     → Proceed to Phase 3 (Learning System)
     → No narrative redesign needed
     → Start quality testing with real users in v1.0+

  ⚠️ If ITERATE (3.5-3.99):
     → Focus on weak dimension
     → Adjust synthesis prompt
     → Generate new 10 narratives with updated prompt
     → Re-evaluate those 10 (should take 1.5 hours)
     → If new batch ≥4.0, proceed. If still <4.0, iterate again.

  ❌ If HOLD (<3.5):
     → Major redesign needed
     → Consider: Different prompt approach? Different model?
     → Consult with team on next steps
     → Don't proceed without fixing quality

BLOCKERS / ISSUES:
  [Any narratives impossible to score? Data issues? Note them]

SUBMITTED BY: [Your name]
DATE: [Date]
```

---

## Quick Reference: Persona Distribution

| Persona | Rows | Count |
|---------|------|-------|
| Marco | 2-11 | 10 |
| David | 12-21 | 10 |
| Sarah | 22-31 | 10 |
| Aisha | 32-41 | 10 |
| Linda | 42-51 | 10 |

---

## Share Link Template

**Message to send to co-evaluator:**

```
Hi [Name],

Ready to evaluate the Sensory Engine narratives for quality gate?

Here's the plan:
- Monday: Rubric calibration (30 min) + start scoring
- Tuesday-Wednesday: Continue scoring (45 min/day each)
- Thursday: Consolidate results + make gate decision

📋 Rubric: docs/quality-evaluation-rubric.md
📊 Spreadsheet: [GOOGLE SHEET LINK]
🎯 Target: 4.0+ average across 50 narratives

Let me know when you're ready to start!
```

---

## Troubleshooting

### "The narrative is too long for one cell"
**Solution:**
- Create a separate "Narratives" sheet with full texts
- In Column E, put just the narrative ID and link: `=HYPERLINK("#gid=12345!A2", "NARR_001")`
- Or paste first 100 chars in Column E + link to Google Doc with full text

### "My co-evaluator and I keep disagreeing"
**Solution:**
- Take a break, re-read rubric
- Score a few calibration narratives together again
- Focus: Are you interpreting "Evocativeness" the same way?
- It's OK to agree on score and move on (don't spend >5 min per narrative)

### "Overall average is 3.8, do we iterate or hold?"
**Answer:** ITERATE
- 3.8 is close to 4.0 (only 0.2 away)
- Identify the weak dimension
- Adjust synthesis prompt
- Generate 10 new narratives with updated prompt
- Re-score those 10 (should only take 1.5 hours)
- If new batch averages 4.2+, you're good to go

### "We finished early, what should we do?"
**Suggestions:**
- Review all <4.0 narratives as a team
- Discuss what's missing in weak ones
- Start thinking about prompt adjustments
- Document learnings for Phase 3 (learning system)

---

## Submission

When complete:

1. **Save the spreadsheet** (auto-saves in Google Sheets)
2. **Share the link** with the team
3. **Create the Consolidation Report** (section above)
4. **Make gate decision** (PASS/ITERATE/HOLD)
5. **Schedule next phase** based on outcome

---

*Spreadsheet template created: February 15, 2026*
*Ready for Week 2 evaluation (Days 2-5)*
*Gate criteria: 4.0+ average (calculated in F54)*
