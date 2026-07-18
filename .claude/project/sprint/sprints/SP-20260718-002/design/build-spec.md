# build_spec — SP-20260718-002 (compactor · materialized state · query `--archive`)

**Authored by:** director-of-engineering (in-process consult, design step) · **Conducted by:** Alex ε · **Confidence:** 0.87
**ε RATIFICATION:** the whole-file-move ruling below is RATIFIED by ε as the build mechanism. It is a build_spec-tier (70) refinement of the PRD's S-2/S-4 design sketch (30) — same scope/intent, win32-correct mechanism, strengthens the never-lose-raw invariant. Put to β at the design→build boundary as the key design decision.

## THE CALL (load-bearing decision)
Build the compactor as **`archive-the-whole-file → reseed-a-bounded-tail`**, NOT `archive-a-slice-file → temp+rename the hot log`.

PRD sketch REJECTED because:
1. **Lost-append race.** `logger.js` appends to events.jsonl WITHOUT `archive.tryLock`. A temp+rename replacing the whole inode drops any append landing after the compactor's final re-read but before its rename. Re-reading under the lock does not close it (appender never takes the lock). Silent raw loss = the irreversible mistake (R-1/CORE-4).
2. **Trips AC-4.** The sketch's hot-log `renameSync` on raw is exactly the forbidden op. Whole-file model puts the ONLY `renameSync` on the live log INSIDE `archive.js` → AC-4 passes by construction.

Whole-file model inherits `rotate.js`'s proven property: one atomic whole-file `renameSync` (via `archive.archive`) captures everything up to the rename instant — a concurrent append either rode into the archived generation or lands on the fresh recreated file; never split, never lost. The compactor's only NEW op over rotation is an append-only reseed of the bounded tail (cannot lose an append). Logger-cooperates-with-lock REJECTED (hot-path risk expansion, unnecessary). win32-correct confidence: 0.9.

## 1 — build_spec per deliverable

### C1 — `scripts/events/events-compact.js` (+ `events-compact.test.js`)
Standalone CLI + exported fns (mirrors retention.js). Runs periodically (session-start/housekeeping), NOT on hot append. `node scripts/events/events-compact.js [--root <dir>] [--apply]`. Cheap statSync pre-gate; single-writer via `archive.tryLock`; NEVER throws; any fault → clean no-op that pass.

Named constants (require-time invariant, fail-loud):
```
TAIL_KEEP_LINES     = 2000
FOLD_TRIGGER_LINES  = 8000
// invariant: TAIL_KEEP_LINES < FOLD_TRIGGER_LINES < rotate.SINK_CAPS[eventsFile].cap (20000)
```

Functions:
```
reconcileOrphans(rootAbs) -> { reindexed:number }   // run FIRST each pass; dir-scan archive/ vs readIndex();
                                                     // any on-disk generation absent from index → reconstruct entry
                                                     // via appendIndex (recompute bytes/lines; reason:"reconcile:orphan").
                                                     // Idempotent, keyed on unique `archived` basename.
compactOnce(rootAbs, { apply, crashAfter }) -> { ok, folded, reason, generation?, summary? }
```

**REQUIRED C1 deliverable — deterministic seam-abort hook (folded by ε from the quality-lead qa-plan; makes AC-3 falsifiable).** `compactOnce` MUST accept a test-only `crashAfter` seam label (`"S5"`, `"S7"`, `"S9-partial"`, …). When set, the function performs that seam's disk side-effect and then returns immediately `{ok:false, reason:"test-crash-injected", crashedAfter}` — a CLEAN early-return (NOT a throw — it composes with the never-throw contract), modeling process death precisely (the seam's mutation happened; no later seam ran). Test-only surface: a non-null `crashAfter` is honored only under a test env/flag and is never a documented CLI flag. Without this hook AC-3 ("kill at every seam") is UNFALSIFIABLE — an internal throw is swallowed by the never-throw contract and proves nothing. AC-3's `verified_by` names this hook + the S9-partial `appendFileSync` monkeypatch. This is the deterministic alternative to fs-monkeypatch abort (which can't stop mid-function cleanly).

**Write-ahead seam sequence** (invariant proven at every kill point):
| # | Step | Op | Crash here leaves |
|---|---|---|---|
| S0 | reconcileOrphans | re-index prior orphan | prior generation on query seam |
| S1 | stat pre-gate + read line-count | statSync/readFileSync | live intact, no-op |
| S2 | if lines < FOLD_TRIGGER → return {folded:false} | — | live intact (idempotency AC-6) |
| S3 | release = archive.tryLock(compaction lock); null → no-op | serialize | live intact |
| S4 | re-verify lines >= FOLD_TRIGGER UNDER lock | readFileSync | live intact |
| **S5** | **archive.archive(eventsFile,{root,reason:"compaction:fold",shape:"operational"})** | **atomic whole-file renameSync INSIDE archive.js + index append** | **all raw archived+indexed; live empty; NO raw lost** ✓ |
| S6 | if !res.ok → no-op return (archive.js KEEPS source) | — | live intact |
| S7 | if res.indexed===false → fail-closed branch | — | generation on disk, dir-scan recoverable; reconciler re-indexes next pass |
| S8 | read archived copy (res.archived); compute summary + tail=last TAIL_KEEP | readFileSync | archived durable; live empty (tail via --archive) ✓ |
| **S9** | **fs.appendFileSync(eventsFile, summaryLine + tailRawLines)** | **append-only, never truncate** | **partial tail = torn DUPLICATE of archived raw → harmless; archive has truth** ✓ |
| S10 | release() | unlock | — |

Invariant: only destructive op is S5 (one atomic whole-file rename inside archive.js). Before S5 all raw in live; at/after S5 all raw in archived generation; S9 only adds. Every seam → each raw id in (live ∪ archive), never neither (AC-1/AC-3). Restore of S5 generation reproduces pre-fold file byte-for-byte (AC-2).

**Crash-recovery convergence semantics (β rider #1, ε-ruled resolution (b) — DO NOT delete the convergence check to satisfy a stale assertion).** After a crash at **post-S5, pre-S9** the archived generation is durable+indexed but the live log is EMPTY (0 lines). Because S2 returns `{folded:false}` when `live < FOLD_TRIGGER`, the next pass does NOT auto-reseed the old tail — and that is CORRECT, not a bug: never-lose-raw holds (all raw is in the archived generation, `CONSERVES=true`, fully recoverable via `query --archive`). The live log simply **repopulates from NEW appends**; the folded tail is NOT auto-reseeded but stays complete-history-queryable via `--archive`. RULING: resolution **(b)** — the compactor adds NO crash-recovery reseed branch (zero new code, zero new failure mode); instead the qa-plan Gate-3 post-S5 assertion is corrected to `CONSERVES-via-archive; live repopulates from new appends (NOT auto-reseeded)`. A builder MUST NOT make a failing "tail reseeded" assertion pass by deleting the conservation/convergence check — the check stays; the assertion text is what was wrong. (Resolution (a) — an explicit archived-but-live-empty recovery branch — was considered and rejected: it must distinguish post-crash-empty from fresh-install-empty, adding a stateful decision that could itself be buggy, against this sprint's simplicity-for-safety priority.)

`compaction-summary` record (C1↔C3 frozen seam; written directly, NOT via logger, to avoid recursive rotation):
```
{ id, ts, cat:"audit", actor:"compactor", type:"compaction-summary",
  data:{ event_count, id_range:{min,max}, ts_range:{min,max},
         archived_generation_ref: res.entry.archived } }  // index entry's `archived` rel path
```

S7 fail-closed (moved-but-unindexed): still reseed tail (live not left empty), write summary with `data.index_pending:true` + omit resolvable ref, emit LOUD audit error, **exit non-zero**. Raw NOT lost; reconciler re-indexes next pass. Never proceed silently green.

Concurrency: compactor uses its OWN lock (`runtime/rotate-locks/events.jsonl.compact.lock`). If rotate.js moves events.jsonl mid-pass, S5 returns {ok:false,missing} → S6 no-op. win32: concurrent appendFileSync holding the handle at rename → renameSync may EPERM → archive.js catches → {ok:false,move-failed} → S6 no-op, retry next pass. Recreate-on-next-append (rotate.js relies on it) recreates events.jsonl; reseed appendFileSync composes safely. **Union reader must sort by ts/id, not trust file order.**

### C2 — `scripts/state/materialize-core.js` + `scripts/state/materialize.js`; REFACTOR `scripts/materialize-decisions.js` (+ `materialize.test.js`)
**Reconcile ruling (AC-7, β #1/P-034): GENERALIZE.** ONE shared events→doc primitive; re-point materialize-decisions.js through it. Parallel reimpl REJECTED.

Shared primitive (producer defines signature; both callers adapt):
```
materialize({ source, reducer, renderer, emptyRender, outPath, root }) -> { ok, bytes, wrote, path }
  source     : () => events[]      // e.g. () => logger.query({cat:"spec"}); injectable for fixtures
  reducer    : (events) => model   // PURE deterministic
  renderer   : (model) => string   // PURE deterministic
  emptyRender: () => string        // cold-start render when source() empty (AC-8: valid, not crash)
```
**HARD determinism rule (makes AC-8 delete→regen→byte-identical hold):** rendered bytes are a pure function of events — NO Date.now()/generation-ts, NO absolute paths, NO pid in output. Insertion-ordered Map over log-ordered events is deterministic.

- `materialize.js` (NEW): two triples → `what-running` (build first: unpaired in-flight — sprint-start w/o close, dispatch-start w/o completion, open gauntlet rounds) + `what-happened` (bounded recent decision/close/release digest).
- `materialize-decisions.js` (REFACTOR): keep its decisions + stale-files reducers/renderers; route both through materialize-core → satisfies AC-7 by import graph.
- Source note: materialize.js reads via `logger.query` (LIVE only) for cheapness + C3-independence. Known limitation: a folded-to-archive start w/o close won't appear in what-running. Mitigation (not a hard dep): consume the C3 union reader once C3 lands. Flag, don't block.

### C3 — EDIT `scripts/events/cli.js` (+ `cli.test.js`); extend `/events:query`
Add `--archive` to query; union live + archived raw; preserve `--type/--since/--until/--grep/--json`. Read path must NOT inherit readIndex's torn-line tolerance — needs COMPLETENESS.

New helper `readArchiveStrict(root) -> { tier, entries?, error? }`, THREE coded branches:
| tier | Detection | Action | AC |
|---|---|---|---|
| `absent` (COLD) | !existsSync(archiveIndexPath) | live-only, stderr "no archive tier yet", **exit 0** | AC-10 |
| `corrupt` (FAIL-CLOSED) | index exists AND (a) any non-empty line fails JSON.parse (STRICT, don't skip like readIndex), OR (b) any entry's `archived` file missing/unreadable (dangling), OR (c) index unreadable | stderr explicit error, **exit non-zero**, **NO output** | AC-9 |
| `healthy` | index exists, every line parses, every generation present+readable | union live ∪ archived, exit 0 | AC-9 |

Two-phase (guarantees "NO partial output"): VALIDATE entire index + existence/readability of EVERY generation FIRST; only if healthy EMIT union. Never stream-then-discover-corruption.
Fail-closed boundary: applies to the INDEX (completeness map). Event-level torn lines inside a raw file tolerated as today's readJsonl (same class both tiers). AC-9 is index-scoped per its wording.
Reader-experience (deferred call confirmed): when raw present in the union, SUPPRESS the redundant compaction-summary; surface raw. A summary whose ref resolves but whose raw is genuinely absent stays visible as a pointer.

### C4 — `scripts/checks/reader-discipline.js`; doctrine doc; extend `/events:query`; **log ED-222**
**Feasibility ruling: ship the enforcer AND log ED-222 — BOTH.** A soundly-COMPLETE enforcer is not feasible (full-log reads have unbounded spellings — computed paths, subprocess, re-exported LOG_FILE; undecidable). A sound-DIRECTION check IS feasible: CLOSED allowlist of sanctioned readers + grep/AST flag of any OTHER file reading the events-file literal (zero false positives). Ship it (clean=0, seeded violation=non-zero) AND log ED-222 for the residual it can't soundly catch. Honest per AC-12.
Allowlist (CLOSED): `scripts/events/cli.js`, `scripts/hooks/lib/{logger,rotate,archive,retention}.js`, `scripts/materialize-decisions.js`, `scripts/state/{materialize,materialize-core}.js`, `scripts/events/events-compact.js`, `*.test.js`.
AC-4 enforcer (grep/AST over events-compact.js): assert NO `fs.unlink|rmSync|truncate|renameSync|writeFileSync` on the events file — only `fs.appendFileSync` (reseed) + `archive.archive` (move). Whole-file model passes by construction.
Housekeeping (R-6): regen BOTH manifests LAST; confirm cited EDs (ED-221 seam, ED-222) exist in canonical ledger pre-merge; non-strict validate exit 0.

## 2 — INPUTS/TRACE
- C1 ← archive.archive/readIndex/appendIndex/tryLock (frozen), rotate.SINK_CAPS cap (20000 ceiling), logger events path, CORE-4/P7.4.
- C2 ← logger.query, materialize-core.materialize (new).
- C3 ← archive.archiveIndexPath/readIndex (STRICTER parse layered on top; does NOT modify archive.js), archived raw files.
- C4 ← finalized C1-C3 file set (allowlist); paths.eventsFile/EVENTS_FILE literals.

Deliverable→AC: C1→AC-1/2/3/4/5/6 · C2→AC-7/8 · C3→AC-9/10 · C4→AC-11/12/13. 6-point gate: AC-1/2/3/4 on C1 seams, AC-8 on C2 determinism, AC-9 on C3 fail-closed. All binding, none dispositionable.

## 3 — Integration-seam owner (all-backend, no FE)
"Backend-first" = foundation frozen; produced-contracts merge before consumers; manifest regen last.
| Seam | Producer | Consumer | Rule |
|---|---|---|---|
| compactor↔archive.js | archive.js (frozen) | compactor | MUST NOT modify archive.js/rotate.js/logger.js |
| compactor↔C3 (summary + archived_generation_ref) | compactor | C3 reader | compactor freezes summary schema FIRST |
| materialize*↔materialize-core.js | materialize-core.js | both entrypoints | freeze signature FIRST; AC-7 reconcile seam |
| C3↔archive index | archive.js | C3 (readArchiveStrict on top) | C3 adds strict parse; does NOT change readIndex |

Merge order: (1) freeze summary schema + materialize-core signature; (2) C1/C2/C3 any order — disjoint files, zero contention; (3) C4 enforcer; (4) housekeeping/manifest regen LAST.

## 4 — Build sequencing
**Wave 1 (parallel — disjoint files, one frozen contract each):** U-A=C1 compactor (freeze summary schema first) · U-B=C2 materialize-core+materialize.js+decisions refactor (freeze signature first) · U-C=C3 cli.js --archive (consumes C1 summary schema constant + archive.js; buildable against fixtures in parallel). Only cross-unit dep = two frozen constants published at wave start.
**Wave 2 (serial):** U-D=C4 enforcer (allowlist=finalized C1-C3 set) + doctrine + ED-222 · U-E=housekeeping (manifest regen BOTH + ledger reconcile) LAST.

## 5 — Top eng risks
1. [HIGHEST] Mechanism divergence from PRD sketch — build_spec(70) refines sketch(30); NOT scope change, REDUCES risk. ε RATIFIED. Crash-injection (AC-3) + AC-4 grep must target the WHOLE-FILE seam sequence, not the sketch. Confirm with β at boundary.
2. Tail duplication + summary accumulation in archive — accepted (R-1 over-preservation safe; union reader dedupes by id, suppresses redundant summaries). Storage is what the tier is for. Named so not mistaken for a defect.
3. win32 renameSync under append contention (EPERM) + reseed ordering — handled (EPERM→no-op/retry; reseed append-only; union sorts by ts/id). Residual cosmetic ordering, not loss.
4. C4 enforcer soundness gap — honestly bounded (sound-direction check + ED-222). ED must actually be logged (AC-12/13 gate it).
5. Materialize determinism leaks (Date.now/abs-path/pid) break AC-8 — mitigated by HARD determinism rule + delete→regen byte-compare test.

Overall confidence 0.87. Would revisit C1 concurrency ONLY if logger.js is to be modified this sprint — it should NOT be (hot-path risk expansion; whole-file model makes it unnecessary).
