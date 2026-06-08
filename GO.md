# GO — WarpOS Dispatch-Shape Reliability Plan — execution entry point

> Written 2026-06-08 at the end of a **planning-only** session. On a fresh session on this branch, when the operator says **"go"**, EXECUTE the plan starting at **Phase 0**. (Mode-init ≠ authorization; the operator's "go" THIS session is the authorization. Do not skip Phase 0.)

## What this is (one line)
The **WarpOS dispatch-shape reliability system**: the best dispatch shape for every skill + agent, made safe and self-detecting — agent-system org cleanup + dispatch integrity (N-1/N-2/N-3) + tool-use reliability + skill-execution-routing + a machine-readable **dispatch-contract keystone** + Launch Console + full-scope-phased GPT-Pro library, all gated by a Phase-0 isolated dry-run.

## The full plan
**`runtime/agent-system-plan/PLAN.md`** (§0–§17). Read it before executing. §17 is the FINAL SYNTHESIS and supersedes earlier sections where they differ.

## Build order (PLAN §17.2 — the corrected hard-dependency sequence)
0. **PHASE 0** (PLAN §14 + §17.6): per-item feasibility probe · correct-tool blast-radius re-confirm · **isolated end-to-end dry-run in a sealed clone that INCLUDES untracked files** · **live bounded auth probe** (not env-var presence) · budget reservation · verify-the-gate-with-a-planted-violation. Fail-closed.
1. **Safety kernel** — safe spawn (PLAN §17.3: prefer `node.exe <ABS cli.js>` over `cmd.exe /c`; trusted-tool-ID→`realpath` under approved roots; reject model-supplied exe paths; drain-to-file BEFORE redact; `taskkill /T /F` tree-kill + grandchild-kill fixture; pin patched Node, CVE-2024-27980) + **N-3 auth-resolver** (in-code dotenv — NO shell `xargs`; keyfile→env→.env.local→.env→~/.gemini/.env→OAuth; verify-works-not-just-present; BOM-safe writes).
2. **Sealed fixture harness** + planted-violation convention (PLAN §12 P5).
3. **THE DISPATCH-CONTRACT KEYSTONE** (PLAN §17.1) + the **N-1 run ledger** (strengthened record schema §17.4). Build this EARLY — every dispatcher + gate + Launch Console reads it.
4. **Consolidate the ONE dispatch-guide** (S-2) + repoint CLAUDE.md (add `## Dispatch` + `## Tool Use`; propagate downstream §10.3). Non-destructive.
5. **File-usage trace (S-8) BEFORE any delete/rename.**
6. **Coverage gate** (N-1) + **duplicate-doc-drift enforcer** (S-6) + `tool-use-guard` + `scan:tools`.
7. **THEN** (only now): role renames (S-7), Dispatch-Console GUI refresh (S-9), skill-execution-routing (§13 + earn-it ladder §13.6/§13.7 + benchmark pack §17.5), Launch Console (own epic), GPT-Pro library (full scope, phased).

## Locked decisions
- GPT-Pro library: **full scope, phased** (high-risk release gates first).
- Renames (LOCKED): `learner`→**ops-analyst** @ President's office; `stub-scaffold`→**skeleton-builder** @ engineering; `consult`/`advisor`→**cabinet** @ President's office.
- **DEFER** `president/.system` de-dot (too load-bearing: oneshot store, decision-policy, 10 ADRs, beta model).
- **DEFER** AppContainer/egress + GUI refresh + broad renames behind the safety kernel.
- Agent-system cleanup is the TOP theme — but its **destructive** parts (renames/deletes) wait for the safety kernel + contract + file-usage trace.

## Key artifacts
- **PLAN.md** — `runtime/agent-system-plan/PLAN.md` (full plan §0–§17)
- **Deep research** — `runtime/research/dispatch-subprocess-safety/openai-report.md` (o3, 221KB) → synthesized into PLAN §16
- **GPT-5.5 reviews** — `runtime/agent-system-plan/gpt55-consult-output.json` (draft) + `gpt55-final-review-output.json` (final → PLAN §17)
- **Epic tracker** — `trackers/epics/E-SYSTEM-ORG-001-agent-system-org-cleanup.md`
- **Enforcement debt** — ED-033 (tool-use + isolated-testing) in `.claude/project/memory/enforcement-debt.jsonl`
- **Safe key updater** — `runtime/agent-system-plan/sync-openai-key.js` (pattern for N-3 BOM-safe key writes; promote to `scripts/` when N-3 ships)
- **Tool-reliability fixture** — `runtime/agent-system-plan/tooltest/` (seed for `scan:tools`)
- **GPT Pro suggestions** — `gptpro-suggestions.md` (the launch-readiness library review → the Launch Console + GPT-Pro epic)

## Hard cautions
- **DO NOT** touch `_guides`/`_knowledge` security/compliance domains — the launch-readiness library lives on branch `launch-readiness-guides`; pull it first if needed.
- **DO NOT** run destructive renames/deletes before the safety kernel + file-usage trace exist (PLAN §17.2).
- **Grep tool:** NEVER a leading-dir or brace `glob` paired with a separate `path` (silent false-negative — PLAN §11). Before EVERY Edit, copy `old_string` from a fresh Read of the current file.
- **Env keys:** the real OpenAI key is synced into `.env.local` (from `Desktop/openai.txt`); the auth-resolver must check keyfile→env→.env.local→.env→~/.gemini/.env→OAuth AND verify-it-works (PLAN N-3). `.env.local` is gitignored — never commit it.

## The 17 planning principles
PLAN §15 (operator's personal tracking).
