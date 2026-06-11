<!-- requirement-format-legacy -->
# PRD — E-LIFECYCLE-001 close-out fix sprint — 17 REAL + 4 PARTIAL GPT 2nd-pass findings (team-guard/mode-guard bypass classes, turbo spend/auth integrity, coverage-gate waiver+expected-source, provider-tier false-green, planning-principles enforce path, ac-coverage fail-closed) + NOTAGAIN §8.3 legacy scoping

**Sprint:** `SP-20260611-002`
**Plan Contract:** `PC-20260611-0074`
**Status:** draft
**Documentation scale:** `m`

## Outcome

The lifecycle/turbo/coverage enforcement layer stops being bypassable-by-design-gap: no planted-marker/team/mode spoofs, no silent kill-switches, no turbo auth widening or spend-ledger resets, no provenance-free waivers, no false-green enforcers (provider-tier, planning-principles, ac-coverage) — so the operator can flip gates to blocking with real confidence.

## Context

### Original Request

> DUMP Actionable #2: (a) GPT 2nd-pass batch on the W1+W2+W3 gemini-only security lanes (§H list in the epic). (b) Flip ramp prep. (c) Epic → Completed + reconcile. Epic next-action #1: GPT 2nd-pass ... Fix any new findings.

### Interpreted Intent

Clear the §H debt PROPERLY: the GPT 2nd-pass ran (3 lanes, all FAIL — 12 blockers/9 majors), every blocker verified REAL by live probes. Fix the verified findings so the report-only→blocking flip ramp becomes actually safe, the two 'READY' gates become genuinely flippable, and E-LIFECYCLE-001 can complete honestly.

### Current Behavior

All 12 blockers live-probed REAL by the verification agent 2026-06-11 (runtime/notes/elc-gpt2p-triage-2026-06-11.md): planted-state spoofing works, kill-switches are silent, turbo re-apply widens + resets spend window, waiver is provenance-free, provider-tier/planning-principles/ac-coverage all false-green under --enforce. 4 PARTIALs have verified residue (#12 expected-source, #14 nonfinite-only, #19 scan scope, #20 allowlist schema).

### Desired Behavior

Per-surface: (W1) team-guard verifies the named team really exists + readiness (config.json lookup, not presence markers); planted mode.json cannot disable gates (mode reads validated/cross-checked); kill-switch use is LOGGED loudly with operator attestation fields; lifecycle roster verify uses exact member-name matching; mode-set.js path covered (hook matcher extended or mode-set emits the lifecycle events + an enforcer detects out-of-band mode.json writes). (W2) turbo re-apply is monotonic-or-attested (scope/ceiling can only widen with fresh operator provenance recorded; granted_at preserved across re-applies so spend accrues per session); spend parsing fails HIGH on nonfinite/overflow; node-e-fs scope excludes rm/unlink destructive fs ops or the safety floor gains real non-git tracked-work-delete patterns. (Coverage) waiver requires provenance (operator/source + ts + auditable trail) and is surfaced in scan output; coverage-gate-scan gains an external expected-roles source (registry/sprint-composition derived) with legacy scoping (RECORD_BACKED_CUTOFF-style) so the flip doesn't red historic records. (W4/5) provider-tier --enforce fails on selected-tier-unmet incl. unknown-self-attested for t3-selected; malformed config FAILS CLOSED (never erases raised floors); envelope ok mirrors verdict. planning-principles gains a REAL --enforce path (exit non-zero on findings, internal errors fail closed under enforce) + scan scope extended to _planning/sprints + root plans; check-ac-coverage --enforce fails on missing/unreadable artifact; hooks-coverage allowlist entries gain owner/expiry/reason schema (stale entries flagged). (#13) wrappers pass mode to validateDispatchForClass — built AFTER SP-001 lands. Each fix exploit-tested; all existing suites green.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.
>
> This list is generated from `plan_contract.requirement_areas` (N items → R-1..R-N).
> A sprint with >3 requirement areas will have more than 3 entries here — trace.md
> and granular-stories.md reference the same R-1..R-N set (single-source, T-298).

- `R-1` — R-1 W1 gate integrity (findings #1,#2,#4,#5,#7): team-guard verifies real team existence + readiness via config lookup (no presence-marker trust, no nonempty-team_name early-exit bypass); planted mode.json cannot disable the Agent gate; kill-switch use logged loudly; lifecycle roster verify exact-match
- `R-2` — R-2 mode-write coverage (findings #3,#6): out-of-band mode.json writes (Bash-direct mode-set.js) become covered — matcher extension or mode-set lifecycle-event emission + out-of-band-write detector; mode-guard kill-switch use logged
- `R-3` — R-3 turbo auth + spend integrity (findings #8,#9,#14): re-apply monotonic-or-attested with operator provenance; granted_at preserved (spend accrues per session); nonfinite/overflow bytes fail HIGH
- `R-4` — R-4 authorization safety floor (finding #10): the tracked-work-delete floor becomes code — node-e-fs scope narrowed or floor gains non-git destructive-fs patterns
- `R-5` — R-5 coverage-gate waiver provenance + expected-source + legacy scoping (findings #11,#12; NOTAGAIN §8.3): waiver requires provenance fields + surfaces in scan output; coverage-gate-scan derives expected roles from an external source (registry/sprint composition) with RECORD_BACKED_CUTOFF-style legacy scoping
- `R-6` — R-6 provider-tier truthfulness (findings #15,#16,#21): --enforce fails on selected-tier-unmet incl. t3-selected unknown-self-attested; malformed config fails closed preserving raised floors; envelope ok mirrors verdict
- `R-7` — R-7 planning-principles real enforce (findings #17,#19): a real --enforce path (findings → exit non-zero; internal errors fail closed under enforce); scan scope extended beyond _planning/epics
- `R-8` — R-8 ac-coverage fail-closed + scoping (finding #18 + minor; §8.3): --enforce fails on missing/unreadable categories artifact; legacy scoping for historic sprints; proof-syntax note carried as documented residue
- `R-9` — R-9 hooks-coverage allowlist schema (finding #20): allowlist entries carry owner/expiry/reason; stale entries flagged by the coverage check
- `R-10` — R-10 wrapper mode binding (finding #13 — SEQUENCED AFTER SP-20260611-001 MERGE): dispatch-agent.js + dispatch-claude.js pass the live mode to validateDispatchForClass so mode_profiles/alpha_only_shapes enforce

## Non-Goals

- Do NOT execute any report-only→blocking flip in this sprint (operator words required; end-of-session batch)
- Do NOT redesign ADR-0011 turbo (spend stays report-only BY DESIGN — NOTAGAIN §8.4); fixes harden the ledger/auth integrity, not the ramp posture
- Do NOT rebuild E-LIFECYCLE's 12 sprints or re-fix NOTAGAIN §6 receipts
- Do NOT touch SP-20260611-001's six fixes (separate sprint, in flight) except the G4 sequenced ticket (R-10/#13), which builds only AFTER SP-001's WS-A dispatch-wrapper changes merge

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/hooks/team-guard.js (findings #1,#2,#4,#5) — worker bypass via nonempty team_name; presence-only .team-live marker; planted mode.json disables Agent gate; silent kill-switches | verified_from_repo |
| scripts/hooks/mode-lifecycle-guard.js + .claude/settings.json matcher (findings #3,#6) — Bash-direct mode-set.js writes mode.json outside the SlashCommand\|Skill matcher; silent disable env/file | verified_from_repo |
| scripts/teams/lifecycle.js (#7) — substring roster verify spoofable | verified_from_repo |
| scripts/turbo/apply.js + spend-ledger.js (#8,#9,#14-partial) — repeat apply widens auth without provenance; granted_at reset hides prior spend; nonfinite bytes clamp to 0 | verified_from_repo |
| scripts/hooks/authorization-gate.js (#10) — node-e-fs scope approves rmSync/unlinkSync; safety floor only checks git patterns — tracked-work delete floor is prose-only | verified_from_repo |
| scripts/dispatch/coverage-gate.js + scripts/checks/coverage-gate-scan.js (#11,#12-partial + NOTAGAIN §8.3 legacy scoping) — waiver needs only non-empty reason, zero provenance; scan derives expected only from ok:true records (self-audit) | verified_from_repo |
| scripts/warpos/provider-tier-check.js + lib/provider-tier-config.js (#15,#16,#21) — down+t3 → unknown-self-attested exits 0 under --enforce; malformed config erases raised floors; envelope ok:true on tier_short | verified_from_repo |
| scripts/checks/planning-principles.js (#17,#19-partial) — --enforce is a silent no-op (no enforce path exists); scans only _planning/epics | verified_from_repo |
| scripts/sprint/check-ac-coverage.js (#18 + minor + §8.3 legacy scoping) — missing/unreadable categories artifact → ok:true/exit 0 under --enforce | verified_from_repo |
| scripts/checks/mode-lifecycle-hooks-coverage.js allowlist (#20-partial) — allowlist entries lack expiry/owner/review schema | verified_from_repo |
| dispatch wrappers mode binding (#13) — dispatch-agent.js:508 + dispatch-claude.js — wrappers do not pass mode → mode_profiles/alpha_only_shapes dead. FILE-OVERLAP with SP-20260611-001 WS-A: build AFTER SP-001 merges | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260611-0074.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\release-plan.md`
