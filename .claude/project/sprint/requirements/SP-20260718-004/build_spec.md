# SP-20260718-004 — build_spec (Phase 2: Identity + host portability)

**Composition:** backend + security. **Max risk:** HIGH (authority/identity false-green is the irreversible outcome). **Domains:** routing / security / identity.
**Authored:** design phase, ε (Epsilon3 conductor) consolidating director-of-engineering + product-lead + quality-lead consults (2026-07-19). **Merge policy:** backend-first / keystone-first (no FE unit).

## THE SPINE (binding — β plan-lock, do not drift)
PRIMARY = **derived-not-settable** (ED-225): a worker's `actor_kind` + `role` are DERIVED from the dispatch CHANNEL + CONTRACT — a worker CANNOT set/claim its own role; ambient text (worktree `CLAUDE.md`, handoff, `AGENTS.md`) is INPUT it reads, NEVER the authority for its binding. HMAC origin-proof (ED-231) is SECONDARY, only where a binding is PERSISTED to a record read across a trust boundary. **NO signed settable "role" field** — the derived role is such that no settable role field exists at all. The authority-pollution scan is a DETECTOR at the R6 completeness ceiling (defense-in-depth); the STRUCTURE (derived → ambient text INERT-BY-CONSTRUCTION) is the guarantee.

## Key architectural ruling (DoE): the CHANNEL is the signal
The role-binding resolver runs **PRE-SPAWN in the trusted parent** (the dispatch bridge / session-bootstrap). The worker does not exist yet, so `actor_kind` is un-forgeable by construction: **WHICH bridge is spawning IS the signal**, never a field the worker reads.
- `dispatch-claude.js` / `dispatch-agent.js` spawning → `actor_kind = dispatched_worker`.
- session-bootstrap / helm → `actor_kind = top_level_session`.
The trusted parent injects the derived binding into the child env (`WARPOS_BOUND_ROLE` / `WARPOS_ACTOR_KIND`) — read by the worker BEFORE ambient `CLAUDE.md` (which is `repo_prose`, `can_bind:false`).

## Scope LINE (Phase-2 vs Phase-3 — hold it)
The Phase-2 resolver DERIVES + SCOPES + FAIL-CLOSES. It does NOT build the active `validated_workorder_or_cli` provenance validator (WorkOrder schema + authority check) — that is **ED-218 / Phase-3**. For precedence position #2 in Phase 2, "validated" = "the trusted bridge ASSERTS the argv/channel role" (channel-asserted); the resolver binds the worker to the bridge's own argv role and fail-closes on any worker presenting a `top_level_session`-only source (`explicit_user` / `explicit_top_level_helm`) — a category-error BLOCK per `applies_to_actor` (role-binding.json N-5).

## Units (keystone-first; all backend/security)

### A1 — Role-binding runtime resolver [G2.1 / ED-216 / CORE-1+3] — KEYSTONE, seam producer
- Home: `scripts/dispatch/role-resolver.js`.
- **EXTRACT** the fixture-proven role-binding evaluator + loaders (`GATE_EVALUATORS['role-binding']`, `loadRoleBinding`, `validateRoleBinding`) out of `scripts/checks/conformance-matrix.js` into a shared kernel lib that BOTH conformance-matrix.js AND the resolver import. Rationale: one evaluator, fixture-proven AND live; the conformance fixtures staying green is the extraction's regression guard (do NOT re-derive the precedence graph).
- Public contract (frozen first — seam owner): `deriveBinding({ channel, role }) → { actor_kind, boundRole, ok, reason }`. `channel ∈ {dispatch-claude, dispatch-agent, session-bootstrap, helm}`.
- **Fold H (ED-220 value-validation)** into the shared `validateRoleBinding`: `worker_default_when_unbound ∈ {FAIL_CLOSED}`, order↔sources totality, `applies_to_actor ⊆ {top_level_session, dispatched_worker}`, `top_level_default_binding_source == "helm_only"`, `top_level_human_default` a KNOWN role id, and the bound VALUE (`boundRole`) is a known role-registry id — an unknown/out-of-registry/malformed role value → BLOCK.
- **BLOCKING FIXTURE (i)** lives here: derived-not-settable NEGATIVE — a dispatched worker that SETS `role:"President"`/authority in its OWN context/record/handoff → STILL resolves UNBOUND (dispatched) / alex-alpha-only-via-helm (top-level). Prove the settable field is never read as authority.
- Cold-vs-warm (product-lead, must-follow): AC asserts BOTH the cold path (unbound → FAIL_CLOSED) AND the warm path (bound top-level-helm session). A spec testing only the bound path silently ships the broken unbound path.
- Unit tests + the live (not seed) precedence fixtures.

### A2 — Wire the resolver into the dispatch bridges [G2.1 seam edit]
- Edit `scripts/dispatch-claude.js` + `scripts/dispatch-agent.js` to call `deriveBinding` PRE-SPAWN and inject `WARPOS_BOUND_ROLE`/`WARPOS_ACTOR_KIND` into the child env; a `BLOCK`/fail-closed binding refuses the dispatch (never spawns an unbound worker as President).
- Refactor-rule-3 (CLAUDE.md): the resolver enforces at DISPATCH-time; unit C's scan enforces at WRITE-time — a lib fix alone does not protect a bypassing caller.

### B1 — Provider-neutral canonical instruction source + per-provider projections [G2.2]
- One canonical neutral instruction SOURCE + deterministic per-provider PROJECTIONS (Claude helm binding, codex/AGENTS, gemini shim). Operator-voice + any `explicit_top_level_helm` default lives ONLY in the helm projections, NEVER in the neutral source (H-6a).
- Regen is deterministic; source + projections land in ONE atomic commit (regen-both-manifests discipline).

### B2 — Projection drift-check enforcer [G2.2]
- `git diff --exit-code` clean after regen + a SEMANTIC-FIDELITY fixture (canonical rule X MUST appear in projection Y — determinism ≠ fidelity; a generator that consistently omits a rule still fails). Wired scan:full/CI.

### C — Authority-pollution STANDING scan [G2.3] — standing enforcer + BLOCKING FIXTURE (ii)
- `scripts/checks/authority-pollution-scan.js`: walks the EFFECTIVE instruction graph (root `CLAUDE.md`/`AGENTS.md`/`GEMINI.md`, worktree copies, agent specs, shims, generated projections, handoff prompts). DERIVE the surface list from how the harness assembles a worker's effective context; where a hand-list is unavoidable, LABEL it in-code as a lower bound (P-057).
- Exit non-zero if any ambient/neutral surface asserts unconditional permissions/approval/merge/deploy authority OR operator-audience OR a `can_bind:false` top-level identity ("You are Alex") reachable by a worker. Wired `/scan:full` + CI; self-detecting on RE-INTRODUCTION.
- **BLOCKING FIXTURE (ii)**: rule-#5-STYLE default-binding plant ("default top-level human-facing role = alpha") in a NEUTRAL file → proven CAUGHT (paraphrase, NOT the bare "you are Alpha" string).

### D — President-leak close in worktree + codex router-slurp [G2.4] — load-bearing
- Close the worktree `CLAUDE.md` "You are Alex — the President" leak: a dispatched builder's worktree instruction set must NOT present President identity. NEUTRALIZE/replace the worktree projection for dispatched workers (per the DoE caveat — the model reads ambient `CLAUDE.md`, so precedence at the wrapper is not enough; the instruction set itself must not say "You are Alex" for a worker).
- codex reviewers stop slurping the full 14KB `AGENTS.md` router from cwd — scope the reviewer's provider-neutral context.

### E — Per-provider cwd/sandbox tests [G2.5]
- Tests of cwd/sandbox behavior per provider BEFORE any "neutral cwd" change (changing cwd moves codex's sandbox root). A cwd change that merges without these tests → blocked. Reviewers get read-only evidence; builders get exactly one isolated worktree as write root.

### F — Operator-voice helm-only projection [G2.6]
- The operator-voice directive (ELI5-default/depth-when-consequential, audience-scoped) projected ONLY into helm bindings, scan-asserted (the authority-pollution scan asserts operator-audience appears helm-only, never in the neutral source).

### G1 — ED-231 residual: whole-ledger signing extended to gauntlet-verify liveness readers [MISTAKE-CLASS priority]
- Extend `scripts/dispatch/gauntlet-verify.js` well-formed-ok check to ADDITIONALLY require `attest-signing.verifyRecord(record)` — an unsigned/invalid `ok:true` record demotes to ill-typed → fail-closed via the existing taint path. A forged UNSIGNED `ok:true` liveness record must NOT pass the release gate.
- Add a `provenance-invariants`-style STRUCTURAL guard: any NEW `ok:true` ledger reader that omits `verifyRecord` fails the guard (closes the reader-bypass class).

### G2 — ED-231 residual: sign-the-verdict + (B)-lite artifact-binding
- Add the review `verdict` to `SIGNED_FIELDS` (attest-signing.js) so a same-user FAIL→PASS flip invalidates the signature; the release gate verifies the verdict signature.
- (B)-lite: recompute `evidence_sha`/`output_digest` from the REAL persisted review artifact and require a match (raises the forger's cost to also-forge-the-artifact). Named honest-ceiling: same-user FS forgery remains the account boundary (ADR-0025), NOT eliminated — converted mistake-reachable → requires-deliberate-intent.

### I — ED-221 gitignored-ledger durability resolution ADR [doc — front-loadable]
- ADR (`paths.policy/adr/NNNN-...md`) resolving the split-durability class: a committed contract CITES EDs whose targets live in a GITIGNORED on-disk ledger (`.claude/project/memory/enforcement-debt.jsonl`), so on-main self-host false-REDs on cited-ED-must-exist. **RESOLUTION DIRECTION is an α call** — ε drafts options + a recommendation, flags `OPEN_ADR:true`, does NOT unilaterally decide.

## Build order (keystone-first)
A1(+H) → A2 → {B1 → B2, D, F} (consumers of the frozen seam) → C (standing scan, gates the completed graph) → {G1, G2} (ledger/verdict — land before gauntlet-close) → E (cwd tests) → I (ADR, front-loadable/parallel).

## Escalations to α (outside ε authority — surface, do not decide)
- ED-221 durability RESOLUTION direction (OPEN_ADR; ε drafts, α rules).
- WHEN to retire the transition "you are Alpha unless bound" CLAUDE.md phrasing (lifecycle call).
- Any push to treat the scan AS the guarantee (inverts the β spine) or to pull ED-228 lease into Phase-2 (β-ruled Phase-3) — re-litigation escalates.
- If the harness assembles a worker's effective context in a way C cannot DERIVE (forcing a hand-listed surface), the scan's completeness ceiling widens → C's verified_by adds an external expected-surface manifest — that shape is an α escalation.
