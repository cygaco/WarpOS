# Discovered bug → feeds #3 Typed Success Semantics (BC-16)

**Found:** 2026-06-01, during Wave-1 lane A (#2 repo-role) gauntlet (reported by Gamma (γ)).

## Symptom
`dispatch-agent.js` did NOT write completion records for 4 real gauntlet runs:
- `dispatch-completions.jsonl` mtime stuck at 17:26Z (stale across the 4 runs).
- `gauntlet-verify` reports `no-record` for runs that DID happen (Gamma has all 4 parsed
  reviewer/compliance/qa/redteam envelopes — the reviews are real, the telemetry write is missing).

## Why it matters (the typed-success angle)
This is a **false-NEGATIVE on the telemetry channel** — the inverse-but-same-class of the
false-green BC-16 problem: the action occurred but no telemetry record exists, so a verifier
that trusts telemetry would either (a) wrongly fail a real run, or (b) if it fail-OPENs, mask a
genuinely phantom run later. Either way the telemetry channel is not trustworthy.

## What #3 (Typed Success Semantics) must do with this
1. **Writer fix:** ensure `dispatch-agent.js` reliably appends a completion record per run
   (atomic append; verify the write; surface a write-failure loudly, never silently skip).
2. **Verifier fix:** `gauntlet-verify.js` must treat "no telemetry record" as a typed FAILURE
   (fail-closed), AND the success predicate must be "action occurred AND telemetry record exists"
   — not one or the other. Runner-error → non-zero; malformed record → fail-closed; stale →
   self-flag (per the false-green-gauntlet lesson, project_enforcer_falsegreen_gauntlet).
3. **Regression test:** a run that completes but whose record write is suppressed must be caught
   (not silently accepted), and a real run must not be falsely failed.

## Note for lane A (#2) right now
Gamma proceeded on the 4 runs using the directly-parsed envelopes (real evidence in hand), which
is acceptable for THIS fix cycle, but it's a workaround — the durable fix is #3.
