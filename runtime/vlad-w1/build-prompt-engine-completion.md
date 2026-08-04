# COMPLETION BUILD — S-VLADW1-01 ENGINE lane (continuation, NOT a rebuild)

You are the **backend-builder** completing an engine lane that a previous run left **partly built**.
A prior builder was killed by a 9-minute clamp **after** writing ~22KB of good code. That code is
**committed and is your baseline**. Your job is the remaining gap, nothing more.

**Do NOT rewrite, refactor, restructure or "improve" the landed modules.** Re-deriving them wastes the
window that killed the last run and risks drifting from work that is already correct. If you believe a
landed module is genuinely wrong, **report it — do not silently change it.**

## WHERE YOU WORK

- **Worktree (your ONLY directory):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine` — baseline commit `1acba68`
- **Your tree:** `<worktree>\engine\`
- Never touch the canonical checkout, and never touch the dormant repo-root Next.js/Supabase scaffold.

## CONTRACT LINE — CITE SOURCE, NEVER A SUMMARY

Every claim about a file must be grounded in the file **as you read it**, cited `path:line` in your
return — not in this brief, the acceptance criteria, or a tracker, **including where they agree**.
This is a contract term: on this sprint, source-reading has corrected the recorded record seven times,
twice in ways that would have shipped wrong behaviour to users. **This applies to the landed code
too** — read it before you build against it. If something here doesn't match what you find, stop and
report the mismatch.

---

## WHAT IS ALREADY BUILT (read these first — described as READ, at `engine/src/`)

All ES modules (`"type": "module"`). Internal imports all resolve; no dangling references between them.

- **`state-machine.js`** — `STATES` covers the four plan-contract states plus operational ones
  (`queued`, `cancellation-requested`, `cancelled`). Exports `PLAN_CONTRACT_STATES`,
  `TERMINAL_STATES`, `isTerminal()`, and **`WAVE1_FORBIDDEN_ENTRY_STATES`** — the AC-3.6 guard.
  `cancellation-requested` is reachable from every non-terminal state.
- **`job-kinds.js`** — a job-kind registry. Each kind declares `readOnly` and
  `capabilities: { needsInput, proposing }`; the two fixtures (`fixture-readonly`,
  `fixture-cancellable`) declare both capabilities `false`, which is what makes AC-3.6 true **by
  construction**. Defines the worker contract: `ctx.isCancelled()`, and a return of
  `{ cancelled: true }` after acknowledging cancellation — **the only thing that moves a job from
  `cancellation-requested` to `cancelled`** (AC-3.2's "only after worker acknowledgement").
- **`receipt.js`** — `RECEIPT_SCHEMA_VERSION = 1`, `RECEIPT_SLOT_NAMES = ["slot_a","slot_b","slot_c"]`,
  `buildReceipt()`, `isWellFormedReceiptEnvelope()` (shape-only, deliberately).
- **`permission.js`** — `PERMISSION_LEVELS` = the four ported values; `READ_ONLY_LEVEL = "never"`;
  `isRunJobPermitted()`; `loadPermissionConfig()` which **throws synchronously** on an invalid value.
- **`journal.js`**, **`output-shim.js`**, **`spawn-shim.js`**, **`hash.js`**, **`ids.js`** — journal
  writer and the seam shims. **The shims are the custody lane's territory** — consume them, do not
  implement them.

---

## YOUR GAP — build exactly this

### 1. MCP stdio server + the four tools (S-2) — the largest missing piece
`engine/src/server-entry.js` is **referenced by `permission.js` but does not exist**. Build it.
- Exposes **exactly four** tools: `get_status`, `get_readiness`, `run_job`, `cancel_job`.
- `send_message`, `approve_job`, `get_roadmap` and any unknown tool → a **stable unsupported-tool
  error that creates no job and no journal entry** (AC-2.2).
- `run_job` refuses an unknown or non-read-only job kind **before creating a job** (AC-2.3).
- It **MUST call `loadPermissionConfig()` before serving**, so an invalid level fails startup
  (AC-10.1), and must refuse `run_job` at `READ_ONLY_LEVEL` **before a job is created** while leaving
  `get_status` / `get_readiness` / `cancel_job` available (AC-11.1, AC-11.2).
- `get_status` reports lifecycle state, timestamps and terminal outcome, **never inferring success
  from mere completion**; names an interrupted job with resume/discard (AC-5.1, AC-5.2); and reports
  cancellation as **pending**, never falsely as `cancelled` (AC-3.3).

### 2. Host-free driver (S-13) — `engine/driver/` exists but is EMPTY
Exercises all four tools over **real stdin/stdout**, with no MCP host, no agent face, no installer and
no credentials. This is what makes the surface testable at all.

### 3. Tests — `engine/test/` exists but is EMPTY
Runner is built-in **`node --test`** (zero added dev-dependencies). **Use the exact file and test
names from the `verified_by:` lines** in
`C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\acceptance-criteria.md`
— they are the ship-gate's contract. Prioritise: AC-2.1/2.2 (surface), AC-3.6 (no Wave-1 job kind can
enter `needs_input`/`proposing`), AC-3.2/3.3 (truthful cancellation), AC-6.2 (receipt interior
round-trips unchanged and is never branched on), AC-11.1/11.2 (the one enforced refusal).

### 4. The SDK dependency + its A1 justification
`engine/package.json` still has `dependencies: {}`. Add `@anthropic-ai/claude-agent-sdk` **pinned to a
version you have verified is actually published** — do not invent one; if you cannot verify it, leave
it undeclared and **say so**. Per `vladDependencyPolicy`, every dependency needs a written
justification against ADR-0041's **A1** residual in the same commit.

### 5. `engine/port-references.json` — referenced by `permission.js`, does not exist
Create it: per ported file, `{ source_path, source_line, source_content_hash }`, so the port claim is
**re-executable** rather than a one-time assertion.

---

## TWO THINGS TO REPORT ON, NOT SILENTLY DECIDE

These are judgment calls above a builder. **Flag them in your return; do not just pick.**

1. **`DEFAULT_PERMISSION_LEVEL` is `"auto"`, which permits `run_job`.** The epic's scope says
   **"propose-only default"**. Wave-1 jobs are read-only so the immediate risk is low, but this
   default sets the posture Wave-2 inherits when *write* jobs land. Is `auto` the right default for a
   tool pointed at a founder's repository?
2. **`never` has been repurposed.** In the port source (`scripts/turbo/permission-profile.js`) `never`
   means a **hard ceiling** — "never permitted under any framing" — not a user-selectable level. Vlad
   now uses it as the user-facing read-only level. That may be fine, but it is a **meaning change
   behind a kept name**, which is the exact silent-redefinition class this sprint has been catching.
   Report it; a reviewer should rule.

## HOW TO REPORT

Return: what you built; which ACs you **ran tests for** and their results; the two items above; the
dependency decision with its A1 justification; every `path:line` you relied on; and anything you could
not verify. **Never claim an AC is satisfied without running its test** — an honest "built, untested"
is far more useful than a confident overstatement, because I verify against the worktree regardless
and a false claim costs a full gauntlet round.

**Scope discipline:** if you are running short on time, land the **MCP server and its tests first** —
that is the load-bearing gap. Report what you did not reach rather than rushing all five.
