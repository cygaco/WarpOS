# Teammate Stall Rules — the fire-and-poll pattern (WG-6 / #29)

**Status:** LIVE doctrine (Wave-2 #29). This is the verified rewrite of the
"TEAMMATE STALL RULES (WG-6)" that currently reads in
`.claude/agents/president/epsilon.md` and is cross-referenced from
`paths.agentDispatchGuide` (`.claude/agents/_system/guides/agent-dispatch-guide.md`).
Those two files are frozen on the in-flight dispatch sprint branch; the
fold-back of this pattern into them is logged as enforcement-debt (see the
Enforcer section). Until then, THIS file is the canonical stall doctrine.

## The failure it prevents

A teammate-ε (or any teammate) that launches **background** subprocesses and
then goes idle "waiting for returns" waits **forever**. The harness re-wakes a
teammate ONLY on an incoming `SendMessage` — a subprocess completing does **not**
trigger a re-wake, and an in-process `Agent(…, run_in_background:true)` return
is a different lane. The belief "the harness re-wakes me when my subprocess
finishes" is FALSE. Observed as 25-minute stalls ×3 (WG-6).

## The old rule, and why it was too blunt

The prior doctrine said, in effect: **"NEVER go idle while a background
subprocess is outstanding; dispatch subprocesses BLOCKING/foreground."** That
is safe but serializes everything — a conductor that must fan out N reviewers
can only run them one-at-a-time in the foreground, and cannot overlap a long
build with anything else.

## The verified pattern: FIRE-AND-POLL

You do not have to choose between "block foreground" and "idle forever." The
correct shape is **fire the work, then actively poll a durable signal** in the
SAME turn — you never yield control to an event that will not fire.

1. **FIRE** — launch the subprocess(es). Background fan-out is allowed *provided
   you poll* (below). For a single dependency, a bounded blocking/foreground
   dispatch is still the simplest correct choice.
2. **POLL a durable signal, in-turn** — do not `await` an inbox that will not
   wake. Poll one of these until your bound elapses:
   - **The signal board** (`scripts/teams/signal-board.js`, guide
     `signal-channel.md`): `wait <topic> --timeout <s> --poll <ms>` blocks the
     poller in-process and returns exit 0 with the ruling the moment a teammate
     posts it, exit 3 on timeout. This is the accelerator for **teammate
     rulings/verdicts** (β at a phase boundary, a Director's call).
   - **The completion ledger** (`gauntlet-verify` / `epsilon-liveness.js`): for
     **dispatched worker** returns, the ground truth is the durable completion
     record, not narration. Poll the ledger / re-run `gauntlet-verify` for the
     run window; absence of an `ok:true` well-formed record IS the death signal.
3. **BOUND every poll.** A poll without a timeout is just a stall with extra
   steps. On timeout, take a recovery action (re-dispatch, or report state to
   the lead), never silently keep waiting.
4. **Report state before any UNAVOIDABLE idle point.** If you must yield, first
   `SendMessage` the lead concrete state: what is outstanding and where its
   evidence will land, so the lead can watchdog and recover (idle ≠ dead — a
   `SendMessage` wakes an idle teammate; no readiness ping after spawn ≈ reaped,
   RI-004-class → re-spawn).

## Why fire-and-poll is safe (it closes the wake-gap by construction)

The stall bug is a **missing wake event**. Polling removes the dependency on a
wake event entirely: the poller drives the clock itself and observes the
durable artifact (a posted signal, or a completion record) directly. You are
never parked on an event the harness will not deliver.

## Poll patience — the 540s clamp bound (live evidence, 2026-07-16)

Do not declare a dispatch dead early. Tonight's ledger gave three deterministic
signals about WHEN a worker is actually gone:

- **Long reviewers die at the clamp, not at random.** Two `backend-reviewer`
  runs died at **exactly the 540s timeout clamp** (`elapsed_ms` ≈ 540000 in the
  ledger — deterministic, not a random reap). A death right at the clamp is a
  *timeout*, a distinct failure class from an early silent reap.
- **"Reaped" often means "not done yet."** BOTH `qa` attempts the conductor
  declared reaped had actually **COMPLETED late** — their artifacts landed at
  00:53:58, after the conductor had already written them off. The narration was
  wrong; the artifact was the truth.
- **Short dispatches never died.** The β consults (22–100s) always returned.
  Short lanes are not the risk; long lanes near the clamp are.

**The bound:** nothing is dead before **540s + margin**. Before declaring a
long-running dispatch dead:

1. Keep polling until at least the clamp bound (`DISPATCH_BUILDER_TIMEOUT_MS`,
   ~540s) plus a margin has elapsed — an earlier "no return yet" is expected,
   not death.
2. **Check for the artifact before declaring death** — look for the completion
   record / evidence file the dispatch was told to write. A late-landing
   artifact (the qa case above) beats a premature "reaped" verdict every time.
3. Only after the bound has passed AND no artifact exists is the lane a genuine
   death (re-dispatch). A death *at* the clamp is a timeout — re-dispatch with a
   larger bound or a smaller unit, not an identical retry.

## Rule of thumb — which channel

| Waiting on… | Poll | Why |
|---|---|---|
| A teammate's ruling/verdict (β, Director) | signal board `wait <topic>` | rulings are posted; beats inbox-batching latency |
| A dispatched worker's output | completion ledger / `gauntlet-verify` | narration lies; the record is ground truth |
| A single hard dependency | bounded foreground dispatch | simplest correct shape; no fan-out to overlap |

## Enforcer

The stall-adherence enforcer is `scripts/checks/epsilon-liveness.js` (WG-6): for
each stale outstanding subprocess it checks the completion ledger and flags an
idle-with-outstanding-work stall. The signal-board half is self-tested by
`scripts/teams/signal-board.test.js`. **Debt:** folding this fire-and-poll
rewrite back into the frozen `epsilon.md` TEAMMATE STALL RULES section and the
`agent-dispatch-guide.md` cross-reference is logged as enforcement-debt (WG-29),
to be applied once `sprint/SP-20260716-001-dispatch` merges — nothing yet
detects that the frozen doctrine still reads the old blunt "never go idle" form
instead of this pattern.
