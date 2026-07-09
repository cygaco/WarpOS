# E-MC-READINESS-ANALYSIS-001 · Track 1 — Hardening Simulation (command-flow composition)

**Type:** READ-ONLY / ANALYSIS-ONLY · sealed-isolated simulation + static cite. No product/framework/scripts file modified.
**Date:** 2026-06-18 · **Author:** Alex (Claude reliability/security analyst, A1) · **Method:** read the install/update spine + sprint state writer + the keystone harness in full; ran a real BOM×atomicity×traversal composition probe against a SEALED payload in `os.tmpdir()` (canonical unreachable, torn down in `finally`); cross-referenced Track-2/3/4/6 and git history.
**Consumer model (the driver under test):** the Master Console invoking the engine **headless, programmatically, in parallel**, on Windows/PowerShell — omits flags a human would pass, retries slow runs, feeds capsules from canonical.

---

## tl;dr

**8 flow-level findings.** Against Track-3's 5 structural classes, the end-to-end picture is materially *better* than the static read implied, because three of Track-3's HIGH cites were **fixed on disk after Track-3's snapshot** (commit `8339e0b5` "cwd-independent lock pool + atomic sprint-state writes", and `full.js` RI-007 closed-sprint guard) — Track-3 read a pre-fix tree.

Severity roll-up (flow-level): **0 critical · 1 high · 3 medium · 4 low/informational.**

| Class | Track-3 said | A1 flow-level verdict | Fires end-to-end? |
|---|---|---|---|
| **C1** (BOM on JSON.parse) | HIGH, unguarded in update.js/transaction.js | **SPLIT**: read-path **REFUTED** (BOM-strip already in `update.js:62`, `transaction.js:51` — confirmed); **classify-path CONFIRMED** (BOM survives `content-hash.normalizeText` → UPDATE_SAFE→MERGE_CONFLICT) | **Partially** — classify residual fires; read-path masked |
| **C2** (non-atomic writes / no lock) | HIGH, raw `writeFileSync` in `fs.js#writeYaml` + no lock | **SPLIT**: atomicity **REFUTED** (`fs.js#writeYaml` now `atomicWrite` temp+rename, `fs.js:220-247`); mutual-exclusion **CONFIRMED-NEW** (no `heartbeat.check()` at `main()` entry, no per-sprint lockfile) | **Partially** — torn-write masked; concurrent double-resume still races |
| **C3** (in-place validation gap) | HIGH (slug/reserved-name on in-place scaffold) | **CONFIRMED static** — not reachable via the keystone sealed contract (scaffold isn't a sealed lifecycle step); carried from Track-3 | Not reached by gate |
| **C4** (written-never-read guardrail) | HIGH — `minUpgradeableFrom`, RI-007 closed-sprint | **SPLIT**: RI-007 **REFUTED** (closed-status refuse now exists, `full.js:1760-1768`); `minUpgradeableFrom` **CONFIRMED** (still zero read sites) | RI-007 masked; minUpgradeableFrom latent |
| **C5** (no prod traversal containment) | HIGH — `update.js` apply/backup/rollback `dest` | **CONFIRMED at flow level** — `seal()` harness guards `../` (`isWithin`, verified by probe P3), but production `applyUpdateDecisions` (`update.js:548,592`) + rollback (`transaction.js:415`) join+copy with **no containment assertion** | Slips the sealed contract entirely |

**The load-bearing finding:** the keystone sealed-capsule gate's warm/update cell **runs `update.js --status` only** (read-only manifest validation, `test-sealed-capsule-gate.js:502`). It **never drives `--apply`**, never reads a real `framework-installed.json`, never runs a real classify→apply→commit. So **C1(read)×C2×C5 cannot fire inside the sealed contract — not because they're fixed, but because the mutating spine is not exercised.** The sealed gate certifies the *read-only* consumer surface; the *mutating* update spine is an evidence blind spot.

## Coverage matrix — verb × (cold/warm) × outcome

| Verb (flow) | cold | warm | Evidence |
|---|---|---|---|
| `update.js --status` (gate warm cell) | n/a | **read-only — mutating C1/C2/C5 not-reached** | `test-sealed-capsule-gate.js:496-503`; probe P1 (sealed payload has **no** `framework-installed.json`) |
| `update.js --apply` (classify→apply→commit) | masked (read-path BOM) · **fired (classify BOM, C1)** | **fired (classify BOM → Class-C block); C5 traversal not-reached-by-gate but unguarded in prod** | probe P2; `update.js:548,592` no `isWithin` |
| `update.js --apply` BOM on `framework-installed.json` | **masked** (`readJSON` strips BOM, `update.js:62,87`) | **masked** | probe P1 (replicated `readJSON`: stripBom holds; naive parse would throw) |
| `update.js --rollback` (BOM on header/snapshot) | **masked** (`readHeader`/`readSnapshot` strip BOM, `transaction.js:51,347,352`) | **masked** | static — Track-3's "rollback dies mid-recovery" **REFUTED** |
| `/sprint:full` no `--sprint` on a CLOSED primary | **masked** (refuse, `full.js:1760-1768`) | **masked** | RI-007 guard confirmed on disk |
| `/sprint:full` parallel double-`--resume` | **fired** (no mutual exclusion) | **fired** | `full.js` heartbeat emit-only (`:1924,1950`); `main()` never calls `heartbeat.check()`; no lockfile |
| sprint state write (`writeYaml` torn buffer) | **masked** (atomic temp+rename) | **masked** | `fs.js:220-247`; commit `8339e0b5` |
| `seal()` malformed-manifest `../` dest | **masked** (`isWithin` reject) | **masked** | probe P3 (`escapeFileWritten=false`) |

## Findings table

| id | command-flow | sev | repro | evidence | readiness-risk | execution-route | track-3 relation |
|---|---|---|---|---|---|---|---|
| **A1-F1** | `update.js` classify on a BOM'd text asset (warm `--apply`) | **HIGH** | **sealed-run** | probe **P2**: real sealed asset — `cleanHash 935aeb2ba0ac ≠ bomHash 93c6028c4a9f`. `content-hash.js:56-61 normalizeText` strips CRLF/CR but **not** U+FEFF | A PowerShell-touched / fresh-migrated framework file mis-classifies UPDATE_SAFE→**MERGE_CONFLICT** → Class-C → **`--apply` blocks** (`update.js:1096-1106`). Headless Console can't resolve Class-C → stalls | EXECUTION: add BOM strip to `normalizeText` (`.replace(/^﻿/, "")` before CRLF normalize). Closes C1 at the single content-hash surface | **CONFIRMS-C1** (classify half) |
| **A1-F2** | `/sprint:full --resume` ×2 concurrent | **MED** | static | `full.js`: `heartbeat.emit` only (`:1924,1950`); `main()` (`:1744+`) never calls `heartbeat.check()`; **no lockfile** in `scripts/sprint/` | Two resumes for one sprint run the same phases → duplicate release attempts, racing registry flips. Atomic writes prevent a *torn* file but not *two coherent writers* | EXECUTION: at `main()` entry, `heartbeat.check(sprintId)`; refuse a second non-terminal run unless `--force`; per-sprint `wx`-flag lockfile | **CONFIRMS-C2** (lock half) / **REFUTES-C2** (atomicity now `atomicWrite`) |
| **A1-F3** | `update.js --apply`/`--rollback` — capsule `dest` containment | **MED** (cond. HIGH per Track-2 F3/F4) | static | `applyUpdateDecisions` `update.js:548` (`path.join(targetRoot,d.dest)`), `:592` (`copyFileSync`); rollback `transaction.js:415,430`. **No `isWithin`** on any prod write path. Gate harness DOES guard it (`isWithin`, `test-sealed-capsule-gate.js:84-88`) | A garbled/hostile capsule with `dest:"../../etc/.bashrc"` writes **outside the target repo** on apply; rollback follows. Sealed gate can't catch (guards its own seal, never runs `--apply`) | EXECUTION: assert `path.resolve(targetRoot,dest).startsWith(targetRoot+sep)` + reject symlinks before every copy/unlink/backup. Pairs Track-2 **F4** | **CONFIRMS-C5** (containment ONLY in gate harness, never prod) |
| **A1-F4** | keystone gate warm/update cell coverage | **MED** (meta/blind-spot) | **sealed-run** | probe **P1**: sealed payload has **no `framework-installed.json`**; `test-sealed-capsule-gate.js:496-503` runs `update.js --status` (read-only). Certified GREEN (`sealed-gate-full.log`) exercises **zero** mutating update code | The Completed sealed-capsule contract gives **false confidence on the update spine** — 1311/1311 GREEN says nothing about classify/apply/commit/rollback. C1(read), C2, C5 unverified *by construction* | EXECUTION: add a `--full`-tier mutating warm cell — seed a real `framework-installed.json`, run `update.js --to <v> --apply` (BOM-injected variant) against the *prior* sealed version, assert classify counts + traversal containment. Structural close for A1-F1/F3 detection | **NEW-at-flow-level** (the composition gap Track-3's unit read could not see) |
| **A1-F5** | `update.js --apply` — `minUpgradeableFrom` floor | **LOW** | static | written `release-canonical.js:429-430`; **zero read sites** in `update.js`/`preflight.js`. Migrations whose `from` doesn't match `break` silently | Very-old install jumping many versions proceeds across an unsupported gap; half-migrated install reports success | EXECUTION: preflight compares `fromVersion` vs capsule `minUpgradeableFrom`; below floor → force fresh-install | **CONFIRMS-C4** (`minUpgradeableFrom` half) |
| **A1-F6** | `update.js` capsule integrity when `checksums.json` absent | **LOW** | static | `update.js:206-210` warns + proceeds when checksums absent. Sealed gate verifies (`verifyCapsuleIntegrity`, H3) but prod `loadCapsule` permissive | A truncated/older capsule with no checksums is trusted. Subordinate to Track-2 **F3** (provenance≠integrity) | EXECUTION: `--require-checksums` red on absence under the Console profile; pairs Track-2 F3 signing | **CONFIRMS** Track-3 LOW (×Track-2 F3) |
| **A1-F7** | `update.js --apply` post-update generators fail-open | **LOW** | static | `runGenerators` `update.js:871-903` records non-zero but doesn't fail; outcome `:1572-1576` excludes generator status unless `--strict-postflight` | Cross-version update that breaks `paths/build.js` reports `committed` (green) with stale `.claude/settings.json`/`paths.json` → first feature use fails far from cause | EXECUTION: fold a failed *required* generator into outcome; default `--strict-postflight` on for Console | **CONFIRMS** Track-3 MED |
| **A1-F8** | stale `active.lock` after crash bricks future `--apply` | **LOW** (Track-3 HIGH; down-ranked) | static | `transaction.js:80-104`: lock stores only txId — **no PID/host/ts**; begin refuses on any present lock (`:204-211`); `clearActiveLock` fail-open | A crash between `writeActiveLock` and commit leaves a corpse lock; every later `--apply` throws `ETXLOCK` until a human deletes it — but **operator-recoverable** and loud, so not silent-corruption HIGH | EXECUTION: write `{pid,host,startedAt}`; reclaim on dead-PID/TTL with an event | **CONFIRMS-C2-adjacent** (flow-level down-rank — loud+recoverable) |

## The load-bearing probe — BOM-injected warm/update + composition (sealed run)

Sealed the current canonical bill-of-materials (1332 assets) into `os.tmpdir()`, isolated (canonical-unreachable, 0 offenders), drove the three cells the gate skips. Verbatim:

```
seal: ok=true copied=1332/1332 missing=0 mismatched=0
isolate: repo=...\Temp\warpos-sealed-NGn5BN OUTSIDE_canonical=true
canonical-unreachable: true (offenders=0)
sealed framework-installed.json present: false
P1 SKIPPED: no framework-installed.json in sealed payload
P2 asset=.claude/agents/_evals/resonance-conversion-rubric.json
   cleanHash=935aeb2ba0ac bomHash=93c6028c4a9f SAME=false
P2 VERDICT: BOM SURVIVES content-hash (C1 classify FIRES: clean file -> MERGE_CONFLICT / Class C block)
P3 seal ok=false mismatched=["path escapes sealing boundary (../ traversal)"] escapeFileWritten=false
P3 VERDICT: dest "../../escape.md" REJECTED by isWithin (C5 contained in the GATE harness only)
TEARDOWN: tmp payload+repo removed (0 writes outside os.tmpdir).
```

**Did C1×C2×C5 fire end-to-end, or did the gate catch them?** *Neither, and that is the finding.* The composition does not fire inside the sealed contract — because the sealed contract never drives the mutating spine (warm cell is `--status`, read-only; there is no `framework-installed.json` to BOM because it's the consumer's installed snapshot, not a shipped asset). Exercising the primitives directly: C1 read-path MASKED (REFUTES Track-3); C1 classify-path FIRES (P2, CONFIRMS); C5 contained in the harness ONLY (P3) but slips prod apply/rollback.

## Cross-references
- **Track-2**: A1-F3 ≡ Track-2 **F4** (post-update script-path traversal); A1-F6 ≡ Track-2 **F3** (integrity≠provenance). Traversal+provenance = the update-channel trust root.
- **Track-4**: A1-F4 is the *runtime* analog of Track-4's thesis — "detection exists; the timing is the hole." Same disease, deeper layer (mutating-update contract runs never).
- **Git provenance for REFUTES**: commit `8339e0b5` landed `fs.js#writeYaml` atomicity + `concurrency-lock.js` `__dirname` anchor AFTER Track-3's 2026-06-16 snapshot; `full.js:1760-1768` carries RI-007. Textbook verify-don't-inherit (the static doc was correct *at its read time*).

## Limitations
- No real `--apply` driven inside isolate (needs a two-version sealed pair = the A1-F4 execution build). C1-classify (P2) + C5-seal (P3) exercised directly; C2-lock, C5-prod-apply, C4, F7/F8 are static cites (file:line, marked `static`).
- C3 carried from Track-3 (not a sealed lifecycle step). `/portfolio:new`/`/admin`/`/panel` mutating verbs scoped out per the envelope (install/update spine = highest-leverage composition).
- Single platform (Windows — the operator env + Console target); POSIX inferred from the same code paths.

A1 ANALYSIS-ONLY HELD: 0 writes outside os.tmpdir (torn down).
