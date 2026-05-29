<!-- requirement-format-legacy -->
# Acceptance Criteria — Rename check: namespace to scan: + scan:full system scan

**Sprint:** `SP-20260528-001`
**PRD:** see prd.md (scaled down per Beta before_design — pure lexical rename, no redteam)

> `goal_verification.reproduction = not_applicable` in the Plan Contract
> (refactor/rename; verified at build-level, not via a regression-corpus
> fixture — the fixture system is milestone 0.17.0, the next sprint).
> Every AC therefore uses `verified_by: not_applicable — <justification>`.

## S-1 — Namespace rename (source-of-truth + compiled views)

- AC-1.1: Given the ~32 check:* skills, when renamed, then each resolves as scan:* with identical behavior and `.claude/commands/scan/` is a byte-identical regeneration of `_warpos/commands/scan/`.
  verified_by: not_applicable — scan:framework-views-fresh (build-level views==source assertion); fixtures deferred to 0.17.0.
- AC-1.2: Given issues:scan, when renamed, then it resolves as scan:issues while issues:list/log/resolve are unchanged.
  verified_by: not_applicable — skill-resolution check + /skills:cleanup.

## S-2 — scan:full aggregator

- AC-2.1: Given the old check:all parallel runner, when promoted to scan:full, then scan:full runs EVERY scan (all scan:* + scan:issues) and emits one unified full-system-scan report.
  verified_by: not_applicable — scan:full live run, build-level.

## S-3 — Caller sweep + grep-clean

- AC-3.1: Given all callers, when swept, then zero stale `check:` / `issues:scan` literals remain across scripts/agents/hooks/docs/paths.json/manifest — except intentional history/changelog/ROADMAP-archive references.
  verified_by: not_applicable — grep-clean assertion (ripgrep count == 0 outside the documented allowlist).

## S-4 — Deprecation alias shims

- AC-4.1: Given the 4 high-traffic skills, when aliased, then the old names (check:all→scan:full, check:install, check:framework-purity, check:framework-views-fresh) still resolve.
  verified_by: not_applicable — alias-resolution check (old name → new skill).

## S-5 — Manifest integrity + verification

- AC-5.1: Given the moved files, when manifests regenerate, then `_warpos/MANIFEST.json` + framework-manifest validate clean, `/skills:cleanup` reports zero broken references, and the scan:install path resolves on a fresh install.
  verified_by: not_applicable — manifest validate + /skills:cleanup + scan:install, build-level.

## ADR (owed from before_plan OPEN_ADR: true)

One-paragraph decision record: *why* check:→scan: (action-oriented verb; scan:full as the one-command full system scan), the hard-rename + 4-alias-shim choice (commit:both→commit:land precedent), and the atomic source+view+manifest sequencing (self-referential guard hazard). To be appended to the architecture decisions log in S-1.
