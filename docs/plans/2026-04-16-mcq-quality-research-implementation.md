# MCQ Quality Research Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the three research-identified gaps between AI-generated and NBME-quality MCQs: questions too easy (difficulty 0.76 vs 0.65), non-functioning distractors (39% vs 55%), and AI linguistic tells.

**Architecture:** Prompt-first approach. Week 1 changes agent prompts only (zero code changes). Week 2 adds new validator checks and failure categories. Week 3 adds schema fields for near-miss tracking and difficulty estimation. Each week's changes are independently valuable.

**Tech Stack:** TypeScript, Zod v4, agent prompt seeds in `src/lib/factory/seeds/agent-prompts.ts`

**Research basis:** 15+ blinded comparison studies (2024-2026). Key metrics — AI difficulty index 0.76 vs human 0.65 (p=0.02), AI distractor efficiency 39% vs human 55% (p=0.035), AI discrimination 0.19 vs human 0.29. Stylistic detection: redundancy OR 6.90, repetition OR 8.05, coherence OR 6.62.

---

## Week 1: Prompt-Level Fixes (No Code Changes)

All changes in `src/lib/factory/seeds/agent-prompts.ts`. Bump version numbers, set old versions `is_active: false`.

### Task 1: Add Anti-AI Linguistic Style Guide to Vignette Writer

**Files:**
- Modify: `src/lib/factory/seeds/agent-prompts.ts` (vignette_writer prompt, line ~195)

**What:** Add a new `LINGUISTIC NATURALNESS` section to the vignette_writer system prompt (v3). Research shows redundancy (OR 6.90), repetition (OR 8.05), and smooth coherence (OR 6.62) are the strongest AI tells.

**Step 1: Add new vignette_writer v3 prompt**

In `agent-prompts.ts`, after the existing vignette_writer v2 entry (line ~251), add a new v3 entry. Set v2 `is_active: false`, v3 `is_active: true`.

Add this section to the system prompt, between NOISE ELEMENT REQUIREMENT and ANSWER OPTION CLEANLINESS:

```
LINGUISTIC NATURALNESS (anti-AI style):
Write like a physician's chart note, not a language model. Research shows three stylistic features 
that identify AI text with high confidence:
1. REDUNDANCY (OR 6.90): Never restate information. If you said "chest pain" in the complaint, 
   do not repeat "chest pain" in the physical exam section. Each sentence adds NEW information.
2. REPETITION (OR 8.05): Vary sentence structure. Mix lengths. Use fragments where natural 
   ("Lungs clear bilaterally." not "On auscultation, the lungs are clear bilaterally."). 
   Do NOT start consecutive sentences with the same structure.
3. SMOOTH COHERENCE (OR 6.62): Real chart notes are slightly disjointed — data from different 
   systems is juxtaposed without smooth transitions. Do NOT use transitional phrases like 
   "additionally," "furthermore," "notably," or "upon further evaluation."

PROHIBITED PHRASES (auto-reject if found in vignette):
- "presents with" / "presents to" → use "is brought to" or "comes to"
- "notably" / "notably absent" → just state the finding or omit
- "significant for" → "positive for" or just state it
- "consistent with" (in vignette, fine in explanation)
- "the patient reports" → state the symptom directly as fact
- "upon examination" / "upon further evaluation" → "Physical examination shows"
- "is started on" / "is placed on" → "receives" or name the intervention directly
- Any sentence starting with "The patient"  more than once in the entire vignette

APPROVED NBME LEAD-IN LIST (use ONLY these — any deviation is a quality defect):
- "Which of the following is the most likely diagnosis?"
- "Which of the following is the most appropriate next step in management?"
- "Which of the following is the most appropriate initial management?"
- "Which of the following is the most appropriate pharmacotherapy?"
- "Which of the following is the most appropriate diagnostic study?"
- "Which of the following is the most likely cause of this patient's [finding]?"
- "Which of the following is the priority in management?"
- "Which of the following is most likely to have prevented this condition?"
```

**Step 2: Run TypeScript compilation**

Run: `npx tsc --noEmit --strict`
Expected: PASS (no type errors — this is a string change only)

**Step 3: Commit**

```bash
git add src/lib/factory/seeds/agent-prompts.ts
git commit -m "feat: vignette_writer v3 — anti-AI linguistic naturalness guide"
```

---

### Task 2: Add Near-Miss Distractor Requirement to Case Planner

**Files:**
- Modify: `src/lib/factory/seeds/agent-prompts.ts` (case_planner prompt, line ~370+)

**What:** The case planner already requires distinct cognitive errors per distractor. But research shows the key quality gap is the **near-miss distractor** — one option that would be correct if a single clinical detail changed. This is what creates 0.65 difficulty instead of 0.76.

**Step 1: Add NEAR-MISS DISTRACTOR RULE to case_planner v3**

Create new case_planner v3 (set v2 `is_active: false`). Add this section after the DISTRACTOR DIFFERENTIATION RULE:

```
NEAR-MISS DISTRACTOR RULE (STRICT — this is what separates 0.65 difficulty from 0.76):
Exactly ONE of the 4 distractors MUST be a "near-miss" — an option that would be the CORRECT 
answer if a single clinical detail in the vignette were different.

A valid near-miss satisfies ALL of:
1. It targets a DIFFERENT condition or management path than the correct answer
2. There is ONE specific detail (a lab value, a vital sign, a history element, a timing factor) 
   that, if changed, would make THIS option correct instead
3. The detail that distinguishes them IS the hinge clue — the near-miss is what the hinge resolves
4. A knowledgeable student who misses or misinterprets the hinge would reasonably choose this option

For the near-miss frame, specify:
- near_miss: true
- pivot_detail: string — the ONE clinical detail that separates this from the correct answer
  (e.g., "If BP were >180/120 instead of 145/90, this would be correct")
- correct_if: string — the modified clinical scenario where this becomes the right answer
  (e.g., "Hypertensive emergency with end-organ damage")

The other 3 distractors are standard (near_miss: false or omitted).

DIFFICULTY FLOOR:
The near-miss requirement ensures difficulty index stays ≤0.70 (target: 0.60-0.70).
A question without a genuine near-miss will be too easy because no distractor truly competes.
```

**Step 2: Run TypeScript compilation**

Run: `npx tsc --noEmit --strict`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/factory/seeds/agent-prompts.ts
git commit -m "feat: case_planner v3 — near-miss distractor rule for difficulty floor"
```

---

### Task 3: Strengthen Competing Signal Requirement in Vignette Writer

**Files:**
- Modify: `src/lib/factory/seeds/agent-prompts.ts` (vignette_writer v3 prompt, from Task 1)

**What:** The competing signal section already exists but is vague ("2-3 findings"). Research shows the gap is that AI vignettes include signals that *weakly* support the distractor vs signals that *genuinely argue for it*. Strengthen the requirement with specific enforcement.

**Step 1: Replace the COMPETING SIGNAL REQUIREMENT section in vignette_writer v3**

Replace the existing COMPETING SIGNAL REQUIREMENT block with:

```
COMPETING SIGNAL REQUIREMENT (research-critical — this creates genuine difficulty):
Every vignette MUST include POSITIVE EVIDENCE for the near-miss distractor's diagnosis. 
Not just absence of contradicting evidence — actual findings that support the wrong answer.

Minimum requirements:
- At least 2 findings that GENUINELY support the near-miss distractor's diagnosis/action
- These findings must be REAL clinical features of that competing condition (not fabricated)
- The findings must appear BEFORE the hinge clue in the vignette
- A student reading only the first 80% of the vignette should find the near-miss MORE plausible 
  than the correct answer, or at minimum equally plausible

Self-test before outputting: Cover the last 2 sentences of your vignette. Can a 3rd-year student 
reasonably defend the near-miss distractor based on what remains? If not, you haven't included 
enough competing signal.

Example (PE vs DVT management):
- Competing signals for DVT: unilateral leg swelling (present), Homan sign positive, no dyspnea mentioned early
- Hinge for PE: sudden onset pleuritic chest pain + tachycardia + hypoxia (appears in final sentences)
- Without the hinge, a student could reasonably argue for DVT workup/management
```

**Step 2: Run TypeScript compilation**

Run: `npx tsc --noEmit --strict`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/factory/seeds/agent-prompts.ts
git commit -m "feat: vignette_writer v3 — strengthen competing signal with positive evidence requirement"
```

---

### Task 4: Add Distractor Functioning Self-Check to Case Planner

**Files:**
- Modify: `src/lib/factory/seeds/agent-prompts.ts` (case_planner v3 prompt, from Task 2)

**What:** Research shows 39% AI distractor efficiency vs 55% human. A non-functioning distractor is chosen by <5% of test-takers. Add a self-check that forces the case planner to justify why each distractor would attract real test-takers.

**Step 1: Add DISTRACTOR FUNCTIONING SELF-CHECK to case_planner v3**

Add after the NEAR-MISS DISTRACTOR RULE:

```
DISTRACTOR FUNCTIONING SELF-CHECK (39% AI efficiency vs 55% human — this is the gap):
For EVERY distractor frame, you MUST answer: "What specific reasoning error would lead a 
real 3rd-year medical student to choose this option?"

A distractor FUNCTIONS if:
- It exploits a COMMON reasoning error (not an exotic one)
- It is the CORRECT answer for a REAL but different clinical scenario
- At least 10% of test-takers at the target level would choose it
- It is NOT eliminable by test-taking strategy alone (no absurd options)

A distractor DOES NOT FUNCTION if:
- Only a student with zero medical knowledge would pick it
- It represents the same error as another distractor (redundant traps)
- It is from a clearly different clinical domain (e.g., psychiatric option in a cardiac question)
- It can be eliminated by length, specificity, or grammatical analysis

For each frame, include in distractor_rationale_by_frame:
- The specific clinical scenario where this IS the right answer
- The estimated % of 3rd-year students who would choose this (must be ≥10% for each distractor)
- The reasoning path that leads here (not just "confusion" — the specific thought process)
```

**Step 2: Run TypeScript compilation**

Run: `npx tsc --noEmit --strict`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/factory/seeds/agent-prompts.ts
git commit -m "feat: case_planner v3 — distractor functioning self-check"
```

---

### Task 5: Add Difficulty Estimation to NBME Quality Validator

**Files:**
- Modify: `src/lib/factory/seeds/agent-prompts.ts` (nbme_quality_validator prompt, line ~398)

**What:** No validator currently estimates difficulty. Add a CHECK 4 section to the NBME quality validator that estimates difficulty index and flags items that are too easy.

**Step 1: Add nbme_quality_validator v2 prompt**

Create v2 (set v1 `is_active: false`). Add this section after CHECK 3:

```
CHECK 4 — DIFFICULTY ESTIMATION (research target: 0.55-0.70):
23. Estimate difficulty index: What percentage of 3rd-year medical students would answer this correctly?
    - If estimated difficulty > 0.75 (too easy): FLAG as "DIFFICULTY: item likely too easy"
    - If estimated difficulty < 0.40 (too hard): FLAG as "DIFFICULTY: item likely too hard"
    - Target range: 0.55-0.70 (optimal discrimination)
    
24. Identify ease causes: If estimated difficulty > 0.75, identify WHY:
    - Pathognomonic presentation? (buzzword gives it away)
    - Only one plausible option? (weak distractors)
    - No competing signal? (nothing argues for a wrong answer)
    - Hinge too obvious? (distinguishing feature jumps out)

25. Distractor plausibility sweep: For each of the 4 distractors, estimate what % of students 
    would choose it. If any distractor would attract <5%, flag as "NON-FUNCTIONING DISTRACTOR: [letter]"
    
Add to issues_found:
- "DIFFICULTY: estimated [X]% correct — [reason]" if outside 0.55-0.70 range
- "NON-FUNCTIONING DISTRACTOR: [letter] — estimated <5% selection" for weak distractors
- "NEAR-MISS ABSENT: no distractor would be correct under slightly different conditions" 
  if no genuine near-miss exists

These are SOFT flags (reduce score by 1-2 points) not auto-fails — but an item with 
estimated difficulty >0.80 AND no functioning near-miss should score ≤5.
```

**Step 2: Run TypeScript compilation**

Run: `npx tsc --noEmit --strict`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/factory/seeds/agent-prompts.ts
git commit -m "feat: nbme_quality_validator v2 — difficulty estimation + distractor functioning checks"
```

---

### Task 6: Add Linguistic Tell Detection to NBME Quality Validator

**Files:**
- Modify: `src/lib/factory/seeds/agent-prompts.ts` (nbme_quality_validator v2 prompt, from Task 5)

**What:** Add CHECK 5 to nbme_quality_validator for detecting AI linguistic tells. This enforces the style guide from Task 1 at the validation layer.

**Step 1: Add CHECK 5 to nbme_quality_validator v2**

```
CHECK 5 — LINGUISTIC NATURALNESS (AI detection research):
26. No prohibited phrases: Check vignette for: "presents with," "notably," "significant for," 
    "consistent with," "upon examination," "upon further evaluation," "the patient reports," 
    "furthermore," "additionally." Each occurrence = 1 point deduction.
    
27. No sentence-start repetition: Flag if 2+ consecutive sentences start with the same structure 
    (e.g., "She has... She also has... She reports..."). Real chart notes vary structure.

28. No smooth transitions: Flag transitional phrases between clinical data points. Real chart 
    notes juxtapose findings without connectives.

29. Sentence length variety: Measure word counts per sentence. Flag if standard deviation < 3 
    (all sentences are similar length). Real notes mix long descriptive sentences with short 
    declarative findings.

30. Approved lead-in only: The stem MUST use one of the approved NBME lead-ins exactly. 
    Any deviation or creative rephrasing is a quality defect.

Auto-fail addition:
- 3+ prohibited phrases in a single vignette = auto-fail (score ≤3)
- Lead-in is not from the approved list = flag (score -2)
```

**Step 2: Run TypeScript compilation**

Run: `npx tsc --noEmit --strict`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/factory/seeds/agent-prompts.ts
git commit -m "feat: nbme_quality_validator v2 — linguistic tell detection (CHECK 5)"
```

---

### Task 7: Upgrade Repair Agent for New Failure Types

**Files:**
- Modify: `src/lib/factory/seeds/agent-prompts.ts` (repair_agent prompt, line ~552)

**What:** The repair agent needs to know how to fix the new failure types: too_easy, non_functioning_distractor, linguistic_tells, and near_miss_absent.

**Step 1: Add repair_agent v2 prompt**

Create v2 (set v1 `is_active: false`). Add these repair strategies:

```
ADDITIONAL REPAIR STRATEGIES (research-backed quality fixes):

When DIFFICULTY flag (item too easy):
1. Strengthen the near-miss distractor — make it MORE tempting
2. Add competing signal: 2+ findings that support the near-miss's diagnosis
3. Bury the hinge deeper — move the distinguishing finding earlier or embed it in a detail
4. Add noise: 1-2 irrelevant but plausible findings that dilute the signal
5. Do NOT make the question harder by making it medically ambiguous — make it harder by 
   making the REASONING harder

When NON-FUNCTIONING DISTRACTOR flag:
1. Replace the weak distractor with an option that IS correct for a related but different scenario
2. The replacement must exploit a DIFFERENT cognitive error than other distractors
3. The replacement must be from the same option_action_class
4. Verify the replacement would attract ≥10% of test-takers

When LINGUISTIC TELL flag:
1. Rewrite flagged sentences in chart-note style
2. Remove all prohibited phrases
3. Vary sentence structure and length
4. Remove smooth transitions between clinical data points
5. Do NOT change any clinical content — only change the prose style

When NEAR-MISS ABSENT flag:
1. Redesign one distractor as a near-miss (correct if one detail changes)
2. Specify the pivot_detail (what single change makes this correct)
3. Ensure the hinge clue is what distinguishes correct from near-miss
4. Add competing signal for the near-miss in the vignette
```

**Step 2: Run TypeScript compilation**

Run: `npx tsc --noEmit --strict`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/factory/seeds/agent-prompts.ts
git commit -m "feat: repair_agent v2 — strategies for difficulty, distractor, linguistic, near-miss failures"
```

---

### Task 8: Seed Database with Updated Prompts

**Step 1: Run the seed API**

```bash
curl -X POST http://localhost:3000/api/factory/seed \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $SUPABASE_SERVICE_ROLE_KEY"
```

Expected: 200 OK with seed counts

**Step 2: Verify new prompt versions are active**

Query Supabase to confirm:
- vignette_writer v3 is_active=true, v2 is_active=false
- case_planner v3 is_active=true, v2 is_active=false  
- nbme_quality_validator v2 is_active=true, v1 is_active=false
- repair_agent v2 is_active=true, v1 is_active=false

---

## Week 2: Validator Enhancements (Code Changes)

### Task 9: Add New Failure Categories to Validator Report Schema

**Files:**
- Modify: `src/lib/factory/schemas/validator-report.ts`

**What:** Add 4 new failure categories for the research-identified quality gaps.

**Step 1: Write test to verify new enum values parse**

Create a simple validation test (or verify in REPL):
```typescript
// Verify these parse without error:
failureCategoryEnum.parse('too_easy');
failureCategoryEnum.parse('non_functioning_distractor');
failureCategoryEnum.parse('linguistic_tells');
failureCategoryEnum.parse('near_miss_absent');
```

**Step 2: Add new values to failureCategoryEnum**

In `src/lib/factory/schemas/validator-report.ts:11`, add after `'hinge_missing'`:

```typescript
export const failureCategoryEnum = z.enum([
  'multiple_correct',
  'wrong_answer_keyed',
  'no_correct_answer',
  'medical_error',
  'option_asymmetry',
  'stem_clue_leak',
  'scope_violation',
  'recall_not_decision',
  'explanation_gap',
  'hinge_missing',
  // Research-backed quality categories (2024-2026 studies)
  'too_easy',                    // Estimated difficulty > 0.75 — item doesn't make students hesitate
  'non_functioning_distractor',  // Distractor estimated <5% selection — effectively 4-option or 3-option item
  'linguistic_tells',            // AI stylistic markers detectable by students (redundancy, repetition, coherence)
  'near_miss_absent',            // No distractor would be correct under slightly modified conditions
]);
```

**Step 3: Run TypeScript compilation**

Run: `npx tsc --noEmit --strict`
Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/factory/schemas/validator-report.ts
git commit -m "feat: add 4 research-backed failure categories to validator report schema"
```

---

### Task 10: Add New Categories to Failure Categorizer

**Files:**
- Modify: `src/lib/factory/failure-categorizer.ts`

**What:** Add keyword matching and repair strategies for the 4 new failure categories.

**Step 1: Read current failure-categorizer.ts**

Read the file to find exact insertion points for CATEGORY_DESCRIPTIONS and REPAIR_STRATEGIES.

**Step 2: Add category descriptions**

Add to CATEGORY_DESCRIPTIONS (or equivalent mapping):

```typescript
too_easy: 'Item estimated difficulty >0.75 — likely too easy for target population. Common causes: pathognomonic presentation, only one plausible option, no competing signal, hinge too obvious.',

non_functioning_distractor: 'One or more distractors estimated <5% selection rate. A non-functioning distractor is effectively absent — it reduces the item to 4-option or 3-option, inflating difficulty index and lowering discrimination.',

linguistic_tells: '3+ AI stylistic markers detected in vignette. Prohibited phrases (presents with, notably, significant for), sentence-start repetition, smooth transitions between clinical data, or uniform sentence length.',

near_miss_absent: 'No distractor would be correct under slightly modified conditions. Without a near-miss, the item lacks genuine competition — the correct answer stands out too easily.',
```

**Step 3: Add keyword patterns for inferFailureCategory()**

Add pattern matching for:
- `too_easy`: keywords `['too easy', 'difficulty', 'estimated.*correct', 'pathognomonic', 'obvious']`
- `non_functioning_distractor`: keywords `['non-functioning', 'non_functioning', '<5%', 'weak distractor', 'no one would choose']`
- `linguistic_tells`: keywords `['prohibited phrase', 'presents with', 'notably', 'linguistic', 'ai tell', 'sentence repetition']`
- `near_miss_absent`: keywords `['near-miss absent', 'near_miss', 'no near-miss', 'no distractor.*correct.*different']`

**Step 4: Add repair strategies**

Add REPAIR_STRATEGIES entries following the same pattern as existing categories.

**Step 5: Run TypeScript compilation**

Run: `npx tsc --noEmit --strict`
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/factory/failure-categorizer.ts
git commit -m "feat: failure categorizer support for research-backed quality categories"
```

---

### Task 11: Add Difficulty and Distractor Metrics to Database Schema

**Files:**
- Create: `supabase-migration-v20.sql`
- Modify: `src/lib/types/database.ts`

**What:** Add columns to track difficulty estimation and distractor functioning at the item level.

**Step 1: Write migration**

```sql
-- v20: Research-backed MCQ quality metrics
-- Adds difficulty estimation and distractor functioning tracking

-- Estimated difficulty on item_draft (set by NBME quality validator)
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS estimated_difficulty numeric(3,2) CHECK (estimated_difficulty BETWEEN 0 AND 1);

-- Near-miss tracking on item_draft
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS near_miss_option char(1) CHECK (near_miss_option IN ('A','B','C','D','E'));
ALTER TABLE item_draft ADD COLUMN IF NOT EXISTS near_miss_pivot_detail text;

-- Distractor functioning estimates on validator_report (JSONB — per-option %)
ALTER TABLE validator_report ADD COLUMN IF NOT EXISTS distractor_estimates jsonb;
-- Expected shape: {"A": 0.25, "B": 0.15, "C": 0.10, "D": 0.05, "E": 0.45}
-- where the correct answer has the highest estimated selection rate

-- New failure categories in enum
ALTER TYPE failure_category ADD VALUE IF NOT EXISTS 'too_easy';
ALTER TYPE failure_category ADD VALUE IF NOT EXISTS 'non_functioning_distractor';
ALTER TYPE failure_category ADD VALUE IF NOT EXISTS 'linguistic_tells';
ALTER TYPE failure_category ADD VALUE IF NOT EXISTS 'near_miss_absent';
```

**Step 2: Add TypeScript types**

In `src/lib/types/database.ts`, add to `ItemDraftRow`:

```typescript
estimated_difficulty: number | null;
near_miss_option: 'A' | 'B' | 'C' | 'D' | 'E' | null;
near_miss_pivot_detail: string | null;
```

Add to `ValidatorReportRow`:

```typescript
distractor_estimates: Record<string, number> | null;
```

**Step 3: Run TypeScript compilation**

Run: `npx tsc --noEmit --strict`
Expected: PASS

**Step 4: Commit**

```bash
git add supabase-migration-v20.sql src/lib/types/database.ts
git commit -m "feat: v20 migration — difficulty estimation + near-miss tracking + distractor estimates"
```

---

### Task 12: Update Option Frame Schema for Near-Miss

**Files:**
- Modify: `src/lib/factory/schemas/case-plan.ts`

**What:** Add near-miss fields to the option frame schema so the case planner can declare which distractor is the near-miss.

**Step 1: Extend optionFrameSchema**

In `src/lib/factory/schemas/case-plan.ts:37`, extend optionFrameSchema:

```typescript
export const optionFrameSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D', 'E']),
  class: z.string().min(1),
  meaning: z.string().min(5),
  // Near-miss distractor fields (exactly one distractor should have near_miss: true)
  near_miss: z.boolean().optional(),              // true for the near-miss distractor
  pivot_detail: z.string().nullable().optional(),  // what single detail change makes this correct
  correct_if: z.string().nullable().optional(),    // the modified scenario where this IS correct
});
```

**Step 2: Add estimated_difficulty to casePlanSchema**

Add after `clinical_complexity`:

```typescript
  // Estimated difficulty index (0.0-1.0, target 0.55-0.70)
  estimated_difficulty: z.number().min(0).max(1).optional(),
```

**Step 3: Run TypeScript compilation**

Run: `npx tsc --noEmit --strict`
Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/factory/schemas/case-plan.ts
git commit -m "feat: option frame schema — near-miss fields + estimated difficulty"
```

---

## Week 3: Pipeline Integration + Verification

### Task 13: Wire Difficulty Estimation into Pipeline

**Files:**
- Modify: `src/lib/factory/pipeline-v2.ts`

**What:** After NBME quality validator runs, extract difficulty estimate and near-miss data from validator output and write to item_draft.

**Step 1: Read pipeline-v2.ts validation loop**

Find the section where validator results are processed (around line 560-625).

**Step 2: Add post-validation difficulty extraction**

After the validation loop completes (whether pass or kill), extract from nbme_quality validator's issues_found:
- Parse "DIFFICULTY: estimated X% correct" → write to `item_draft.estimated_difficulty`
- Parse "NON-FUNCTIONING DISTRACTOR: [letter]" → log to agent_log

From case_plan's option_frames:
- Find the frame with `near_miss: true` → write `near_miss_option` and `near_miss_pivot_detail` to item_draft

**Step 3: Run TypeScript compilation**

Run: `npx tsc --noEmit --strict`
Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/factory/pipeline-v2.ts
git commit -m "feat: pipeline wires difficulty estimation + near-miss data to item_draft"
```

---

### Task 14: Apply Migration to Supabase

**Step 1: Apply migration**

```bash
curl -X POST http://localhost:3000/api/admin/migrate \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{"sql": "<contents of supabase-migration-v20.sql>"}'
```

Expected: 200 OK

**Step 2: Verify columns exist**

Query Supabase to confirm:
- `item_draft.estimated_difficulty` exists (nullable numeric)
- `item_draft.near_miss_option` exists (nullable char)
- `validator_report.distractor_estimates` exists (nullable jsonb)

---

### Task 15: Create Research Document for Repo

**Files:**
- Create: `BLACKSTAR_MCQ_QUALITY_RESEARCH.md`

**What:** Synthesize all research findings into a permanent reference document alongside BLACKSTAR_ARCHITECTURE_SPEC.md and BLACKSTAR_RESEARCH_FOUNDATIONS.md.

**Content:** The document should include:
1. Executive summary (headline findings from 15+ studies)
2. Three universal AI failure modes (with exact metrics)
3. Three highest-impact fixes (near-miss, competing signal, linguistic tells)
4. Implementation mapping (which Blackstar component addresses each gap)
5. Measurement plan (how to verify improvements)
6. Full citation list

**Step 1: Write the document**

Use the research findings from the user's input + the memory file `reference_ai_mcq_quality_research.md` as sources.

**Step 2: Commit**

```bash
git add BLACKSTAR_MCQ_QUALITY_RESEARCH.md
git commit -m "docs: MCQ quality research synthesis — 15+ blinded studies, implementation mapping"
```

---

### Task 16: Verification — Generate 10 Test Questions and Compare

**What:** The acid test. Generate 10 questions with the new prompts and compare against the 3 previous test runs (ACS, Sepsis, PE) that were killed by validators.

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Run 10 pipeline-v2 executions**

Pick 3 topics from Phase 1 IM (include ACS and Sepsis for direct comparison):

```bash
# Run 3-4 questions each on ACS, Sepsis, PE
curl -X POST http://localhost:3000/api/factory/run-v2 \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{"shelf": "medicine", "juryEnabled": true}'
```

**Step 3: Compare results**

For each generated item, check:
- [ ] Does the vignette contain competing signals for the near-miss?
- [ ] Does the vignette avoid prohibited phrases?
- [ ] Is there sentence structure variety?
- [ ] Does at least one distractor have a near-miss designation?
- [ ] Is estimated difficulty in the 0.55-0.70 range?
- [ ] Are all 4 distractors estimated ≥5% selection?
- [ ] Does the validator catch items that are too easy?

**Step 4: Document comparison in agent_log**

Record pass/fail rates compared to pre-research baseline.

---

## Summary of Changes by File

| File | Week | Changes |
|------|------|---------|
| `src/lib/factory/seeds/agent-prompts.ts` | 1 | vignette_writer v3, case_planner v3, nbme_quality_validator v2, repair_agent v2 |
| `src/lib/factory/schemas/validator-report.ts` | 2 | 4 new failure categories |
| `src/lib/factory/failure-categorizer.ts` | 2 | Keyword patterns + repair strategies for new categories |
| `supabase-migration-v20.sql` | 2 | estimated_difficulty, near_miss_option, distractor_estimates columns |
| `src/lib/types/database.ts` | 2 | TypeScript types for new columns |
| `src/lib/factory/schemas/case-plan.ts` | 2 | near_miss, pivot_detail, correct_if on option frames |
| `src/lib/factory/pipeline-v2.ts` | 3 | Wire difficulty + near-miss data to item_draft |
| `BLACKSTAR_MCQ_QUALITY_RESEARCH.md` | 3 | Research synthesis document |

## Key Principle

Week 1 prompt changes are the highest-ROI work. The prompts already guide Claude's generation — making them more specific about near-miss design, competing signals, and linguistic naturalness will produce visible quality improvement before any code changes. Weeks 2-3 add the validator enforcement and data tracking to make improvements measurable and sustainable.
