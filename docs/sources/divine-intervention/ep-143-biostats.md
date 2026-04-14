---
episode: 143
title: "Biostats Review"
shelf: biostats
topics: [biostatistics, sensitivity, specificity, ppv-npv, study-design, statistical-tests, screening, epidemiology]
status: uploaded
uploaded_at: 2026-04-14
cross_checked: false
---

# Diagnostic Test Properties

## Sensitivity & Specificity

Sensitivity = of all people with disease, what % have positive test results?
- The remainder = false negatives (FN)
- Highly seNsitive tests have a low fNr (false negative rate)
- Example: Sensitivity 80% → 20% of people with disease will have a negative test (false negatives)

Specificity = of all people without disease, what % have negative test results?
- The remainder = false positives (FP)
- Highly sPecific tests have a low fPr (false positive rate)
- Example: Specificity 90% → 10% of people without disease will have a positive test (false positives)

## SPin & SNout

SNout = highly Sensitive test + Negative result → rules OUT disease (low FNR)
SPin = highly Specific test + Positive result → rules IN disease (low FPR)

## Screening vs Confirmatory Tests

High sensitivity → good screening tests (don't miss people with disease)
- Example: ELISA for HIV screening
High specificity → good confirmatory tests (don't mislabel people without disease)
- Example: Western Blot after positive ELISA (no longer standard in most places)

## PPV & NPV

PPV = % of people with positive test results who have disease
NPV = % of people with negative test results who don't have disease

Do NOT confuse:
- Sensitivity = % of people with disease who have positive results
- PPV = % of people with positive results who have disease
Switch the words before and after "who have" → learn one, the other is the reverse

On ROC curves:
- Highest PPV region → highest sPecificity region (does not miss anyone without disease)
- Highest NPV region → highest seNsitivity region (does not miss anyone with disease)

## Effect of Prevalence on PPV/NPV

As prevalence increases → PPV increases, NPV decreases
As prevalence decreases → PPV decreases, NPV increases

Intuition: If someone comes to ED in December with fevers + rhinorrhea + myalgias → likely flu. Negative flu swab less believable during high-prevalence period (low NPV). Positive test more believable when disease is common (high PPV).

Changes in prevalence do NOT affect sensitivity or specificity (only test modifications like changing cutoff values change these)

## Cutoff Values

Lowering the cutoff → more people test positive → catches more disease → sensitivity increases
When seNsitivity goes up → Npv goes up
When sPecificity goes up → Ppv goes up
Sensitivity & specificity move in opposite directions when cutoff changes

## Likelihood Ratios

Patient has positive test → use positive LR formula: Sensitivity / (1 - Specificity)
Patient has negative test → use negative LR formula: (1 - Sensitivity) / Specificity

Positive LR tells you how much MORE likely disease is given a positive result
Negative LR tells you how much LESS likely disease is given a negative result

Example: Sensitivity 90%, Specificity 45% → Positive LR = 0.9 / (1 - 0.45) = 0.9 / 0.55 = 1.64


# Epidemiologic Measures

## Incidence vs Prevalence

Incidence = # of new cases diagnosed within a specific time period
Prevalence = # of people alive with disease AT a given time point

Drug that improves survival → prevalence increases (more people living with disease), incidence stays the same (still diagnosing at same rate)

## Relative Risk

RR = risk in exposed / risk in unexposed
Example: 100/500 smokers get LC, 50/500 non-smokers get LC → RR = 20%/10% = 2 (2-fold increased risk)
Used in cohort studies

## Odds Ratio

OR = (exposed & affected × unexposed & unaffected) / (exposed & unaffected × unexposed & affected)
Mnemonic: Logical people product (LGP) / Weird people product (WPP)
Used in case-control studies

Example: 100 exposed+disease, 50 exposed+no disease, 80 unexposed+no disease, 70 unexposed+disease
OR = (100 × 80) / (50 × 70) = 8000/3500 = 2.29

## NNT & NNH

NNT = 1 / Absolute Risk Reduction
NNH = same formula but harm rate in treatment group exceeds placebo

Example: 40 get drug D, 8 die (20%). 40 get placebo, 20 die (50%). ARR = 50% - 20% = 30% = 0.3
NNT = 1/0.3 = 3.3

Shortcut: Take 1 / (difference in risk between 2 groups). Always write higher risk first.


# Study Designs

## Case-Control Studies

Best for studying RARE phenomena with limited time frame
Two groups with similar characteristics: Group 1 has disease, Group 2 does not
Ask about past exposures → recall bias is prominent issue
CCS generate odds ratios (NOT relative risk)
CCS/cohort studies deal with exposures; RCTs deal with interventions

Example conclusion from CCS: "Asbestos exposure causes mesothelioma" (exposure, not intervention)
NOT valid CCS conclusions: "Drug X decreases pain" (intervention → needs RCT)

## Cohort Studies

Two groups with differential exposures → follow into future for outcome
Can be prospective or retrospective
Generate relative risk


# Statistical Concepts

## Confidence Intervals

95% CI calculation: Mean ± (Z-score × SEM)
SEM = SD / √n
Z-score for 95% CI ≈ 2 (1.96 precise)

Example: Mean 170, SD 15, n = 81 → SEM = 15/√81 = 1.67 → CI = 170 ± (2 × 1.67) = 166.66 to 173.34
Interpretation: 95% confident the true population mean falls within this range

Key rules for interpreting CIs:
- A ratio qty (e.g., RR, OR) → non-significant if CI crosses 1
- A difference qty (e.g., ARR) → non-significant if CI crosses 0
- When 2 CIs overlap → no significant difference between treatments
- The study result must fall WITHIN the CI, never BEGIN or END it
- Tighter CIs = more precise, but less room for error

## P-Values & Statistical Significance

P-value = probability results occurred by chance
P < 0.05 = statistically significant (unless told otherwise)
P of 0.05 (1 in 20) is worse than P of 0.01 (1 in 100)
Lower P-value → more confidence in results

Statistical significance ≠ clinical significance
A BP drug that lowers BP by 1 mmHg at P < 0.01 → useless drug

## Standard Deviations & Normal Distribution

68% within 1 SD, 95% within 2 SD, 99.7% within 3 SD
Example: Mean CD4 1000, SD 100 → 95% fall between 800-1200
→ 5% fall outside → 2.5% below 800, 2.5% above 1200

## Skewed Distributions

Normal distribution: mean = median = mode
Alphabetical order: mean < median < mode (remember: M-M-M in order)
Negatively skewed (flat portion at left): mean < median < mode
Positively skewed (flat portion at right): mean > median > mode
Mean is most affected by extreme values (outliers)

HY bimodal distributions: Hodgkin's lymphoma, slow/fast acetylators

## Power & Type I/II Errors

Type I error (alpha) = incorrectly reject the null hypothesis (false positive conclusion)
Type II error (beta) = incorrectly accept the null hypothesis (false negative conclusion)
Power = 1 - beta

Increase power by:
- Recruiting more people (better approximation of population)
- Larger effect size (comparing scores of 25 vs 100 > comparing 99 vs 100)
- Increased precision of measurements (data clusters around 1 value)
- Using stricter P-value (P 0.01 > P 0.05 for power)

## Other HY Concepts

ROC curves: best test (highest combined sensitivity + specificity) = upper left corner
To compare means of 2 groups → T-test. For > 2 groups → ANOVA (F) test
Lead time bias: erroneously thinking survival improved when you just detected disease earlier
