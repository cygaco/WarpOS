# SP-20260829-001 — retro DEFERRED, and the reason is a runtime refusal

**Deferred to milestone close, per the engine-sprint pattern.** But the deferral is not only a choice: **the runtime refuses to run the retro at all**, and the refusal is recorded here as the finding rather than worked around.

## The refusal, verbatim

```
$ node scripts/sprint/retrospective.js --sprint SP-20260829-001 --no-synth
Sprint `SP-20260829-001` is in state `planning`. `/sprint:retrospective` requires the sprint
to be `closed` or `abandoned`. Finish `/sprint:release` first, or invoke
`/sprint:retrospective` against a different sprint via `--sprint <SP-id>`.
EXIT=0
```

## Why it cannot be satisfied — the two refusals compound

The sprint is still `planning` because **the status flip is itself blocked twice over**:

1. **The runtime has no closed-unreleased path.** The only code writing `status: "closed"` to the active-sprints registry is inside `release.js` `cmdDeploy` (L484-503), reached only after `release <id> marked deployed`. This sprint is **NO RELEASE** — running it would assert a deployment that did not happen. Not run.
2. **The sanctioned single-purpose registry edit was denied by the auto-mode classifier.** Not reshaped: making the same change to the same file with a different tool is the same action, and the operator's authorisation does not clear the classifier — two separate gates.

**And the release script's own comment names this exact trap:**

> *"Auto-flip active-sprints status … Without this, `/sprint:retrospective` rejects the sprint (status gate) and operators have to hand-edit `active-sprints.yaml` before closeout."*

**So the runtime documents the workaround its own design forces, and the classifier forbids that workaround.** A sprint that legitimately closes without releasing has no path through either. **This is ED-359's fourth instance and its sharpest form: the transition is not missing, it is welded to a deploy.**

## Retro content, fixed in advance and carried to the milestone close

These lines were fixed while the round ran, before any of them could be shaped by how it ended.

1. **"The asymmetry was in what each thought to EXECUTE, not in what each could read."** — everyone held the enforcer's success predicate; one lane pointed the binary at a nonexistent root.
2. **"A correct fact, carried one step past what it covers."**
3. **"I sent it as a STOP, not as a question."** — a finding routed as a question invites the check that settles it; routed as a stop it invites compliance.
4. **"Not a better read; a different position."** — the release gate's verdict changed when it was run from a detached worktree rather than the tree everyone measured in.
5. **"The instruction was about a path; my tool was about a line."**
6. **"A conductor reporting the number its instruction expected, rather than the number the tool produced, is this round's subject in miniature."**
7. **"I would rather write that close than a tidier one."**
8. **"Recency is a property of message delivery, not authority."**
9. **"The rule runs both ways."** — `absolution-as-evidence-deletion`, first tested on its own co-author.
10. **"Running it while the round composes would be me repairing my own graded artifact under another name."**

**And the round's central result about its own method**, in β's terms: within one hour, each of β and the conductor held the exact fact required and drew the wrong inference from it. **Neither was under-informed.** That is a stronger argument for a reader who did not build the frame than any finding in the round — and it generalises to place as well as person, via line 4.

## What the milestone close still owes

The retro proper, once a status path exists. **Until then this file is the record that it was deferred by refusal and not by omission** — and the refusal is itself a finding the successor inherits (see `INHERITED-OBLIGATIONS.md` §5, ED-359's class).
