# β CONSULT r3 VERDICT — S-VLADW1-01 gauntlet r2 → fix attempt 2/3 (2026-08-18)
consult_msg_id: e6e904ab-714e-4f4e-9eaf-3a66b046321c (α → β) · verdict msg_id: 9b2f60ae-3c14-4d87-a5f6-71e0c8d3b429 (β pre-committed) · row 302
DECISION: DECIDE · Class B · confidence 0.88 (Q1 0.87 · Q2 0.91) · OPEN_ADR: true — ADR-0041 **Amendment 4** (do NOT collide with Amendment 3 = r2 ED-340 rider)
Precedent: 3d9a71c4 (r2 parent) · c4b81e7f (Amendment 1 discriminator: deny-by-default is immune to shape drift; pattern-match must enumerate classes) · 7c4e2b96 A6 (custody wording is Class C) · DP-gap #46 / P-094

## Verified at source
- Class claim REAL: spawn-env-allowlist.js:138 RAW_LAUNCH_PATTERN `\s*` admits whitespace only → `spawn /* c8 ignore */ (` unmatched; line 169 `content.replace(/auditedSpawn\s*\(/g,"")` gives the mirror false-POSITIVE; DYNAMIC_CALL_PATTERN `([^)]*)` breaks on one nested paren; line 668 `/\.\.\.\s*process\.env\b/` raw text. Regex-over-raw-text is the class.
- r2 conditions executed (quota.js, quota.test.js, branding-identity-enforcer.js, branding.test.js exist; AC-9.5 wired at model-seam.js:487).
- DECISIVE FACT: model-seam.js:380-405 — under SUBSCRIPTION (live default) buildSessionEnv puts NO credential in the child env; the credential lives in the Claude Code CLI login store on disk, read by the SDK subprocess. ANTHROPIC_API_KEY enters a constructed env ONLY in the API_KEY fallback branch (389/396). So live exposure = AMBIENT INHERITANCE of vars the user's shell carries — not engine-constructed carriage.

## Q1 — NEITHER (A) NOR (B). Re-base the guarantee; keep the release posture.
- NOT (A): relabelling static scanners "advisory" = dropping a DoD obligation (DoD: enforcer refuses any raw spawn/exec/fork bypassing the wrapper; ADR-0041 Consequences: "Report-only does not satisfy any proven clause"). Scope reduction wearing honesty's clothes — not authorizable (no-regress on locked build; P-064).
- NOT (B): AST buys precision, not closure — still doesn't reach a spawn inside a dependency (A1: unclosable by any in-repo enforcer). Trades the release for an improvement that leaves the class open one layer out; deferral-shaped.
- THE MOVE: stop enumerating call-site shapes; REMOVE THE SECRET FROM THE CHANNEL they all exploit. Every bypass (interposed comment, cp['spawnSync'], createRequire, globalThis['fetch'], future composites) leaks by child inheritance of the parent env. CAPTURE denylisted values into a module-private in model-seam.js at startup, then DELETE them from process.env. Nothing left to inherit; HOW the child was spawned stops being load-bearing. Deny-by-default (Amendment 1's discriminator applied to call-site shape). Dependency-free, small, model-seam.js is already the only module permitted to touch credential material.

### Conditions (BINDING)
1. Capture-then-scrub lands THIS round in model-seam.js and is the load-bearing control for the inheritance channel. Capture FIRST (API_KEY mode reads process.env.ANTHROPIC_API_KEY at buildSessionEnv time — blanket scrub without capture breaks the fallback seam), then delete every ENV_DENYLIST name from process.env.
2. ORDERING is asserted by a standing test: scrub runs before any import that could spawn (anything spawned earlier inherits). Test the ordering, not just the deletion.
3. Mutant OBSERVED RED before its AC is marked verified: remove the scrub, spawn a raw child by a path no scanner matches, assert the child sees the secret. Run the plant first to learn the lever (P-107). That mutant = the standing proof the class is closed.
4. Falsifiable premise (state, don't assert): the SDK's bundled binary needs no denylisted var in the PARENT env under subscription mode (sdk.d.ts:1435-1441 says supplied env replaces the subprocess env entirely → predicts yes). VERIFY with one live subscription-mode call before the ceiling sentence is written. If the binary needs one, narrow the scrub to vars it does not need AND DISCLOSE the narrowing.
5. Keep the tokenizer (~30 lines: kills the false-negative class AND the line-169 false-positive class) but LABEL it correctly: it widens the existing matcher family; it does NOT close the class — the scrub does. Do not mint a second walker.
6. Static scanners stay FAIL-CLOSED and keep their DoD role for surfaces they genuinely bound — committed files, log call sites, telemetry builders (P1), outbound call sites (P4). The honest named ceiling is specifically P2's RAW-LAUNCH DETECTION (bounded by syntactic enumeration). Name that one thing; do not demote the set.
7. BOTH HALVES: scrub covers the ENV channel; it does NOT cover ARGV — auditedSpawn scans opts.env only, logEvent records argCount; a secret passed as an argv passes every runtime gate today. argv inspection lands in the SAME round or a CUSTODY.md runtime-guarantee sentence would be the third PROVEN-over-unproven violation.
8. The CUSTODY.md CEILING SENTENCE IS CLASS C → OPERATOR. β rules what the enforcer proves, not how it is worded to a user (acceptance-criteria.md:344-346: final user-facing custody wording is operator territory; no builder may finalise it). Draft to the proven set; ROUTE the wording. α may NOT write "static scanners are advisory" into user-facing copy on this verdict.

### Two riders (claims about to ship)
- Do NOT carry SANCTIONED_CARRIER_NOTE verbatim into CUSTODY.md — inaccurate for the live mode: it says the env carries API_KEY mode's key OR SUBSCRIPTION mode's local CLI login state ("carries only the mode-appropriate credential, never both"); under subscription it carries NEITHER (login state is read from disk by the subprocess). Correct it, then carry it — carrying is still owed (r2 Q2 violation, still unfixed).
- model-seam.js:32-38 (M9): createModelSession has NO production caller → the "sole sanctioned carrier" is a dead path today. CUSTODY.md must state it as the DESIGNED carrier, not an operating one (P-092 asserted-not-observed).

## Q2 — CONFIRMED. Fix attempt 3 is the LAST. Release rule PRE-COMMITTED before r3's result exists:
RELEASE iff ALL FOUR hold at r3 close:
- R1 — zero execution-proven leaks (no open finding where a real child obtained a real secret against a green gate).
- R2 — zero PROVEN-over-unproven in shipped copy (CUSTODY.md P2 sentence, package.json custody prose, any new ceiling sentence — every claim maps to a control that is wired and actually runs).
- R3 — the shape-independent control exists, ordering asserted by test, mutant OBSERVED RED.
- R4 — AC-8.4's committed re-runnable mutant test exists and observed RED (carried from r2).
All four → RELEASE, with the P2 raw-launch residual recorded as named enforcement debt and the wording routed to the operator.
Any one fails → NO release, NO fourth fix round: close S-VLADW1-01 at its honest state (unmet DoD items UNMET with residuals named; ED-340 stays open; remaining work → a named successor sprint). That is the decision, not a deferral.
Discriminators (fixed now): re-confirmation of an already-counted finding is NOT new (P-094); a new finding in an already-ceiling'd-and-disclosed class does NOT fire R1 unless execution-proven against a green gate; LANE VERDICTS DO NOT DECIDE THIS (four FAILs on MEDIUMs can still release; four PASSes can still fail R2); α applies at r3 close and records the outcome VERBATIM.
