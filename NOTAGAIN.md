# NOTAGAIN — the dispatch-failure diagnostic (2026-06-10)

> Operator-facing. Every claim cites a mining input: (telemetry §N) = `runtime/notes/notagain-telemetry-mining.md` · (history #N) = `runtime/notes/notagain-history-mining.md` incident table · (audit GN/NN) = `runtime/notes/notagain-stack-audit.md` · (session §N) = `runtime/notes/notagain-session-evidence-2026-06-10.md`.

## 1. TL;DR (≤8 lines)

One root cause, many costumes (RT-2026-06-08-dispatch-class-rca, history §2): **the orchestration invariants exist, but they are policy-in-prose, mixed and unevenly enforced across dispatch paths — every new dispatch path re-derives them from scratch and re-breaks whichever one isn't gated yet.** S-12 mechanized exactly one invariant (team-exists); the other fourteen still recur through prose.
The numbers: **231 dispatches, 28.1% failure rate** (telemetry §1) · **40 distinct incidents over 8 weeks** (history §1) · **15 invariants violated repeatedly** (history §4) · **20 live gaps in the current stack** (audit §2–3).
The recording layer is now strong and fail-closed; the **policy layer is advisory-only** (ENFORCE ramp never flipped, audit N2) and the **availability layer has no memory** (no auth-posture check, no circuit breaker, audit G4/G5).
The fix is not another patch: one decision matrix, one resolver, invariants as machine preconditions (§7).

## 2. The numbers (telemetry, 2026-04 → 06-10)

**Totals** (telemetry §1): 231 completion records · 166 ok (71.9%) · **65 fail (28.1%)**. By provider: openai 92 (43.5% fail), gemini 83 (14.5% fail), claude 56 (23.2% "fail" — all infrastructure, zero model failures, telemetry §5.8). June 10 alone = 112 dispatches, 48% of the entire ledger.

**Failure taxonomy** (telemetry §2): all 65 failures are zero-output failures (`stdout_bytes: 0` on every one — §2a).

| Class | Count | Evidence |
|---|---|---|
| Quota exhaustion (06-10 double outage) | 26 in one hour + 18 openai / 8 gemini same day | §2d — identified only by stderr byte-size fingerprints because the WI-18 `quota:{}` classification is built by providers.js and **persisted on 0/231 records** (§5.2) |
| Fallback signals (`fallback:true`, all ok:false) | 52 | §2e — 19/52 recovered within 5 min; **33/52 never recovered in-ledger** |
| Skill timeout reaps | 8 (all 2026-06-08, 42% of the subprocess-skill shape) | §2b — bounds of 40–150 s against skills with 120 s+ real walls; the bound was the failure, not the skill |
| Spawn errors (EPERM ×2, exit-9 ×2, ETIMEDOUT ×1) | 5 | §2b/§2c |
| Blind retry storms | 10 role+digest pairs dispatched 3+ times; on 06-10 six reviewer prompts each failed 3× with zero successes — retries into a known-dead quota | §5.7 |

**The 2026-06-10 16:02–17:01 both-providers-down window** (telemetry §2d): 26 consecutive cross-provider dispatch failures, zero successes. During that exact window, two retros were synthesized in `skeleton` mode — SP-20260610-003 at 16:05:02 and SP-20260610-005 at 16:55:56 — **full of `<TO FILL>` placeholders, and signed off by alpha anyway** (telemetry §5.3). Named honestly: reviewer-lane outage degraded directly into unfilled-but-signed release artifacts. Nothing stopped it.

**The dead contracts:**
- **Envelope validation: 36/36 failures, a 100% fail rate** (telemetry §2f). Every validated return failed (34 "no JSON object found", 2 "invalid verdict null") on dispatches whose prose output was actually fine. The envelope contract is effectively dead — the validator never passes and nobody acts on it.
- **`run_id`: missing on 231/231 records** (telemetry §2g). `sprint_id` present on exactly 2/231 — and those two are the fabricated SP-PROOF-DISPATCH pair from the faked-ε-dispatch incident (`elapsed_ms:0`, telemetry §5.1). **Every sprint-correlation query today returns only fake-proof data.** Run-scoped coverage (§17.4) is unsatisfiable as the ledger stands.
- **Advisory noise: 78/231 records (33.8%) carry a role not in role-registry.json** (telemetry §3). Legacy ids die out by 06-08; the only post-cutover offender is generic `builder` — all 5 on 06-10, each printing a misleading "(fail-closed)" advisory and proceeding. The advisory is print-only: 0 structured hits in events.jsonl.
- **Claude-as-final-fallback never appears in the ledger** (telemetry §2e): 0 provider→claude recovery pairs. Resolved against session §2 / audit G2: not "wasn't taken" — the claude-fallback lane **structurally cannot write a record** (see §4d).

**3 orphaned `/maps:tools` ghost sessions** (telemetry §4): session-mq71kl4o, session-mq85ljqh, session-mq85o79r — each has exactly ONE event in the entire log (its own SessionEnd broadcast), no prompts, no dispatches; two broadcasts fired ~19 h after the session's nominal day (stale-session reaping, not live work).

## 3. Eight weeks of the same lesson (incident history)

All from (history #1–#40). "Law" = invariant number in the table below.

| # | Date | Incident | Law | Fixed? (receipt) | Residue |
|---|---|---|---|---|---|
| 1 | 04-17 | codex 0-byte via cmd.exe pipe | 15 | lib-only fix in runProvider | seeded #4 |
| 2 | 04-17 | smoke false-positive: silent model fallback | 11 | strict:true default | — |
| 3 | 04-29 | anthropic→claude rename missed state.js ×2 | 1 | grep-all rule (CLAUDE.md) | class recurred #21,#29 |
| 4 | 04-30 | reviewers bypassed runProvider, re-hit #1 raw, 13 days later | 1 | route-guard + contract rule + agent-spec (3-layer) | founding member of Law 1 |
| 5 | 05-30 | gemini dead 3 ways (key not loaded, untrusted ws, ghost model) | 12 | af5f668/c40e065 + test-dispatch-config.js | — |
| 6 | 05-30 | codex deprecated flag corrupted JSON envelope | 12 | `--sandbox workspace-write` | — |
| 7 | 05-30 | subagents can't read env/transcript — silent phase fails | 6 | doctrine only | doctrine-only |
| 8 | ~06-01 | `$(cat bigfile)` argv overflow exit 126 | 15 | stdin `< file` + route-guard advisory | claude-record gap → #34 |
| 9 | 06-01 | shutdown approved over in-flight builder | 4 | behavioral | **ED-015 open** |
| 10 | 06-01 | records written to worktree ledger, false silent-death | 2 | write-side fixed later | **ED-016 read-side open** (audit G7) |
| 11 | 06-01/02 | feature re-dispatched 3×, once post-merge | 6 | behavioral | **ED-017 open** |
| 12 | 06-02 | **RI-004**: `claude -p --agent builder` silently reaped, no record, ×2 in one sprint | 2,4 | dispatch-claude.js wrapper + route-guard block | **RI-004 open**; ED-018/019/039 |
| 13 | 06-02 | zombie teammate from 30h-dead session | 13 | shutdown_request reap + W-21 probe | — |
| 14 | 06-02 | env-scrub deleted PATH wholesale | 11 | entry-by-entry sanitize; re-gauntlet doctrine | — |
| 15 | 06-02 | DoE self-approval misflag → real invariant codified | 9 | adhoc-fail-override registry-derived | — |
| 16 | 06-04 | context exhaustion from aggregating heavy output | 10 | **ED-021 ENFORCED** (db0a778) | — |
| 17 | 06-05 | derived-vs-derived parity gate would go vacuous | 5,11 | derived-vs-SOURCE + deriveOrFallback | — |
| 18 | 06-05 | full.js can't self-detect mid-phase hang | 4 | external heartbeat | auto-kill not built |
| 19 | 06-06 | **sprint team "never comes up"** (skippable caller + node seam) | 3,13,14 | /mode:sprint edits | superseded by S-12; seam = RC-1 |
| 20 | 06-06 | β consult raced the build window, verdict post-hoc | 3 | front-load doctrine | **ED-030 open** |
| 21 | 06-05 | ADR-0007: green bijection masked un-migrated imperative layer (δ near-ENOENT) | 1 | **ED-026 ENFORCED** (cutover-completeness.js) | recurred as #29 |
| 22 | 06-06 | worktree builder stale-base, blind-merge hazard | 6 | verify-before-merge doctrine | — |
| 23 | 06-07 | **BOM credential corruption** looked like transport outage | 8 | `cmd /c 'tool < keyfile'` memory | **the fix clobbered OAuth → seeded #33** |
| 24 | 06-07 | **E-DISPATCH RCA**: RC-1 two-world seam; RC-2 sprint theater (coverage green on ZERO dispatch); RC-3 recordless reap; RC-4 historic-green; RC-5 refuted | 2,3,14 | F-1/F-3 DONE, F-2 ~done (SP-20260610-003/005) | F-2 live-evidence residual |
| 25 | 06-07 | dispatch guide existed TWICE, drifted | 5 | S-2 consolidation + duplicate-doc-drift enforcer (blocking) | — |
| 26 | 06-08 | **team-skip ×3** ("where's the team?" / "where's epsilon?") — memory substituted for system | 3,13 | **S-12 a/b/c hard gate DEFAULT-ON** (394b696; ED-035 resolved) | **ED-038 open** (honest limit) |
| 27 | 06-08 | SP-001 north-star sub-incidents: spawn fix missed a caller (a); conductor fire-and-forget orphaned T-270 (b); α's own resolver draft had 2 bugs only the gauntlet found (c); "stalled" called from mtime tea-leaves (d); reap emits NO event (e); `git add -A` swept 14k scratch lines (f) | 1,4,9,6,2 | safeSpawnFile; resolveShape wired; conduct-in-one-turn; dispatch-shape.test 26/26 | **ED-039 open**: dispatch-claude prod spawn still buffered |
| 28 | 06-08 | GPT-5.5 found CRITICAL injection bypass in the new safe-spawn kernel | 11 | fixed + planted-violation tests (27/27) | — |
| 29 | 06-08 | S-7 rename merged on green bijection, imperative sweep incomplete | 1 | 16-file sweep (0061b6a) | — |
| 30 | 06-09 | classifier sits ABOVE permissions.allow; turbo broad grant denied | — | per-action approvals | — |
| 31 | 06-09 | teammate name `Beta (β)` rejected by harness regex | 13 | plain names | **ED-040 open** |
| 32 | 06-10 | ED-041: teammate-ε cannot use Agent tool; skill carried false premise | 14 | alpha_only_shapes in contract (975ed5c) | test debt open |
| 33 | 06-10 | **auth-posture drift**: #23's fix clobbered OAuth → 3 days metered billing → "credits mystery", misdiagnosed twice as weather | 8 | ROADMAP item 6 filed (d14eb8e) | **open**; blocked the owed GPT 2nd-pass |
| 34 | 06-10 | **quota cascade + fallback fork**: both families down; --provider claude REFUSED; raw + Agent-tool lanes recordless; hand-rolled everything | 2,12 | hand-rolled only | **open**: recorded lane, auto-route, breaker |
| 35 | 06-10 | `builder` advisory noise on EVERY build dispatch; "fail-closed" wording lies | 5 | none | **open**: role-id reconciliation |
| 36 | 06-10 | **RI-007**: fresh run attached to CLOSED registry-primary sprint; mutations under closed records | 6 | re-attribution + prose workaround | **RI-007 open** (audit G6) |
| 37 | 06-10 | WG-6 teammate-ε stall (wake can't arrive), live for weeks, ×3 doogle + ×1 canonical | 4,14 | epsilon-liveness.js fail-closed (surfaced 34 historic orphaned evidence files) | — |
| 38 | 06-10 | gauntlet-verify false-greens ×2 (historic record; silent window-widening) + fail-open pin check hid 4 un-pinned specs | 11 | both fail-closed (47/47 tests) | — |
| 39 | 06-10 | qa lane caught 2 spend-ledger spoofs (prototype-key NaN; negative bytes) other lanes missed | 11 | f4eb8d7 + regressions | — |
| 40 | 06-10 | codex outage → gemini-only security verdicts; GPT 2nd-pass then blocked by #33 | 12,8 | conscious acceptance | **GPT 2nd-pass still owed** |

### The 15 laws, by violation count (history §4)

| Law | Invariant | Violations on record |
|---|---|---|
| 1 | **Fix ALL callers** — lib-only fixes don't bind bypassing callers | 6 (#1→#4, #3, #21, #27a→ED-039, #29) |
| 2 | **Record-or-it-didn't-happen** — absence of a record IS the signal | 6 (#10, #12, #24 RC-2/RC-4, #27e, #34) |
| 4 | **Blocking-wait, never fire-and-forget** | ~6 (#9, #27b, #37 ×4) |
| 6 | **Trust real state, not tea-leaves; verify before (re)dispatch** | 5 (#7, #11, #22, #27d, #36; + ED-008/028) |
| 11 | **Test gates BOTH ways; gates are only as honest as their data-read** | 7 (#2, #14, #24 RC-2, #28, #38 ×3, #39) |
| 13 | **Team lifecycle is mechanical** (spawn-first, pings, reap, liveness) | 5 (#13, #19, #26 ×3, ED-042) |
| 3 | **Enforcer OUTSIDE the skippable caller** — gates at the action boundary | 4 (#19, #20, #26 ×2; the RCA's named root) |
| 12 | **Provider failure needs classification + sanctioned fallback + breaker** | 4 (#5, #6, #34, #40) |
| 5 | **Registry as SSOT, loud fallback, ids must actually COVER usage** | 3 (#17, #25, #35) |
| 14 | **The two-world seam is structural** (subprocess can't reach in-process team) | 3 (#19 RC-1, #32, #37) |
| 15 | **Windows transport hygiene** (stdin file, safe-spawn, tree-kill) | 3 (#1, #8, #28) |
| 8 | **Auth-posture must be visible; credential ops are dispatch-critical** | 2 (#23, #33 — three days, two misdiagnoses) |
| 9 | **No verdict on own work; dispatcher can't override** | 2 (#15, #27c) |
| 7 | **CLI mandatory; API only where no CLI exists** | enforced (dispatch-contract validate) |
| 10 | **Orchestrators hold envelopes, not content** | 1 (#16 — **enforced**, ED-021) |

The recurrence is the point. Law 1 alone: same bug fixed in a lib (04-17), re-hit raw 13 days later (04-30), re-hit at rename scale (04-29), re-hit at tree scale (06-05), re-hit again at sweep scale (06-08), re-hit as the spawn-fix-missed-a-caller orphan (06-08). Five different costumes, one law.

## 4. The stack today: what's real vs theater

19 components (audit §1). One-line statuses:

| Component | Status | Headline gap |
|---|---|---|
| dispatch-claude.js | WIRED | 20-min bound > harness ceiling; contract consult advisory-only |
| dispatch-agent.js | WIRED | refuses claude; auto-retry gemini-only; no provider-down memory |
| dispatch-skill.js | STANDALONE | zero skills `subprocess_verified` — earn-it loop never run |
| safe-spawn.js | WIRED | CLAUDE_RAW + seam paths bypass it |
| auth-resolver.js | WIRED | key PRESENCE only, never auth MODE; live probe seam never called |
| dispatch-contract.js + json | **ADVISORY (theater at dispatch time)** | ENFORCE env never set anywhere |
| dispatch-shape.js | ADVISORY | unknown role → nonsense "inline" advisory; parallelism axis unconsumed |
| coverage-gate.js | blocking lib, STANDALONE wiring | full.js never calls it; run_id unsatisfiable; honest in-process records fail its criteria |
| gauntlet-verify.js | STANDALONE | full.js execute phase never invokes it; cwd-bent read path; blind to claude-fallback |
| catalog.js | WIRED | still validates scrapped role ids |
| state.js | WIRED | legacy literals, cwd-bent root |
| providers.js | WIRED | suggestFallbackProvider decorative; quota envelope lacks auth mode |
| dispatch-route-guard.js | WIRED (blocking) | **blesses recordless raw `claude -p --agent` for non-build roles**; stale guide path in its own message |
| scope-contract-guard.js | WIRED (blocking) | reviewer taxonomy wrong; prompt heuristics resolve to scrapped ids |
| role-registry.json | WIRED | `builder` scrapped while the guide mandates it; ε status stale |
| dispatch-contract.json manager class | — | demands records coverage-gate can't accept |
| sprint-hook-points.json | WIRED | clean |
| mode-lifecycle.json | WIRED | tier/profile seams declared, not consumed |
| epsilon-runtime.js | WIRED | record-inprocess refuses CLI-routed roles; in-process records not gate-satisfiable; CLAUDE_RAW skips kernel |

Structural pattern (audit §0): **recording/verification = strong and fail-closed; policy = advisory everywhere it's wired; availability = no memory, no auto-routing.**

### The 20 gaps, ordered by blast radius

The systemic seven first:

1. **(a) Wrapper timeout bounds exceed the harness's 10-min FOREGROUND Bash ceiling** (audit G8/N1). Every wrapper default (dispatch-claude 20 m, dispatch-skill 15 m, runProvider 15 m, epsilon spawnAgent 15/20 m) is above 600 s — so a foreground-Bash-invoked wrapper is killed by the harness **before it can write its own death record**, silently degrading the first defense layer (loud death) to the backstop (no-record RED, which only fires if gauntlet-verify actually runs). Nuance, resolved against telemetry §2a: background-run dispatches and the top-level session are NOT subject to the ceiling — that's why the five 743–1299 s `builder` runs on 06-10 completed OK — but **teammate foreground dispatches ARE**, and the doogle 560 s death is exactly this signature (~600 s kill minus startup). The wrapper's own design comment ("bound SHORTER than the harness threshold") is violated by its own default.
2. **(b) `WARPOS_RUN_ID` is never exported** by full.js or epsilon-runtime (audit N8) → run_id null on all real records (telemetry §2g: 231/231) → **§17.4 run-scoped coverage is unsatisfiable today**; everything degrades to time-window correlation.
3. **(c) record-inprocess refuses CLI-routed roles** (epsilon-runtime.js:492-497, audit G2) → when claude is the fallback for a cross-provider-routed reviewer, the lane is **structurally unledgerable**. The 2026-06-10 claude review lanes have no records and never can, as built.
4. **(d) Generic `builder` — the role id the dispatch GUIDE mandates — is unresolvable by the CONTRACT the same stack enforces** (audit G1, live-reproduced). The advisory prints "(fail-closed)" and then **proceeds** — the wording lies. 4 sprints of builds ran on advisories (session §3). 78/231 ledger records carry unresolvable roles (telemetry §3).
5. **(e) route-guard blesses recordless raw `claude -p --agent` for non-build roles** as "the documented fallback" (audit N5) — a sanctioned dispatch lane that is invisible to gauntlet-verify, at exactly the moment (provider outage) when liveness verification matters most.
6. **(f) No provider circuit breaker** (audit G5). `suggestFallbackProvider` is decorative — exactly one caller acts on quota classification, gated to gemini only; an openai quota failure gets no auto-route; a quota-dead provider is re-burned by every subsequent dispatch (telemetry §5.7: six prompts × 3 blind retries each into the dead window).
7. **(g) Nothing reads auth MODE** (audit G4/N4; session §1). Worse than absence: `detectAuthTier` treats the mere existence of auth.json as "oauth (paid)" — the 2026-06-07 metered-key file is **actively misreported as funded**, which is how 3 days of metered billing drained the credits unseen (history #33).

The rest, descending:

8. **N2** — the report-only→blocking ramp (`WARPOS_DISPATCH_CONTRACT_ENFORCE`, mode-profile narrowing) was never flipped/passed by any caller: the policy keystone is advisory everywhere it's wired. The CLAUDE.md aspirational-vs-enforced class, at the keystone itself.
9. **G6** — full.js fresh run attaches to the registry primary with no status check → RI-007 wrote tickets under a CLOSED sprint (session §4). One-line fix identified (audit G6).
10. **G7** — ED-016 write-side fixed; **gauntlet-verify's read side is still cwd-bent** (no `__dirname` anchor) → worktree-cwd verify false-REDs; coverage-gate and gauntlet-verify read the ledger differently.
11. **N9** — honest in-process records lack `output_digest`/`argv_schema_version`/`run_id` → structurally rejected by coverage-gate; the manager-class contract demands records the gate can't accept.
12. **N7** — full.js's execute phase never invokes gauntlet-verify or coverage-gate; the engine that mints "complete" doesn't consume the enforcers its own telemetry feeds.
13. **G3** — scope-contract-guard blocks read-only reviewers by design but against the contract taxonomy (`file_scope:"read-only"`); registry `kind` never consulted; punishes the fallback path with an unrelated demand (session §2).
14. **N3** — dispatch-readiness validates the **scrapped** roster; live pod roles' tuples unchecked.
15. **N4** — (counted under g) the misclassification feeds provider-tier-check as a T2 funded signal.
16. **N12** — scope-guard prompt heuristics resolve to scrapped ids that only stay effective via the static set — a future literal-cleanup silently de-fangs it.
17. **N10** — gemini 75 KB pre-flight guard keyed to legacy `redteam` only; `security-reviewer` bypasses it.
18. **N6** — route-guard's own message carries a stale guide path, violating the paths.X rule while teaching the rules.
19. **N11** — registry `epsilon.status:"new"` stale vs ADR-0009 LIVE; status-trusting scanners under-report ε.
20. **dispatch-skill earn-it** — every subprocess candidate `subprocess_verified:false`; the §13.6 loop has never run, so the resolver sends every skill inline (audit §1, dispatch-skill).

## 5. Today, live (2026-06-10 session evidence)

**Auth-posture root-cause chain** (session §1): 2026-06-07 01:47 BOM-fix ran `codex login --with-api-key` → overwrote auth.json wholesale → operator's ChatGPT OAuth silently clobbered → 3 days of CLI dispatch billed the metered key → credits dry → surfaced as "outage." Verified via `codex login status` ("Logged in using an API key") + auth.json mtime 2026-06-07 01:47. Misdiagnosis cost: two sessions treated quota_exhausted as weather; α initially asked the operator to top up credits; the operator's challenge broke the misread. Why invisible: nothing inspects auth MODE — only reachability/key-presence. OAuth restore started in-session; operator away → Claude fallback directed. ROADMAP item 6 filed (d14eb8e).

**Quota cascade + fallback fork** (session §2): ~16:37Z gemini also quota-dead (plan rate limit, self-heals ~7 h) — both cross-provider families down after a heavy gauntlet day. The fallback forked three ways, all bad: `--provider claude` REFUSED; raw `claude -p --agent` recordless; Agent tool (top-level α only) works but also recordless → gauntlet-verify blind to every claude review lane. scope-contract-guard then blocked the read-only reviewer dispatches on top. Every fallback hand-rolled; no breaker.

**RI-007** (session §4): ε ran full.js without `--sprint` → run attached to CLOSED S-LC-12; tickets T-292..296 + checkpoints + requirements mutated under closed records; α watchdog caught it; full byte-identical re-attribution to SP-20260610-001 required.

**Reviewer-shape evidence** (session §7) — the empirical answer to "which lane shape catches what": gemini (diff-only, no tools) caught 3 real fail-open bugs but hallucinated 1 false positive from its diff-only view; claude (live worktree, tool access) caught 2 real false-greens **by executing the CLI/ledger** — a capability diff-only lanes structurally lack — with zero false positives. **Execution-access lanes catch enforcement-bypass classes diff-only lanes cannot; diff-only cross-family lanes catch distribution blind spots. Both are needed, chosen per failure class — not per convenience.**

Also live today: WG-6 teammate-ε stall fixed (epsilon-liveness.js surfaced 34 historic orphaned evidence files, session §5); 2 new gauntlet false-greens found and closed (session §6); ~6 resume round-trips lost to engine boundary-name drift + BC-02 manifest flap (session §8).

## 6. What 2026-06-10 already fixed (receipts — do not re-fix)

From session §9 + history fixed-column:

- **F-1** record-backed coverage (correlated ok:true post-cutoff) — SP-20260610-005, T-300
- **F-2** `--epsilon-dispatch` default-ON in sprint mode + opt-outs (WG-3) — SP-20260610-003, T-297
- **F-3** gauntlet-verify requires `--sprint`/parseable window; whole-ledger REFUSED exit 2 — T-301; + the two false-green closures (historic sprint_id-less record; silent window-widening), 47/47 tests (session §6)
- dispatch-claude.js + test SHIP to products (WG-1) + `--ship-coverage` enforcer (caught generate-steps-maps.js immediately)
- model pins fail-closed (WG-2; surfaced 4 un-pinned reviewer specs) · contract shape-vs-route parity (WG-5)
- sanctioned teammate-ε subprocess routes + startup self-check (WG-4) · stall rules + epsilon-liveness.js (WG-6)
- release.js unspoofable product-detect (WG-9) · research deep-run.js standalone + quota probe (MC-WG-2/3)
- ED-041 honesty corrections: `alpha_only_shapes` in dispatch-contract + CLAUDE.md/sprint.md (975ed5c)
- Earlier, still standing (history): S-12 hard team gate DEFAULT-ON (394b696, ED-035 resolved) · ED-021/023/024/025/026 enforced · safe-spawn kernel 27/27 · spend-ledger spoof fixes (f4eb8d7)

## 7. The answer: one dispatch-shape decision spine (the epic)

Stop fixing costumes. The RCA (history §2) names the disease: invariants live in prose, so every new path re-breaks one. The cure is structural:

**One enforced DECISION MATRIX**: task class (build / review / consult / research / skill / conduct) × required capabilities (isolation, record, cross-family, execution-access, timeout class, auth posture) → **ONE shape**, resolved by **ONE resolver**. `dispatch-shape.js` already exists (audit §1) — it must become **the only door**: wrappers refuse shapes the resolver didn't pick, and the 15 laws (§3) are wired as **machine PRECONDITIONS in the resolver**, not prose anyone can skip.

**W0 — make the ids and clocks true** (smallest, unblocks everything):
- Role-id bijection: resolve `builder` per the registry's own intent — sweep guide/orchestrator habit to pod roles, or register a real generic row; either way the wrapper and the contract must agree (closes audit G1, telemetry §3 noise).
- Export `WARPOS_RUN_ID`/`WARPOS_PHASE_ID` from full.js/epsilon-runtime onto wrapper env (closes N8; makes §17.4 satisfiable).
- Timeout sanity: every wrapper bound < the applicable ceiling (≤9 min foreground, or mandated background dispatch); **death record always written** (closes G8/N1; covers ED-039's safeSpawnFile residual).
- *Enforcer:* planted-violation tests — a scrapped-id dispatch must REFUSE; a record with null run_id under a live run must fail coverage; a foreground bound >540 s must fail a config check in /scan:full.

**W1 — make availability and fallback real:**
- One recorded claude-fallback wrapper (one door, ledgered — dispatch-claude `--review-fallback` mode or record-inprocess `--fallback-from`, per audit G2's options; the record SHOULD visibly trip cross_provider_required, not vanish).
- Provider circuit breaker: `provider-down.json` written on quota classification, TTL'd, consulted before dispatch (closes G5; ends blind retry storms, telemetry §5.7).
- Auth-posture surface: parse auth.json `auth_mode`, fix `detectAuthTier`'s metered-as-oauth lie, stamp auth mode into quota error envelopes + provider-tier rows (closes G4/N4; ROADMAP item 6).
- *Enforcer:* gauntlet-verify must SEE a claude-fallback lane (planted fixture); a metered-key auth.json must read "key (metered!)" in dispatch-readiness; breaker has a planted re-burn test.

**W2 — make the resolver the only door:**
- Flip the ENFORCE ramp (N2) after W0's sweep; wrappers refuse shapes the resolver didn't pick; route-guard stops blessing recordless raw `claude -p --agent` (N5) and points fallback traffic at the W1 lane.
- Envelope-contract revival or burial: the 100% fail rate (telemetry §2f) means **nobody consumes it** — either make reviewer prompts emit the JSON envelope and have a consumer act on validation, or delete the validator. Name the choice; don't leave a dead gate pretending.
- *Enforcer:* dispatch-contract validate in /scan:full goes from validating the file to validating LIVE config (ENFORCE set, resolver consulted); envelope decision recorded as ADR with its enforcer or its deletion.

**W3 — per-failure-class review-lane policy:**
- Codify session §7: each risk class declares its minimum lanes — execution-access lane required for enforcer/gate changes; cross-family diff lane required for distribution-sensitive logic. Wire into sprint-hook-points conditions.
- *Enforcer:* coverage-gate cross_provider_required extended with lane-shape requirements; planted fixture per class.

**What this epic must NOT do:** re-fix anything in §6 (F-1/F-2/F-3, S-12, safe-spawn, WG-1..9 receipts are landed — re-building them is symptom #3 of the RCA, α hand-building what's already conducted). It also does not rebuild E-LIFECYCLE-001's 12 sprints — those are code-complete report-only awaiting the §8 decisions.

## 8. Open decisions for the operator

1. **2 HIGH-risk gate flips** — held at β ESCALATE (EVT-warpos-sprint-2026-06-10-claude-sub-001). Operator call.
2. **2 ready low-risk flips, classifier-held**: `planning-principles --enforce` and `provider-tier --enforce` — both proven green in enforce mode 2026-06-10; need your per-action approval (standing grants don't pass the classifier, history #30).
3. **2 flips needing legacy-scoping prep first**: `coverage-gate-scan` and `ac-coverage` — flipping now would red historic/legacy records; scope-then-flip.
4. **turbo-spend stays report-only BY DESIGN** (ADR-0011) — never flips; listed so it isn't mistaken for debt.
5. **codex OAuth re-login** — browser/device flow needs you at the desk (session §1); until then openai runs metered-or-dead and the GPT 2nd-pass security review (history #40) stays blocked.
6. **SP-20260610-005 cross-provider re-review debt** — owed once a second provider family is back.
