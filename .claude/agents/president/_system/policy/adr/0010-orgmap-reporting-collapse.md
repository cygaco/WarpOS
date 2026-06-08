# ADR 0010 — Collapse org-map's reporting-line view into the role-registry; role-parity anchors on the registry, witnessed by the on-disk spec tree (ED-024)

**Date:** 2026-06-05
**Status:** accepted
**Class:** B (architectural impact — data model / source-of-truth)

---

## Decision

The **reporting-line structure** of the agent org — *which department/pod a role reports into* and *who its managers are* — is now **single-sourced in the role-registry keystone** (`.claude/agents/_org/role-registry.json`): the `home` / `sub_home` fields and `dispatchable_by` ARE the reporting structure. `org-map.json`'s `domains{}` block (director → leads → specialists/builders, with per-role `role`/`agent`) is **retired as the structural source**.

The live structural consumers are repointed off `domains{}` and onto the registry:

- `scripts/checks/role-parity-scan.js` (`scan:role-parity`) — now asserts the registry's reporting structure against an **independent witness** (see below) instead of reading `org-map.json`'s roster for the role universe.
- `scripts/dispatch/org-roles.js` — `domainRoles()` derives from registry `home ∈ {product, engineering, growth}`; `buildChainDoerRoles()` derives its build-chain doers from registry `build_chain:true` (gauntlet members stay org-map-sourced — the review-gauntlet roster is org-map's own review-orchestration view, not a reporting line).

To keep `scan:role-parity` **non-vacuous** after it reads the same registry it validates (the **Trap-A** vacuity trap), the gate checks the registry's `home`/`sub_home` against the **on-disk spec tree** (`scripts/checks/role-parity-scan.js#scanSpecTree` + `#evaluateReportingStructure`): the department directory under `.claude/agents/` is the role's `home`, the pod sub-directory is its `sub_home`, and the spec's frontmatter `name:` is the role id. The spec tree is independently authored (a human files each spec and writes its frontmatter) and is **not derived from the registry**, so the check still bites when the registry's reporting fields drift from where the specs physically live. Proven by `role-parity.test.js` (home-drift / sub_home-drift / no-spec-on-disk bite cases + a live real-tree integration assertion).

## Context

ADR-0007 created the role-registry keystone (the single source of role identity/model/authority) but left the **structural / reporting view** in `org-map.json`'s `domains{}`, consumed by `role-parity` + `org-roles` "until the v0.2 structural migration folds them in." ADR-0008 collapsed the **dispatch** consumers (provider/effort/build_chain/kind) onto the registry and explicitly deferred this **structural** collapse to ED-024.

Two facts made the deferral untenable as a *source of truth* yet constrained the collapse shape:

1. **`domains{}` had silently rotted.** Of its 12 declared domain roles, **7 carry pre-ADR-0007 names that no longer exist** in the registry (`director-of-marketing`, `director-of-product-management`, `growth-lead`, `product-designer`, `qa-lead`, `research-insight-lead`, `web-conversion-designer`), and it **omits 28 of the 33 live roles** (every lead, the entire security pod, the workers, the faces). `role-parity` passed only because its governance check (#4) unions the registry roster — the org-map roster was already dead weight as a structural source. (β flagged exactly this in TRACKER E6: "a harmless stale secondary view.")
2. **`routing{}` and `gauntlets{}` still reference those stale roster names** (`routing.research_insight.owner_role = "research-insight-lead"`, etc.), and `scan:domain-routing` resolves `routing.*.owner_role` *against* the `domains{}` roster. **Physically deleting the roster would break `scan:domain-routing`** — and fixing that means renaming the `routing` role values, which is **E8's fenced stale-ref territory** (the E6 brief: "do NOT touch `routing`; E8 owns stale-ref cleanup").

So the collapse had to move **structural authority** to the registry now, without physically removing the `domains{}` husk (E8 removes it together with the routing-role rename).

## Options considered

1. **Authority-move (chosen).** Repoint every *live* structural consumer (`role-parity`, `org-roles.domainRoles`/`buildChainDoerRoles`) to derive from the registry, witnessed by the spec tree. Demote `domains{}` to an explicitly-labelled non-authoritative legacy husk (`_domains_superseded`), left physically intact so `routing`/`gauntlets`/`scan:domain-routing` keep resolving until E8.
2. **Full physical removal of `domains{}`.** Blocked by the E8 fence — it forces the `routing` role-name rename into E6 (out of scope, and it would regress `scan:domain-routing` mid-flight).
3. **Generated/derived `domains{}` view** (regenerate the block from the registry by `home`). Would regenerate `domains.growth` from the registry's `home:growth`, which **breaks `routing`'s `domain:"marketing"`** reference + `scan:domain-routing`'s `dangling-domain` check — again forcing the fenced E8 rename.
4. **Defer ED-024 entirely** behind E8. Leaves `org-roles.domainRoles()` deriving the role universe from stale data for another cycle — the exact drift ED-024 exists to end.

## Decision criteria

| Criterion | Authority-move | Full removal | Generated view | Defer to E8 |
|---|---|---|---|---|
| Registry is the single structural source (live consumers) | high | high | high | none |
| Respects the E8 routing/stale-ref fence | high | none | none | high |
| Zero regression this sprint | high | low | low | high |
| `role-parity` stays non-vacuous (Trap-A) | high | high | high | n/a |
| Eliminates stale-data derivation now | high | high | high | none |
| Reversibility | high | medium | medium | high |

## Why this option won

Authority-move is the **only** option that achieves "the registry is the single structural source" for every live enforcer/deriver **and** respects the E8 fence **and** ships zero-regression. The stale `domains{}` roster stops being read by anything structural; it survives only as an honestly-labelled husk that `routing`/`gauntlets` still lean on, with a one-line pointer to E8 for its physical removal. The independent **spec-tree witness** is what makes the registry-anchored `role-parity` legitimate rather than tautological — the same discipline ADR-0008 established for `scan:dispatch-routing-parity` (anchor on the registry; check it against an independent, non-derived witness — there the human doc + loud-fallback consumers; here the file tree).

## The Trap-A witness (the load-bearing review point)

- **Risk:** once `role-parity` reads the registry for the reporting structure, checking the registry against itself is a vacuous green (a false gate).
- **Witness:** the on-disk spec tree. `scanSpecTree` walks `.claude/agents/`, mapping each spec's `{department-dir → home, pod-dir → sub_home, frontmatter name → role id}`. `evaluateReportingStructure({reg, specTree})` then rejects `home-drift` (registry `home` ≠ the department the spec lives in), `sub_home-drift` (registry pod ≠ the spec's pod dir), and `no-spec-on-disk` (a registry role with no backing spec). None of these is derived from the registry → the check stays meaningful after the collapse.
- **Non-vacuity proof:** `role-parity.test.js` adds 7 cases — a positive, 4 bite cases (home-drift, sub_home-drift, no-spec-on-disk, sub_home-vs-none), a no-false-positive (exempt seam), and a **live real-tree integration** assertion that fails the moment the real registry's reporting structure diverges from the real `.claude/agents/` tree (and asserts the witness saw ≥30 specs, so an empty-tree vacuous pass is itself caught). Manually verified end-to-end: breaking `product-lead.home` product→engineering makes `scan:role-parity` exit 1 with a precise `home-drift` error; restoring it returns green.

## Scope boundaries (deliberately NOT done — fenced to E8)

- The `domains{}` block is **not physically removed** and its stale role names are **not renamed**. `routing{}`, `gauntlets{}`, `claims_boundary{}` are **untouched**.
- `scan:domain-routing` is **unchanged** — it still validates `routing` against the (retained) `domains{}` husk. E8 removes the husk and renames the routing roles together, then `scan:domain-routing`'s role universe can also move to the registry.
- The registry's `current_spec` / `spec` / `was` fields are **not touched** (E8 owns those stale refs).

## Risks

1. `role-parity` reading the registry it validates goes vacuous (**Trap-A**).
2. `org-roles` registry-derivation throws at load and breaks the team-guard hook.
3. The retained `domains{}` husk is mistaken for live structure and re-grows a consumer.
4. Future readers can't tell the husk is dead.

## Mitigations

1. **Spec-tree witness** (above), proven non-vacuous by bite-tests + a live integration assertion + a manual break/restore.
2. **`deriveOrFallback` loud fallback** in `org-roles` (the v0.2 consumer shape): registry derive failure falls back to the prior org-map roster and **warns loudly to stderr** — never silent. Guarded `require` keeps the team-guard hook fail-open.
3. **Explicit `_domains_superseded` marker** on the block + a `Do NOT re-add a structural consumer that reads domains{} rosters` line in `_role_registry_note`; `role-parity`'s witness would catch a registry/tree divergence a rogue consumer introduced.
4. **CUT-SAFETY assertions** in `scripts/dispatch/test-registry-roles.js` (6 new): `buildChainDoerRoles ⊇` the registry build_chain set (security pod + fixers now gated), gauntlet reviewers still folded in, `domainRoles` carries the LIVE leads and **no** stale pre-rename name and excludes faces/`_system`, and `gammaOnlyTypes` gates every registry build-chain doer (no gate hole).

## Reversal plan

`org-roles` retains the org-map roster as its `deriveOrFallback` fallback — reverting a derivation is deleting the wrapper and restoring the org-map walk. `role-parity`'s witness path is additive (the org-map-internal routing check #3 is unchanged); reverting is removing the `evaluateReportingStructure` call from `validateRegistry`. The `domains{}` husk is untouched, so nothing to restore there. Reversal signal: a spec-tree witness false-positive in practice (e.g. a sanctioned role whose spec legitimately lives outside its `home` dir — handled today by the `exempt` seam, currently empty).

## References

- Extends ADR-0007 (role-registry keystone) and ADR-0008 (dispatch-consumer derivation); performs the **structural / reporting-line** collapse ADR-0008 explicitly deferred as **ED-024**.
- Mirrors ADR-0008's **Trap-A** discipline (registry anchor + independent non-derived witness) for `scan:dispatch-routing-parity`, applied here to `scan:role-parity`.
- Implementation: `scripts/checks/role-parity-scan.js` (`scanSpecTree` + `evaluateReportingStructure`, wired into `validateRegistry`) + `role-parity.test.js`; `scripts/dispatch/org-roles.js` (`domainRoles`/`buildChainDoerRoles` registry-derived) + `scripts/dispatch/test-registry-roles.js`; `org-map.json` (`_domains_superseded` + `_role_registry_note`) + `role-registry.json` (`_doc`/`supersedes_note`).
- Related: **E8** (ED-026 stale-ref cleanup) — physically removes the `domains{}` husk and renames the `routing`/`gauntlets` stale role names; this ADR's authority-move is the prerequisite that makes that removal safe (no live structural consumer reads the husk).
