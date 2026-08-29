# BUNDLE M — one transform, both sites (closes S4-2(c)) — S-VLADW1-05

You are a backend-builder on sprint S-VLADW1-05. This bundle is authorized. Read this whole brief
before touching anything; two documented traps will burn the sprint if you take the obvious path.

**This sprint has ONE fix attempt.** Diagnostic gauntlet → one fix → qualifying gauntlet. There is no
second attempt and no exception clause. A burned cycle is the sprint. That is why the traps below are
written out rather than left for you to discover.

---

## ENVIRONMENT — read before anything else (ED-363)

**Your process cwd is NOT the target repo.** Dispatch starts you in a WarpOS agent worktree
(`…\WarpOS\.claude\worktrees\<name>`, branch `worktree-<name>`). That is expected and correct. A
previous bundle in this sprint family halted on exactly this, correctly, because its brief asserted a
cwd the dispatcher does not establish. This brief asserts none.

- **TARGET REPO:** `C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane`
- **TARGET BRANCH:** `wt/S-VLADW1-01-engine`, already checked out at `6a105f2`. Do NOT branch, merge,
  or push.
- **Package root inside it:** `engine/`

**Command shapes that work** (established by a bundle that landed three commits from this exact
situation):
- Plain single git commands with `-C` and an absolute path:
  `git -C "C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane" add engine/scripts/checks/custody-claim-lint.js`
- Commit with a message FILE: `git -C "<abs>" commit -F "<abs msgfile>"` — never a heredoc.
- Read and edit by **absolute path**. For `node`/`npm`, pass the absolute directory.
- **Never** `cd X && …`. **Never** pipe a git command through `tail`/`head`. **Never** a heredoc commit.

**The worktree-isolation guard refuses command COMPLEXITY, not the cross-repo target.** If a command
is denied, do NOT reshape it to slip past — but DO read the guard's message: if it names a simpler
permitted form, using that form is compliance, not tunneling. If a **plain** `git -C` command against
the target is still refused, STOP and report it with the output; the conductor lands the work.

**Do not edit what you cannot commit.** If you determine you cannot commit at all, make NO edits and
halt — a half-applied change is the defect this sprint family exists to close.

**Gates, each as its OWN command with its real exit code read** — never `gate | tail -1 && next`:
the suite from `engine/` (**floor 366 pass / 0 fail**) and `npm run check:ship` (**exit 0**).
`npm run check:pointers` exits 1 **by design** and is outside `check:ship` — not a defect.

Never `--no-verify`. Never add an allowlist entry to get past a guard. Never place a
credential-shaped literal anywhere — labelled placeholders only.

---

## SCOPE

**allowedFiles:** `engine/scripts/checks/custody-claim-lint.js`, `engine/test/custody-claim-lint.test.js`
**forbiddenFiles:** `engine/CUSTODY.md` (bundle P owns ALL prose — do not touch it even to fix
something you find wrong; report it instead), `src/`, `driver/`, everything else.

---

## THE DEFECT

`containsStatusToken` (~line 954-956) puts both sides through `canonicalizeClaimText`, which performs
**no emphasis fold**. `flattenForAssertionScan` (~1356-1360) performs the fold one function away. So
the status-token comparison never receives it, and `**ASSERTED** — NOT VERIFIED` plants green in a
Proven section.

**Proof (β read this at source, row 320; you re-verify):** `containsStatusToken` at ~954 has no
emphasis handling. Design battery R3: 7 of 8 near-miss authorings GREEN as-is.

---

## ⛔ TRAP 1 — the obvious fix breaks the lead-in detector in the FAIL-OPEN direction

`resemblesBindableLeadIn` (~line 656) is **also a caller of the shared transform**: ~667
`canonicalizeClaimText(line, {caseFold:false})`, then ~670-673 it **REQUIRES an emphasis run**:
`const opener = afterPrefix.match(EMPHASIS_RUN); if (!opener) return null;`

**If you fold emphasis inside `canonicalizeClaimText` naively, every lead-in returns null** — nothing
becomes a candidate, nothing is refused by name, silent-skip everywhere. That is the exact fail-open
class this epic exists to close, introduced by the fix for it.

**The two call sites are ASYMMETRIC:**
- to `containsStatusToken`, emphasis is **noise** — fold it away.
- to `resemblesBindableLeadIn`, emphasis is **required shape data** — it is how a lead-in is recognised.

"One transform, both sites" must respect that asymmetry. One workable shape: test the opener on the
**prefix-stripped raw line**, then canonicalize for the keyword test. You may choose another; the
requirement is the property, not my implementation.

**REQUIRED — this is task 2 and it is not optional:** ship a test that **FAILS on the naive move**
(emphasis folded unconditionally inside the shared transform) and PASSES on your implementation,
proving lead-in detection survives the fold. Observe it RED against the naive version before you
keep your version. The near-miss battery **cannot** catch this — its `leadFIX` never simulates
emphasis-inside-the-transform — so this test is the only guard.

## ⚠️ TRAP 2 — replacement semantics and alphabet are UNDECIDED, and the "seven" bound depends on them

- `flattenForAssertionScan` (~1358) is `canonicalizeClaimText(text).replace(/[*_`~]+/g, " ")` —
  replaces with a **SPACE**.
- The design battery's simulated fix uses **EMPTY** (`""`).

They give **opposite answers** on the battery's own bold-mid-word row `"ASS**ERTED** — NOT VERIFIED"`:
empty → `asserted` → RED (caught); space → `ass erted` → GREEN (missed). Fold with the codebase's
existing space convention and you leave the mid-word near-miss open while the battery reports it
closed.

The **alphabets also differ**: `EMPHASIS_RUN` is `[*_]`; `flattenForAssertionScan` is `` [*_`~] ``. A
shared fold using `[*_]` leaves code-span and strikethrough unfolded for the token comparison.

**REQUIRED:** choose replacement semantics AND alphabet explicitly, and **STATE both in your
envelope** with your reasoning. **Read `SEPARATOR_VARIANCE`, `TOKEN_WORD_SPLIT` and `escapeRegex`
first** — β did not read them and they are load-bearing for the yield; if they move it, say so.

**Consequence you must respect:** S5-3's "**seven, not eight**" bound (RF-M1 below) is *contingent on
your choice*. **Do not restate the number in any shipped comment or prose until it is re-derived
against the transform as you built it.** A sentence restating a stale count is a granularity falsehood
and fires the release rule. If your re-derivation yields a different number, report the new number and
its derivation — do not adjust the code to preserve "seven".

## ⚠️ THIRD emphasis site the build spec does not name

There are **three** emphasis-handling sites, not two: `flattenForAssertionScan` (~1358) **and
`resemblesBindableLeadIn` TWICE** — the opener (~672) and the closing strip (~680).

**REQUIRED, task 1, before you change anything:** produce a **grep-proven INVENTORY** of every
emphasis-handling site in the file. Shipping "both sites share one transform" while a third site
strips on its own is S4-2(c) recurring one site over — the precise failure this bundle exists to fix.

---

## TASKS (5 — note the count; ED-257: task count drives duration, budget accordingly)

1. **INVENTORY.** Grep-proven list of every emphasis-handling site in
   `custody-claim-lint.js` (regex literals, `.replace` calls, `EMPHASIS_RUN` uses). Report it in your
   envelope with line numbers. This precedes any edit.
2. **Move the emphasis fold onto the status-token path, respecting the asymmetry**, so every caller
   that should receive it does and `resemblesBindableLeadIn` still detects lead-ins. Ship the
   **naive-move falsifier test** described in TRAP 1: RED on the naive version, GREEN on yours.
3. **RF-M1, pre-written falsifier:** removing the emphasis fold from the shared transform turns the
   R3 near-miss authorings GREEN. **Claimed over SEVEN, not eight — strikethrough was ALREADY RED
   as-is**, so the fix closes seven by design and one by accident. Mutation logic in the committed
   test; **no-op ⇒ FAIL guard** on the mutant. Then **re-derive the number against your built
   transform** and report it (see TRAP 2).
4. **RF-M2, pre-written falsifier:** a test that FAILS if `containsStatusToken`'s input is not the
   shared canonical form — i.e. the two sites **cannot silently stop sharing** the transform. A
   comment stating an invariant is not an enforcer of it; this is that requirement made mechanical,
   and it is the point of the bundle. Note: proving the transform is *sufficient* is not proving it is
   *wired* — RF-M2 is the wiring guard, so make it assert the call path, not just the output.
5. **Over-refusal, both directions.** The three prose controls must stay GREEN, and the disclosed
   comma residual must remain GREEN and unchanged. Report both explicitly.

---

## STANDING DISCIPLINE — binding

1. **Every shipped claim sentence is drafted AFTER the attack that would falsify it** — including
   wording β recommends and α approves. β, on its own recommendation being graded false: *"approval is
   not a truth check, and β's recommendation is worth exactly nothing against the shipped bytes."*
2. **No coverage claim at a coarser granularity than the mechanism has.** State the letter set, not
   "the scripts". State the class, not the count.
3. **A comment stating an invariant is not an enforcer of it.**
4. **A text matcher cannot distinguish a violation from a description of one.** Prose naming a banned
   pattern trips the ban. Expect it; rephrase rather than suppress.
5. **You may refuse any premise in this brief with evidence.** That is a CORRECT return, not a failed
   bundle. Every line-number and "X does not do Y" above carries its source (β's read at row 320, at
   commit `6a105f2`); **re-verify each before relying on it** — if a proof is wrong, say so and stop.
   Two builders in this sprint family have correctly refused false premises; that is the standard.
6. **Halt at a bundle boundary, never mid-bundle.**

**Envelope:** include a `falsification_attempts` array with one entry per claim you ship or rely on.
An entry whose `attack_run` is a *description* rather than something that was RUN is not an entry.
Also report: the inventory (task 1), your semantics+alphabet choice and reasoning (TRAP 2), the
re-derived RF-M1 number, both gate exit codes read separately, and anything you could not do.
