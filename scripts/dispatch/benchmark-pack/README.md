# Skill-dispatch benchmark pack — §13.7 "is it worth it + are the results good?"

> **SCAFFOLD — heavy A/B §13.7 measurement DEFERRED. No skill is `subprocess_verified` yet. This directory describes a replayable task set; it contains NO fabricated measurements.**

`skills:test` (§13.6, `scripts/skills-test.js`) proves a subprocess skill *runs* headless.
This pack is the §13.7 *second gate*: it proves subprocessing a skill is actually
**beneficial** — that it **saves meaningful tokens/context AND the results are as good as
inline**. A skill is finalized as `execution: subprocess` only when BOTH gates pass,
measured per-skill, never assumed (PLAN §13.6 → §13.7, §17.5).

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
  README.md                 ← this file (the contract)
  task-set.schema.json      ← schema for a replayable task set
  task-set.example.json     ← a worked EXAMPLE shape (illustrative; NOT a measurement)
  task-sets/                ← (future) one <skill>.json per skill under measurement
  runs/                     ← (future) raw inline/subprocess run artifacts, per task
  results/                  ← (future) computed savings + quality verdicts, per skill
```

A real task set carries, per task: a stable `task_id`, the skill + input, a `gold`
expectation (or a rubric), and the per-axis thresholds. A run records the orchestrator
token counts for both arms, the envelope, the artifact digests, and the anonymized judge
verdict. See `task-set.schema.json` for the exact shape and `task-set.example.json` for a
filled illustrative example.

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
   (envelope-only) orchestrator tokens; store raw artifacts under `runs/`.
4. **Compute Axis 1** — `net_savings` per the formula; require both thresholds.
5. **Grade Axis 2** — gold-first, then an anonymized cross-provider judge for the
   subjective delta (the diff-model-review pattern; never self-grade).
6. **Stamp the registry per skill** — `{ subprocess_verified, tokens_saved, quality_verdict,
   context_needed?, measured_at, run_id }`. A skill that fails either axis stays `inline`.
7. **Anti-rot** — re-measure on skill change; the Phase-0 dry-run (§14) cannot pass while
   any `subprocess`-classified skill lacks a CURRENT savings+quality measurement.

> **Enforcer note (§13.6 anti-rot):** `subprocess_verified` must be invalidated when a
> skill's `.md` changes (the `skill-catalog-regen` hook) and re-checked at `/scan:full`. A
> stale stamp (skill changed since) reverts to unverified — no "tested once, trusted
> forever." Wiring that invalidation is itself deferred work; until it lands, treat any
> stamp as provisional and log the gap via `/enforcement:log`.

---

## What is DEFERRED (explicit, honest scope)

- **No skill is `subprocess_verified` yet** — not the 6 heavy real skills, not any other.
  This session shipped the HARNESS + the token-free resolve mode + a fixture-proven ping
  path. The fixture test stamps/fails-closed on FIXTURE skills only.
- **No real A/B measurement exists** — there are no run artifacts under `runs/` and no
  verdicts under `results/`. Every number in `task-set.example.json` is an illustrative
  placeholder, clearly marked, not a measurement.
- **The §13.7 heavy measurement itself is DEFERRED** — it is an expensive, deliberate
  future action per the steps above, one skill at a time, starting with a real §13.6 ping.
