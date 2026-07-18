# qa-plan — SP-20260718-003 (Phase 1: routing + security truth)

**Authored by:** quality-lead (in-process consult, opus, design step) · **Conducted by:** Alex ε · **Confidence:** 0.87
**Disposition criterion (binding):** the one irreversible outcome is a **FALSE-GREEN in the security/routing surface** (a binding gate reporting PASS/GREEN without trustworthy evidence — a down lane read up, a wrapper-claimed provider that didn't run, a fail-open loader). Must-fix, NEVER dispositionable. Over-blocking (BLOCKED-INCONCLUSIVE when evidence absent) is SAFE. Every tooth is two-sided/falsifiable — the NEGATIVE control is the teeth.

## β-tightening teeth (fixture · assertion · test file) — each = N positive + ≥1 negative control
**T1 — D1↔D5 in-process-panel rejection (sharpest false-green).** `panel-lane-contract test` (AC-7).
- A: a cross-provider lane (gpt/agy) declared/resolved `in-process-agent` → `validatePanelManifest()` fail-closed AND `dispatch-review.js` panel-runner refuses BEFORE merge (a refusal, not a warning).
- B (negative — the real false-green): both cross-provider lanes coerced to Claude in-process, labeled "3-lab" → panelStatus ≠ PASS; an all-Claude set is NOT accepted as cross-provider (≥2-family fails closed). *The masquerade this phase kills — must have explicit teeth.*
- C (sanctioned, must PASS): claude third_pass hunter `in-process-agent` via `security_claude_hunter` → accepted (CLI-only tooth must NOT over-reject the hunter).

**T2 — contracted-but-DOWN-lane→BLOCKED (anti-false-green backbone).** `panel-canary test` (AC-9,11).
- agy contracted + ZERO agy record (today's real state) → `panelStatus===BLOCKED-INCONCLUSIVE`; panel-3lab exit `BLOCKED-ON-OPERATOR`. **Test FAILS if the panel EVER returns PASS/GREEN with any contracted lane absent.** + assert every dependent gate reflects the lane down (no downstream silent read-up).

**T3 — fail-closed, one negative fixture PER vector (three SEPARATE fixtures).** `panel-fail-closed test` (AC-1,12).
- judge-refusal→BLOCKED · malformed-verdict→BLOCKED · missing-evidence→BLOCKED (three distinct fixtures, not one parametrized row). Negative control: a clean all-lanes-alive run → PASS (reducer isn't vacuously always-BLOCKED).

**T4 — eval-fail-closed vs loader-fail-open SPLIT (two NAMED tests).** `panel-fail-closed` (eval) + `panel-loader-fail-closed` (loader) (AC-1,13).
- Loader test: a lane erroring WHILE LOADING (passesOf throw / manifest/registry/prompt unreadable / parse fail) → BLOCKED at the LOADER boundary, distinct code path. Assert both paths independently reach BLOCKED — a loader throw never falls through to PASS or the evaluator default. Two tests so a fix to one can't mask the other.

**T5 — evidence-bound liveness + negative attestation.** `panel-liveness test` (AC-8) + `cert-attest test/fixtures` (AC-14,15).
- Liveness+: real ledger record `tool_id∈{codex,gemini,agy}`, `shape==="subprocess-cross-provider"`, `fallback===false`, non-null output_digest, same-run run_id/sprint_id → alive.
- Liveness− (load-bearing): a config echo / registry declaration offered as proof → REJECTED; `fallback:true` → REJECTED.
- Attestation− (the falsifiability fixture — MUST exist): wrapper CLAIMS agy but return is Claude/absent → attestPanelRun FAILS; a record-inprocess/provider:claude record for a gpt/agy-contracted lane → FAILS (satisfies only the claude hunter). Absence of this fixture = the attestation surface is unfalsifiable = ship-blocker.

**T6 — skill-lane flip ramp.** `dispatch-shape test + shape-door regression` (AC-18).
- Negative: a formerly report-only-flagged violation now BLOCKS (post-burn-in). No-widen: one negative fixture PER sanctioned lane. FIX-A3 landmine: the sanctioned-lane-suppression branch still suppresses (correct) and is NOT a general bypass — assert a NON-sanctioned lane cannot ride the suppression path. Keep fixtures in data, not prose (self-tripping-enforcer-literal guard).

## AC verified_by coverage audit (AC-1..AC-19) — BINDING strengthenings
Concrete/adequate: AC-1,2,4,5,6,7,8,9,11,12,13,14,15,18,19. FLAGGED (verification-rigor, false-green in the VERIFICATION itself):
- **AC-3 (ADR grep) VAGUE** → grep PLUS assert the ADR contains the normative decision line "Agent-tool channel = Claude-only capability, distinct from registry role-routing" AND ED-208 marked *resolved* (status token), not just mentioned.
- **AC-16 (6-token grep) VAGUE** → assert each of the six appears as a section/field defining a value (e.g. `required:` resolves to `[gpt,claude,agy]`); ideally parse the ADR's machine-readable block + cross-check `panel-lane-manifest.json` (single-source, no drift).
- **AC-17 (sunset) → make TWO-SIDED:** a PAST-date fixture → /scan:full exits non-zero AND a FUTURE-date fixture → exits 0. Without the past-date failing case the enforcer is unfalsifiable (the exact class this sprint kills, applied to its own tooling).
- **AC-10** acceptable (existence-grep of the operator action); the honest-accounting value is in T2's BLOCKED-ON-OPERATOR assertion. Keep both.
No AC lacks a verified_by; coverage complete; the 4 flags are verification rigor, not gaps.

## Gauntlet lane note
- **qa-reviewer (always):** functional + traceability AC-1..19 bijection + integrity (every D→AC, every AC→a runnable teeth test).
- **backend-reviewer (yes):** dispatch-agent.js providerToolId BOTH sites, providers.js antigravity branch, safe-spawn.js ARG_POLICY, beta-consult.js abs-path. Refactor-hygiene: grep BOTH ternary sites (anthropic→claude lib-only-fix class — one raw site = re-opened bug).
- **security-reviewer (always — home turf):** must confirm (a) T1-B in-process-coercion false-green CLOSED (all-Claude set can't pass as cross-provider), (b) T5 negative attestation has real teeth (claimed-agy/returned-claude actually FAILS), (c) the sanctioned claude hunter is NOT over-rejected. BINDING; a FAIL cannot be overridden.
- Family: 2-family (agy DOWN) — the meta-gauntlet runs on panel-2family, do NOT self-contradict by claiming 3-lab. sol→terra on security shapes. WARPOS_SPRINT_ID on all CLI dispatches.

## Top QA risks
1. In-process coercion masquerade (T1-B) — highest; guard = T1-B + T5 negative attestation both present with teeth. The disposition criterion incarnate, non-dispositionable.
2. Enforcer self-false-green (AC-17 sunset no-op, AC-3/16 grep-on-prose) — guard = two-sided/structural strengthenings.
3. Loader path falls through to PASS (T4) — guard = the SPLIT as two named tests.
4. Seam drift across 4 files (providerToolId) — guard = grep-both-sites + validatePanelManifest single-source.

## Escalation to ε
NO unfalsifiable-false-green gap to escalate. HOW-guidance (all within design scope, no new irreversible risk): (a) REQUIRE T1-B + T5's negative attestation fixture as NAMED, PRESENT artifacts before the gauntlet step opens (absence = the surface is unfalsifiable = design-incomplete, not a build discovery); (b) make AC-17 two-sided, AC-3/AC-16 structural-not-grep.
