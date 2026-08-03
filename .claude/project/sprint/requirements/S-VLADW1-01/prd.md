<!-- requirement-format-legacy -->
# PRD — Engine skeleton — plain-node Agent SDK app, MCP stdio server, four-core tool surface, job state machine, journal, permission-level config port, and the API-key model-access seam

**Sprint:** `S-VLADW1-01`
**Plan Contract:** `PC-20260730-0085`
**Status:** draft
**Documentation scale:** `l`

## Outcome

Nothing user-visible ships in this sprint, and that is the correct shape: this is the engine, not a feature. What it buys is that every subsequent wave — the audit job, the write path, the agent face, the roadmap layer — has a real surface to attach to, exercisable end-to-end without a host, with the compliance-critical credential boundary already enforced in code rather than retrofitted. The founder-facing payoff arrives in S-VLADW1-02, which cannot start without this.

## Context

### Original Request

> S-VLADW1-01 (epic label SP-VLAD-W1-ENGINE) — candidate — Engine skeleton: plain-node Agent SDK app + MCP stdio server + 4-core tool surface + job state machine + journal + permission-level config port (turbo engine half) + API-key model-access seam via the TypeScript Agent SDK (the claude-CLI subscription shell-out is ToS NO-GO; the seam's residue is the credential-custody enforcer + an empirically characterized quota-exhaustion detector)

### Interpreted Intent

Build the substrate every later Vlad wave stands on: a plain-node application on the TypeScript Agent SDK that speaks MCP over stdio, runs jobs through an explicit state machine backed by an on-disk journal, reads a ported per-project permission-level config, and reaches a model on the user's OWN Claude subscription. Two of the calls in this sprint are load-bearing far beyond it. First, the model-access seam. SUPERSEDED-2026-08-01: this contract was authored under the 2026-07-29 ToS NO-GO reading, in which API-key was 'primary and ONLY'. The operator ruled 2026-08-01 that model access is SUBSCRIPTION-PRIMARY — the user's own subscription powering an agent they themselves invoke, local MCP topology, no developer credentials in the path — and the API-key seam (TypeScript Agent SDK) is now the ENGINEERED AND READY fallback per beta 7c4e2b96's auth-agnostic design. The seam must therefore be built auth-agnostically so the flip is a swap, not a rework. What does NOT change is that a fail-closed credential-custody enforcer is part of this build rather than a later hardening pass — it guards whichever secret the seam carries. Second, the receipt: ENGINE emits a versioned envelope with an UNTYPED interior (J4) and never validates or branches on it, because typing it here would propagate a v0 shape into the journal, get_status, the MCP signatures, the driver assertions and the ledger records before the dogfood data that defines it exists.

### Current Behavior

No product CODE exists. UPDATED 2026-08-01: the sibling repo, previously Verified Nonexistent, now EXISTS as the sibling `vlad` (created via /portfolio:new), closing operator gate #1. Inside WarpOS the registry entry, ROADMAP row and sprint stores exist for S-VLADW1-01 — which holds registry primary, the intended result of minting AUDIT first and ENGINE last — with current.yaml and progress.yaml at minted defaults; the tracker at trackers/sprints/S-VLADW1-01-vlad-engine-skeleton.md was authored separately because add-sprint.js does not scaffold one. The previously-recorded blocker that the epic asserted the ToS-barred seam as fact in four places was VERIFIED CLOSED on 2026-07-29 across all six cited locations (epic tracker § Scope and § Open questions item 2; plan artifact § 3 Scope, § 6 Dependency map, § 7 Risk map, § 10 Gate W1), plus AC #1 repriced and the codex/gemini ToS item added. SUPERSEDED-2026-08-01: those same six locations then had to be swept AGAIN, because the operator's subscription-primary ruling reversed the NO-GO verdict they had just been amended to state. The amendment discipline held; the finding is that this seam text drifts across artifacts and must be re-verified by direct read after any ruling, never inherited from an amendment report. No product code has been written and none may be before the design->build gate clears.

### Desired Behavior

A plain-node application starts, registers as an MCP stdio server, and answers its four core tools. A job submitted through run_job moves through an explicit state machine (running / needs_input / proposing / done) with every transition checkpointed to an on-disk journal, so killing the editor mid-job leaves the repository clean and the next session's get_status names the interrupted job with resume and discard options. Job completion emits a versioned receipt envelope whose interior the engine treats as opaque bytes — journalled, returned and logged, never validated or branched on. Model calls run on the user's OWN Claude subscription (user-invoked agent, local MCP topology, no developer credentials in the path) per the operator ruling of 2026-08-01, through an AUTH-AGNOSTIC seam that can be swapped to the user's own API key via the TypeScript Agent SDK without rework if Anthropic ever closes or meters the subscription path. Whichever secret that seam holds, no code path reads, logs, transmits, proxies or inherits it: env passing to child processes is allowlist-based, ambient credential state (ANTHROPIC_API_KEY, OAuth state) is never inherited, and a fail-closed enforcer fails the build rather than reporting a warning if that boundary is crossed. A quota-exhausted or otherwise unrecognized termination classifies as could-not-run, never as success. A per-project config file selects a permission level, and at least ONE refusal is genuinely enforced in engine code rather than merely present in the vocabulary. All of it is exercisable through a host-free driver, and every surface says 'Vlad, powered by Claude'.

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

- `R-1` — Engine skeleton: plain-node application on the TypeScript Agent SDK
- `R-2` — MCP stdio server and the four-core tool surface
- `R-3` — Job state machine and crash-survivable on-disk journal
- `R-4` — Receipt envelope with a versioned, deliberately untyped interior
- `R-5` — Model-access seam — subscription-primary (the user's own subscription, user-invoked, local MCP), built auth-agnostically so the API-key fallback is a swap
- `R-6` — Credential custody — fail-closed enforcement over whichever secret the seam carries, and allowlist-based env passing
- `R-7` — Quota-exhaustion detection, empirically characterized, could-not-run on the unknown
- `R-8` — Permission-level config port with exactly one genuinely enforced refusal
- `R-9` — Branding guard with a named enforcer
- `R-10` — Host-free driver for end-to-end exercisability

## Non-Goals

- The audit job itself — that is S-VLADW1-02.

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| The sibling Vlad product repo (all product-side files) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260730-0085.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-01\release-plan.md`
