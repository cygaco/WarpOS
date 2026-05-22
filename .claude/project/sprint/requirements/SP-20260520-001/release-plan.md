# Release Plan — `/product:clone`

**Sprint:** `SP-20260520-001`
**PRD:** `.claude/project/sprint/requirements/SP-20260520-001/prd.md`

> Honored by `/sprint:release`. Lists the conditions under which the sprint may ship. This is a framework-additive sprint (new skill + new generator + new template dir + paths.json key registration) — likely a minor version bump (0.8.x → 0.9.0) gated on the standard WarpOS release pipeline.

## Required to ship

- [ ] All `done` tickets meet their AC.
- [ ] All blocking issues are resolved, deferred with rationale, or explicitly accepted.
- [ ] PRD requirements R-1 through R-11 satisfied (or explicitly deferred to a follow-up sprint with a ticket).
- [ ] COPY (`C-1` through `C-12`) satisfied per `copy.md`.
- [ ] INPUTS (`IN-1` through `IN-8`) validated per `inputs.md`.
- [ ] TRACE events (`TR-1` through `TR-7`) fire as documented in `trace.md`.
- [ ] Acceptance criteria (`AC-1.1` through `AC-14.3`) satisfied per `acceptance-criteria.md`.
- [ ] QA plan passing per `qa-plan.md` — every smoke check and per-story regression green.
- [ ] Redteam plan passing per `redteam-plan.md` — all 16 threat classes addressed; no stop-the-bus signals.
- [ ] External service dependencies: WebFetch + WebSearch (harness-provided, no signup); pandoc + yt-dlp (soft, auto-detected).
- [ ] No `secret: true` env-var values appear in any tracked file (none expected — no API keys in this sprint).
- [ ] Release approval recorded in `approvals/` per `CLAUDE.md#Autonomy`.

## Pre-ship checklist (specific to this sprint)

- [ ] **Docs updated.**
  - `.claude/commands/product/clone.md` exists, frontmatter valid, links resolve.
  - `README.md` skill count refreshed (this sprint adds 1 skill — recount).
  - `USER_GUIDE.md` "Core Skills" table updated if it references the product:* family.
  - `AGENTS.md` / `CLAUDE.md` left unchanged (no agent-level changes).
- [ ] **ESDs verified.**
  - WebFetch + WebSearch listed in `.claude/project/sprint/external-services/` with `status: ready_for_terminal_work`.
  - pandoc + yt-dlp ESD records marked `optional` with auto-detect behavior described.
- [ ] **Smoke runs against ≥1 real competitor.**
  - At least one end-to-end run against a real public product (e.g. `/product:clone --name "Linear" --url "https://linear.app"`) completed in dev with the deliverable manually inspected.
  - Operator-grade check: emitted MD is "good enough" to hand to `/sprint:plan` (subjective, but documented in the release log).
- [ ] **Partial-deliverable mode tested.**
  - Run with one mocked review-source 429 → deliverable contains `[GAP — reviews — http_429: ...]` and exit code is `0`.
  - Run with all sources failing → exit `3` (no usable sources).
  - Run with `--strict` and one failure → exit `5`.
- [ ] **Paths registered without clobbering.**
  - Before-state: `.claude/paths.json` snapshot taken.
  - After first run: `clones` + `clonesCurrent` present; all other keys unchanged.
  - After second run with different slug: `clones` unchanged, `clonesCurrent` updated.
  - JSON validity assertion runs after every step.
- [ ] **Cache + privacy posture.**
  - `_docs/clones/*/[_]raw/` is in `.gitignore` (or the operator is reminded with a one-line `note:`).
  - Emitted MD/HTML/DOCX contains no raw HTML cache paths, only original source URLs.
- [ ] **Bytewise determinism of cache filenames.**
  - Two runs against the same URL produce the same `<sha>.html` filename — `paths.clones` consumers can deduplicate by hash.

## Release artifacts

- [ ] Changelog / release notes drafted — covers the new skill, the two paths keys, the optional pandoc/yt-dlp behavior.
- [ ] Docs updated (above).
- [ ] Analytics/events: 7 new event types added to `paths.eventsFile` schema; downstream `/check:patterns` and `/events:query` work without changes (event types are free-form strings).
- [ ] Migration plan: `none_required` — the skill is purely additive. The two new paths keys are introduced lazily on first emit, so installs without a clone run never see them.
- [ ] Rollback plan: `rm -rf _docs/clones/<slug>/`; revert `.claude/paths.json` to pre-run state (the two keys); revert the sprint merge commit. No data migration; no consumer breakage.

## Monitoring after release

- [ ] **First real-target dogfood.** Operator runs `/product:clone` against the next legitimate competitor target within 1 week of release. Result captured (good/bad/needed-flags) and either logged as a learning or filed as a recurring issue.
- [ ] **Event-rate check.** Tail `paths.eventsFile` for 1 week; assert `clone_started` count == `clone_emitted` count (every run that started, finished). Mismatches = silent crashes.
- [ ] **Hallucination-rate check.** Tail `attribution_stripped` events for 1 week; if `stripped_count >> 0` consistently, the LLM prompts for voc extraction need tuning — log as a recurring issue.
- [ ] **Cost surface.** Sum `extraction_completed.tokens_in + tokens_out` over the first week; flag for tuning if average exceeds ~50K tokens per run.

## Approval

Production deploy (release capsule + `git push origin main` + tag) requires explicit user approval per `CLAUDE.md#Autonomy`. Record the approval id in `releases/<id>.yaml#approval_ref`.

## Documentation scaling

Required for `documentation_scale: m | l | xl`. Sprint scope is `l`, risk is `medium`, so this file is in-scope.
