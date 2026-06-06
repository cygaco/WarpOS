<!-- EPIC TRACKER — spec §22. Linked from ../../TRACKER.md. Template: ../templates/EPIC_TEMPLATE.md
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# E-CONTENT-DELIVERY-001 — Content-Delivery Integrity & Ownership-Pattern Realignment

- **Epic label and number:** E-CONTENT-DELIVERY-001
- **Title:** Content-Delivery Integrity & Ownership-Pattern Realignment
- **Owner:** President Agent
- **Parent roadmap area:** [../../ROADMAP.md](../../ROADMAP.md) § Epics → Active epics (detail: the `🟡 0.16.0` deprecated-milestone block)
- **Goal:** Make "downstream is always missing something" stop being a recurring class — the shipping manifest provably covers the ownership manifest, every `seeded_from` pointer resolves, seed zones arrive seeded-with-provenance, and update restores the install skeleton.
- **Background:** WarpOS has two manifests that drifted with nothing gating reconciliation — `_warpos/MANIFEST.json` (authoritative ownership taxonomy: owner=framework|generated|project|runtime) vs `.claude/framework-manifest.json` (what install + update actually ship). `framework/templates/*` shipped to 0 consumers silently under green gates. SP-20260525-024 added the essential-roots patch (`framework/templates` + `hooks.registry` → ASSET_DIRS, `scaffoldProduct` + `populateWarposMirror` into `update.js`, `scripts/checks/warpos-ship-coverage.js` enforcer). This epic makes reconciliation structural + exhaustive.
- **Scope:** Build `_warpos/templates/` + `_warpos/BASELINE/` in canonical; migrate `framework/templates` → `_warpos/templates`; fix the dangling `seeded_from` at `scripts/warpos/manifest/build.js:196-202`; extend `populate-source.js` to seed `_requirements/` / `_docs/` with provenance; harden `warpos-ship-coverage.js` to assert every `seeded_from` resolves + curate ~218 owner=framework dev-tooling paths into a reviewed KNOWN_NOT_SHIPPED allowlist (exhaustive, not essential-only); add an install-matrix update-parity assertion (every REQUIRED_DIR present post-update).
- **Out of scope:** The executable consumer-contract gate (E-GOLDEN-FLOW-001); channels (E-STABLE-CHANNEL-001).
- **Current state:** Active
- **Percent completion:** ~50% — SP-20260525-024 shipped the essential-roots patch (`framework/templates` + `hooks.registry` → ASSET_DIRS, `scaffoldProduct` + `populateWarposMirror` into `update.js`) plus the `warpos-ship-coverage.js` enforcer. The structural/exhaustive reconciliation, the `_warpos/templates` migration, and the install-matrix update parity remain. Conservative per §20.

## Definition of Done
<!-- Concrete, checkable criteria. Nothing reaches 100% until all are satisfied + evidenced (§20, §27). -->
- [ ] `_warpos/templates/` + `_warpos/BASELINE/` exist; `framework/templates` migrated (no orphaned copy)
- [ ] All `seeded_from` pointers resolve, verified by hardened ship-coverage exiting 0 with zero unallowlisted owner=framework paths
- [ ] Fresh install seeds `_requirements/` / `_docs/` with provenance, not bare `.gitkeep`
- [ ] `test-install-matrix.js` existing_install_upgrade asserts every REQUIRED_DIR present post-update

## Related definitions
<!-- Terms from ../../TRACKER.md §Definitions that govern this epic -->
- Verification — see ../../TRACKER.md
- Path — see ../../TRACKER.md
- Wiring — see ../../TRACKER.md

## Related sprints
<!-- Link each sprint tracker in /trackers/sprints/ -->
- Pattern-realignment-to-SP-20260522-001 — Planned — realign the content-delivery path to the SP-20260522-001 ownership/shipping taxonomy (named in the 0.16.0 block)
- Ship-coverage-hardening — Planned — make `warpos-ship-coverage.js` assert every `seeded_from` resolves + curate the exhaustive KNOWN_NOT_SHIPPED allowlist (named in the 0.16.0 block)
- Install-matrix-update-parity — Planned — add the update-parity assertion (every REQUIRED_DIR present post-update) to `test-install-matrix.js` (named in the 0.16.0 block)

## Dependencies
- The ownership/shipping manifest taxonomy from E-MANIFEST-ARCH-001 (SP-20260522-001) — Completed (not blocking)

## Blockers
- None currently recorded.

## Risks
- Curating ~218 owner=framework paths into a KNOWN_NOT_SHIPPED allowlist by hand risks allowlisting a path that SHOULD ship (re-creating the silent-drop class) — likelihood: medium · impact: high · mitigation: review each entry against the ownership taxonomy and make the allowlist itself reviewed + diffable, not a blanket suppression.
- Migrating `framework/templates` → `_warpos/templates` while install/update still reference the old root could ship 0 templates again during the cutover — likelihood: medium · impact: high · mitigation: repoint ASSET_DIRS + the regen path in the same change and verify via ship-coverage before deleting the old copy.

## Decisions
- None currently recorded.

## Open questions
- Absorbed open item (homed here by sprint T5 from the deprecated 0.18.1 reconcile block): **E6** — product-overlay path registry (`.claude/paths.local.json` deep-merged by `scripts/paths/build.js`, or an `owner:project` section `/warp:update` never overwrites) so product-specific path keys survive framework updates without MERGE_CONFLICT + honesty-drift each update *(dreamteam W-9)*. Decide whether E6 lands in this epic or a dedicated paths-overlay sprint when activated.

## Session log
<!-- Append-only (§24). One entry per meaningful session; use SESSION_LOG_TEMPLATE.md fields. -->
### 2026-06-06 — Session 2026-06-06-t5-roadmap-to-epics
- Agent(s): President Agent (via systems builder) · Mode: sprint
- Work performed: Created this epic tracker file during the T5 roadmap→epic migration of `agentic_os_tracker_system_improvements.md` (§29) — captured the content-delivery-integrity work from the deprecated `🟡 0.16.0` milestone block as an enforced epic.
- Files changed: trackers/epics/E-CONTENT-DELIVERY-001-content-delivery-integrity.md
- Paths changed: none · Wirings changed: none (authoring only; no git/regen/mode-wiring this session)
- Decisions: none this session.
- Issues discovered: none this session.
- Definitions added/changed: None
- State change: (new) → Active · Completion change: 0% → ~50%
- Verification performed: Confirmed this epic file did not previously exist before authoring; structure matched against ../templates/EPIC_TEMPLATE.md.
- Validation run: `node scripts/trackers/validate.js` · Validation result: PASS (exit 0)
- Next action: build `_warpos/templates/` + `_warpos/BASELINE/`; migrate `framework/templates`; fix the dangling `seeded_from`; harden ship-coverage to exhaustive.
- Evidence/references: ../../ROADMAP.md § Epics → Active epics (`🟡 0.16.0` block); SP-20260525-024 (essential-roots patch); scripts/checks/warpos-ship-coverage.js.

## Change log
<!-- §25 -->
### 2026-06-06 — Epic created during T5 roadmap→epic migration (President Agent via systems builder)
- Changed: Created E-CONTENT-DELIVERY-001 — Content-Delivery Integrity & Ownership-Pattern Realignment, at Active / ~50%, from the deprecated `🟡 0.16.0` milestone block.
- Reason: T5 of `agentic_os_tracker_system_improvements.md` (§29) — migrate roadmap milestones → enforced epics; the content-delivery-integrity work needs an epic tracker file as its source of truth.
- Affected: new trackers/epics/E-CONTENT-DELIVERY-001-content-delivery-integrity.md; ../../ROADMAP.md (0.16.0 block deprecation); ../../TRACKER.md (Active Epics).
- Previous state: No enforced epic tracker file existed for content-delivery integrity (work lived only in the ROADMAP 0.16.0 block).
- New state: Epic authored; Active at ~50% (SP-20260525-024 essential-roots patch + ship-coverage enforcer shipped; structural/exhaustive reconciliation remains).

## Evidence log
<!-- §26 — concrete enough that another agent can resume/verify without memory -->
### 2026-06-06 — SP-20260525-024 essential-roots patch + ship-coverage enforcer shipped
- Evidence type: Existence confirmation
- Detail/location: scripts/checks/warpos-ship-coverage.js (the enforcer); `framework/templates` + `hooks.registry` added to ASSET_DIRS; `scaffoldProduct` + `populateWarposMirror` wired into update.js.
- Verified by: President Agent · Supports: the ~50% percent rationale (essential-roots half done; exhaustive/structural half remains).

## Verification log
<!-- §10 states: Verified Exists | Verified Nonexistent | Verified Wired | Verified Not Wired | Exists But Stale | Exists But Incomplete | Exists But Miswired | Missing But Required | Present But Should Be Removed | Unknown -->
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| `warpos-ship-coverage.js` enforcer | Yes | Verified Exists | scripts/checks/warpos-ship-coverage.js | shipped in SP-20260525-024 | 2026-06-06 | President Agent |
| `_warpos/templates/` | Yes | Missing But Required | `_warpos/templates/` (target of `framework/templates` migration) | to build (DoD item 1) | 2026-06-06 | President Agent |
| `_warpos/BASELINE/` | Yes | Missing But Required | `_warpos/BASELINE/` | to build (DoD item 1) | 2026-06-06 | President Agent |
| Dangling `seeded_from` | No | Present But Should Be Removed | scripts/warpos/manifest/build.js:196-202 | to fix (scope) | 2026-06-06 | President Agent |
| Install-matrix update-parity assertion | Yes | Missing But Required | `test-install-matrix.js` existing_install_upgrade | to add (DoD item 4) | 2026-06-06 | President Agent |

## Current next action
<!-- Required while state is not Completed/Cancelled/Superseded -->
Build `_warpos/templates/` + `_warpos/BASELINE/`; migrate `framework/templates`; fix the dangling `seeded_from`; harden ship-coverage to exhaustive.

## Completion record
<!-- Fill only on completion (§15/§37). See COMPLETION_RECORD_TEMPLATE.md. -->
- Final state: Not yet complete (Active, ~50%)
- Percent completion: n/a
- Completion timestamp: n/a
- Definition of done used: see Definition of Done section above (spec §37)
- Evidence of completion: n/a — in progress (SP-20260525-024 essential-roots patch + ship-coverage enforcer shipped; structural/exhaustive reconciliation + `_warpos/templates` migration + install-matrix update parity remain)
- Session IDs / dates / agents: 2026-06-06-t5-roadmap-to-epics / 2026-06-06 / President Agent (via systems builder)
- Related completed sprints: None
- Remaining follow-up items: `_warpos/templates/` + `_warpos/BASELINE/` build + `framework/templates` migration; `seeded_from` resolution + exhaustive ship-coverage; provenance-seeded `_requirements/`/`_docs/`; install-matrix update-parity assertion
- Related untracked work: None
- ../../TRACKER.md updated: No (pending T5 Active-Epics row) · Roadmap reconciled: No (pending 0.16.0 block deprecation)
