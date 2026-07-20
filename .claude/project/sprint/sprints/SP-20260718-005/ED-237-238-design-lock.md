# SP-20260718-005 — ED-237 / ED-238 Mechanism Unit · DESIGN-LOCK SPEC (β review BEFORE build)

**Status:** DESIGN-LOCK — front-loaded to β per the rescoped conduct order (β DECIDE B/0.89, OPEN_ADR ×2).
NO build starts until β returns a design-lock verdict. β re-derives the inventory below by its OWN grep.
Builds ON the preserved R5 commits (`d463c50b`, `22654a3c`) — the ABA election/fence + result-side override
+ ancestry are reviewer-confirmed sound and are NOT re-opened. This unit closes ONLY the two model/schema
roots the R5 gauntlet surfaced as occurrence-3 residuals.

Branch `sprint/SP-20260718-005-phase3` @ `416244d5`. Files: `scripts/dispatch/conductor-lease.js` +
`scripts/dispatch/acceptance-record.js` (+ their `.test.js`).

---

## ED-237 — 3-STATE LIVENESS MODEL (POLICY 1, β-exact)

### The primitive (the ONE site that computes liveness)
```
pidLiveness(pid) -> "dead" | "live" | "indeterminate"
  - not (positive safe integer)                       -> "indeterminate"
  - process.kill(pid,0) succeeds                       -> "live"
  - process.kill throws ESRCH                          -> "dead"
  - process.kill throws EPERM / any other error        -> "indeterminate"
```
`process.kill` appears at EXACTLY this one site after the change. `pidAlive` (the old binary primitive,
now unused — conductor-lease.js:186) is RIPPED OUT (not shadowed). `pidProvenDead` becomes a thin
single-source wrapper `pidLiveness(pid) === "dead"` (or is removed and its callers use pidLiveness directly).

### Policy table — reclaim/supersede decision (liveness is a GATE evaluated BEFORE the TTL/stale branch)
| Site | liveness=dead | liveness=live | liveness=indeterminate |
|---|---|---|---|
| **mutation-lock acquire** (conductor-lease.js:111) | reclaim via nonce election | **contended** | **contended** |
| **reclaimDeadGeneration re-verify** (conductor-lease.js:147) | remove lp (election-held) | leave intact | leave intact |
| **lease reclaim()** (conductor-lease.js:356-360) | **reclaim** (mint higher token) | reclaim IFF stale-past-TTL, **fencing-token-protected**; else `lease-active` | **`lease-indeterminate`** — refuse, manual-recovery, NEVER reclaim (short-circuit BEFORE the stale branch) |

Key invariants:
- **indeterminate short-circuits to contended/manual-recovery EVERYWHERE** — it never reaches a stale/TTL branch.
- The lease **stale-TTL reclaim applies ONLY to a `live` (proven-alive) holder** — the intentional hung-conductor
  recovery. It is **fencing-token-protected**: reclaim mints a strictly-higher token; the superseded live
  holder's release/renew are refused by the existing fencing check (load-bearing; kept + teethed).
- The mutation lock has **no stale path** (R3 removed it) — it reclaims ONLY `dead`; `live`/`indeterminate` → contended.

### Site inventory + COMPLETENESS PROOF (β to re-derive by grep)
Every reclaim-authorization site routes through the ONE `pidLiveness`; ZERO sites compute liveness/stale
independently:
- `grep -n "process\.kill" conductor-lease.js` MUST return exactly **1** hit (inside `pidLiveness`).
- `grep -n "pidAlive" conductor-lease.js` MUST return **0** (ripped out incl. the export).
- `grep -n "STALE_AFTER_MS" conductor-lease.js` staleness is computed at exactly **1** site (lease reclaim),
  and only inside the `liveness === "live"` branch (never before the indeterminate short-circuit).
- The three decision sites (111, 147, 356-360) each call `pidLiveness` (or its `=== "dead"` wrapper).

### Teeth (same round, β-required set)
- **Lease-path invalid-pid falsifiers** (the R5 mask was mutation-lock-only): for pid ∈ {0, -1, 1.5,
  MAX_SAFE_INTEGER+1, "1234", NaN} placed in a REAL `.lease` (fresh AND stale timestamps) → `reclaim()` returns
  `lease-active`/`lease-indeterminate`, the holder + token SURVIVE, NO new token is minted.
- **Injected non-ESRCH**: stub `process.kill` to throw EPERM (and a non-ESRCH error); assert BOTH mutation-lock
  acquisition (→ contended) and lease `reclaim()` (→ not reclaimed) preserve the existing generation/token.
- **live+stale recovery (fencing invariant)**: a live (self-pid) stale-past-TTL lease → reclaim SUCCEEDS, mints
  a strictly-higher token, and the OLD token no longer verifies / its release is refused (fencing-protected).
- **dead**: a proven-ESRCH nonce lock/lease → reclaimed (regression guard).
- `pidLiveness` unit table: dead/live/indeterminate for each input class.

---

## ED-238 — TYPED ACCEPTANCERECORD COMMIT-IDENTITY SCHEMA

### The validator (the ONE site that pins commit identity)
```
validateCommitIdentity(record) -> boolean   // TRUE iff every commit-identity field is an immutable full SHA
  - FULL_SHA_RE.test(record.base_commit)    // 40-hex, R5-add: base was only truthy-checked
  - FULL_SHA_RE.test(record.result_commit)  // 40-hex (already pinned R5, now via the ONE validator)
```
`authorizesIntegration` routes base_commit + result_commit through THIS validator — no field-by-field
`FULL_SHA_RE` left inline. `FULL_SHA_RE = /^[0-9a-f]{40}$/i`.

### Head-coordinate re-binding (β add 2) — the head coords are immutable SHAs === base
- `opts.integrationHead` (authz freshness), `opts.expectedHead` + `opts.liveHead` (commitIntegration CAS), and
  `opts.newHead` are each validated `FULL_SHA_RE` (tighten newHead from the current `/[0-9a-f]{7,40}/` which
  admitted abbreviated SHAs), AND the existing equality chain is retained + made explicit:
  `integrationHead === base_commit`; `expectedHead === base_commit`; `liveHead === expectedHead`. Because
  base_commit is now a validated 40-hex SHA, the chain forces every head coord to be that exact SHA.
- Ancestry re-bound to the validated SHAs: `isAncestor(record.base_commit, record.result_commit)` runs only
  after both are confirmed full SHAs (a mutable base can no longer satisfy freshness-by-spelling while ancestry
  resolves its current target).

### CAS reachability fix (β add 1 — dead-gate/BC-16 class)
Today `newHead === result_commit` (acceptance-record.js:393) lives INSIDE the `performRefUpdate` branch, AFTER
the `authorizesIntegration` call (:378) whose override guard (:313-316) rejects a mismatched newHead FIRST →
`not-authorized`, so the CAS guard is UNREACHABLE ("could be removed without failing the test").
Fix: for `performRefUpdate`, check `newHead` format + `newHead === record.result_commit` **BEFORE** the nested
authz call → a mismatch returns EXACTLY `new-head-not-bound-candidate`. `newHead` is NOT forwarded into the
authz override-guard (commitIntegration validates it itself), so the CAS guard is the sole, reachable authority
for the newHead↔candidate binding. Tooth asserts the EXACT reason (never an OR of two rejections).

### Field inventory + COMPLETENESS PROOF (β to re-derive by grep)
- `grep -n "FULL_SHA_RE" acceptance-record.js`: appears in `validateCommitIdentity` + the head-coord validators;
  **0** field-by-field commit-identity regex left inline in `authorizesIntegration` body.
- Every commit-identity field (base_commit, result_commit) routes through `validateCommitIdentity`; head coords
  (integrationHead/expectedHead/liveHead/newHead) route through the head-coord SHA validation + equality chain.
- `produce()` + `produceForTest()` bind base_commit + result_commit as full SHAs (positive fixtures CONVERTED to
  full-SHA bases — β's explicit add). Old ad-hoc paths RIPPED OUT, not shadowed.

### Teeth (same round, β-required set)
- **base_commit mutable/malformed**: base ∈ {`refs/heads/integration`, short sha, non-hex, empty, 39/41 hex} →
  `authorizesIntegration` BLOCKS (via the validator, before freshness/ancestry).
- **head-coord non-SHA / !== base**: a non-SHA or mismatched integrationHead/expectedHead/liveHead → BLOCK at
  freshness / CAS-head.
- **CAS reachability (reachability-fixed)**: `commitIntegration(performRefUpdate)` with a DIFFERENT full-SHA
  newHead whose tree also == result_tree_hash → asserts EXACTLY `new-head-not-bound-candidate` (proves the
  CAS guard is independently reachable — deleting it MUST fail the test).
- **candidate unrelated to base** (ancestry) → BLOCK.
- positive companion + happy paths still authorize with full-SHA base + head coords === base.

---

## PROCESS / GUARDRAILS
- **Preserved R5 work:** the ABA nonce election/fence, `pidProvenDead`-correctness (folded into `pidLiveness`),
  recompute-from-record, exact-SHA override, ancestry — all KEPT. This unit is additive/refactor at the two roots.
- **Fresh UNCONDITIONAL hard stop:** if the fresh 3-lane gauntlet leaks EITHER core vector (unsafe-reclaim /
  unauthorized-tree-accept), PARK to NEXT SESSION — no same-session iteration of the model.
- **Gauntlet:** fresh 3-lane, codex lanes SERIALIZED (models_cache race), WG-19 + exit gates, envelope to α/lead,
  then β gauntlet→release refresh; α merges. ADR-0029/0030 are α's at design-lock (referenced, not duplicated).
- **Tracker honesty:** folded in — current.yaml/progress.yaml move to "R5 committed+parked → ED-237/238
  mechanism-unit design-lock in progress" on β approval.

## β DECISION REQUESTED
DECIDE (adopt as specified) · DIRECTIVE (adjust the model/policy/inventory/teeth) · ESCALATE. Please
independently re-derive the two inventories by grep and confirm the completeness-proof targets are achievable
as written (one `pidLiveness`, zero independent liveness/stale; one `validateCommitIdentity`, zero inline
field-by-field regex; the CAS guard independently reachable).

---

## CONTRACT AMENDMENT — ED-240 resume cycle (Epsilon2, β DECIDE B/0.92, 2026-07-20; OPEN_ADR: false)

The Phase-3 park (ED-240) left ONE bounded cycle. Resumed by Epsilon2 (2nd conductor, parallel lane) on an
isolated worktree of `sprint/SP-20260718-005-phase3` @50b4db92, building ON R5 (no reverts). β design-boundary
consult routed to the PERSISTENT β (msg_id `83d7ee44`; ED-239-compliant) → **DECIDE B/0.92, both items, audit
verified against code**. No new numbered ADR — this discharges flagged findings WITHIN this lock.

### ED-240a — falsifier-corpus schema migration (RESOLVED)
The ED-238 by-construction hardening (`validateCommitIdentity` requires full-SHA base+result) made the four
pre-schema binding falsifiers DEAD GATES (BC-16): green but short-circuiting at the identity gate BEFORE the
coordinate they claim to attack (proven empirically — forged `treeResolver` call-count 0; stale-base blocked with
base===integrationHead). Each was rebuilt from a VALID current-schema record (`produceForTest` + a real lease),
altering ONLY the attacked coordinate, and now ASSERTS the attacked gate is REACHED:
- `forged-acceptance-record` (AC-F11): fabricated `result_tree_hash`; a `treeResolver` spy MUST be invoked +
  an honest-tree control authorizes → the recompute gate is reached, not short-circuited.
- `validation-to-merge-race` (AC-F12): `commitIntegration` asserts the EXACT reason `validation-to-merge-race`
  (not an earlier `invalid-commit-identity`) + an unmoved-head control commits ok.
- `stale-base` (AC-F3) / `lease-x-acceptance` (AC-F10): fully-valid fixture + single-coordinate delta control
  that AUTHORIZES → `false` is uniquely attributable to the attacked coordinate (freshness / lease currency).

### ED-240b — produceForTest DISPUTED-VERDICT reconciliation (CLOSED)
The security lane's `ED238-POSTVALIDATION-OVERRIDE` (β's fix-lock-0.91 "carve-out" concession, now reversed in the
honesty-tightening direction β conceded) is discharged:
- **`produceForTest` contract change:** overrides now merge into the `produce()` INPUT — top-level (β rider 1) —
  so `validateCommitIdentity` + `stableDigest` run over the FINAL record. Both flags closed: a commit-identity
  override can no longer bypass the schema (it throws at `produce()`), and `record_digest` is never stale.
  New contract: **"a FULLY-VALID, fresh-digest record."** Verified against all call sites — only the one
  adversarial-invalid fixture (`acceptance-record.test.js` empty-`result_commit`) needed migration.
- **`forgeInvalidRecordForTest` split (named residual):** the one adversarial-invalid case moves to this new
  named helper, which SELF-GUARDS (β rider 2) — it throws unless its output FAILS `validateCommitIdentity`, so a
  forged fixture can never leak into a positive/authz-TRUE assertion. One call site today; a 2nd triggers a lint.
- **Teeth (same cycle):** `TEETH (ED-240b)` in `acceptance-record.test.js` assert both closures + the self-guard
  throw/legit paths.

**Verify (β rider 3, build-time):** scoped battery GREEN — acceptance-record 59/59, conductor-lease 47/47,
falsifier corpus 16/16 (`falsifier-liveness` PASS: 12 falsifiers + 1 companion each executed per-file, 0 skipped);
the 4 migrated falsifiers pass their REACHABILITY assertion (spy-called / exact-reason / control-authorizes-TRUE),
not merely `authz=false`. The 6 branch-baseline failures (safe-spawn agy-shim, cutover-completeness, contract-lint,
duplicate-doc-drift, model-chain) are PRE-EXISTING (identical fail set with the change stashed) and out of ED-240
scope. **ED-240a + ED-240b CLOSED.**
