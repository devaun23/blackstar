# Blackstar Pilot — paste-and-ship artifacts

Each file in this folder is paste-ready copy or a runnable script for the
4-week MS3 pilot. Open one file → copy → paste into the destination tool.

## Current state (2026-04-26)

- Published items in DB: **20** (all on `shelf='medicine'`)
- Audit output: `audit-output.md` (1084 lines, every item rendered with
  the 7-point checklist as `- [ ]` boxes)
- **Decision fork** based on what the audit reveals:
  - **≥16 of 20 pass** → ship the pilot with these. 20 items = 10 users
    × 2 sessions or 5 users × 4 sessions. Tight but enough to test the
    value hypothesis.
  - **12–15 pass** → ship to 5 users only, generate 30 more items in
    parallel via `scripts/harness/`.
  - **<12 pass** → audit-fail rate is the real Week 1 blocker. Don't
    recruit users until the bank is bigger. The plan said this would
    fork here.

## Ship checklist (90 minutes tonight)

- [ ] **1. Tally form** — open `01-tally-form.md`, paste fields into a new
      Tally form. Save URL.
- [ ] **2. r/Step2 post** — open `02-rstep2-post.md`, paste into Reddit
      drafts. Replace `[TALLY URL]`. **Do not post yet** — wait for
      Tuesday/Wednesday 8–10 AM ET.
- [ ] **3. Audit pilot bank** — run `npx tsx scripts/audit-pilot-bank.ts > pilot/audit-output.md`,
      then tick boxes as you read.

## Day 2–3

- [ ] **4. Cross-posts** — `03-cross-posts.md` covers Step 2 Discord, AnKing
      Discord, r/medicalschool, r/USMLE retitling.
- [ ] **5. X thread** — also in `03-cross-posts.md`, post in parallel with Reddit.

## Once first user signs up

- [ ] **6. Concierge log** — `05-concierge-log.md` has the Notion DB schema.
      Stand up the table before User #1's first session.

## Supporting

- `04-audit-protocol.md` — the 7-point ship-ready checklist + SQL fallback if
  the script breaks.
- `06-comment-responses.md` — pre-written replies to common Reddit/Discord
  questions ("how is this different from UWorld?", "are you a doctor?",
  "is this AI? do you fact-check?").

## Frozen — do not touch during pilot

v7 explanation cutover · validator polish · vignette v5 · variant fan-out at
scale · KT/IRT/CAT · simulator tuning · master-rubric tuning · scope
expansion beyond IM · custom concierge UI.

If something here turns out to actually block a user, promote it. Until then,
frozen.

## The two metrics

1. **Block completion rate** — % users finishing ≥3 sessions
2. **NBME self-assess delta** pre/post 4 weeks

Everything else is vanity.

## Sunday cadence (1 hour, every Sunday)

1. Build — one change from this week's worst user friction
2. Measure — update Notion log
3. Learn — write **one paragraph**: *"This week we learned ___."*
4. That paragraph = Tweet 1 of next week's thread

If 3 Sundays in a row produce a paragraph that could've been written
*without users* — pivot or kill.
