# Lane evidence — `security-reviewer` / agy (CROSS-FAMILY) — S-VLADW1-03 gauntlet-1

Shape: `subprocess-cross-provider` via `scripts/dispatch-agent.js` · provider `antigravity` ·
spec model `gemini-3.1-pro-high` · served as `Gemini 3.1 Pro (High)` · `--print-timeout 300s`
Raw result: `runtime/vlad-w1/s03/gauntlet-1/out-security-agy.json` (`ok:true`, 5524 bytes, stderrBytes 0)
Brief: `runtime/vlad-w1/s03/gauntlet-1/lane-security-agy.md` (22,219 bytes, under the ~32KB argv ceiling)

**Verdict: FAIL.** `p_order_holds: no` · `p_absorb_holds: no`.

## DISPATCH NOTE — this lane died once before it ran

The first dispatch was fired with cwd set to the engine worktree. That broke role-registry resolution
(`ENOENT ... vlad/.worktrees/engine-lane/engine/.claude/agents/_org/role-registry.json`), so
`providers.DEFAULT_AGENT_PROVIDERS` fell back to its literal and the role resolved to **`openai`**, which
is unavailable — the wrapper returned `ok:false, fallback:true` and no review happened. Re-fired from the
WarpOS canonical root, which resolved `security-reviewer → antigravity` correctly. **The `ok:false` record
from the first attempt is a dead lane, not a verdict, and must not be read as one.**

## READ-SCOPE — what this lane was and was NOT shown

Served **toolless-inline**: no file access, no shell, no test run. Handed **exactly two complete files** —
`src/bootstrap.js` and `src/env-scrub.js`. It did **NOT** see `src/spawn-shim.js`, `src/server-entry.js`,
`driver/host-free-driver.js`, `src/model-seam.js`, `CUSTODY.md`, or any test file, and it listed all six
itself in `what_i_could_not_see`.

**Calibration, recorded:** every finding carries `execution_proven: false`, correctly — the lane ran
nothing. This is a direct improvement on the predecessor's round 3, where this lane marked two findings
`execution_proven: true` about a file it had said it could not read. **Its silence on an unseen file is
silence, not a pass.**

## Verdict JSON (verbatim)

```json
{
  "lane": "security-reviewer-agy",
  "verdict": "FAIL",
  "findings": [
    {
      "id": "F-1",
      "severity": "CRITICAL",
      "file": "engine/src/bootstrap.js:top",
      "claim": "Node.js preload mechanisms (--require, NODE_OPTIONS) evaluate before the main ESM graph, defeating P-ORDER.",
      "attack": "An attacker provisions NODE_OPTIONS=\"--require ./malicious.js\". The malicious script runs before bootstrap.js, observing the credential in process.env. It can also install a Proxy on process.env to intercept the delete operation, leaving the credential present for children.",
      "execution_proven": false,
      "depends_on_unseen_file": null
    },
    {
      "id": "F-2",
      "severity": "HIGH",
      "file": "engine/src/env-scrub.js:140",
      "claim": "P-ABSORB fails for names that collide with Object.prototype properties, such as __proto__.",
      "attack": "If a credential named __proto__ is passed, snapshot['__proto__'] = 'secret' fails to create an own property (it fails silently on primitives). On re-scrub, nextCaptured['__proto__'] resolves to Object.prototype, bypassing the === undefined check. The credential is deleted from process.env but never captured.",
      "execution_proven": false,
      "depends_on_unseen_file": null
    },
    {
      "id": "F-3",
      "severity": "MEDIUM",
      "file": "engine/src/env-scrub.js:154",
      "claim": "A non-configurable property on process.env causes the strict-mode delete to throw.",
      "attack": "A preload script defines a non-configurable getter for ANTHROPIC_API_KEY on process.env. When the scrub calls delete process.env[name], a TypeError is thrown. If the caller catches this, the scrub aborts early and the child launches with the credential still present.",
      "execution_proven": false,
      "depends_on_unseen_file": "src/spawn-shim.js"
    }
  ],
  "p_order_holds": "no",
  "p_absorb_holds": "no",
  "residuals_wrong_or_missing": [
    "Residual 1 is wrong: It claims mid-session credentials are absorbed. This is only true if the credential was undefined at startup. If a credential had a real value at startup and is updated mid-session, the re-scrub ignores the new value and destroys it.",
    "Missing residual: Preload modules (via NODE_OPTIONS, --require, --import) evaluate before the entry point's ESM graph, completely bypassing the 'nothing can run before the scrub' guarantee."
  ],
  "what_i_could_not_see": [
    "src/spawn-shim.js",
    "src/server-entry.js",
    "driver/host-free-driver.js",
    "src/model-seam.js",
    "CUSTODY.md",
    "all test files"
  ]
}
```

## Conductor's note on weighing these — CLAIMS, NOT FACTS, PENDING VERIFICATION

Per the verify-an-authority's-claims rule, none of these travels into a fix brief unverified. Their
status at the time of writing:

- **F-1 (preload/NODE_OPTIONS).** The premise is true of Node in general. The Claude security lane
  independently reached the same boundary and classified it as *outside the shipped launch shape* —
  reaching it requires control of the launch command line. Two lanes, one family apart, converged on the
  same boundary from opposite directions. The disagreement is about **severity and disclosure**, not
  mechanism: agy calls it a missing residual, and that half is the checkable part.
- **F-2 (`__proto__` in the captured snapshot).** This is a concrete, cheap-to-falsify claim about code
  agy DID see in full. **It must be executed before it is either fixed or dismissed.**
- **F-3 (non-configurable property → `delete` throws).** Explicitly `depends_on_unseen_file:
  src/spawn-shim.js`. Its "if the caller catches this" conditional is exactly the unseen part. Verify the
  caller's behaviour before weighing.
- **`residuals_wrong_or_missing` item 1** contradicts the shipped header's RESIDUAL 1 wording. agy reads
  absorption as *destroying* an updated mid-session value; the header describes it as never overwriting an
  already-captured real value. Those may describe the same behaviour with opposite valence — a
  documentation-truth question, and squarely S2/S5 territory.

---

## CONDUCTOR VERIFICATION BY EXECUTION (ε, immediately after the lane returned)

agy filed everything `execution_proven: false` because it ran nothing. **I ran the two checkable claims.
Both are TRUE, and F-2 is BROADER than agy stated.**

### F-2 — CONFIRMED, and wider than filed

`initCredentialCustody` builds its snapshot as `const snapshot = {}` (`src/env-scrub.js:190`) — an
ordinary object carrying `Object.prototype`. Probe (`node` against the real module, values are
`PROBE-VALUE-NOT-A-REAL-SECRET`, no real credential involved):

```
A0 env own '__proto__'? true | val: PROBE-VALUE-NOT-A-REAL-SECRET
A1 env val after scrub: {}
A2 getCapturedCredential('__proto__') typeof: object | === Object.prototype: true
A3 VALUE PRESERVED? NO -- LOST

B1 env val after re-scrub: [Function: toString]
B2 getCapturedCredential('toString') typeof: function
B3 VALUE PRESERVED? NO -- LOST
```

- `__proto__`: exactly agy's mechanism — the assignment hits the setter, no own property is created, the
  value is lost, and **`getCapturedCredential("__proto__")` returns `Object.prototype`**.
- **agy did not find the wider half:** the re-scrub branch is guarded by `nextCaptured[name] === undefined`,
  which is FALSE for *any* `Object.prototype` key. So `toString`, `constructor`, `valueOf`, `hasOwnProperty`
  behave the same way — and `getCapturedCredential("toString")` returns **a function**. A credential getter
  in a custody primitive can return a non-string.

**Honest weighting: this does NOT fire S1.** `names` is caller-supplied and every shipped caller passes a
fixed list (`CREDENTIAL_ENV_NAMES` / `ENV_DENYLIST`); no prototype key is on either. Nothing escapes to a
child. It is a **correctness/robustness defect in a security primitive plus a type-confusion in its
getter** — MEDIUM, not HIGH. The fix is `Object.create(null)` for the snapshot plus own-property guards.

### `residuals_wrong_or_missing` item 1 — CONFIRMED. Shipped RESIDUAL 1 is inaccurate.

```
C1 captured at startup: PROBE-OLD-VALUE
C2 env now holds: PROBE-ROTATED-VALUE
C3 env after re-scrub: undefined
C4 getCapturedCredential now: PROBE-OLD-VALUE
C5 ROTATED VALUE REACHABLE ANYWHERE? NO -- rotated value DESTROYED, stale value still served
```

The shipped header says a later call "**ABSORBS** a mid-session credential into the snapshot". That is
true **only** when the slot was `undefined`. When a real value was captured at startup and the operator
**rotates** the credential mid-session, the re-scrub keeps the old value, deletes the new one from
`process.env`, and `model-seam.js`'s fallback goes on serving the **stale** credential — silently, with no
error. **Credential rotation does not take effect and the operator gets no signal.** That is a
user-visible behaviour the shipped copy currently describes with the opposite valence — S2/S5 territory,
and the sharpest single thing this gauntlet produced.

### F-1 and F-3 — NOT verified by me

F-1 (preload/`NODE_OPTIONS`) is true of Node generally; the Claude security lane independently reached the
same boundary and placed it outside the shipped launch shape. The live question is **disclosure**, not
mechanism. F-3 explicitly depends on `src/spawn-shim.js`, which agy could not see. Neither travels into a
fix brief on this lane's word alone.
