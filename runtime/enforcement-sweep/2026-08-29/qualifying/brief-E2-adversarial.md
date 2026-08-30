# QUALIFYING LANE E2 — adversarial. Can the enforcer fail, and can its dispositions be defeated?

## ⚠️ YOU HAVE YOUR OWN DEDICATED CHECKOUT. USE ONLY IT.

Its absolute path is in the dispatch envelope above. It exists solely for this lane, is clean, and is
checked out at the pinned commit.

**Do NOT touch, read from, or run against any other checkout of this repository, and never against any
sibling project's tree.** You are the only lane that mutates files; other lanes are reading a different
checkout of the same commit **right now**. If your mutations were visible to them, every finding from
every lane would become untrustworthy and un-diagnosably so — a sibling's "this claim is false" could
be *your* mutation, thirty seconds earlier. **Your isolation is what makes the round's evidence usable.**
If the path in the envelope is missing or is not a dedicated checkout, **say so and stop** — do not
fall back to a shared tree.

**You MAY mutate files inside YOUR checkout** — that is this lane's method. You must **NOT** commit,
**NOT** push, and you must restore. **Restore incrementally, after each mutation, never batched at the
end** — a lane on a sibling sprint died at a hard ceiling with work in flight, and a batched restore
would have left the tree dirty.

## THE TWO QUESTIONS

### A. CAN THE ENFORCER ACTUALLY FAIL? — and you must show it, not argue it

The sprint ships a gate whose whole purpose is to refuse a class of defect. **An enforcer that has
never been observed to refuse anything is asserted, not demonstrated.**

**CONTROLS FIRST — before any mutation.** The gate you are attacking is
**`scripts/checks/gate-failclosed-enforcer.js`**, and that is the binary this step and every
demonstration below refer to — no other. Run **it** unmutated and **record its exit code and output
verbatim**. **If it does not exit 0, STOP and report that** — your demonstrations cannot be attributed
against a gate that is already refusing, because every run afterwards returns the same refusal for a
reason that is not yours. There is no green control and therefore no transition to show. Report the
unmutated result and stop; do not proceed and do not explain the refusal away.

**Then demonstrate by EXECUTION, both of:**
1. **A registry member that REGRESSES** — take something the registry currently dispositions as
   repaired, return it to the permissive behaviour, and run the gate.
2. **A NEW, UNTRIAGED site** — introduce a fresh instance of the class that appears in no registry row
   at all, and run the gate.

**Both must be observed, with exit codes as printed and unpiped.** A gate that catches (1) but not (2)
has a materially different reach than one that catches both, and the difference is the whole question.

**⚠️ Never pipe a gate through `tail` or `head` in a chain** — the pipeline returns the tail's status,
so a refusing gate reads as passing. Run each as its own command and read its real exit code.

**And the no-op guard is required:** replace the gate's decision with something that does nothing at
all. **If it still appears to work, your demonstration was measuring something else.**

### B. CAN THE DISPOSITIONS BE DEFEATED?

The registry's rows carry **dispositions** — judgements about whether each site is a defect — and a
**baseline** seals a known state. Two attack surfaces follow, and both are yours:

- **The seal.** Can a state the baseline is supposed to pin be changed without the gate noticing? Can
  the seal itself be made to accept something it should refuse?
- **Provenance of the dispositions.** Some judgements are **derived by a tool**; some are **made by a
  person reading the code**. These are different kinds of evidence. **Can the two be blended so a
  reader cannot tell which is which? Can a contested judgement be made to resolve permissively rather
  than refusing?** A disposition whose provenance is unrecoverable is the defect, whatever its value.

## THE ATTACK STANDARD

For each attack: **the exact input or mutation you constructed**, where you put it, and **what happened
when you ran it** — as an exit code or as matched / not-matched, **never as a colour word**. (A sibling
helper uses a boolean meaning *matched*, so its "RED" means *caught* — the inverse of a test suite's
habit. Bare colour words are ambiguous here and barred.)

**A finding without a reproduction is a hypothesis. Label it as one.** A hypothesis honestly labelled
is valuable; a hypothesis phrased as an observation is the defect this sprint exists to end.

**If your environment denies you execution, say so and return that.** On a sibling sprint a lane
returned *"I could not access local files … I did not substitute unverifiable conclusions for source
evidence"*, and **that was the correct return.**

**⚠️ A disclosed limit is not a defect.** Where the artifacts state a ceiling on what an instrument can
see, that ceiling **is not itself a finding** — a text-scanning instrument has limits by construction
and saying so is correct. **The defect is only ever a CLAIM that exceeds what the instrument can do.**
Do not file a disclosed limit as a bypass; a sibling round lost real time to exactly that confusion.

## RETURN — plain text, final message. No report files.

### ⚠️ FIRST LINE, EXACTLY: a machine-readable verdict token

```
{"verdict":"pass"}
```

…`pass`, `warn`, `fail` or `error` — that spelling, those quotes, lower-case. Then your prose.

The consuming parser recognises a verdict ONLY from this token; prose is unparseable to it and records
as `"error"`, indistinguishable from a dead lane. On a sibling sprint two lanes' genuine findings
vanished exactly that way.

**What the values mean.** `pass` means **you attacked it and it held** — an affirmative finding, never
"I found nothing" and never "I could not check". **If you could not assess, emit
`{"verdict":"error"}`** and explain in `what_i_could_not_assess`; that is a correct and valued return.
**No data is not a pass.** The token never replaces your prose findings.

**Required fields — an omitted field reads as UNKNOWN, never "nothing to report":**
- `what_i_could_not_assess`
- `files_i_could_not_see` — regions sampled rather than read end to end; **a window into a structured
  region is not that region**, so say which part
- `execution_proven` — **the central field for this lane.** Which attacks you RAN versus reasoned
  about, separated plainly. A reasoned prediction that the gate would refuse is not a demonstration.
- `what_would_confirm_or_refute`
- `read_outside_the_quoted_region`
- **`derivation_rule`** — **required for any attack SET.** Emit the members item by item, state the
  rule by which you derived them (a stated property, or an exhaustive extension over an explicitly
  stated finite domain), and state **what that rule does NOT reach.** "I tried a range of shapes" is
  not a frame, and an attack set without its derivation rule cannot support any claim about what
  remains unreachable.
- **`tree_state_on_exit`** — explicit confirmation you restored, or exactly what you left modified.

**Emit the set, never a bare number.** Say what **this lane** found, in your own name.

**There is no reward for a clean report.** A clean report you cannot evidence is worse than a messy one
you can — and for question A specifically, **a report that the gate works, without an observed refusal,
is the exact failure this lane exists to prevent.**
