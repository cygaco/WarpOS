<!-- EPIC TRACKER — spec §22. Linked from ../../ROADMAP.md § Epics. Template: ../templates/EPIC_TEMPLATE.md
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# E-SYSTEM-ORG-001 — Agent-System Organization & Canonical Source-of-Truth Cleanup (`.system` files/folders)

- **Epic label and number:** E-SYSTEM-ORG-001
- **Title:** Agent-System Organization & Canonical Source-of-Truth Cleanup (`.system` files/folders)
- **Owner:** President Agent
- **Parent roadmap area:** [../../ROADMAP.md](../../ROADMAP.md) § Epics → Active epics (⭐⭐ TOP, operator-directed 2026-06-07)
- **Goal:** ONE canonical source of truth per agent-system artifact — no duplicate, drifted, orphaned, or mispointed `.system` files/folders. End the recurring "agents keep skipping/misreading the dispatch guide" class and its siblings by removing the structural ambiguity the ADR-0007 org-rewrite left behind.
- **Background:** Operator-directed 2026-06-07 ("add figuring all this out to the top of the roadmap; pull in the tasks on fixing the organization and all the 'system' files and folders"). Forced by a live, diagnosed instance this session: `agent-dispatch-guide.md` exists TWICE and has drifted — `.claude/project/reference/agent-dispatch-guide.md` (197 ln, edited 2026-06-05, post-ADR-0007 roles; the one `paths.agentDispatchGuide` + the session-start banner + CLAUDE.md correctly point to) AND `.claude/agents/.system/guides/agent-dispatch-guide.md` (243 ln, edited 2026-06-02, pre-ADR-0007, orphaned from the pointer but sitting in the intuitive agent-tree home). Both `owner=framework` → both ship downstream. The maintained canonical is in the *unintuitive* place and a stale copy squats in the *intuitive* place, so operator + agents keep pointing at different files; `scan:references` can't catch it (both files exist = not a broken ref; it is content drift). Root pattern: ADR-0007 copied artifacts into the new `.claude/agents/` tree while the maintained canonical stayed at the old location, leaving duplicate/orphan/mispointed canonicals across `.system`.
- **Scope:**
  - S-1 — AUDIT (analysis-first, NO changes): enumerate every duplicate-basename / drifted / orphaned / mispointed canonical across `.claude/agents/**` (especially `.system/**`) and `.claude/project/reference/**`; for each, name the ONE canonical (content-currency + ADR-0007 home) and the disposition (merge→delete, repoint, or remove). Output a frozen findings inventory.
  - S-2 — Dispatch-guide consolidation (the proven first fix): produce ONE canonical `agent-dispatch-guide.md` = current 197-ln content + folded-in still-useful bits from the older copy (the codex-CLI `codex login` auth table + concurrency caps); repoint `paths.agentDispatchGuide` (framework/paths.registry.json) + the session-start banner (`scripts/hooks/session-start.js`) + CLAUDE.md; delete the duplicate; both-layers (specs + scripts/paths) per the rename-cutover-covers-both-layers rule.
  - S-3 — Absorb **E-DISPATCH-INTEGRITY-001 F-4/F-5**: de-dot + restructure the agents folder to one visible convention (no `.system`/`_system`/`.system.md` collision); `cli.js` skip-by-visible-`_` not `startsWith(".")`; both-layers rename.
  - S-4 — Absorb **ED-026 / scan:cutover-completeness**: extend the cutover-completeness gate from raw-deleted-literal greps to duplicate/drift detection.
  - S-5 — Absorb the **"Maintainer canonical scrub orchestration"** Sprint-10 candidate + **E-BOUNDARY-001**: move WarpOS-as-product specs out of canonical root, flip `ROOT_LEAK_PENDING_SCRUB`, the operator-scoped repo move the framework can't self-execute.
  - S-6 — ENFORCER: a duplicate-basename-drift detector (the gap `scan:references` misses — two shipped framework files, same basename, drifted content) wired into `/scan:full` + release gates; so this class is self-detecting going forward.
- **Out of scope:** E-DISPATCH-INTEGRITY-001 F-1/F-2/F-3 (dispatch coverage-honesty / two-world seam / gauntlet-verify correlation — a different slice; stays in that epic). Content rewrites of the guides beyond the merge (that's `/skills:edit`-style authoring, not org).
- **Current state:** Active — the additive dispatch-shape FOUNDATION (PLAN §17.2 steps 1–3) shipped 2026-06-08; the destructive consolidation/de-dot/renames (S-2/S-3/S-7) remain DEFERRED behind a full isolated dry-run.
- **Percent completion:** ~25% — the safety kernel + dispatch-contract keystone + N-1 run-ledger/coverage-gate + P5 fixture harness are built, cross-provider-reviewed (GPT-5.5 FAIL→fixed), and green-tested (additive, nothing destructive). The dispatch-guide consolidation (S-2), de-dot (S-3), duplicate-drift enforcer (S-6), and the flip-to-blocking (§4) remain.

## Definition of Done
- [ ] S-1: a frozen duplicate/drift/orphan/mispointed inventory across `.claude/agents/**` + `.claude/project/reference/**`, each with named canonical + disposition.
- [ ] S-2: ONE `agent-dispatch-guide.md`; `paths.agentDispatchGuide` + banner + CLAUDE.md all resolve to it; the duplicate is deleted; `scan:references` green; no stale copy ships.
- [ ] S-3: agents folder de-dotted to one visible convention; `scan:role-parity` + `scan:cutover-completeness` + `test-dispatch-config.js` green after the both-layers rename.
- [ ] S-4: cutover-completeness gate also fails on duplicate-basename drift.
- [ ] S-5: WarpOS-as-product specs out of canonical root; `ROOT_LEAK_PENDING_SCRUB` flipped; boundary gate blocks.
- [ ] S-6: duplicate-basename-drift enforcer wired into `/scan:full` + release gates; a planted drifted duplicate FAILS it.

## Related definitions
- Wiring, Verification, Source of truth, Evidence — see ../../TRACKER.md

## Related sprints
- S-1 audit — Planned (analysis-first; produces the frozen findings)
- S-2 dispatch-guide consolidation — Planned (the proven first fix)
- S-3 agents-folder de-dot — Planned (absorbs E-DISPATCH-INTEGRITY-001 F-4/F-5)
- S-4 cutover-completeness extension — Planned (absorbs ED-026)
- S-5 canonical scrub + boundary closure — Planned (operator-scoped; absorbs E-BOUNDARY-001)
- S-6 duplicate-drift enforcer — Planned (the self-detecting backstop)

## Dependencies
- None hard. Complements E-DISPATCH-INTEGRITY-001 F-1/F-2/F-3 (coverage-honesty slice). Absorbs E-DISPATCH-INTEGRITY-001 F-4/F-5, ED-026, the Maintainer-canonical-scrub Sprint-10 candidate, and E-BOUNDARY-001.

## Blockers
- None currently recorded. (S-5's repo move is operator-scoped — the framework cannot self-execute it.)

## Risks
- Deleting/moving a canonical file without first proving which copy is current (mitigated by analysis-first S-1).
- Both-layers rename missing the imperative layer (scripts/paths/hooks) — the recurring "cutover covers both layers" bug class; S-3 must repoint specs AND scripts.

## Change log
- 2026-06-07 — Epic created (operator-directed to TOP). Consolidates the dispatch-guide duplication finding + the scattered org/`.system` cleanup tasks (E-DISPATCH-INTEGRITY-001 F-4/F-5, ED-026, canonical-scrub, E-BOUNDARY-001) into one owned epic.
- 2026-06-08 (PM) — **EXECUTION session 1 — the additive dispatch-shape FOUNDATION (PLAN §17.2 steps 1–3, all additive).** Built + green-tested, nothing destructive, nothing committed-then-broken:
  - **P5 fixture harness** (`scripts/checks/lib/fixture-harness.js`) — sealed-fixture + planted-violation convention; meta-enforces "no enforcer test without a planted violation that fails" (PLAN §12 P5).
  - **N-3 auth-resolver** (`scripts/dispatch/auth-resolver.js` + test) — in-code dotenv parsing (kills the `export $(grep .env|xargs)` injection, §16.2), full source precedence (override key-file → env → .env.local → .env → ~/.gemini/.env → OAuth), labels-not-values, BOM-safe, lists checked sources, verify-before-declaring-available probe seam.
  - **Safety kernel** (`scripts/dispatch/safe-spawn.js` + test) — trusted tool-ID→absolute-path (model never picks the exe; PATH/PATHEXT-hijack guard), input-gate flag/subcommand allowlist (not just metachar refusal), encoding/newline normalization, tree-kill. §16.3/§17.3.
  - **Dispatch-contract KEYSTONE** (`.claude/agents/_org/dispatch-contract.json` + `scripts/dispatch/dispatch-contract.js` + test) — the §17.1 dispatch analogue of role-registry.json; per-role/skill allowed shapes·tool·cwd·file-scope·env·secret·timeout·budget·output·coverage, role class DERIVED from the registry. `validateDispatch` encodes the 3 operator failures as violations (API-when-CLI / in-process-when-subprocess / skipped-coverage). Consumer: dispatch-claude.js consults it (report-only).
  - **N-1 run-ledger + coverage gate** (`scripts/dispatch/coverage-gate.js` + test; `run_id`/`phase_id`/`plan_item_id`/`prompt_digest`/`shape`/`tool_id` stamped on BOTH wrappers' completion records) — a backing `ok:true` record is the precondition for "covered" (kills RC-2 sprint theater); report-only (§4 ramp).
  - **Cross-provider security review** (GPT-5.5 via dispatch-agent.js — dogfooding the dispatch-shape thesis): returned **FAIL** with a real CRITICAL (assertArgs skipped the universal injection check on consumed flag VALUES → `-o ...x&calc` reached `cmd.exe /c` for a .cmd shim, a CVE-2024-27980 bypass) + a HIGH (`-o` temp prefix-match `TempX`⊃`Temp`) + 2 MEDIUM (PATHEXT attacker-controlled; validateDispatch should reject build_chain→in-process independent of the contract). ALL FIXED + permanently guarded with new planted-violation tests; re-reviewed.
  - **Wiring (report-only):** `node scripts/dispatch/dispatch-contract.js validate` added to `/scan:full` (Dispatch-shape integrity gate). scan-coverage + dispatch-routing-parity green.
  - Tests: fixture-harness selftest + auth-resolver 11/11 + safe-spawn 17/17 + dispatch-contract 15/15 + coverage-gate 7/7 (30 planted-violation/fail-closed assertions). Existing dispatch tests unbroken (dispatch-claude 9/9, gauntlet-verify, test-registry-roles 23/23).
  - **Next:** S-2 dispatch-guide consolidation + the §17.2 destructive tranche (de-dot, renames) behind a full isolated dry-run (§14 + §17.6 preconditions); flip the report-only enforcers to blocking (§4 step 8); refactor the existing wrappers/providers.js to ROUTE THROUGH safe-spawn + auth-resolver (currently new-code-only).
- 2026-06-08 (AM) — **Design + analysis session (planning only).** Full analysis + design lives in **`runtime/agent-system-plan/PLAN.md`** (§0–§17) with `GO.md` as the execution entry point. The epic was **reframed by the operator into the broader "WarpOS dispatch-shape reliability system"** — agents + skills are one problem (best dispatch shape per unit). Added scope folded into the design doc (this epic remains the TOP/first concrete workstream): a machine-readable **dispatch-contract keystone** (PLAN §17.1, the highest-leverage piece); **skill-execution-routing** with an earn-it ladder (runs §13.6 / pays+good §13.7 / benchmark §17.5); **N-1/N-2/N-3** dispatch integrity (binding coverage gate + CLI-vs-API policy + auth-resolver); **tool-use reliability** (the Grep-glob false-negative, ED-033) + the **isolated-testing-for-everything** mandate; role renames `learner→ops-analyst`/`stub-scaffold→skeleton-builder`/`consult+advisor→cabinet`; **S-8 file-usage trace** + **S-9 Dispatch-Console GUI refresh**; a **Phase-0 feasibility+isolated-dry-run gate**; and the o3 deep-research + GPT-5.5 (×2) hardening (PLAN §16/§17). **Corrected sequencing (PLAN §17.2): the safety kernel + dispatch-contract + fixture-harness + file-usage-trace precede any destructive rename/delete.** Evidence: PLAN.md, `runtime/research/dispatch-subprocess-safety/openai-report.md`, the two `gpt55-*-output.json` consults. Current next action → run PLAN §14 Phase 0 on the operator's "go".
