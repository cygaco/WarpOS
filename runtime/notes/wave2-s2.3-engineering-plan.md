# Wave 2 · S2.3 Engineering domain — lane notes

_Lane: S2.3 Engineering. Isolated worktree `wave2-s2.3-engineering` (branch
`worktree-wave2-s2.3-engineering`), reset to local main `ea7f20b` (the S1.1
chassis CORE commit). Runs in parallel with S2.1 (Product) + S2.2 (Marketing)._

## Worktree base-ref finding (load-bearing — affects how α merges)

- The harness initially dropped me on `main` directly, NOT an isolated worktree
  as the brief assumed. I created one with EnterWorktree.
- EnterWorktree's default base is `fresh` = `origin/<default>`. **origin/main is
  1 commit behind local main**: origin is at `c3219d6` (S1.1 role-parity
  enforcer); local main is at `ea7f20b` (S1.1 chassis CORE — adds
  `scripts/dispatch/org-roles.js`).
- A fresh worktree off `c3219d6` was MISSING `org-roles.js` (it's committed only
  in `ea7f20b`), so `role-parity-scan.js` (which `require()`s org-roles) would
  fail-closed (exit 2) there. This was NOT a real chassis gap — purely a
  base-ref artifact. I `git reset --hard ea7f20b` in the worktree to get the
  full chassis. Confirmed: org-roles.js present, role-parity green.
- IMPLICATION for α: the canonical chassis lives at local main `ea7f20b`, which
  is unpushed. Don't integrate this lane onto origin/main without first landing
  the S1.1 chassis-CORE commit.

## Authoritative surfaces (confirmed)
- `.claude/agents/**` specs are authored DIRECTLY (no `_warpos/agents/` source;
  `_warpos` exists but has no agents/ subdir). Both manifests hash-track them:
  `_warpos/MANIFEST.json#paths` + `.claude/framework-manifest.json`. Regen of
  BOTH manifests is α's serial integration step (per memory
  `project_regen_manifests_after_framework_edit`) — NOT done in this lane.

## How the chassis already pre-stages FE/BE (artifact-before-agent)
- org-map.json ALREADY declares `frontend-builder` + `backend-builder` under
  `engineering.builders` with `agent: null` (pending). So:
  - `org-roles.buildChainDoerRoles()` ALREADY lists both (derived from builders[]).
  - `org-roles.gammaOnlyTypes()` ALREADY includes both → team-guard gates them
    automatically (rule 5 is satisfied by DERIVATION, not hand-editing).
- My job: author the SPECS so when α flips `agent: null -> <role>`, role-parity
  rule 1 (built agent resolves to a real spec) passes. The org-map flip + the
  catalog ROLES addition MUST land in the SAME integration (else rule 4
  ungoverned-doer or rule 1 unresolved-agent fails — see REGISTRY DELTA).

## Builder split design (no 2× duplication)
- Existing `builder` has adhoc (5KB) + oneshot (9.7KB) specs. ~80% is IDENTICAL
  and concern-neutral: worktree-isolation preamble, branch discipline, "don't
  touch foundation", typecheck command (`node node_modules/typescript/bin/tsc`),
  commit-before-return, no-subagents, PRIMITIVE-NEEDED signal, S0.2 build_spec
  contract tie, security checklist.
- Strategy: extract the shared core into `_build-core/build-core.md` (one per
  mode dir) and have FE/BE specs REFERENCE it + add only their concern delta.
  - FE delta: UI/components/design-system adherence, accessibility, responsive,
    consumes design_brief, owns `src/components/**` + `src/app/**`.
  - BE delta: APIs/routes/data/persistence/auth/validation/integration seams,
    owns `src/app/api/**` + `src/lib/**` (non-UI), produces typed contracts FE
    consumes. The S1.3 Gamma integration phase owns the FE/BE shared-file seam.
- Both are claude-provider build-chain doers (mirror builder: model
  sonnet-4-6, isolation worktree, effort high/max).

## Design-quality gauntlet wiring (the named cross-domain design authority)
- org-map.gauntlets.design-quality currently has `approves[]` but NO `members[]`.
  So org-roles derives ZERO review roles from it today.
- Two-lane design (reuse existing mechanism — Build over Buy):
  1. STATIC lane (already exists, fail-closed): `scripts/checks/design-system.js`
     (`/scan:design-system --strict`) — hex literals, raw Tailwind theme colors,
     raw `<button|input|select|textarea>`, untyped props, missing design docs.
     Plus reviewer Check 6 (design_compliance). Deterministic, builder-agnostic.
  2. JUDGMENT lane (NEW member): a `design-quality` reviewer agent (visual-review
     pattern extended to the 6 approval axes: tokens · component-usage ·
     visual-hierarchy · mobile-responsive · accessibility · design-handoff).
     Multimodal, reviews rendered UI against design_brief + design-system docs.
     Builder-agnostic: reviews app-design (Product) AND web-design (Marketing).
- Wiring = REGISTRY DELTA (α applies): add member to design-quality.members[],
  add the role to catalog ROLES + provider tables, so role-parity rule 2
  (members are real dispatch roles) + rule 1 (spec resolves) pass.
- I author the member SPEC; α wires the enforcer. Gauntlet stays builder-agnostic.

## Hard constraints honored
- NOT editing: org-map.json, catalog.js, team-guard.js, role-parity-scan.js,
  providers.js. Emitting a precise REGISTRY DELTA instead.
- registry.json (manager principles) is NOT on the forbidden list and engineering
  principle ownership is squarely mine — I edit it in-worktree so specs validate
  green, but FLAG it as a serial-apply item (S2.1/S2.2 also touch it).
- No guard-hook edits. Stay in worktree. Touch only engineering-domain specs +
  these notes.
