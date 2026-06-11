<!-- requirement-format-legacy -->
# Acceptance Criteria — E-LIFECYCLE-001 close-out fix sprint — 17 REAL + 4 PARTIAL GPT 2nd-pass findings (team-guard/mode-guard bypass classes, turbo spend/auth integrity, coverage-gate waiver+expected-source, provider-tier false-green, planning-principles enforce path, ac-coverage fail-closed) + NOTAGAIN §8.3 legacy scoping

**Sprint:** `SP-20260611-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\prd.md`

> Each AC is a testable statement. Exploit-shaped per the β-decided design
> directives (2026-06-11, .warpos/dispshape-prompts/SP-20260611-002-design-directives.md):
> every fix's AC asserts the OLD attack now fails closed, not just that the happy
> path works — false-green is the bug class (BC-16), and every surface here IS an
> enforcer (a wrong fix is an enforcement regression). `verified_by:` lines point
> at per-fix regression tests under `tests/regression/SP-20260611-002/`
> (per-surface isolation, Hard AC #4: a red must localize to ONE file).
>
> Exploit fixtures live under `tests/regression/SP-20260611-002/` (manifest-tracked,
> clearly fixture-namespaced, Hard AC #9 / P-059) so a scan never reads a planted
> fixture marker as a real bypass. Self-lockout fixtures use THROWAWAY auth
> fixtures, NEVER live `auth.json` (Hard AC #1).

## S-1 — team-guard verify-don't-trust: real team existence + readiness, non-circular mode cross-check, loud kill-switch, exact-match roster (R-1)

- AC-1.1: Given a worker dispatched with a nonempty but fabricated/foreign `team_name` (no real `~/.claude/teams/<team>/config.json`), when team-guard runs (the `if (hasTeamName || !isWorker) process.exit(0)` short-circuit at ~team-guard.js:282), then the gate VERIFIES the named team exists + is fresh + carries ε for THIS slug via a real config lookup (reusing lifecycle.verify()/teamCarriesConductor) BEFORE any early exit, and a fabricated team_name does NOT short-circuit the readiness gate.
  verified_by: tests/regression/SP-20260611-002/team-guard-verify.test.js::fabricated-team-name-does-not-bypass-readiness
- AC-1.2: Given a planted `~/.claude/runtime/.team-live-<sid>` marker with no backing real team, when `teamHeartbeatFresh()` is consulted (team-guard.js:62) and `teamLive = teamReady || teamHeartbeatFresh()` (line ~377), then mere presence of the marker does NOT flip `teamLive` — the marker is only honored when corroborated by a config-verified team identity (Hard AC #6: verify-don't-trust on existing markers/config; NO signed-token/signing infrastructure).
  verified_by: tests/regression/SP-20260611-002/team-guard-verify.test.js::planted-team-live-marker-not-trusted-on-presence-alone
- AC-1.3: Given a planted `mode.json` containing `{mode:"solo"}` or `{mode:"oneshot"}` in a session whose REAL harness team state shows an active multi-agent team, when the Agent gate reads mode (team-guard.js:236, exits at ~248/253), then the gate CROSS-CHECKS the mode against the harness team state / team config and does NOT disable itself on the file's say-so alone (Hard AC #5: a gate must not trust mode.json content to decide whether to trust mode.json — the cross-check IS the AC).
  verified_by: tests/regression/SP-20260611-002/team-guard-verify.test.js::planted-solo-mode-json-cannot-disable-agent-gate
- AC-1.4: Given the team-guard kill-switch (`WARPOS_DISABLE_TEAM_GATE==="1"` or `exists(.team-gate-off)`, team-guard.js:~370), when the kill-switch is active and the gate bypasses, then the bypass emits a LOUD event (paths.eventsFile) AND a stderr line carrying attestation fields (which switch, reason) — never a silent bypass (Hard AC #8: any kill-switch/marker-file bypass is logged loudly with attestation).
  verified_by: tests/regression/SP-20260611-002/team-guard-verify.test.js::team-gate-kill-switch-logs-loud-with-attestation
- AC-1.5: Given a team whose roster contains a member NAMED/typed to merely CONTAIN a face token (e.g. `epsilon-helper`, or any field whose JSON contains `beta`), when `lifecycle.js` `verify()` checks face liveness (lifecycle.js:~189, currently `blob.includes(f)`), then the verify uses EXACT per-member identity matching (agentType/role/name === face or its symbol, matching team-guard's `isConductor` `===`) and the substring-containment spoof does NOT false-satisfy a face.
  verified_by: tests/regression/SP-20260611-002/lifecycle-roster-exact-match.test.js::substring-member-name-does-not-false-satisfy-face
- AC-1.6: Given a REAL, config-verified, ready team that legitimately carries ε for the slug, when team-guard and lifecycle verify run, then the gate opens / verify passes exactly as before — the verify-don't-trust hardening does NOT regress the legitimate happy path (R-1 ceiling: no team-system redesign, verify-don't-trust on existing markers only).
  verified_by: tests/regression/SP-20260611-002/team-guard-verify.test.js::legitimate-verified-team-still-passes

## S-2 — mode-write coverage: mode-set.js single-writer emits events + out-of-band detector; mode-guard kill-switch logged (R-2)

- AC-2.1: Given a `node scripts/mode-set.js <mode>` invocation via Bash (outside the `SlashCommand|Skill` PreToolUse matcher, settings.json:~209), when mode-set.js writes `mode.json`, then mode-set.js (the single-writer chokepoint) ITSELF runs the preflight and EMITS the mode lifecycle events — the coverage no longer depends on the hook matcher (matcher-extension remedy REJECTED per directives: brittle, re-creates the matcher-gap class).
  verified_by: tests/regression/SP-20260611-002/mode-write-coverage.test.js::mode-set-emits-lifecycle-events-on-bash-invocation
- AC-2.2: Given a direct out-of-band write to `mode.json` (content/mtime changed) with NO matching mode lifecycle event in the event log, when the out-of-band-write detector runs (at scan), then it produces a LOUD finding (mode.json changed without a matching lifecycle event = red), closing the residual path that bypasses mode-set.js entirely.
  verified_by: tests/regression/SP-20260611-002/mode-write-coverage.test.js::out-of-band-mode-json-write-reds-at-scan
- AC-2.3: Given a normal mode change THROUGH mode-set.js (event emitted), when the out-of-band-write detector runs, then it does NOT red — the detector distinguishes a sanctioned single-writer change from an out-of-band one (no false positive on the legitimate path).
  verified_by: tests/regression/SP-20260611-002/mode-write-coverage.test.js::sanctioned-mode-set-change-not-flagged
- AC-2.4: Given the mode-guard kill-switch (`WARPOS_DISABLE_MODE_GUARD` / `.mode-guard-off`, mode-lifecycle-guard.js:~105, `killReason()` returns env/marker/bootstrap), when the guard no-ops on a kill-switch, then it EMITS a lifecycle/audit event surfaced at /scan — the silent-suppression class (#6, same as #5) is closed.
  verified_by: tests/regression/SP-20260611-002/mode-write-coverage.test.js::mode-guard-kill-switch-emits-audit-event

## S-3 — turbo auth + spend integrity: monotonic-or-attested re-apply, session-anchored spend, nonfinite fail-HIGH, no self-lockout (R-3)

- AC-3.1: Given a same-session repeat `apply --scope all --ttl ... --spend-ceiling ...` that WIDENS scope/ceiling (apply.js:~202, currently purely additive `mergePermissions` with no monotonic check and no provenance), when the re-apply runs, then the widening is refused UNLESS it carries fresh recorded operator provenance (an operator-confirmed attestation stamp per grant), and the provenance is persisted on the authorization record.
  verified_by: tests/regression/SP-20260611-002/turbo-auth-monotonic.test.js::widening-reapply-requires-fresh-provenance
- AC-3.2: Given a legitimate operator re-grant that widens scope WITH fresh provenance, when the attested re-apply runs, then it SUCCEEDS — attested widening stays possible and `granted_at`/the spend anchor are preserved per session (Hard AC #7: monotonic-or-attested must keep legitimate operator re-grants possible; fresh provenance recorded per widening).
  verified_by: tests/regression/SP-20260611-002/turbo-auth-monotonic.test.js::attested-widening-succeeds-anchor-preserved
- AC-3.3: Given prior same-session paid dispatch records and a mid-session re-apply, when the spend ledger computes the spend window (spend-ledger.js:~223, currently `sinceMs = auth.granted_at` which every apply resets at apply.js:~319), then the spend window is anchored to a persisted SESSION START (not `granted_at`) so prior same-session paid calls STAY counted and are not dropped below `sinceMs` (Hard AC #3 / shared-cutoff: ONE session-anchor consumed consistently).
  verified_by: tests/regression/SP-20260611-002/turbo-spend-anchor.test.js::reapply-does-not-drop-prior-session-spend
- AC-3.4: Given a dispatch record with a NONFINITE/overflow byte count (`1e400`→Infinity, NaN), when `clampBytes` processes it (spend-ledger.js:~302), then the record fails HIGH — emits a "suspect record" notice (event + stderr) — instead of silently contributing $0; a huge FINITE count still over-reports (the safe direction) as today.
  verified_by: tests/regression/SP-20260611-002/turbo-spend-anchor.test.js::nonfinite-bytes-fail-high-not-silent-zero
- AC-3.5 (LIVE-SESSION SELF-LOCKOUT — TOP RISK, Hard AC #1): Given a grant applied on a THROWAWAY auth fixture (NEVER live `auth.json`), when the apply.js / spend-ledger.js / authorization-gate.js changes from this sprint are landed, then the PRIOR grant's scopes AND its spend-window anchor are UNCHANGED — the fixes govern FUTURE applies only and do NOT retroactively invalidate or lock out the in-flight session's existing authorization.
  verified_by: tests/regression/SP-20260611-002/turbo-self-lockout.test.js::landing-fixes-does-not-invalidate-prior-grant-on-throwaway-fixture

## S-4 — authorization safety floor: tracked-work-delete floor becomes code (R-4)

- AC-4.1: Given a `node -e "...fs.rmSync(...)"` or `...fs.unlinkSync(...)` command under a turbo `node-e-fs` scope grant, when `matchNodeEFs` evaluates the command (authorization-gate.js:~108, currently includes `rmSync|unlinkSync`), then the scope match is NARROWED to write/append/mkdir only — `rmSync`/`unlinkSync` are NOT in the approvable set and the hook does NOT emit `decision:"approve"` for them (PRIMARY remedy).
  verified_by: tests/regression/SP-20260611-002/auth-floor-tracked-delete.test.js::node-e-fs-does-not-approve-rm-unlink
- AC-4.2: Given a delete of TRACKED uncommitted work via ANY scope (not only node-e-fs), when `isInSafetyFloor` evaluates it (authorization-gate.js:~172, currently only git-push-force + backup-branch patterns), then an EXECUTABLE git-aware tracked-work-delete floor forces pass-through (no `approve`) — the SAFETY_FLOOR prose at apply.js:252 is now code (BACKSTOP remedy; Hard AC #10/#1 directives — both remedies, DO BOTH).
  verified_by: tests/regression/SP-20260611-002/auth-floor-tracked-delete.test.js::tracked-work-delete-hits-executable-floor-any-scope
- AC-4.3: Given a write/append/mkdir under a legitimate `node-e-fs` grant, AND a delete of an UNtracked/ignored temp path, when the gate evaluates them, then the legitimate write is still approved and the untracked-temp delete is not floor-blocked — the floor is git-aware and does not over-block non-tracked-work (membership-parity for the legitimate path).
  verified_by: tests/regression/SP-20260611-002/auth-floor-tracked-delete.test.js::legitimate-write-and-untracked-delete-not-overblocked

## S-5 — coverage-gate waiver provenance + external expected-source + legacy scoping (R-5)

- AC-5.1: Given a `coverage-gate.js` waiver branch (~111) where `exp.waiver` carries only a free-text `reason` STRING and no provenance, when `evaluate()` runs, then the role is NOT silently `waived`+`continue`d — the waiver is REJECTED the same way an unbacked record is, because provenance (operator/source id + ts + auditable trail / backed waiver record) is now REQUIRED.
  verified_by: tests/regression/SP-20260611-002/coverage-gate-waiver.test.js::free-text-reason-waiver-rejected-without-provenance
- AC-5.2: Given a waiver that DOES carry full provenance (operator/source + ts + backing record), when `evaluate()` runs, then the role is legitimately waived AND the active waiver (with its provenance) is SURFACED in scan output — a silenced role is visible at /scan, not hidden.
  verified_by: tests/regression/SP-20260611-002/coverage-gate-waiver.test.js::provenance-backed-waiver-honored-and-surfaced-in-scan
- AC-5.3: Given `coverage-gate-scan.js` deriving `expected` (line ~61, currently only distinct roles that CLAIM `ok:true` in the run), when the self-audit scan runs, then `expected` is derived from an EXTERNAL source (registry / sprint composition), so a role that produced NO record is still expected → still a gap (the omitted-role slip is closed).
  verified_by: tests/regression/SP-20260611-002/coverage-gate-scan-source.test.js::omitted-role-is-still-expected-from-external-source
- AC-5.4 (SHARED CUTOFF — Hard AC #3): Given the legacy-scoping cutoff for historic records, when both `coverage-gate-scan` and `check-ac-coverage` (R-8) consume it, then they consume ONE shared RECORD_BACKED_CUTOFF-style cutoff constant/helper; if their enforce-path wiring dates genuinely differ, the divergence is EXPLICIT per-ticket with a written rationale (never two independently-drifting cutoffs).
  verified_by: tests/regression/SP-20260611-002/legacy-cutoff-shared.test.js::single-shared-cutoff-consumed-by-both-consumers
- AC-5.5 (SCOPE-THEN-FLIP, not scope-as-loophole — Hard AC #3): Given a planted coverage violation dated AFTER the cutoff (cutoff = the new enforce path's wiring date), when the legacy-scoped scan runs, then the post-cutoff violation still REDS — legacy scoping exempts only genuinely historic records, never the new enforce path.
  verified_by: tests/regression/SP-20260611-002/legacy-cutoff-shared.test.js::post-cutoff-planted-violation-still-reds

## S-6 — provider-tier truthfulness: --enforce verdict matrix, fail-closed config, envelope ok mirrors verdict (R-6)

> Hard AC #2: provider-tier is ONE ticket with a literal verdict-matrix AC. The
> truth-table cells below are enumerated as test rows across
> {selected_tier × t1_met × config_readable × verdict}.

- AC-6.1 (matrix cell): Given `selected_tier=t3` AND `t1_met=false` (T1 down → effectiveTier `none`) AND a READABLE config, when `--enforce` evaluates the verdict (provider-tier-check.js:~269), then the verdict is `tier_short` (confident, value-free-detectable) — NOT `unknown-self-attested` — and `--enforce` REDS (exits non-zero), not exit 0.
  verified_by: tests/regression/SP-20260611-002/provider-tier-matrix.test.js::t3-selected-t1-down-readable-config-reds-as-tier-short
- AC-6.2 (matrix cell): Given an operator-RAISED floor (selected_tier=t3) AND a PRESENT-but-CORRUPT/unreadable config instance file, when `readConfig` runs (provider-tier-config.js:~123, currently falls back to FRAMEWORK_DEFAULTS), then it FAILS CLOSED (red/hold, preserving the raised floor / last-known) — it NEVER silently degrades to framework-default t1 (which would read false-green).
  verified_by: tests/regression/SP-20260611-002/provider-tier-matrix.test.js::raised-floor-corrupt-config-fails-closed-never-framework-default-green
- AC-6.3 (matrix cell): Given `verdict_summary=tier_short`, when `buildReport` emits the JSON envelope (provider-tier-check.js:~338, currently hardcodes `ok:true`), then `ok = (verdict_summary !== "tier_short")` → the envelope carries `ok:false` on tier_short, so an `ok`-only consumer cannot false-green.
  verified_by: tests/regression/SP-20260611-002/provider-tier-matrix.test.js::envelope-ok-false-on-tier-short
- AC-6.4 (matrix cell): Given T1 AND T2 ARE met but only the T3 sub-floor is genuinely undetectable, when the verdict is computed, then `unknown-self-attested` is RESERVED for exactly this case (not used when T1 is detectably down) — the distinction is preserved.
  verified_by: tests/regression/SP-20260611-002/provider-tier-matrix.test.js::unknown-self-attested-reserved-for-t1-t2-met-t3-undetectable
- AC-6.5 (matrix cell): Given an ABSENT config instance file (greenfield, no raised floor), when `readConfig` runs, then framework defaults are applied (absent ≠ corrupt) — the fail-closed behavior of AC-6.2 distinguishes "absent (greenfield, defaults ok)" from "present-but-corrupt (suspicious, don't relax)".
  verified_by: tests/regression/SP-20260611-002/provider-tier-matrix.test.js::absent-config-greenfield-uses-defaults
- AC-6.6 (matrix cell): Given `selected_tier=t1` AND `t1_met=true` AND readable config (the fully-satisfied happy path), when `--enforce` runs, then the verdict passes and `--enforce` exits 0 with envelope `ok:true` — the hardening does not regress the satisfied case.
  verified_by: tests/regression/SP-20260611-002/provider-tier-matrix.test.js::t1-selected-met-readable-passes-exit-0

## S-7 — planning-principles real --enforce path + scan scope extended (R-7)

- AC-7.1: Given a planted-violation fixture (a plan with a real principle gap), when `planning-principles.js --enforce` runs (currently `--enforce` is an ignored unknown arg, CLI always `process.exit(0)` at ~221), then `--enforce` is parsed and the process exits NON-ZERO (`process.exit(reportOnly || ok ? 0 : 1)`) — the flip becomes possible.
  verified_by: tests/regression/SP-20260611-002/planning-principles-enforce.test.js::planted-violation-exits-nonzero-under-enforce
- AC-7.2: Given an internal runner error during a `--enforce` run (currently catch → `ok:true`/exit 0 at ~203), when the error is caught, then under `--enforce` it FAILS CLOSED (exit 2), never `ok:true` — an internal error cannot mask findings.
  verified_by: tests/regression/SP-20260611-002/planning-principles-enforce.test.js::internal-error-fails-closed-exit-2-under-enforce
- AC-7.3: Given a plan whose section bodies contain bare word presence only (literal "no enforcer"/"no proof" text, the loose-regex weakness probed at #17), when the section tests run, then they require a heading/LABEL — not bare word presence — so a plan cannot satisfy the enforcer/proof tests by mere word occurrence.
  verified_by: tests/regression/SP-20260611-002/planning-principles-enforce.test.js::section-tests-require-heading-not-bare-word
- AC-7.4: Given a violation in `_planning/sprints` or a root lifecycle plan (outside the default `_planning/epics`, finding #19), when the scan runs, then the extended scan scope covers `_planning/sprints` + root plans (or `--all`) and the previously-unscanned violation is found.
  verified_by: tests/regression/SP-20260611-002/planning-principles-enforce.test.js::scan-scope-covers-sprints-and-root-plans

## S-8 — check-ac-coverage --enforce fail-closed on missing/unreadable artifact + legacy scoping (R-8)

- AC-8.1: Given a planted-MISSING or unreadable named `--file`/resolved AC artifact, when `check-ac-coverage.js --enforce` runs (currently `runCategoryMode` returns `{error:"unreadable", ok:true, uncovered:[]}` at ~307 and `anyGap` filters `!r.error` at ~338 → exit 0), then under `--enforce` the unreadable NAMED artifact is treated as a FAILURE (exit non-zero) — a planted-missing artifact no longer PASSES the enforce gate.
  verified_by: tests/regression/SP-20260611-002/ac-coverage-failclosed.test.js::missing-named-artifact-reds-under-enforce
- AC-8.2: Given a no-target / greenfield run (no NAMED artifact resolved at all), when `--enforce` runs, then the fail-open is PRESERVED for the greenfield case only — the fail-closed change applies to a NAMED-but-unreadable artifact, not to the absence of any target.
  verified_by: tests/regression/SP-20260611-002/ac-coverage-failclosed.test.js::greenfield-no-target-still-fail-open
- AC-8.3: Given a historic sprint predating the new enforce path's wiring date, when legacy scoping applies, then it consumes the SAME shared RECORD_BACKED_CUTOFF-style helper as R-5 (AC-5.4) and a post-cutoff planted violation still REDS (AC-5.5 holds for this consumer too — scope-then-flip).
  verified_by: tests/regression/SP-20260611-002/ac-coverage-failclosed.test.js::legacy-cutoff-shared-and-post-cutoff-reds
- AC-8.4: Given the proof-syntax weakness (`chunkHasProof` accepts arbitrary non-evidence prose like "proof: yes" as 20/20, check-ac-coverage.js:~173), when this sprint closes, then the weakness is carried as a DOCUMENTED residue (proof-syntax note) — explicitly out of scope for the fix, recorded so it is not silently dropped.
  verified_by: not_applicable — documented residue per directives (proof-syntax minor carried as known residue, not fixed this sprint); justification: directives scope #18 to the missing-artifact fail-closed fix + legacy scoping, with the proof-syntax minor as carried residue.

## S-9 — hooks-coverage allowlist schema: owner/expiry/reason, stale flagged (R-9)

- AC-9.1: Given an allowlist entry in `mode-lifecycle-hooks-coverage.js` (~235, `wiring_pending`), when the coverage check loads it, then the entry is REQUIRED to carry an `owner` + `expiry`/`review_by` + `reason` schema — a schemaless entry (no owner/expiry) is rejected (or downgraded to a gap), closing the permanent-silent-allowlist anti-pattern.
  verified_by: tests/regression/SP-20260611-002/hooks-coverage-allowlist.test.js::schemaless-allowlist-entry-rejected
- AC-9.2: Given an allowlist entry whose `expiry`/`review_by` date is in the PAST, when the coverage check runs, then the expired entry is FLAGGED (or downgraded to a gap so `--enforce` would fail on it) — an entry cannot suppress a real emitter-gap forever.
  verified_by: tests/regression/SP-20260611-002/hooks-coverage-allowlist.test.js::expired-allowlist-entry-flagged
- AC-9.3: Given a well-formed, in-date allowlist entry (owner + future expiry + reason), when the check runs, then the entry is honored as INFO (not a gap) and not flagged — the schema does not over-flag valid entries.
  verified_by: tests/regression/SP-20260611-002/hooks-coverage-allowlist.test.js::valid-in-date-entry-honored-not-flagged

## S-10 — wrapper mode binding: dispatch wrappers thread live mode into validateDispatchForClass (R-10, post-SP-001 merge)

> BLOCKED-BY: SP-20260611-001 WS-A merge (file overlap on dispatch wrappers).
> Hard AC #10: ticket RE-LOCATES the `validateDispatch` call sites post-merge —
> the cited lines (dispatch-agent.js:508, dispatch-claude.js:315) WILL have moved;
> do not pin stale line numbers.

- AC-10.1: Given both live wrappers' `validateDispatch` calls (dispatch-agent.js, dispatch-claude.js — call sites RE-LOCATED post-SP-001 merge), when a dispatch is validated, then the current mode (read from `mode.json`) is threaded into the call so `dispatch-contract.js`'s `if (req && req.mode && ...)` mode-narrowing branch is actually reached — the narrowing is no longer dead at the call site.
  verified_by: tests/regression/SP-20260611-002/wrapper-mode-binding.test.js::wrappers-thread-mode-at-both-relocated-call-sites
- AC-10.2: Given a live dispatch of a shape disallowed by the current mode's `mode_profiles`/`alpha_only_shapes`, when validateDispatch runs WITH the threaded mode, then the mode-narrowing GATES the dispatch (refuses under enforce) — the profile is now live-enforced, not merely internally coherent.
  verified_by: tests/regression/SP-20260611-002/wrapper-mode-binding.test.js::mode-narrowing-gates-live-dispatch
- AC-10.3: Given the report-only ramp env (`WARPOS_DISPATCH_CONTRACT_ENFORCE` unset/report-only), when a mode-disallowed dispatch runs, then it is REPORTED not blocked — the report-only ramp posture is preserved (no premature blocking flip in this sprint, per non-goals).
  verified_by: tests/regression/SP-20260611-002/wrapper-mode-binding.test.js::report-only-ramp-preserved-not-blocking

## Cross-cutting

- AC-X.1: All pre-existing suites stay green after every fix: team-guard / mode-lifecycle-guard / lifecycle selftests, turbo apply + spend-ledger tests, authorization-gate tests, coverage-gate + coverage-gate-scan selftests, provider-tier tests, planning-principles tests, check-ac-coverage tests, hooks-coverage tests, dispatch-contract + wrapper tests, trackers validate 20/20. Each surface is an enforcer (BC-16): a wrong fix is an enforcement regression.
  verified_by: tests/regression/SP-20260611-002/suite-regression.test.js::existing-suites-green
- AC-X.2 (PER-SURFACE EXPLOIT ISOLATION — Hard AC #4): Each of the G3 enforcer surfaces (coverage-gate, coverage-gate-scan, provider-tier, planning-principles, check-ac-coverage, hooks-coverage) has its OWN exploit fixture + its OWN green-corpus assertion, INDEPENDENTLY runnable, so a red localizes to ONE file — even inside a multi-surface ticket, the per-surface regression tests stay separate.
  verified_by: tests/regression/SP-20260611-002/suite-regression.test.js::g3-surfaces-independently-runnable-red-localizes-to-one-file
- AC-X.3 (FIXTURE NAMESPACING — Hard AC #9 / P-059): Every exploit fixture lives under `tests/regression/SP-20260611-002/` (manifest-tracked), clearly fixture-namespaced, so a /scan never reads a planted-marker fixture (e.g. a planted `mode.json`, `.team-live` marker, or coverage violation) as a REAL bypass.
  verified_by: tests/regression/SP-20260611-002/suite-regression.test.js::fixtures-namespaced-not-read-as-real-bypass
- AC-X.4 (NO REPORT-ONLY→BLOCKING FLIP): No fix in this sprint EXECUTES a report-only→blocking flip — every enforce path lands report-only (or behind `WARPOS_DISPATCH_CONTRACT_ENFORCE`/equivalent) until the operator's end-of-session words; the new enforce code is proven-capable (exits non-zero on a planted violation in a test harness) without being flipped on in production.
  verified_by: tests/regression/SP-20260611-002/suite-regression.test.js::no-blocking-flip-executed-this-sprint
