# Tally form — paste-ready spec

**Form name**: `Blackstar Beta — MS3 Application`
**URL slug**: `blackstar-beta`
**Estimated setup time**: 10 minutes

---

## Welcome screen (paste into Tally's first block as Heading + Paragraph)

> # Stop missing the same NBME question twice.
>
> Blackstar is an experimental Step 2 CK trainer that diagnoses *why* you
> got each question wrong — anchoring, premature closure, transfer failure
> — and routes the next question to fix that specific error.
>
> We're running a free 4-week beta with 10 MS3s. In exchange: weekly
> feedback + you share your NBME self-assess scores before/after.
>
> **Not selling anything yet.** This is a pilot to find out if cognitive-
> error diagnosis actually moves your score faster than raw question volume.
>
> Takes 90 seconds.

Submit button text: **Apply for the beta →**

---

## Fields (in order)

| # | Type | Label | Required | Notes / options |
|---|---|---|---|---|
| 1 | Short text | What's your name? | ✓ | |
| 2 | Email | Best email for the login link | ✓ | |
| 3 | Short text | School and year | ✓ | placeholder: e.g. "UCSF MS3" |
| 4 | Multiple choice | What are you currently studying for? | ✓ | IM shelf · Step 2 CK · Both · Other shelf |
| 5 | Number | Hours/week you can commit | ✓ | min 3, max 30 |
| 6 | Multiple choice | Have you taken a free NBME self-assess in the last 30 days? | ✓ | Yes — I have a score · No — willing to take one this week · No — and I'd rather not |
| 7 | Multiple choice | When's your next shelf/CK exam? | ✓ | <2 weeks · 2–6 weeks · 6–12 weeks · >12 weeks |
| 8 | Short text | **How did you hear about Blackstar?** | ✓ | **k-factor proxy — do not skip this field** |
| 9 | Long text | Anything you want me to know? | ✗ | optional |

---

## Thank-you screen (paste into Tally's end block)

> ## You're in the queue.
>
> I'll personally email you within 48 hours. If you're a good fit for the
> pilot, you'll get a login link and your first session that same day.
>
> If you want to follow the experiment in real time, I'm posting weekly
> findings on X: [@yourhandle]
>
> — [Your name]

---

## Settings

- **Logic jump**: if Q6 = "rather not" → skip to thank-you screen with
  text: *"This pilot needs the score data to measure if it works. We'll
  keep you posted when we open spots that don't require pre/post."*
- **Notification**: email yourself on every submission
- **Redirect URL**: leave blank (use Tally's thank-you screen)
- **Form behavior**: one question per page (better completion rate than
  all-on-one-page)
- **Branding**: hide Tally branding if you have a paid account; otherwise
  it's fine

---

## After saving

1. Copy the published Tally URL
2. Paste it into `02-rstep2-post.md` where it says `[TALLY URL]`
3. Paste it into `03-cross-posts.md` for the Discord/Reddit variants and
   the X thread
