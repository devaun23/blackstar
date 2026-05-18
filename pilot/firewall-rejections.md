# Firewall rejections log

Running log of items killed by the `source-firewall` skill. Each entry: one item, one or more failing checks, the smoking-gun evidence.

## Format

```
## YYYY-MM-DD — <item id or batch tag>
- Rule:       R-IP-01 | R-IP-02 | R-IP-03
- Question:   Q1 | Q2 | Q3 | Q4 | Q5 | Q6
- Verdict:    RED | YELLOW-escalated-to-RED
- Evidence:   <smoking-gun string, ≤200 chars; do NOT paste copyrighted text verbatim, paraphrase the pattern>
- Source pack: <pack id>
- Action:     killed | revised-and-regenerated | escalated-to-legal
```

## Entries

_(empty — first batch is cardiology D1.5; entries added here as they happen)_
