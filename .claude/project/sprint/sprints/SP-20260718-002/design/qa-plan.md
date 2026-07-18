# qa-plan — SP-20260718-002 (event compactor · materialized state · query `--archive`)

**Authored by:** quality-lead (in-process consult, design step) · **Conducted by:** Alex ε · **Confidence:** 0.87
**Type:** READ-ONLY design authoring. This is the sprint qa-plan the gauntlet consumes; the AC tightenings below are BINDING.

## 1 — Overview
Broad + Deep by mandate (HIGH-risk, data-integrity, runtime side of kernel CORE-4). Golden path = **a raw event, once written, is recoverable forever** — through compaction, materialization, and the read path. Positive AND Negative flows (crash-at-seam, corrupt-index, cold-start, EPERM) are first-class.

**Disposition criterion (binding, operator F2 + CORE-4):** does a non-malicious MISTAKE reach an IRREVERSIBLE outcome? The irreversible outcome is LOST RAW HISTORY. A bug that unlinks/drops/makes-unrecoverable a raw event `id` = must-fix, NEVER dispositionable. Over-preservation (crash-retry duplicate, accumulated summary) is SAFE — conservation is no-LOSS over `id`, NOT exact-multiset equality. A single binding FAIL on any of the 6 gates = build does not advance.

## 2 — The 6 never-lose-raw gates → concrete test design
Shared idiom (mirror `archive.test.js`): harness + sealedDir fixtures + cleanup in finally; fault injection = monkeypatch `fs.renameSync`/`fs.openSync`/`fs.appendFileSync`, restore in finally.

Shared conservation helper (define once in `events-compact.test.js`):
```
rawIds(file)      = readJsonl(file).filter(e=>e.type!=="compaction-summary").map(e=>e.id)
liveIds(root)     = rawIds(eventsFile)
archivedIds(root) = readIndex(root).flatMap(entry => rawIds(join(root, entry.archived)))
CONSERVES(before) = new Set(before).every(id => liveSet.has(id) || archSet.has(id))  // ⊆ only; dups SAFE
```

### Gate #1 — Conservation (AC-1) → events-compact.test.js
Seed ≥8001 distinct events; `idsBefore=rawIds`. compactOnce(apply). Assert `CONSERVES(idsBefore)===true`, liveIds≈TAIL_KEEP, summary present.
- Duplicate-id fixture (MUST PASS): id in BOTH archive + live tail → CONSERVES true (over-preservation OK).
- **Dropped-id negative control (MUST FAIL — mandatory, proves teeth):** mutant that drops one tail id not archived → CONSERVES false. Without it the predicate is unfalsifiable.

### Gate #2 — Restore-drill (AC-2) → events-compact.test.js
Capture preFoldBytes before compaction. compactOnce → entry=readIndex.find(reason==="compaction:fold") → restore(entry) to a scratch origin (restore refuses to clobber a live origin) → byte-compare recovered raw to preFoldBytes exactly.

### Gate #3 — Crash write-ahead (AC-3) → events-compact.test.js · THE SEAM MATRIX
**REQUIRED builder testability hook (folded into build_spec as a C1 deliverable):** `compactOnce(root,{apply,crashAfter})` where `crashAfter` is a seam label (`"S5"`,`"S7"`,`"S9-partial"`,…). When set, performs that seam's disk side-effect then returns immediately `{ok:false,reason:"test-crash-injected",crashedAfter}` — a clean early-return (NOT a throw, composes with never-throw), test-only surface. This is the deterministic alternative to fs-monkeypatch (which can't stop mid-function cleanly).

| Kill point | Inject | Disk state | Assertion |
|---|---|---|---|
| post-S5,pre-S9 (archived+indexed, live empty) | crashAfter:"S5" | all raw in archived gen; live empty | archivedIds⊇idsBefore; liveIds=∅; **CONSERVES=true (via archive)**. Re-run (S0 reconcile+S1) converges: no double-archive, exactly ONE gen for the id-range. **β rider #1 CORRECTION (resolution b):** the old tail is **NOT auto-reseeded** — live is empty (0<FOLD_TRIGGER→S2 no-op) and **repopulates from NEW appends**; the folded tail stays complete-history-queryable via `--archive`. Assert CONSERVES-via-archive + live-repopulates-from-new-appends; do NOT assert "tail reseeded". This is correct convergence, not a defect — the check stays, only the earlier assertion text was wrong. |
| mid-S9 partial append | monkeypatch appendFileSync to write first K bytes then return | archive complete; live has torn partial dup | CONSERVES=true (archive truth; partial tail harmless dup). Union reader sorts by ts/id + dedupes, no id lost. Re-run converges (idempotent). |
| post-archive,pre-index=S7 (indexed:false) | monkeypatch openSync to throw for index.jsonl | gen on disk NOT in index; live tail reseeded; summary index_pending:true | CONSERVES=true via dir-scan archivedIds. compactOnce EXITS NON-ZERO + LOUD error + live NOT empty. Fresh run: S0 reconcileOrphans re-indexes → readIndex includes it → CONSERVES via index. |
| post-S6 move-failed (S5 renameSync EPERM, win32) | monkeypatch renameSync throw EPERM | live INTACT (archive.js keeps source) | S6 clean no-op; liveIds⊇idsBefore; CONSERVES=true; retry next pass. |

Convergence (every row): re-run from S0 reconcileOrphans → stable state where CONSERVES holds, no new loss/gen-dup (idempotency, AC-6). Two more re-runs = no-op fold.

### Gate #4 — No-unlink (AC-4) → events-compact.test.js (grep/AST)
Over stripped events-compact.js source: FORBID `fs.(unlinkSync|unlink|rmSync|rm|truncate|renameSync|writeFileSync)\s*\(` on the events file; ALLOW only `fs.appendFileSync` (S9 reseed) + `archive.archive(` (S5 move). Passes by construction (whole-file model). **Sub-assertion:** S9 reseed uses `appendFileSync` NOT `writeFileSync` (a writeFileSync reseed clobbers a concurrent append).

### Gate #5 — Materialized regenerability (AC-8) → scripts/state/materialize.test.js
Delete→regen→byte-identical (both what-running + what-happened, same injected source). Determinism: `renderer(reducer(events))` twice = identical. Cold-start ([] events → emptyRender → ok:true, bytes>0, no throw). **HARD determinism purity:** run materialize, run again 50ms later, assert byte-identical (a Date.now leak differs); AST assert `!/Date\.now\(|new Date\(|process\.pid|__dirname|process\.cwd/` in renderer source.

### Gate #6 — Query fail-closed (AC-9) + cold-vs-warm (AC-10) → scripts/events/cli.test.js
Two-phase: VALIDATE entire index + existence/readability of EVERY generation FIRST; EMIT union only if healthy. Never stream-then-discover.
| Branch | Fixture | Assertion |
|---|---|---|
| healthy union | live + valid tier | exit 0; live∪archived complete; sorted ts/id; redundant summary suppressed when raw present |
| corrupt-dangling | index entry's archived file missing/unreadable | exit non-zero; explicit stderr; **stdout==="" (NO partial output)** |
| corrupt-unreadable index | index open throws | exit non-zero; explicit; stdout empty |
| corrupt-unparseable line | index line fails JSON.parse (STRICT, must NOT skip like readIndex) | exit non-zero; explicit; stdout empty. Sharpest test: proves read path did NOT inherit readIndex tolerance. |
| cold-absent tier (AC-10) | no archiveIndexPath, readIndex→[] | exit 0; live-only; stderr "no archive tier yet". DISTINCT coded branch from corrupt. |

Critical (both corrupt rows): assert `stdout===""` — two-phase validate-then-emit is the only guarantee. Scope: fail-closed is INDEX-scoped; event-level torn lines inside a raw file stay tolerated (test must corrupt the INDEX/generation-existence, not a single event line).

## 3 — AC verified_by coverage audit + BINDING tightenings
- AC-1: CONCRETE + add mandatory dropped-id negative control.
- AC-2: CONCRETE.
- AC-3: unfalsifiable WITHOUT the named `compactOnce({crashAfter})` seam hook + S9-partial appendFileSync monkeypatch → **folded into build_spec as a required C1 deliverable** (ESCALATION #1 resolved by ε).
- AC-4: CONCRETE — pin the forbidden-op regex + appendFileSync-not-writeFileSync sub-assertion.
- AC-5: CONCRETE — assert archived_generation_ref === a real readIndex entry's `archived`.
- AC-6: tighten "concurrent" → pre-acquire compact lock then compactOnce → assert no-op (reason:"locked"), CONSERVES holds, no second summary (deterministic single-writer proof).
- AC-7: VAGUE → concrete: materialize-decisions.js `require`s materialize-core AND has NO standalone writeFileSync render loop; materialize.js also requires materialize-core (import-graph + grep, not "OR a note").
- AC-8: CONCRETE + 50ms-apart byte-identical purity test.
- AC-9: add the unparseable-line-strict case AND explicit `stdout===""` no-partial-output assertion.
- AC-10: CONCRETE — assert distinct coded branch (the "no archive tier yet" note path).
- AC-11: name exact grep tokens (`--archive`, `fail-closed`, `cold-start`/`no archive tier`, doctrine heading).
- AC-12: MISMATCH → assert BOTH (enforcer clean=0/violation=non-zero AND ED-222 in canonical ledger), not "OR".
- AC-13: CONCRETE — BOTH manifests regenerated + non-strict validate exit 0 + cited EDs in ledger.

6-gate ↔ binding-AC coverage confirmed: conservation→AC-1, restore→AC-2, crash→AC-3, no-unlink→AC-4, materialized→AC-8, fail-closed→AC-9. Each ≥1 binding AC; none dispositionable.

## 4 — Gauntlet lane note (seeds the gauntlet)
- **qa-reviewer (always):** functional (6 gates, conservation at every crash seam, dropped-id negative control), traceability (every AC→runnable verified_by; flag vacuous-green crash-seam tests), integrity (compactor MUST NOT modify archive.js/rotate.js/logger.js — assert byte-unchanged).
- **backend-reviewer (all-backend):** Check-7 on events-compact.js/materialize-core.js/materialize.js/cli.js diff/decisions refactor. Specifics: never-throw contract (every fs call wrapped); two-phase validate-then-emit (no early stdout); require-time invariant TAIL_KEEP<FOLD_TRIGGER<20000; C2 genuinely routes through shared primitive.
- **security-reviewer (always — data-integrity + path-containment):** (1) compactor passes only TRUSTED root to archive.archive; (2) readArchiveStrict resolves generations via in-root rel paths, no dangling/junction follow out of root; (3) fail-CLOSED is a security property (torn index as "clean" = integrity failure); (4) S7 indexed:false exits non-zero, never silently green.
Families: 2-family (GPT+Claude); agy/gemini DOWN. sol→terra on the security shape.

## 5 — Top QA risks
1. [RESOLVED by ε] AC-3 unfalsifiable without a deterministic seam-abort hook → folded into build_spec C1 as a required deliverable + AC-3 verified_by names it. Was the single most dangerous false-green.
2. [HOW] Dropped-id negative control mandatory (AC-1 ⊆ passes trivially for a no-op compactor).
3. [HOW] "NO partial output" needs explicit `stdout===""`, not just non-zero exit.
4. [HOW] AC-6 concurrency proven via pre-acquired-lock no-op, not real interleaving.
5. [Named, accepted] Tail duplication + summary accumulation = R-1-SAFE over-preservation; union dedupes by id, suppresses redundant summaries. Reviewers must NOT flag a crash-retry duplicate as corruption.

Confidence 0.87 (→0.92 once the seam-abort hook is a named deliverable — now folded).
