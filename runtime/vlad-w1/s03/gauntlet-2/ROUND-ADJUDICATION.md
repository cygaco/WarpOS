# S-VLADW1-03 — gauntlet-2 (fix attempt 1's successor run) — CONDUCTOR ADJUDICATION

Conductor: Alex ε · commit `0732cd8` · evidence `runtime/vlad-w1/s03/gauntlet-2/`
Release rule S1–S5 pre-committed by β at row 305 (`7c05e9d1`). **α applies the rule. This is the evidence
package, not the ruling.** Per α, this run is **not terminal** — the gate-bearing run is the one whose
evidence directory follows **fix attempt 2**, which is the LAST attempt.

> Probe credential literals in this directory are redacted to `<PROBE-LEAK-LITERAL>`. They were synthetic
> decoys, never real secrets, but the repo's secret-guard refuses the shape and it is right to.

## Roster and liveness

| Lane | Record | Verdict |
|---|---|---|
| `qa-reviewer` | `d-mt0q4sb4-9a16a3f4` `ok:true` | **FAIL** |
| `security_claude_hunter` | `d-mt0qhpkf-a6a5a230` `ok:true` | **FAIL** |
| `backend-reviewer` | `d-mt0qhpmn-3817c90d` `ok:true` | **FAIL** |
| `security-reviewer` (agy) | `ok:true` | **FAIL** |

**`gauntlet-verify`: PASS, exit 0** (`gauntlet-verify.txt`). Two notes on the honesty of that gate: the
window had to be widened to 22:40Z to catch all four records — a narrower window reported two roles as
`no-record`, which is a **query artifact, not a death**, and would have read as a halt. And the `fell-back`
flag on `security-reviewer` is **gauntlet-1's dead first dispatch** still inside the widened window, not a
gauntlet-2 signal.

**Three lane-runs had to be re-dispatched to get a verdict at all.** `backend-reviewer` was lost to a
truncated mid-thought return TWICE (once per gauntlet); `security_claude_hunter` once. Each time the lane
had done substantial real work, and each time it read as `no-record` — a dead lane, never a pass. What
works is a **narrowed dispatch with an explicit instruction to prioritise emitting the JSON**; both
returned promptly under it. This is a standing operational cost worth an enforcer.

## S-criteria — consolidated

**S1 — HOLDS.** No shipped path leaks. The qa lane ran the committed suite with its raw-control tests
green; the security lane re-verified the battery and, importantly, **declined to fire S1 on its own
strongest finding** (see S3) because the bypass required adding a non-shipping entry point. It also filed a
novel split-value carrier as LOW rather than inflating it, correctly noting it is not env-inheritance and
requires a caller already holding the plaintext.

**S2 — FAILS.** Two lanes, independently, on different grounds. The gauntlet-1 S2 defects ARE fixed;
these are new, and three of them were **introduced by fix attempt 1**:

- **`CUSTODY.md:7` claims the Asserted paragraphs are bound byte-for-byte. Only A1–A4 and A5's three
  carrier sentences are.** The qa lane inverted A7's rotation sentence into the exact falsehood bundle 9d
  was written to correct, leaving the text self-contradictory — `check:custody` exit 0, `check:ship` exit 0,
  294/294 — against a **working control** (rewording a bound A1 sentence → exit 1) proving the harness
  itself is fine. It also asserted *"AC-8.6 HAS LANDED and the self-check runs in every user install"* with
  every gate green. **Bundle 9d widened this from one unbound Asserted paragraph to three** by adding
  A7/A8 under the uncorrected header.
- **The rewritten ordering sentence is still false, one reading over.** The backend lane proved with a
  `node:module` load hook that in the DRIVER's process at least 22 modules evaluate before
  `server-entry.js:78`'s scrub call. The sentence is unqualified and true only under the process-entry
  reading. The same unqualified claim is on the shipped surface at `CUSTODY.md:68-70`, where a security
  inference is drawn from it. **The class was narrowed, not closed.**
- **The new `node:` builtins clause is false and self-contradictory**, is NEW in this rewrite, and
  `RE_DERIVED_CLAIM` pins only the sentence's first line, so it shipped with nothing asserting it. The
  repo's own `CUSTODY.md:79-80` contradicts it.
- `package.json#vladPointerLint` is now **self-contradictory**: `currentState` was corrected to
  "TEN drift + ONE missing WORK" with an explicit warning against regrouping AC-8.6, while `owed` on the
  adjacent line still says "Repoint the eleven name-drift pointers". Wrong-but-consistent before;
  contradictory after.

**S3 — FAILS.** The qa lane read it as holding (it observed RED-on-removal for both entries, which is
true). The security lane defeated it with execution, and that evidence is decisive:

`src/bootstrap.js:27` contains `initCredentialCustody(...)` **inside a comment**, and that text matches
`CALLS_SCRUB_RE`. **Conductor-verified independently:** the regex matches `bootstrap.js` at line 27 and
does NOT match `env-scrub.js`. Since bundle 8a put `bootstrap.js` on the mandatory hot path of both
entries, **the assertion's `anyCallFound` half is pre-satisfied by a comment for every shipped graph — it
is inert.**

The lane then built the bypass: a new entry with exactly one static import of `bootstrap.js` that
deliberately does NOT name the scrub binding (so `orphanedImporters` cannot see it) and reaches
`child_process` dynamically. Result: `node --test test/env-scrub.test.js` → 22/22, A1 GREEN; and running
that entry with a decoy credential in the environment printed **`CHILD SAW: <PROBE-LEAK-LITERAL>`**. A real
child obtained a real credential against a green gate.

**Why S3 and not S1:** the bypass required adding a non-shipping entry. What is proven is that the
**control is inert**, not that the package leaks. The lane graded it that way itself and the conductor
concurs — inflating it to S1 would corrupt a criterion that is honestly met.

**This also explains why my own driver-mutant verification passed:** that mutant deletes the CALL but
leaves the `import { initCredentialCustody }` line, so it is caught by the `orphanedImporters` half. The
upgrade from reachability to invocation is **half-delivered** — the orphaned-importer half binds, the
real-call half does not.

**The irony is instructive and belongs in the fix brief:** bundle 9a fixed comment-blindness in the
extractor by stripping comments before matching. Bundle 9b's classifier has the **mirror bug** — it
matches call-shaped text without stripping comments. Same sprint, same file family, opposite direction.

**S4 — NOT ESTABLISHED.** The qa lane's "holds" rests on the committed PLANT tests' green state and
fixture-directory presence, **not** on per-fixture mutation. The security lane observed only F-2 carrying
an "OBSERVED RED" title and said plainly *"silence here is not a pass."* β's bar is present **AND observed
RED**. **Nobody has demonstrated that this round.** Treat S4 as unmeasured, not as holding.

**S5 — HOLDS.** All four named residuals reached `CUSTODY.md` (P2 Ceilings plus new A7/A8), verified by the
qa lane. The caveat that belongs with it: they travel there as **copy nothing holds true** (see S2), so S5
is satisfied in letter while the S2 defect makes it fragile.

## agy — cross-family, second round running

`p_order_holds` moved **no → yes**; it confirms its own gauntlet-1 findings repaired. New: the re-scrub
deletes only names in the CURRENT call, so a partial later call leaves an omitted,
mid-session-reprovisioned name in `process.env`. **Conductor-confirmed by execution.** NOT S1 — all four
shipped call sites pass a full, set-identical list. But `spawn-shim.js:356-373` states the guarantee
**unconditionally and claims CLASS status** when it holds only because of what the callers happen to pass.

I **falsified** agy's HIGH F-1 (Windows case-insensitive deletes) rather than propagating it: on win32
`process.env` own-property reads are case-insensitive too, so the value is captured; on a case-sensitive
platform the spellings are different variables. Not carried into the fix set.

## Provisional bottom line and the fix-attempt-2 set

**S1 holds · S2 FAILS · S3 FAILS · S4 unmeasured · S5 holds.** This is **fix attempt 2 of 2 — the last
one.** Ordered by leverage:

1. **S3, the root fix: strip comments and strings before applying `CALLS_SCRUB_RE`**, exactly as bundle 9a
   did for the extractor. Add the security lane's probe-entry as a committed regression fixture — an entry
   that imports `bootstrap.js` without naming the binding and reaches `child_process` must go RED.
2. **S2, the durable fix: bind the Asserted paragraphs and the ceiling prose**, so A6/A7/A8 and the
   in-PROVEN ceilings cannot be inverted with green gates. **This is the highest-leverage item in the
   sprint** — it is what makes every other S2/S5 repair non-re-breakable, and its absence is why three
   corrections in a row have been re-openable.
3. **S2, the ordering sentence: qualify it or make it true**, in both entries AND `CUSTODY.md:68-70`, and
   delete or correct the `node:` builtins clause. Pin the WHOLE sentence, not its first line.
4. **S4: actually mutate the five falsifiers and observe RED**, or report honestly that they are not
   observed. It has been carried on assertion for two rounds.
5. `package.json#vladPointerLint.owed`; `spawn-shim.js`'s unconditional re-scrub guarantee; and the latent
   `test/env-scrub.test.js:1018` fixture landmine.

**α applies the rule. I have not ruled and will not brief a fixer on my own read of the criteria.**
