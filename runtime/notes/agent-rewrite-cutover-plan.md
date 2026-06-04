# Agent-System Rewrite — Cutover Plan (session 2026-06-04)

**Read with:** ADR-0007 (`.claude/agents/00-alex/.system/policy/adr/0007-agent-system-org-rewrite.md`), the role registry (`.claude/agents/03-managers/_org/role-registry.json`), and `runtime/notes/agent-system-rewrite-plan.md`. This note captures the **session-specific state + the precise remaining cutover steps + the gotchas discovered this session** — the things not in those docs.

## State (end of 2026-06-04 build session)

**The rewrite's load-bearing half is DONE + LIVE + pushed to `origin/june-2`:**
- `4a13493` — foundation: ADR-0007 + role-registry keystone (gate-enforced) + effort policy.
- `3528d11` — the **25-spec department tree** (Tier-3 ports verbatim) + the **dispatch-context-lever enforcer** (`dispatch-route-guard` Agent gate) + γ's WI-39.
- `7ec4d97` — **dispatch wiring**: the new roster is in `catalog.js`/`providers.js`/`state.js`/the dispatch-guide doc-table; **verified live** (the resolver routes `security-reviewer`→gemini@engineering/security/reviewer.md, `qa-reviewer`→gpt-5.5@product/quality/qa-reviewer.md, etc.). Gates green: role-parity (+registry governance +validation), dispatch-routing-parity (29 roles), bite-test 13/13.

**Mode = COEXISTENCE.** Old tree (`00-alex/`, `01-adhoc/`, `02-oneshot/`, `03-managers/`) + new tree (`president/ product/ engineering/ growth/ _system/`) BOTH exist + BOTH work. Nothing is broken. The cutover deletes the old ONLY when `/scan:full` is green.

## What's BUILT (new tree, 25 new specs)
- `president/epsilon.md` (NEW ε sprint face).
- `engineering/{frontend,backend,security}/` — each: `{frontend-,backend-,security-}lead.md` + `builder.md` + `reviewer.md` + `fixer.md` (12).
- `product/design-lead.md` · `product/quality-lead.md` · `product/quality/{qa-reviewer,design-quality,visual-review,test-runner}.md` (6).
- `growth/{director-of-growth,research-lead,conversion-lead,marketing-lead}.md` (4).
- `_system/{learner,stub-scaffold}.md` (2).

## What's NOT yet moved (the "live"/KEEP specs — REHOME at cutover, do NOT rewrite)
These roles are `status: live` in the registry — their CURRENT specs are fine; they just need MOVING (git mv), and that move is a TIER-2 hard-break risk (startup path reads), so it was deferred to cutover:
- **The 4 faces** `00-alex/{alpha,beta,gamma,delta}.md` → `president/` + the `00-alex/.system/` dir → `president/.system/`. **GOTCHA:** `gamma.md`/`delta.md` read `01-adhoc/`/`02-oneshot/` literal paths on startup, and `decision-policy.md` is read by β every invocation — these path reads must be repointed IN THE SAME COMMIT as the move (TIER-2).
- `03-managers/director-of-product.md` → `product/` · `03-managers/director-of-engineering.md` → `engineering/` · `03-managers/copy-lead.md` → `growth/` (these 3 were NOT re-created — they're KEEP; move them).

## Cutover steps (in order — each behind the gates)
1. **role-aliases** (`scripts/hooks/lib/role-aliases.js`): add old→new for the 1:1 renames ONLY (safe NOW that the new roles are in catalog): `product-designer→design-lead`, `director-of-qa→quality-lead`, `research-insight-lead→research-lead`, `director-of-marketing→director-of-growth`, `growth-lead→marketing-lead`, `web-conversion-designer→conversion-lead`, `redteam→security-reviewer`, `qa→qa-reviewer`, `compliance→qa-reviewer`, `req-reviewer→qa-reviewer`. (Splits `reviewer`/`builder`/`fixer` are NOT 1:1 — leave un-aliased; the conducting face passes pod context.) **Watch:** aliasing `qa→qa-reviewer` changes qa's model mini→flagship; intended at cutover, not before.
2. **gauntlet-verify `--roles`** — `gamma.md:249` + `delta.md:54` hardcode `reviewer,compliance,qa,redteam`. Rewire to the new gauntlet roster (pod reviewers + qa-reviewer + security-reviewer) when the conducting faces are updated. The #1 TIER-1 silent-false-green — update `gauntlet-verify.js` + both callers ATOMICALLY.
3. **Hook hardcodes** — `scope-contract-guard.js` (build-chain list + the resolveRole patterns) + `store-validator.js` (gate dimensions `reviewer/security/compliance` — these are dimension labels, can PERSIST; the plan's "heartbeat.agent enum" claim is OVERSTATED — verified, no such enum). Rewire to derive from the registry.
4. **Sweep** the ~25 real old-role refs (the 234 `redteam` occurrences are mostly generated manifests / historical notes / sprint templates — the genuinely-must-edit code/specs are ~25: the 2 redteam orchestrator specs, the 2 adhoc/oneshot protocols, `state.js GEMINI_ROLES` (done-ish), `provider-trace.js`, `delta-gauntlet-watcher/-final-gauntlet.js`, the dispatch guide, the sprint skills). Grep the OLD literal everywhere (refactor-hygiene).
5. **Extend `scan:role-parity` to scan HOOKS** for hardcoded role literals (after step 3 fixes them — else it reds). Rebuild hooks (`scripts/hooks/build.js`) + `node scripts/hooks/test.js --all` GREEN.
6. **REHOME** the KEEP specs (faces + 3 directors/copy-lead) per the section above, repointing startup path reads atomically.
7. **Regen both manifests** + **regen every map** (`/maps:all --regenerate` — they're pre-rewrite) + run **`/scan:full`** (wire in γ's 2 canon scans first — `canon-no-unfilled-tokens.js` + `canon-type-coverage.js`, contracts below). Converge — re-run, don't single-pass.
8. **DELETE the old tree** (`00-alex/`, `01-adhoc/`, `02-oneshot/`, `03-managers/`) — ONLY when `/scan:full` is GREEN. Then the every-inch checklist (ADR-0007 / rewrite-plan §4).

## γ's canon scan contracts (wire into /scan:full at step 7)
- `scripts/checks/canon-no-unfilled-tokens.js [--dir <canonical-dir>] [--json] [--strict-needs-input]` — zero raw `{{token}}`; exit 0/1/2 (2=fail-closed on missing/empty/unreadable).
- `scripts/checks/canon-type-coverage.js [--dir <canonical-dir>] [--json]` — the 12-type canon manifest (8 narrative incl. DATA_AND_ACCOUNTS + 4 structured) all have templates; with --dir, all required types emitted; exit 0/1/2.

## Deferred / open (batched for the operator)
- **WI-25** — cockpit (Master Console) research-default: PRODUCT + SPEND decision for the operator. WI-38 de-fanged it (research-off no longer ships garbage). Do NOT flip the global default (surprise spend). Options: cockpit-scoped profile (opts research ON, scoped) vs leave-off + per-run `--research`.
- **Tier-4 gaps** (Task #6) — route the manager/judgment layer + `manager-consult` telemetry; β real-per-consult-reasoning + UNREASONED/abstain honesty (`scan:sprint-beta-honesty` as a release gate — β model-bump alone does NOT fix P-043); the adhoc dispatcher-can't-override-FAIL gate; the cheapest win = wire the EXISTING `scripts/checks/design-quality-gate.js` into γ/δ (W1, built-but-never-called).
- **Skill hook-in registry** (Task #7, §8) — ~20 skills resolve agents at call-time from the registry; `scan:skill-hook-coverage`.
- **ADR-0007 re-ratify items** — all-persistent residency + DoE-as-orchestrator (confirm with η + β at the Phase-D sprint-mode build).
- **γ's C1 tail** — WI-22/WI-29 (mechanical, in flight), then WG-26/WG-29 (lastmile self-hosted).
