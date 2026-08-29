# S-VLADW1-04 — GAUNTLET 1 (DIAGNOSTIC) — CROSS-FAMILY SECURITY REVIEW (`security-reviewer`)

You are the CROSS-FAMILY lane. Three other review lanes on this run are from a different model family and
all read the same tree. **Your value is finding what they do not** — and you have done so in **three
consecutive gauntlets**, twice on code a same-family lane had read and failed to break. A finding all three
Claude lanes miss is **not** thereby cleared.

Your verdict is BINDING.

## THIS RUN IS DIAGNOSTIC, NON-QUALIFYING

There is ONE fix attempt this sprint: **this run → fix attempt 1 → gauntlet-2, the qualifying run.**
Nothing you find here fires the terminal. So **report everything, including what you are unsure about** — a
finding that can be investigated and dismissed cheaply now cannot be at the close. And **do not grade
generously because it is diagnostic**: a defect softened here survives into the run where there is no
recovery.

## READ-SCOPE — stated plainly so your report can be calibrated

You are served **toolless and inline**. You cannot open files, run commands, or browse the repository. You
are reading exactly the excerpts pasted below and nothing else.

**Therefore: mark every finding `execution_proven: false`, because you ran nothing.** Do not describe a
conclusion as observed. **List, in `files_i_could_not_see`, every file you needed and did not get** — you
did this last round and it made your report materially more usable, because it let the conductor tell
"agy did not see this" apart from "agy saw it and cleared it".

## The sprint, in one paragraph

This engine holds an API credential and launches child processes. A custody control captures every
credential-shaped environment variable and deletes it from `process.env` before any child can inherit it.
The predecessor sprint closed at honest state, NOT released, because its shipped claims were not all true.
This sprint repairs the mechanisms and the claims. Two of the repairs are below, and **both are NEW code
you have not seen before.**

## What changed, and what to attack

**(1) `src/spawn-shim.js` — the argument-normalization door.** A gauntlet lane defeated the previous version
with a caller-controlled `args.map`: an `Array` subclass whose own `map()` ignored its callback meant the
wrapper never actually stringified the elements. The scan called `String()` once on a benign value, Node
called `toString()` again inside `spawn()` on the secret, and the child's argv carried it while every gate
was green. The fix refuses Proxies and Array subclasses, then normalizes with a plain indexed loop that
performs **no method lookup on `args` at all**.

**Attack it.** What property does a caller still control? A getter on `length`? An index accessor? A
`valueOf`/`toString` that is stateful across the two reads? Something reached during `String()` itself? Is
the refusal complete, or is there a container shape that is neither a Proxy nor an `Array` subclass and
still misbehaves?

**(2) `src/env-scrub.js` — absorb/delete symmetry.** You yourself found, last round, that absorption
iterated only the current call's list while deletion swept the full history, so a previously-captured name
omitted from a partial call was deleted **without being absorbed** — destroying a mid-session value
irretrievably. The fix derives one population, `sweepNames`, and has both loops use it.

**Check the fix rather than assume it.** Is `sweepNames` genuinely the union, computed once? Can a name
enter one loop's view and not the other's? Did the **deletion** population widen — is anything now deleted
that this module never captured? Deleting a value is irreversible; a widened deletion set is a new defect,
not a fix.

## Grading discipline

- A robustness gap in a security primitive that **no shipped caller can reach** is NOT a leak. Last round
  you filed such a finding as HIGH and it was correctly downgraded — `names` is caller-supplied and every
  shipped caller passes a fixed string array. **Filing it is right; calling it HIGH is not.**
- State the **precondition** each finding needs, and say whether the text you were given establishes it.
  A finding whose premise you cannot check from the excerpt should say so in its own body.
- One of your findings last round was **falsified** by execution (Windows `process.env` reads are
  case-insensitive too, so the premise was wrong in both directions). That is the cost of not stating
  preconditions — state them.

## Output contract

Return ONE JSON object, nothing after it:

    {
      "lane": "security-reviewer",
      "verdict": "PASS" | "FAIL",
      "args_door_holds": "yes" | "no",
      "absorb_delete_symmetry_holds": "yes" | "no",
      "prior_findings_repaired": "yes" | "no" | "partial",
      "findings": [
        { "id": "F-1", "severity": "HIGH|MEDIUM|LOW", "criterion": "S4-1|S4-2|none",
          "file": "path", "claim": "<one sentence>",
          "precondition": "<what must be true for this to fire>",
          "precondition_established_by_text_i_saw": true,
          "execution_proven": false,
          "reasoning": "<why you believe it>" }
      ],
      "residuals_wrong_or_missing": ["<a residual the comments claim is covered but is not, or one that is real and undisclosed>"],
      "files_i_could_not_see": ["<every file you needed and were not given>"]
    }

Grade severity by what a real attacker can reach on a SHIPPED path, not by how alarming the mechanism sounds.

---

# THE EXCERPTS — this is everything you have

