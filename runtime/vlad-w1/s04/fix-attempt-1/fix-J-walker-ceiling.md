# BUNDLE J — ban the enabling primitive, and make the remaining ceiling honest and execution-backed

Sprint S-VLADW1-04, **fix attempt 1 — there is no attempt 2.** Bundles G, H and I are running in parallel
on other files.

## Where you work
Worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`. Commit here. No branch, push, or merge. Paths relative to `engine/`.

**allowedFiles:** `engine/scripts/checks/spawn-env-allowlist.js` · `engine/test/custody-static.test.js` ·
new fixture files under `engine/test/fixtures/` (prefix `J-`)
**forbiddenFiles:** everything else — **especially `engine/CUSTODY.md` (bundle H owns it),
`engine/src/**`, `engine/driver/**`, `engine/scripts/checks/custody-claim-lint.js`, `engine/package.json`.**
Stage only your files by path; never `git add -A`. Other bundles' files will show modified; **leave them.**

## THE PROCESS RULE

**You draft each shipped claim sentence AFTER running the attack that would falsify it. No claim without
its attack.** Envelope carries a `falsification_attempts` array.

---

## The finding — execution-proven, against a green gate

A review lane placed a probe at `engine/scripts/__probe_walker.js` — **`scripts/` IS in
`package.json#files`, so it ships and IS scanned** — containing:

    import { createRequire } from 'node:module';
    const req = createRequire(import.meta.url);
    const cp = req('child_process');
    const method = 'sp'+'awn';
    cp[method](bin, argv, { env });

- `CHILD_PROCESS_IMPORT_PATTERN` matches only `from` / `require(` / `import(` — an **aliased** `req(...)`
  is caught by neither it nor `DYNAMIC_CALL_PATTERN`.
- `RAW_LAUNCH_PATTERN` needs the literal token `spawn(` — **computed access `cp['spawn']` evades it.**
- Result: `spawn-env-allowlist: OK — 35 file(s) scanned, 0 violations`, `check:ship` **exit 0** — and a real
  child echoed the credential.

**Graded correctly: the probe file is not in the committed tree, so this proves the CONTROL is defeatable,
not that the package leaks.**

## TASK 1 — ban `createRequire` outside `spawn-shim.js`. This is WIRING, not new detection capability.

**Do NOT attempt to trace the alias graph.** Tracing what `req` becomes is new static-analysis capability,
and building a general mechanism that overclaims its own coverage is exactly how this sprint family fails.
**Ban the enabling primitive instead**, mirroring the scanner's existing ban on `node:child_process` imports
outside `spawn-shim.js`. It is one more pattern in the same family.

**Verified before this brief was written, so you know the ground:** `createRequire` appears in the shipped
tree **only inside comments** — `src/model-seam.js:276` and `scripts/checks/lib/strip-comments.js:40`, both
prose *about* this residual — and the scanner **strips comments before matching** (line 809). The shipped
test does not use it either. **Zero executable uses. Confirm this yourself before you rely on it.**

**The header must state the residual honestly (β row 312), and this is not optional:**
- *"zero executable uses on tree"* is **live state, not an invariant** — it is true today and a future
  commit can change it.
- The ban **forbids a legitimate future use** (ESM/CJS interop is a real reason to want `createRequire`).
- **The escape hatch is a CODE-LEVEL STRUCTURAL EXEMPTION, never a settable suppression marker.** A marker
  an author can set in a file to silence this check is the same hole in a new place — the record-trust
  gate's false-RED doctrine is explicit about this.

## TASK 2 — the ceiling, in strong form, and what the ban does NOT close

The ban removes the demonstrated route. **It does not close the class.** `process.binding`, `eval`,
`Function()`, WASM and other reflective routes remain, and a text matcher cannot see them by construction.

Write that ceiling into **the scanner's own header** where the enforcer's reader is. Name specifically:
computed member access, `createRequire` aliasing (now banned, with the residual above), and the reflective
routes that remain open.

**You may NOT edit `CUSTODY.md`** — bundle H owns it this wave. If you judge a shipped custody claim also
needs to change, **say so in your envelope** and it will be routed.

## TASK 3 — commit the probe as an EXPECTED-BYPASS fixture, re-pointed so it still bypasses

Commit the probe shape as a standing fixture that documents the ceiling **by execution** rather than by
assertion.

**Critical: after your ban, the original `createRequire` probe will be REFUSED — so as a ceiling witness it
would go red and stop witnessing anything.** Re-point the fixture to a route that **still** bypasses after
the ban (a reflective route from Task 2), and assert **that** it is not caught — an EXPECTED-BYPASS
assertion, clearly named as such, so a future reader sees the ceiling is real and current.

**And assert the ban itself works**: the original `createRequire` shape must now be REFUSED. Two assertions,
opposite directions, both observed.

---

## Discipline
- **Suite floor is the current count** (≥339), 0 fail / 0 skipped / 0 todo.
- **COMMIT AFTER EACH TASK.** Three tasks, three commits expected.
- **Remove every scratch/probe file that is not the committed fixture** — a leftover probe has broken this
  suite once already by tripping this very scanner.
- **Redact credential-shaped literals** — placeholders only.
- **Check the over-refusal direction:** the ban must not RED the real tree. `check:ship` exit 0 at the end.
- **NEVER offer a green gate as evidence that a claim is TRUE.**

## Verify — each as its OWN command, its own exit code

    cd engine
    node --test "test/*.test.js"
    npm run check:ship

## Envelope — FINAL message, JSON, nothing after it

    { "bundle": "J", "ok": true, "commit": "<sha list>", "files_changed": ["..."],
      "suite": {"pass":0,"fail":0,"skipped":0,"todo":0}, "check_ship_exit": 0,
      "ban": {"pattern":"...","executable_uses_found":0,"over_refusal_check":"<real tree still clean>",
              "residual_in_header":"<the exact text incl. live-state + future-use + structural-exemption>"},
      "ceiling_text": "<the scanner-header ceiling naming what remains open>",
      "fixture": {"ban_works_assertion":"<original probe now REFUSED — real output>",
                  "expected_bypass_route":"<what still bypasses, and the assertion>"},
      "custody_md_change_needed": ["... or none — you may not edit it"],
      "falsification_attempts": [ {"claim":"...","attack_run":"...","outcome":"..."} ],
      "residuals_named": ["..."], "what_i_could_not_do": ["..."] }

Emit the envelope even if you stop early. **Committing beats finishing.** Commits start `fix(J):`.
