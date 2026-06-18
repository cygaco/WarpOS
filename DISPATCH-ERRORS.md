# DISPATCH-ERRORS.md — Census of Every Known Dispatch Failure

**Written:** 2026-06-11 (operator-directed). **Sources:** `NOTAGAIN.md` @7c0718a (231 dispatches mined, 40 incidents, 8 weeks), `paths.enforcementDebt` (ED-001..048), `paths.recurringIssuesFile` (RI-001..007), `paths.learningsFile`, `runtime/notes/` triage + verdict notes (crossfam 2026-06-10, sp001 gauntlet/regauntlet 2026-06-11, elc-gpt2p triage 2026-06-11), `.claude/agents/_org/dispatch-contract.json`, `paths.agentDispatchGuide`, and the LIVE incidents of the 2026-06-11 session (SP-20260611-002 Wave-1 reap and its fallout).

**Status legend:** `OPEN` (live gap) · `ENFORCED` (mechanical enforcer exists) · `MITIGATED` (workaround/behavioral only) · `FIXED` (landed, dated).

**The one root cause (RT-2026-06-08-dispatch-class-rca):** recurring dispatch failures are not N independent bugs — they are ONE root: the orchestration invariants (*ε-conducts, wait-for-dispatch, fix-all-callers, trust-real-state, record-or-it-didn't-happen*) exist as prose, not as machine preconditions. Everything below is an instance of an invariant that nothing enforces at the moment of dispatch.

---

## A. Spawn & reap — the silent-death family

| # | Error | Mechanism | Evidence | Status |
|---|-------|-----------|----------|--------|
| A1 | **Background-seam builder reap (RI-004, count=2, HIGH)** | A headless `claude -p` builder is near-silent on stdout; launched from a backgrounded shell, the harness/CLI buffer layer classifies prolonged silence as dead and tree-kills at ~45–60s. The kill is ABOVE the wrapper, so the wrapper's death-record writer dies with the tree — **the "die loudly" W0 contract is structurally unsatisfiable on this path.** | 2026-06-02 Gamma-2; 2026-06-08 T-270 (empty worktree, 0 events); 2026-06-11 SP-002 Wave-1: 4/4 builders did ~45–47s of real reads then died in the same kill window, 0 records anywhere (ED-016 worktree paths checked) | OPEN |
| A2 | **A reap emits NO event** | Nothing in the stack logs the kill. Phase-B audit found 0 reap/orphan/death events against 78/78 `ok:true` completions while a build demonstrably orphaned. Absence of artifacts is the only signal. | NOTAGAIN telemetry; 2026-06-08 T-270 | OPEN |
| A3 | **"Foreground" is not guaranteed foreground** | A foreground Bash call that exceeds the harness foreground time budget is auto-backgrounded mid-flight. The fg/bg distinction is advisory from the caller's side; any long dispatch can end up on the reapable path without choosing it. | 2026-06-11: ε's foreground G1 canary auto-backgrounded to a bg id | OPEN |
| A4 | **`dispatch-claude.js` production spawn still buffered (ED-039)** | Production path uses buffered `safeSpawnSync`, not `safeSpawnFile` (the T-269 fix landed only in `dispatch-skill.js`) — the fix-all-callers invariant violated at the one call site that matters most. | NOTAGAIN N-gap; T-269/T-270 | OPEN |
| A5 | **Spawn-time hard errors** | EPERM ×2 (sandbox regression window), exit-9 instant deaths ×2 (CLI arg/agent-resolution), ETIMEDOUT ×1. Sub-100ms deaths look identical to reaps in the ledger. | NOTAGAIN §2c, 2026-06-07/09 | OPEN |
| A6 | **Zombie task registrations** | Harness bg-task ids persist with no process behind them; "the wrapper is alive" can be a registration, not a process. | 2026-06-11: 4 Wave-1 bg ids with zero processes since local midnight | OPEN |
| A7 | **Skill-subprocess timeout reaps** | Wrapper bounds (15–20 min defaults) exceed the harness ~10-min foreground ceiling → effective 540s; heavy skills die at 120–150s+ walls. 8 failures on 2026-06-08 alone. | NOTAGAIN §2b (scan-full ×4, research-deep, qa-audit, redteam-full, sleep-deep) | OPEN (G8/N1) |

**Fixes (A):**
- **Default build-chain shape → harness-native Agent-tool teammates** (see Redesign R2). Proven 2026-06-11: Agent-tool builders went 5/5 alive in the exact worktrees where CLI dispatch went 0/4.
- Move the death-record writer OUT of the killable tree (see Redesign R3).
- ED-039: switch `dispatch-claude.js` to `safeSpawnFile` (template exists) — and grep ALL callers this time.
- Distinguish spawn-error classes in the ledger (`spawn_error:{eperm|exit9|etimedout}` vs `reap_suspected`) so sub-100ms deaths stop masquerading.
- A3 implies: never *rely* on foreground semantics for reap-immunity; design every long dispatch as if it may be backgrounded.

---

## B. Timeout & bound seams

| # | Error | Mechanism | Evidence | Status |
|---|-------|-----------|----------|--------|
| B1 | **Parent/child bound race (T-322 class — 3 instances across 3 review passes)** | Parent SIGTERM bound derived but NOT propagated: child slot (600s) or provider-exec (540s) could exceed parent (585s), so the parent kills the child before its graceful fallback/death-record write. Found at the slot site, the first `runProvider` site, AND the quota-retry `runProvider` site — the same bug class three times. | sp001 gauntlet + regauntlet notes 2026-06-11; FIXED @d4b5052 via single `withPropagatedTimeout` helper (class closed by construction), suites 65/65 + 21/21 | FIXED 2026-06-11 |
| B2 | **Harness 600s Bash kill vs wrapper 540s clamp coupling** | The 540s constant sits 60s under the harness kill so death records beat the kill. Blind-raising it reopens the race (G8/N1). Permanent raise = T-20260611-323 (operator-gated): high bound rides the background seam ONLY when coupled to a liveness watchdog. | NOTAGAIN G8/N1; T-323 design | OPEN (designed) |
| B3 | **Sprint-task bounds too low for real work** | Builders legitimately need >540s; the operator directive (2026-06-11) to raise bounds collided with A1 — the high-bound posture used the background seam, which is the reaper. Interim posture DROPPED 2026-06-11. | SP-002 Wave-1; interim-fixes note | OPEN (T-323) |
| B4 | **Window-clamp fail-open (`anchorMs===null` → keep everything)** | The marquee record-window clamp returned TRUE on missing anchor, fully bypassing the clamp; its test was hollow (never drove the null path). | crossfam B.4; FIXED @346af83 (fail-closed + exploit-driving test, mutation-verified) | FIXED 2026-06-11 |
| B5 | **Synchronous orchestrator can't self-detect hangs** | A spawnSync-driven conductor is blocked inside the phase subprocess; a hung child looks like a long phase. Heartbeat must be an EXTERNAL observer, not in-process self-policing. | LRN-46, 2026-06-05 | OPEN |

**Fixes (B):** B1's `withPropagatedTimeout` single-sourcing is the pattern — every bound derives from one computed base, parent = child + grace BY CONSTRUCTION. Apply the same pattern when T-323 lands. B5 → Redesign R3/R4 (external watchdog + heartbeats).

---

## C. Provider availability, auth, billing

| # | Error | Mechanism | Evidence | Status |
|---|-------|-----------|----------|--------|
| C1 | **Quota exhaustion with no circuit breaker (26 failures)** | `quota:{}` classified but decorative — zero callers auto-route; blind retry storms re-burn dead windows (10 role+digest pairs at 3+ dispatches, zero successes). | NOTAGAIN §2d/§5.7, 2026-06-10 outage | PARTIAL (W1 breaker landed @RL-20260610-042, fail-open 30m TTL) |
| C2 | **Breaker-open refusals don't self-identify (ED-043)** | A breaker-latched probe false-failed as "CLI not available" — refusals must name breaker/TTL/clear-path, and openai readiness must surface the two-billing-surface split. | 2026-06-11 live incident | OPEN |
| C3 | **Two billing surfaces look like one (codex)** | Interactive Codex bills the ChatGPT plan; wrapper `codex exec` bills the auth.json API key. CLIs DEFAULT to API-key auth and LOOK authenticated when they aren't (`codex login` needed for OAuth). Wallet-drain + "plan upgrade didn't fix dispatch" confusion. | RESOLVED 2026-06-11 (root cause); ED-043 residual; memory `project_codex_two_billing_surfaces` | MITIGATED |
| C4 | **Auth mode invisible (G4/N4)** | Nothing reads auth MODE; `detectAuthTier` misreported metered-as-oauth → 3 days of metered billing invisible. BOM-corrupted key install (PS pipe) produced cryptic transport-looking 401s. | NOTAGAIN #33; W1 auth-posture surface landed ("key (metered)") | PARTIAL |
| C5 | **Gemini headless env/trust** | Key lives in `~/.gemini/.env` (injected by providers.js, not auto-loaded); `GEMINI_CLI_TRUST_WORKSPACE=true` required; model-id ghosts. | LRN-15; enforced by `test-dispatch-config.js` + `/models:check` | ENFORCED |
| C6 | **agy headless contract unproven** | `agy models` hangs under harness spawn (same trust/auth discovery class as gemini 2026-05-30). | TRACKER fold a2643c29 | OPEN |
| C7 | **75KB pre-flight guard keyed to legacy role id (N10)** | Gemini size guard checks `redteam` only; `security-reviewer` bypasses it. | NOTAGAIN N10 | OPEN |
| C8 | **Envelope-validation dead gate (36 failures, 100% fail rate)** | Reviewer prose output vs JSON-envelope validator that never passes by design — and nobody consumes it. Either make prompts emit JSON + add a consumer, or delete the validator. Name the choice. | NOTAGAIN §2f | OPEN (decision owed) |

**Fixes (C):** finish the breaker (self-identifying refusals, ED-043); stamp auth_mode into every quota/error envelope; extend the size guard to all reviewer kinds; make the envelope-validator decision via ADR. SP-20260611-002 G3b landed the provider-tier truthfulness slice (tier_short fail-closed, corrupt-config HOLD, envelope ok mirrors verdict) @8645299 — verified 2026-06-11.

---

## D. Records & telemetry honesty (the false-green family)

| # | Error | Mechanism | Evidence | Status |
|---|-------|-----------|----------|--------|
| D1 | **No record = invisible dispatch** | Raw `claude -p --agent` writes no completion record; record-inprocess refuses CLI-routed roles; so the claude-as-final-fallback lane was structurally unledgerable exactly when cross-provider died (0 recovery pairs in-ledger). | NOTAGAIN G2/N5; W1 recorded `--review-fallback` lane landed 2026-06-10 | PARTIAL |
| D2 | **α-hand Agent-tool builds have NO record path (ED-047)** | `record-inprocess` correctly refuses build_chain (resolves to CLI route); `dispatch-claude.js` never ran. The ledger under-reports real builds — live again 2026-06-11 (all 5 SP-002 builders are α-hand; evidence = worktree commits + envelopes, not records). | ED-047; SP-20260611-002 | OPEN |
| D3 | **Worktree-cwd records land in the worktree's ledger (ED-016)** | Relative-path records under `cd <worktree>` → false "no record" at canonical `gauntlet-verify`. | FIXED (canonicalFile() + cwd-regression test, 2026-06-02) — but REMEMBER it when auditing old runs | ENFORCED |
| D4 | **Time-window-only correlation leaks across sprints (B.5)** | `hasBackingDispatchRecord` matched any record in the window — a concurrent sprint's record false-greens this sprint. | crossfam B.5; sprint_id/window correlation + whole-ledger REFUSAL landed in SP-20260610-005 (47/47) | FIXED |
| D5 | **Waiver = free-text escape (W2.11)** | Any non-empty reason string waived a coverage role — unaccountable silencing. | elc-gpt2p #11; FIXED @21f38b5 (provenance REQUIRED, surfaced at scan) — verification in flight 2026-06-11 | FIXED (pending re-review) |
| D6 | **`expected` derived from claimants (W2.12-class)** | coverage-gate-scan expected only roles that CLAIMED ok:true — a role that produced no record was never expected, so its absence wasn't a gap. | elc-gpt2p #12; FIXED @21f38b5 (external expected-source) | FIXED (pending re-review) |
| D7 | **Enforcers whose --enforce is a no-op (W3.17/W3.18)** | `planning-principles.js --enforce` was an ignored arg (always exit 0); `check-ac-coverage.js` returned ok:true on unreadable NAMED artifacts. Blocking was IMPOSSIBLE without new code — the hollow-ladder class. | elc-gpt2p #17/#18; WS-G3c in flight @2026-06-11 | IN FLIGHT |
| D8 | **Hollow tests false-green the exact bug (L-2026-06-11)** | A test named for a failure mode that never drives it (env var PRESENT vs CONSUMED; valid anchor vs null anchor). Mutation-verify or it doesn't count. | sp001 fix-cycle; learning logged | MITIGATED (discipline) |
| D9 | **Parity gates comparing two views of one corrupt source** | Cross-checks that derive both sides from the same registry are tautologies; keep an independent witness. | LRN-47, 2026-06-05 | MITIGATED |
| D10 | **Honest in-process records rejected by the strengthened gate (N9)** | record-inprocess records lacked `output_digest`/`argv_schema_version`/`run_id` → coverage-gate structurally rejects honest records. | NOTAGAIN N9 | OPEN |

**Fixes (D):** D2 is the live priority — add `record-alphahand` mode to `record-inprocess` accepting build_chain WHEN evidence carries worktree-commit proof (hash + diffstat), recorded `via:alpha-agent-tool` (ED-047 candidate #1). D10: align record classes with the gate. Keep D8's mutation-verification as a binding reviewer rule.

---

## E. Routing, contract & resolver gaps

| # | Error | Mechanism | Evidence | Status |
|---|-------|-----------|----------|--------|
| E1 | **The resolver is not the only door (N2)** | `dispatch-shape.js` exists but `WARPOS_DISPATCH_CONTRACT_ENFORCE` is never flipped/passed — policy is advisory at every call site. | NOTAGAIN W2 | OPEN |
| E2 | **mode_profiles never enforced (W2.13)** | `validateDispatch` called WITHOUT the mode field → `alpha_only_shapes` dead at every call site (ED-041's mechanical half never engaged). | elc-gpt2p #13 | OPEN (SP-002 scope) |
| E3 | **Hardcoded BUILD_CHAIN_ROLES Set (A.3/FIX-A3)** | New/unregistered build-chain role bypasses worktree-isolation and fallback-refusal gates; registry-read failure silently excluded real roles. | crossfam A.3; FIXED @67b26be (registry-derived + fail-closed) | FIXED |
| E4 | **Unresolvable role ids dispatched anyway (G1)** | Generic `builder` (the guide's own prescribed id!) unresolvable by the contract → 78/231 records were advisory noise; "fail-closed" wording, fail-open behavior. | NOTAGAIN G1/N3 | PARTIAL (truthful advisory landed W0) |
| E5 | **Sanctioned fallback lane would brick under ENFORCE (A.2)** | `--review-fallback`'s intentional shape mismatch was suppressed only when `!blocking` — the W2 flip would exit-1 the fallback exactly when it's needed. | crossfam A.2; FIXED @67b26be (sanctioned-lane shape) | FIXED |
| E6 | **route-guard blesses recordless raw claude (N5)** | The documented non-build fallback (`claude -p --agent`) is invisible to gauntlet-verify at the worst moment (provider outage). | NOTAGAIN N5 | OPEN |
| E7 | **Guard evasion via quoted command substitution (ED-019)** | `$(provider ...)` nested in double quotes evades dispatch-route-guard's stripQuoted. Accepted as drift-guard, not adversarial boundary. | ED-019 | OPEN (LOW, accepted) |
| E8 | **Scope-contract requirement undocumented at the Agent-tool call site** | scope-contract-guard (SP-20260610-008) blocks build-chain Agent dispatches lacking `scopeContract`/allowedFiles — correct, but the requirement isn't in the dispatch guide's Agent-tool section, so the orchestrator discovers it by bounce. (It bounced α 4× on 2026-06-11 before re-dispatch with contracts.) | 2026-06-11 live | OPEN (doc gap) |
| E9 | **Stale role-id sweeps (N3/N11)** | dispatch-readiness validated a scrapped roster; registry `epsilon.status:"new"` stale vs ADR-0009 LIVE → scanners under-report. | NOTAGAIN | PARTIAL (W0 reconciliation) |
| E10 | **full.js attaches to the registry PRIMARY sprint (RI-007)** | A fresh run without `--sprint` mutated a CLOSED sprint's records (T-292..296 under S-LC-12) until caught. | RI-007, 2026-06-10 | MITIGATED (mint-first rule; refuse-on-closed fix owed) |

**Fixes (E):** the E-DISPATCH-SHAPE-001 W2 plan IS the fix (resolver as only door, wrappers refuse unresolved shapes) — sequenced after SP-002. E8 is cheap: document the scopeContract requirement in `paths.agentDispatchGuide` §Agent-tool. E2 lands in SP-002 (T-321/G4 wrapper-mode-binding is the unblocked follow-up).

---

## F. Team & coordination — the dual-conductor family (2026-06-11 heavy)

| # | Error | Mechanism | Evidence | Status |
|---|-------|-----------|----------|--------|
| F1 | **α/ε control-point message races** | Async SendMessage delivery means both α and ε can act on the SAME blocking control point with stale views. 2026-06-11: ε launched a foreground canary AFTER α had executed Option B (collision in WSG1); ε re-surfaced an already-answered decision; 2 task-echo confusions. THREE near-misses in one hour. | 2026-06-11 session | OPEN |
| F2 | **Worktree telemetry is actor-blind** | Tool-event logs don't identify WHO produced events — ε attributed α's G1Builder activity to its own canary and "proved" the wrong conclusion. | 2026-06-11 | OPEN |
| F3 | **Process-table forensics mislead (timezone + neighbor procs)** | Local clock UTC-7 + a sibling project's dev server matching by time-of-day → "wrappers ALIVE" verdict for processes that were a day old and someone else's. Liveness must come from owned artifacts (heartbeats/records), not `Get-Process` pattern-matching. | 2026-06-11 (doogle `next dev` misread) | OPEN |
| F4 | **Readiness races (ED-030/ED-032 class)** | A consult sent before a teammate's readiness ping is MISSED (β sat idle 2026-06-06); a β boundary consult sent after β shut down went unanswered (2026-06-11 wrap). Front-load consults; verify readiness pings before any boundary. | ED-030/ED-032 | MITIGATED (behavioral) |
| F5 | **Teammate-ε / any subagent cannot call the Agent tool (ED-041)** — **RE-VERIFIED: HOLDS 2026-06-17** | **CONFIRMED on the current harness (verify-don't-inherit caught a bad inherited premise).** The prior-session "FALSIFIED" claim was **REFUTED by a definitive re-probe 2026-06-17**: a freshly-spawned subagent (`general-purpose`, which carries ALL tools when it is the top-level agent) reported that its SUBAGENT toolset has **NO `Agent` tool** (Bash/PowerShell/Read/Write/Edit/Glob/Grep/Skill/ToolSearch + deferred — `Agent` absent, not even deferred-loadable). So a subagent genuinely cannot spawn the in-process roster; the prior "teammate-ε spawned director-of-product/product-lead/depth-3" was the **top-level orchestrator mislabeled as a teammate**, or a different harness build. The α-only premise + `alpha_only_shapes` + the runtime's `requires-orchestrator` returns + `epsilon.md` §Dispatch Method are all **CORRECT — KEPT, not retired**. α **REMAINS** the Agent-tool spawn-hand for the in-process roster (managers/leads/directors + design-quality/visual-review). The R1/R7 "flatten the hierarchy / ε summons the roster directly" redesign is **NOT pursued**. (The `scope-contract-guard` is a separate, real policy gate on roster/build-chain Agent-tool spawns — orthogonal to ED-041.) | ED-041 **CONFIRMED HOLDS**; re-probe 2026-06-17 (subagent toolset has no `Agent` tool); E-DISPATCH-PERFECT-001 W5 | **HOLDS 2026-06-17** — α-only doctrine KEPT; R1/R7 not pursued |
| F6 | **α-by-hand roster substitution (ED-038/ED-045)** | α dispatching general-purpose agents as builders bypasses ε-conducts and roster routing; PreToolUse can't distinguish legitimate α dispatch from improvised builders. | 2026-06-08 (3 GP builders); ED-045 logged 2026-06-11 | OPEN |
| F7 | **Zombie/stale teammates & name traps** | Dead-session teammates stay addressable (W-21 accretion, `-N` suffixes); TeamDelete can't kill live in-process agents; harness name regex rejects parens/unicode (`Beta (β)`) — bit twice (ED-040). | LRN-35; ED-040; hygiene probe | MITIGATED (probe + plain names) |
| F8 | **Lead's view is not superset of teammate state (ED-015)** | Operator DMs to a teammate are invisible to the lead; lead dispatch-state staleness almost approved a shutdown orphaning an in-flight builder. | ED-015 | OPEN |
| F9 | **Stale task-list echoes re-assign finished work** | The harness task list re-surfaced completed release-close tasks to ε as fresh assignments — correctly ignored, but only because ε checked disk state first. | 2026-06-11 | OPEN (harness-side) |
| F10 | **Node-subprocess seam: full.js can't reach the team** | `/sprint:full` runs as a node subprocess that cannot SendMessage — β consults work only by halt-and-bridge through α; the team must be UP before the halt fires or the run stalls. | ED-032; full.js:653 | ENFORCED (halt-and-bridge) |

**Fixes (F):** Redesigns R1 (flatter persistent team), R4 (heartbeats + actor-tagged telemetry), R5 (control-point decision lock). F2/F3 short-term rule: liveness verdicts ONLY from owned artifacts (envelope files, commits, heartbeat files, harness task status) — never from process tables or unattributed telemetry.

---

## G. Transport hygiene (Windows)

| # | Error | Mechanism | Evidence | Status |
|---|-------|-----------|----------|--------|
| G1 | **cmd.exe stdin pipe kills codex** | `cat file \| codex exec` dies on Windows; fix lives in `runProvider` (spawnSync `input:`), and bypassing callers re-hit it 13 days later — the lib-only-fix class. | LRN-2026-04-17/04-30 | ENFORCED (route-guard) |
| G2 | **argv overflow on big prompts** | `$(cat bigfile)` argv exceeds arg-length (exit 126) on reviewer fallbacks — pipe `< file`. | memory; route-guard findAdvisory | ENFORCED |
| G3 | **PS pipe BOM corrupts piped credentials** | `$key \| codex login` prepends a UTF-8 BOM → stored credential 401s that look like network outage. Install secrets via `cmd /c 'tool < keyfile'`. | 2026-06-10/11 codex outage | MITIGATED (documented) |
| G4 | **PS native-arg quoting shreds multiline/quoted args** | `git commit -m @'…'@` with embedded double quotes split into multiple argv at the native boundary — use `-F <file>` or here-string discipline. | 2026-06-11 live (commit bounced) | MITIGATED |
| G5 | **PATH-wholesale env scrub breaks all child spawns** | Deleting PATH in env scrubbing kills git/node/provider CLIs; preserve entry-by-entry, case-insensitive. | LRN-33 | ENFORCED (safe-spawn) |
| G6 | **Tool-id resolution / injection** | Model-picked exe names and unallowlisted args — closed by the safe-spawn kernel (absolute native exes, arg allowlist, tree-kill incl. grandchildren). | @05ff3c3, @6db8816 | ENFORCED |

---

## H. Process & conduct errors

| # | Error | Mechanism | Evidence | Status |
|---|-------|-----------|----------|--------|
| H1 | **Mode-entry ≠ authorization drift (ED-031)** | Mode init chaining into builds; inherited "continue" treated as command. Behavioral STOP + banner live; violation detector deferred. | ED-031 | MITIGATED |
| H2 | **β timing/honesty gaps (ED-030/044/046)** | Verdict racing the build window; deferral-shaped verdicts in hardening phase; sub-0.95 descopes. | ED-030/044/046 | OPEN (scan extensions named) |
| H3 | **Brief-file amendment after spawn is a lost update** | Workers read the brief once; amendments must go by directive (DM), not file edit. Expect duplicate amend processing; reconcile TRUE HEAD before review dispatch. | learning 2026-06-11 | MITIGATED |
| H4 | **Verification verdicts from the wrong family (L-2026-06-11)** | A binding re-review must re-run on the SAME provider family that FAILed; default routing can silently resolve elsewhere — pin `--provider/--model` and record prior-vs-current family. | sp001 re-gauntlet provider-mix note | MITIGATED (rule) |
| H5 | **Downstream/stale registers treated as live state (ED-008 class)** | Verify each claimed gap reproduces in canonical before building; ~half of one sweep was already fixed. | ED-008; WARPOS.md sweep | MITIGATED |

---

## Live incidents of 2026-06-11 (this session), mapped

1. **The reap (A1/RI-004 #2):** 4/4 SP-002 builders killed ~45–47s by the background seam; death record unwritable (A2); zombie registrations (A6).
2. **Foreground auto-backgrounding (A3):** ε's canary silently moved to the bg path.
3. **Misattributed liveness (F2/F3):** doogle dev server + timezone trap read as "wrappers alive"; canary credited with G1Builder's telemetry.
4. **Three α/ε control-point races (F1):** canary-vs-OptionB collision in WSG1 the worst.
5. **scope-contract-guard bounce ×4 (E8):** guard correct, requirement undocumented at the Agent-tool call site.
6. **ED-047 live (D2):** all five SP-002 builders are α-hand Agent-tool — zero ledger records; evidence = commits + envelopes.
7. **β wrap-boundary consult unanswered (F4):** re-sent + answered DECIDE B 0.88 on 2026-06-11 resume.
8. **PS quoting commit bounce (G4).**
9. **Stale task echoes (F9):** finished release-close tasks re-surfaced as assignments.
10. **What WORKED:** Agent-tool builders 5/5 alive; scope-contract-guard parsing real contracts; classifier blocking a raw `Stop-Process`; independent α probe catching the false liveness read; ε refusing to re-do echoed tasks; mutation-verified fix closing T-322 by construction.

---

## Redesign proposals

> Solutions above fix instances. These change the shape so the class can't recur. Ordered by leverage.

### R1 — Flatten the hierarchy: directors (and quality-lead) join the persistent team *(operator-proposed 2026-06-11)*
**Today:** α+ε+β persistent; directors/leads/reviewers are ephemeral Agent-tool rows that ONLY α can spawn (ED-041) — every consult funnels through the α bottleneck, each spawn re-pays full context load, and consult latency is a fresh cold start.
**Proposal:** persistent core = **α + ε + β + director-of-engineering + director-of-product (+ quality-lead through gauntlet phases)**, spawned at mode entry with plain names, message-addressable by ε DIRECTLY (teammate→teammate DM needs no Agent tool — this dissolves most of ED-041's practical pain without touching the harness limitation).
**Kills/raves:** F5 funneling, much of F4 (standing members answer boundary consults without spawn latency), ED-045 drift (the real role is one DM away, no temptation to substitute general-purpose).
**Costs/risks:** more standing context burn; W-21 accretion surface grows (mitigate: same step-1.75 hygiene, plain names, teardown classification); persistent members can go stale mid-session (mitigate: R4 heartbeats).
**Verdict: ADOPT for directors + quality-lead.** Keep builders/reviewers ephemeral — they're per-unit workers whose isolation IS the feature. True specialists (copy-lead, conversion-lead, research-lead) stay on-demand.

### R2 — Builders as harness-native teammates by DEFAULT (invert the build-chain shape)
**Today:** contract says build_chain → `subprocess-claude` ONLY; in-process-agent FORBIDDEN for build_chain. Reality 2026-06-11: the subprocess path went 0/4 (reaped); the forbidden path went 5/5 with scope contracts enforced by the guard.
**Proposal:** make Agent-tool teammate builders the SANCTIONED DEFAULT build-chain shape in `dispatch-contract.json` (new shape row: `in-process-builder`, requires scopeContract + named worktree + envelope), with `subprocess-claude` as the fallback for true headless contexts (oneshot/δ, CI). Pair with **`record-alphahand`** (D2/ED-047): completion record accepted when evidence carries worktree-commit proof (hash + diffstat + envelope digest), stamped `via:alpha-agent-tool`.
**Kills:** A1/A2/A4 for the build chain entirely (no CLI buffer to reap), D2's record gap.
**Costs:** spawnable only by the top-level orchestrator (ED-041) — acceptable: α is the spawn-hand under ε's conduct (the division that worked 2026-06-11); records depend on the new mode landing.
**Verdict: ADOPT pending one more sprint of evidence; codify the 2026-06-11 numbers in the contract rationale.**

### R3 — Death records from OUTSIDE the killable tree (ledger watchdog)
**Today:** the death-record writer is inside the process tree that gets killed — structurally unsatisfiable under A1/A2.
**Proposal:** every dispatch writes a **lease** at start (`.claude/runtime/dispatch-leases/<id>.json`: owner, started_at, heartbeat_at, expected_bound). Workers touch the lease on a cadence (wrapper-side timer, or per-N tool calls for Agent-tool builders). A tiny watchdog — run at every α/ε control point AND wired into `/scan:full` — synthesizes `death_suspected` records for leases past bound with no heartbeat and no completion record. The reap stops being silent without trusting the dying process to speak.
**Kills:** A2 (reaps now emit), B5 (external observer), halves F3 (liveness = lease freshness, not process tables).
**Costs:** one new tiny artifact + cadence discipline; watchdog must itself be un-skippable (wire into the existing gauntlet-verify pass).
**Verdict: ADOPT — this is the structural answer to "the contract can't be satisfied from inside the tree."**

### R4 — Actor-tagged telemetry + heartbeats over forensics
**Proposal:** (a) every worktree tool-event row carries `actor` (agent name/session id); (b) liveness verdicts may ONLY cite owned artifacts — lease heartbeats (R3), envelope files, commits, harness task status. Process-table reads become corroboration, never primary evidence. Encode as a rule in the dispatch guide + a β-consultable checklist line.
**Kills:** F2, F3 (both fired 2026-06-11).
**Costs:** small telemetry schema change; behavioral rule until then.

### R5 — Control-point decision lock (kill the α/ε race)
**Proposal:** any BLOCKING control point gets a tiny lock artifact (`.claude/runtime/control-points/<sprint>-<point>.json`) naming the **decision owner**. Written when the point opens (default owner: ε for conduct, α for dispatch-shape/escalations). The non-owner may advise but MUST NOT act; ownership transfers only by explicit lock rewrite, acknowledged by DM. 2026-06-11's three near-misses were all both-parties-acting-on-stale-views.
**Kills:** F1; shrinks F4.
**Costs:** one artifact + discipline; enforcer candidate = ε runtime refuses a conduct action when the lock names α (and vice versa via the guard at α's wrappers).

### R6 — One resolver as the only door *(endorse existing north star)*
E-DISPATCH-SHAPE-001's W2 (resolver-only door, `ENFORCE` flip, wrappers refuse unresolved shapes, machine preconditions for the 15 invariants) remains THE structural fix for family E — this census changes its inputs: add R2's new shape row, R3's lease requirement, and E8's scopeContract documentation BEFORE the flip, or the flip bricks the shapes that actually work.

### R7 — Right-size the consult lattice (less hierarchy, fewer hops)
With R1 in place, revisit how consults flow: ε DMs directors directly (no α relay), β consults batch at phase boundaries (front-loaded per ED-030 lesson), and `requires-orchestrator` shrinks to genuinely-Agent-tool-only rows (design-quality/visual-review Playwright agents). α's residual roles: spawn-hand, control-point owner for dispatch-shape, operator interface, substrate. This is the operator's "less hierarchy" applied to message topology, not just team membership.

---

## Sequencing recommendation (2026-06-11)

1. **Now (in-flight):** finish SP-20260611-002 (D5/D6/D7 + W1.x/W2.x fixes land + gauntlet) — already running.
2. **Immediate cheap wins:** E8 doc fix (scopeContract in the guide); ED-039 `safeSpawnFile` swap; C2 breaker self-identification; A5 ledger classes.
3. **Next sprint(s):** R3 leases + watchdog, R2 contract row + `record-alphahand` (together they close the whole silent-death family honestly); R5 control-point lock; T-321/E2 mode-binding (already unblocked); T-323 bounded raise (operator ruling owed).
4. **Then:** R1/R7 team flattening (one mode-entry change + step-1.75 extension); E-DISPATCH-SHAPE W2 flip with updated inputs (R6).
5. **Standing:** every fix here lands with a planted-violation fixture + mutation check (D8) — an enforcer that can't fail closed in a test is the hollow ladder again.

---

*Maintained by α. Update on every new dispatch incident — append, date, and map to a family; if it fits no family, that's a new class and belongs in NOTAGAIN.md's next revision too.*
