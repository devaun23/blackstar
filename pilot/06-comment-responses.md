# Pre-written replies to common comments

For Reddit and Discord. Paste as-is or lightly edit. The rule: hard
questions get hard answers, not marketing. Concede true points, agree to
measure, move on.

---

## "How is this different from UWorld?"

Your highest-leverage thread. Always reply.

```
Three differences:

1. UWorld scores you per question. Blackstar scores you per *cognitive
   error pattern* across questions. By Week 2 you should see something
   like "you've stopped repeating anchoring errors but still struggle
   with transfer in atypical presentations."

2. The next question is picked specifically to fix the error you just
   made — not the next item in a block.

3. The explanation tells you *why your specific wrong answer was
   tempting*, not just why the right answer is right. The distractor
   that fooled you is treated as data, not noise.

Whether those differences actually move your score faster is exactly
what this pilot tests. UWorld might still win — that's a result I'd
publish too.
```

---

## "Are you a doctor / who's vetting the medical accuracy?"

```
Honest answer: I'm not a physician. Every question goes through a
validator pipeline that includes a clinical-accuracy check, an
exam-translation check, and a contraindication safety gate. For the
pilot I'm hand-auditing every item before it goes to a user — 7-point
ship-ready checklist, no medical errors is the one check I take
personally.

If you spot something wrong, I want to know immediately. Real medical
errors get the item pulled within an hour and refund the user's time.
```

---

## "Is this AI-generated? Do you fact-check?"

```
Yes, AI-generated, with a multi-stage validation pipeline (9 validator
agents + a multi-model jury for the high-cost checks). For the pilot
I'm also hand-auditing every item against a 7-point checklist before
it ships.

Why I think AI generation is okay here: most question banks are also
written by humans working from the same source guidelines that the AI
reads. The validators in my pipeline are doing what a content editor
would do — checking lead-in form, option symmetry, distractor
plausibility, and most importantly that the wrong answers are
*meaningfully* wrong (not just textually wrong).

That said: if the data says my output is worse than UWorld, I'll
publish that and stop. This pilot is the test.
```

---

## "What's your school / are you affiliated with [institution]?"

```
[Your school + year], unaffiliated with any institution or commercial
question bank. This is a self-funded experiment.
```

---

## "Why only IM? Why not [other shelf]?"

```
Beachhead strategy — IM has the broadest content overlap with Step 2
CK and the most established pedagogical scaffolding (Divine
Intervention, AMBOSS, etc.) so it's the fastest place to validate
whether cognitive-error tagging works at all. If it works, surgery /
peds / OB-GYN / psych / FM follow.
```

---

## "How will you protect my NBME score data?"

```
Your name/email + score never leave my Supabase. Pilot data is reported
in aggregate only ("median delta across 10 users was X"). You can
delete your data at any time — just email me. RLS is enforced at the
DB level so even if my server is compromised, your data is encrypted
and scoped to you.
```

---

## "Will this be free forever?"

```
For the pilot cohort: yes, free for the 4 weeks and then continued
free access if the data shows it worked for you. Long-term pricing
TBD — if and only if the value hypothesis validates. I'm not going
to charge for something that doesn't move scores.
```

---

## Skeptical comment with no question (e.g. "this is a scam" / "just use UWorld")

Don't argue. Concede the implicit point and move on.

```
Fair skepticism — there's a lot of low-quality AI question banks out
there right now. The pilot is exactly how I find out if mine is one
of them. If after 4 weeks the data says UWorld alone wins, I'll post
that and you can say "told you so." Either way you'll have data.
```

---

## "Can I see a sample question first?"

Yes — and this is a good signal of a high-intent user.

```
Sure. Here's a sample IM item with the cognitive-error tagging shown:

[paste one of your audited ship-ready items, with the cognitive error
each distractor exploits called out below the explanation]

If you want in: [TALLY URL]
```

Pre-prepare 2–3 sample items before posting so you can paste them
within 5 minutes of being asked. Pick items with non-obvious
distractors so the cognitive-error tagging is visibly useful.

---

## "I'm an MS4 / resident / not in the target group — can I still join?"

```
Pilot needs MS3s for the cohort consistency, but I'd love your eyes on
the questions if you have time. DM me and I'll send you 5 items —
your feedback is gold, and if it works for MS3s I'll open MS4 spots
in the next cohort.
```

(Resident/MS4 critique is high-signal even if they're not the target
user.)
