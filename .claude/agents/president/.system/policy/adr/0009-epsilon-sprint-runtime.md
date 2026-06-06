# ADR 0009 — ε sprint-conductor runtime: a registry-driven lifecycle engine that REALLY dispatches (Phase D)

**Date:** 2026-06-06
**Status:** accepted
**Class:** B (architectural impact — execution model for the sprint deliver-face)

---

## Decision

Build the **ε (Alex Epsilon) sprint-conductor RUNTIME** as a registry-driven lifecycle engine (`scripts/sprint/epsilon-runtime.js`) that, at each of the six lifecycle hook-points (plan → design → build → gauntlet → release → retro), (a) resolves the matched agent-set for the step under the sprint's composition via the declarative hook-point registry (`hook-points.js#agentsForStep`), (b) **derives** each matched role's dispatch route + provider/model/residency from the role-registry keystone (no hardcoded route table — the ADR-0008 derive-from-registry pattern), and (c) produces a **REAL dispatch record** per agent on the canonical ledger `gauntlet-verify` reads — replacing `full.js`'s telemetry-only "consulted" stamp. The runtime is wired into `full.js` **additively and gated** (`--epsilon` / `--epsilon-dispatch` / `WARPOS_EPSILON_RUNTIME=on`): the default script-driven path is unchanged. With the runtime real, ε's identity spec (`epsilon.md`) is no longer DESIGN-LOCKED.

## Context

ADR-0007 introduced ε as the sprint deliver-face with an authoritative identity + contract, but left the RUNTIME design-locked ("sprint runtime built in Phase D"). Until now, sprints ran SCRIPT-DRIVEN via `scripts/sprint/full.js`, which at each completed phase emitted a `manager_consult` *telemetry* record per engaged agent (`emitPhaseConsults` → `hook-consult.js`) — a marker that the right agent *would* be engaged, but **not** a record that any agent actually ran. Two ADR-0007 ratification riders depend on the sprint path being real:

- **ED-022** — every UI-touching sprint must produce a `design-quality` `manager_consult` so `sprint-manager-consult.js` can SEE the design authority ran. The enforcer was built+tested but **inert for sprints**, because `full.js` never emitted the sprint-side design-touch trigger it keys on.
- **ED-025** — the "a dispatcher CANNOT override a binding reviewer FAIL" invariant (`adhoc-fail-override.js`) was ADHOC/γ-shaped (`GAMMA_RESULT`); it had to run on the SPRINT/ε path (`EPSILON_RESULT`) too.

The keystone design property (from the hook-point registry `_note` and ADR-0007): **adding/swapping an agent in a sprint must be a registry ROW edit, never an orchestrator edit.** A runtime that hardcoded who-dispatches-where would re-introduce the parallel-source drift ADR-0008 exists to kill. So the runtime must read the registry for *both* "who fires at this step" (the hook-point registry) and "how is this role dispatched" (the role-registry).

## Options considered

1. **Registry-driven runtime, additive + gated (chosen):** a lifecycle engine that derives the agent-set AND each role's route from the two registries, writes real completion records, and is opt-in behind a flag so the script path is untouched.
2. **Rewrite `full.js` into an ε orchestrator:** replace the script-driven phases with ε-conducted dispatch wholesale.
3. **Leave telemetry-only:** keep `emitPhaseConsults`; accept that ED-022 stays inert for sprints and ED-025 never covers ε; defer the runtime indefinitely.

## Decision criteria

Scored against `paths.decisionPolicy`. The criteria that mattered most:

| Criterion | (1) Registry-driven + gated | (2) Rewrite full.js | (3) Telemetry-only |
|---|---|---|---|
| Closes ED-022 + ED-025 | high | high | none |
| Single source of truth (no hardcoded routes) | high | medium | n/a |
| Reversibility / blast radius | high (flag-gated, additive) | low (destructive rewrite) | high (no change) |
| Script path stays green | high (unchanged) | low (replaced) | high |
| Honesty of "green" (liveness vs marker) | high (real records) | high | low (marker ≠ ran) |

## Why this option won

Option (1) closes both riders while preserving the proven script-driven path as the default — the additive+gated shape means a regression in the runtime cannot break a sprint that does not opt in, and reversal is a one-line flag flip, not a re-rewrite. Option (2)'s wholesale rewrite carries the exact "destructive rewrite of a working path" blast radius the locked-build discipline (and the memory `beta-no-regress-locked-build`) refuses on a design-locked deliverable: ε's spec is locked, so the build advises HOW (the runtime), never descopes the script path. Option (3) leaves two ratified invariants hollow — the aspirational-vs-enforced anti-pattern this company refuses to ship (CLAUDE.md "Policy & Enforcement Hygiene"). The registry-derived route resolution is the same single-source win ADR-0008 booked for the dispatch consumers, extended to the sprint conductor: a role's provider/model/build-chain membership is read, never copied.

## The registry-driven dispatch model

The runtime hardcodes **no** route table. For each role in a step's matched agent-set, `resolveRoute(role)` reads the role-registry row and derives:

| Registry signal | Route | Used by |
|---|---|---|
| `build_chain: true` | `dispatch-claude` (reap-guarded `-w`) | frontend/backend/security builders, fixers |
| `provider: claude` + `claude_pinned: true` | `agent-tool` (multimodal, Claude-pinned) | design-quality, visual-review |
| `provider: claude` + `kind: tool` | `claude-raw` (`claude -p --agent`) | test-runner, learner-on-claude |
| `provider: claude` (lead/director/manager) | `claude-agent` (in-process Agent dispatch) | product-lead, director-of-engineering, … |
| `provider: openai \| gemini` | `dispatch-agent` (cross-provider CLI) | qa/frontend/backend/security reviewers, design-lead, learner |

The two record kinds the runtime emits are complementary, not redundant:
- **`manager_consult`** (coverage) — proof the right agent was engaged at the right step. `sprint-manager-consult` + `sprint-hook-coverage` read it. (Unchanged emitter; the runtime re-emits the identical set, so every existing enforcer keeps seeing the records — proven by the wiring equivalence test.)
- **completion record** (liveness) — proof the agent actually ran; `gauntlet-verify` reads it; **absence = death**. This is what the telemetry-only path never produced.

**Invariants enforced structurally** (not by prose): ε is the *sole* builder-dispatcher (only `build`-step builder rows carry `can_dispatch_builders`; every `design` author-consult is `can_dispatch_builders:false` — the structural twin of the advisory-row-that-dispatched hook); the gauntlet roster is *registry-fixed* (exactly `agentsForStep`'s rows, never an ad-hoc reviewer list); β is consulted at the four phase boundaries (`full.js#maybeConsultBeta` owns the halt-and-resume — ε defers those calls upward to α+β, per `epsilon.md`).

## ED-025 closure (dispatcher can't override a FAIL — on the ε path)

`adhoc-fail-override.js`'s evaluate-core is schema-tolerant across `GAMMA_RESULT` / `DELTA_RESULT` / `EPSILON_RESULT`: `DECLARED_SUCCESS = {pass, complete}`, and it keys on `units_completed` + `gate_checks[].unit` (sprint) as well as `features_completed` + `.feature` (adhoc/oneshot). The bite-test (`test-adhoc-fail-override.js` §g/g2/g3/h/h2 + CLI subprocess #7) proves an ε result that declares `status:"complete"` over a binding reviewer FAIL is REJECTED (exit 1), while an honest `status:"halted"` with the unit not completed PASSES. The ε runtime routes its OWN `EPSILON_RESULT` through this same gate via `epsilon-runtime.js#assertNoFailOverride` (fail-closed if the gate can't load) **before** declaring a sprint complete — so the can't-override guarantee holds on the SPRINT/ε path, not only adhoc/γ. The enforcement-debt entry ED-025 flips open → enforced.

## ED-022 closure (design authority ran — on a UI sprint)

`hook-consult.js#emitDesignTouch` emits the independent `ui_touched` signal on a UI/frontend composition, and `emitStepConsults` emits the `design-quality` `manager_consult` at the gauntlet step. The runtime emits both on any UI-touching conduct. Proven E2E against the real `sprint-manager-consult.js`: a UI sprint conducted by the runtime makes the enforcer report `applicable:1 / checked:1 / 0 findings` (green — no longer inert), and a negative run that emits `ui_touched` but suppresses the `design-quality` consult makes it exit 1 with `missing_design_consult` (proving non-vacuous). The enforcement-debt entry ED-022 flips open → enforced.

## Risks

1. The ε runtime's `require("./epsilon-runtime")` at the top of `full.js` crashes the orchestrator if the module fails to load — taking down the script path too.
2. A future reviewer/role rename drifts the route resolution if the role-registry row and the runtime's derivation disagree.
3. The gated `--epsilon` path could bit-rot (untested) because the default path is the script one.
4. A real conduct integration that spawns each agent (the next step beyond record-shaping) could double-dispatch or write a ledger record for an agent that did not actually run, masking a reap.

## Mitigations

1. The require is a pure module with no side effects at load (no spawn, no disk write); `emitPhaseConsults` wraps the conduct in the same `try/catch` that already makes consult-emission non-fatal — a runtime throw degrades to "no consults emitted," never a sprint crash.
2. Route resolution **derives** from the registry row (ADR-0008 pattern) — a rename updates the registry and the route with it; there is no second copy to drift. `resolveRoute` returns `route:"unresolved", resolved:false` for a role with no row (and `hook-points.validate()` already rejects a registry row that references a non-registered role upstream).
3. `epsilon-runtime.test.js` (55 assertions) + `epsilon-wiring.test.js` (6) exercise every route class, both invariants (incl. a poisoned-registry negative), the override gate, the REAL-spawn structural assertions (§7 — real spawn / reap→ok:false / in-process→no-record / recorder-refuses-without-outcome), the in-process EVIDENCE-BOUND record path (§7b — ok derived from real Agent-return bytes / 0-byte→ok:false / missing-evidence→refuse / wrong-tool→refuse), and the script↔ε coverage equivalence — the gated path is covered independent of a live sprint.
4. **UPDATE 2026-06-06 — real dispatch IMPLEMENTED + proven (the operator caught the prior shape as a fake-green).** The earlier `conductStep --dispatch` stamped an `ok:true` completion record WITHOUT spawning (`recordAgentDispatch({ ok: spawnOk !== false })`) — fabricated liveness, the exact BC-16 class. FIXED: `conductStep --dispatch` now REALLY spawns each agent via `spawnAgent`, and the record reflects the REAL outcome. The 3 CLI-routable routes shell out and capture real exit/output — `DISPATCH_AGENT` → `dispatch-agent.js`, `DISPATCH_CLAUDE` → `dispatch-claude.js`, `CLAUDE_RAW` → `claude -p --agent` (a reap = 0-byte-on-exit-0 → `ok:false`). `recordAgentDispatch` now REFUSES to write a record without an explicit boolean outcome from a real spawn (the structural fake-green guard). The 2 in-process Claude-teammate routes (`CLAUDE_AGENT` managers/leads/directors, `AGENT_TOOL` design-quality/visual-review) cannot be spawned from a node process — only the harness Agent tool can. **Increment A** (the CLI routes above) and **Increment B** (the in-process roster) are now BOTH real, with the SAME anti-fake-green floor: in `--dispatch` mode the runtime returns `{spawned:false, reason:'requires-orchestrator'}` for in-process routes (no fake record), and ε-the-agent dispatches them via `Agent(subagent_type:<role>)` then writes the completion record with `epsilon-runtime.js record-inprocess --evidence <file>` — whose `ok` is DERIVED FROM the real Agent-return byte count (0-byte = reap → `ok:false`; missing evidence → REFUSE, no record; a CLI-route role → REFUSE, wrong tool). It cannot stamp `ok:true` out of thin air. PROVEN end-to-end: (A) real `gpt-5.5` (315s) + `gemini-3.1-pro-preview` (107s) CLI dispatches through ε wrote real completion records; (B) a real `product-lead` Agent-tool spawn → `record-inprocess` wrote an evidence-bound record (`via:epsilon-agent`, 514 real bytes, `evidence_sha`). The structural assertions are wired into `scripts/sprint/epsilon-runtime.test.js` §7 + §7b (55 assertions).

## Reversal plan

The runtime is additive and flag-gated. Reverting = stop passing `--epsilon` (the default already is the unchanged script path), or revert the three small `full.js` edits (the require, the `emitPhaseConsults` branch, the call-site opts) — the `epsilon-runtime.js` module then sits unused. Cost: one revert commit; no data migration (records are gitignored runtime). Reversal signal: the ε-conducted path emits records that diverge from the script path's coverage (the wiring equivalence test would catch this pre-merge) or a runtime load failure that the non-fatal wrap somehow doesn't contain.

## References

- Extends ADR-0007 (ε identity + the design-locked runtime) and ADR-0008 (derive-from-registry; the route-resolution pattern this reuses).
- Implementation: `scripts/sprint/epsilon-runtime.js` (+ `epsilon-runtime.test.js`, `epsilon-wiring.test.js`); `scripts/sprint/full.js` (gated `--epsilon` wiring); `scripts/checks/adhoc-fail-override.js` + `test-adhoc-fail-override.js` (ED-025, already landed in v0.2 `0eb5a8d`); `scripts/sprint/hook-consult.js` (ED-022 emitter).
- Enforcers (self-detecting): `scripts/checks/sprint-manager-consult.js` (ED-022, non-vacuous), `scripts/checks/adhoc-fail-override.js` (ED-025, fail-closed), `scripts/sprint/hook-points.js#validate` + `scripts/checks/sprint-hook-coverage.js` (registry coherence + forward coverage).
- Enforcement-debt: ED-022 + ED-025 → `enforced` (operational flip in the gitignored register, per the ED-023 precedent in `95ebfed`).
- `epsilon.md` — DESIGN-LOCKED banner lifted by this ADR (runtime is real).
