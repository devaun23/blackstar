# Auditor Mutual NDA — skeleton

> **⚠️ This is a skeleton for attorney review, NOT a final NDA.**
>
> Per `.claude/skills/legal/SKILL.md`: contracts require actual counsel.
> The text below is a starting frame so an attorney can mark up the
> specifics. **Do not send this to an auditor as-is.** Engage a SaaS-savvy
> or general business attorney to review and finalize before any auditor
> sees pre-release content.
>
> `[LEGAL-REVIEW-NEEDED]` markers below flag specific items for counsel.
> Add a line to the Decision Log in `.claude/state/CURRENT_STATE.md` once
> the attorney review is queued.

---

## Header

```
MUTUAL NON-DISCLOSURE AGREEMENT

This Agreement is entered into as of [DATE] by and between:

Disclosing Party / Recipient: [LEGAL NAME OF AUDITOR]
("Auditor")

Disclosing Party / Recipient: Devaun [LAST NAME], an individual
operating Blackstar (an unincorporated medical-education project,
pre-LLC formation)  [LEGAL-REVIEW-NEEDED: confirm correct legal
identity — if LLC/sole-prop status changes, update this line]
("Blackstar")

(each a "Party" and collectively the "Parties")
```

`[LEGAL-REVIEW-NEEDED]`: Counsel to confirm whether Devaun should be
named as an individual (current state, no LLC) or whether LLC formation
should happen first. Auditor agreements signed as an individual create
personal liability that's straightforward but not ideal at scale.

---

## 1. Confidential Information

For purposes of this Agreement, "Confidential Information" includes,
but is not limited to:

- Pre-release question content (vignettes, stems, options, explanations)
- Pipeline architecture, agent design, rubric criteria
- Source pack selection and proprietary methodology
- Auditor's own clinical reasoning frameworks shared during audit
  feedback sessions
- Any business strategy, recruitment plans, or pricing discussed

`[LEGAL-REVIEW-NEEDED]`: Counsel to refine scope. Question content is
the critical asset; over-broad scope (e.g., "anything discussed")
becomes unenforceable.

---

## 2. Obligations

Each Party agrees to:

- Hold Confidential Information in strict confidence
- Not disclose Confidential Information to third parties without
  prior written consent
- Use Confidential Information only for the purpose of the audit
  engagement
- Take reasonable security measures (no posting items to public
  forums, no sharing with cohort-mates at competitor qbanks, no
  feeding to public LLMs)

`[LEGAL-REVIEW-NEEDED]`: Counsel to specify "reasonable security
measures" with enough specificity to be enforceable but not so much
that an honest auditor is exposed by an inadvertent device-sync.

---

## 3. Exclusions

Confidential Information does NOT include information that:

- Is or becomes publicly known through no fault of the receiving Party
- Was rightfully known by the receiving Party before disclosure
- Is independently developed without use of Confidential Information
- Must be disclosed by law (with prompt notice to the other Party)

`[LEGAL-REVIEW-NEEDED]`: Counsel to confirm standard exclusions are
adequate. The "independently developed" carve-out is especially
important for auditors who are also taking Step 2 — they can't be
forced to forget medical knowledge.

---

## 4. Duration

- This Agreement is effective from the date signed
- Confidentiality obligations survive for **90 days after pilot close**,
  where "pilot close" is defined as the date Blackstar publicly launches
  the product OR 12 months from signing, whichever is earlier
- Surviving obligations: items 1-3 above; item 5 (return of materials)

`[LEGAL-REVIEW-NEEDED]`: 90-day survival is short by industry standards
(2-5 years is typical for trade secrets). Counsel to weigh: longer
protects Blackstar but reduces auditor willingness to sign; shorter
makes the agreement easier to land. Discuss with attorney.

---

## 5. Return of Materials

Upon request or termination, each Party shall return or destroy all
Confidential Information in their possession. Auditor shall confirm
destruction in writing.

---

## 6. Conflict Disclosure

Auditor represents and warrants that, as of the date of signing, they
are NOT:

- Currently employed, contracted, or in an active reviewer relationship
  with UWorld, AMBOSS, Bootcamp.com, Divine Intervention, Anki Pal, or NBME
- Currently writing items for, or auditing items for, any commercial
  qbank
- Subject to a non-compete or NDA with any of the above that would be
  violated by signing this Agreement

If Auditor's status changes during the engagement, they shall notify
Blackstar within 5 business days and the engagement terminates.

`[LEGAL-REVIEW-NEEDED]`: Counsel to verify this representation is
enforceable and to add any other competitor names that should be
specifically listed.

---

## 7. Compensation

Compensation terms (rate, payment method, schedule) are governed by
the separate Auditor Engagement Letter (see `pilot/07-auditor-sow.md`
§6 for current terms) and are not modified by this NDA.

---

## 8. No Other Rights

This Agreement does not grant either Party any license, ownership,
or other rights in the other Party's intellectual property. Blackstar
retains all rights to its pipeline, content, and methodology. Auditor
retains all rights to their clinical knowledge, test-taking expertise,
and any frameworks they developed independently.

`[LEGAL-REVIEW-NEEDED]`: Counsel to verify the IP boundary. If
auditors generate suggested fixes, who owns the suggestions? Default
position: Blackstar owns implementations of suggestions but auditor
keeps their reasoning frameworks. Discuss.

---

## 9. Governing Law

This Agreement is governed by the laws of [JURISDICTION — auditor's
state? Devaun's state? Delaware?]

`[LEGAL-REVIEW-NEEDED]`: Counsel to recommend jurisdiction. Mixed
US-state auditor cohort makes this non-trivial.

---

## 10. Entire Agreement

This Agreement constitutes the entire understanding between the
Parties regarding confidentiality and supersedes any prior agreements
on the same subject.

---

## Signatures

```
Auditor:                          Blackstar:

_____________________             _____________________
[NAME]                            Devaun [LAST NAME]
Date: _______________             Date: _______________
```

`[LEGAL-REVIEW-NEEDED]`: Signature method — wet ink, DocuSign, or
clickwrap? Counsel to recommend based on enforceability and friction.
DocuSign is the practical default but verify the auditor's state
recognizes electronic signatures for this contract type.

---

## Tracking

Items to queue for attorney review:

- [ ] Legal identity (individual vs LLC) — §Header
- [ ] Scope of Confidential Information — §1
- [ ] "Reasonable security measures" specificity — §2
- [ ] Exclusions completeness — §3
- [ ] Confidentiality survival period (90 days vs longer) — §4
- [ ] Competitor list completeness — §6
- [ ] IP boundary for auditor suggestions — §8
- [ ] Governing jurisdiction — §9
- [ ] Signature method — §Signatures

After counsel review, also add a line to `.claude/state/CURRENT_STATE.md`
Decision Log:

```
- [DATE]: Auditor NDA finalized by [ATTORNEY NAME / FIRM]. Skeleton at
  pilot/09-auditor-nda.md superseded by final at [LOCATION]. Confidentiality
  survival period: [N] days/months. [LEGAL-REVIEW-NEEDED] removed.
```

---

**Final reminder:** This file is a structured starting frame, not a
contract. Do not send to auditors. Engage counsel first.
