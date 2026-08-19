# INTERFACE SHEET — Vlad engine custody surfaces (ε-verified)

**Status: this sheet IS the verified read.** Every fact below was read at source by Alex ε across the
chunk-1b and chunk-2 cycles, with `path:line` given. It exists so a builder does **not** have to spend
its window re-reading what has already been read — read-donation clamped a full dispatch (`c2`,
540363ms, zero files).

**Paths are relative to** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine\`
unless marked WarpOS-side.

> **THE CONTRACT STILL BINDS.** This sheet lowers the read burden; it does **not** license skipping
> verification. If anything you touch **contradicts this sheet, STOP AND REPORT the mismatch** — do not
> build to either version. A sheet that has drifted is more dangerous than no sheet, and the whole
> sprint's evidence is that recorded facts drift (source-reading has corrected the record eight times
> here, twice preventing wrong behaviour shipping to users).

---

## 1. `src/model-seam.js` — the auth seam. Your INPUT.

**`describeAuth(opts?) → { mode, secretShapes, envDenylist, sentinelHook }`** — `src/model-seam.js:120`.
`opts.authMode` exists **for controlled tests only**; production resolves from `VLAD_AUTH_MODE` or the
default.

- **`SECRET_SHAPES`** — `src/model-seam.js:57-70`. A **frozen module constant** with **two** entries:
  - `{ class: "api-key", mode: "api-key", envVar: "ANTHROPIC_API_KEY", patternSource: "^sk-ant-(?!oat)" }`
  - `{ class: "oauth-session", mode: "subscription", envVar: "CLAUDE_CODE_OAUTH_TOKEN", patternSource: "^sk-ant-oat" }`
- **CRITICAL — `describeAuth()` returns `secretShapes` UNFILTERED by mode** (`:124`). Each entry carries
  a `mode` field, but the **array is not filtered by the live mode**. It is the **UNION**, always.
  - This is ADR-0041 **Amendment 1**: P1's scan target must **never** be derived from which mode is
    live. A stale live-mode value would silently narrow the scan and pass GREEN, and both secrets can
    be present at once because the fallback seam is engineered and ready.
  - The invariant is **enforced and mutant-verified** — `test/seam-boundary.test.js` asserts
    `secretShapes`/`envDenylist` are identical across both modes; filtering by mode turns it RED
    (commit `70fed0d`).
  - **So consuming `describeAuth().secretShapes` is CORRECT and is the intended single source.** Do not
    hardcode a duplicate list. **Do not filter by `.mode`.**
- **`ENV_DENYLIST`** — `src/model-seam.js:75`. Derived as `SECRET_SHAPES.map(s => s.envVar)` — one list,
  in sync by construction. Currently `["ANTHROPIC_API_KEY", "CLAUDE_CODE_OAUTH_TOKEN"]`.
- **`sentinelHook(envObject) → { leaked, keys }`** — `src/model-seam.js:86`. Reports only **key names**
  present, never values. It is the sentinel, not a leak channel.
- **`AUTH_MODES`** — `:40`, frozen `{ SUBSCRIPTION: "subscription", API_KEY: "api-key" }`.
- **`resolveAuthMode`** — `:102`. An unrecognized mode **THROWS** (fails closed), never defaults.
- `AUTH_MODE_ENV_VAR = "VLAD_AUTH_MODE"` — `:51`. A reference to this name **outside** the seam counts
  as a mode-literal violation (AC-1.3).

## 2. `src/spawn-shim.js` — the audited wrapper. P2's sole sanctioned exception.

**`auditedSpawn(command, args, opts)`** — `src/spawn-shim.js:43`. Two refusals, both `throw`:
- **`:45`** — `opts.env` is **REQUIRED and explicit**; ambient `process.env` is never inherited.
- **`:56`** — refuses when the supplied env carries any **denylisted** var.

This is the **runtime** half. P2 is the **static** equivalent.

## 3. `src/output-shim.js` — the writer registry. P1's surface source.

- `registerWriter(writerId, { root, kind })` — `:62`; throws without an explicit `root` (`:64`).
- `write(writerId, relativePath, content)` — the canonical write path; refuses an **unregistered**
  writer and refuses a path **escaping** the writer's root (`:78`, `:58`).
- `listRegisteredWriters()` — `:73`.
- `UnregisteredWriterError` — `:45`, `code: "unregistered-writer"`.
- Built-in `"stderr-log"` writer is itself registered (`:22`).
- Path-logging discipline ported from WarpOS `scripts/portfolio/registry.js:180-187` ("path_offset:
  path relative to homedir — never log absolute paths"). **Preserve it.**
- **Not yet done, and not your chunk unless told:** wiring `journal.js` / `receipt.js` onto this
  registry (`:14-17`).

## 4. ADR-0041 clauses P1 and P2 must satisfy

Canonical: WarpOS-side
`.claude/agents/president/_system/policy/adr/0041-credential-custody-prove-assert-boundary.md`.

- **P1 — `engine/scripts/checks/no-held-secret-in-surface.js`.** No held-secret-shaped value in the
  scanned surface: committed files, log-writing call sites, telemetry payload builders. Scans the
  **UNION** of every seam secret class **unconditionally**. Unrecognized seam value → **fails closed**.
  *Proof scope: absence at the scan's precision over the surface enumerated — not absence in general.*
- **P2 — `engine/scripts/checks/spawn-env-allowlist.js`.** **Two halves, both required:**
  - **(a)** every audited spawn passes an explicit allowlist env excluding the held secret;
  - **(b)** any raw `spawn`/`exec`/`fork` **outside** the audited wrapper is a **REFUSAL, not a
    warning**. A scrubbing wrapper alone is a convention, not a control — it re-opens the defect the
    moment one caller goes around it.
  - Also bans **dynamic `require`/`import` with a computed specifier**: without it the import-graph
    rule is **bypassable by construction**.
- **Fail-closed, both:** a **parse error in any scanned file is RED, never a skip**; runner error,
  timeout or malformed output → **non-zero**. Never green on crash.
- **SHIPPED-TREE BOUNDARY:** the scanned artifact is the **engine package** (`engine/`), **not the repo
  root**. The root holds ~2280 files of dormant Next/Supabase scaffold. A root walk would report a
  large green surface while proving nothing about the code that handles the secret — **a wide scan of
  the wrong tree is weaker than a narrow scan of the right one, and reads stronger.**

## 5. Mandatory NEGATIVE plants (the mutant standard)

An enforcer with no observed red state is enforcement debt wearing a green badge. Each scanner test
carries its own plant, asserted to trip it:

| Plant | Trips |
|---|---|
| a seam-shaped secret value in a scanned file | P1 |
| a raw `child_process` call outside the wrapper | P2 half (b) |
| a dynamic import with a computed specifier | P2 |
| an unparseable file in the scan surface | both (RED, not skip) |

Fixtures live under `test/fixtures/` and the scanner is pointed at them **explicitly**, so plants never
pollute the shipped surface.

## 6. Environment facts

- Test runner: built-in **`node --test`**, files `engine/test/*.test.js`, invoked by `npm test`
  (`package.json:11`, glob form — the bare `test/` directory form fails `MODULE_NOT_FOUND` on this Node).
- ESM throughout (`"type": "module"`).
- **`npm install` is DONE** — `@anthropic-ai/claude-agent-sdk@0.3.221`, 109 transitive packages.
  **Never run a package manager.**
- Baseline at time of writing: **35/35 pass, exit 0.** Do not break them; report a red rather than
  editing the test.
