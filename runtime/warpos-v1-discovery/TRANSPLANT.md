# WarpOS-v1 Fresh-Repo Transplant Manifest
**2026-07-09** · Generated from the exhaustive disk↔capsule complement (git ls-files vs 0.17.0 capsule, per-bucket), the ownership manifest, and the discovery corpus. **Method note:** curated probes missed whole categories; this manifest is complement-derived — every tracked bucket is accounted for below. Verbs: **CARRY** (copy with tests, as-is) · **CARRY+EVOLVE** (copy, then modify per backlog) · **REBUILD** (fresh implementation) · **SEED** (content carried as data) · **LEAVE** (stays in the archive repo).

## A. The operator-named systems — all verified present & carried

| System | Files (verified) | Verb | Notes |
|---|---|---|---|
| Skills library | 231/231 in capsule | CARRY+EVOLVE | prune 7 aliases + 8 vaporware epics; promote commit:land/scan:full/session:checkpoint to CLIs; mandatory frontmatter |
| PATHS system | engine 4/4 + registry source + lint + gate | CARRY+EVOLVE | add orphan-key detector, missing root keys (trackers/, migrations/, _guides/, _knowledge/, _planning/), repoint literal writers (dispatchLocks/deaths), fold LEGACY_FALLBACK into build, git-hook+CI triggers |
| Requirement templates & engine | scripts/requirements 12/12 + _warpos templates + requirement-format-guard | CARRY | plus `_requirements/07-testing/recurring-bug-classes.json` — SEED (currently misclassified `project`; it is framework scar tissue) |
| Agent definitions + policies | 88/88: all dept specs, role-registry, dispatch-contract, decision-policy.md, judgement-model*.md, beta-source-data, agent-dispatch-guide, principles | CARRY+EVOLVE | typed RoleSpec migration (neutral core/binding/harness blocks); no-alpha-poison check |
| Lastmile | scripts/bootstrap/lastmile 23/23 (orchestrate, 6 phases, 8 modules, lib, tests) | CARRY | |
| _guides | 25/25 + registry.json + guide-integration map | CARRY | wire guides-coverage into the standing scan (known liveness gap) |
| _knowledge | 72/72 + knowledge-integration map | CARRY | |
| _planning | 56 files — NOT in capsule (project-layer, by design) | SEED | epics (E-DISPATCH-*, E-PRODUCT-FOUNDATION), README conventions, decisions; ingest/ LEAVE (raw corpus stays in archive) |

## B. Engines & enforcement (the Solid transplants)

| System | Verb | Notes |
|---|---|---|
| Dispatch kernel (scripts/dispatch 43 + 4 root wrappers) | CARRY+EVOLVE | formalize WorkOrder/Envelope at wrapper boundary; one provider registry; +agy adapter |
| Hooks (97 + hooks.registry.json + settings compiler) | CARRY+EVOLVE | extract embedded guard logic to standalone validators; git-hook/CI re-triggers |
| Checks estate (125) + bite-tests | CARRY+EVOLVE | checks.registry.json; wire 14 orphans; add 43 missing bite-tests |
| tests/regression (127) + scripts/testsuite + fixtures (23) + patterns (6) | CARRY | standing runner (none exists — the silent-rot fix) |
| Sprint engine (scripts/sprint 43) | CARRY+EVOLVE | re-point at SprintRoom/leases; β record-required gate at write chokepoint |
| Trackers (validator + init + 10 templates) | CARRY+EVOLVE | git-fidelity oracle; evidence-truth check |
| WarpOS distribution (scripts/warpos 59 + capsule machinery + migrations/ 9) | CARRY+EVOLVE | Truth/Release pack items; fix the ship-gaps below |
| Schemas (32) + scripts/contracts fixtures | CARRY | freeze the 11 /v0 contracts |
| Bootstrap spinup/canon/scaffold (6+6+5) | CARRY | scaffold is a confirmed ship-gap today — see D |
| Portfolio (16) + scripts/products (5) | CARRY | + fleet-reconcile enforcer |
| Panels/admin/cockpit GUIs + turbo (5) + research (8) + learn/sleep + models/etc/arbitration | CARRY | small; models/etc/arbitration are ship-gaps today |
| Reference docs (reasoning-frameworks, operational-loop + 25 more) | CARRY | |
| Memory stores (learnings 126, enforcement-debt 61, recurring-issues, waivers) | SEED | carried as founding data; promotion gate makes them live again |
| Root docs (AGENTS.md, CODEX.md, AGENT-STRUCTURE.md, PROJECT.md) | REBUILD via instruction compiler | CLAUDE.md becomes thin bootloader; content preserved as compiler source |
| WarpOS-v1 packet + this discovery corpus | SEED | founding documents of the new repo |

## C. LEAVE in the archive (do not carry)

runtime/ + .claude/runtime scratch (all) · .warpos/ (11,244 files) · .claude/project/sprint state (2,379 — zombie sprints, old checkpoints; ACTIVE sprint state only if a sprint is live at cutover) · events.jsonl 17MB monolith (logging v2 starts clean; archive queryable in old repo) · _docs research corpus (116 — archive; ingest selectively) · _reports (24) · handoffs (97) · gamma transcripts · drift-*.js suite · ~30 orphan one-off scripts · scripts/one-off (13) · analyze-run12*, delta run-analysis one-offs · deprecated alias skills · TRACKER/ROADMAP content (fresh trackers minted; old ones referenced, not imported) · framework/releases 0.1.0–0.17.0 capsules (archive repo IS the release history; v1 starts at 1.0.0-alpha)

## D. CONFIRMED SHIP-GAPS found during this audit (fix in old repo now or at transplant)

Ownership manifest says `framework` (must ship) but the 0.17.0 capsule does NOT contain:
1. `_warpos/settings/defaults.json` — settings compiler Layer 1; downstream cannot recompile settings
2. `scripts/scaffold/` (5) — founder-panel/app materializer called by spinup+lastmile
3. `scripts/testsuite/` (3) — bug-class regression runner
4. `migrations/` (9) — the update engine's migrations
5. `tests/regression/` (127) — the entire regression corpus
6. `scripts/contracts/` (8), `scripts/models/` (2), `scripts/etc/` (4)
7. Root scripts: `warp-setup.js` (the installer!), `frontmatter.js`, `generate-skill-catalog.js`, `regen-maps.js` (note: `generate-maps.js` ships — verify which is canonical)
8. `recurring-bug-classes.json` — misclassified `project`; reclassify framework

**Root cause (mechanical):** ship-coverage validates the shipping manifest against disk; manifest/validate.js validates the ownership manifest against disk; **nothing reconciles the two against each other** (framework-owned ⊆ shipped is unchecked). New enforcer for the check registry: `cross-manifest-reconcile` — every ownership-manifest `framework` path must appear in the shipping manifest or carry an explicit no-ship reason. This retires the "downstream always missing something" class at its root.

## E. Why the earlier audit missed the mark (method learning)

Curated probes (~25 hand-picked patterns) instead of computing the complement; anchored on the capsule's own kind-counts as coverage evidence; treated the operator's examples as the checklist instead of enumerating the universe first. **Rule for the rebuild epic: completeness claims must be complement-derived (inventory A minus inventory B, all buckets accounted), never probe-derived.** Same class as the tracker internal-validity trap — a probe list is internally valid and externally blind.
