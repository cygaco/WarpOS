# Design-guides INTEGRATION pass (wire the 19 guides into the agents)

All 19 guides exist in `_guides/design/*.md`, each with frontmatter
(guide/anchor:none/shape/timing/tier/trains/maps_to/sources) + a §6 agent-checkable RULES section.
Your job: make the designer agents actually CONSUME them. Be ADDITIVE and CONSERVATIVE — do not
rewrite existing agent content, do not weaken any enforcer.

## 1. Design registry  →  `_guides/design/registry.json`
Build a machine-readable index by reading each guide's frontmatter. Schema:
```json
{ "$schema":"warpos/design-guides/v0.1", "version":"v0.1",
  "guides":[ {"guide":"VISUAL_HIERARCHY","path":"_guides/design/VISUAL_HIERARCHY.md","tier":"core",
              "trains":["product-designer","web-conversion-designer","design-quality","visual-review"],
              "maps_to":["visual-hierarchy","layout"]}, ... all 19 ... ] }
```
Include a coverage block proving every design-quality axis (design-tokens, component-usage,
visual-hierarchy, mobile-responsive, accessibility, design-handoff) and every visual-review category
(color, layout, typography, copy, a11y, console-error, regression) is owned by ≥1 guide.

## 2. README index  →  `_guides/design/README.md`
Frontmatter `guide: README-DESIGN, anchor: none, shape: notice, timing: reference, lead_time: "none"`.
Body: one-paragraph purpose (trains the designer agents), the 19 guides grouped by the 6 clusters
(from TAXONOMY.md), and the axis/category coverage table. This is the single design-overview entry.

## 3. Wire into the 4 designer agents (ADDITIVE block only)
Add a clearly-delimited block titled **"Design-principles guides (training references)"** into the
INPUT-FRAME / grounding section of each agent. Do NOT touch frontmatter, principles, or existing prose.
The block: points to `_guides/design/` + `registry.json`, lists the guides whose `trains:` includes
THIS agent (filter per registry), and says: "Apply each guide's §6 agent-applicable RULES as part of
your judgment; the rules are phrased in your own finding vocabulary."
Targets:
- `.claude/agents/03-managers/product-designer.md`
- `.claude/agents/03-managers/web-conversion-designer.md`
- `.claude/agents/02-oneshot/design-quality/design-quality.md`  (its six axes ARE the maps_to targets — point each axis at its owning guide)
- `.claude/agents/02-oneshot/visual-review/visual-review.md`     (point each finding category at its owning guide)
Check for ADHOC equivalents of design-quality/visual-review under `.claude/agents/01-adhoc/` and wire them too if present.

## 4. Bootstrap pointer (ONE, minimal)
Add a SINGLE pointer to the design library (the README) into the bootstrap pipeline — per the ruling
"bootstrap gets one design-overview entry only." Prefer a one-line reference in the appropriate spinup
spot. If it does not fit the launch-guide anchor model cleanly, DO NOT force it / DO NOT break the
launch pipeline — instead note that the design library is agent-grounding (anchor:none) and the README
is the index. Record any bootstrap placement in the integration ledger if you use the marker mechanism.

## 5. guides:coverage compatibility (CRITICAL — do not break the fail-closed enforcer)
Read `scripts/checks/guides-coverage.js` FIRST. Determine how it scans `_guides/` (recursive? requires
every *.md in the launch `registry.json`? how does it treat `anchor: none`?). Then make the MINIMAL
change so `/guides:coverage` stays GREEN with the new `_guides/design/` subfolder present:
- PREFER: make coverage treat `_guides/design/` as a separate registry-backed category (validate against
  `_guides/design/registry.json`) OR treat `anchor:none` design guides as registry-only (not requiring a
  bootstrap placement) — WITHOUT weakening any existing launch-guide check.
- Do NOT relax the launch-guide checks. If a change to the enforcer is needed, keep it additive + narrow,
  and STATE exactly what you changed and why in your report for review.
Run `node scripts/checks/guides-coverage.js` (and the skill if applicable) until green.

## 6. Regen manifests (last step)
The new `_guides/design/**` are framework-owned. Run:
`node scripts/generate-framework-manifest.js && node scripts/warpos/manifest/build.js`

## 7. Validate + report
Run `node scripts/checks/guides-coverage.js` and `node scripts/testsuite/enforce.js`. Report: registry +
README created, exactly which block you added to each of the 4 (or more) agents (quote the block),
the bootstrap pointer decision, the EXACT guides-coverage.js change (if any) for review, and the
green/red status of coverage + enforce. Do NOT commit — the lead reviews + commits.
