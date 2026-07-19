# ED-060 close seam — one-command post-login closure

> **⛔ BRANCH PARKED (committed-unmerged) — 2026-07-19, per lead's standing option.** Gauntlet R2 FAILed
> with a valid CRITICAL (see **PARK STATE / NEXT-SESSION PICKUP** at the bottom). The id-mapping + the agy
> §7 honest-ceiling fix are committed and locally green; the branch is NOT merged. Next session resumes
> from the PARK STATE section. agy stays UNAUTHENTICATED / support-matrix `down` / ED-060 + ED-230 OPEN.

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
`operator@example.com` — and mint a **genuinely VALID token**, not just a stored credential that
LOOKS signed-in.

**IMPORTANT (operator-verified 2026-07-19):** today's stored keyring credential authenticates **IN NAME
ONLY** — the stored-token metadata reads signed-in, but every agy API call fails. All **nine** preserved
morning logs (`runtime/cert-attest/agy-log-*.log`) show the SAME deceptive coexistence: 1× `ChainedAuth:
authenticated` + 1× `OAuth: authenticated successfully as <email>` alongside **20–32×** `not logged into
Antigravity` + `defaulting to CCPA` + `local chrome mode`. So a plain re-login may NOT be enough — the
sign-in likely needs a **REDO** that mints a valid token.

**Post-login verification (BEFORE the close dispatch):** run `agy` once and confirm the log has **ZERO**
`not logged into Antigravity` lines AND resolves the **NON-default (contracted)** model. If either fails,
redo the sign-in. Only then attempt the close dispatch. (This is exactly why the deceptive-transcript
fixture, `runtime/cert-attest/fixtures/agy-full-transcript-false-green.txt`, models the UNIVERSAL case, not
an edge — every real morning run carried the fake auth line alongside the unauth tells.)

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
4. **INT-003 (safe-spawn raw-slug at agy `--model`) — PRE-CLOSE requirement (gauntlet R1, lead-routed to my
   domain).** `scripts/dispatch/safe-spawn.js` ARG_POLICY.agy still accepts a raw catalog slug at `--model`
   (the TOKEN branch bypasses `catalog.js#resolveModelAlias`). Latent while agy is down; NOT this sprint
   (R2-locked, no scope creep). **Before the (b) close dispatch:** route safe-spawn's agy `--model` TOKEN
   branch through `resolveModelAlias` + reject non-catalog agy models + add a regression test. (My domain:
   agy model-resolution single-source + its caller-migration state.)

---

## PARK STATE / NEXT-SESSION PICKUP (2026-07-19)

**Branch:** `sprint/SP-20260719-001-agy-idmap` (off main@5810f60d), committed-unmerged, ~11 commits.
Worktree: `.claude/runtime/worktrees/SP-20260719-001`. Do NOT merge until the R2/R3 fix lands + gauntlet green.

### DONE + locally green (verified — don't redo)
- (a) 3-layer slug→display id-mapping (both `--model` dispatch args + cert-attest served-model comparison).
- GATE-1 narrowed to the unambiguous terminal tells (β 0.87); log-attribution by run time-window.
- **agy §7 HONEST-CEILING FAIL-CLOSED** in `evaluateAttestation` (α+β ratified) — agy never attests from its
  log (client-echo never trusted). The novel-unauth-phrase attack → attested:false (verified).
- Both real artifacts (07-18 + 19-11) fail-closed; SHA-pinned full deceptive-transcript negative fixture.
- Non-contracted agy model refused before spawn (Axis-5).
- cert-attest 22/22, cert-attest-panel 32/32 (but see the R2 gap below), providers-antigravity 8/8, panel-lanes 18/18.
- qa R2 VERIFIED: direct agy evaluateAttestation unconditional-false; deceptive fixture fails closed; CLI
  rejects non-contracted model; NO false-RED on openai/claude paths.

### THE R2 FAIL — the one remaining fix (binding CRITICAL, qa lane gpt-5.6-terra, verdict fail)
**R2-CRITICAL-01 — the §7 fix is INCOMPLETE at the SIBLING reader (β RIDER-1 "same class, different reader"):**
`attestLane` (cert-attest.js ~L282) still attests the agy PANEL lane from any valid signed `antigravity`/`agy`
completion record with an `output_digest` — it does NOT invoke §7 or verify a contracted/served model. So a
signed UNAUTHENTICATED-default or NON-CATALOG agy dispatch record can make `attestPanelRun` true. The existing
panel POSITIVE fixture encodes this at `cert-attest-panel.test.js:50-56` (the 3-lab positive attests WITH `agyOk`).
- **FIX (trust-removal, safe):** hard-fail `lane.provider === "antigravity"` in `attestLane` — the agy lane
  CANNOT be attested from a ledger record until an independently trustworthy server-origin served-model proof
  exists (the same §7 principle at the panel reader; the served-model proof is the deferred ED-230). Consequence
  (correct + consistent with support-matrix agy=down): **panel-3lab BINDING can never attest while agy is down.**
- **FIXTURE RIPPLE:** flip the `cert-attest-panel.test.js:50-56` 3-lab positive → panel-3lab is BLOCKED (agy lane
  fails-closed); the panel-2family FLOOR (gpt+claude, agy optional) is UNAFFECTED (keep its positive). Add
  signed unauthenticated + non-catalog agy panel fixtures that MUST remain UNATTESTED.
- Wire this into the ED-230 B-DEFER seed too (its served-model predicate replaces the interim hard-fail).

### ALSO to re-run
- **Security lane R2 did NOT verdict** — the codex CLI errored: `failed to load models cache: missing field
  supports_reasoning_summaries` (codex v0.144.5 cache-load issue, NOT a code finding). Re-run the security lane
  next session (`dispatch-agent.js security-reviewer runtime/sp719-gauntlet/sec-review-r2-prompt.txt --provider
  openai --model gpt-5.6-terra`); if the cache error persists, refresh the codex models cache first.
- After the attestLane fix + fixture flips: re-run BOTH lanes (R3). Merge only on R3-green + lead sequencing.
