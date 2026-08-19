# CROSS-FAMILY SECURITY PASS — vlad engine, sprint S-VLADW1-03, commit `0732cd8`

You are the **only non-Claude judgment** in this gauntlet. Three other lanes all run claude-opus-5 and are
ONE FAMILY, not three votes. **Disagree freely.**

## YOU WERE RIGHT LAST ROUND. Both findings were confirmed by execution and are now FIXED.

In the previous run (`a9e6708`) you filed, against these same two files:

- **Your F-2** — the captured snapshot was `const snapshot = {}`, so `__proto__` aliased through the
  setter, the value was lost, and `getCapturedCredential("__proto__")` returned `Object.prototype`. The
  conductor executed it: **confirmed, and WIDER than you filed** — the re-scrub guard
  `nextCaptured[name] === undefined` is false for *any* `Object.prototype` key, so `toString` returned a
  **function**. All three Claude lanes missed this entirely.
- **Your `residuals_wrong_or_missing` item 1** — that RESIDUAL 1's "absorbs a mid-session credential"
  framing was wrong for the rotation case. Executed: **confirmed.** On a real rotation the re-scrub keeps
  the stale value, deletes the new one, and the fallback serves the stale credential with no signal.

Both are repaired in the files below. **Your job now is to check the repair and then break it again.**
You were also right that preload (`NODE_OPTIONS` / `--require` / `--import`) was a missing residual; it is
now disclosed on the shipped surface, which you cannot see.

## THE THESIS

Credentials must never reach a child by environment inheritance. Static scanners over call-site shapes
failed three rounds — the family of spellings is unbounded. The answer is **capture-then-scrub**: at
startup every denylisted credential is read out of `process.env` into a private slot and **deleted**, so
no child can inherit it however it is spawned.

**P-ORDER — nothing can run before the scrub.** `src/env-scrub.js` has **zero imports**.
`src/bootstrap.js` is the ONE shared static-import surface: each real entry (`src/server-entry.js`,
`driver/host-free-driver.js`, neither of which you can see) statically imports **exactly one** specifier —
`bootstrap.js` — calls the scrub, then reaches the program by **dynamic** `import(...)`.

**P-ABSORB — a credential provisioned LATER is still covered.** `initCredentialCustody()` is re-invoked
before every real child launch by `auditedSpawn()` in `src/spawn-shim.js` (which you cannot see). It uses
**absorption, not re-capture**: a name whose captured slot already holds a real value is never
overwritten, because a naive full re-capture would read `undefined` for already-deleted names and destroy
the captured credential.

## YOUR QUESTION

**Using only the two files below, can you defeat P-ORDER or P-ABSORB — or defeat the REPAIR?**

1. **Attack the repair specifically.** The snapshot is now null-prototype with own-property guards, and a
   `readOwnEnvValue()` helper gates the capture reads because `process.env["toString"]` falls through to
   the inherited method rather than reading `undefined`. **Is that complete?** Is there any name, or any
   call sequence, where a value is still lost, overwritten with `undefined`, aliased, or left present in
   `process.env` when a child launches? Consider: `Symbol` keys, numeric-like names, `""`, names differing
   only by case, a `process.env` Proxy, `Object.defineProperty` on `process.env`, a non-configurable
   property making `delete` throw, and `Object.create(null)` objects hitting code that assumes
   `hasOwnProperty` exists on them.
2. **Is `getCapturedCredential` genuinely contracted to string-or-`undefined`** on every path, including
   after an absorb, after a rotation, and for a name never passed?
3. **Are the stated residuals in these headers TRUE and COMPLETE** for what these two files do? Is any
   claim in them false, and is any residual still MISSING? The headers are long and confident — that is
   exactly where the last three rounds hid their defects. **A false sentence inside sixty correct lines is
   the finding.**

## READ-SCOPE CEILING — stated, not assumed

Served **toolless-inline**: no file access, no shell, no test run. You are handed **exactly two complete
files** and nothing else.

**You have NOT been shown, and must NOT render a verdict on:** `src/spawn-shim.js` (where `auditedSpawn`
and the re-scrub call live), `src/server-entry.js`, `driver/host-free-driver.js`, `src/model-seam.js`,
`CUSTODY.md`, or any test file. If your reasoning depends on one of those, **say so explicitly**.

**You ran nothing. Therefore `execution_proven` MUST be `false` on every finding.** Last round you got
this exactly right and it is why your findings were weighted and acted on. Keep it.

## OUTPUT — JSON only, as your entire final message, nothing before or after

```json
{
  "lane": "security-reviewer-agy",
  "verdict": "PASS | FAIL",
  "findings": [
    {
      "id": "F-<n>",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "file": "<path>:<approximate line or symbol>",
      "claim": "<one sentence>",
      "attack": "<the concrete sequence that defeats it>",
      "execution_proven": false,
      "depends_on_unseen_file": "<name it, or null>"
    }
  ],
  "p_order_holds": "yes | no | cannot-assess",
  "p_absorb_holds": "yes | no | cannot-assess",
  "prior_findings_repaired": "yes | partially | no — say which and why",
  "residuals_wrong_or_missing": ["<explicit, or empty>"],
  "what_i_could_not_see": ["src/spawn-shim.js", "src/server-entry.js", "driver/host-free-driver.js", "src/model-seam.js", "CUSTODY.md", "all test files"]
}
```

---

# FILE 1 of 2 — `engine/src/bootstrap.js` (COMPLETE)

