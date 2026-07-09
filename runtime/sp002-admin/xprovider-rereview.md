# Cross-provider re-review - SP-20260614-002 admin:* dev-tooling suite

Verdict: PASS

Binding result: all 6 prior findings are fixed in the current code. Remaining blockers: 0.

AC-R4c routing-file gate: blessed. `framework/admin-panel-registry.json` is the reviewed routing file for this pass. It has the expected `warpos/admin-panel-registry/v1` schema, a generic `panels` map, and only the approved keystone opener forms:

- `node scripts/admin/preview.js`
- `node scripts/admin/preview.js --route /admin/readiness`
- `node scripts/admin/preview.js --route /admin/guides`

## Finding re-verification

1. FIXED - detectReady premature readiness

   Evidence:

   - `scripts/admin/preview.js:53` defines `READY_SIGNAL_RE = /Ready in|ready on|started server on/i`.
   - `scripts/admin/preview.js:110-118` requires that explicit ready signal before returning `{ ready: true }`.
   - `- Local:` is used only for port parsing via `PORT_RE`, not as readiness.
   - Manual repro returned the required non-ready result:

   ```json
   {"ready":false,"port":null}
   ```

   Regression coverage spot-check:

   - `tests/regression/SP-20260614-002/preview-boot-detection.test.js:72-81` asserts both Local-only and compiled-only buffers are not ready.

2. FIXED - dev-server lifecycle/orphan

   Evidence:

   - `scripts/admin/preview.js:209-218` defines `treeKill(child)`.
   - On win32 it invokes `taskkill` with `["/pid", String(child.pid), "/T", "/F"]`, which is the requested process-tree kill form.
   - Timeout path uses the helper through `killChild()` at `scripts/admin/preview.js:280`.
   - Pointer-write failure uses `treeKill(child)` at `scripts/admin/preview.js:339-340`.
   - Post-ready lifecycle cleanup is centralized as `cleanup = () => treeKill(child)` and registered for `SIGINT`, `SIGTERM`, `SIGHUP`, `uncaughtException`, and `exit` at `scripts/admin/preview.js:360-365`.

   Note: the signal handlers are installed after the server reaches ready and the pointer is written. The explicit prior blocker sites - timeout, pointer-write failure, and post-ready foreground lifecycle cleanup - are now covered.

3. FIXED - enforcer opener injection

   Evidence:

   - `scripts/checks/admin-suite-coverage.js:156-163` rejects shell metacharacters as `unsafe_opener`.
   - `scripts/checks/admin-suite-coverage.js:165` uses a full-string anchored node opener regex:

   ```js
   /^node\s+(scripts\/admin\/[a-z][a-z0-9-]*\.js)(?:\s+--route\s+\/admin(?:\/[a-z][a-z0-9-]*)?)?$/
   ```

   Manual injected repro:

   - Opener: `node scripts/admin/preview.js && calc.exe`
   - Result finding type: `unsafe_opener`

   Regression coverage spot-check:

   - `tests/regression/SP-20260614-002/admin-suite-coverage.test.js:97-102` asserts this exact exploit shape is rejected as `unsafe_opener`.

4. FIXED - WarpOS guard token-only check

   Evidence:

   - `scripts/checks/admin-suite-coverage.js:89-96` strips JS comments before analysis.
   - `scripts/checks/admin-suite-coverage.js:214-219` extracts the `run()` body and compares the guard call position against the first side-effecting seam.
   - `scripts/checks/admin-suite-coverage.js:221-229` emits `missing_warpos_guard` or `warpos_guard_call_order` instead of passing on token presence.

   Manual injected repros:

   - Comment-only `refuseIfTargetIsWarpOS` mention produced `missing_warpos_guard`.
   - `resolveOrScaffold({})` before `refuseIfTargetIsWarpOS(instanceDir)` produced `warpos_guard_call_order`.

   Regression coverage spot-check:

   - `tests/regression/SP-20260614-002/admin-suite-coverage.test.js:112-118` asserts seam-before-guard yields `warpos_guard_call_order`.

5. FIXED - seed.js env-overridable refusal

   Evidence:

   - `scripts/admin/seed.js:111-128` implements target-local refusal through path identity, target `.claude/manifest.json` top-level `warpos`, and `project.slug === "warpos"`.
   - The executable code has no `resolveRepoRole` import or call. The only `resolveRepoRole` text is the explanatory comment at `scripts/admin/seed.js:106-109`.
   - Manual repro with `WARPOS_REPO_ROLE=consumer` and a temp target manifest containing `warpos` plus `project.slug: "warpos"` still returned `{ warpos: true }`.

   Regression coverage spot-check:

   - `tests/regression/SP-20260614-002/seed-idempotent.test.js:82-90` asserts a pointer to the WarpOS root is refused.

6. FIXED - enforcer resolver errors

   Evidence:

   - `scripts/checks/admin-suite-coverage.js:68-78` returns `resolverError` for `res.error`, nonzero status, or empty stdout.
   - `scripts/checks/admin-suite-coverage.js:81-84` returns `resolverError` for bad JSON.
   - `scripts/checks/admin-suite-coverage.js:122-130` emits `finding_type: "resolver_error"` instead of `skill_unresolved`.
   - Opener skill resolution also preserves resolver failures as `resolver_error` at `scripts/checks/admin-suite-coverage.js:186-187`.

   Live sandbox probe:

   - `node scripts/checks/admin-suite-coverage.js --json` returned four `resolver_error` findings caused by nested `spawnSync ... EPERM`, not `skill_unresolved`.
   - Direct top-level `node scripts/dispatch-skill.js --resolve --skill admin:preview --json` returned `found:true`, so the coverage CLI result is correctly classifying resolver infrastructure failure.

## Checks run

- `node -c scripts/admin/preview.js`
- `node -c scripts/checks/admin-suite-coverage.js`
- `node -c scripts/admin/seed.js`
- Manual repro bundle for findings 1, 3, 4, and 5.
- `node scripts/checks/admin-suite-coverage.js --json` - exited 1 with `resolver_error` findings under this sandbox, as intended for finding 6.
- `node scripts/dispatch-skill.js --resolve --skill admin:preview --json` - passed with `found:true`.
- `node scripts/paths/build.js --check` - passed.
- `tests/regression/SP-20260614-002/*.test.js` - 9/11 passed in this sandbox. The two failures were nested-subprocess harness failures:
  - `admin-suite-coverage.test.js` live CLI spawn returned null status.
  - `pathkey-roundtrip.test.js` nested `build.js --check` spawn returned null status.
  Direct top-level equivalents for both commands passed or produced the expected `resolver_error` classification.

## Final

VERDICT=PASS FIXED=6/6 REMAINING_BLOCKERS=0
