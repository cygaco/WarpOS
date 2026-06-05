# ADR 0008 — Dispatch consumers derive from the role-registry keystone (v0.2; registry becomes source-of-truth for role→{provider, effort, build_chain, kind})

**Date:** 2026-06-05
**Status:** accepted
**Class:** B (architectural impact — data model / source-of-truth)

---

## Decision

The dispatch consumers — `catalog.js` (`DEFAULT_PROVIDER_PER_ROLE`, `DEFAULT_EFFORT_PER_ROLE`), `providers.js` (`DEFAULT_AGENT_PROVIDERS`), `dispatch-route-guard.js` (`BUILD_CHAIN_ROLES`), `org-roles.js` (`REMEDIATION_ROLES`), and `state.js` (`GEMINI_ROLES`, `FLAGSHIP_OPENAI_ROLES`) — now **derive their role lists/maps from the role-registry keystone** (`.claude/agents/_org/role-registry.json`) via the dispatch-side reader `scripts/dispatch/registry-roles.js`, instead of hand-maintaining parallel copies. The registry is the **single source of truth** for role→provider, role→effort, build-chain membership, and fixer (kind) classification. The two genuine registry↔literal effort conflicts are reconciled **by editing the registry to current behavior**: `security-reviewer` gains `effort: "high"`; `stub-scaffold` is set to `effort: null` (it was `medium` in the registry, `null` in the live catalog).

## Context

ADR-0007 introduced the role-registry keystone but left the dispatch consumers each hardcoding the registry's data under another name (provider/effort per role, the build-chain set, the gemini/flagship-openai sets, the fixer/remediation set). A role change meant N edits across N files kept in sync by hand — the drift class `scan:role-parity` and `scan:dispatch-routing-parity` exist to police. The v0.2 foundation (`registry-roles.js`, the dispatch-side reader + `deriveOrFallback`) was built and proven for `reviewerGateKeys` (ED-023). This ADR records the **consumer rewire** that makes the registry authoritative for role→provider/effort/build_chain/kind — the v0.2 migration scoped by the `registry-roles.js` `_doc`. (The complementary structural collapse of `org-map.json`'s reporting-line view into the registry is tracked separately as **ED-024** and remains **open** — `role-parity` still reads `org-map.json`; this ADR does not perform that step.)

CUT-SAFETY probes revealed the derivations were **not** bare-faithful to the literals (the DUMP's "proven faithful" held only for `reviewerGateKeys`). Three divergence classes surfaced: (1) the registry is a **superset** — it carries the ADR-0007 manager/director roles the literals omit (they defaulted to claude); (2) the consumers carry **scrapped back-compat aliases** (`builder`, `fixer`, `reviewer`, `compliance`, `qa`, `redteam`) absent from the registry by design (β TRAP-B); (3) **two genuine effort conflicts** (`security-reviewer`, `stub-scaffold`) where the registry and the live catalog disagreed on a role they both name.

## Options considered

1. **Edit the registry to current behavior + derive (chosen):** resolve the two conflicts by aligning the registry to the live catalog values, then derive every consumer ∪ the back-compat shim.
2. **Override-extra in consumers:** keep the registry as-is and patch the conflicting values back in at each consumer.
3. **Leave duplicated:** keep the hand-maintained literals; abandon single-sourcing.

## Decision criteria

| Criterion | Edit registry + derive | Override-extra | Leave duplicated |
|---|---|---|---|
| Single source of truth | high | low | none |
| Simplicity (future reads) | high | low | medium |
| Reversibility | high | high | high |
| Behavior preservation | high | high | high |
| Drift resistance | high | medium | low |

## Why this option won

Single-source is the entire point of the migration; an override-extra recreates the two-source split the migration exists to eliminate (and a future reader can't tell whether the override is intentional). β returned DECIDE (conf 0.86) on option (a): "edit the registry — two edits + one ADR note is the right cost." The two conflicts are low-blast-radius effort fields, reversible and parity-gated, with a clear correct answer (align to current behavior). The registry edits align **to** the live literal (the behavior-preserving direction), not the other way.

**Refined CUT-SAFETY (β-approved, conf 0.88):** for a superset rewire the guarantee is *"no existing route regresses,"* not *"derived == literal."* Verified empirically against git HEAD before each cut: **0 regressions** on all maps; the only additions are the ADR-0007 manager/director keys. Provider additions are behavior-neutral (`getProviderForRole` defaults unlisted → claude, confirmed); effort additions are new keys (`high`) that regress no existing route and are unobservable in practice (managers dispatch in-process, where the reasoning-effort flag is not consulted).

## The two conflict resolutions (β requires these noted explicitly)

- **`security-reviewer`:** registry `effort: null` → **`high`** (matches the live `catalog.DEFAULT_EFFORT_PER_ROLE`). The role routes to gemini (thinking always-on) with a gpt-5.5 `xhigh` second pass; `high` is its primary-pass effort.
- **`stub-scaffold`:** registry `effort: "medium"` → **`null`** (matches the live catalog literal — intentional null; stub regen on Sonnet needs no extra reasoning flag). The registry `_note` previously argued `medium` for signature fidelity; that is preserved as a **deferred behavior-change** (revisit per this ADR if stub quality regresses) — out of scope for a behavior-preserving migration.

## Scope boundaries (deliberately NOT migrated)

- **`providers.DEFAULT_REASONING_EFFORT`** — the env-override + face-suppression layer (`readReasoningEnv(...)`, faces forced to `null`), not a registry-data duplicate; the new roster correctly falls through to the now-registry-derived `catalog.DEFAULT_EFFORT_PER_ROLE`.
- **`state.MINI_OPENAI_ROLES = ["qa"]`** — a pure scrapped alias with no active registry equivalent.
- **`providers.advisor` / `consult`** — W-4 freeform-consult pseudo-roles (not registry roles); preserved in the derived map.

## Risks

1. Registry read failure at module load crashes a consumer (and any hook that requires it).
2. The `dispatch-routing-parity` gate goes **vacuous** once both provider maps derive from one source (TRAP-A).
3. A consumer silently falls back to a stale literal, masking a broken derivation.
4. Scrapped aliases get dropped on a future "active-only" refactor (TRAP-B).

## Mitigations

1. **Guarded requires** in the hook-feeding consumers (`dispatch-route-guard`, `providers`, `org-roles`) — `try { require } catch { → literal }`, fail-open. `catalog` fails loud (CLI data module; hooks that use it do so defensively).
2. **Gate anchored on the registry** (this session's Trap-A fix): `dispatch-routing-parity` now checks each consumer + the doc against the registry (canonical), never derived-vs-derived. Proven non-vacuous by `dispatch-routing-parity.test.js` (9 cases) — and the gate is GREEN with both maps deriving (41 roles).
3. **`deriveOrFallback`** warns loudly to stderr on every fallback (β: a silent fallback masks a broken derivation = lying).
4. **`SCRAPPED_PROVIDER_ALIASES` / `SCRAPPED_EFFORT_ALIASES`** centralised in `registry-roles.js` and UNIONed into each consumer, so the aliases survive until a deliberate one-edit trim.

## Reversal plan

Every consumer retains its prior literal as the `deriveOrFallback` fallback (`LITERAL_*` / the set literals). Reverting = delete the `deriveOrFallback` wrapper and restore the literal as the live value. Cost: one edit per consumer. Reversal signal: a derivation bug that the parity gate + loud fallback don't catch in practice.

## References

- Supersedes nothing; extends ADR-0007 (role-registry keystone).
- Implementation commits this session: `ec3f249` (Trap-A gate anchor), `b29d331` (Tier-1 sets), Tier-3 (this commit).
- `scripts/dispatch/registry-roles.js` (reader + shim), `scripts/checks/dispatch-routing-parity.js` (+`.test.js`).
- Related: **ED-024** (enforcement-debt register) — the `org-map.json` structural / reporting-line collapse; a distinct, still-**open** step this consumer-rewire complements but does not perform.
- Related: **ED-023** (closed) — `reviewerGateKeys` derives from the registry (the proven-faithful precedent for this rewire).
