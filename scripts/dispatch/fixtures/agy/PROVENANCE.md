# agy auth-fallback detector fixtures — provenance

SP-20260723-002 / ADR-0037. These two fixtures are the committed regression anchors for
`scripts/dispatch/agy-auth-tells.js` (`detectAgyAuthFallback`). DoE re-consult condition #5: the
genuine sample MUST be a real capture, and any derived fixture MUST document its transform — a
hand-authored "genuine" fixture encodes author assumptions (the class that slipped ε+α+β in r1).

## authenticated-serve.log — GENUINE (byte-identical real capture)
- Source: `runtime/cert-attest/agy-log-1784445071686.log` (a real `agy` execution by the operator,
  keyring valid). Byte-identical: sha256 `e7aa30393f61dbe731e2ffe62b44e83c3d9b6d3c5a1599c23cce64761c8e7e12`.
- Shape: startup transients (`Model resolved via default`, `local chrome mode / eval mode`,
  `You are not logged into Antigravity`, `not authenticated`) at lines 1-53, THEN keyring load
  (`expired=false`, L54) and the three code-site auth-success lines (`ChainedAuth: authenticated
  via keyring` L55, `OAuth: authenticated successfully` L57, `silent auth succeeded` L68), then
  authenticated request execution with the resolver/request labels logged for "Gemini 3.1 Pro
  (High)". pid = 39296 on every line (glog field 3). SERVED-MODEL identity is UNPROVEN here (ED-230:
  the log carries the requested/resolver LABEL, not an operator-account-config served-model attestation)
  — this fixture proves AUTHENTICATION, not which model actually served.
- Expected classification: `auth_fallback: false` (surface `auth-success`). This is the serve the
  r1 blunt-denylist detector FALSE-RED'd — the anchor that must never regress.

## unauthenticated-serve.log — DERIVED (documented transform)
- Derived from `authenticated-serve.log` by: (1) removing the three code-site auth-success lines
  (`ChainedAuth: authenticated via keyring`, `OAuth: authenticated successfully as ...`,
  `Print mode: silent auth succeeded`); (2) flipping `expired=false` → `expired=true` on the
  keyring.go line. Same pid (39296), same timestamps — a synthetic UNauthenticated serve.
- Expected classification: `auth_fallback: true`. Represents the false-green this sprint closes:
  an unauthenticated serve that exits 0 with output but never authenticated.

## Edge cases
The sequence / concurrency / fail-closed edge cases (expired-then-refresh-success,
late-transient-after-success, interleaved-pid, rotation, indeterminate trio, year-rollover,
stdout-collision) are constructed programmatically in `../agy-auth-tells.test.js` from labeled
glog-line builders — each transform is auditable in-test rather than a separate hand-authored log.
