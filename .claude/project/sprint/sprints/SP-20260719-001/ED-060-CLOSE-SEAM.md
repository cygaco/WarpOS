# ED-060 close seam — one-command post-login closure

**Status: BLOCKED-ON-OPERATOR.** agy (Antigravity) is UNAUTHENTICATED — the keyring token is expired,
so agy serves the account DEFAULT (CCPA), not the contracted `gemini-3.1-pro-high`. The id-mapping fix
(a) + the GATE-1 non-sliceable false-green fix ship now; the live ED-060 close waits on one operator
action, after which it is a single command. The fixed cert-attest CANNOT false-green: if the login did
not take, the re-probe fail-closes (attested:false) — so this seam is safe to run blind.

## Operator step (the ONE thing only the operator can do)

1. Open the **Antigravity** app (or run the Antigravity CLI login) and **sign in** as
   `operator@example.com`. This refreshes the expired keyring token so `agy` serves the
   contracted model instead of defaulting to CCPA.
   (Verify: `agy` will no longer log `You are not logged into Antigravity` / `defaulting to CCPA` /
   `local chrome mode … eval mode`.)

## One command — the re-probe (produces the ED-060 serve proof)

From the repo root (canonical or this worktree; the fixed adapter translates the slug→display):

```bash
node scripts/checks/cert-attest.js --model gemini-3.1-pro-high --provider antigravity --json
```

- **PASS (login took):** `attested: true`, `effective_model: "Gemini 3.1 Pro (High)"`, the artifact's
  raw output carries a `Propagating … backend: label="Gemini 3.1 Pro (High)"` serve marker AND is FREE of
  any `not logged into Antigravity` / `defaulting to CCPA` / `eval mode` signal. This committed artifact
  (`runtime/cert-attest/gemini-3.1-pro-high-<ts>.json`) is the ED-060 serve proof.
- **FAIL (login did not take):** `attested: false` with a GATE-1 fail-closed reason. Re-do the operator
  step; the seam is safe (no false-green).

## Then: the production-route record + the flip (per lead ruling — b BEFORE c)

The support-matrix flip's PRIMARY evidence_ref is a REAL production-route ledger record, not the probe:

```bash
# 2) one real security-reviewer dispatch through agy (production route), fallback:false, model served.
#    Handle the ~2/3 security-framing refusal: bounded retry (<=3); if it persistently declines, that is
#    a real capability finding — keep the row down for the security lane and consult the lead.
node scripts/dispatch-agent.js security-reviewer <prompt-file>
#    NB: agy's --print-timeout is 90s; a heavy (18KB+) review may time out — see the review-timeout
#    residual in acceptance-criteria.md (may need a print-timeout bump, operator-owned).

# 3) commit a citation artifact (record fields + dispatch_id + hash) into the sprint evidence dir,
#    because .claude/runtime/dispatch-completions.jsonl is gitignored (durability rider).

# 4) flip support-matrix agy-antigravity down->proven citing that record + the cert-attest artifact;
#    announce the flip to the lead BEFORE merge (lane-1 AC-16 flip-gate auto-authorizes on the flip).
```

This closes ED-060. The ED-230 attestPanelRun served-model wiring (landed this sprint, code-only) then
has its live positive path proven by the same authenticated record; until then ED-230 stays OPEN.

## Why this is safe (the record-trust guarantee)

The cert-attest GATE-1 hard-fails (non-sliceable) on the UNAMBIGUOUS terminal/keyring tells
(`resolved via default` / `eval mode` / `local chrome mode` / keyring `expired=true` / auth-failed),
regardless of any deceptive `ChainedAuth: authenticated` line (agy emits auth-shaped + backend-label
echoes even while unauthenticated — the root of the 19-11 AND 07-18 false-greens). The folded cli.log is
bound to the run's time window (no cross-run stale-line bleed). So a blind re-probe before a successful
login CANNOT produce a false close — it fail-closes.

**Post-GATE-1-hardening note (gauntlet R1, 2026-07-19):** both cross-provider reviewers found that GATE-2
trusting agy's client-side `backend: label` echo is a residual false-green (a novel unauth phrase + the
echo). The convergent conclusion (both reviewers + β + ADR-0025): agy CANNOT self-attest via its log — so
the cert-attest agy §7 path becomes an HONEST-CEILING FAIL-CLOSED. The genuine ED-060 proof is a REAL
AUTHENTICATED dispatch-agent record (the review actually ran + returned a genuine non-default response
under an authenticated backend), NOT the cert-attest log probe. Pending α/β ratification.

---

## POST-LOGIN FOLLOW-UP RIDERS (all deferred work in one place)

1. **ED-230 (attestPanelRun served-model wiring) — B-DEFER (lead ruling).** Stays OPEN, no new debt id.
   Design seed for the follow-up: OPTION B (on the cert-attest surface — no LANE-1 collision): attestLane
   for the agy lane additionally requires a same-run authenticated proof; the cert-attest artifact carries
   `code_sha` + a run correlator + an ORIGIN-PROOF that REUSES the ADR-0025 per-session HMAC machinery from
   SP-20260718-003 (do NOT invent a new signing scheme). Given the gauntlet-R1 conclusion (agy §7
   fail-closed), the served-model proof is the authenticated dispatch record, not the log echo — wire
   attestPanelRun to require THAT. Build FRESH, not under end-of-sprint time pressure.
2. **agy `--print-timeout` (currently 90s) — NOT this sprint.** The 18KB-review timeout observed under
   UNAUTH/eval mode is contaminated (a review can never complete unauthenticated, so workload-timeout is
   indistinguishable from unauth-hang). Post-login: re-test the 18KB review; if it's a genuine
   thinking-latency timeout, bump 90→300s then. The review-path timeout may live under `scripts/dispatch/*`
   (LANE-1 surface) — coordinate before touching.
3. **agy security-framing refusal (~2/3) — post-login test candidate.** Observed under unauth; re-measure
   post-login with the dispatch-guide neutral-framing + a bounded ≤3 retry. If it persistently refuses
   security framing when authenticated, that's a real capability finding — keep the security lane down,
   consult the lead on a scoped flip.
