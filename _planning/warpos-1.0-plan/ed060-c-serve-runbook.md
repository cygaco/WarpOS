# ED-060 (c) — one-login-away serve runbook (DEFERRED-TO-PLAN-END, operator priority call 2026-07-20)

ED-060 (a) routing + (b) headless-perms are CLOSED on main (@930eeba0). Only (c) — the real authenticated
agy serve → `fallback:false` record — remains, deferred by an operator priority call to the END of the WarpOS
1.0 plan. This runbook makes (c) instantly executable whenever a valid keyring exists (plan-end OR an
operator-initiated `agy` login). Payload: `_planning/warpos-1.0-plan/ed060-sec-serve-prompt.txt`.

## Precondition — valid keyring (do NOT force; NEVER manual-refresh, NEVER skip-perms)
    node -e "const j=require(process.env.HOME+'/.gemini/oauth_creds.json'); console.log('expiry', new Date(j.expiry_date).toISOString(), Date.now()<j.expiry_date?'VALID':'EXPIRED')"
If EXPIRED → the operator has not completed an interactive `agy` login; STOP and surface. As of 2026-07-20 the
token expired at 04:52Z and a login attempt did not take.

## The serve — REAL dispatch path (NOT the cert-attest probe), agy print-mode
    node scripts/dispatch-agent.js security-reviewer \
      _planning/warpos-1.0-plan/ed060-sec-serve-prompt.txt \
      --provider antigravity --model gemini-3.1-pro-high \
      > <scratch>/ed060-c-out.json 2> <scratch>/ed060-c-err.log
(catalog `agyModelName` maps the slug → "Gemini 3.1 Pro (High)" on the argv; `-p` print mode needs no agentic
tools, so the blocked-advisory tool-permission wall is irrelevant here.)

## LIVENESS close criteria (ADR-0027 rider-3, liveness facet only — ED-230 served-model proof stays OPEN)
Run the NAMED consumer gate against the SIGNED ledger record — do NOT eyeball the cli.log:
    node scripts/checks/ed060c-close-gate.js --since <serve-start-ISO>
It picks the latest antigravity completion record ≥ that time, VERIFIES its origin-proof signature FIRST
(an unsigned/tampered/cross-session record is skipped — record-trust), then applies the field gate. It
exits 0 ONLY when all of the below hold; read its real exit code (never pipe through tail/head). (`--record
<file>` also works but MUST point at a SIGNED ledger record — the raw dispatch stdout is unsigned and will
fail origin-proof by design.)
1. Exit 0 + real output bytes: a genuine review, `ok:true` in the JSON (NOT a 9-byte "PROBE OK" eval default).
2. Completion record (`.claude/runtime/dispatch-completions.jsonl`): the antigravity record has `ok:true` AND
   **`fallback:false`** AND **`auth_fallback:false`** (the POSITIVE-proof auth bit) AND `tool_id:"agy"`.
   `auth_fallback` must be EXACTLY `false` — `true` / `"indeterminate"` / ABSENT all FAIL the close
   (the DoE fail-open trap: `!== true` would pass "indeterminate"/absent).
3. auth-fallback detection (SP-20260723-002 / ADR-0037) is SEQUENCE-AWARE + PID-SCOPED, NOT a denylist:
   a code-site AUTH_SUCCESS (`ChainedAuth: authenticated via keyring` / `OAuth: authenticated
   successfully` / `silent auth succeeded`) after the startup tells and no HARD terminal
   (`authentication-failed` / `unauthorized`, or `expired=true` un-followed-by-success) in THIS serve's
   pid-scoped run window ⇒ `auth_fallback:false`. The STARTUP transients ("You are not logged into
   Antigravity", "defaulting to CCPA", "Model resolved via default", "local chrome mode … eval mode")
   are NON-terminal — they appear on a GENUINE serve BEFORE auth completes, so they MUST NOT be treated
   as a close-blocker on their own (the r1 taxonomy error). The detector, not this prose, adjudicates them.
4. Keyring VALID at serve time (precondition above).

## What it closes / does NOT close (β honesty split, DECIDE B/0.90)
- CLOSES ED-060 **liveness** — a real authenticated agy serve with `fallback:false` + no terminal-fallback tell.
- STAYS OPEN: ED-230 served-MODEL proof (served identity from the operator ACCOUNT CONFIG, not a backend-label
  name-match); `panel-3lab` activation stays BLOCKED until ED-230. Never cite a transport-clean `-p` as "live".
- If UNCLEAN (any tell / `fallback:true`): do NOT force; the honest 2-family floor holds; surface to lead.

## After a clean close
Micro-commit on `main`: flip the ED-060 (c) tracker line + the migration-doc status row to CLOSED-LIVENESS
(ED-230/panel-3lab still OPEN), attach the record + cli.log evidence, run `node scripts/trackers/validate.js`
(exit 0), push. cert-attest MUST stay fail-closed on eval/not-logged-in tells (the SP-719-L2 guard).
