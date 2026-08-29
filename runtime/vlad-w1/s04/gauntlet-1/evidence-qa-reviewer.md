# Lane evidence — `qa-reviewer` (BINDING) — S-VLADW1-04 gauntlet-1 (DIAGNOSTIC)

Shape: `in-process-agent` · claude-opus-5 · elapsed 682246 ms · 37 tool_uses · agentId `add820c1b29f82642`
Target: commit `b9b8df3`. Brief: `lane-qa.md`. Isolation: first of three SERIALIZED lanes, live worktree.

**Verdict: FAIL.** **S4-1 FAILS · S4-2 holds · S4-3 holds · S4-4 holds · S4-5 holds · S4-6 FAILS.**
Worktree restored — `git status --porcelain -- engine/` empty, `CUSTODY.md` md5 matches a pre-mutation
backup, suite 339/339, `check:ship` exit 0.

## F-1 — HIGH — S4-1 — a shipped claim THIS BUILD falsified

`engine/package.json#vladPointerLint.currentState` still says *"RED by design: 33/48 resolve, 15 do not"*
and that AC-8.6's pointer *"must stay red until the work lands"*. **This build landed the work.**

- `npm run check:pointers` at `b9b8df3`: **34/48 resolve, 14 unresolved**, exit 1. Re-derived split: 10
  missing-name + 4 missing-file = 14; `custody-runtime.test.js::selfcheck-runs-on-user-machine` is **not**
  among them.
- `npm pack --dry-run` lists `package.json 12.6kB` — **a shipped surface.**
- `git diff --stat b2583d6..b9b8df3` **does not list `package.json` at all.** Bundle C updated the
  non-shipping test that pins the counts and never touched the shipped copy.
- **`check:ship` stayed exit 0 and the claim lint reported "package.json shipped-copy scanned, 0
  violations" — mechanism green over a false sentence, which is exactly what S4-1 forbids as evidence.**

## F-2 — HIGH — S4-1 — and the reason is STRUCTURAL, not incidental

`CUSTODY.md:148`'s newly-authored closing sentence: *"so among SHIPPED surfaces this document remains the
only place the residual is named."* **False.** `engine/scripts/checks/custody-claim-lint.js:612` holds the
entire Ceiling verbatim in its canonical-copy store, and `npm pack --dry-run` lists that file at 72.7 kB —
**it ships.** Present at base too, so the mechanism predates the sentence.

The lane's insight, which generalises:

> **S4-3's atomicity requirement guarantees every bound claim paragraph exists in at least two shipped
> files, so any "this document is the only shipped place X is named" assertion about a BOUND paragraph is
> false BY CONSTRUCTION.**

And the sting: this build *rewrote* the predecessor's false sentence, surveyed internal surfaces, found
`test/entry-bootstrap.test.js` — **and authored a sharper, still-false claim about the shipped dimension,
one grep away from being checked.**

## F-3 — MEDIUM — S4-1 — the anti-generalisation promise is itself incomplete

The header's *"What is NOT bound byte-for-byte, said plainly rather than generalised"* enumeration omits the
`## Proven` and `## Asserted` section intros. Mutation battery, each with a no-op guard, each its own
`check:ship`:

| # | mutation | result |
|---|---|---|
| M1 | semantic change inside the bound class-form Ceiling | **exit 1 RED** (control) |
| M2 | P1 body prose → falsehood | GREEN (correctly disclosed by this build) |
| M3 | `## Proven` intro → *"no clause id, no enforcer, and no proof"* | **GREEN** |
| M4 | `## Asserted` intro → *"fully verified and proven … all may freely share a"* | **GREEN** |
| M5 | P1 Proof-scope line → falsehood | GREEN (correctly disclosed) |

M4's document then asserts *"fully verified and proven"* two lines above `Status: **ASSERTED — NOT
VERIFIED**`, **inverting ADR-0041's own status-token separation rule, with every gate green.**
By the document's own standard — *"Naming only the two wordings we happened to observe would itself be a
false disclosure"* — an incomplete instance-enumeration is a false disclosure.

## F-4 — MEDIUM — S4-6 — the self-check's ceiling does not travel to the reader

`CUSTODY.md:199-201`: *"apart from the start-up self-check named above, nothing … checks, at run time in
your install, that any of these controls is still present or still passing."* Executed against the shipped
export: `runCustodySelfCheck(undefined, Object.create(null))` → `{"ok":true,"checkedNames":6,
"residualNames":[]}`, logging *"no credential-shaped env var is readable in this process"*.

`src/server-entry.js:374` states the design plainly — *"deliberately NOT a check that the scrub CODE exists
… and NOT a check of the captured snapshot"* — so **its green is equally consistent with a correct scrub, an
absent scrub, and a machine that never held a credential.** The residual IS disclosed, **but only in a code
comment**, and does not travel to `CUSTODY.md` where the custody claim's reader is.

## F-5 — LOW — S4-1 · F-6 — LOW — S4-4

**F-5:** `CUSTODY.md:148` says `test/entry-bootstrap.test.js` *"points back to this Ceiling by name"* — it
points back by description; grep for the Ceiling's lead-in in that file returns zero. The `--import` usage
claim and the "one INTERNAL surface" claim are both TRUE.
**F-6:** going-in item 3 **re-ranked**: the Rule 4 mutant's hand-wrapped-break dependence is a real
maintenance coupling but **not** a silently-no-oppable oracle — it goes through `replaceAcrossEol` and
carries `assert.notEqual(...)` at line 669, so a future re-wrap produces a **loud** failure.

## Going-in items adjudicated

1. **F′'s deviation — JUSTIFIED, minimum-reconciling, class-form force PRESERVED.** The bolded lead-in is
   byte-unchanged; only the body gained an exception, bounded twice; the P3 Ceiling independently re-bounds
   it. **The two paragraphs AGREE.** Verified still bound (M1 → exit 1). AC-8.6 facts verified **by reading
   code, not by any gate**: defined `src/server-entry.js:415`, invoked exactly once at `:456` inside
   `startServer()`, reached via the isMain guard at `:504-512`, and `driver/host-free-driver.js:340` spawns
   `SERVER_ENTRY` as a real child — so "shipped path" is true. Only overreach is the closing clause = F-4.
2. **C's scope exception — GENUINELY UNAVOIDABLE, correctly confined, replacement STRICTLY STRONGER.** The
   old assertion (`reason === 'missing-name'`) was mechanically incompatible with landing AC-8.6. Diff
   confined to pinned counts + the AC-8.6 block, retargeted to a **positive** `assert.equal(ac86.resolved,
   true)` — harder to satisfy accidentally, not looser. All four numbers re-derived independently. No
   `t.skip`/`.todo`. **But it made the SHIPPED package.json copy stale — that is F-1.**
3. **Re-ranked to LOW** — see F-6.
4. **The decline to invent an anchor was CORRECT and endorsed.** Every anchor that WAS named checks out:
   `0732cd8`, `e120edc`, `8b6993e`, `5ecda24`, `b27ad76`, `514c2d9`, `55fc6a3` all exist; *"55fc6a3 added
   34 lines, all comments, no executable change, did not touch its test"* — confirmed, 34 insertions / 0
   deletions, zero non-comment added lines.

## `what_i_could_not_assess` — the honest boundaries

- **S4-2(b): did NOT execute the RF-3 revert-to-`continue` mutation** — read the description, did not run it.
- **S4-5 route (a) unassessed** — verified only the pointer resolution, the cap, and that RF-7 is a genuine
  RUNTIME mutant. Marked S4-5 "holds" on that partial basis; **the route-(a) half is unassessed by this lane.**
- **S4-6 completeness** — does not hold the build-spec items 1-7 field-4 residual list. **Its S4-6 FAILS
  rests on F-3 and F-4, NOT on RT-2 or RT-8**, both of which it verified DO travel and are true (NBSP
  tolerance proven by execution; RT-8 disclosed as a CLASS with the correct reasoning, verified against
  `WORDED_ROLLUP_PATTERN` — `every` genuinely passes it).
- **Did not read all 30.4 kB of `CUSTODY.md` sentence-by-sentence** — hardest reading on the ~210 changed
  lines and the header/P3/class-form/preload blocks. *"An older false sentence could survive there — note
  that F-2's predecessor was exactly such a sentence."*
- **S4-2(d), offered as a lane observation and NOT a discharge:** it re-ran the battery itself against the
  predicate as built — all 7 near-misses RED as `unbindable-paragraph-shape`, both em-dash controls RED. It
  probed **7 shapes not in the battery**: lowercase `**ceiling —` / `**asserted —` **REFUSED (stronger than
  disclosed)**; `**A10 —` and NBSP-before-dash REFUSED; unbolded `Ceiling —`, `**Residual —` and single-star
  `*A9 —` ship GREEN — **all three inside the class the header's resemblance ceiling already discloses.** It
  found **no undisclosed escape**, and states plainly that S4-2 is not its criterion and it did not evaluate
  whether its population met the "including bundle A's paragraph" requirement.
