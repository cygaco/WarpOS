# Acceptance Criteria — SP-20260719-001

## (a) Slug→display id-mapping

- **AC-1** — The catalog ANTIGRAVITY model entry (`gemini-3.1-pro-high`) carries an explicit agy
  display-name field whose value is exactly `Gemini 3.1 Pro (High)`.
  *verified_by:* unit test reads catalog, asserts the field + value.
- **AC-2** — A single resolver (`catalog.agyModelName(canonicalId)` or equivalent) maps the canonical
  slug → the agy display name, and returns any non-antigravity / unmapped id UNCHANGED (no blast radius).
  *verified_by:* unit test — `gemini-3.1-pro-high`→`Gemini 3.1 Pro (High)`; `gpt-5.6-sol`→unchanged.
- **AC-3** — `providers.js#buildProviderArgv` antigravity branch emits
  `--model "Gemini 3.1 Pro (High)"` when given the canonical slug — the raw slug NEVER reaches
  `agy --model`.
  *verified_by:* unit test asserts the argv array.
- **AC-4** — `cert-attest.js#probeShape` antigravity branch translates the canonical slug → display
  name identically (same resolver, no second copy of the mapping).
  *verified_by:* unit test asserts the probe argv; grep asserts one mapping source, not two.
- **AC-5** — The stale `catalog.js` comment claiming the kebab slug is the working `agy --model` id
  is corrected to state the display-name requirement + cite the 2026-07-19 calibration.
  *verified_by:* reviewer read; no assertion that the wrong claim remains.
- **AC-6** — Registry, support-matrix, and panel-lane-manifest still pin the canonical slug
  `gemini-3.1-pro-high` (source of truth unchanged; only the adapter translates).
  *verified_by:* grep — canonical slug present in all three; display name absent from them.

## (b) Real agy serve → ED-060

- **AC-7** — Auth-liveness is verified EMPIRICALLY this session before any gate flip: a cert-attest
  probe through the fixed adapter either attests (auth live) or fail-closes (BLOCKED-ON-OPERATOR).
  The result is recorded as an artifact, not asserted from memory/config.
  *verified_by:* the cert-attest artifact JSON exists with a real `cli_output_sha256`.
- **AC-8** — IF auth live: one real agy dispatch produces `attested:true` with `effective_model` =
  the contracted model, GATE-1 clean (no post-auth default/unauth signal) and GATE-2 positive
  (backend-label serve marker). A committed cert-attest artifact is the durable proof.
  *verified_by:* artifact `attested:true` + `cli_output_head` contains the backend-label serve line
  after the auth line.
- **AC-9** — ED-060 is closed ONLY on AC-8's real evidence; if auth is dead, ED-060 stays OPEN and
  the sprint ships (a) with a loud blocked-on-operator surface (no premature close).
  *verified_by:* ED-060 tracker state matches the actual evidence; no close without an attested artifact.

## (c) Honest panel-3lab (ED-230)

- **AC-10** — `support-matrix.json` agy-antigravity flips `down→supported/proven` ONLY after AC-8,
  with evidence_ref citing the committed cert-attest artifact (+ ledger id). If AC-8 did not happen,
  the row stays `down` (unchanged).
  *verified_by:* support-matrix status matches the evidence; conformance-matrix gate green.
- **AC-11** — The panel-3lab binding path (`attestPanelRun`) requires the agy lane to have SERVED the
  contracted model (served-model proof), not merely run on the contracted provider (ED-230).
  *verified_by:* unit test — a lane record that ran-but-served-default does NOT attest; a served-model
  record does.

## Record-trust falsifiers (required-present, fail-closed)

- **AC-12** — An unauthenticated agy log fixture (defaulting to CCPA, NO auth line) FAILS
  `evaluateAttestation` (GATE-1).
  *verified_by:* falsifier fixture + test asserts `attested:false`.
- **AC-13** — A forged/unsigned ledger record claiming an agy serve does NOT attest a panel lane
  (`attestLane` origin-proof).
  *verified_by:* falsifier fixture + test asserts the lane is not attested.
- **AC-14** — A request-echo (contracted id echoed but not served) fails GATE-2 (positive-proof).
  *verified_by:* falsifier fixture + test asserts `attested:false`.

## Regression / integrity

- **AC-15** — All pre-existing agy/providers/cert-attest/panel-lanes tests still pass (no regression
  on the changed paths); every new behavior ships its own test the same round.
  *verified_by:* the affected test suites run green.
- **AC-16** — Non-antigravity dispatch (openai/gemini/claude) argv is byte-identical to pre-change
  (the mapping is antigravity-only).
  *verified_by:* unit test diffs buildProviderArgv output for openai/gemini pre/post.
- **AC-17** (added as-built — the layer-3 discovery) — cert-attest attests the canonical antigravity
  SLUG (`gemini-3.1-pro-high`), not only the display name: `cert-attest#main` maps slug→display via
  `catalog.agyModelName` before the served-model comparison, so a GENUINE authenticated serve does not
  FALSE-RED. The id-mapping therefore has THREE sites (both `--model` args + this comparison), not two.
  *verified_by:* the bidirectional layer-3 test (slug false-REDs vs agy's display-name serve label;
  display name attests) + the live re-probe artifact (canonical slug → attested:true, 19-11-56Z).

## Findings & residuals (as-built, 2026-07-19 — CORRECTED after the α/β false-green block)

1. **agy auth is DEAD (blocked-on-operator).** The keyring token is EXPIRED; agy is unauthenticated and
   serves the account DEFAULT (CCPA). My mid-sprint "auth is LIVE / ED-060 serve-proven" claim was WRONG —
   the 19-11-56Z `attested:true` was a **LIVE FALSE-GREEN** (α/β-caught, self-verified). The original 19:01
   "auth dead" read was CORRECT; I wrongly retracted it by trusting agy's DECEPTIVE transport lines. THE
   `19-11-56Z` ARTIFACT IS THE CANONICAL NEGATIVE FIXTURE — never delete it (third-recurrence exemplar).
2. **Root cause (the security fix, committed f82f0ad5):** agy emits a DECEPTIVE "ChainedAuth: authenticated"
   line + a client-side "Propagating…backend: label=<display>" echo EVEN WHEN UNAUTHENTICATED. The prior
   order-aware GATE-1 slice discarded the real unauth tells behind the fake auth line; GATE-2 matched the
   display echo. FIX: GATE-1 is NON-sliceable — any same-run terminal unauth/default/eval signal =
   attested:false, regardless of any later auth-shaped line. A genuine authenticated run (clean log) still
   attests (verified: 20/20 incl. the 19-11 negative fixture; live re-probe 19-33-36Z → attested:false).
   ADR-0025 amendment candidate: AUTH_LINE-match ≠ genuine auth; terminal unauth signals are not sliceable.
3. **ED-060 close condition (unchanged, blocked-on-operator):** closes ONLY when the operator completes the
   real Antigravity login AND a genuine authenticated serve attests (a cert-attest artifact with a positive
   backend-label serve of the display name AND FREE of not-logged-in / defaulting-to-CCPA / eval-mode). The
   flip's primary evidence_ref is a REAL `dispatch-agent.js` `fallback:false` ledger record (production route),
   cert-attest as supporting evidence. support-matrix STAYS down/proven:false; ED-060/ED-230 stay OPEN.
4. **Second residual — agy review-workload timeout (gates panel-3lab / ED-230):** a real agy security REVIEW
   (18KB prompt) TIMES OUT at agy's hardcoded `--print-timeout 90s`. Independent of auth, this blocks a real
   agy review-lane record. Disposition (print-timeout bump vs defer) is operator-owned.
5. **AC-8/AC-10/AC-11 live-positive paths are BLOCKED-ON-OPERATOR** — code + negative/signed-positive fixtures
   land this sprint; the live authed positive is proven post-login via the one-command re-probe seam.
