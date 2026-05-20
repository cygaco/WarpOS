# Dictionary

Project glossary. Alphabetized. Short entries, example-anchored. Add terms as they come up.

---

## Beta consultation

The mechanism by which Alpha (the architect) consults Alex β (the judgment model) before surfacing a non-trivial decision to the user. β returns `DECIDE` (proceed), `DIRECTIVE` (proceed with named adjustment), or `ESCALATE` (surface to user with `ESCALATE:` prefix). Enforced by the beta-gate hook — Alpha cannot call `AskUserQuestion` in adhoc mode without a prior β consult. Full protocol in `paths.decisionPolicy`.

## Capsule

A versioned snapshot of WarpOS shippable under `framework/releases/<X.Y.Z>/`. Each capsule carries `release.json`, a manifest snapshot, and the canonical source files needed for a downstream consumer to run `/warp:update --to X.Y.Z --apply`. A version bump in `version.json` without a corresponding capsule is a "hollow rung" — `/warp:update` will fail when downstream reaches for it.

## Forcing function

A constraint or structural setup that makes you face a decision you've been avoiding. Not a hammer or a deadline — the value isn't pressure, it's the removal of your ability to keep dodging. The output is clarity, not the artifact the forcing function produces.

**Example.** Standing up an `@warpos/cli` npm-package shape of WarpOS in parallel to the current canonical-clone model. Even if the npm version is never adopted, building it forces the question *"which of our current sprints would be wasted under that shape?"* — a question easy to deflect when only the current shape exists. The parallel build doesn't have to succeed; its job is to make the comparison unavoidable.

## Ledger discipline

The rule that every sprint and every release writes a row to two canonical repo-root docs: `ROADMAP.md` (sprints, planned/in-flight/closed) and `RELEASES.md` (version bumps with capsules). The ledgers are auto-managed by `scripts/sprint/ledger.js` — manual edits remain valid but may be overwritten on the next `/sprint:*` or `/warp:release` invocation. Enforced by the policy "every policy needs a named enforcer" — see `CLAUDE.md#Policy & Enforcement Hygiene`.

## Plan Contract

The structured artifact produced by `/sprint:plan` that turns a plain-language request into evidence-labeled assumptions, scope variants, and a plan-quality verdict. Lives at `paths.sprintPlanContracts/PC-YYYYMMDD-NNNN.yaml`. Carries `source_request_verbatim` (never paraphrased), affected surfaces with `evidence_level`, safe vs unsafe assumptions, ESD candidates, approval boundaries, and a `plan_quality.status` of `pass | needs_design | needs_user_clarification | blocked`. The contract is what downstream phases (design, execute, release) inherit.

## Routing policy

The mapping from sprint phase → required model class and diff-review requirement, declared at `paths.sprintRouting`. Phases: planning (`strongest_reasoning`), design (`strong_reasoning`), execution (`economical_coder`), qa, redteam, release. Each phase's `diff_review` flag triggers a cross-vendor review when available. Routing is **enforced**, not aspirational — traces are recorded to `paths.sprintDecisions/routing-trace.jsonl` and `/sprint:release` refuses to ship when a required phase lacks a trace (SP-20260514-002).

## Sprint

A bounded unit of work managed by the four `/sprint:*` skills (`plan`, `design`, `execute`, `release`). Identified by `SP-YYYYMMDD-NNN`. Each sprint has its own Plan Contract, requirements bundle, tickets, ralph loops, checkpoints, and final report. Active sprints are tracked in `paths.sprintActiveRegistry` with one designated as `primary`. Per-sprint state under `paths.sprintSprints/<SP-id>/`.
