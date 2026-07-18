# PRD — SP-20260718-002: D-1 second half (event compactor · materialized state · query `--archive`)

**Authored by:** product-lead (in-process consult, design step) · **Conducted by:** Alex ε · **Confidence:** 0.86
**Max risk:** HIGH (data-integrity-critical). **Prime directive:** raw history is NEVER destroyed — runtime side of kernel **CORE-4 (P7.4)**. Compaction SUMMARIZES; it never deletes.

> Corrected-scope note: `plan-composition.md` lines 24-25 still name C1 `scripts/events/compact.js` and omit the C2 reconcile mandate. This PRD supersedes that with the β-rider-corrected scope: C1 = `events-compact.js`; C2 reconcile with `materialize-decisions.js` is MANDATORY.

## 1 — Requirements (R-N)

| ID | Requirement | Rationale |
|---|---|---|
| **R-1** | **CORE never-lose-raw invariant (cross-cutting).** No compaction, materialization, or read path may make a raw event identity unrecoverable. Any doubt → archive-not-delete. Framed as no-LOSS over event `id`: over-preservation (crash-retry duplicate) is safe; under-preservation is the only irreversible mistake. | CORE-4 (P7.4, `Core: non-waivable`) for the events subsystem. Governs R-2..R-4. |
| **R-2** | **C1 — event compactor `scripts/events/events-compact.js`.** Folds old events into an ADDITIVE structured summary, keeps a bounded raw TAIL live; folded-away older raw MOVES to the archive tier via `archive.js` (never unlinked). Idempotent, single-writer (`archive.tryLock`), fail-closed. Filename `events-compact.js` NOT `compact.js` (β rider #1). | TAIL-retention is the new behavior beyond `rotate.js`'s whole-file move. Summary points to archived raw, never replaces it. |
| **R-3** | **C2 — materialized state `scripts/state/materialize.js`.** Regenerates small state files ("what's running / what happened") deterministically from events. Regenerable-from-events, NEVER authoritative. **MANDATORY reconcile (β rider #1, P-034):** `materialize-decisions.js` already implements events→doc; C2 MUST generalize a shared primitive OR explicitly supersede. Parallel reimplementation is REJECTED. | Don't build a second copy of a shipping pattern. |
| **R-4** | **C3 — query `--archive` read path.** Extend `cli.js query` with `--archive` (reads `archiveIndexPath` + archived raw), so live ∪ archive = COMPLETE history. Extend `/events:query`. **Fail-CLOSED** on corrupt/dangling/unreadable index — never a silent partial "clean" history. | Completes the round-trip; without fail-closed a torn index masquerades as complete. |
| **R-5** | **C4 — reader-discipline doctrine (query-first).** State files + `events:query` = read path; full-log reads = exception. Ships with a NAMED enforcer OR a logged ED. | Every policy names its enforcer at write-time. |
| **R-6** | **Housekeeping — manifest regen + ED-ledger reconcile.** New scripts hash-tracked → regen BOTH manifests; any cited ED exists in canonical `paths.enforcementDebt` before merge (ED-221 seam). | BC-02/BC-05 hygiene. |

## 2 — Stories

### High-level (H-N → R-N)
- **H-1 (R-1):** Compaction is structurally incapable of destroying raw history.
- **H-2 (R-2):** Old events folded into a summary while raw stays preserved + restorable; live log bounded, complete history recoverable.
- **H-3 (R-3):** Deterministic materialized "what's running / what happened", regenerable from events.
- **H-4 (R-4):** `query --archive` returns complete live+archive history and fails LOUD on corruption.
- **H-5 (R-5):** Query-first reader discipline documented + enforced (or gap logged).
- **H-6 (R-6):** New scripts manifest-tracked; cited EDs present in canonical ledger.

### Granular (S-N → H-N)
**C1 compactor (H-2):**
- **S-1** Fold boundary: retain last N raw events as live TAIL; older = fold slice (N configurable).
- **S-2** Archive-first, durably: move fold slice via `archive.archive(sliceFile,{root,reason:"compaction:fold",shape:"operational"})`; confirm `{ok:true}` + `archived` on disk BEFORE touching hot log.
- **S-3** Additive summary: one `type:"compaction-summary"` record `{event_count,id_range,ts_range,archived_generation_ref}` — a POINTER to archived raw (ties C1→C3), never a prose replacement.
- **S-4** Atomic hot-log rewrite: rewrite live log to `[summary + retained TAIL]` via temp-write + atomic rename — ONLY after S-2 durability confirmed. Never in-place truncate/unlink.
- **S-5** Idempotency + single-writer: `archive.tryLock` serializes; a second run converges (no double-summary, no re-archival of already-folded raw).

**C2 materialized state (H-3):**
- **S-6** Reconcile primitive: ONE shared events→doc materializer both `materialize.js` and `materialize-decisions.js` route through (generalize) OR re-point + mark superseded (supersede).
- **S-7** State content: render "what's running / what happened" deterministically from `logger.query`; empty-but-valid cold-start render when no events.
- **S-8** Regenerable-not-authoritative: delete → regenerate → byte-identical; events remain sole source of truth.

**C3 query `--archive` (H-4):**
- **S-9** `--archive` flag: union live events with archived raw via `archive.js#readIndex` + `archiveIndexPath`; preserve `--type/--since/--until/--grep/--json` across the union.
- **S-10** Fail-closed on corruption: dangling entry / unreadable index / un-reconstructable archived log → exit non-zero + explicit error; never a silently-skipped line yielding partial "clean" output. (`readIndex` tolerates torn lines for tier liveness — the READ path must NOT inherit that tolerance; it must detect incompleteness and fail closed.)
- **S-11** Cold vs warm: ABSENT archive tier on a never-archived system (`readIndex → []`) = clean COLD path (live-only, note, exit 0). CORRUPT/DANGLING index = S-10 fail-closed. Distinct paths.
- **S-12** Extend `/events:query` skill with `--archive` + fail-closed/cold-start contract.

**C4 doctrine (H-5):**
- **S-13** Author query-first reader-discipline doctrine.
- **S-14** Name its enforcer: proposed `scripts/checks/reader-discipline.js` (flags un-sanctioned direct full-log reads) OR log ED-222 (next-free; canonical highest = ED-221).

**Housekeeping (H-6):**
- **S-15** Regen both manifests; non-strict validate exit 0.
- **S-16** Any cited ED exists in canonical `paths.enforcementDebt` before merge.

## 3 — Acceptance criteria (AC-N with `verified_by`)

> 6-point NEVER-LOSE-RAW gate → AC-1 (conservation), AC-2 (restore-drill), AC-3 (crash write-ahead), AC-4 (no-unlink), AC-8 (materialized regenerability), AC-9 (query fail-closed). Every point ≥1 AC.
> **BINDING:** the `verified_by` cells below are refined by `qa-plan.md §3` (mandatory dropped-id negative control on AC-1; seam-abort hook on AC-3; lock-noop single-writer proof on AC-6; import-graph predicate on AC-7; strict-parse + `stdout===""` no-partial on AC-9; BOTH enforcer AND ED-222 on AC-12). Read this table WITH qa-plan.md §3 — do not build/gauntlet an AC in isolation of its tightening.

| ID | Story | Criterion | verified_by |
|---|---|---|---|
| **AC-1** | S-1..S-4 | **[#1 Conservation]** raw event `id`s before ⊆ `id`s in (live TAIL ∪ archived) after; no `id` absent from both. Duplication passes; absence fails. | `scripts/events/events-compact.test.js` — seed, compact, assert `idsBefore ⊆ ids(tail ∪ archived)`. |
| **AC-2** | S-2 | **[#2 Restore-drill]** compacted generation restores via `archive.restore` and reproduces the exact folded-away raw. | `events-compact.test.js` — `readIndex` → `restore` → byte-compare. |
| **AC-3** | S-2,S-4 | **[#3 Crash write-ahead]** archive+index FIRST, hot-log rewrite ONLY after. Kill at every seam → each raw `id` in hot log OR archive, never NEITHER. | `events-compact.test.js` crash-injection at each seam, assert AC-1 predicate holds. |
| **AC-4** | S-2,S-4 | **[#4 No-unlink]** compactor moves folded raw ONLY via `archive.js`; no `fs.unlink/rmSync/truncate/renameSync` on raw outside `archive.js`. | grep/AST proof over `events-compact.js`. |
| **AC-5** | S-3 | summary is ADDITIVE + structured; never prose, never a replacement; `archived_generation_ref` resolves to a real index entry. | `events-compact.test.js` — summary shape + ref resolves. |
| **AC-6** | S-5 | **Idempotent + single-writer:** two consecutive runs converge (no extra loss, no dup summary); concurrent runs lose zero raw. | `events-compact.test.js` — double-run + concurrent-run conservation + summary uniqueness. |
| **AC-7** | S-6 | **[Reconcile — β #1/P-034]** no parallel reimpl: both entrypoints share ONE primitive (generalize) OR `materialize-decisions.js` re-pointed + superseded. | import-graph test/grep OR supersede-note + delegation. |
| **AC-8** | S-7,S-8 | **[#5 Materialized regenerability]** delete→regen→byte-identical; deterministic; cold-start renders empty-but-valid, not a crash. | `scripts/state/materialize.test.js` — delete→regen byte-compare; cold-start; determinism. |
| **AC-9** | S-9,S-10 | **[#6 Query fail-CLOSED]** corrupt/dangling/unreadable index → exit non-zero + explicit error + NO partial output; healthy tier → live ∪ archive complete. | `scripts/events/cli.test.js` — healthy union; dangling entry → non-zero; unreadable index → non-zero. |
| **AC-10** | S-11 | **[cold-vs-warm]** fresh install, no archive tier (`readIndex → []`) → live-only, exit 0, "no archive tier yet" note — NOT fail-closed. Distinct coded path from AC-9. | `cli.test.js` — cold-start fixture exit 0 + live-only + note. |
| **AC-11** | S-12,S-13 | `/events:query` documents `--archive` + fail-closed + cold-start; reader-discipline doctrine authored. | doc-presence/grep for the sections. |
| **AC-12** | S-14 | **[policy names enforcer]** working `scripts/checks/reader-discipline.js` OR logged ED-222. Not neither. | enforcer runs (clean=0, seeded violation=non-zero) OR `grep ED-222` in ledger. |
| **AC-13** | S-15,S-16 | new scripts in BOTH manifests; non-strict validate exit 0; cited EDs in canonical ledger pre-merge. | `paths/build.js` + manifest validate exit 0; ledger grep. |

## 4 — Open product questions (product-lead recommendations, ε to rule)
1. **Materialized state content (R-3/S-7):** recommend TWO deterministic files — `what-running` (unpaired in-flight events: sprint-start w/o close, dispatch-start w/o completion, open gauntlet rounds) + `what-happened` (bounded recent decision/close/release digest). Narrow to one if only "what's running" is needed now.
2. **C2 reconcile (R-3/S-6):** recommend **generalize** (shared primitive, keep DECISIONS.md/STALE-FILES.md) over supersede; supersede only if the shared primitive can't absorb both render shapes without a leaky abstraction.
3. **C4 enforcer vs ED (R-5/S-14):** recommend **attempt the enforcer**, fall back to ED-222 only if the sanctioned-reader allowlist can't be soundly closed this sprint.

**Deferred reader-experience call (product-lead confidence caveat):** under `--archive`, whether to surface BOTH a compaction summary's pointer AND the expanded archived raw, or suppress the redundant summary when raw is present. Default: show raw, suppress the redundant summary. ε/DoE to confirm at build.
