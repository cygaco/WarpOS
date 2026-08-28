# Retrospective — S-VLADW1-03 (Vlad Wave-1 custody residuals to release)

**Closed 2026-08-28 at honest state — NOT released. 85%.**
Ruling: `runtime/vlad-w1/s03/gauntlet-3/ALPHA-RULING-S1-S5.md` · β confirmation row 307 (`b6d38f04`).
Successor: [S-VLADW1-04](../../../../trackers/sprints/S-VLADW1-04-custody-claims-un-invertible.md).
Machine-readable record: `retro.yaml` (schema `warpos/sprint/sprint-retrospective/v1`, validated).

> **Written from the skill's template, not by `scripts/sprint/retrospective.js`.** The script exits `3`:
> the registry entry still reads `status: planning`, and the only sanctioned transition to `closed` runs
> through `/sprint:release` — which this sprint deliberately did not have. Rather than edit a registry
> field to make a gate pass, the stale status is surfaced as a separate decision for α.

## The headline lesson

> **"I watched it fire" is not "I know what it misses."**

The sprint failed on the mechanism I was most confident about. Bundle 10b replaced a hand-kept list of
bound claim paragraphs with a *derivation* over the document's own structure — the class fix. I verified it
worked by watching it catch a real, unannounced edit, in both directions, on a paragraph it had never seen.
It did exactly that.

And its shape predicate matched only an **exact em-dash**. A gauntlet lane injected one new unbound claim
paragraph seven ways, controls first: em-dash Asserted and em-dash Ceiling both went RED; **en-dash, plain
hyphen, colon, and two-space-indent all shipped GREEN with zero violations of any kind.** The shipped
sentence promises *"EVERY paragraph led by a bolded `Ceiling` lead-in"* is bound. An en-dash Ceiling
paragraph is such a paragraph, and it ships green.

Observing a control succeed on a case is **confirmation**. It says nothing about the inputs the control
silently skips. The missing step was never "test that it works" — it was "enumerate what it cannot see".

## The fix shape that generalises — refuse, don't skip (ED-358)

`extractBindableParagraphs` `continue`s past a paragraph whose lead-in does not match, **recording no
violation**. That single choice is the difference between fail-closed and fail-open:

- **Skip** = the input vanishes. The gate reports success over a population it silently narrowed.
- **Refuse** = the input is named. The gate cannot pass until a human decides.

**Any derivation over authored text must refuse what it cannot classify.** A paragraph that *looks* like a
lead-in — bolded `Asserted`/`Ceiling` plus any dash, colon or indentation — must be bound or REFUSED, never
skipped. The predecessor's hand-kept list was worse in every way except this one: it failed **visibly**.

Second-order, and worse: binding a claim byte-for-byte makes it **un-editable, not true**. Two sentences the
security lane falsified by execution are now pinned into `check:ship`, so an honest correction turns the
ship gate red until the bind moves in the same change. The mechanism built so a claim could not be inverted
under green gates is now holding two false ones in place.

## What actually landed (and survives at `b2583d6`, deliberately unmerged)

The inert invocation control closed at the mechanism via one shared comment-and-string lexer, with the
gauntlet-2 bypass committed as a required-RED fixture. Fourteen paragraphs byte-bound by derivation. The
false `node:` builtins clause removed from both entries and the ordering sentence qualified and pinned
whole. The re-scrub guarantee made true of the mechanism rather than of its call sites. Every mutant made
EOL-agnostic and guarded so a mutation that does not mutate FAILS. Clean checkout made byte-identical to the
working tree. Suite 294 → 318, `check:ship` exit 0. **S1 re-established rather than cited; S4 moved from
"unmeasured for two rounds" to observed.**

Four of five criteria held. It failed on the one that decides whether shipped copy can be trusted.

## Friction worth changing (full list in `retro.yaml`)

- **The 540s fail-closed clamp** cost two opus dispatches: a background dispatch without
  `WARPOS_DISPATCH_BACKGROUND=1` is silently a 9-minute dispatch, and the death looks exactly like a hang.
  (ED-353)
- **The ED-257 right-sizing warning fired correctly and I did not read it.** The enforcer already existed.
  A 16810 B brief then hit the 20-minute bound 22 seconds *after* committing — so the timeout cost the
  envelope, not the work.
- **Three dispatch death signatures had to be separated by hand**: clamp (540xxx + uncommitted work),
  nothing-spawned (no ledger row anywhere), bound-timeout-after-commit (1200177 + committed, clean tree).
  Neither the record nor the tree classifies a death alone; together they do.
- **Isolation scaffolding cost more than it saved.** Junctioned `node_modules` is refused by the enforcers
  (correctly — *"dirent is neither a directory nor a regular file"*), and a fresh checkout was not
  byte-faithful until `.gitattributes` landed. Serializing the lanes cost ~25 minutes and zero fidelity risk.

## Three things that went right and should be repeated

1. **Naming a lane's own prior failure in its brief changed its behaviour.** Three lane-runs were lost to
   truncated mid-thought returns across gauntlets 1–2. Each gauntlet-3 brief named that failure to the lane
   it had happened to and told it to cut scope rather than run out of room before emitting. **All three
   Claude lanes returned JSON on the first dispatch.**
2. **The cross-family lane is not redundancy.** Three gauntlets, three defects the same-family lanes missed
   — and this time on code the backend lane had read, tried to break, and explicitly could not.
3. **Refusals held under pressure.** A builder left correct work uncommitted rather than allowlist 83 dead
   refs it never touched. A lane declined to inflate a real attack into an S1 leak. α fired the terminal
   against its own sprint. A reviewer refused to assert a clean tree on the conductor's imprecise wording.

## Action items

Carried into `retro.yaml#action_items` and, where they are build work, into the S-VLADW1-04 tracker:
refuse-not-skip on the derivation (ED-358); claim-text and canonical copy as one atomic edit; the
background signal on every dispatch at first fire; right-size briefs and read stderr at fire time;
serialize rather than isolate; assign an owner when a gap is observed.
