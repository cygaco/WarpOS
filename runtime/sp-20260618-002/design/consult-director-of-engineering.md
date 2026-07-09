# Director-of-Engineering consult — SP-20260618-002 (E-MC-READINESS-ANALYSIS-001) design boundary
*(READ-ONLY advisory; spawned by α as the in-process relay-hand at ε's design-boundary request. Real Agent return, elapsed ~74.7s.)*

**Contracts judged:** build_spec (BUILD-SPEC.md, precedence 70) realizing PLAN-SYNTHESIS; foundation = test-sealed-capsule-gate.js. Analysis-only invariant is the load-bearing constraint.

## (a) A1 hardening-sim envelope

**Command surface (anti-sprawl line).** Exercise the CONSUMER-REACHABLE command FLOW, not every script. IN: the install/update spine A1 already reaches (`setup → scan:install → sprint → telemetry → update`, both roles × cold+warm) + EXTEND to the headless-Console entry verbs: `/sprint:full` (no-`--sprint` path), `/portfolio:new` + in-place `spinup`/scaffold, `/warp:update` apply+rollback, `/admin:*` + `/panel:*` only where they mutate shared state. OUT (archaeology): `/research:*`, `/scan:*` internals, dev-tooling skills, non-shipped scripts, redteam/qa lanes. **The line: "would the Master Console invoke this verb programmatically against a fresh consumer repo?" Yes → in; No → archaeology, cite-and-skip.**

**Failure-mode focus (highest-leverage NEW signal).** Track-3 enumerated the 5 structural classes at the UNIT level. A1's unique value = the command-FLOW COMPOSITION the sealed-env reveals and a static read cannot: run the real lifecycle in isolation and confirm WHICH of C1–C5 actually FIRE end-to-end vs are masked by an earlier step. Highest-leverage single probe: drive the **warm/update + parallel-resume cell** in the sealed repo with a **BOM-injected `framework-installed.json`** — composes C1 (BOM read) × C2 (non-atomic write) × C5 (`dest` traversal) in one flow and tells the execution epic whether the foundation gate already catches them or they slip the sealed contract. Frame every finding as **CONFIRMS-track3-Cx / NEW-at-flow-level / REFUTES** with the sealed-run evidence (confirm/refute, not re-derivation).

**No-modify method.** Reuse the foundation's own mechanism: `seal → isolate(os.tmpdir, canonical-unreachable) → lifecycle` with injectable `runStep`/`runCell` (already built, lines 408–598) — simulate against the SEALED payload, never canonical. Read/grep/glob for surface discovery; dry-run `--status`/`--check` read-only flags; sealed repo is disposable (`rmSync` in finally). **ASSERT it: A1's doc records "0 writes outside _reports/ + runtime/sp-20260618-002/ + tmp" — that assertion is itself the enforcer for the simulate-while-analysis-only constraint.**

## (b) Diff-scope-gate engineering call — RULING: ε's resolution is CORRECT, adopt it (confidence 0.86)

ε's shape (runtime helper + inline light-gauntlet check THIS sprint; "promote to a permanent enforcer" routed as an EXECUTION finding) is the ONLY shape that respects analysis-only without self-contradiction:
- **Contract-First:** a committed `scripts/checks/analysis-only-gate.js` puts a write under `scripts/` — a forbidden-diff path in the build_spec's own forbidden_diff_paths. The gate would FAIL ITSELF on first run. That's the contract correctly rejecting an out-of-scope write, not a paradox. The durable need (a permanent enforcer) is preserved as a register finding — right.
- **Enforcer-over-checklist + fail-closed:** the runtime helper is a REAL enforcer (`git diff --name-only main...HEAD` ⊄ allowlist → non-zero). It MUST fail closed: empty/error diff, detached HEAD, or git failure → FAIL, never silent-green (the false-green class).

**Rejected alternatives:**
- *"gate lives only in the gauntlet command, never a committed file"* — weaker: a gate with no committed test of its own logic can't prove it fails closed. Keep the logic in a `runtime/sp-20260618-002/` helper WITH a negative-case self-check; the inline check delegates to it.
- *"extend scope-contract-guard.js in EXECUTION"* — WRONG SEAM: scope-contract-guard is a dispatch-TIME guard (checks a builder's prompt carries a contract, lines 142–157), architecturally wrong for a post-hoc diff-scope gate. The execution finding should say **"add a new analysis-only-diff-gate.js (or generalize framework-purity.js, which already does `git diff --name-only`) as a post-hoc close-gate, allowlist-parameterized"** — two times (write-time vs merge-time), two enforcers. Naming the wrong one creates a seam-ownership defect downstream.

## ⚠️ THE ONE OPEN ITEM β MUST CLOSE BEFORE SIGNING (real, confirmed at BUILD-SPEC.md:108–112)
A3 edits ROADMAP.md + TRACKER.md (hash-tracked, BC-02/BC-05) → the manifest regen touches `_warpos/MANIFEST.json` + framework-manifest (GENERATED views). **The diff-scope gate WILL see those manifest paths in the diff and, if the allowlist is literal, FAIL CLOSED on a legitimate doc-reconcile.** RESOLUTION: the allowlist must include the regenerated manifest paths AS generated-artifact-of-an-allowed-doc-edit, OR the gate classifies generated-manifest deltas separately from source edits. This is a contract-completeness gap in the allowlist (NOT a reason to weaken the gate) — close it in the build_spec BEFORE β signs, or the first green A3 run RED-fails its own gate. **This is the single thing that would change my confidence on (b).**

— Alex, DoE. Both calls decisive; the manifest-regen allowlist entry + the correct-enforcer naming are what β must confirm before signing.
