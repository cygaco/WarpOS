<!-- requirement-format-legacy -->
# PRD — Dreamteam verified-open guard batch — W-26 + W-14 (3 closed already-fixed)

**Sprint:** `SP-20260610-008`
**Plan Contract:** `PC-20260611-0072`
**Status:** draft
**Documentation scale:** `m`

## Outcome

A builder dispatched with an empty allowedFiles:[] gets a LOUD, actionable error at dispatch time instead of silently failing every write; and /portfolio:* skills read the REAL registry at ~/.warpos/portfolio.json instead of a dead project-local path. Each guarded by a planted-violation test; the every-turn guards stay green (golden-first).

## Context

### Original Request

> Dreamteam verified-open guard batch. ACTIONABLE (execution-verified reproducing): W-26 — scope-contract-guard: an EMPTY allowedFiles:[] silently blocks ALL builder writes; the guard's hasScopeContract substring-matches the prompt without parsing the JSON so it can't even SEE the empty array. Fix: parse when parseable, LOUD error on empty allowedFiles ('empty allowedFiles blocks everything — declare files or use forbiddenFiles'), fail-closed wording when unparseable. W-14 — portfolioRegistry (removed paths key) points at the dead project-local file; the REAL registry lives at ~/.warpos/portfolio.json. Fix in the SOURCE framework/paths.registry.json, run scripts/paths/build.js, VERIFY the key survived in .claude/paths.json + lib/paths.generated.js (P-058), then grep ALL portfolioRegistry consumers and confirm they handle the HOME-anchored path. CLOSED already-fixed: W-5 (read-only node -e already allowed), W-13 (commit-message args already stripped), W-28 (install.ps1 header already checked). PLANTED tests per fix; goldens before/after on every touched GUARD (HIGH blast — fires every turn).

### Interpreted Intent

Close two real, execution-verified guard/path defects: a scope-contract guard that can't see an empty allowedFiles array (so it silently bricks builder writes), and a paths key pointing at a dead registry file. Do it without regressing the every-turn guards (golden-first). The other three register items are already-fixed-in-canonical — close them with citations, don't rebuild.

### Current Behavior

W-26: hasScopeContract substring-matches the prompt; an empty allowedFiles:[] passes the guard then silently blocks all builder writes. W-14: portfolioRegistry → dead '.claude/portfolio/registry.yaml <!-- path-literal-allowed: archived artifact quoting the removed dead path -->'; real registry at ~/.warpos/portfolio.json. (W-5/W-13/W-28 already fixed — see citations.)

### Desired Behavior

W-26: an empty allowedFiles:[] (with no forbiddenFiles) is LOUD-blocked at dispatch with an actionable reason; a present-but-unparseable scopeContract fail-closes; a normal non-empty allowedFiles passes. W-14: portfolioRegistry (removed paths key) resolves to ~/.warpos/portfolio.json (home-anchored), consumers read the real registry, the dead path is gone, the key survives regen (P-058). The every-turn guards stay green. W-5/W-13/W-28 closed with citations.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.
>
> This list is generated from `plan_contract.requirement_areas` (N items → R-1..R-N).
> A sprint with >3 requirement areas will have more than 3 entries here — trace.md
> and granular-stories.md reference the same R-1..R-N set (single-source, T-298).

- `R-1` — W-26: scope-contract-guard parses allowedFiles — loud block on empty, fail-closed on unparseable, normal passes
- `R-2` — W-14: portfolioRegistry SOURCE repoint to ~/.warpos/portfolio.json + regen + P-058 verify + consumer audit
- `R-3` — 2 planted tests + scope-contract-guard goldens (every-turn HIGH blast)
- `R-4` — close W-5/W-13/W-28 with canonical-line citations in the sprint record

## Non-Goals

- Building W-5, W-13, W-28 (already-fixed — closed with citations).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| W-26 — scripts/hooks/scope-contract-guard.js (hasScopeContract + the build-chain block path) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260611-0072.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-008\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-008\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-008\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-008\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-008\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-008\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-008\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-008\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-008\release-plan.md`
