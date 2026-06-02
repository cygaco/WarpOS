# Sprint spec — #2 Shared repo-role resolver (ED-009)

- **Worktree:** `C:/Users/Vlad/Desktop/Claude/Projects/warpos-wt-repo-role-resolver`
- **Branch:** `warp/s-repo-role-resolver`
- **Risk:** medium (shared seam; additive resolver + behavior-preserving guard refactor)
- **Role served:** BOTH (engine-for-MC + dev-tool-downstream). Unblocks #3 and #1.
- **Close:** engine sprint → ff-merge to main, defer retro to milestone close, HALT before push.

## Objective
Create ONE canonical-vs-consumer **repo-role resolver** that every guard consults, instead of each guard re-deriving the role from path heuristics independently. Role becomes a first-class execution-context input, not "path vibes."

## Why (grounding)
ROADMAP §"Root-cause deepening" → `[open] Shared repo-role resolver` (ED-009). Today framework-purity (G3.3), the requirements-gate fix (`0d85bca`), and the append-only guard each detect canonical-vs-consumer role independently → drift + a recurring false-green class. This is the structural prerequisite the Director flagged for #1 (keystone) and #3 (typed success).

## Acceptance criteria
1. A single resolver module (suggested `scripts/lib/repo-role.js`, or co-locate under `scripts/warpos/` next to `lifecycle-stage.js` — follow existing convention) exports a pure `resolveRepoRole()` returning `'canonical' | 'consumer' | 'unknown'` with a **documented deterministic precedence**: explicit marker/manifest signal > env override (e.g. `WARPOS_REPO_ROLE`) > structural heuristic. Mirror the resolver pattern already used by `scripts/warpos/lifecycle-stage.js` (env → file → default).
2. **≥3 existing guards refactored** to consume the resolver with **no behavior change**: `framework-purity` (G3.3 role detection), the requirements-gate role check, and the append-only guard. Grep the codebase for independent role-derivation (`CLAUDE_PROJECT_DIR` path-prefix checks, `_warpos/MANIFEST.json` presence checks, `00-canonical` heuristics) and route them through the resolver.
3. **No guard re-derives role independently** after this sprint (a grep-based check, ideally wired as a scan, proves it).
4. Unit tests cover: canonical repo, consumer repo, ambiguous/unknown, and env override precedence. Behavior-preserving regression: the refactored guards produce identical verdicts on canonical (this repo) as before.
5. Honor CLAUDE.md Refactor & Rename Hygiene: grep ALL call sites; subagents can't read env, so the resolver must accept an explicit override arg the orchestrator passes down (LRN-2026-05-30).

## Out of scope
Typed success semantics (#3) and the consumer-contract gate (#1) — they CONSUME this resolver in later waves.
