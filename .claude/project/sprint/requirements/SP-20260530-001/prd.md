<!-- requirement-format-legacy -->
# PRD — S0.2 Artifact contracts + decision-record schema (message_brief spine)

**Sprint:** `SP-20260530-001`
**Plan Contract:** `PC-20260530-0058`
**Status:** draft
**Documentation scale:** `m`

## Outcome

WarpOS gains the contract spine that turns 'product studio' from vocabulary into an enforceable system: every downstream wave (org, modes, domain agents, pilot) builds against these shapes instead of re-inventing them. The durable value of the whole update is this artifact/eval spine; the org is in service of it (GPT-5.5 over-build guard). Concretely de-risks the program's biggest landmine — ambiguity at handoff — by making the interfaces explicit and validated from day one.

## Context

### Original Request

> Read the handoff and dump.md, then execute. ... use /sprint:full to execute the plan, running parallel sprints where safe. [Program source of truth: _planning/FINAL-PLAN.md v1.1 §6 (S0.2 row) + DUMP.md §5; this is the FIRST sprint, Wave 0A lead.]

### Interpreted Intent

Establish the durable artifact/eval SPINE before any org vocabulary: define a machine-readable contract schema v0.1 for the seven-artifact production chain, with each artifact declaring its owner, consumers, required fields, and a PRECEDENCE rank so per-domain gauntlets can't deadlock. message_brief is the central artifact every other derives from. Add a decision-record schema (the audit trail for who decided what, the oneshot stand-in for alpha/beta). Ship a validator SKELETON that REJECTS non-conforming artifacts (fail-closed), not a linter. This is the interface S0.1 (org map + routing enforcer + failing tests) is written against, so the shapes must be concrete and stable. Governed by enforcer-first + artifact-before-agent iron rules: NO agents are created in this sprint.

### Current Behavior

WarpOS has NO artifact-contract system. It produces code + sprint artifacts only (PRD/stories/tickets/manifests). There is no machine-readable notion of message_brief / audience_dossier / design_brief etc., no per-artifact owner/consumer/precedence, no decision-record schema, and no validator that can reject a malformed studio artifact. The product-studio chain exists only as prose in _planning/.

### Desired Behavior

A versioned contract schema v0.1 in which: (1) each of the 7 chain artifacts (audience_dossier, message_brief, offer_brief, conversion_brief, design_brief, build_spec, ad_advertorial_landing) has a schema declaring owner-domain, consumers, required fields, and an integer PRECEDENCE rank; (2) message_brief is the declared spine (every downstream artifact references the message_brief it derives from); (3) a decision-record schema captures {decision, owner, rationale, precedence-basis, confidence, arbitration-needed flag}; (4) a validator skeleton loads any artifact instance, resolves its schema, and exits non-zero with a clear reason on any violation (missing required field, unknown type, precedence conflict, dangling message_brief reference) — fail-closed, never lint-and-pass. The shapes are concrete enough that S0.1 can write failing tests + a routing enforcer against them without guessing.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — Artifact-contract schema set (7 chain artifacts + chain wiring)
- `R-2` — Decision-record schema
- `R-3` — Precedence model + reference-integrity (message_brief spine)

## Non-Goals

- Creating ANY agent/role (Product Lead, Directors, etc. — that is Wave 2; artifacts+scans first).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| _requirements/ (new artifact-contract spec docs + decision-record spec) | inferred_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260530-0058.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260530-001\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260530-001\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260530-001\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260530-001\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260530-001\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260530-001\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260530-001\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260530-001\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260530-001\release-plan.md`
