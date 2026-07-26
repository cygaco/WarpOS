# masterconsole Plan — headless agent runner for the step-driven bootstrap pipeline

> **For:** this repo (masterconsole product layer — `server/`, `src/`).
> **Companion:** `WARPOS-PROMPT.md` (the framework changes this consumes).
> **Status:** GATED — do not execute until the WarpOS contract has landed (see Dependency Gate).
> **Created:** 2026-06-06.

## Why this exists

The Create flow dies at canon because `server/bootstrap-actions.ts` runs the whole bootstrap chain
in one `execFile`, and when the orchestrator hits its first LLM phase it exits code 3
(`needs_orchestration`). The server marks the job `blocked`, prints "Your project plan is ready,"
and hands the operator a `/portfolio:spinup <slug> --resume` string to run in their own session
(`runSpinup`, lines ~444–484). **There is no in-loop agent on the server to actually do the canon
synthesis — it punts to the user.** That punt is the "process ends."

WarpOS's job (separate prompt) is to make each phase an independently-dispatchable step that emits a
clean `--json` status with a machine-readable `orchestration_prompt`. **Our job is the runner that
consumes that contract:** drive the orchestrator step-by-step and, at each LLM step, spawn an agent
turn to fulfill the synthesis in-flow instead of punting.

## Dependency Gate — DO NOT START until WarpOS ships ALL of:

1. `spinup-orchestrate.js` accepts `--phase setup|canon|roadmap|paint` (renamed from
   `preflight|intent|canon|roadmap|onscreen`) and runs exactly one phase per invocation.
2. A stable `--json` status shape: `{ phase, status (ok|needs_orchestration|failed), ran[],
   orchestration_prompt, data{serveUrl,firstAction,roadmapPath} }`.
3. `--research off` (and any degrade alias/skip) is **rejected** by the engine; canon is fail-closed
   against thin/placeholder output.
4. Milestone→Epic rename is live in `roadmap:create` / `ROADMAP.md`.
5. `portfolio:new` reconciled to the `setup` step (so our `runJob` scaffold call still works).

Verify with: `node scripts/bootstrap/spinup-orchestrate.js --phase canon --repo-root <tmp> --json`
returns a parseable status object with an `orchestration_prompt`, and
`node scripts/bootstrap/spinup-orchestrate.js --research off` exits non-zero.

## Work items

### 1. Headless agent runner (the core change)
In `server/bootstrap-actions.ts`, replace the single whole-chain `runSpinup` exec with a
**step loop**:

- For each step in `[setup, canon, roadmap, paint]`:
  - `execNodeResult(spinup-orchestrate.js, ["--phase", step, "--repo-root", repoPath, "--json", ...resume])`.
  - Parse the `--json` status (reuse `parseSpinupJson`).
  - If `status === "ok"` → mark the phase complete, advance the progress bar, continue.
  - If `status === "needs_orchestration"` → **spawn an agent turn** (`claude -p` / agent SDK) with
    the returned `orchestration_prompt` and `cwd = repoPath`, let it write the canonical/roadmap/
    paint artifacts, then re-invoke the SAME step with `--resume` and confirm it now returns `ok`
    (the engine's fail-closed gate is the proof the synthesis was real, not dumb).
  - If `status === "failed"` → mark failed, surface `stderr`/message, stop.
- `setup` is deterministic and never needs an agent — it should complete in one exec.

Decisions to make at build time:
- **Agent transport:** `claude -p "<prompt>" --output-format json` headless vs the Agent SDK. Pick
  whichever the cockpit already has wired for other agent calls; keep it `shell: false`,
  `windowsHide: true`, generous timeout (canon/roadmap synthesis is minutes, not seconds).
- **Concurrency/locking:** one runner per job; guard against a second POST re-running an in-flight
  job (the `jobs` Map already keys by id — add an `in-flight` guard).

### 2. Align the server phase model
Update `makePhases`, `phasePercents`, and `applySpinupProgress` to the 4-step model:
`setup / canon / roadmap / paint`. Collapse the current `validate/scaffold/seed/preflight/intent/
onscreen` bars — `setup` absorbs the deterministic ones (validate + scaffold + seed + preflight).
Keep the percent ramp monotonic. Update `src/types.ts` `BootstrapPhase` ids accordingly and the FE
labels that render them.

### 3. Thread `--where` / platforms through
The server already collects + validates `platforms[]` (`validateInput`, `parsePlatforms`,
`PROJECT_PLATFORMS`). Pass it to the orchestrator as `--where <platform>` (the canonical target;
if multiple, pass the primary and keep the full list in `intent.md` as today — `seedIntent` already
writes `## Platforms`). Confirm `seedIntent` still writes raw intake to `_docs/bootstrap/intent.md`
only (raw → intent, never canon).

### 4. Server-side runner test
Add to `server/bootstrap-actions.test.ts` (or a new `bootstrap-runner.test.ts`): a step returning
`needs_orchestration` triggers an agent turn + the `--resume` re-check (mock the agent + the
orchestrator), and the job reaches `complete` with NO `nextCommand` punt on the happy path.
`nextCommand` remains only as a genuine manual-recovery fallback when the runner itself errors.

### 5. Resolve the dangling `/portfolio:plan` reference
`defaultCommonCommands` (line ~377) returns `/portfolio:plan ${slug}`, but no `portfolio:plan`
skill exists. Either repoint it to an existing skill (`/portfolio:open` or `/portfolio:status`) or,
if a real plan view is wanted, request the skill from WarpOS via `/warp:flag`. Do not ship a button
that maps to a non-existent command.

## Acceptance (ours)

- Clicking **Create** in the cockpit reaches a served first paint with **no operator hand-off** —
  the runner fulfills canon, roadmap, and paint in-flow.
- The progress bar advances through `setup → canon → roadmap → paint` with live status; a real
  failure surfaces a clear message, not a silent stall.
- No degraded canon ever ships (guaranteed engine-side; our runner just never bypasses the gate —
  it always re-checks `--resume` returns `ok`).
- `nextCommand` is absent on the happy path; present only on genuine runner error.
- Runner test + phase-model test green; full `server/` suite green.

## Sequencing note

This plan is safe to draft now but must be **executed after** `WARPOS-PROMPT.md` lands and this repo
has pulled the updated framework (`/warp:update`). Re-run the Dependency Gate verification before
starting work item 1.
