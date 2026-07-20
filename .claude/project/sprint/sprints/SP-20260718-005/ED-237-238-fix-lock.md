# SP-20260718-005 — ED-237/238 Mechanism Unit · FIX-LOCK SPEC (β review BEFORE build)

**Status:** FIX-LOCK — front-loaded to the PERSISTENT β via SendMessage per the boundary ruling. NO fix
build starts until β returns a verdict. β runs the ED-238 completeness grep ITSELF this time.

**Process-error disclosure (owned):** the earlier DESIGN-LOCK was routed to a FRESH IN-PROCESS β (Agent tool,
agentId `abd22c1f7e4d2183d`) instead of the persistent β teammate, and was not logged to `betaEvents`. The
in-process-β verdict (DECIDE 0.90) was real + grep-backed but did NOT satisfy the persistent-β gate. This
fix-lock re-runs the full completeness proof (now 3 axes) + the fix set, giving the persistent β the design
gate it never got. The design SHAPES are unchanged (β's mechanism ruling a6d933e5); this extends the bar.

**Gauntlet result being fixed:** the mechanism unit (802fa80a ED-237, 2375348c ED-238) passed a fresh 3-lane
gauntlet's MODEL/SCHEMA test — all 3 reviewers confirmed BOTH CORE VECTORS CLOSED (no unsafe-reclaim / no
unauthorized-tree-accept leak; the fresh hard-stop's specific trigger did NOT fire). The 4 FAIL findings are
implementation-completeness / robustness / test-integrity. Raw: scratchpad {be,sec,qa}-mech.out; WG-19 PASS.

Branch `sprint/SP-20260718-005-phase3` @ `b89397e5`. Builds ON the mechanism-unit commits.

---

## THE FIX SET (all findings, all lanes, ONE cycle)

### F1 — reclaimDeadGeneration return-contract livelock (HIGH · backend+qa convergent)
`conductor-lease.js:137-156`. If `fs.unlinkSync(lp)` on the elected dead lock FAILS (e.g. persistent EPERM),
the error is swallowed and `reclaimDeadGeneration` returns `true` anyway; `withMutationLock` reads true as
retirement and `continue`s (re-links + re-cleans the reap, lp still present) WITHOUT the deadline check → an
unbounded busy-loop that blocks release/renew/reclaim for the SP-id.
**Fix:** return `true` ONLY when lp is confirmed removed (or already absent); otherwise `false`. `withMutationLock`
then falls to the contended path, which observes the deadline → `mutation-contended`. Ensure EVERY retry/continue
path observes the deadline. **Teeth:** inject `fs.unlinkSync` EPERM on lp and assert a BOUNDED `mutation-contended`
return (not a hang), the dead lock survives, and the reap link is not leaked-forever unboundedly.

### F2 — produce() by-construction not enforced (HIGH · security+qa convergent) — the CENTRAL ED-238 requirement
`acceptance-record.js:195-215`. `produce()` copies `base_commit`/`result_commit` from input WITHOUT
`validateCommitIdentity` and defaults `result_commit` to `""`. It can therefore EMIT a permissive record
(`refs/heads/mutable`, `abc1234`, empty) — authz still fails closed, but the produce/parse-boundary
by-construction invariant is ABSENT.
**Fix:** `produce()` validates the constructed record through `validateCommitIdentity` and FAILS CLOSED (throws
a clear error) BEFORE `stableDigest`/return; remove the `result_commit: input.result_commit || ""` empty path
(require it). **Teeth:** producer rejection tests (mutable ref / short / non-hex / wrong-length / absent
base_commit or result_commit → throw); convert the `base-1` produce() fixture to full SHAs; a valid full-SHA
produce() still returns a record.

### F3 — validateCommitIdentity type-coercion (MEDIUM · security)
`acceptance-record.js:108-112`. `String(record.base_commit || "")` coerces a NON-string (e.g. a one-element
array `["<40hex>"]`) so it passes FULL_SHA_RE — the "typed" schema doesn't require strings.
**Fix:** require `typeof === "string"` for base_commit AND result_commit BEFORE `FULL_SHA_RE.test` (no
coercion). **Teeth:** reject arrays, boxed String objects, plain objects, numbers, null, undefined.

### F4 — negative-teeth short-circuit (MEDIUM · qa · test-integrity)
`acceptance-record.test.js`. Several negatives assert `false` but return at an EARLIER gate than they claim:
the forged-tree test returns at the missing `integrationHead` before its `treeResolver` runs (treeCalls:0); the
superseded-lease test returns before `verifyToken` (verifyCalls:0); the no-opts / unresolvable-target cases have
the same misleading recompute rationale.
**Fix:** build these negatives from `validCtx`, alter ONLY the targeted coordinate, and assert the intended gate
IS reached (spy that `treeResolver`/`verifyToken` was actually invoked, or reason the earlier prereqs pass).
Rename any case whose real assertion is a prerequisite-miss.

---

## COMPLETENESS PROOF (β to re-derive by its OWN grep — the make-or-break)

### Axis (a) — reclaim sites → the ONE pidLiveness (ED-237)
Unchanged by F1 (F1 is a return contract, not the liveness model). Exit-greps: `grep -c "process\.kill("`
`conductor-lease.js` == 1 (call site, inside pidLiveness); `grep -c "pidAlive"` == 0; staleness computed at
exactly 1 site (lease reclaim) inside the `liveness === "live"` branch; the 3 decision sites (mutation-lock
acquire, reclaimDeadGeneration re-verify, lease reclaim) each gate on pidLiveness.

### Axis (b) — commit-identity SITES → the ONE validateCommitIdentity (ED-238) — NO SITE BYPASSES
Every site that CONSTRUCTS, READS, or DIGESTS a commit-identity field routes through / is downstream of the
validator. Enumerated:
1. `produce()` (construct / parse boundary, :195-215) → **F2 fix**: validates via validateCommitIdentity before
   digest/return (was the bypass).
2. `validateCommitIdentity` (:108-112) → **F3 fix**: typeof-string gate (was coercible).
3. `authorizesIntegration` (reads base/result at :326/:345/:354/:363) → already downstream of the
   `validateCommitIdentity(record)` identity gate at :~309 (routes through). ✓
4. `commitIntegration` (the hoisted CAS check reads `record.result_commit` at :403 BEFORE the nested authz) →
   **fix**: add `validateCommitIdentity(record)` at the TOP of commitIntegration so this reader also routes
   through explicitly (currently a mutable result_commit is caught by CAS/authz, but this makes it grep-clean —
   no reader precedes the validator).
5. `stableDigest`/`record_digest` (digest/serialize) → downstream of the F2 produce-time validation (validate
   BEFORE digest), so the digest is always over a validated record. ✓
Grep target: NO commit-identity read/construct/digest site lacks a preceding validateCommitIdentity; ZERO
inline field-by-field FULL_SHA_RE outside validateCommitIdentity + the head-coord isFullSha; newHead gate ==
FULL_SHA_RE; the sole `{7,40}` is resolveCommitSha's OUTPUT check (git output, not a record field — out of scope).

### Axis (c) — served-model / alive-clean readers → provenance-verifier choke-point — LANE-2-OWNED (cross-lane ref)
β's ruling-update names a 3rd completeness axis: served-model/alive-clean readers must route through a
provenance-verifier choke-point (ε2 found `buildObserved` computing alive-clean independently and is building
exactly that choke-point on Lane-2's branch — SP-20260719-001). THIS unit does NOT own axis (c) and does NOT
duplicate Lane-2's work; it is named here as a cross-lane reference with a pointer to Lane-2's branch. β
grep-verifies axis (c) against Lane-2's branch, not this unit.

---

## TERMINAL pass-or-park (the unit's ONE bounded fix-cycle)
After β's fix-lock verdict + build: full local battery + all exit-greps, then a full fresh 3-lane gauntlet
(serialized codex). If it surfaces (a) any core-vector leak, (b) another sibling on the ED-237/238 axes, or
(c) another new-class finding → PARK to next session UNCONDITIONALLY (no second bounded fix). Tracker honesty
folded in. ADR-0029/0030 are α's.

## β DECISION REQUESTED
DECIDE (adopt the fix set + completeness proof as specified) · DIRECTIVE (adjust) · ESCALATE. Please
independently re-derive axes (a)+(b) by grep against the current source, confirm NO commit-identity site
bypasses the validator after the F2/F4/commitIntegration fixes, and confirm axis (c) is correctly deferred to
Lane-2 (not duplicated here).
