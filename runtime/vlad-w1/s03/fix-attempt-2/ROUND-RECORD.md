# S-VLADW1-03 — FIX ATTEMPT 2 (the last) — ROUND RECORD

Conductor: Alex ε · surface: `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine` · base `0732cd8` · this record covers everything landed before the QUALIFYING
gauntlet (`runtime/vlad-w1/s03/gauntlet-3/`).

**α applies the release rule. This is the round record, not a ruling.** Nothing here is a verdict on S1-S5.

---

## 1. Bundles landed

| commit | bundle | dispatch_id | ok | elapsed_ms |
|---|---|---|---|---|
| `6208ca3` | 10e — pointer-lint contradiction, scan-root seam, F-5 | `d-mtd4wgow-f2bfd99e` | true | 430496 |
| `55fc6a3` | 10d — full-history re-scrub (MECHANISM route) | `d-mtd4ziji-bc858c64` | true | 522500 |
| `d5fca1d` | 10b — bind every Asserted/Ceiling paragraph BY DERIVATION | `d-mtd57p8i-e4b7e2ec` (resume) | true | 417771 |
| `49fa49f` | 10a — one shared lexer; the inert invocation control closed | `d-mtd54qh8-de654269` (resume) | true | 668856 |
| `977ab14` | 10c — ordering truth in entry source + Part B | `d-mtdb7tjj-4f21bd39` | **false** (see below) | 1200177 |
| `4f12cfb` + `b2583d6` | 10f — coordinated bind edit + finish the no-op guards | `d-mtdc1jgx-71f1e64f` | true | 235453 |

### 10c — the record says dead, the tree says done. Timing, to the second.

- dispatched **18:53:18.799Z** (`phase:"started"` row confirmed 8 s after fire)
- **committed `977ab14` at 19:12:56Z**
- 20-minute background bound fired at **19:13:18Z** — `ok:false`, `exit_code:null`, 0 stdout bytes

**It committed 22 seconds before the bound killed it.** What the timeout cost was the ENVELOPE, not the
work: `out-10c.json` holds the wrapper's timeout envelope, not the builder's JSON. This is a third distinct
death signature, and all three are now separable:

| signature | ledger | disk |
|---|---|---|
| foreground clamp (10a, 10b) | `ok:false`, elapsed **540xxx** | real work UNCOMMITTED |
| nothing spawned (10c, operator's PowerShell attempt) | **no row at all** | nothing, anywhere |
| bound timeout after commit (10c, this dispatch) | `ok:false`, elapsed **1200177** | work COMMITTED, tree clean |

**The wrapper warned about this at fire time and the conductor did not read it.** `err-10c.log` carried:
*"[dispatch-claude] WARN (ED-257 right-sizing): build-chain prompt for 'backend-fixer' is 16810B (> 12000B
floor) — implies a >15-min unit that may reap read-only with zero worktree diff."* The fold-ins took 10c
from ~9 KB to 16810 B and pushed it past the bound. **The enforcer already existed and fired correctly; it
was ignored.** That is worth more than a new enforcer. 10f was deliberately sized at 6044 B — half the floor
— and finished in 235 s.

**Verified against the brief (no envelope, so by diff):** Part A complete — the false clause
`node: builtins still resolve first.` is GONE from both entries (grep exit 1), the qualified sentence is
present in both, and the fragment-pin was properly restructured (`RE_DERIVED_CLAIM` replaced by
`CLAIM_FIRST_LINE` + `CLAIM_PARAGRAPHS`, with a standing test asserting the false clause is absent). B1
landed as a true one-word edit and the builder **did NOT** touch the forbidden canonical copy — leaving the
tree RED rather than reaching outside its scope, which was the correct choice. B3 taken: `.gitattributes`,
27 lines, 6 files touched, no mass line-ending rewrite. **B2 was INCOMPLETE** — 10c reached only
`custody-claim-lint.test.js`; that gap is what 10f closed.

Conductor-verified at `49fa49f`, each gate run as its own command and its own exit code read:
`node --test "test/*.test.js"` → exit 0, **308 pass / 0 fail / 0 skipped / 0 todo** (floor 294);
`npm run check:ship` → **exit 0**; `git status --porcelain -- engine/` → empty.

---

## 2. GROUND TRUTH — module evaluation order, measured not reasoned

Method: a `node:module` load hook that prepends an `EVAL <url>` marker to every `file:` module body. A
statement at the top of an ESM body runs AFTER that module's own static dependencies have evaluated, so the
marker sequence IS true evaluation order (not load order). Shebang lines are preserved so
`node_modules` entry files do not throw. Run by the conductor against the live worktree.

**Reading A — `node src/server-entry.js` (server-entry as the process entry point).** Module bodies
evaluating before its scrub call, in order:

1. `src/env-scrub.js`
2. `src/bootstrap.js`

**Exactly TWO.** The unqualified sentence is TRUE under this reading.

**Reading B — `await import('./driver/host-free-driver.js')` (driver as the process entry point).** Module
bodies evaluating before `src/server-entry.js`, in order:

1. `src/env-scrub.js`
2. `src/bootstrap.js`
3. `driver/host-free-driver.js`
4. `node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs`
5. `src/quota.js`
6. `src/model-seam.js`
7. `src/output-shim.js`
8. `src/spawn-shim.js`

**EIGHT** module bodies, including a production dependency's, evaluate before `src/server-entry.js` in that
process. The unqualified sentence is FALSE under this reading.

**Reconciling with the gauntlet-2 backend lane.** That lane reported "at least 22 modules evaluate before
`server-entry.js:78`" using its own `node:module` load hook. The conductor's instrumented count of `file:`
module bodies is **8**. The counts differ; the DIRECTION does not — both runs show the sentence false under
the driver reading. The likely reconciliation is scope: the lane appears to have counted `node:` builtin
loads and/or load events rather than only instrumented `file:` module-body evaluations. **Neither count is
authoritative for the other's method, and no count is going into shipped copy** — a number is a property of
the import graph on the day it is read and would rot on the next append. A qualifying lane that wants to
re-derive this should state its method, because the two methods legitimately disagree.

**Security conclusion, unchanged and confirmed:** in Reading B the driver's OWN scrub call runs at position
3, before `spawn-shim.js`, `model-seam.js` and the SDK. Whichever module is the process entry, that
process's own scrub runs before anything that could carry or observe a credential. This is a
claim-truthfulness defect, not a leak.

---

## 3. OBSERVED FINDINGS from implementing the isolation rule

### 3a. The enforcers refuse a junctioned `node_modules` — fail-closed, working as designed

To give each mutating lane an isolated copy cheaply, the conductor created three detached git worktrees at
`49fa49f` and junctioned `engine/node_modules` to the live tree's copy. `check:custody` went RED:

> `[no-held-secret-in-surface] RED node_modules — no-held-secret-in-surface/walk-unhandled-entry-type:`
> `walkFiles: dirent is neither a directory nor a regular file (symlink or other special entry) — refusing`
> `to silently skip it`

The scanner refused to walk a junction rather than quietly skipping it. **This is the repo's fail-closed
discipline working correctly and is recorded as a positive observation, not a defect** — but it forecloses
the cheap isolation trick, which is worth knowing before anyone tries it again. Real copies (robocopy,
5555 files) resolved it and `check:ship` then exited 0 in the isolated tree.

### 3b. A clean checkout is NOT byte-identical to the working tree

Measured on `engine/CUSTODY.md`:

| tree | CRLF | bare LF | bytes |
|---|---|---|---|
| live worktree (`engine-lane`) | 0 | 282 | 24549 |
| fresh `git worktree add` of the SAME commit | 282 | 0 | 24831 |

The live tree holds LF only because builders rewrote the file; any fresh checkout on a machine with default
`autocrlf` materialises CRLF.

Consequence, measured: on the clean checkout `npm run check:ship` **still exits 0** — the lint's "modulo
line-wrap whitespace" tolerance holds, so the SHIPPED gate is unaffected — but `node --test` fails on
mutant tests whose `.replace()` search literal spans a line break, because the mutation matches nothing and
becomes a no-op. Two confirmed instances, both in `engine/test/custody-claim-lint.test.js`: the Rule 4
CEILING mutant (searching for ``"`opts.stdio` pass\nstraight through to the underlying"``) and Rule 4b.

**Characterisation, corrected.** An earlier conductor message called this "a falsifier that silently becomes
a no-op" and "the fixture-that-cannot-fail shape". **That was wrong on the word *silently*.** Bundle 10b
shipped the guard `assert.notEqual(mutated, REAL_CUSTODY, "the F-4 mutation must actually change the
text")`, so on the CRLF checkout the test FAILS LOUDLY, and it fails precisely because the mutation did not
mutate. The correct characterisation, and the one α should adjudicate against, is: **a portability defect
with a working alarm, not a fixture that cannot fail.** F-4 itself is EOL-safe — its search literal is
single-line. Repair is folded into bundle 10c.

**CAVEAT, recorded verbatim because it cuts against the conductor:**

> I removed the three worktrees before fully enumerating the clean-checkout failure list, so I can attest to
> those two failures and to check:ship exit 0, but I cannot claim that is the complete set.

Because the enumeration was incomplete, 10c was briefed to apply the no-op guard to **every** mutant test
added by 10a/10b/10e, not only the two observed.

### 3c. RESOLVED — the clean-checkout probe re-run at `b2583d6`, with the FULL failure list

Re-run after 10c and 10f, using the same method (detached `git worktree add` at the commit, real
`node_modules` copy — not a junction, per §3a):

| measurement | live worktree | clean checkout of `b2583d6` |
|---|---|---|
| `engine/CUSTODY.md` | CRLF 0, bare LF 282, 24536 bytes | CRLF 0, bare LF 282, 24536 bytes |
| `node --test "test/*.test.js"` | exit 0 — 318 pass / 0 fail / 0 skipped / 0 todo | exit 0 — **318 pass / 0 fail / 0 skipped / 0 todo** |
| `npm run check:ship` | exit 0 | **exit 0** |
| `npm run check:pointers` | exit 1 (red by design, not in `check:ship`) | exit 1 (same, expected) |

**FULL failure list on the clean checkout: EMPTY. Zero failures.**

The fidelity gap is closed **at its root**, not tolerated: bundle 10c's B3 added a `.gitattributes`
pinning the byte-bound files to `eol=lf`, so a fresh checkout is now byte-identical to the tree under
judgment (identical byte count, identical line-ending census). The earlier incomplete-enumeration caveat is
therefore **moot rather than merely unresolved** — there is no residual failure list to enumerate. Both
halves of the repair shipped: B3 removed the cause, and 10c/10f's EOL-agnostic + no-op⇒FAIL guards mean
that if a mutation ever silently stops mutating again, it fails loudly instead of passing.

---

## 4. AC-8.6 — DEFERRED, and the residual that does NOT defer with it

**Verified absent at `49fa49f` by direct read, both halves of the β relay:**
- `grep -n "selfcheck-runs-on-user-machine" engine/test/custody-runtime.test.js` → **no match** (exit 1).
  That file carries exactly two test nodes, both AC-8.4.
- `npm run check:pointers` → exit 1, and the pointer is classified **missing-NAME**, not missing-file:
  `[verified-by-resolver] RED line 313 (missing-name): engine/test/custody-runtime.test.js::selfcheck-runs-on-user-machine`
  Totals at this commit: 11 `missing-name` lines, 4 `missing-file` lines = 15 unresolved of 48.

AC-8.6 is deferred to a named successor sprint by operator/lead decision; β ruled (msg_id
`4e1b7a92-3c68-4d05-9a71-6f28c0b5e3d4`, DECIDE, Class B) that the deferral is **not** a gate reshape. The
sprint DoD line for AC-8.6 stays UNCHECKED with the deferral reason and the successor pointer.

### The CLASS-form residual (criterion S5, build-spec item 6, field 4)

β's point, recorded here because **deferring the work does not defer the residual**, and because S5
enumerates build-spec items 1, 2, 3, 4, 6 and 7 — item 6 stays in that set:

> **Build-spec item 6, field 4 — INSTANCE.** It closes AC-8.6 specifically. **Residual:** the general
> property — *every shipped control is invoked by some product-layer path* — is what item 4's walker
> approximates; AC-8.6 is one instance of it, and **no enforcer asserts the general form.**

`CUSTODY.md` discloses only the INSTANCE (that this one fixture is not wired to run in a user's install).
**The CLASS form — that no enforcer asserts "every shipped control is invoked by some product-layer path"
— is disclosed nowhere on the shipped surface.** S5 permits "recorded OR shipped", so it is recorded here,
and it must also be carried into the successor tracker pointer. Per β (Q3, tautology bar), **the build spec
that originally named this residual does not count as its disclosure** — the record has to be made
somewhere a reader other than the spec's author will meet it.

---

## 5. Infrastructure findings, filed as enforcement debt

- **ED-353 — the canonical clamp gap (filed by α at 16:12Z). CITE THIS ONE.** ε independently filed the same
  gap as ED-355 at 16:45Z; ED-355 is now marked `duplicate-of: ED-353` by a status-change row, with ε's
  richer enforcer candidate folded into ED-353 by an amendment row. The duplicate is itself instructive and
  α recorded it as such: *"a condition that names no owner gets done twice"* — the lead's ledger watcher and
  the conductor both diagnosed the same clamp within 33 minutes and both filed. A build-chain dispatch
  fired through a background lane must carry `WARPOS_DISPATCH_BACKGROUND=1` or `dispatch-claude.js`
  fail-closed clamps it to the 540 s foreground ceiling, with nothing warning at fire time. Bundles 10a and
  10b died at exactly `elapsed_ms` 540153 and 540156 (`d-mtd4r3xg-c8128c73`, `d-mtd4tq0x-bd7503d9`),
  `ok:false`, `exit_code:null`, 0 stdout bytes — the deterministic clamp, not a builder verdict. **Both had
  real uncommitted work on disk**, so what was lost was the commit, not the work; both were recovered by a
  resume-and-finish dispatch with the background signal set. Enforcer candidate: a stderr advisory at spawn
  when the resolved bound equals `FOREGROUND_CEILING_MS`, and/or tagging completion rows at the ceiling as
  `death_cause:"foreground-clamp"` so `gauntlet-verify` and `epsilon-liveness` report a timeout rather than
  a reap. A doc line is NOT sufficient: the wrapper header already documents the escape and it was missed.
- **ED-354 — installed-roster parity** (filed by α; do not re-file). Dispatching role `security-fixer` into the
  vlad worktree cwd was reaped in 375 ms — `--agent 'security-fixer' not found`, exit 1, 0 bytes,
  `d-mtd4wbym-457e7e44`. That roster carries `security-builder` / `security-lead` / `security-reviewer` but
  no `security-fixer`. Re-fired as `security-builder`.
- **ED-356 — merge-guard resolves its doc-ref scan root from the main repo, not the committing worktree**
  (filed by α from ε's diagnosis; policy: a pre-commit guard that scans documents must resolve its scan root
  from the WORKTREE the commit is being made in, never from the main repo root, and its failure output must
  name the root it scanned). **This is the 10a landing paragraph.** The 10a
  builder completed its work, staged all three files, and could not commit: the merge-guard doc-ref-integrity
  hook fails on **83 pre-existing broken doc refs** in `.claude/commands/*.md` and `README.scaffold.md` that
  it never touched (tracing to scaffold commit `515ed24`, already an ancestor of HEAD). Its diagnosis: the
  guard evaluates from the vlad MAIN repo root (359 docs, 83 broken) rather than from the worktree (410
  docs, 4 broken). Not uniform — 10b/10d/10e committed through it — so it is state- or timing-dependent.
  **The builder tried the plain commit, tried once with `--no-verify`, then STOPPED rather than reshaping
  further, and explicitly declined to add the dead refs to `doc-ref-integrity.allowlist.json` because
  allowlisting a check to make its own commit pass is the linter-suppression its instructions forbid. That
  was the right call and is recorded as such.** The conductor verified the staged tree, ran the suite and
  `check:ship` green, and landed the commit unchanged as `49fa49f`.

---

## 6. What the qualifying gauntlet must NOT carry forward

- **S5 must be RE-ADJUDICATED on the post-deferral surface.** Gauntlet-2's "S5 HOLDS" is **not** carried:
  the AC-8.6 deferral changes what the shipped surface must disclose, and the CLASS-form residual in §4 is
  new to this round's record.
- **S1 must be RE-ESTABLISHED, not cited** — this is explicit in the rule and predates the deferral.
- Lane briefs state the isolation mode: **the three mutating lanes (`qa-reviewer`, `backend-reviewer`,
  `security_claude_hunter`) run SERIALIZED on the live worktree**; `security-reviewer` (agy) runs in
  parallel with them because it is served toolless-inline and mutates nothing. Isolated copies were
  rejected for the fidelity reason in §3b — a lane judging a CRLF tree would be judging the conductor's
  scaffolding rather than the tree under review.
