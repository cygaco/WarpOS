# Design-quality gauntlet — wiring DESIGN (S2.3)

_What the named cross-domain design authority RUNS, what it REJECTS, and how α wires it as
an actual approver gauntlet. The gauntlet stays builder-agnostic. I (S2.3) produce the
design + the member spec; **α does the enforcer wiring** (registry + launcher delta below)._

## What it IS (org-map already declares it)
`org-map.json#gauntlets.design-quality` — `domain: "cross-domain"`,
`is_named_design_authority: true`, `approves: [design-tokens, component-usage,
visual-hierarchy, mobile-responsive, accessibility, design-handoff]`. It spans **app-design**
(Product's Product Designer) + **web-design** (Marketing's Web/Conversion Designer +
landing-page output). A component library is NOT an owner — this gauntlet is the named
approver (FINAL-PLAN §2, §10c; ORG.md "Design authority (resolved)").

**Gap it fills today:** the gauntlet had `approves[]` but NO `members[]`, so
`org-roles.reviewGauntletRoles()` derived ZERO design review roles from it — the authority
was declared but had no doer. This wiring gives it one.

## Two lanes (Build-over-Buy: reuse existing mechanism, add only the judgment doer)

### Lane 1 — STATIC (deterministic, already exists; fail-closed)
- `scripts/checks/design-system.js` → `/scan:design-system --strict` (exit 2 on violation).
  REJECTS: hex literals in UI styling, raw Tailwind theme-color utilities, raw
  `<button|input|select|textarea>` outside `ui/`, untyped (`any`) component props, missing
  design-system docs. Allow-list at `scripts/checks/design-system.allowlist.json`.
- Plus the code-QC `reviewer` Check 6 (design_compliance) — same rules at code-review time.
- This lane is builder-agnostic by construction (it scans `src/components/**` + `src/app/**`
  regardless of author). It is the regex-catchable half.

### Lane 2 — JUDGMENT (NEW; the member I authored)
- Agent: `.claude/agents/02-oneshot/design-quality/design-quality.md` (mirrors the
  `visual-review` pattern: Playwright MCP, multimodal, claude-opus, read-only, returns JSON).
- Extends visual-review from "spot brand/layout drift" to **approve/reject on the 6 axes**,
  keyed by `{{DOMAIN}}` (app-design vs web-design) and judged against the S0.2 `design_brief`
  (`visual_hierarchy` + `mobile_requirements`) at desktop AND mobile viewports.
- REJECTS (verdict FAIL on any `critical`/`high`): token drift a regex misses, a buried
  primary CTA / broken hierarchy, mobile overflow/overlap/too-small tap targets, an
  interactive element with no accessible name / bad contrast / color-only state, a
  design→build handoff that doesn't match the brief, a `build_spec.components[]` with no
  real `ui/` source.
- **Reject-not-lint + fail-closed:** in oneshot (no α/β) a missing/contradictory
  `design_brief` => `recommendation: INVESTIGATE`, `requiresHuman: true`, arbitration-needed
  rationale (S1.2 stand-in for escalation) — never a guessed PASS.

## How α WIRES it as an actual approver gauntlet (enforcer wiring = α's job)
1. **Registry (serial):** add `design-quality` to `org-map.gauntlets.design-quality.members`,
   to `catalog.js#ROLES`, and to the provider tables (claude provider). See the REGISTRY
   DELTA note for exact edits + the proven sequencing (member + ROLES must land together,
   else role-parity rule 2 FAILS — simulated). This makes
   `org-roles.reviewGauntletRoles("<any-domain>")` return `design-quality` (it's
   cross-domain, so it attaches to EVERY domain's gauntlet via
   `gauntletForDomain`), and `gammaOnlyTypes` auto-gates it.
2. **Launcher (the actual approver step):** the delta-* oneshot gauntlet launcher + the γ
   adhoc gauntlet run the review personas from `reviewGauntletRoles(domain)`. Because
   design-quality is cross-domain, it runs as an approver on **app-design** units (Product)
   AND **web-design** units (Marketing), alongside Lane 1's `/scan:design-system --strict`.
   α adds the two-lane invocation to the design/web gauntlet path:
   `/scan:design-system --strict` (static, fail-closed) AND a `design-quality` dispatch
   (judgment) — both must pass for a design unit to clear the gate.
3. **Builder-agnostic guarantee:** the gauntlet keys on `{{DOMAIN}}` + reads the rendered
   result; it never references frontend-builder / web-conversion-designer / a growth skill by
   name. Whoever produced the UI, the same six axes apply.

## Why this respects the iron rules
- **Enforcer-first / reject-not-lint:** both lanes REJECT (static exits non-zero; judgment
  verdicts FAIL on critical/high). The authority is a gate, not a checklist.
- **Artifact-before-agent:** the member SPEC exists on disk before α flips any registry.
- **Policy needs an enforcer:** the design-authority policy (consistency across app+web)
  now has a named two-lane enforcer instead of an aspirational "library = owner."
