<!-- requirement-format-legacy -->
# INPUT Requirements — E-LIFECYCLE-001 close-out fix sprint — 17 REAL + 4 PARTIAL GPT 2nd-pass findings (team-guard/mode-guard bypass classes, turbo spend/auth integrity, coverage-gate waiver+expected-source, provider-tier false-green, planning-principles enforce path, ac-coverage fail-closed) + NOTAGAIN §8.3 legacy scoping

**Sprint:** `SP-20260611-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\prd.md`

> INPUTS for an engine sprint = the untrusted/semi-trusted data each fix consumes.
> Each entry pins the validation + failure mode the fix must implement. EVERY
> surface here is an enforcer reading attacker-influenceable input (planted files,
> spoofed records, corrupt config) — the validation IS the fix.

## IN-1 — team_name + .team-live marker + mode.json (linked story `S-1`, `R-1`)

| Property | Value |
|---|---|
| Field | `team_name` (argv), `~/.claude/runtime/.team-live-<sid>` (marker), `mode.json` (`{mode}`) |
| Type | string / marker-file / JSON file |
| Required | team_name per worker dispatch |
| Source | integration (UNTRUSTED — planted/fabricated by an attacker) |
| Validation | team_name → real `~/.claude/teams/<name>/config.json` lookup (membership + readiness + ε-for-slug, reuse lifecycle.verify/teamCarriesConductor); marker honored only when corroborated by config-verified identity; mode.json cross-checked against harness team state before disabling the Agent gate |
| Failure mode | fabricated team_name / planted marker / planted mode.json → gate STAYS blocking (fail closed); a real verified team → gate opens (AC-1.6) |

**Notes:** Hard AC #5 (non-circular: a gate must not trust mode.json to decide whether to trust mode.json) + #6 (verify-don't-trust, NO signing infra).

## IN-2 — mode.json writes + lifecycle events (linked story `S-2`, `R-2`)

| Property | Value |
|---|---|
| Field | `mode.json` content/mtime, mode lifecycle events in `paths.eventsFile` |
| Type | JSON file + event-log records |
| Required | yes (mode change path) |
| Source | system (mode-set.js) + integration (direct out-of-band write — UNTRUSTED) |
| Validation | mode-set.js (single writer) emits the lifecycle events at write; out-of-band-write detector reds when mode.json changed with no matching event |
| Failure mode | out-of-band write → loud finding at scan; sanctioned mode-set change → no false positive (AC-2.3) |

**Notes:** Matcher-extension remedy REJECTED (brittle). The single-writer + detector pair is the contract.

## IN-3 — apply scope/ceiling + spend records + byte counts (linked story `S-3`, `R-3`)

| Property | Value |
|---|---|
| Field | `--scope`/`--ttl`/`--spend-ceiling` (re-apply), `granted_at`/session-start anchor, `rec.bytes` |
| Type | argv + authorization record fields + JSONL byte counts (semi-trusted) |
| Required | per apply / per record |
| Source | system (operator argv) + integration (dispatch records — spoofable bytes) |
| Validation | widening re-apply requires fresh recorded operator provenance (monotonic-or-attested); spend window anchored to persisted session-start (not granted_at); `clampBytes` on a NONFINITE/overflow value emits a suspect-record HIGH notice |
| Failure mode | provenance-free widening → refused; nonfinite bytes → fail HIGH (not silent $0); huge FINITE bytes → over-report (safe direction, unchanged) |

**Notes:** Hard AC #1 (live-session self-lockout): the fix governs FUTURE applies; the CURRENT session's grant + anchor stay UNCHANGED (tested on a THROWAWAY fixture, never live auth.json). Hard AC #7 (attested widening stays possible).

## IN-4 — node-e-fs command + tracked-path delete (linked story `S-4`, `R-4`)

| Property | Value |
|---|---|
| Field | the `node -e "..."` command string under a `node-e-fs` grant; the target fs path |
| Type | command string + filesystem path (UNTRUSTED) |
| Required | per gate evaluation |
| Source | integration (the command being authorized) |
| Validation | `matchNodeEFs` scope narrowed to write/append/mkdir only (rm/unlink NOT approvable); `isInSafetyFloor` gains an executable git-aware tracked-work-delete check (rmSync/unlinkSync/rm -rf on a tracked path → pass-through, any scope) |
| Failure mode | rm/unlink of tracked work → NOT auto-approved (floor pass-through); legitimate write/mkdir or untracked-temp delete → not over-blocked (AC-4.3) |

**Notes:** DO BOTH remedies (PRIMARY scope-narrow + BACKSTOP executable floor) per directives #10.

## IN-5 — coverage waiver + expected-roles source + record ledger (linked story `S-5`, `R-5`)

| Property | Value |
|---|---|
| Field | `exp.waiver` (`reason`/`operator`/`source`/`ts`/backing record), `expected` role set, RECORD_BACKED_CUTOFF |
| Type | waiver object + role set + cutoff constant |
| Required | waiver optional but validated when present; expected derived from external source |
| Source | integration (caller-built `expected`/waiver — UNTRUSTED) + system (registry / sprint composition) |
| Validation | waiver REQUIRES provenance (operator/source + ts + auditable trail), rejected like an unbacked record if absent; `expected` derived from registry/sprint composition (not self-audit ok:true-only); shared RECORD_BACKED_CUTOFF helper |
| Failure mode | free-text-reason-only waiver → rejected; omitted role → still expected → gap; post-cutoff planted violation → still REDS (scope-then-flip) |

**Notes:** Hard AC #3 (ONE shared cutoff consumed by both R-5 + R-8 consumers; explicit per-ticket rationale if wiring dates genuinely differ).

## IN-6 — provider-tier config + selected tier + T1/T2/T3 detection (linked story `S-6`, `R-6`)

| Property | Value |
|---|---|
| Field | instance config file, `selected_tier`, `t1_met`/`t2`/`t3Judged`, `verdict_summary` |
| Type | config JSON (present/absent/corrupt) + tier-detection booleans |
| Required | config optional (absent = greenfield); tier detection per run |
| Source | system (config) + integration (live CLI/auth probe — can be down) |
| Validation | PRESENT-but-corrupt config → FAIL CLOSED (preserve raised floor); ABSENT config → framework defaults (greenfield ok); `!t1Met` for t3-selected → verdict `tier_short` (confident), NOT unknown-self-attested; envelope `ok = verdict_summary !== "tier_short"` |
| Failure mode | corrupt config → red/hold (never framework-default green); t3-selected + T1 down → tier_short → --enforce REDS; unknown-self-attested reserved for T1/T2-met + T3-undetectable only |

**Notes:** Hard AC #2 (ONE ticket, literal verdict-matrix AC enumerating {selected_tier × t1_met × config_readable × verdict}).

## IN-7 — planning-principles --enforce flag + scan scope + section bodies (linked story `S-7`, `R-7`)

| Property | Value |
|---|---|
| Field | `--enforce` flag, scan dir set (`_planning/epics`/`_planning/sprints`/root), plan section bodies |
| Type | CLI flag + directory paths + markdown section text |
| Required | flag optional; scope defaulted |
| Source | system (CLI) + integration (plan files — author-influenceable) |
| Validation | `--enforce` parsed; `exit(reportOnly || ok ? 0 : 1)`; internal error under --enforce → exit 2 (fail closed); section tests require a heading/LABEL not bare-word presence; scope extended to `_planning/sprints` + root plans |
| Failure mode | violations under --enforce → exit non-zero; internal error → exit 2 (never ok:true); bare-word-only plan → does NOT satisfy section tests |

**Notes:** #17 (no enforce path existed; --enforce was an ignored unknown arg) + #19 (default scope misses sprint/root plans).

## IN-8 — check-ac-coverage --enforce flag + named AC artifact (linked story `S-8`, `R-8`)

| Property | Value |
|---|---|
| Field | `--enforce` flag, `--file`/resolved AC artifact path, RECORD_BACKED_CUTOFF |
| Type | CLI flag + file path + cutoff constant |
| Required | flag optional; artifact named when targeting |
| Source | system (CLI) + integration (AC artifact — planted/missing possible) |
| Validation | under --enforce a NAMED unreadable/missing artifact → FAILURE (exit non-zero); greenfield no-target → fail-open preserved; SAME shared cutoff helper as IN-5; proof-syntax weakness carried as documented residue |
| Failure mode | planted-missing named artifact → REDS under --enforce; no-target → fail-open; post-cutoff planted violation → still REDS |

**Notes:** AC-8.4 proof-syntax minor is a DOCUMENTED residue, not fixed this sprint.

## IN-9 — hooks-coverage allowlist entries (linked story `S-9`, `R-9`)

| Property | Value |
|---|---|
| Field | `wiring_pending` allowlist entries (`owner`/`expiry`|`review_by`/`reason`) |
| Type | allowlist config objects |
| Required | per entry |
| Source | system (config — but unbounded if schemaless) |
| Validation | each entry MUST carry owner + expiry/review_by + reason; expired entry flagged (or downgraded to gap); well-formed in-date entry honored as INFO |
| Failure mode | schemaless entry → rejected; expired entry → flagged/gap; valid in-date entry → honored, not over-flagged |

**Notes:** #20 — closes the permanent-silent-allowlist anti-pattern.

## IN-10 — dispatch wrapper mode binding (linked story `S-10`, `R-10`)

| Property | Value |
|---|---|
| Field | `mode` (from mode.json) threaded into `validateDispatch`/`validateDispatchForClass`; `WARPOS_DISPATCH_CONTRACT_ENFORCE` |
| Type | mode string + ramp env |
| Required | mode read per dispatch |
| Source | system (mode.json + env) |
| Validation | both wrappers (dispatch-agent.js, dispatch-claude.js — call sites RE-LOCATED post-SP-001 merge) pass `mode` so the `if (req && req.mode && ...)` narrowing branch is reached; ramp via WARPOS_DISPATCH_CONTRACT_ENFORCE preserved |
| Failure mode | mode-disallowed shape → refused under ENFORCE / reported under report-only ramp; report-only ramp preserved (no premature blocking flip) |

**Notes:** BLOCKED-BY SP-20260611-001 WS-A merge (file overlap). Hard AC #10: RE-LOCATE call sites post-merge — do not pin stale line numbers (508/315 will have moved).
