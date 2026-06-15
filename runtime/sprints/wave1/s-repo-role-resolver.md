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

## Completion — DONE 2026-06-15 (session/2026-06-15, gauntlet-GREEN)
All 5 ACs satisfied. The resolver (`scripts/warpos/repo-role.js` → `resolveRepoRole`) + its `repo-role-single-source.js` enforcer + a regression test were ALREADY built earlier (`e0716a4a` / `35855d6f`) with the framework guards (framework-purity G3.3, requirements-gate, append-only) already adopted — so this session completed the **adoption tail**, not a from-scratch build:
- **AC-1/4/5 (pre-built):** `resolveRepoRole()` returns canonical/consumer/unknown with documented precedence (override > env > signals > consumer > unknown); accepts an explicit override arg (subagent-safe, LRN-2026-05-30); unit tests cover all roles + env precedence.
- **AC-2 (completed this session):** repointed the remaining inline derivers — the **admin:* guards** (`preview.js`/`seed.js` `refuseIfTargetIsWarpOS`) and **`bootstrap.js#detectMode`** — onto the resolver. Grew the resolver an **env-immune `isCanonicalDir()`** (signals-only, ignores `WARPOS_REPO_ROLE`) so the admin safety floor routes through the single source WITHOUT the env-spoof hole that had justified hand-rolled detection (xprovider HIGH #5).
- **AC-3 (completed this session):** `repo-role-single-source.js` enforcer wired into `/scan:full` — **REPORT-ONLY** (a GPT-5.5 cross-family review caught that a blocking-flip would be false-green: the dir-allowlist masked `bootstrap.js`'s live detector + the regex is line-local; fixed bootstrap adoption + hardened regex for optional-chaining; ramp-to-blocking = **ED-054**).
- **Bonus:** fixed a latent admin **over-refusal** — the old bare-`warpos:`-presence rule would have refused every scaffolded consumer (each carries a `warpos:` block, `scaffold-core.js:542`); now only real canonical signals refuse (β DECIDE 0.88).

Tests: repo-role 82/82, bootstrap 47/0, admin suite 11/11, enforcer 0 violations. Cross-family gauntlet **FAIL→PASS** (`runtime/sp-ed009/xreview.md` + `xreview2.md`). Engine-sprint close: ff-merge to `main`, retro deferred to milestone close (RI-001). ED-009 → resolved.
