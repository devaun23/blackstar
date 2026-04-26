# Notion concierge log — schema

Stand this up *before* User #1's first session. Estimated setup: 15 min.

## Database name

`Blackstar Pilot — Concierge Log`

## Properties (in order)

| Property | Type | Options / notes |
|---|---|---|
| User | Title | the user's first name + school |
| Email | Email | |
| School / year | Text | e.g. "UCSF MS3" |
| Onboarded date | Date | |
| Sessions completed | Number | manually update each week |
| Last question id | Text | item_draft UUID |
| Last answer | Select | A · B · C · D · E |
| Correct? | Checkbox | |
| Cognitive error tag | Select | options below ↓ |
| Repair strategy used | Select | advance · reinforce · contrast · remediate · transfer_test |
| Next question assigned | Text | item_draft UUID |
| Time-to-answer (sec) | Number | |
| Confidence 1–5 | Number | from feedback form |
| Notes | Text | |
| Last touch | Date | for "stuck users" filter |

## Cognitive error tag options

Use the canonical 12-category taxonomy from
`src/lib/factory/seeds/error-taxonomy.ts`:

1. anchoring
2. availability_heuristic
3. premature_closure
4. base_rate_neglect
5. confirmation_bias
6. transfer_failure
7. recall_failure
8. discrimination_failure
9. context_failure
10. surface_feature_focus
11. probability_neglect
12. action_class_confusion

Match these exactly so the manual tags can later be diff'd against what
the automated repair engine *would* have chosen. The wizard-of-oz manual
tags are your training data.

## Views

- **Active this week** — filter: `Last touch ≥ 7 days ago`
- **Stuck users** — filter: `Sessions completed = 0` AND `Onboarded > 3 days ago`
- **Error pattern by user** — group by User, count by cognitive_error_tag
- **Error pattern globally** — group by cognitive_error_tag, count rows

## How to use it

After every wrong answer a pilot user submits:

1. Open the user's row in Notion (or add a new row if first answer)
2. Read the question + the wrong answer
3. Pick the cognitive error tag (≤30 sec — your gut is right enough)
4. Pick the repair strategy:
   - `contrast` if the wrong answer was the confusion-set partner
   - `remediate` if this is the 3rd time on the same cognitive_error
   - `advance` if right and fast
   - `reinforce` if right but slow
   - `transfer_test` if right at high difficulty
5. Pick the next question manually from your audited bank
6. Email/Slack the user the next question link

Time per user per session: ~5 minutes once you're warmed up. With 10
users and 3 sessions/week that's 2.5 hours/week of concierge work.

## When to stop concierge mode

Two signals:

1. **Volume**: when concierge work exceeds 5 hrs/week, automate the most
   obvious tag (likely `anchoring` — easy to detect from confusion-set
   partner being chosen).
2. **Calibration**: when your manual tag agrees with the existing repair
   engine's automated tag ≥80% of the time across 50+ samples, you can
   trust the engine for that error type.

Don't automate before either signal. The manual labels are the training
data — burning them by automating early is exactly the inversion that
kills the experiment.
