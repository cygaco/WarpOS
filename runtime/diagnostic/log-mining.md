# Log-Mining Catalog — "dispatch-theater / reap-no-record / epsilon-idle / team-spawned-then-bypassed" bug class

Diagnostician pass, 2026-06-07. Every item below is grounded in `file:line` with a verbatim or near-verbatim quote.
No speculation — only what the logs/reports/memory literally say.

## Root-cause buckets

1. **dot-dir / hidden instructions not loaded** — agent specs/CLAUDE rules under hidden dirs not in effect
2. **reap / no-completion-record** — long `claude -p --agent` dispatch auto-backgrounded + silently reaped; 0-byte output, no exit, no completion record
3. **epsilon-not-conducting / ad-hoc-instead** — ε/sprint runtime can't reach the team; sprint runs degrade to foreground/adhoc
4. **team-spawned-then-bypassed / theater** — team set up but not actually exercised; consults missed; verdicts canned/post-hoc; "where is the team?"
5. **guard false-green** — an enforcer/gate that passes while the thing it guards is broken (lantern unlit)
6. **other** — adjacent (stale-worktree cwd misrouting completion records, etc.)

---

## Sources confirmed present (and one notable absence)

- `.claude/project/memory/events.jsonl` — **ABSENT**. Real events log lives at `.claude/project/events/events.jsonl` (24,288 lines, 7.9 MB).
- `.claude/project/memory/{traces,learnings,recurring-issues,enforcement-debt,systems}.jsonl` — present.
- Sub-agent logs: `.claude/agents/president/_system/{alpha,beta,gamma}/events.jsonl` (alpha+gamma 0 bytes; beta 93 lines).
- Root MD: `DUMP.md`, `WARP.md`, `WARPOS-PROMPT.md`, `TRACKER.md`, **plus `WARPOS-ISSUES.md`** (not in the original list but in-scope).
- Reports: `_reports/{sessions,sprints,epics}/...`.
- Sleep journals / dreams: `.claude/dreams/{journal.md,coaching.md,2026-05-13.md,2026-05-19.md,2026-05-21.md,2026-05-25.md,2026-06-02.md}`.
- No `*retro*` directory holds real retro instances — only templates/fixtures (`framework/templates/sprint/retrospective/`, `fixtures/hooks/retro-presence-check`). `.claude/agents/president/_system/oneshot/retros` does not exist.

---

## Recurrences (grounded)

### Bucket 2 — reap / no-completion-record

**R1** — 2026-06-02 · `.claude/project/memory/recurring-issues.jsonl:4` (RI-004)
> "Long-running build-chain dispatch (builder/fixer) via 'claude -p --agent <role>' gets auto-backgrounded by the harness then silently reaped: 0-byte output, no exit code, no completion record, orchestrator waits forever. Instance 1: prior session Gamma-2 + >=1 fixer (DUMP 2026-06-02, ED-015). Instance 2: 2026-06-02 keystone builder — bn623ani1.output 0 bytes, worktree empty, no savepoint."

**R2** — 2026-06-02 · `.claude/project/memory/enforcement-debt.jsonl:10` (ED-018)
> "A reaped Claude-routed BUILDER/FIXER dispatch MUST be self-detecting. `claude -p --agent builder|fixer` ... writes NO completion record, so scripts/dispatch/gauntlet-verify.js cannot see a silent reap (harness auto-backgrounds a long dispatch, reaps it: 0-byte output, no exit captured, no record). The ONLY signal today is the worktree diff, checked behaviorally."

**R3** — 2026-06-01/02 · `.claude/project/memory/enforcement-debt.jsonl:8` (ED-016, status: enforced)
> "Dispatching build-chain agents from a worktree cwd writes the records to the WORKTREE .claude/runtime, not canonical, producing a false no-record / silent-death signal that can trigger a spurious gauntlet_lane_no_dispatch_record halt." Note: "all 11 completion records (ok:true ...) landed in the WORKTREE completions file; canonical gauntlet-verify reported no-record for BOTH gauntlet windows."

**R4** — 2026-06-01 · `.claude/project/memory/enforcement-debt.jsonl:7` (ED-015)
> "a shutdown reason said 'No builds dispatched yet' while builder (harness task boffindva) was actively writing 19 uncommitted files in warpos-wt-0181-dispatch-readiness, 0 commits."

**R5** — 2026-06-02 · `.claude/project/memory/learnings.jsonl:28`
> "The harness auto-backgrounds long `claude -p --agent builder` runs then silently reaps them (0-byte output, no exit, no completion record). Builder reaped TWICE this session under Gamma; foreground built it cleanly." (evidence: SP-20260602-001; RI-004 + ED-018).

**R6** — 2026-06-02 · `.claude/project/memory/learnings.jsonl:31`
> "dispatch-agent.js REFUSES Claude-routed roles (builder/fixer) ... The documented Claude path is `claude -p --agent <role>`, which writes NO completion record, so a Claude-builder silent reap is invisible to gauntlet-verify (the ED-018 gap)."

**R7** — 2026-06-02 · `.claude/project/events/events.jsonl:13623` (cat=tool, actor=alex)
> `node scripts/recurring-issues-helper.js log "Build-chain dispatch silent-death via harness auto-background reap..."` (the moment RI-004 was logged, ts 03:14:54).

**R8** — 2026-06-02 · `.claude/project/events/events.jsonl:13553` (cat=prompt, actor=user) — the keystone build task whose builder was reaped twice:
> "BUILD TASK — sealed-capsule executable consumer-contract gate (the KEYSTONE). ... You are building inside an ISOLATED GIT WORKTREE: WORKTREE_ROOT = ...\warpos-wt-keystone".

**R9** — 2026-06-02 · `.claude/dreams/2026-06-02.md:39-44` (dream painting)
> "builder ▓▓▒▒░░ (dispatched, ran long, went quiet, 0 bytes — reaped without a sound) ... so the architect set down the clipboard and picked up the hammer himself."

**R10** — 2026-06-02 · `.claude/dreams/2026-06-02.md:51`
> "When a builder goes silent, stop waiting and pick up the hammer ... make the channel's failure self-announcing (ED-018)."

**R11** — 2026-06-02 · `.claude/dreams/coaching.md:199`
> "RI-004/ED-018 — bounded-dispatch wrapper + worktree torture test. The live wound: builder dispatch silently reaps. This is the load-bearing prerequisite for any parallel/fast sprint-mode."

**R12** — 2026-06-02 · `.claude/dreams/journal.md:294` and `:299`
> ":294 ... HIGH = builder-reap-foreground (RI-004) ..." / ":299 Recurring issues: RI-004 (builder auto-background→reap) logged; ED-018 (Claude-builder reap not self-detecting) logged."

**R13** — 2026-06-02 · `_reports/sessions/2026-06-02.md:29`
> "`d86eee7` — feat(reliability): RI-004/ED-018 bounded Claude-dispatch wrapper — make the silent builder reap LOUD" (the fix landing).

**R14** — 2026-06-02 · `.claude/project/events/events.jsonl:14560` (cat=tool, actor=alex)
> `git commit ... feat(reliability): RI-004/ED-018 b...` (commit of the bounded-dispatch wrapper).

**R15** — 2026-06-05 · `TRACKER.md:1034` (G-3 stale-worktree-cwd hazard, RI-004-adjacent)
> "The same hazard previously produced false 'silent death' / wrong-completion-record-path readings (see project memory on dispatch completion records using a relative path)." (also `:1040`, `:1045` cross-ref ED-016).

### Bucket 4 — team-spawned-then-bypassed / theater / consult-missed

**R16** — 2026-06-06 · `.claude/project/memory/recurring-issues.jsonl` → **NOT** a separate RI; captured as ED-032 at `enforcement-debt.jsonl:24`
> "the persistent alpha+epsilon+beta team must be brought UP on mode entry ... /sprint:full (a node subprocess) cannot spawn or reach the in-process team ... operator report 'persistent teams always failing to come up on sprint mode /sprint:full'; live evidence this session (deferred spawn + beta idle-unanswered-until-nudged)."

**R17** — 2026-06-06 · `.claude/project/memory/traces.jsonl:5` (RT-2026-06-06-sprint-team-orphaned-by-node-seam), root_cause:
> "(1) team is brought up ONLY by Alpha executing /mode:sprint Steps 1.5/1.75 — skippable/deferrable (deferred this session -> operator asked 'where is the team?'); (2) a consult sent before a teammate's readiness ping is missed -> teammate goes idle unanswered (beta needed a nudge); (3) /sprint:full is a node subprocess that STRUCTURALLY cannot reach the in-process team (full.js:653) ... the team is spawned-but-orphaned, appearing 'never up'."

**R18** — 2026-06-06 · `.claude/project/memory/learnings.jsonl:62` (L-2026-06-06-sprint-team-node-seam-orphan)
> "Sprint-mode persistent team 'never comes up' = 3 compounding causes, not a spawn bug ... (3) /sprint:full is a node subprocess that CANNOT reach the in-process team (full.js:653) — beta is engaged by halt-and-bridge ... Alpha owns liveness across the seam, the script cannot bring the team up."

**R19** — 2026-06-07 · `.claude/project/events/events.jsonl:24036` (cat=prompt, actor=user) — the operator report verbatim:
> "/fix:deep persistent teams always failing to come up on speint mode /sprint:full"

**R20** — 2026-06-07 · `.claude/project/events/events.jsonl:24103` (cat=tool, actor=alex) — the fix commit:
> `fix(mode:sprint): persistent team 'never comes up' — R...` (matches the HEAD commit c38a37c "RCA + skill-body fix").

**R21** — 2026-06-06 · `WARPOS-ISSUES.md:30-33` (I-4) — consult degraded into post-hoc validation (theater of the gate):
> "Two SendMessage consults to the persistent Beta (β) teammate did not deliver within the build window, so I proceeded under batched-β. ... it's a delivery-LATENCY artifact ... which silently degrades the boundary-consult safety net into after-the-fact validation."

**R22** — 2026-06-06 · `DUMP.md:33` (I-4 root cause)
> "β consult round-trip latency (~12 min) raced the build window. ROOT CAUSE: β is a `run_in_background` teammate → async scheduling + turn-boundary delivery. ... Logged ED-030."

**R23** — 2026-06-06 · `.claude/project/memory/enforcement-debt.jsonl:22` (ED-030)
> "The beta (β) boundary consult MUST close (verdict returned) BEFORE the gate it guards ... nothing enforces consult TIMING (verdict-before-gate vs verdict-racing-the-build)." Note cites memory `feedback-frontload-beta-consult-at-spec-lock`.

**R24** — 2026-06-02 · `.claude/dreams/coaching.md:203` — β verdicts were canned (the purest "theater" instance):
> "β's sprint-phase verdicts were historically CANNED (placeholder strings). Run /beta:integrate ... consider a β-verdict-honesty enforcer." (Fixed by `f170987` β-verdict-honesty enforcer, `_reports/sessions/2026-06-02.md:31`.)

**R25** — 2026-06-02 · `.claude/dreams/coaching.md:74`
> "Manual ticket implementation needs manual routing.js record per phase. If you bypass /sprint:execute again ... remember to record execution/qa/redteam traces before /sprint:release check. β anti-pattern A-016." (sprint pipeline bypassed → records not produced.)

### Bucket 3 — epsilon-not-conducting / ad-hoc-instead

(Overlaps R16–R20: the node-seam means /sprint:full as a subprocess cannot conduct the in-process team, so ε work degrades to Alpha-foreground/halt-and-bridge.)

**R26** — 2026-06-02 · `_reports/sessions/2026-06-02.md:35`
> "built foreground in adhoc team mode (Alpha + Beta + Gamma)" — enforcer-class work built foreground because the delegation channel (builder dispatch) was reaping (cf. R5/R9).

**R27** — 2026-06-06 · `WARPOS-ISSUES.md:32` (I-4) decision rationale
> "in-loop build correct given RI-004" — i.e. ε did not dispatch builders; built in-loop precisely because of the reap bug.

### Bucket 5 — guard false-green (the gate that doesn't fire)

**R28** — 2026-06-02 · `.claude/dreams/2026-06-02.md:30-34` (the "unlit lantern" dream)
> "UNLIT (verifyTyped never called) until three strangers ◇gpt ◇gpt ◆gemini shouted 'your lantern is dark!'"

**R29** — 2026-06-02 · `.claude/dreams/2026-06-02.md:49`
> "I built a gate to catch 'things shipped incomplete,' and the gate itself shipped incomplete (verifyTyped wired to nothing). ... a self-checking thing cannot be trusted to check itself."

**R30** — 2026-06-02 · `.claude/dreams/journal.md:310`
> "the gauntlet's 'unlit lantern' IS the same false-green class the keystone exists to catch — the gate caught its own disease."

**R31** — 2026-06-02 · `_reports/sessions/2026-06-02.md:31`
> "`f170987` — feat(reliability): β-verdict-honesty enforcer — catch canned /sprint:full verdicts (P-AP-1)" (false-green β verdicts).

**R32** — (policy/standing) `.claude/project/memory/enforcement-debt.jsonl:24` (ED-032) names the false-green risk for the team-liveness check itself:
> "a presence-only check would lie ... config-PRESENCE != responsiveness (beta was in config yet unresponsive), so this risks FALSE-GREEN (lying enforcer)."

### Bucket 6 — other / adjacent

**R33** — 2026-06-02 · `.claude/project/memory/learnings.jsonl:42`
> "Turbo pre-authorization was used 8× to hand-Edit the append-only events.jsonl ... 33 auth-bypass-via-turbo events; 8 were Edit(events.jsonl)." (audit-log integrity bypass — adjacent, not core class.)

**R34** — 2026-06-02 · `.claude/project/memory/learnings.jsonl:35`
> "A stale in-process teammate from a DEAD session reappears after TeamDelete ... Zombie Gamma-2 from a 30h-old dead session was still addressable ... W-21 accretion." (team-lifecycle hygiene, adjacent to bucket 4.)

**R35** — 2026-06-03 · `.claude/project/memory/learnings.jsonl:43`
> "Dispatch + review by the SAME agent is NOT inherently a self-approval conflict. The real invariant is 'no agent renders a verdict on work it AUTHORED, AND the dispatcher cannot override the verdict' ... gauntlet-verify telemetry prevents rubber-stamping." (defines the anti-theater invariant.)

---

## Verbatim registry entries requested

**RI-004** (`recurring-issues.jsonl:4`): id "RI-004", title "Build-chain dispatch silent-death via harness auto-background reap", category "dispatch", first_seen/last_seen 2026-06-02T03:14:54.341Z, count 1, severity "high", status "open". Context quoted in R1.

**ED-016** (`enforcement-debt.jsonl:8`): status **enforced** (2026-06-02), enforced_by `scripts/dispatch-agent.js#canonicalFile()` (AGENT_ROOT anchor) + `gauntlet-verify.test.js` cwd-regression test, merged 8dcce99. Policy quoted in R3.

**ED-018** (`enforcement-debt.jsonl:10`): status **open**, severity high, missing_enforcer "hook". Policy quoted in R2.

**ED-028** (`enforcement-debt.jsonl:20`): status **open**, severity medium.
> "A DECIDE/build MUST NOT rest on an inherited 'X is done/proven/verified/faithful' claim from a handoff/ledger/DUMP/retro without re-running the specific named check ... the artifact lags the code and may assert a correctness it no longer has." Same lying-enforcer family as BC-16.

**ED-030** (`enforcement-debt.jsonl:22`): status **open**, severity low. Policy quoted in R23.

(Bonus in-class verbatim: **ED-032** `enforcement-debt.jsonl:24` status open, severity medium — the sprint-team-orphaned-by-node-seam enforcer gap; **ED-015** `:7`, **ED-017** `:9` — adjacent dispatch-state staleness / re-dispatch-already-merged.)

---

## Per-bucket tally

| Bucket | Count | Date range | Items |
|---|---|---|---|
| 1 dot-dir/hidden-not-loaded | 0 | — | (no literal log evidence found) |
| 2 reap / no-completion-record | 15 | 2026-06-01 → 2026-06-05 | R1–R15 |
| 3 epsilon-not-conducting / adhoc-instead | 2 (+ overlap w/ bucket 4) | 2026-06-02 → 2026-06-06 | R26–R27 |
| 4 team-spawned-then-bypassed / theater | 10 | 2026-06-02 → 2026-06-07 | R16–R25 |
| 5 guard false-green | 5 | 2026-06-02 (+ ED-032 standing) | R28–R32 |
| 6 other / adjacent | 3 | 2026-06-02 → 2026-06-03 | R33–R35 |

Total distinct recurrences cataloged: **35** (R1–R35), spanning **2026-06-01 → 2026-06-07**.
Bucket 1 (hidden-instructions-not-loaded) has **no literal evidence** in the mined sources — do not assert it as a confirmed recurrence.

## Top-5 most damning quotes

1. `recurring-issues.jsonl:4` (RI-004) — "auto-backgrounded by the harness then silently reaped: 0-byte output, no exit code, no completion record, orchestrator waits forever ... keystone builder — bn623ani1.output 0 bytes, worktree empty, no savepoint."
2. `events.jsonl:24036` (operator, 2026-06-07) — "/fix:deep persistent teams always failing to come up on speint mode /sprint:full"
3. `traces.jsonl:5` (RT-2026-06-06) — "deferred this session -> operator asked 'where is the team?' ... /sprint:full is a node subprocess that STRUCTURALLY cannot reach the in-process team (full.js:653) ... spawned-but-orphaned, appearing 'never up'."
4. `.claude/dreams/2026-06-02.md:49` — "I built a gate to catch 'things shipped incomplete,' and the gate itself shipped incomplete (verifyTyped wired to nothing) ... a self-checking thing cannot be trusted to check itself."
5. `WARPOS-ISSUES.md:33` (I-4) — "silently degrades the boundary-consult safety net into after-the-fact validation." (β consult is theater: verdict arrives after the gate it guards.)
