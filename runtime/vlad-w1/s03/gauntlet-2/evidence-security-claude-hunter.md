# Lane evidence — `security_claude_hunter` (BINDING) — S-VLADW1-03 gauntlet-2

Shape: `in-process-agent` · claude-opus-5 · elapsed 428927 ms · 26 tool_uses · agentId `a0074deecc191ab42`
Target: commit `0732cd8`. Brief: `lane-security.md` (narrowed re-dispatch — see note).

**Verdict: FAIL.** S1 holds · S2 cannot-assess · **S3 FAILS** · S4 cannot-assess · S5 cannot-assess.
Worktree verified clean at `0732cd8`, probe file unlinked, no tracked diff.

## DISPATCH NOTE
A first attempt did ~66 tool calls and returned a mid-thought line instead of its JSON — `no-record`, a
dead lane, never a pass. It was resumed AND re-dispatched narrowly (re-verify S1 · attack the new
invocation assertion · attack the null-prototype capture). This is the narrowed run.

## F-1 — HIGH — S3 — **THE FINDING OF THIS ROUND. Execution-proven.**

`src/bootstrap.js:27` contains the text `initCredentialCustody(...)` **inside a comment** — in the prose
explaining *"WHY A SHARED FILE RATHER THAN DUPLICATING `import env-scrub.js; call
initCredentialCustody(...)` in both entries"*. That text matches `CALLS_SCRUB_RE`.

Because bundle 8a put `bootstrap.js` on the **mandatory hot path of BOTH entry points**, every graph that
reaches an entry contains it. So the assertion's **`anyCallFound` half is pre-satisfied by a comment for
every shipped entry** — it is INERT.

The lane then built the bypass. A new entry `src/zz-probe-entry.js` (under `package.json#files`, carrying
the entry marker) with **exactly one** static import — `import { CREDENTIAL_ENV_NAMES } from
"./bootstrap.js"`, deliberately NOT naming the scrub binding so the `orphanedImporters` half cannot see
it — plus `const cp = await import("node:child_process")`:

- `node --test test/env-scrub.test.js` → **22/22 pass, A1 GREEN**
- walker re-implementation → `canSpawn=true, anyCallFound=true, orphanedImporters=[]` → `invokes=true` →
  guard `(canSpawn && !invokes)` = **false**
- `ANTHROPIC_API_KEY="<PROBE-LEAK-LITERAL>" node src/zz-probe-entry.js` →
  **`CHILD SAW: <PROBE-LEAK-LITERAL>`**

**A real child obtained a real credential while every gate was green.**

**Why this is S3 and NOT S1** — the lane's own grading, and the conductor concurs: the bypass required
ADDING an entry point that does not ship. No shipped path leaks. What is proven is that **the control is
inert**, not that the package leaks. Inflating this to S1 would corrupt a criterion that is honestly met.

The lane also isolated why the conductor's own driver-mutant verification still passed: that mutant
deletes the CALL but leaves `import { initCredentialCustody }` behind, so it is caught by the
**`orphanedImporters` half**. An entry that never names the binding at all is invisible to that half —
and the `anyCallFound` half meant to catch it is pre-satisfied by bootstrap.js's comment. **The advertised
upgrade from reachability to invocation is half-delivered: the orphaned-importer half binds, the real-call
half does not.**

## F-2 — LOW — none — a novel carrier, correctly NOT inflated

A secret split across two benign-named env values, cut before the shape matcher's recognisable prefix,
passes `auditedSpawn` unrefused and the child reconstitutes the plaintext: `cut@3 => NOT REFUSED; child
reconstituted full secret: true`, `cut@5` same, `cut@8 => REFUSED`. The lane rated it LOW and explicitly
declined to fire S1: it is not an env-INHERITANCE leak, it requires a caller already holding the
plaintext, and Check 2 is documented as catching a renamed key rather than as an exfiltration barrier.
Recorded so it is not mistaken for covered.

## `regressions_from_fix_attempt_1` (verbatim)

- No TEST regression: 294/294, run twice.
- **CAPABILITY regression-in-effect.** Bundle 8a's `bootstrap.js` and bundle 9b's new assertion were
  authored in parallel and interact badly. 9b's own disclosure assessed the comment/string false-positive
  as *"bounded harmlessly for `src/model-seam.js` specifically (it also contains the REAL call)"* — but did
  not notice that `bootstrap.js`, the file 8a put on the mandatory hot path, is exactly the
  *"file whose ONLY call-shaped text is inside a comment"* case 9b itself called *"a real, disclosed gap
  in general."* **The generally-disclosed residual is INSTANTIATED on the shipped graph.**
- S3's stated DoD — entries derived from `package.json#files` so a new entry is picked up automatically —
  is the property F-1 falsifies: auto-pickup happens, and yields a **FALSE GREEN** for the new entry.

## `what_i_could_not_assess` (condensed, verbatim in substance)
S2, S4, S5 outside this narrow dispatch. **S4 specifically: only F-2 was observed carrying an
"OBSERVED RED" title; F-1/F-3/F-4/F-5 were not enumerated or re-run — "silence here is not a pass."**
`opts.cwd`/`opts.stdio` confirmed unscanned by inspection but NOT execution-proven (a directory carrying
the secret would need a writable location outside the scope contract). The aliased-import and
re-bound-reference blind spots remain unmeasured — F-1 defeated the assertion without needing either.
Preload ordering not executed. Did not run `check:ship` against the probe entry.
