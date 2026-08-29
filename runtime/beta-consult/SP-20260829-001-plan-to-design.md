# β CONSULT — SP-20260829-001 plan→design — [ENF β-r1]

**From:** ε (conductor, lane B) · **Sprint:** SP-20260829-001 "Fail-closed enforcer sprint"
**Plan contract:** PC-20260829-0087 · **Commit:** mint at `8d15c162`, branch `session/2026-08-29`
**Surface:** WarpOS itself (lane A / S-VLADW1-05 is the vlad engine-lane surface; the two lanes share no files)
**Sent before any build exists.** Nothing is dispatched beyond the two plan-step consults reported below.

---

## What the sprint is

Four gates in WarpOS cannot distinguish "I could not check" from "it passed". Verified by me from
the repo at `8d15c162` (line numbers are real reads, not the sweep report's summary):

| site | wiring | the fail-open |
|---|---|---|
| `scripts/hooks/gate-check.js` | LIVE PreToolUse/Agent | `loadStore()` L48-52 catches ENOENT **and** parse error into the same `null`; caller L153-158 warns + `exit(0)`. Plus L181-182 `catch { process.exit(0) }` — any throw allows. |
| `scripts/hooks/gauntlet-gate.js` | LIVE PreToolUse/Agent | L87-93 absent store → WARN + exit 0. **Its outer catch L219-224 is ALREADY fail-CLOSED.** Absent-half only. |
| `scripts/hooks/tracker-completion-gate.js` | LIVE Stop | L69 `if (!res) process.exit(0) // runner error → never trap the session`, inside the catch around `execFileSync(validate.js)`. ENFORCE (L31) is only read at the FINAL exit L84 — so a crashed validator exits 0 **even under `TRACKER_GATE_ENFORCE=1`**. |
| `scripts/sprint/design.js` | CLI, not hook-wired | L193-194 `catch { return { ok: true } } // fail-open`, wrapped around logic the same function hardened to fail CLOSED. |

The correct shape already exists in-repo at `scripts/enforcement/ed-dup-id-lint.js` L42-47: ENOENT →
printed `SKIP` + exit 0; anything else → `exit(2)`.

**A correction I am carrying, not hiding:** the `/enforcement:sweep` report's headline sentence reads
"gate-check.js and gauntlet-gate.js: corrupt store == absent store → allow". That is TRUE of
gate-check.js and FALSE of gauntlet-gate.js, whose parse path is already fail-closed. I am briefing
the corrected version. Same class as the granularity failures in lane A, so I state it explicitly
rather than quietly using the right facts.

## Plan-step consults — BOTH RAN, both cross-provider, records verified

| role | dispatch_id | record | model |
|---|---|---|---|
| director-of-product | `d-mtetbejz-55545532` | `ok:true`, exit 0 | gpt-5.6-sol |
| product-lead | `d-mtetcm5g-9cab43d3` | `ok:true`, exit 0 | gpt-5.6-terra |

Envelopes: `runtime/sprint/SP-20260829-001/out-plan-{dop,pl}.json`. Neither was primed with a
preferred scope; both were given all three variants neutrally.

**They converged, independently, on a scope SMALLER than the one I was briefed to plan.**

- **Director of Product:** "Choose `minimal_safe`, with one condition: its audit must enumerate the
  registered enforcement population rather than hardcode the four repaired paths. **Do not take
  `recommended` in this sprint.** Its adjacent rows … are different failure classes with different
  remedies and regression risks. Bundling them weakens the sprint's causal story and threatens Lane
  A's schedule."
- **Product Lead:** "Ship the smallest coherent slice: **R-1, R-2, and R-3** … Cut first: **R-5** in
  full … Cut **R-4** next, except for the narrow rule that report-only results cannot be represented
  as enforced passes."

My brief from the team lead (relaying the operator's in-session authorization to run sprints) named
`recommended` = ED-369 + ED-374 + ED-356 + ED-363 as the **minimum**.

---

## Q1 — SCOPE. May I narrow below the briefed minimum on the strength of two advisory consults?

**My stake, declared:** narrowing is LESS work for me. I am asking to do less, and two agents I
dispatched agree with me. Weigh the answer accordingly — that is exactly the shape where a conductor
should not self-rule.

The case for narrowing is not "less work": ED-374 (a check wired so it cannot fail), ED-356 (a commit
guard scanning the wrong root) and ED-363 (a brief asserting a cwd the dispatcher never establishes)
are three distinct failure shapes. Only ED-369 is the fail-open-input class. Bundling four shapes into
one sprint is the pattern that produced 300+ ledger rows in the first place.

The case against narrowing: those rows recurred within one session, they are cheap (~30-line
enforcers by their own `enforcer_candidate` fields), and a session with a parallel lane may not come
around again soon.

## Q2 — The Stop hook. Is "loud UNKNOWN, non-blocking" honest, or the defect relabelled?

`tracker-completion-gate.js` fails open on a crashed validator with the comment "never trap the
session". Failing closed there means an unrelated validator crash can block every session end in the
framework.

Both consults landed in the same place and I want your read on it, because it is the one place where
the fix can plausibly be worse than the defect:

- Product Lead: *"'Loud UNKNOWN but non-blocking' is honest telemetry, but it is not honest
  enforcement. If it lets a validator crash permit the guarded session end, it preserves the defect
  under a better label."* — proposes: enforcement mode maps crash/timeout to non-zero FAIL-CLOSED,
  with bounded retries and an explicit logged operator recovery path that must never report PASS.
- Director of Product: *"enforcement disabled may remain non-blocking; enforcement enabled must block
  runner failure."*

So both say: under `TRACKER_GATE_ENFORCE=1`, a crashed validator must block. Do you agree, and is a
break-glass override acceptable if it is logged and visibly reported as bypassed?

## Q3 — Does the audit ship BLOCKING this sprint, or report-only with a flip trigger?

If the enumerating audit ships report-only, this sprint instantiates **ED-374 — the exact debt
("an enforcer wired so it cannot fail is not enforcement") that `recommended` scope was going to
close.** If it ships blocking and the enumeration finds pre-existing fail-open gates beyond the four,
`/scan:full` goes RED on debt this sprint did not create and did not scope.

I do not think I should decide this one. It is the sprint's own thesis pointed at itself.

## Q4 — Close language, pre-committed before results exist

Neither consult was asked to write this; both volunteered a version, which I read as a signal the
risk is obvious from outside. I intend to pre-commit to this shape now:

> At commit `<sha>` the audit enumerated `<N>` registered enforcement entrypoints; `<M>` failed the
> seeded corrupt/unreadable/crash fixtures and were repaired. No audited entrypoint silently passed
> those seeded failures. **This does not claim repository-wide discovery or closure of the fail-open
> class** — entrypoints outside the registered audit set, dynamically constructed gates, and failure
> modes the fixtures do not model remain unassessed.

Is that admissible as the pre-committed close language, and should it be binding on a NO-RELEASE
close as well as a release?

## Q5 — Do you want a release rule minted now, or at design→build?

Lane A's rule was minted at design→build before any result existed, and that worked. I assume the
same shape here and am NOT asking for criteria yet — only confirming the timing, so I do not later
argue a rule into existence around a result.

---

## What I am NOT asking

- Lane concurrency: the team lead has `[S05 β-auth] q3` in flight. Not duplicated here.
- Build authorization: not mine to seek; the lead holds it.
- Anything about lane A / S-VLADW1-05.

## Evidence you may want and I have not put in front of you

`runtime/sprint/SP-20260829-001/out-plan-dop.json` and `out-plan-pl.json` (full consult envelopes),
`.claude/project/sprint/plan-contracts/PC-20260829-0087.yaml` (the plan contract, incl. three stated
`assumptions.unsafe`), and `runtime/enforcement-sweep/2026-08-29/REPORT.md` (the sweep whose framing
I corrected above). I have read all four; you have not, and I would rather say so than let my summary
stand as if it were your read.
