# Wave 2 · S2.3 Engineering — REGISTRY DELTA (for α to apply serially)

_I (S2.3) did NOT edit the cross-lane barrier files (org-map.json, catalog.js,
team-guard.js, role-parity-scan.js, providers.js). α applies these serially. Every change
below is **proven** to keep role-parity green by simulating the scan's pure `evaluate()`
core against in-memory delta-applied copies (see "Validation" at bottom). Apply the four
edits in ONE integration commit (the sequencing constraints are load-bearing — proven by
the broken-ordering simulations)._

## EDIT 1 — `.claude/agents/03-managers/_org/org-map.json`
Flip the engineering domain's `agent: null` → built spec names (artifact-before-agent: the
specs now exist on disk), and give the design-quality gauntlet its member.

```diff
 "engineering": {
-  "director": { "role": "director-of-engineering", "agent": null },
+  "director": { "role": "director-of-engineering", "agent": "director-of-engineering" },
   "builders": [
-    { "role": "frontend-builder", "agent": null },
-    { "role": "backend-builder", "agent": null }
+    { "role": "frontend-builder", "agent": "frontend-builder" },
+    { "role": "backend-builder", "agent": "backend-builder" }
   ],
 ...
 "design-quality": {
   "domain": "cross-domain",
   "is_named_design_authority": true,
+  "members": ["design-quality"],
   "approves": ["design-tokens","component-usage","visual-hierarchy","mobile-responsive","accessibility","design-handoff"],
   ...
 }
```
- `director-of-engineering` resolves to `.claude/agents/03-managers/director-of-engineering.md`.
- `frontend-builder` / `backend-builder` each resolve to BOTH
  `.claude/agents/01-adhoc/<role>/<role>.md` AND `.claude/agents/02-oneshot/<role>/<role>.md`
  (the resolver matches a dir named `<agent>` anywhere under `.claude/agents/` — present in both).
- `design-quality` member resolves to `.claude/agents/02-oneshot/design-quality/design-quality.md`.

## EDIT 2 — `scripts/dispatch/catalog.js`
Add the three new doer roles to ROLES + their provider/effort defaults. **MUST land in the
SAME commit as EDIT 1** (proven: org-map built without ROLES = latent un-dispatchable
roles, Scenario A; design-quality member without ROLES = role-parity rule 2 FAILS, Scenario B).

```diff
 const ROLES = [
   "alpha","beta","gamma","delta",
   "builder",
+  "frontend-builder",
+  "backend-builder",
   "fixer","reviewer","compliance","learner","qa","redteam","stub-scaffold",
+  "design-quality",
 ];

 const DEFAULT_PROVIDER_PER_ROLE = {
   ...
   builder: "claude",
+  "frontend-builder": "claude",
+  "backend-builder": "claude",
   ...
+  "design-quality": "claude",
 };

 const DEFAULT_EFFORT_PER_ROLE = {
   ...
   builder: "max",
+  "frontend-builder": "max",
+  "backend-builder": "max",
   ...
+  "design-quality": "high",   // judgment/visual review — opus, high (mirrors visual-review tier)
 };
```
- FE/BE inherit `builder`'s tuple: provider=claude, effort=max (they ARE the split builder).
- `design-quality` = claude provider (multimodal opus, like `visual-review`), effort=high.

## EDIT 3 — `scripts/hooks/lib/providers.js` → `DEFAULT_AGENT_PROVIDERS`
Mirror the provider defaults (the manifest may override, but the fallback map must agree —
`/scan:dispatch-routing-parity` asserts catalog ↔ providers ↔ dispatch-guide agree).

```diff
 const DEFAULT_AGENT_PROVIDERS = {
   ...
   builder: "claude",
+  "frontend-builder": "claude",
+  "backend-builder": "claude",
   ...
+  "design-quality": "claude",
 };
```
- NOTE the doc side of routing-parity: `design-quality` runs on claude (no Role|Provider
  doc-table entry needed beyond claude default, same as builder/fixer); if
  `/scan:dispatch-routing-parity` requires every NEW role in the dispatch guide's table, add
  FE/BE/design-quality rows there too (all → Anthropic/claude). Run that scan after EDIT 2/3.

## EDIT 4 — `scripts/checks/role-parity-scan.js` → TRANSITIONAL (the retirement)
The `builder` TRANSITIONAL entry retires **only when `builder` ALSO leaves catalog ROLES**,
and **only after** FE/BE are built+wired (EDIT 1+2 done). Proven (Scenario C): removing
`builder` from TRANSITIONAL while it is still in catalog ROLES makes it UNGOVERNED →
role-parity rule 4 FAILS.

**Sequencing — DECISION: Option A now. Full retirement (Option B) is BLOCKED on a live
dispatch-route migration that is outside this lane's scope (it's S1.3 / domain-aware
dispatch chassis work, and touches barrier files this lane may not edit).**

- **Option A (the call): KEEP `builder` for now.** Land EDIT 1–3 (FE/BE + design-quality
  built & dispatchable) WITHOUT retiring `builder`. `builder` stays a valid role +
  TRANSITIONAL entry. Parity stays green (builder still governed by TRANSITIONAL). FE/BE
  and `builder` coexist — FE/BE are dispatchable the moment EDIT 1–2 land; `builder`
  remains the route the orchestrator still uses until that route is migrated.

- **Option B (full retirement) — BLOCKED, evidence below.** I ran the refactor-hygiene grep
  for the OLD literal across the whole tree. `builder` is NOT a dead label — it is a LIVE
  dispatch role with these concrete callers that must migrate to choose FE-vs-BE per unit
  BEFORE `builder` can leave `catalog.ROLES`/`TRANSITIONAL`/`STATIC_GAMMA_ONLY_AUGMENT`:
  1. **`scripts/delta-dispatch-builder.js:221`** — hard-codes
     `claude -p --model claude-sonnet-4-6 --effort max --agent builder` (THE oneshot build
     dispatch). The whole script is named/scoped to `builder`.
  2. **`.claude/agents/02-oneshot/.system/protocol.md`** — Delta's protocol routes every
     build step through `delta-dispatch-builder.js` `--agent builder`; the phase model says
     "builder" throughout (`cycleStep: "builder"`).
  3. **Prompt→role classifiers (hooks):** `prompt-validator.js:68/70`,
     `build-transaction-boundary.js:17`, `scope-contract-guard.js:14`,
     `session-tracker.js:173` all map a `feature:`-prefixed prompt to role `"builder"`.
     They'd need to also recognize/emit frontend-builder/backend-builder.
  4. **Oneshot store/heartbeat writers:** `patch-store-backend-skipped.js:25`,
     `update-onboarding-done.js:77`, `set-heartbeat-market-research-builder.js:15` set
     `cycleStep: "builder"`.
  5. **Scaffold/smoke ship the builder agent:** `scaffold-core.js:559`,
     `provider-smoke.js:329` enumerate `"builder"`.
  6. **Tests pin it:** `role-parity.test.js:52-53`, `test-dispatch-agent-resolution.js`,
     `test-team-guard.js`, `test-response-size-guard.js` assert on `"builder"` — these
     update WITH the migration, not before.

  → The blocker is real orchestration logic: **the dispatcher must learn to pick FE vs BE
  per work unit** (a domain-aware-dispatch decision = S1.3 Gamma-integration territory),
  not a spec edit. Retiring `builder` before that = breaking the only build route. **Do NOT
  retire in this integration.** When S1.3 teaches the orchestrator the FE/BE choice, retire
  `builder` from ROLES + TRANSITIONAL + STATIC_GAMMA_ONLY_AUGMENT + the dispatch script +
  protocol + classifiers TOGETHER (single migration commit), re-running role-parity +
  dispatch-routing-parity + the role-parity test after.

```diff
 const TRANSITIONAL = new Map([
-  ["builder", "splits into frontend-builder/backend-builder in Wave 2 (S2.3); org-map declares both (agent:null, pending)"],
   ["qa", "the QA failure-mode scanner directed by qa-lead (org-map product domain); retires when qa-lead is built (Wave 2 S2.1)"],
 ]);
```
(Do NOT apply the `builder` removal in THIS integration — it's blocked, per the evidence
above. When S1.3 makes the orchestrator FE/BE-aware, remove `builder` from ROLES +
TRANSITIONAL + `org-roles.STATIC_GAMMA_ONLY_AUGMENT` + the dispatch script/protocol/
classifiers together. `qa` stays — it's S2.1's to retire.)

The `org-roles.js#STATIC_GAMMA_ONLY_AUGMENT` `"builder"` entry (comment already says
"transitional → FE/BE Wave 2 S2.3") stays for now — it keeps the live `builder` route
gamma-gated until the route is migrated.

## MANIFESTS — α's last step (NOT done in this lane; per memory regen-both-manifests)
The new spec files must be registered + hash-tracked, then BOTH manifests regenerated:
- Add to `_warpos/MANIFEST.json#paths`:
  `.claude/agents/03-managers/director-of-engineering.md`,
  `.claude/agents/01-adhoc/_build-core/build-core.md`,
  `.claude/agents/01-adhoc/frontend-builder/frontend-builder.md`,
  `.claude/agents/01-adhoc/backend-builder/backend-builder.md`,
  `.claude/agents/02-oneshot/_build-core/build-core.md`,
  `.claude/agents/02-oneshot/frontend-builder/frontend-builder.md`,
  `.claude/agents/02-oneshot/backend-builder/backend-builder.md`,
  `.claude/agents/02-oneshot/design-quality/design-quality.md`.
  (Plus the edited `_principles/registry.json` is already tracked — no new path.)
- Then: `node scripts/generate-framework-manifest.js && node scripts/warpos/manifest/build.js`
  (regen BOTH — else BC-02/BC-05 honesty-drift goes red; blocks sprint-close).
- Re-run `/scan:warpos-manifest-coverage` + `/scan:warpos-ship-coverage` to confirm the new
  framework-owned specs ship to downstream installs.

## VALIDATION (already run in-worktree against the scan's pure core)
Simulated EDIT 1+2 (+design-quality member) against `role-parity-scan.evaluate()` with the
real `agentResolves` + `org-roles.gammaOnlyTypes(deltaOrg)`:
- **PARITY HOLDS — zero errors** with FE/BE/director built + design-quality member + the 3
  ROLES additions.
- `gammaOnlyTypes(deltaOrg)` auto-includes frontend-builder, backend-builder, design-quality
  (rule 5 satisfied by DERIVATION — no team-guard hand-edit; team-guard already delegates to
  org-roles, the wiring invariant the scan also checks).
- Broken-ordering proofs: Scenario A (ROLES not updated → latent un-dispatchable, parity
  silent — hence "same commit"); Scenario B (member without ROLES → rule 2 FAILS); Scenario
  C (builder out of TRANSITIONAL but in ROLES → rule 4 FAILS — hence retire ROLES+TRANSITIONAL
  together).
