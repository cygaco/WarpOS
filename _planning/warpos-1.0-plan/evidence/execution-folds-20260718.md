# Execution folds — SP-20260717-001 close + merge (2026-07-18)

**Mode:** FOLD-mode (operator constraint). Findings that touch agent/dispatch/instruction surfaces are recorded here as PLAN FOLDS for the ratified warpos-1.0 plan — NOT applied as live edits this session. No edits to `scripts/`, `.claude/commands/`, `.claude/agents/`, hooks, settings, or manifests were made producing this file.
**Provenance:** mined from this session's `events.jsonl` tail, `runtime/sp001-merge-evidence/suite-run-at-HEAD.log`, and `../WarpOS-wt/SP-20260717-001-builder/.../sp-20260717-001-gauntlet-close.md` + canonical `sp-20260717-001-gauntlet-findings.md`. Seeded from the team-lead's vantage; wording verified against artifacts where an artifact exists. Items marked **(TL-vantage)** are the team-lead's numbers I could not independently time-verify from the artifacts — carried as reported, not invented.
**Landing:** the team-lead lands this file at session close. Each fold's real integration is a plan/spec edit deferred to its target phase (post-merge, non-FOLD-mode).

---

## F1 → Phase 3 (dispatch/liveness) · merges ROADMAP item 11

**What happened:** A completion notification delivered to an ALREADY-IDLE teammate (ε) did not reliably resume it. The teammate-inbox batches-not-drops fix (landed 2026-07-17) delivers on the recipient's next yield — but an idle agent has no next yield to fire on, so the wake never lands. Result: an ~80-min ε stall (03:14-wake) plus 2 more idle-crossing incidents the same night **(TL-vantage on the timing)**. An interim liveness probe was armed as a stopgap.

**Evidence:** `events.jsonl` this session — prompt `"WATCHDOG TICK (interim liveness probe — roadmap item 11 stopgap, armed 2026-07-18 after th…)"` and `"RESUME (token limits lifted — operator-scheduled resume from 2026-07-17 ~16:40 PT pause)"`; memory `project_teammate_inbox_batches_not_drops` (batches-not-drops, delivers on next yield); `feedback_dispatch_death_diagnosis_540s_clamp` (declared-dead dispatches often complete late).

**Proposed scope line:** Awaited-dispatch watchdog — add an `expected_by` field to any awaited dispatch and run the resume-probe from a host OUTSIDE the sleeping agents (a wake must not depend on the sleeper waking itself). Promote the interim WATCHDOG TICK stopgap into the permanent mechanism; closes ROADMAP item 11.

## F2 → Phase 1 (security-panel / gauntlet-gate doctrine)

**What happened:** The SP-001 adversarial re-gauntlet ran 5 rounds and regressed into ever-narrower attacker-only residuals; every round the cross-provider lanes ground a real defect, but the loop had no built-in stop. It converged not via another round but via a scope RULING — the β discriminator (mistake-reaches-irreversible vs attacker-only-zero-new-capability) plus the P-061 honest-ceiling correction (FAIL lanes honored as real defects, yet closable by scope, not denial). Without an explicit disposition/convergence criterion an adversarial loop can round forever.

**Evidence:** `sp-20260717-001-gauntlet-close.md` — round-by-round table R1–R5; "Dispositioned residuals (attacker-only, out-of-model per the standing discriminator)"; "β confirm DECIDE 0.89 (entry 132)"; P-061 honest-ceiling; operator threat-model rulings (adversarial-helm containment DROPPED; gate = mistake/overclaim quality control).

**Proposed scope line:** Every adversarial review loop carries an explicit DISPOSITION/convergence criterion — a binding discriminator (mistake-reachable-AND-irreversible = must-fix; attacker-only-zero-new-capability = dispositioned out-of-model) and an honest-ceiling rule (P-061) so a FAIL verdict is honored as a real defect yet closable by scope. Prevents infinite adversarial rounding.

## F3 → Phase 1 (model × channel routing-truth matrix)

**What happened:** `gpt-5.6-sol` deterministically dies ~350s on the security-review prompt SHAPE (3/3: 349.5s / 354.5s / 346s, real `ok:false` records) **(TL-vantage on the exact timings)** while running fine on backend-prompt shapes; `gpt-5.6-terra` runs clean on the same security lane including a 607s run. Model liveness is a function of prompt-shape × model × channel, not the model alone — and the same id can be live via one channel and absent via another.

**Evidence:** `sp-20260717-001-gauntlet-findings.md` I-1 (`gpt-5.6-terra` WORKS via codex CLI but FAILS via the harness Agent-tool/API route — same harness-spawn class as the β `gpt-5.6-sol` failure); `sp-20260717-001-gauntlet-close.md` round table (security-GPT reap→FAIL→PASS across rounds); `events.jsonl` prompts `"What happened with SOL? Are you sure it was a reap, and not just a really long run?"` and `"Was our failing sol agent cli or api?"`. Extends learnings-store N3 (CLI-live-vs-API-absent) with the prompt-shape dimension.

**Proposed scope line:** Routing truth records prompt-shape × model × channel liveness (not just model × channel). A model that dies on one prompt shape but lives on another needs a per-shape route/fallback; the effective model and the terminal outcome are recorded per dispatch.

## F4 → Phase 3 (record shapes / dispatch ledger) · ED-210

**What happened:** The role-registry types `security-reviewer` as CLI-only, so a sanctioned in-process 2nd-family (Claude) security pass cannot write a ledger completion record. The round-5 Claude lane fell back to a verdict-with-evidence-file workaround (`out-security-claude-r5.txt`) that `gauntlet-verify` cannot read as a liveness record. Logged as ED-210; ADR-0016 (in-process-claude-hunter) is the precedent that this record shape must exist.

**Evidence:** `sp-20260717-001-gauntlet-close.md` Liveness § — "Claude in-process lane = verdict-with-evidence-file (`out-security-claude-r5.txt`), ED-210 registry-type record gap noted"; findings I-2 (provider-id `antigravity` vs tool-id `agy` mismatch context in the flipped panel).

**Proposed scope line:** Define a ledger record shape for a sanctioned in-process cross-family review pass (ED-210) so an in-process Claude security hunter writes the same `ok:true` evidence-bound record `gauntlet-verify` reads — the ADR-0016 precedent generalized to the security lane.

## F5 → Phase 3 (ED-070 dispatch-record fields) · ED-213

**What happened:** A billing-surface claim ("the API is being billed / an API key is needed") was asserted from memory and was false — a 2026-07-17 stale-read triggered a false spend escalation; the operator corrected it ("nothing should be billing the API; this should work, no API key needed"). Billing-surface facts must be READ from the record's `auth_mode` stamp, never recalled. Logged ED-213.

**Evidence:** `events.jsonl` prompts `"Was our failing sol agent cli or api?"` and `"Hm. I don't think anything should be billing the API. This should work, no API key needed."`; memory `project_codex_two_billing_surfaces` (interactive Codex bills the ChatGPT plan; CLI `codex exec` bills the auth.json API key; probe the wrapper + read `auth_mode`).

**Proposed scope line:** Any billing-surface / spend claim is READ from the dispatch record's `auth_mode` stamp (never from memory); a spend escalation fires only on a record-grounded `auth_mode`, and the record carries the effective billing surface.

## F6 → β / gauntlet doctrine (standing mechanism for out-of-model findings)

**What happened:** The F-ROT-4 disposition used a disposition-POINTER mechanism — a ledger line + a delta-note recording WHY a residual is out-of-model (discriminator applied + ADR/ED pointer) — so that when a later review lane re-raises the same finding it self-closes against the recorded disposition instead of re-litigating. This worked live across rounds 4–5 (containment held; each subsequent RED strictly narrower).

**Evidence:** `sp-20260717-001-gauntlet-close.md` — "Dispositioned residuals … formally dispositioned"; F-ROT-4 SINK_CAPS-mutable β DECIDE 0.90 → ADR-0017 / ED-211; per-residual ADR/ED pointers (ED-210/211/212); "O_EXCL per-entry index files stay NAMED as the mitigation if the threat model ever admits archive-dir-write attackers".

**Proposed scope line:** Adopt a standing disposition-pointer mechanism — every out-of-model / attacker-only residual gets a ledger line + delta-note (discriminator applied, ADR/ED pointer) so a re-raising lane self-closes against the recorded disposition. Makes F2's convergence durable across rounds and sessions.

---

## Fold → phase index

| Fold | Target phase | Tracked id | Merges |
|---|---|---|---|
| F1 | Phase 3 (dispatch/liveness) | — | ROADMAP item 11 |
| F2 | Phase 1 (security-panel doctrine) | P-061 | — |
| F3 | Phase 1 (model×channel matrix) | extends store-N3 | — |
| F4 | Phase 3 (record shapes) | ED-210 | ADR-0016 precedent |
| F5 | Phase 3 (ED-070) | ED-213 | — |
| F6 | β / gauntlet doctrine | ED-211/212 | ADR-0017 |
