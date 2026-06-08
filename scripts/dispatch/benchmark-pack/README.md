# Skill-dispatch benchmark pack — §13.7 "is it worth it + are the results good?"

> **SCAFFOLD + MECHANISM — the §13.7 A/B runner (`scripts/skills-bench.js`) is BUILT and fixture-proven (`skills-bench.test.js`); the heavy real measurement is DEFERRED. No skill is `subprocess_verified:true` yet. This directory describes the replayable task set + benchset schemas; it contains NO fabricated measurements (every number in the examples is a clearly-marked placeholder).**

`skills:test` (§13.6, `scripts/skills-test.js`) proves a subprocess skill *runs* headless.
This pack is the §13.7 *second gate*: it proves subprocessing a skill is actually
**beneficial** — that it **saves meaningful tokens/context AND the results are as good as
inline**. A skill is finalized as `execution: subprocess` only when BOTH gates pass,
measured per-skill, never assumed (PLAN §13.6 → §13.7, §17.5).

The §13.7 measurement RUNNER is **`scripts/skills-bench.js`** (fixture-proven by
`scripts/skills-bench.test.js`). It reads a *benchset* (`bench-result.schema.json`) — the
per-task A/B token MEASUREMENTS + thresholds + judge metadata — computes both axes, and
on a BOTH-pass **finalizes** the skill in the skill-weight registry by setting the STRICT
`subprocess_verified: true` (the value `dispatch-contract.js#skillExecution` requires to
actually route subprocess) plus an `earn_it` block `{ tokens_saved, quality_verdict,
context_needed?, measured_at, run_id, axis1, axis2 }`. **Two-gate ladder:** the §13.6 ping
stamp is an OBJECT (`subprocess_verified:{date,run_id,…}`) → proves runnable but, being
`!== true`, still routes inline; §13.7 is what flips it to the strict `true`. Fail-closed:
either axis failing → not finalized → the skill stays inline.

§17.5 is explicit that this cannot be judged from a single run (retries, summarization,
review churn, and stale-context failures hide the true cost). So §13.7 requires a small
**replayable task set** with baseline inline runs, subprocess runs, gold/human
expectations, anonymized cross-provider judging, and explicit thresholds.

---

## The two axes (both must pass — fail-closed)

### Axis 1 — token/context savings (the premise check)
A/B the **orchestrator-side** cost:

- **INLINE** — the full skill output enters Alpha's context.
- **SUBPROCESS** — only the ≤8-line envelope enters Alpha's context.

```
net_savings = inline_orchestrator_tokens − (envelope_tokens + dispatch_overhead)
dispatch_overhead = background-task notification + envelope read + completion-record check
```

Qualify a skill only when `net_savings` clears **both** thresholds
(`min_tokens_saved` AND `min_pct_saved`). **Light skills whose output is already small
save ≈nothing (envelope ≈ inline) → they stay inline.** Measurement model = the
`oneshot-token-guide` orchestrator-tokens-per-activity table.

### Axis 2 — result quality ("are the results good?")
Run the skill INLINE and SUBPROCESS on the **same representative input**; compare. A fresh
subprocess lacks Alpha's live conversation, so some skills degrade.

- Score equivalence with an **independent cross-provider judge** (no self-grading — the
  diff-model-review pattern, GPT Pro §9.4). Pass = subprocess quality ≥ inline quality
  within `quality_tolerance`.
- The cross-provider judge is for **independent review / high-risk routing / calibration —
  NOT the sole quality oracle for every test** (§17.5). Where a gold expectation exists,
  grade against it first; use the judge for the subjective delta.
- On fail: either keep the skill inline, OR feed the missing context into the dispatch
  prompt and re-test (it may then pass — and the registry records `context_needed`).

### Decision rule (fail-closed)
Finalize `execution: subprocess` ONLY when BOTH hold — saves meaningful tokens/context
**AND** results are as-good. Otherwise → `inline` (or `inline-required`). Stamp the
skill-weight registry per skill:

```
{ subprocess_verified (§13.6), tokens_saved, quality_verdict, context_needed?, measured_at, run_id }
```

---

## Layout (when this pack is filled in — currently scaffold only)

```
benchmark-pack/
  README.md                   ← this file (the contract)
  task-set.schema.json        ← schema for the INPUT side: a replayable task set (tasks + thresholds)
  task-set.example.json       ← worked EXAMPLE task set (illustrative; NOT a measurement)
  bench-result.schema.json    ← schema for the MEASURED side: a benchset skills-bench.js consumes/produces
  bench-result.example.json   ← worked EXAMPLE benchset (SYNTHETIC placeholder counts; NOT a measurement)
  task-sets/                  ← (future) one <skill>.json task set per skill under measurement
  runs/                       ← (future) raw inline/subprocess run artifacts, per task
  results/                    ← (future) computed savings + quality verdicts, per skill
```

Two paired schemas:

- **`task-set.schema.json`** — the INPUT: per task a stable `task_id`, the skill + input,
  a `gold` expectation (or rubric), and the per-axis thresholds.
- **`bench-result.schema.json`** — the MEASURED side `skills-bench.js` reads: per task the
  orchestrator token counts for both arms (`inline_orchestrator_tokens`, `envelope_tokens`),
  optional artifact digests, the thresholds, and the independent judge's `verdict`. The
  runner computes Axis 1 from these counts and reads Axis 2 from the judge verdict (it never
  self-grades).

See each `.schema.json` for the exact shape and the matching `*.example.json` for a filled
illustrative example. **Both examples carry placeholder/synthetic numbers, clearly marked —
neither is a real measurement.**

### Running the mechanism on a fixture (no spend)

```
# both axes pass → EARNED → would finalize (dry):
SKILLS_BENCH_JUDGE_OVERRIDE='{"<skill>":{"verdict":"subprocess>=inline","score":0.0}}' \
  node scripts/skills-bench.js --registry <fixture-registry.json> --benchset <benchset.json> --no-finalize

# the fixture A/B test (both-pass→stamped; axis-1-fail→not finalized; axis-2-fail→not finalized):
node scripts/skills-bench.test.js
```

`SKILLS_BENCH_JUDGE_OVERRIDE` STUBS the cross-provider judge deterministically for the
fixture path — there is no real judge dispatch and no spend. With **no** override and no
real judge wired, Axis 2 is **UNGRADED** and the skill fails closed (never self-graded,
never assumed-good).

---

## How a FUTURE session runs the deferred §13.7 measurement

This is intentionally NOT run this session (the 6 real heavy subprocess skills —
`scan:full`, `research:deep`, `qa:audit`, `redteam:full`, `sleep:deep`, `learn:deep` —
are heavy-by-design; a real A/B of each is expensive and they are NOT stamped by a routine
harness run). When a future session decides to earn-it for a specific skill:

1. **Prove it runs (§13.6) FIRST** — `node scripts/skills-test.js --mode ping --skill <ns:skill>`.
   This is a real bounded spawn that **spends**. On PASS it stamps `subprocess_verified`
   in `.claude/runtime/skill-weight.json`. §13.7 depends on §13.6 — you cannot measure
   savings/quality until the skill runs headless.
2. **Author the task set** — `task-sets/<skill>.json` against `task-set.schema.json`: a
   handful of representative inputs with gold expectations + the two-axis thresholds.
3. **Run both arms per task** — capture INLINE orchestrator tokens and SUBPROCESS
   (envelope-only) orchestrator tokens; store raw artifacts under `runs/`. Record them
   into a *benchset* (`bench-result.schema.json`): one `measurements[]` entry per task
   with `inline_orchestrator_tokens` + `envelope_tokens` (+ optional artifact digests).
4. **Grade Axis 2** — gold-first, then an anonymized cross-provider judge for the
   subjective delta (the diff-model-review pattern; never self-grade); write the judge's
   `verdict` (+ optional signed `score`) into the benchset's `judge` block.
5. **Run the harness** — `node scripts/skills-bench.js --registry .claude/runtime/skill-weight.json
   --benchset <benchset.json>`. It computes Axis 1 (`net_savings` per the formula, both
   thresholds) and reads Axis 2 from the judge verdict, then on a BOTH-pass **finalizes**
   the registry: sets the strict `subprocess_verified: true` + the `earn_it` block
   `{ tokens_saved, quality_verdict, context_needed?, measured_at, run_id, axis1, axis2 }`.
   A skill that fails either axis stays `inline` (exit 1, nothing stamped).
6. **Anti-rot** — re-measure on skill change; the Phase-0 dry-run (§14) cannot pass while
   any `subprocess`-classified skill lacks a CURRENT savings+quality measurement.

> **Enforcer note (§13.6 anti-rot):** `subprocess_verified` must be invalidated when a
> skill's `.md` changes (the `skill-catalog-regen` hook) and re-checked at `/scan:full`. A
> stale stamp (skill changed since) reverts to unverified — no "tested once, trusted
> forever." Wiring that invalidation is itself deferred work; until it lands, treat any
> stamp as provisional and log the gap via `/enforcement:log`.

---

## What is DEFERRED (explicit, honest scope)

- **No skill is `subprocess_verified` yet** — not the 6 heavy real skills, not any other.
  Across §13.6 + §13.7 this work shipped the HARNESSES — the §13.6 runnability harness
  (`skills-test.js`, resolve + fixture-proven ping) and the §13.7 A/B measurement runner
  (`skills-bench.js`, fixture-proven by `skills-bench.test.js`). Both fixture tests
  stamp/fail-closed on FIXTURE skills ONLY; the live `.claude/runtime/skill-weight.json` is
  asserted byte-unchanged and carries **0** finalized (`subprocess_verified:true`) skills.
- **No real A/B measurement exists** — there are no run artifacts under `runs/` and no
  verdicts under `results/`. Every number in `task-set.example.json` and
  `bench-result.example.json` is an illustrative placeholder, clearly marked, not a
  measurement (the example benchset's zeros would in fact FAIL Axis 1 fail-closed).
- **The §13.7 heavy measurement itself is DEFERRED** — the *mechanism* exists and is
  fixture-proven, but RUNNING it against the 6 real heavy skills is an expensive, deliberate
  future action per the steps above ($-budgeted; one skill at a time; each replays the skill
  twice + a real cross-provider judge call), starting with a real §13.6 ping.
