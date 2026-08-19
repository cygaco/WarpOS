# Lane evidence — `security-reviewer` / agy (CROSS-FAMILY) — S-VLADW1-03 gauntlet-2

Shape: `subprocess-cross-provider` via `scripts/dispatch-agent.js` · provider `antigravity` ·
model `gemini-3.1-pro-high` · `--print-timeout 300s` · dispatched from the WarpOS canonical root
Raw result: `runtime/vlad-w1/s03/gauntlet-2/out-security-agy.json` (`ok:true`)
Brief: `lane-security-agy.md` (27,612 bytes, under the ~32KB argv ceiling)

**Verdict: FAIL.** `p_order_holds: yes` · `p_absorb_holds: no` · `prior_findings_repaired: yes`.

Read-scope: served toolless-inline, handed **exactly two complete files** (`src/bootstrap.js`,
`src/env-scrub.js`). It did not see `spawn-shim.js`, `server-entry.js`, `host-free-driver.js`,
`model-seam.js`, `CUSTODY.md` or any test, and listed all six itself. Every finding correctly carries
`execution_proven: false` — it ran nothing. Second round running, second round calibrated.

**It confirmed the repair of its own prior findings:** `p_order_holds` moved from `no` to **yes**, and it
reports the `__proto__`/prototype-alias and rotation-valence findings from gauntlet-1 as repaired.

## Findings, and the conductor's execution verdict on each

### F-1 — HIGH — **DOES NOT REPRODUCE. Falsified.**
> *"`readOwnEnvValue` strictly checks own property case, but Windows `process.env` deletes are
> case-insensitive, destroying credentials without capturing them."*

Executed on win32 against the real module — provisioned under the lower-case spelling, scrubbed under the
canonical one:

```
F1a provisioned under lower-case: anthropic_api_key | read back via canon: PROBE-VALUE-NOT-A-REAL-SECRET
F1b after scrub -> env[canon]: undefined | env[lower]: undefined
F1c captured: PROBE-VALUE-NOT-A-REAL-SECRET
F1d VERDICT: CAPTURED (no loss)
```

Node's `process.env` on Windows is case-insensitive for **reads and own-property checks too**, not only
for deletes — so `readOwnEnvValue` sees the value and captures it. The premise of the finding is wrong.
And the finding cannot hold on a case-sensitive platform either, because there the two spellings are
genuinely different variables and there is no mismatch to exploit. **Falsified in both directions; not
carried into the fix set.**

### F-2 — HIGH — **mechanism plausible, NOT reachable in the shipped shape. Not verified further.**
> *"Passing a Symbol in the names array throws a TypeError on deletion, crashing the loop and leaving
> subsequent credentials in `process.env`."*

`names` is caller-supplied, and every shipped caller passes a fixed string array. A `Symbol` cannot enter
by any shipped path. Same class as gauntlet-1's prototype-key finding: a robustness gap in a security
primitive, not a leak. Recorded; **downgraded from HIGH.**

### F-3 + `residuals_wrong_or_missing` — **CONFIRMED BY EXECUTION. This is the real one.**
> *"The re-scrub loop only deletes names passed in the current call, leaving previously captured
> credentials vulnerable to mid-session reprovisioning if omitted."*

```
F3 env[B] after partial re-scrub: PROBE-VALUE-NOT-A-REAL-SECRET
F3 VERDICT: STILL PRESENT -- would be inherited by the next child
```

A full-list call at startup, then `B` re-provisioned mid-session, then a **partial** later call omitting
`B` — and `B` is left sitting in `process.env` for the next child to inherit. The mechanism is exactly as
agy described.

**Reachability, checked rather than assumed.** Every shipped call site passes a FULL list:
`src/server-entry.js:78` and `driver/host-free-driver.js:62` pass `CREDENTIAL_ENV_NAMES`;
`src/model-seam.js:330` passes `ENV_DENYLIST`; `src/spawn-shim.js:373` passes `envDenylist` from
`describeAuth()` — and a standing test asserts `CREDENTIAL_ENV_NAMES` and `describeAuth().envDenylist`
stay set-identical. **So there is no shipped-reachable trigger today, and this does NOT fire S1.**

**But the shipped claim is broader than the mechanism**, which is this sprint's recurring defect class.
`src/spawn-shim.js:356-373` states unconditionally:

> *"A credential provisioned at any point after startup ... is captured-and-deleted from `process.env`
> here, before the NEXT child launched through this wrapper could ever inherit it — this is what makes
> idempotence a CLASS property of the wrapper rather than an accident."*

That guarantee holds **only because every caller happens to pass the full list.** It is a property of the
call sites, not of the mechanism, and it is stated as a property of the mechanism — while explicitly
claiming CLASS status. **That is an S2/S5 item for the remaining fix attempt:** either make the re-scrub
delete every *previously captured* name regardless of the current call's list (making the claim true of
the mechanism), or state the precondition. agy reached this from two files without seeing `spawn-shim.js`
at all.

## Cross-family value, second round running

All three Claude lanes ran the same tree and none filed the partial-list gap. In gauntlet-1 this lane
found two defects the Claude family missed; in gauntlet-2 it found one more, plus one falsified claim and
one unreachable-but-real robustness gap. **A finding all three Claude lanes miss is not thereby cleared —
this lane is the standing evidence for that rule.**
