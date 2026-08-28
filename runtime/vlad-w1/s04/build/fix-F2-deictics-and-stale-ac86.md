# BUNDLE F′ — four code-state deictics, and a paragraph our own build made FALSE

Sprint S-VLADW1-04. Bundles A–F have landed; HEAD is `dc7dac8`. **You are the ONLY builder running**;
`git status` under `engine/` should be clean when you start.

## Where you work
- **Worktree (cwd):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
  `wt/S-VLADW1-01-engine`. Commit here. Do NOT branch, push, or merge.

## Scope contract
**allowedFiles:** `engine/CUSTODY.md` · `engine/scripts/checks/custody-claim-lint.js` (canonical copies ONLY)
**forbiddenFiles:** everything else — all of `engine/src/**`, `engine/driver/**`, every test file. Stage only
your two files by path; never `git add -A`. **Do not change the lint's RULES**, only canonical copies.

---

## TASK 1 — a paragraph that OUR OWN BUILD made false (the priority; a criterion turns on it)

`CUSTODY.md` lines ~168-174, in P3's ceiling about the runtime negative fixture, currently say:

> The standing proof that removing this control would be noticed by a check a user's own install actually
> runs is tracked separately (AC-8.6); **as of this writing that self-check does not yet exist in `src/` or
> `driver/`.** A test node named `selfcheck-runs-on-user-machine` was reserved for it in
> `test/custody-runtime.test.js`, **but that name is NOT present in that file** —
> `scripts/checks/verified-by-resolver.js` (`check:pointers`) **classifies the pointer `missing-name`**, not
> merely `missing-file`. **AC-8.6 has not landed**; say that plainly, without implying scaffolding for it
> already exists.

**Every emphasised assertion is now FALSE.** Bundle C landed AC-8.6 earlier in this same sprint and, by its
scope contract, was forbidden from touching `CUSTODY.md` — so the paragraph was left behind. **Verify each
yourself before editing; do not take this brief's word for it:**

| the paragraph claims | verify with | what you will find |
|---|---|---|
| the self-check does not exist in `src/` | `grep -rn "runCustodySelfCheck" src/` | defined at `src/server-entry.js:415`, **invoked at :456** |
| the test node is NOT present | `grep -c "selfcheck-runs-on-user-machine" test/custody-runtime.test.js` | `1` — it is present |
| `check:pointers` reports `missing-name` for it | `npm run check:pointers` | that pointer no longer appears as RED; it **resolves** |
| AC-8.6 has not landed | the three above | it landed |

**Rewrite the paragraph to state what is true now**, bounded strictly by what you verify:
- AC-8.6 **has** landed: a self-check runs from the product-layer entry path in a user's install.
- **Do not overclaim it.** It is ONE control on ONE path. Bundle C's own envelope says: *"AC-8.6 is now
  backed by a control that RUNS in a user's install, but `a5-wiring-presence.js` still correctly reports
  SHIPPED + WIRED, not EXECUTED. This self-check narrows that gap for one control on one path; it does not
  close it for the others."* **Your rewrite must preserve that boundary** — the neighbouring class-form
  Ceiling (added by bundle A) says this package does not verify its controls are invoked in a user's
  install, and that remains TRUE for every control except this one. **Do not write anything that
  contradicts it.**
- `check:pointers` overall is **still RED by design** (other pointers unresolved, deliberately outside
  `check:ship`). Do not imply it is green.

**If any part of the paragraph cannot be settled by what you can verify from the code and the commands
above, LEAVE THAT PART AND REPORT IT** as a named going-in item for the diagnostic gauntlet. Bounded by
evidence means bounded — do not reason your way past a gap.

## TASK 2 — the four remaining code-state deictics

Sites **129, 130, 131** (one paragraph) and **148**:

- **129:** "Neither entry **currently** holds a `node:` builtin in its static import list"
- **130:** "so this is not a **currently**-triggered gap"
- **131:** "not a defect in what runs **today**"
- **148:** "a **PREVIOUS cycle** — the one …" (still self-relative even after an earlier correction nearby)

129-131 **assert CODE state** with no anchor: true today, false the moment an entry gains an import.
**Anchor** (a commit hash, or the dated sprint id `S-VLADW1-04`, 2026-08-28) where the sentence asserts code
state; **remove** the deictic where it is mere narration and the sentence reads correctly without it.

The irony worth fixing carefully: **that same paragraph already refuses to state a module count** because
*"a number is a property of the import graph on the day it is read"* — it knows the rule and then breaks it
three times. Your rewrite should make it consistent with its own stated principle.

**Do not invent an anchor you have not verified.** If you cite a commit, confirm with `git log` / `git show`
that it contains the state you assert. A wrong anchor is worse than a vague deictic, because it looks
checkable.

## Both tasks — atomicity, non-negotiable

Every paragraph you touch has a canonical copy in the lint. **Both move in the same commit.** Run **RF-4**
and **observe it RED** by editing one side only, then restore — report the real output. **Commit after each
task** (two tasks, two commits is expected).

## Discipline
- **Suite floor 339**, 0 fail / 0 skipped / 0 todo.
- **NEVER offer a green gate as evidence that a sentence is TRUE.** A passing lint proves the text matches
  its stored copy and nothing more. Establish truth by reading the code and say what you read.

## Verify — each as its OWN command, its own exit code (never pipe a gate through `tail` in an `&&` chain)

    cd engine
    node --test "test/*.test.js"
    npm run check:ship
    npm run check:pointers

## Envelope — FINAL message, JSON, nothing after it

    { "bundle": "F-prime", "ok": true, "commit": "<sha list>", "files_changed": ["..."],
      "suite": {"pass":0,"fail":0,"skipped":0,"todo":0}, "check_ship_exit": 0,
      "task1_ac86_paragraph": {"before":"...","after":"...","each_claim_verified_how":"...","boundary_preserved":"<how you kept 'one control on one path' and did not contradict the class-form Ceiling>"},
      "task1_unsettled_parts": ["... or none — anything evidence could not settle, for the gauntlet"],
      "task2_sites": [{"line":129,"disposition":"anchored|removed","after":"...","anchor_verified_how":"..."}],
      "rf4_observed_red": "<the real output from editing one side only, then restoring>",
      "residuals_named": ["..."], "what_i_could_not_do": ["..."] }

Emit the envelope even if you stop early. **Committing beats finishing.** Commit messages start `fix(F2):`.
