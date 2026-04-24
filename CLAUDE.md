# Blackstar — Claude Code conventions

Next.js 16 + Supabase + Anthropic TypeScript (strict). Factory pipeline
generates/validates NBME items. See `BLACKSTAR_ARCHITECTURE_SPEC.md` and
the governance docs (`PRODUCT_VISION.md`, `SOURCE_POLICY.md`,
`REJECTION_RULES.md`, `BUILD_ORDER.md`) for domain context.

## Active rule sets
- `~/.claude/rules/common/*`
- `~/.claude/rules/typescript/*`

## Preferred agents (disambiguates plugin name collisions)
- code review → `pr-review-toolkit:code-reviewer`
- simplify → `code-simplifier:code-simplifier`
- architect → `feature-dev:code-architect`
- explore → `feature-dev:code-explorer`
- TDD → `everything-claude-code:tdd-guide`
- TS/Next review → `everything-claude-code:typescript-reviewer`
- Postgres/Supabase review → `everything-claude-code:database-reviewer`
- perf → `everything-claude-code:performance-optimizer`
- a11y → `everything-claude-code:a11y-architect`

## Do not invoke here
Language build-error resolvers for stacks not in this repo: Go, Rust,
Kotlin, Java, C++, C#, Dart, PyTorch, Swift.

## Commit/PR conventions
- Conventional commit subjects (`feat:`, `fix:`, `chore:` …) — match
  recent `git log`.
- Never `--no-verify`; never `git push --force` to `main`.
- Do not commit unless explicitly asked.
