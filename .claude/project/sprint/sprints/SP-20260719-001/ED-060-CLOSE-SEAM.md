# ED-060 close seam — one-command post-login closure

**Status: BLOCKED-ON-OPERATOR.** agy (Antigravity) is UNAUTHENTICATED — the keyring token is expired,
so agy serves the account DEFAULT (CCPA), not the contracted `gemini-3.1-pro-high`. The id-mapping fix
(a), the GATE-1 narrowed hardening, and the agy §7 honest-ceiling fail-closed ship now. The live ED-060
close waits on one operator action.

**cert-attest is NOT the close (α/β-RATIFIED 2026-07-19).** cert-attest's agy §7 path is an HONEST-CEILING
FAIL-CLOSED: it returns `attested:false` for agy BY CONSTRUCTION, because agy's only "serve marker" is the
client-side `Propagating … backend: label=<display>` echo, which agy emits from the `--model` arg
regardless of auth/serve (this echo produced BOTH the 19-11 and 07-18 false-greens). agy's log can NEVER
prove the served model, so cert-attest cannot close ED-060 — a real authenticated dispatch-agent record does.

## Operator step (the ONE thing only the operator can do)

Open the **Antigravity** app (or run the Antigravity CLI login) and **sign in** as
`operator@example.com`. This refreshes the expired keyring token so `agy` serves the account's
configured model instead of defaulting to CCPA.

## The ED-060 close record — what it proves, and why it's not client-echoable (β B/0.90 rider — LOAD-BEARING)

The ED-060-closing record must prove the served model from evidence a CLIENT CANNOT FABRICATE. It must NOT
re-read agy's backend-label echo — that would just RELOCATE the §7 echo-trust we removed to a different
reader (ADR-0025 whole-ledger RIDER-1, "same mistake class on a different reader"). The evidence splits:

1. **AUTHENTICATED LIVENESS — log-observable + trustworthy (a client echo cannot fake a valid auth STATE):**
   keyring VALID (NOT `expired=true`), NO terminal-fallback tell (no `eval mode` / `local chrome mode` /
   `resolved via default` / `not logged into Antigravity`), a real non-empty response, and `fallback:false`
   on the dispatch record. These are auth-STATE, not model-name — exactly the signals GATE-1 already keys on.
2. **SERVED-MODEL IDENTITY — rests on the operator's AUTHENTICATED ACCOUNT CONFIG, never a name-match:**
   the logged-in Antigravity account is configured to serve the contracted model. The model NAME is never
   re-trusted from agy's output (at cert-attest OR at dispatch-agent).

   **HONEST RESIDUAL (α-directed):** agy's CLI does NOT emit an authoritative server-side served-model
   receipt. So the served-model identity ultimately rests on the account config (an operator-attested
   property), not machine-verifiable server evidence. A stronger, client-un-fakeable proof — e.g. an
   OUTPUT-CONTENT CHALLENGE (a prompt only the contracted model answers correctly) — is a CANDIDATE, not
   built. If no client-un-fakeable served-model evidence source exists for agy, that is a **Phase-4 / ED-215
   problem, NOT a reason to soften §7.** Until then the close is: authenticated-liveness (machine-checked) +
   account-config model identity (operator-attested), stated honestly as such.

## The close sequence (post-login)

```bash
# 1) one real security-reviewer dispatch through agy (PRODUCTION route, not a probe), authenticated.
#    ~2/3 security-framing refusal → bounded retry (<=3) + dispatch-guide neutral-framing; if it
#    persistently declines while authenticated, that's a real capability finding — keep the row down.
node scripts/dispatch-agent.js security-reviewer <prompt-file>
#    NB: agy --print-timeout is 90s — a heavy (18KB) review may time out (see the print-timeout rider).

# 2) VERIFY authenticated-liveness (NOT a model-name echo): fallback:false + real non-empty output +
#    the run's agy log carries a VALID keyring (no expired=true) + NO terminal-fallback tell. Model
#    identity = the account config, never a backend-label match.

# 3) commit a citation artifact (record fields + dispatch_id + hash + the auth-state evidence) into the
#    sprint evidence dir — .claude/runtime/dispatch-completions.jsonl is gitignored (durability rider).

# 4) flip support-matrix agy-antigravity down->proven citing THAT record; announce the flip to the lead
#    BEFORE merge (lane-1 AC-16 flip-gate auto-authorizes on the flip).
```

This closes ED-060 honestly. ED-230's attestPanelRun served-model predicate inherits the SAME rule
(auth-state + account config, never a client-echo name-match) — see the follow-up rider.

## Why the SHIPPED code is safe (the record-trust guarantee)

cert-attest agy §7 is fail-closed BY CONSTRUCTION: for antigravity it returns `attested:false` regardless
of output — no agy log line (backend-label included) is ever trusted as served-model proof. A blind probe
before OR after a successful login can NEVER false-green. GATE-1 additionally hard-fails the unambiguous
terminal/keyring tells (defense-in-depth), and the folded cli.log is bound to the run's time window. The
convergent gauntlet-R1 CRITICAL (both cross-provider reviewers — a novel unauth phrase + the fake label) is
structurally closed: the label is never proof.

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
