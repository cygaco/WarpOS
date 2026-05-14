# Redteam Plan — Enforce sprint routing policy

**Sprint:** `SP-20260514-002`
**PRD:** `prd.md`

## Threat model

The routing-enforcement contract is a self-policing system: Alpha records routing decisions and a guard verifies them. The threats below explore the gap between "intent" and "policed reality."

## Adversarial scenarios

### A-1 — Self-attestation lie

**Threat:** Alpha records a trace claiming `model: claude:claude-opus-4-7` even though the artifact was actually drafted by a Haiku in cost-saving mode. The trace passes `record`'s class validation because `claude:claude-opus-4-7` is declared; the lie is invisible.

**Mitigation:** Out-of-scope for this sprint — trace honesty depends on caller-supplied data. Document this in PRD non-goals; trace is provenance, not attestation. Future sprint could integrate with `runProvider`'s actual dispatch return value.

### A-2 — Bypass via direct-disk-write (cat > file)

**Threat:** Operator writes a sprint artifact via raw shell `cat > .claude/project/sprint/sprints/X/current.yaml` from Bash, bypassing Edit|Write and therefore the guard hook.

**Mitigation:** `routing.js coverage` is the second line of defense — `release.js` calls it before commit, so a bypass via raw bash still surfaces at the release gate.

### A-3 — Guard fail-open abuse

**Threat:** Operator deletes `paths.sprintRouting` to silence the guard (fail-open exit 0), then writes whatever they like.

**Mitigation:** Deleting the policy file is also the documented disable mechanism, so this is intentional. `/warp:health` Section 3 surfaces "routing policy missing" so the absence is visible.

### A-4 — Soft-rollout permanence

**Threat:** `enforcement.mode = warn` becomes "forever warn" — no one flips it to block.

**Mitigation:** R-11: when `soft_rollout_until` < now and mode is still warn, `/warp:health` raises yellow. AC: smoke-test the date passing locally to confirm the warning fires.

### A-5 — Soft-rollout flip during sprint

**Threat:** Mid-sprint flip from `warn` → `block` blocks an in-progress writeflow because earlier artifacts have no trace.

**Mitigation:** Closed/retrospected exemption is the wrong granularity for in-flight sprints. Mid-sprint flips MUST also exempt sprints that started before `enforcement.rolled_out_at`. Capture this as an AC during execute.

### A-6 — Single-vendor evidence abuse

**Threat:** Operator uses `--evidence single_vendor_session` to bypass diff-review enforcement even when a second vendor IS available — silent regression.

**Mitigation:** `record --evidence single_vendor_session` writes to decision-ledger; periodic /warp:health or retro can scan for excessive single-vendor evidence in active sprints. Defer the alert to a follow-up sprint; flag in retro.

### A-7 — Race condition: two writes between record and check

**Threat:** plan.js writes Plan Contract, then calls `record`. In between, another tool overwrites the Plan Contract. The trace row exists but points at an artifact that no longer matches.

**Mitigation:** Document that trace freshness is best-effort and the artifact hash is NOT recorded (deferred). The race is not a release-blocker — coverage cares about presence, not content fidelity.

### A-8 — Hook regression wedges all Edit|Write

**Threat:** A bug in `sprint-routing-guard.js` (e.g., infinite loop, bad regex) wedges every Edit|Write in the project, not just sprint artifacts.

**Mitigation:** Hook MUST exit 0 fast (<5ms) when `file_path` is outside `paths.sprintRoot`. QA includes a "10k unrelated writes" latency test to confirm.

### A-9 — Schema lock-in

**Threat:** Future-us realizes `warpos/sprint/routing-trace/v1` is wrong shape; backward-incompat schema bump invalidates all historic traces.

**Mitigation:** Schema bump is acceptable per the policy file's own additive-keys note; coverage logic MUST tolerate older schema rows by relaxing field validation in `coverage` (only `record` is strict). Capture in AC-3 follow-ups.

### A-10 — DOS via append-only growth

**Threat:** `routing-trace.jsonl` grows unbounded across many sprints, slowing coverage scans.

**Mitigation:** Coverage filters by `sprint_id` first; per-sprint scans stay O(rows-for-this-sprint). Document file rotation as a follow-up (per-sprint subdirs).

## Redteam pass condition

- All A-1..A-10 explicitly addressed in the implementation or recorded as out-of-scope/follow-up.
- The retro names which mitigations were honored vs deferred.
