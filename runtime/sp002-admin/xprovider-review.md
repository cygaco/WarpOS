# Cross-provider review - SP-20260614-002 admin:* dev-tooling suite

Verdict: FAIL

AC-R4c routing-file gate: not blessed for shipment. The current
`framework/admin-panel-registry.json` rows are structurally sane and static, but
the suite has load-bearing correctness and enforcement failures around readiness,
dev-server lifecycle, seed target refusal, and the fail-closed coverage gate.

## Findings

1. BLOCKER - `scripts/admin/preview.js:49-51`, `scripts/admin/preview.js:107-112`, `scripts/admin/preview.js:253-260`

   `detectReady()` declares readiness when the accumulated buffer contains either
   `- Local:` or `compiled` plus any localhost URL. In real Next boot output,
   `- Local: http://localhost:<port>` is printed before the final `Ready in ...`
   line, so the poll loop can resolve and open the browser before a real ready
   line. A compiled line plus an unrelated localhost URL also returns ready.

   Concrete reproduction:

   ```js
   const p = require("./scripts/admin/preview");
   p.detectReady("> next dev\n - Local: http://localhost:4123\n");
   // => { ready: true, port: 4123 }
   ```

   Fix: make detection line/state based. Parse the port from `- Local:` or
   `started server on`, but require an explicit readiness signal such as
   `Ready in`, `ready on`, or `started server on` before returning ready. Remove
   `compiled` as a readiness token. Add a regression where Local-only and
   compiled-only buffers do not open.

2. BLOCKER - `scripts/admin/preview.js:206-209`, `scripts/admin/preview.js:223-225`, `scripts/admin/preview.js:267`, `scripts/admin/preview.js:348-355`

   The dev-server lifecycle does not satisfy "kills it on timeout/exit; never
   orphan." On Windows the child is spawned with `shell: true`, so `child.kill()`
   can kill only the shell wrapper rather than the `npm`/Next process tree. After
   success, only `SIGINT` is handled; there is no cleanup for `SIGTERM`, `SIGHUP`,
   `uncaughtException`, or process `exit`. Programmatic callers also receive the
   live child and can exit without any registered tree cleanup outside SIGINT.

   Fix: centralize cleanup and use process-tree termination. On Windows call
   `taskkill /PID <pid> /T /F` for the dev child. On POSIX spawn the dev process
   in its own process group and kill `-pid`, or use the repo's safe-spawn/tree
   kill helper if one exists. Register cleanup for timeout, pointer-write failure,
   `SIGINT`, `SIGTERM`, `SIGHUP`, `uncaughtException`, and `exit`, with idempotent
   handling.

3. BLOCKER - `scripts/checks/admin-suite-coverage.js:126-153`

   The routing enforcer can false-green opener injection. It matches
   `^node\s+(\S+)` and then validates only the first token. An opener like
   `node scripts/admin/preview.js && attacker-command` would pass script
   existence checks because the trailing control text is ignored. The skill opener
   regex has the same prefix-only problem.

   Fix: parse the full opener string and anchor it. For this registry, allow only
   `node scripts/admin/preview.js` and
   `node scripts/admin/preview.js --route /admin/<known-subroute>` or a future
   explicit `/panel:*` alias form. Reject trailing tokens, shell metacharacters,
   quotes, pipes, redirects, and unrecognized flags.

4. BLOCKER - `scripts/checks/admin-suite-coverage.js:164-174`

   The WarpOS guard assertion is a token check only. A comment, dead function, or
   unused import containing `refuseIfTargetIsWarpOS` satisfies the gate even if
   `run()` scaffolds or boots before calling the guard. This directly false-greens
   one of beta's named top risks.

   Fix: make the enforcer prove call order, not token presence. The minimum static
   check should require the `run()` body to call `refuseIfTargetIsWarpOS(instanceDir)`
   before `_resolveOrScaffold`, `_ensureDeps`, `_startDevAndWaitReady`,
   `writePointer`, or `_openInBrowser`. Better: add a behavioral check with
   injected deps that points `--instance-dir` at `WARPOS_ROOT` and asserts no
   scaffold/install/dev/open/write seam is invoked.

5. HIGH - `scripts/admin/seed.js:107-122`

   `admin:seed` uses `resolveRepoRole({ root: resolved })` to classify arbitrary
   seed targets, but that resolver gives `WARPOS_REPO_ROLE` env precedence over
   target filesystem signals. A pointer to a different canonical WarpOS checkout
   can be misclassified as noncanonical when the environment says
   `WARPOS_REPO_ROLE=consumer` or `unknown`; direct equality only protects the
   current repo root.

   Fix: mirror `preview.js` target-local checks in `seed.js`: realpath/path
   identity where possible, target `.claude/manifest.json` top-level `warpos`
   block, and `project.slug === "warpos"`, without env override. Add a regression
   for a temp canonical manifest with `WARPOS_REPO_ROLE=consumer`.

6. MEDIUM - `scripts/checks/admin-suite-coverage.js:63-74`

   Resolver subprocess failures are swallowed into `found:false` with no evidence.
   In this sandbox, nested `spawnSync(process.execPath, ...)` returns `EPERM`;
   the live coverage command then reports four `skill_unresolved` findings instead
   of a fail-closed `resolver_error` with status/error/stderr. Direct top-level
   resolver invocation does find the admin command files.

   Fix: treat `res.error`, nonzero status, empty stdout, and malformed JSON as
   explicit hard findings that include `res.error.message`, `res.status`, and
   stderr. Do not collapse infrastructure failure into unresolved skills.

## Verified Passes

- `scripts/admin/preview.js` calls `refuseIfTargetIsWarpOS(instanceDir)` before
  scaffold/install/dev/open in the current implementation.
- The pointer write is atomic tmp plus rename in `preview.js`, and `rg` found no
  other admin script writing `.claude/runtime/admin-preview.json`.
- Reuse-default is implemented for an existing `package.json`; `ensureDeps()` only
  installs when `node_modules` is absent.
- `PREVIEW_URL=http://localhost:<port>/admin` is emitted on successful boot.
- `scripts/admin/seed.js` reads the pointer, fails clear when missing, writes only
  under the pointed `instanceDir`, is idempotent for its JSON/checklist artifacts,
  and uses test-only local founder identities (`founder@admin-preview.local`).
- `.claude/commands/admin/readiness.md` and `.claude/commands/admin/guides.md`
  are thin markdown delegators to `node scripts/admin/preview.js --route ...`;
  no duplicated harness logic was found there.
- `framework/admin-panel-registry.json` uses a generic `panels` map with
  `{route, opener, description}` rows. The current opener strings are static and
  point to the keystone harness, but the registry is not blessed until the
  enforcement issues above are fixed.

## Checks Run

- `node scripts/checks/admin-suite-coverage.js --json` - failed in this
  environment with four `skill_unresolved` findings caused by nested resolver
  spawn `EPERM`; direct top-level
  `node scripts/dispatch-skill.js --resolve --skill admin:preview --json`
  returned `found:true`.
- `tests/regression/SP-20260614-002/*.test.js` - 9/11 passed. The two failures
  were nested-spawn-sensitive tests (`admin-suite-coverage.test.js` live CLI
  spawn and `pathkey-roundtrip.test.js` build-check spawn) under this sandbox.
- Manual `detectReady()` probes confirmed Local-only and compiled-plus-localhost
  buffers currently return ready.
