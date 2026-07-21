# SP-20260720-002 — Phase 4 design brief (conductor's grounded framing → design consults author PRD/stories/AC + build_spec)

This is ε's grounded framing for the design phase. product-lead authors the PRD (R-N) / stories (H-N/S-N) / acceptance criteria; director-of-engineering authors the build_spec (FE/BE split, integration-seam owner, backend-first). This brief is the input, not the authored spec.

## The one-sentence goal
Ship the **trusted enforcement adapter**: a single trusted CONTROLLER that is the ONLY route into `main`, which validates a candidate's exact base+tree hashes, runs a **content-addressed pinned checker bundle from OUTSIDE the candidate's writable domain**, and integrates exactly the checked tree by atomic CAS — closing ED-215 (+ ED-236 H5/C4-adjacent) and flipping the CORE-2 `trust-boundary-trusted-layer-sole-integrator` conformance fixture from report-only to BINDING.

## Build-on (do NOT rebuild) — the exact seams
- `scripts/dispatch/acceptance-record.js` — DONE + 5-round hardened. `produce()` (trusted-verifier only), `authorizesIntegration()` (mandatory identity+freshness+lease+recompute+ancestry, fail-closed), `commitIntegration()` (atomic `git update-ref <ref> <new> <expected>` CAS behind `performRefUpdate`). The CONTROLLER is the CALLER these were built for (none exists yet).
- `scripts/checks/acceptance-read-choke-point.js` — the LEXICAL guard (defense-in-depth) with an explicit honest ceiling: *"The DEFINITIVE close of the lexical ceiling is the Phase-4 pinned external trusted checker."* Phase 4 IS that close.
- `scripts/dispatch/conductor-lease.js` (acquire/verifyToken/reclaim, O_EXCL + monotonic fencing token, 3-state liveness) — the controller binds the lease fencing token into the AcceptanceRecord (SEC-4 seam already wired in acceptance-record).
- `scripts/dispatch/do-not-reopen.js` (settle/isSettled/supersede) — settled-decision ledger.
- `.claude/kernel/` — top-level-runtime-contract.md §1/§7 (CORE-2 = trusted layer SOLELY owns integration-to-main), support-matrix.json (helm contract), conformance fixtures + `scripts/checks/conformance-matrix.js` (the runner that flips report-only→binding).
- `scripts/dispatch/panel-lanes.js` (getProfile/requiredLanes/validatePanelManifest) — required/optional lane semantics to reuse for the helm runner.

## Units (design phase confirms/refines; DoE draws the FE/BE line — here it's all BE/security)
### Unit CONTROLLER (backend) — the sole integration principal
- Inputs: a candidate {base_commit, result_commit/tree}, its ResultEnvelope (UNTRUSTED), the WorkOrder, the destination ref.
- Flow: (1) validate exact base+tree hashes against real git objects; (2) run the pinned checker bundle from OUTSIDE the candidate tree (Unit BUNDLE); (3) `produce()` the AcceptanceRecord bound to WorkOrder-digest + **check_suite_version** + evidence + destination ref; (4) `authorizesIntegration()`; (5) `commitIntegration(performRefUpdate:true)` — atomic CAS, the ONLY mutation into main.
- Covers sol-A1(b), sol-A2 caller, **G4.2** (base+tree hash validated; check→merge head-advanced-after-check REFUSES), **G4.3** (fail-closed default-deny: missing/crashed/timed-out/malformed/stale/partial/unknown/silently-skipped REQUIRED check → BLOCKED), **G4.4** (PREVENTION: protected ref refuses un-brokered merges via sole-principal CAS; pre-commit documented as NON-authority).

### Unit BUNDLE (security) — content-addressed pinned checker bundle
- A bundle manifest content-hashing the checker set (helpers/deps/config/executable-resolution) with controlled promotion. Evaluated from OUTSIDE the candidate's WRITABLE domain (candidate edits to enforcers/CLAUDE.md/AGENTS.md/shims are untrusted changes, never affect which checker runs).
- Covers sol-A1(c), **G4.1** (checker-poisoning fixture: candidate modifies its own enforcer → flagged untrusted, gate evaluates from the pinned copy), **G4.6** (checker self-modification test).

### Unit HELM-RUNNER (backend) — sol-A3 aggregate runner (supersedes G4.5)
- One fail-closed runner: clean-install black-box flow from EVERY CONTRACTED helm + security profile; honors profile required/optional semantics via panel-lanes. `panel-2family` floor (GPT+Claude required); absent OPTIONAL agy lane ≠ block; an optional lane that RAN and FAILED binds. NEVER treat an agy route/default as served-model proof.
- Covers G4.5 → sol-A3; the G4.5 exit proof = one full WorkOrder→Envelope→checked-integration pass on a NON-Claude lane (codex) with portable invariants (started/completed/died/timed-out/quota/approval/resume) recorded by the dispatch control plane.

### Unit LIBRARY+FIXTURES (backend/security) — shared check-set + gate fixtures + ED-215 close
- Shared check library consumed 3 ways: Claude hooks (early prevention), git pre-commit (fast feedback, explicitly NOT authoritative — its bypassability proven harmless to the boundary), trusted controller (authoritative).
- G4.1–G4.6 as REQUIRED-PRESENT falsifier fixtures (Phase-3 `scripts/dispatch/falsifiers/*.falsifier.test.js` is the shape). Flip CORE-2 conformance fixture report_only→binding. Honest-promise statement (G4.6). Close ED-215 (+ note ED-236 H5).

## BLOCKING design→build record-trust gate (record-trust-gate.md doctrine — REQUIRED before build)
Enumerate every reader-trusts-record-to-gate-irreversible-action surface + its choke-point + structural guard + session-scope partition + required-present fail-open falsifier fixtures:
1. **AcceptanceRecord → merge (CROSS-SESSION):** choke-point = `commitIntegration`/`authorizesIntegration` (in-primitive fail-closed, exists); guard = `acceptance-read-choke-point.js` (lexical) + the Phase-4 pinned external checker (the definitive non-lexical close). Falsifiers required-present: forged / unsigned / stale-base / self-asserted-success (Phase-3 falsifiers exist) + NEW head-advanced-after-check (G4.2), un-brokered-merge-bypass (G4.4).
2. **Pinned checker bundle → which checker runs (BUNDLE integrity):** choke-point = the out-of-tree bundle resolver + content-hash pin; guard = candidate cannot influence checker selection (writable-domain partition). Falsifiers required-present: checker-poisoning (G4.1), checker-self-modification (G4.6).
3. **Helm-lane record → exit-proof (panel profile):** choke-point = panel-lanes required/optional semantics; guard = absent-optional ≠ pass-of-required, optional-ran-FAILED binds. Falsifier: kill-a-REQUIRED-lane → BLOCKED (never PASS).

## PLAN-CONSULT FOLD — convergent refinements (DoP gpt-5.6-sol + product-lead gpt-5.6-terra, both fallback:false real records)
Both consults independently converged on the same sharpenings — the design consults MUST adopt these:
1. **The shared check library is the BUNDLE's SOURCE, not a peer unit.** Hooks + git-pre-commit consume the library SOURCE; the CONTROLLER executes ONLY the pinned bundle's frozen, hash-verified snapshot — never a mutable workspace import. So the old "Unit LIBRARY+FIXTURES" splits: the library folds INTO Unit BUNDLE; FIXTURES/CONFORMANCE becomes an independent cross-cutting gate (fixtures live beside each owning gate, not shared production code).
2. **HELM-RUNNER is an ENTRYPOINT OVER the controller, not an independently-trusted backend path.** It drives the clean-install flow but every integration still goes through the one CONTROLLER/bundle. No parallel trusted route.
3. **Build sequence (controller lands LAST — it composes every trust seam):** freeze the bundle runner protocol + falsifier fixtures → build + pin the content-addressed bundle (immutable execution contract) → build the helm entrypoint → wire the CONTROLLER + real CAS integration → flip CORE-2 to binding.
4. **Extend the AcceptanceRecord binding:** add `check_suite_version` AND recomputed WorkOrder/policy/check/evidence digests — NOT merely non-empty digest maps (a non-empty map of stale/fabricated digests is a false-green; digests must be recomputed + bound).
5. **CONTROLLER mints a NONCE-BOUND RUN MANIFEST** listing every EXPECTED check, and rejects absent / duplicate / unknown / stale / malformed / timed-out / skipped-REQUIRED results (this is G4.3 default-deny made concrete — the anti-"stale evidence satisfies a non-empty field" defense).
6. **BUNDLE integrity mechanics:** resolve every executable/dep/config from the bundle manifest BY DIGEST; absolute execution + clean environment; hash immediately BEFORE and AFTER execution; test candidate self-modification + hostile PATH/symlink.
7. **G4.4 is a REAL bypass test** attempting a direct merge / `git update-ref` around the controller; sole-principal ref protection + CAS from the observed base to the EXACT accepted result commit.
8. **CORE-2 scope discipline:** bind ONLY CORE-2's artifact-verification + integration SLICE. Do NOT claim this scoped adapter enforces all four CORE-2 powers (capability grants / protected mutation / verification / integration) — name the honest slice.
9. **Explicitly OUT (both consults):** agy probing/activation, panel-3lab proof, credential isolation, OS/adversarial containment, product readiness, generalized checker/plugin frameworks, and unrelated AcceptanceRecord refactoring.

## REVISED unit decomposition (post-fold — 4 units, library folded into bundle)
- **Unit BUNDLE (security):** content-addressed pinned checker bundle + immutable execution contract + the shared check-library source (consumed by hooks/pre-commit as source; by the controller as the frozen hash-verified snapshot). Covers sol-A1(c), G4.1, G4.6.
- **Unit CONTROLLER (backend):** sole integration principal; nonce-bound run manifest (default-deny); `check_suite_version` + recomputed-digest AcceptanceRecord binding; base+tree hash validation; produce→authorize→commitIntegration CAS. Covers sol-A1(b), sol-A2 caller, G4.2, G4.3, G4.4.
- **Unit HELM-RUNNER (backend):** aggregate fail-closed entrypoint OVER the controller across contracted helms × profile required/optional semantics; panel-2family floor. Covers sol-A3 (supersedes G4.5).
- **Unit FIXTURES/CONFORMANCE (cross-cutting):** G4.1–G4.6 required-present falsifiers beside their owning gate; flip CORE-2 report_only→binding; honest-promise statement; close ED-215.

## Reviewer/effort note for the gauntlet (work-order constraint)
Reviewer lanes run at HIGH effort (ultra dies on the 540s foreground clamp). If an ultra consult is needed, hand it to α for a run_in_background dispatch.

## Out of scope (honest-promise boundary — do NOT build)
Credential isolation, OS sandboxing, adversarial-helm containment, product readiness. 1.0 = kernel readiness. The gate catches MISTAKES and overclaims, not a hostile operator.
