<!-- requirement-format-legacy -->
# Granular Stories — E-LIFECYCLE-001 close-out fix sprint — 17 REAL + 4 PARTIAL GPT 2nd-pass findings (team-guard/mode-guard bypass classes, turbo spend/auth integrity, coverage-gate waiver+expected-source, provider-tier false-green, planning-principles enforce path, ac-coverage fail-closed) + NOTAGAIN §8.3 legacy scoping

**Sprint:** `SP-20260611-002`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. One S-N per requirement area
> (R-1..R-10, single-source from `plan_contract.requirement_areas`, T-298).
> The ~6 surface-grouped tickets minted at `/sprint:design` may bundle multiple
> stories (e.g. the provider-tier matrix ticket spans #15/#16/#21 under S-6);
> the story↔requirement mapping stays 1:1 so trace.md and acceptance-criteria.md
> reference the same R-1..R-10 set.

## S-1 — team-guard verifies real team existence + readiness before any early exit; planted mode.json cannot disarm the Agent gate; kill-switch use logged; lifecycle roster verify exact-match (R-1)

**As** the lifecycle-gate layer
**I want** team-guard to consult `~/.claude/teams/<team>/config.json` for real membership + readiness before any early exit (no nonempty-team_name short-circuit, no presence-only `.team-live` trust), the Agent gate to cross-check mode against harness team state (not trust an unsigned `mode.json`), every kill-switch activation to emit a loud attested event, and `lifecycle.js` roster verify to use exact per-member identity matching
**So that** findings #1 (nonempty team_name bypass), #2 (planted `.team-live` marker), #4 (planted `{mode:"solo"}` disables Agent gate), #5 (silent `WARPOS_DISABLE_TEAM_GATE`), and #7 (substring roster spoof) all fail closed.

Acceptance criteria:
- AC-1.1 .. AC-1.6 (see acceptance-criteria.md — config-verified membership; presence-marker not trusted; non-circular mode cross-check; kill-switch loud-log; exact-match roster verify)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — out-of-band mode.json writes (Bash-direct mode-set.js) become covered; mode-guard kill-switch use logged (R-2)

**As** the mode-lifecycle layer
**I want** preflight + lifecycle-event emission moved INTO `scripts/mode-set.js` (the single-writer chokepoint) and a backstop out-of-band-write detector that reds when `mode.json` changes with no matching lifecycle event, plus loud logging of every mode-guard kill-switch activation
**So that** finding #3 (Bash-direct `node scripts/mode-set.js` writes mode.json outside the `SlashCommand|Skill` matcher, un-preflighted) and finding #6 (silent `WARPOS_DISABLE_MODE_GUARD`) are closed — the matcher-extension remedy is REJECTED (brittle, re-creates the matcher-gap class).

Acceptance criteria:
- AC-2.1 .. AC-2.4 (see acceptance-criteria.md — mode-set emits events; out-of-band-write detector reds; kill-switch loud-log)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — turbo re-apply monotonic-or-attested with operator provenance; spend window keyed to session start; nonfinite bytes fail HIGH (R-3)

**As** the turbo authorization + spend layer
**I want** a widening re-apply to require fresh recorded operator provenance (monotonic-or-attested), `granted_at` / the spend-window anchor preserved across re-applies so prior same-session paid calls stay counted, and nonfinite/overflow byte counts to fail HIGH (suspect-record notice) instead of silently clamping to 0
**So that** findings #8 (provenance-free auth widening), #9 (re-apply resets the spend window and hides prior spend), and #14-partial (nonfinite bytes underreport) are closed — WITHOUT breaking legitimate operator re-grants or invalidating the CURRENT session's live grant.

Acceptance criteria:
- AC-3.1 .. AC-3.4 (see acceptance-criteria.md — monotonic-or-attested widening with provenance; shared-cutoff/session-anchor spend; nonfinite fail-HIGH; live-session self-lockout fixture)

Linked: `H-2`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — authorization safety floor: the tracked-work-delete floor becomes code (R-4)

**As** the authorization-gate layer
**I want** the `node-e-fs` scope match narrowed to write/append/mkdir only (rmSync/unlinkSync NEVER auto-approvable) AND an executable git-aware tracked-work-delete floor in `isInSafetyFloor` that forces pass-through for any `fs.rmSync`/`unlinkSync`/`rm -rf` on tracked paths via ANY scope
**So that** finding #10 (a turbo `node-e-fs` grant auto-approves rm of tracked work; the SAFETY_FLOOR prose at apply.js:252 is prose-only) is closed by BOTH remedies (PRIMARY: scope narrowing; BACKSTOP: executable floor).

Acceptance criteria:
- AC-4.1 .. AC-4.3 (see acceptance-criteria.md — rm/unlink not in node-e-fs approvable set; executable tracked-work-delete floor; floor catches delete via any scope)

Linked: `H-2`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — coverage-gate waiver provenance + external expected-source + RECORD_BACKED_CUTOFF legacy scoping (R-5)

**As** the coverage-gate + coverage-gate-scan layer
**I want** a waiver to require provenance fields (operator/source + ts + auditable trail) and be rejected the same way an unbacked record is when provenance is absent, active waivers surfaced in scan output, `coverage-gate-scan` to derive `expected` roles from an external source (registry / sprint composition) rather than self-auditing only `ok:true` records, and a shared RECORD_BACKED_CUTOFF-style legacy-scoping helper so the flip does not red historic records
**So that** findings #11 (free-text-reason self-waiver) and #12-partial (self-audit expected-source) are closed and the §8.3 legacy-scoping prep lands — scope-then-flip, never scope-as-loophole.

Acceptance criteria:
- AC-5.1 .. AC-5.5 (see acceptance-criteria.md — provenance-required waiver; waiver surfaced in scan; external expected-source; shared cutoff helper; post-cutoff planted violation still REDS)

Linked: `H-3`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — provider-tier truthfulness: --enforce fails on selected-tier-unmet incl. t3-selected unknown-self-attested; malformed config fails closed; envelope ok mirrors verdict (R-6)

**As** the provider-tier-check + provider-tier-config layer
**I want** `--enforce` to emit `tier_short` (confident) — not `unknown-self-attested` — when T1 is value-free-detectably down for a t3-selected provider, a PRESENT-but-unreadable config to FAIL CLOSED (red/hold, preserving raised floors, never silently falling to framework defaults), and `buildReport` to set `ok = verdict_summary !== "tier_short"`
**So that** findings #15 (down+t3 reads unknown and exits 0), #16 (corrupt config erases raised floors → false green), and #21 (envelope `ok:true` on `tier_short`) land together as ONE ticket with a literal verdict-matrix AC.

Acceptance criteria:
- AC-6.1 .. AC-6.6 (see acceptance-criteria.md — enumerated truth-table cells across {selected_tier × t1_met × config_readable × verdict}; corrupt-config fail-closed; envelope ok mirrors verdict)

Linked: `H-3`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — planning-principles real --enforce path + scan scope extended (R-7)

**As** the planning-principles checker
**I want** a real `--enforce` path (parse the flag; `process.exit(reportOnly || ok ? 0 : 1)`; internal errors fail CLOSED with exit 2, never `ok:true`), tighter section tests (require a heading/label, not bare-word presence), and the scan scope extended beyond `_planning/epics` to `_planning/sprints` + root lifecycle plans
**So that** finding #17 (no `--enforce` path exists; `--enforce` is an ignored no-op always exit 0; internal errors become ok:true) and #19-partial (default scope misses sprint/root plans) are closed — the flip becomes possible at all.

Acceptance criteria:
- AC-7.1 .. AC-7.4 (see acceptance-criteria.md — planted-violation fixture proves exit non-zero under --enforce; internal-error fail-closed exit 2; tightened section tests; extended scan scope)

Linked: `H-3`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — check-ac-coverage --enforce fail-closed on missing/unreadable artifact + legacy scoping (R-8)

**As** the check-ac-coverage checker
**I want** `--enforce` to treat an unreadable/missing NAMED `--file`/resolved AC artifact as a FAILURE (exit non-zero), RECORD_BACKED_CUTOFF-style legacy scoping for historic sprints (the same shared helper as R-5), and the proof-syntax weakness (arbitrary non-evidence text accepted as 20/20) carried as a documented residue
**So that** finding #18 (missing artifact → ok:true/exit 0 under --enforce, a planted-missing artifact passes the gate) is closed while the no-target/greenfield fail-open is preserved.

Acceptance criteria:
- AC-8.1 .. AC-8.4 (see acceptance-criteria.md — planted-missing artifact REDS under --enforce; greenfield still fail-open; legacy cutoff; proof-syntax residue documented)

Linked: `H-3`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-9 — hooks-coverage allowlist schema: owner/expiry/reason; stale entries flagged (R-9)

**As** the mode-lifecycle-hooks-coverage checker
**I want** every allowlist entry to carry an `owner` + `expiry`/`review_by` + `reason` schema, and the coverage check to flag (or downgrade to gap) once an entry is expired
**So that** finding #20-partial (a permanent silent allowlist entry can suppress a real emitter-gap forever, no expiry/owner/review schema) is closed.

Acceptance criteria:
- AC-9.1 .. AC-9.3 (see acceptance-criteria.md — allowlist schema required fields; expired entry flagged; schemaless entry rejected)

Linked: `H-3`, `R-9`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-10 — wrapper mode binding: dispatch wrappers thread live mode into validateDispatchForClass (R-10 — SEQUENCED AFTER SP-20260611-001 MERGE)

**As** the dispatch wrappers (dispatch-agent.js, dispatch-claude.js)
**I want** the current mode (read from `mode.json`) threaded into both wrappers' `validateDispatch`/`validateDispatchForClass` calls so `mode_profiles`/`alpha_only_shapes` narrowing actually gates a live dispatch, keeping the report-only ramp via `WARPOS_DISPATCH_CONTRACT_ENFORCE`
**So that** finding #13 (mode-narrowing is dead at every call site — wrappers omit `mode`) is closed. BLOCKED-BY: SP-20260611-001 WS-A merge (file overlap on the dispatch wrappers). The ticket text says RE-LOCATE the `validateDispatch` call sites post-merge (cited lines will have moved — do not pin stale line numbers).

Acceptance criteria:
- AC-10.1 .. AC-10.3 (see acceptance-criteria.md — mode threaded at both call sites post-SP-001; mode-narrowing gates a live dispatch; report-only ramp preserved)

Linked: `H-3`, `R-10`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.
