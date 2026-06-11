<!-- requirement-format-legacy -->
# COPY Requirements — E-LIFECYCLE-001 close-out fix sprint — 17 REAL + 4 PARTIAL GPT 2nd-pass findings (team-guard/mode-guard bypass classes, turbo spend/auth integrity, coverage-gate waiver+expected-source, provider-tier false-green, planning-principles enforce path, ac-coverage fail-closed) + NOTAGAIN §8.3 legacy scoping

**Sprint:** `SP-20260611-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\prd.md`

> COPY captures user-visible text. This is an ENGINE sprint — the "user" is the
> operator/orchestrator reading stderr + the event log + /scan output. The COPY
> contract here is the refusal, audit-event, and finding strings the fixes emit:
> they must self-identify the enforcer, the reason, and the recovery path
> (ED-043 class: refusals must self-identify). Exact final wording is
> builder-chosen; each entry pins the REQUIRED content elements. Kill-switch /
> bypass strings are MANDATORY-LOUD per Hard AC #8 — never silent.

## C-1 — team-guard verify-don't-trust refusals + loud kill-switch (linked story `S-1`, `R-1`)

**Context:** stderr/event when a fabricated team_name fails the config lookup, a planted marker is not trusted, a planted mode.json is cross-checked, or the kill-switch is used.
**Text:**

> [team-guard] team '<name>' not found / not ready in ~/.claude/teams/<name>/config.json — blocking (verify-don't-trust: a team_name string or a presence marker is not membership)
> [team-guard] mode.json says '<mode>' but harness team state shows an active team — gate NOT disabled (cross-check)
> [team-guard] KILL-SWITCH ACTIVE: <WARPOS_DISABLE_TEAM_GATE|.team-gate-off> — gate bypassed; reason='<reason>'; this bypass is LOGGED and surfaces at /scan

**Notes:** The kill-switch line is MANDATORY (event + stderr) with attestation fields (which switch, reason) — Hard AC #8. The "not found / not ready" refusal names the config path (recovery: stand up / refresh the real team). NO signed-token language (R-1 ceiling: verify-don't-trust on existing markers/config only).

## C-2 — mode-write coverage: out-of-band detector finding + mode-guard kill-switch (linked story `S-2`, `R-2`)

**Context:** /scan finding when mode.json changed without a matching lifecycle event; audit event when the mode-guard kill-switch fires.
**Text:**

> [mode-coverage] mode.json changed (content/mtime) with no matching mode lifecycle event — out-of-band write (use `node scripts/mode-set.js <mode>`, the single writer)
> [mode-guard] KILL-SWITCH ACTIVE: <WARPOS_DISABLE_MODE_GUARD|.mode-guard-off> — preflight suppressed; reason='<reason>'; surfaced at /scan

**Notes:** Out-of-band finding names the single-writer recovery path. Kill-switch audit event mirrors C-1's loudness contract (closes the #6 silent-suppression class).

## C-3 — turbo auth + spend integrity refusals (linked story `S-3`, `R-3`)

**Context:** stderr when a widening re-apply lacks provenance, and when nonfinite bytes are seen.
**Text:**

> [turbo:apply] re-apply WIDENS scope/ceiling without fresh operator provenance — refusing (monotonic-or-attested: an attested widening must carry operator confirmation); re-run with explicit operator attestation to widen
> [spend-ledger] suspect record: non-finite byte count (<value>) — flagged HIGH, not counted as $0 (possible spoof); record id=<id>

**Notes:** Self-identifying refusal (enforcer + reason + recovery) per ED-043. The provenance refusal must NOT fire for a non-widening re-apply or a properly-attested widening (AC-3.1/3.2). The spend-anchor change is silent on the happy path (prior session spend simply stays counted — no new copy there).

## C-4 — authorization safety-floor pass-through (linked story `S-4`, `R-4`)

**Context:** the gate decision/audit note when a tracked-work delete is forced to pass-through (no auto-approve) under any scope.
**Text:**

> [authorization-gate] tracked-work delete (fs.rmSync/unlinkSync/rm -rf on a git-tracked path) — NOT auto-approved (safety floor); falls through to normal review

**Notes:** Names the floor as the reason. The node-e-fs narrowing is silent (the scope simply no longer matches rm/unlink); the floor pass-through note is the visible signal. Must NOT fire for an untracked/ignored-path delete (AC-4.3).

## C-5 — coverage-gate waiver provenance + scan surfacing (linked story `S-5`, `R-5`)

**Context:** refusal when a waiver lacks provenance; scan line listing active provenance-backed waivers; finding when an omitted role is now expected.
**Text:**

> [coverage-gate] waiver for role '<role>' lacks provenance (operator/source + ts + backing record) — REJECTED (a free-text reason is not a waiver); attach a backed waiver record
> [coverage-gate] active waiver: role='<role>' operator='<op>' ts='<iso>' source='<ref>' (surfaced for audit)
> [coverage-gate-scan] role '<role>' expected (from registry/sprint composition) but produced no record — gap (self-audit no longer trusts ok:true-only)

**Notes:** The waiver-reject mirrors the unbacked-record rejection (AC-5.1). Active-waiver line makes a silenced role VISIBLE at /scan (AC-5.2).

## C-6 — provider-tier verdict + fail-closed config (linked story `S-6`, `R-6`)

**Context:** stderr/envelope when --enforce reds on tier_short, and when a present-but-corrupt config fails closed.
**Text:**

> [provider-tier] selected_tier=t3 but T1 is down (detectable) — verdict=tier_short; --enforce FAILS (exit non-zero); not 'unknown-self-attested'
> [provider-tier-config] instance config present but unreadable/corrupt — FAILING CLOSED (preserving raised floor); not degrading to framework defaults

**Notes:** The verdict string must distinguish the value-free-detectable tier_short from the genuine unknown-self-attested (T1/T2 met, only the T3 sub-floor undetectable — AC-6.4). Envelope `ok` mirrors verdict (AC-6.3).

## C-7 — planning-principles --enforce refusal (linked story `S-7`, `R-7`)

**Context:** the exit + message when --enforce finds violations or hits an internal error.
**Text:**

> [planning-principles] <N> principle violation(s) found — --enforce: exiting non-zero (the flip path is now real)
> [planning-principles] internal error under --enforce — FAILING CLOSED (exit 2); an internal error must not mask findings

**Notes:** Self-identifying. The internal-error line is the fail-closed contract (AC-7.2). Extended scan scope is silent (more dirs scanned, same output shape).

## C-8 — check-ac-coverage --enforce fail-closed (linked story `S-8`, `R-8`)

**Context:** the exit + message when a named AC artifact is missing/unreadable under --enforce.
**Text:**

> [check-ac-coverage] named AC artifact '<path>' missing/unreadable under --enforce — FAILING (exit non-zero); a missing artifact is not a pass

**Notes:** Distinguishes the named-but-unreadable failure from the greenfield no-target fail-open (AC-8.2). Legacy-cutoff scoping is silent on the happy path.

## C-9 — hooks-coverage allowlist schema flag (linked story `S-9`, `R-9`)

**Context:** the finding when an allowlist entry is schemaless or expired.
**Text:**

> [hooks-coverage] allowlist entry '<event>' missing owner/expiry/reason — rejected (no permanent silent allowlist)
> [hooks-coverage] allowlist entry '<event>' EXPIRED (review_by <iso> < now) — flagged as gap

**Notes:** Names the missing schema fields (recovery: add owner/expiry/reason) and the expiry condition.

## C-10 — wrapper mode binding (linked story `S-10`, `R-10`)

**Context:** stderr when a mode-disallowed shape is refused (under enforce) or reported (under report-only ramp).
**Text:**

> [dispatch-contract] shape '<shape>' not permitted in mode '<mode>' (mode_profiles/alpha_only_shapes) — <refused under ENFORCE | reported (report-only ramp)>

**Notes:** Single string with the enforce/report-only branch made explicit so the ramp posture is legible (AC-10.2/10.3). Existing dispatch-contract refusal strings otherwise preserved.
