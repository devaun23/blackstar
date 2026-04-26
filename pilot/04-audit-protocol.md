# Pilot bank audit — 7-point ship-ready checklist

Goal: 50 IM items you trust enough to put in front of a real MS3.

## How to run

```bash
npx tsx scripts/audit-pilot-bank.ts > pilot/audit-output.md
```

The script outputs every published item joined to its blueprint node
(filtered to IM shelf), with the 7-point checklist as `- [ ]` boxes
inline. Open `audit-output.md` in your editor and tick boxes as you read.

## The 7-point checklist (all must pass for an item to ship)

1. **Stem reads NBME** — no AI tells, no abbreviations, dual temperature
   (°C and °F), `/min` for vitals, `mm Hg` for BP
2. **Lead-in is a standard NBME form** — "Which of the following is the
   most likely diagnosis?" / "Which of the following is the most
   appropriate next step?" / "Which of the following is the most likely
   cause of this patient's findings?" etc.
3. **All 5 options are plausible to a competent MS3** — no obvious throwaways
4. **Correct answer is NOT the longest option** — known AI tell, NBME
   prohibits
5. **At least one distractor is the confusion-set partner** — the thing this
   case is most easily mistaken for. This is the anchoring trap.
6. **Explanation tells you why each wrong answer was tempting** — not just
   why the correct one is right
7. **No medical errors** — the only check you can't outsource

## Decision rule

- **8+ of 10 sampled items pass** → use this pipeline output as your
  starter bank. Pull 40 more the same way.
- **6–7 pass** → ship the 6 that pass cleanly, audit the next 20 to find
  more.
- **<6 pass** → audit-fail rate is your real Week 1 priority, not
  recruiting users yet. Do not ship to real students until you can pull
  50 clean items in <3 hours.

## Manual SQL fallback (if the script breaks)

```sql
select
  d.id,
  n.shelf,
  n.topic,
  n.subtopic,
  d.correct_answer,
  d.created_at
from item_draft d
join blueprint_node n on n.id = d.blueprint_node_id
where d.status = 'published'
  and n.shelf = 'medicine'  -- this is the IM shelf in the enum
order by d.created_at desc
limit 50;
```

Then for each row, render in your DB tool of choice and apply the 7-point
checklist by eye.

## What to do with rejected items

Don't fix them during the pilot. Note the failure category in a
scratchpad — those are the bugs you fix in Week 2 or later, only if
they're blocking real users. Per the freeze: validator polish is not v2
work.
