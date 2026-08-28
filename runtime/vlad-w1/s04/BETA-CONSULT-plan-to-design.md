# β CONSULT — S-VLADW1-04 plan→design boundary — [S04 β-r1]

From: Alex ε (sprint conductor) · relayed by α · 2026-08-28
Plan contract: `.claude/project/sprint/plan-contracts/PC-20260828-0086.yaml` (schema-valid, 0 missing required)
Tracker: `trackers/sprints/S-VLADW1-04-custody-claims-un-invertible.md`
Predecessor ruling: `runtime/vlad-w1/s03/gauntlet-3/ALPHA-RULING-S1-S5.md` · your confirmation row 307 (`b6d38f04`)
Surface: vlad `wt/S-VLADW1-01-engine` @ `b2583d6`, NOT merged. Build NOT authorized. No registry entry.

## Context you already have, stated once so the questions are readable

S-VLADW1-03 closed at honest state, not released. **S2 FAILED** on eight execution-proven grounds, and the
sharpest was inside the very mechanism built to prevent that class: bundle 10b replaced a hand-kept list of
bound claim paragraphs with a **derivation**, and the derivation's shape predicate matches only an exact
em-dash. A lane injected a new unbound claim paragraph seven ways — em-dash Asserted and em-dash Ceiling
went RED (controls); **en-dash, hyphen, colon and two-space-indent all shipped GREEN with zero violations**.
`extractBindableParagraphs` `continue`s past a non-match with no violation recorded: skip, not refuse.
Second-order: the bind now **pins two sentences the security lane falsified by execution**, so `check:ship`
requires a proven-false sentence to be present verbatim.

## Q1 — the scope variant. I recommend `recommended`, not `expanded`.

Three variants are in the contract. My read: **`recommended`** — all nine residuals plus AC-8.6 and a
*disclosed-ceiling* disposition of the class-form residual.

I am **recommending against `expanded`**, which would build a general enforcer asserting "every shipped
control is invoked by some product-layer path". That is new **detection capability**, not wiring — and
building a general mechanism that overclaims its own coverage is precisely how the predecessor failed. I do
not trust this sprint to build a general assertion about all controls when the last one could not correctly
enumerate paragraphs in a single markdown file.

**Asking you rather than deciding it**: is the class-form residual DISCLOSED as a ceiling this sprint, or
ENFORCED? I have a stake in the answer — disclosure is the smaller, safer job and it is the one I am
proposing — so it should not be my call alone.

## Q2 — sequencing constraint I want ratified before design commits to it

The bind work **must land before any claim correction**. Two false sentences are currently gate-enforced, so
correcting one before the bind is fixed turns `check:ship` red mid-sprint, and a builder facing a red gate it
cannot fix inside its scope will either stop (correct, costs an attempt) or reach outside its scope
(incorrect). In S-03 exactly this happened: bundle 10c correctly stopped and left the tree red, and 10f
existed only to finish the coordinated edit.

Proposed rule for the build spec: **claim text and its canonical copy are ONE atomic edit owned by ONE
bundle**, and the bind fix is bundle 1. Does that match your reading of what went wrong, or are you seeing a
different sequencing risk?

## Q3 — AC-8.6, which has now slipped twice

It is first-class scope in the tracker per your row 306. It is also the only NEW product surface in the
sprint, it touches both entry points (which the driver-strength residual also touches), and it is not a
release-blocking criterion under any rule you have minted. Two honest readings:

(a) **Build it.** It has slipped twice, its pointer is RED, and "runs in our CI" versus "runs in their
install" is the distinction the epic cares about.
(b) **Defer again, disclosed.** Adding new product surface to a sprint whose subject is "our enforcement
mechanisms overclaim" invites the same failure a fourth time.

I lean (a) — it was specced for the original build and never delivered, so deferring a third time starts to
look like the work is being avoided rather than sequenced. But I am the party who would have to build it
under a fresh rule, so I want your read.

## Q4 — the assumption I most want challenged

The contract records as **unsafe**: *"That the em-dash predicate is the ONLY shape-blindness in the bind."*
Nobody has enumerated the other bound-paragraph rules (the A5 carrier-note sentence binding, the
status-token separation rules) for the same near-miss class. The gauntlet-3 security lane named this
explicitly: *"Given F-1/F-2, that is the obvious next place to look and nobody has looked."*

Design intends to read them rather than assume. **Is that sufficient, or should the design phase ship a
near-miss battery over EVERY bound rule as a required-present artifact before build starts?** The
predecessor's S4 bar was "present AND observed RED"; I am asking whether the equivalent bar belongs at the
design boundary here.

## What I am NOT asking

I am not asking you to mint the release rule at this boundary — that is the design→build consult, and it
must come after the design exists so the rule is minted against real acceptance criteria and before any
result exists. This consult is the plan→design gate only.

## Requested verdict shape

DECIDE | DIRECTIVE | ESCALATE, with:
1. Scope variant ratified or changed (Q1), and the class-form disposition: disclosed or enforced.
2. The bind-first + atomic-claim-edit sequencing rule ratified or replaced (Q2).
3. AC-8.6 in or out (Q3).
4. Whether the near-miss battery over all bound rules is a design-phase exit condition (Q4).
