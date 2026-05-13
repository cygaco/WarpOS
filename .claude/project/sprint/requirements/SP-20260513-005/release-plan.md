# Release Plan — Harden /warp:update — preflight + transactional apply + postflight verify

**Sprint:** `SP-20260513-005`
**PRD:** `prd.md`

> Honored by `/sprint:release`. The release-day checklist below is the
> ship-gate. Includes a dedicated section on coordination with SP-002.

## Required to ship

- [ ] All `done` tickets meet their AC.
- [ ] All blocking issues resolved, deferred, or explicitly accepted.
- [ ] PRD requirements R-1..R-34 satisfied (R-30..R-34 added by red-team).
- [ ] COPY satisfied per `copy.md` (C-1..C-10 strings present in stderr
      output for every preflight/apply/postflight path).
- [ ] INPUTS satisfied per `inputs.md` (IN-1..IN-5 schemas asserted).
- [ ] TRACE entries fire as documented in `trace.md` (TR-1..TR-6).
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md`.
- [ ] QA plan passing per `qa-plan.md` (all 8 fixtures + rollback +
      cross-version + cross-cutting GREEN, or YELLOW only on
      `provider-smoke` if SP-002 has not shipped).
- [ ] Redteam plan passing per `redteam-plan.md` (RT-1..RT-7 mitigations
      verified by AC-RT-*).
- [ ] No `secret: true` env-var values appear in any tracked file.
- [ ] Release approval recorded in `approvals/` (AP-20260513-004 +
      AP-20260513-005 must be `approved` before release).

## Release artifacts

- [ ] Changelog / release notes drafted at
      `framework/releases/<next-version>/changelog.md` summarizing
      preflight + transaction + postflight.
- [ ] `_docs/` reference docs updated:
      - `_docs/architecture/release-flow.md` (if exists) gets a
        preflight/transaction/postflight section.
- [ ] `.claude/commands/warp/update.md` updated per S-10 (procedure +
      troubleshooting).
- [ ] `framework/releases/<next-version>/release.json` updated to
      include the 3 NEW `check:warpos-*` skills in postUpdateChecks list
      if-and-where appropriate (they're preflight-time, but the gate
      SCRIPTS themselves are framework assets that need to ship).
- [ ] Analytics: TR-1..TR-6 are documented in `_docs/observability/`.
- [ ] Migration plan: `none_required` (the new functionality is purely
      additive; existing transaction stub artifacts continue to work for
      installs that haven't seen SP-005 yet).
- [ ] Rollback plan: same — releasing SP-005 is a forward-only change to
      `update.js`. To revert, restore the pre-SP-005 `update.js` via
      backup-aware `git revert <merge-commit>`. There are no schema
      migrations to undo.

## Monitoring after release

- [ ] **Preflight false-positive rate** — query `events.jsonl` for
      `cat=warpos.update.preflight status=red` over rolling 7 days.
      Investigate any gate firing red >2x without a corresponding
      operator-confirmed fix.
- [ ] **Transaction rollback rate** — query
      `cat=warpos.update.transaction.rollback` over rolling 7 days.
      Investigate any rollback whose `trigger` is non-obvious or whose
      `restoredCount + unlinkedCount` mismatches the snapshot intended
      count.
- [ ] **Postflight degradation rate** — query
      `cat=warpos.update.postflight redCount>0` rate. Reds beyond
      `provider-smoke degraded` are real follow-ups.
- [ ] **Operator self-report** — at next /retro after a downstream update,
      ask operator whether they felt the fear has reduced. Subjective but
      the founding metric (F-10 trust loss in failure-mining.md is the
      whole sprint).

## Approval gates

Production deploy requires explicit user approval per
`CLAUDE.md#Autonomy`. Record approval id in `releases/<id>.yaml#approval_ref`.

Per Plan Contract `approval_boundaries`:

- **AP-20260513-007** — Transactional-apply architecture change (Class C).
  Blocks T-20260513-055 (transaction wrapper) and T-20260513-056 (atomic
  rollback) until `approved`.
- **AP-20260513-008** — `release-gates.js` extension (Class B), conditional.
  Blocks any ticket that modifies `scripts/warpos/release-gates.js`. If
  implementation ships without touching that file, mark this approval as
  `waived` during execute.

## Coordination with SP-20260513-002

SP-005 (this sprint) and SP-002 (provider smoke + RCA + auto-fix) overlap
on three surfaces:

1. **`scripts/warpos/update.js`** — SP-005 wraps with preflight +
   transaction + postflight; SP-002 adds `provider-smoke` as a
   post-update-check. **Lane boundary:** SP-005 owns the orchestration
   (the preflight/transaction/postflight composer files). SP-002 owns
   the `provider-smoke` skill body and its CLI. Both can modify
   `update.js` only via NEW exports — `preflight.js`, `postflight.js`,
   `transaction.js` (SP-005) and the `provider-smoke` post-update-check
   entry (SP-002). Neither rewrites the existing `update.js#run()` flow
   beyond what's necessary; the function signature is preserved.

2. **`.claude/commands/warp/update.md`** — both sprints update the
   procedure docs. **Lane boundary:** SP-005 owns the "Preflight" /
   "Transaction" / "Postflight" sections + the troubleshooting catalog.
   SP-002 owns one new bullet in the Postflight section: "If
   provider-smoke is registered, postflight calls it." SP-002 does NOT
   own the postflight composer; the composer is SP-005's.

3. **`framework/releases/*/release.json#postUpdateChecks`** — both
   sprints declare entries. **Lane boundary:** the array is append-only
   from both sides. SP-005's NEW gates run at PREFLIGHT (not in
   `postUpdateChecks` — they're standalone skills). SP-002's
   `provider-smoke` runs at POSTFLIGHT, and the composer in SP-005's
   `postflight.js` invokes it via the IN-5 external-check primitive.
   Both teams agree on this contract at SP-005 design-freeze:
   `postUpdateChecks[]` continues to mean "post-apply checks run
   sequentially by `update.js`," and SP-005's postflight composer adds
   ADDITIONAL checks before/after the existing `postUpdateChecks[]`
   array.

**Boundary protocol:**

- SP-005's `postflight.js` exposes a `registerExternalCheck(spec)` API.
  SP-002's deliverable wires a single call to it:
  `registerExternalCheck({ name: "provider-smoke", resolvePath:
  "paths.providerSmokeSkill", required: false, degradedReason:
  "provider-smoke skill not yet shipped" })`.
- SP-005's `postflight.js` MUST handle the case where the external check
  isn't registered yet — recording `status:degraded` and proceeding
  (AC-S-8.1).
- SP-002 may ship first or later; SP-005 does not block on SP-002.
- If SP-002 ships first AND SP-005 needs to test the integration during
  build, SP-005's S-8 ticket calls SP-002's `provider-smoke` directly via
  the registered path.
- Cross-sprint integration test: an end-to-end fixture that runs
  `/warp:update --apply` against a synthetic install with `provider-smoke`
  registered AND a deliberately-broken provider. Postflight records
  `provider-smoke red`. Lives in SP-005's QA but only run if SP-002 has
  shipped. (Documented as "Integration test pending SP-002 release" in
  QA plan.)

This boundary was discussed implicitly via the Plan Contract; it is
codified here for both sprints' builders to read.

## Documentation scaling

Required at scale `m | l | xl`.

## Coordinator notes

This sprint is rated `risk_level: high` because it rewrites the update
flow. The redteam plan added 5 hard requirements (R-30..R-34) that catch
the high-severity adversarial scenarios. Approval AP-20260513-004 is the
single gate that controls whether the transactional change goes live;
the operator/founder should review the snapshot/rollback/lock-file
architecture before approving.

Beta review is marked as "skipped during design; user may request
post-design Beta consult if desired." This is flagged in the return
summary to the user. If Beta is consulted later and asks for changes, the
PRD can be reopened via `/sprint:design --force --sprint SP-20260513-005`.
