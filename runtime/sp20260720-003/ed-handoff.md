# ED / ledger hand-off — SP-20260720-003 (for α to append to the canonical, gitignored ledgers at merge)

The memory ledgers (.claude/project/memory/*.jsonl, .claude/agents/president/_system/beta/events.jsonl)
are GITIGNORED — they do NOT ride the branch merge. α owns the canonical copies (Epsilon also writes
enforcement-debt.jsonl this session). Below are the exact records to append; α assigns any NEW ED id to
avoid collision with the Phase-4 ED work.

## enforcement-debt.jsonl

### ED-244 — CLOSE (reference the new enforcer)
```json
{"id":"ED-244","status":"closed","closure_receipt":"SP-20260720-003","enforcer":"scripts/checks/security-binding-lane.js — Tooth-A panel binding invariant (P1 servedModelUnverifiableFromRecord(antigravity)===true, P2 panel-2family floor >=2 DISTINCT verifiable families, P3 passesOf has a verifiable pass), ED-230-gated fail-closed. β DECIDE B/0.90 R-244 DISCHARGED; gauntlet-hardened (qa-reviewer R-1). Assert-only closure — NO source mutation (DoE+β confirmed).","closed_ts":"2026-07-20"}
```

### AC-17 — NEW ED (meta-lockstep flip-criterion, self-terminating)
```json
{"id":"ED-<assign>","policy":"meta-lockstep (SP-20260720-003 D1) is wired REPORT-ONLY in scan:full. Flip to BLOCKING after ONE clean scan:full cycle (DoE: novel symmetry algorithm can over-fire; report-only-first de-risks). Owner: WarpOS-1.0 enforcement track (SP-20260720-003).","source":"SP-20260720-003 AC-17 (product-lead rider) — a report-only enforcer with no tracked flip-trigger is a hollow-ladder rung.","severity":"low","status":"open","trigger":"one clean scan:full cycle with meta-lockstep green → set report_only false; regression-lock via meta-lockstep.test.js","note":"self-terminating — closes when the flip lands.","ts":"2026-07-20"}
```

### DELTA follow-up — NEW ED (latent ED-244 exposure my enforcer surfaced)
```json
{"id":"ED-<assign>","policy":"delta-final-gauntlet.js single-passes security-reviewer via dispatch-agent (dynamic ROLES list), bypassing dispatch-review's panel gate. LATENT ED-244 exposure: its verdict would bind on the unverifiable agy lane WHEN agy goes live. SAFE TODAY — agy blocked-advisory (reaps) + delta-aggregate-reviews treats a dispatch-failed lane as non-pass (fail-closed).","source":"SP-20260720-003 gauntlet — qa-reviewer surfaced it via the AC-14 creep-back guard.","severity":"medium","status":"open","reopen_trigger":"ED-230 closure / agy activation — the EXACT moment the exposure goes live, and the SAME trigger security-binding-lane relaxes Tooth-A on (name the coupling: enforcer-stops-enforcing == exposure-goes-live).","missing_enforcer":"route delta's security-reviewer through dispatch-review's panel (multi-pass, panel-gated) when agy unblocks. Currently allowlisted in security-binding-lane.js CREEP_BACK_ALLOWLIST with this reason; the guard flags any NEW single-pass security-reviewer caller.","plan_pointer":"_planning/warpos-1.0-plan/GEMINI-DEEPCLEAN-AND-AGY-MIGRATION.md § Part 3 (pointer added).","ts":"2026-07-20"}
```

### DISPATCH-REVIEW infra bug — NEW ED (α asked this ride the same batch)
```json
{"id":"ED-<assign>","policy":"dispatch-review.js dispatches the CLAUDE third_pass of a cross_provider_reviewer (security-reviewer) as shape 'subprocess-claude' → dispatch_contract_violation ('subprocess-claude is not allowed for role security-reviewer (class cross_provider_reviewer); allowed: subprocess-cross-provider'). The claude hunter lane's one legal shape is IN-PROCESS (ADR-0022 security_claude_hunter via synchronous Agent + record-inprocess), not subprocess-claude — so dispatch-review's multi-pass security-reviewer claude lane cannot run via the subprocess path.","source":"SP-20260720-003 gauntlet R-1 — security-reviewer third_pass lane errored on this.","severity":"medium","status":"open","missing_enforcer":"dispatch-review must route the claude pass of a cross_provider_reviewer via the in-process hunter shape (or skip+record honestly), never subprocess-claude. Enforcement-track ticket.","ts":"2026-07-20"}
```

## recurring-issues.jsonl

### RI-008 — CLOSE
```json
{"id":"RI-008","status":"closed","permanent_fix":"scripts/checks/security-binding-lane.js Tooth-B — alias-inclusive DEFAULT_PROVIDER consistency (catalog-LITERAL vs providers-LITERAL redteam agreement + getProviderForRole(redteam)===getProviderForRole(security-reviewer) normalization identity) + model-chain registry-name drift. Closes the alias-key coverage gap the registry-NAME-only loop missed.","last_seen":"2026-07-20T00:00:00.000Z"}
```
NOTE: Tooth-B(1)'s raw-literal comparison gets real teeth once the α-gated LITERAL exports land (below);
until then it falls back to the derived maps (tautological — the named residual). Tooth-B(2) + model-chain
cover RI-008 in the interim.

## α-GATED SOURCE DIFF (route-through-α, additive export only — no behavior change)

catalog.js `module.exports`: add `LITERAL_DEFAULT_PROVIDER_PER_ROLE,`
providers.js `module.exports`: add `LITERAL_DEFAULT_AGENT_PROVIDERS,`

Purpose: security-binding-lane Tooth-B(1) must compare the two INDEPENDENT raw literal maps (catalog HARDCODES
redteam=openai; providers' literal spreads SCRAPPED_PROVIDER_ALIASES). The DERIVED maps both resolve the redteam
alias from the shared SCRAPPED_PROVIDER_ALIASES (catalog.js:362) and so can never diverge (qa-caught tautology).
security-binding-lane.js already reads `catalog.LITERAL_DEFAULT_PROVIDER_PER_ROLE || <derived>` (forward-compatible).
