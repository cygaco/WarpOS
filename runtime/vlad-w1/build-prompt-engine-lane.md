# BUILD — S-VLADW1-01 ENGINE lane (backend)

You are the **backend-builder** for the Vlad Wave-1 ENGINE sprint. Build ONE unit: the engine lane.

## WHERE YOU WORK — read carefully, this is a cross-repo build

- **Isolation worktree (this is your ONLY working directory):**
  `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch (already created, already checked out there):** `wt/S-VLADW1-01-engine`
- **Your tree:** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane\engine\`
- **Do NOT touch the canonical checkout** at `C:\Users\Vlad\Desktop\Claude\Projects\vlad` — that is the
  canonical tree and edits there are refused by policy. Work only inside the worktree above.
- **Do NOT modify anything outside `engine/`** within the worktree. The repo root is a **dormant
  Next.js/Supabase scaffold** that is not the product. Never add to it, never import from it, and
  never let `next`, `react`, `react-dom` or `@supabase/*` enter `engine/`'s dependency graph.
- `engine/package.json` **already exists** in the worktree — it is the conductor-owned integration
  seam. You may add dependencies to it (see the policy below); do not restructure it.

## SPEC — read these, they are authoritative and detailed

Read in full before writing code:

1. `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\acceptance-criteria.md`
   — the binding criteria. **Start with decision D-1 at the top** (the four-tool surface) and the
   **SHIPPED-TREE BOUNDARY** block at S-8.
2. `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\granular-stories.md`
   — stories S-1 … S-14.
3. `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\prd.md`
   — **note the PLAN-TIME HISTORY banner**: the "Original Request" block quotes a superseded ToS
   reading. It is history. Do not build to it.

## YOUR SCOPE (the engine lane)

- **S-2** MCP stdio server exposing **exactly four** tools: `get_status`, `get_readiness`, `run_job`,
  `cancel_job`. Any other tool name (`send_message`, `approve_job`, `get_roadmap`) is an explicit
  stable refusal that creates no job and no journal entry.
- **S-3** Job state machine. Transition table enumerates `running`, `needs_input`, `proposing`,
  `done`. **AC-3.6 is load-bearing: no registered Wave-1 job kind may ENTER `needs_input` or
  `proposing`** — their exits (`send_message`, `approve_job`) are Wave-2, so entry would strand the
  job. Cancellation is truthful: `cancellation-requested` → `cancelled` only after the worker
  acknowledges or terminates; never report `cancelled` while it is pending; repeat cancels are
  idempotent.
- **S-4/S-5** On-disk journal checkpointed at every transition; crash-survivable (kill mid-job leaves
  the target repo clean); `get_status` names an interrupted job and offers resume or discard, and
  never infers success from mere completion.
- **S-6** Receipt = versioned envelope, `schema_version` + **three named slots**, interior treated as
  **opaque**. Journalled, returned and logged; **never validated, never branched on**. Ship a test
  that puts arbitrary values in each slot and asserts they round-trip unchanged.
- **S-10/S-11** Permission-level config port. The **ONE genuinely enforced refusal**: under the
  planning/read-only level, `run_job` is refused **before a job is created**; `get_status`,
  `get_readiness` and `cancel_job` stay available. Invalid config value fails validation **before**
  serving MCP.
- **S-13** Host-free driver exercising all four tools over real stdin/stdout with no MCP host, no
  agent face, no installer, no credentials.

## NOT YOUR SCOPE — another lane owns these, do not build them

The **model-access seam** (`describeAuth()`), the **audited spawn wrapper**, the **audited output
module**, the **seven ED-340 custody enforcers**, the **quota three-bucket classifier**, and the
**branding guard**. If you need any of them, define the **consumption interface** and leave a clearly
marked `TODO(security-lane)` stub — do not implement them, and do not reach around them.

All writes must go through the audited output module once it exists; for now, funnel every
product-written output through a single module in your tree so it can be repointed later. Do not call
`child_process` directly anywhere.

## DEPENDENCY POLICY — BINDING, and it is a security property

`engine/package.json` carries `vladDependencyPolicy`. Read it. Near-zero-dependency is the **only
mitigation** for ADR-0041's **A1 residual** (dependency surface), which is the largest residual on the
credential-custody control — any package in the tree can read `process.env` and reach the network.

**Every dependency you add requires a written justification against A1, in the same commit that adds
it.** Add `@anthropic-ai/claude-agent-sdk` yourself, pinned to a version you have **verified is
actually published** — do not invent a version number. If you cannot verify it, say so in your return
and leave it undeclared rather than guessing.

## TESTS

Runner is the built-in **`node --test`** (zero added dev-dependencies — a test framework would be
dependency surface bought for convenience). Tests live in `engine/test/`. The acceptance criteria name
exact files and test names in `verified_by:` lines — **use those paths and names**, they are the
ship-gate's contract.

## HOW TO REPORT

Return a concise envelope: what you built, which ACs you believe are satisfied, which are NOT, every
dependency added with its A1 justification, and anything you could not verify. **Do not claim an AC is
satisfied if you did not run its test.** An honest "built but untested" is worth far more to me than a
confident overstatement — I will verify against the worktree either way, and a false claim costs a
full gauntlet round to unwind.
