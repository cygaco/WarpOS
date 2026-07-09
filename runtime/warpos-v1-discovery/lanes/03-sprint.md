# Sprint System — Discovery Report (disc-sprint, 2026-07-09)

## Lifecycle map

Phases (`scripts/sprint/epsilon-runtime.js:85`): `plan → design → build → gauntlet → release → retro`. Each phase skill (`.claude/commands/sprint/*.md`) delegates to a script:
- **plan** → `plan.js` writes a Plan Contract (`plan-contracts/PC-*.yaml`) + `add-sprint.js` registers the sprint in `active-sprints.yaml` and scaffolds `sprints/<id>/progress.yaml`.
- **design** → `design.js` produces PRD/stories/COPY/TRACE/AC and mints tickets via `ticket.js`.
- **execute** → `execute.js` runs per-ticket plan/act/test/review/record loops; `checkpoint.js` writes crash-safe progress.
- **release** → `release.js`; **retro** → `retrospective.js`.
- **Orchestrator**: `full.js` (1987 lines) is the state machine chaining all phases under one invocation, and the ONLY place β is consulted.

**Who advances state**: `full.js` + per-phase scripts write `sprints/<id>/progress.yaml` + `active-sprints.yaml` (writers: `full.js`, `checkpoint.js`, `plan.js`, `add-sprint.js`, `init.js`, `fs.js`). There is NO single guarded transition function — any script can mutate progress directly.

**β consult** (`full.js:682` `maybeConsultBeta`): halt-at-each-boundary protocol. At phases 2–5 boundaries, if no `--beta-verdict` supplied → returns `ok:false, halt_reason:"beta_consult_pending"` and stops (`writeHaltReport` :416). A verdict is only RECORDED when the run is resumed with `--beta-verdict` + `--beta-message`; three runtime guards refuse a bad record: empty message (:744), non-substantive/canned <40-char-or-no-token (:785), invalid verdict (:726). Recorded to `state.betaConsultations` + `emit("sprint_full_beta_consult")` (:821). **Key finding**: the β record IS required to advance — but ONLY inside `full.js`. Solo mode skips β entirely (:684). ESCALATE is a hard halt (:865).

**ε participation**: `full.js:181` — `epsilon: process.env.WARPOS_EPSILON_RUNTIME === "on"` (default OFF), `epsilonDispatch:false`. The ε-conducted path (`conductStep`) only activates via `--epsilon`/`--epsilon-dispatch` flag or env. Default path is the "bare consult emitter" — byte-for-byte the pre-ADR-0009 behavior (:93). **ε is opt-in, not required.**

## Enforcement map

| Gate | Enforcer | Trigger | Class | Blocks what |
|---|---|---|---|---|
| β consult per boundary | `full.js:maybeConsultBeta` halt | runtime, inside `full.js` only | MECH-CLAUDE | advancing a phase in `full.js` w/o a recorded verdict |
| β verdict honesty (canned/empty/dup) | `full.js:744/785` per-msg + `checks/sprint-beta-honesty.js` C3/C4 | runtime (per-msg) + release-build audit | MECH-CLAUDE + SCAN-ONLY | placeholder verdicts; cross-sprint dupes at release |
| ticket `--sprint` required | `ticket.js:243` bucket-bleed guard | runtime | MECH-NEUTRAL | mis-bucketing **only when >1 active sprint** |
| ε liveness (stalled conductor) | `checks/epsilon-liveness.js` | on-demand / scan | SCAN-ONLY | nothing at runtime; exit-1 report |
| in-process completion honesty | `epsilon-runtime.js:634` `recordInProcessCompletion` | only when ε-dispatch used | MECH-NEUTRAL | fake `ok:true` — ok derived from evidence bytes, refuses w/o `--evidence` |
| design-quality consult coverage | `checks/sprint-manager-consult.js` | audit | SCAN-ONLY | nothing at runtime |
| β honesty release gate | `warpos/release-build.js:79 betaHonestyGate` | release-build | SCAN-ONLY | release on NEW findings only (legacy exempt) |

**What stops a helm hand-running a sprint without full.js / β / ε / hand-built tickets? — Effectively NOTHING (proven).** `ticket.js`, `checkpoint.js`, `plan.js`, `design.js`, `release.js` are all independently callable; none require `full.js`, a β record, or an ε lease. The β gate lives *inside* `full.js` — bypass `full.js` (call phase scripts directly, or hand-edit `progress.yaml`) and no β record is ever demanded. The only runtime refusal in the entire path is `ticket.js`'s bucket-bleed guard, and it fires only with 2+ active sprints (single active sprint → mints freely, no `--sprint`). There is **NO lease, NO WorkOrder, NO SprintRoom** concept anywhere (`grep -w lease|WorkOrder|SprintRoom` = 0 real hits; every "lease" match was a substring of "release"). Corpus-level β/ε honesty is caught only *post-hoc* by audit scans at `/scan:full` and release-build.

## Live-state (real output)

`node scripts/sprint/status.js`: severe drift. **87 registry entries** in `active-sprints.yaml` vs **98 dirs on disk**. Registry statuses: 40 `planning`, 37 `retrospected`, 15 `closed`, 6 `done`, 1 `superseded`.
- **3 missing-subdir** (registry entry, no files): `SP-20260524-002/003/004`.
- **2 orphaned** (on disk, not in registry): `SP-20260619-001`, `_no-active-sprint`.
- **~30+ zombie "releasing"** sprints stuck at `release` phase for weeks (all `SP-20260513-00x`, `SP-20260518-00x`, `SP-20260610-00x`) — never reached terminal state.
- Status tool (derives live phase from `progress.yaml`) disagrees with registry on many rows (`releasing`/`designing`/`not_started` vs registry `planning`), exposing that `active-sprints.yaml` status is stale/unreconciled.

## Resumability

Partial. `progress.yaml` + `active-sprints.yaml` + Plan Contract + tickets persist to disk; `full.js` resume reconstructs from `--resume --pending-phase`. **BUT `state.betaConsultations` is freshly `[]` every resume process** (`full.js:778`, one-consult-per-resume) — cross-boundary β history is NOT in files during a run, only in the append-only events log (reconstructed by audit). The β verdict + rationale are **chat-memory-only at the moment of consult**: `full.js` halts and expects the *foreground Alpha* to actually ask β and hand the verdict back via CLI flags (:699). Nothing on disk proves β was really consulted vs. a plausible `--beta-message` typed by hand. ε in-process Agent-tool returns are memory-only unless written to an `--evidence` file. Net: a sprint resumes mechanically from files, but **the judgment layer (β reasoning, ε orchestration decisions) is not durably captured** — it's re-supplied by the operating session.

## v1 overlap map

- **plan-contracts (`PC-*.yaml`, 82 on disk)** ≈ WorkOrder's spec half — durable, schema'd, one per sprint. Natural seed for WorkOrder.
- **checkpoints (`checkpoints/SP-*.yaml`) + `progress.yaml`** ≈ SprintRoom durable state / lease-holder pointer — exists, but NO lease/owner field.
- **tickets (`tickets/T-*.yaml`)** ≈ WorkOrder line-items — exist, `--sprint`-scoped, no owner/lease.
- **dispatch-completions.jsonl + `recordInProcessCompletion`** ≈ evidence index — the honesty-derived `ok`/`evidence_sha` mechanism is exactly the v1 evidence-bound record; reuse verbatim.
- **`betaConsultations` events + `sprint_full_beta_consult`** ≈ decisions log — but event-only, not a first-class SprintRoom decision record.
- **`decisions/`, `history/`, `approvals/` dirs** already exist under `.claude/project/sprint/` — scaffolding for SprintRoom's decision/handoff index; `append-decision.js` exists to populate.

## Rebuild needs

1. **Record-required β gate that survives full.js bypass**: move the β-record requirement out of `full.js` into a phase-transition guard on `progress.yaml` writes (chokepoint = `fs.js`), so hand-running phase scripts still refuses to advance without a durable β decision record. Today it's MECH-CLAUDE but only inside `full.js`.
2. **ε lease**: add an owner/lease field to `progress.yaml`/SprintRoom (holder id + expiry); refuse phase advance by a non-holder. No lease primitive exists today.
3. **Roster-builds-not-alpha, envelope-required ticket close**: `ticket.js` close should require an evidence envelope (reuse `recordInProcessCompletion`'s bytes-derived `ok`); today ticket status can be set without proof of a real builder run.
4. **Durable decision record** (not event-only): promote β verdicts to a SprintRoom `decisions/` record carrying verdict + rationale + consulting-agent id — crash-safe, audit-native.
5. **Registry reconciliation + GC**: 11-entry drift, 3 missing-subdir, 2 orphaned, ~30 zombie "releasing" — needs a reconcile/GC pass and a status writer that keeps `active-sprints.yaml` synced to `progress.yaml` (divergence is the root drift).
6. **Make ε default-on (or removable)**: `WARPOS_EPSILON_RUNTIME` default-OFF means "ε conducts" is aspirational — flip to required under the lease model.

Key pointers: `scripts/sprint/full.js:682` (β), `:181` (ε opt-in), `scripts/sprint/ticket.js:243` (only runtime refusal), `scripts/sprint/epsilon-runtime.js:634` (evidence-bound record — the reusable honesty primitive), `scripts/checks/epsilon-liveness.js` (stall detector, audit-only), `scripts/warpos/release-build.js:79` (post-hoc β gate).
