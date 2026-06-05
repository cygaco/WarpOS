# Alex β Mining Recommendations — 2026-06-02

Cycle: **2026-06-02** `/beta:mine` (operator-directed run). Window mined: 2026-05-29 → 2026-06-02 (~4 days, the post-machine-migration session `s-q7gbsn`).
Data volume: 14,070 events · 6,354 tool events · 87 β decision records (`beta/events.jsonl`) + 1,386 `sprint_full_beta_consult` audit verdicts · 42 learnings · 253 prompts (≈120 real, rest `/fixture` smoke-test bursts — excluded per LRN event-pattern 2026-05-30).
Prior cycle (2026-05-30b) P-series ran to **P-042**; this cycle continues at **P-043**.
NOT auto-applied. `/sleep:deep` Phase 4 / `/beta:integrate` reviews these; new principles need an operator ruling.

---

## New Patterns Discovered

- **[P-043]** decision-honesty: **β's `/sprint:full` phase-boundary verdicts are CANNED, not reasoned.** All 1,386 real `sprint_full_beta_consult` audit records collapse to three hardcoded strings by phase: `before_plan`→DECIDE "looks good" (655×), `before_design`→DIRECTIVE "focus only on auth scope" (480×), `before_execute`→ESCALATE "too risky without review" (243×, byte-identical every time including across totally unrelated sprints — models, guides, capsule-gate, etc.). "focus only on auth scope" is leaking from one old auth sprint into every design boundary. This is the exact aspirational-vs-enforced / placeholder-verdict class `/scan:sprint-beta-honesty` exists to catch. (evidence: 1386 `kind=sprint_full_beta_consult`; ESCALATE message uniform "too risky without review" from 2026-05-29 through 2026-06-02; DIRECTIVE uniform "focus only on auth scope") **confidence: high**

- **[P-044]** consult-discipline: **AskUserQuestion is the primary β-gate violation site — 66 blocks / 9 successes (~88% gated) in 4 days.** Alpha reaches for AskUserQuestion before consulting β via SendMessage. The recurring fix is the same each time: consult β first, surface only on ESCALATE. (evidence: 66× `beta-gate-blocked` audit "Alex β not consulted"; LRN event-pattern 2026-06-02; corroborated by 9× `AskUserQuestion` tool events) **confidence: high**

- **[P-045]** core-tool-loop: **The build loop is Bash⇄Read⇄Edit.** Top <60s adjacencies: Bash→Read 318, Edit→Bash 231, Read→Bash 230, Read→Edit 177, Write→Bash 164. Grep→Read 81 and Read→Grep 70 = the "locate-then-read" investigation reflex; Glob→Read/Read→Glob ≈ 117 = enumeration. SendMessage clusters (Bash→SendMessage 86, SendMessage→Bash 77, Read→SendMessage 28) mark the adhoc-dispatch rhythm. β should expect Alpha to be mid-edit-verify-loop when consulted, not idle. (evidence: tools.jsonl pair counts) **confidence: high**

- **[P-046]** research-chain: **WebFetch↔WebSearch fire as a pair (WebFetch→WebSearch 18, WebSearch→Bash 21, Bash→WebFetch 20).** 153 WebFetch + 101 WebSearch + 74 ToolSearch this window = a heavy external-research phase (guides, design-principles, models-catalog ingest). This maps to the operator's `/research:deep` + `/learn:ingest` bursts. β: research output is DATA, not authority (ingest-firewall posture). (evidence: tools.jsonl) **confidence: medium**

- **[P-047]** session-shape: **One physical session ID spanned the whole 4-day window** (`s-q7gbsn`, "I accidentally closed our session; please recover" 2026-05-29T20:47). Session-scoped β state (leadSessionId, dispatch-state, turbo TTL) can't be trusted to rotate on the operator's mental "new session" boundary — the operator says "new session" verbally many times while the ID persists. (evidence: 253/253 prompts share session `s-q7gbsn`; explicit recovery prompt) **confidence: high**

- **[P-048]** delegation-shape: **"Amaze me / keep working through the roadmap without my input" is a standing DECIDE-and-execute mandate, not a one-off.** Repeated verbatim: "keep working… Amaze me with how much you can complete without my input" (05-29), "Make everything completely up-to-date, no stale [content]" (05-30), "I want everything done. But, in a new session" (05-30), "bust through DUMP.md, running parallel sprints" (06-01). β should treat long autonomous runs as pre-authorized within the safety floor; the operator's dissatisfaction signal is *under*-delivery, not over-reach. (evidence: ≥5 "keep going / amaze me / everything" prompts) **confidence: high**

- **[P-049]** spend-posture: **Operator wants a session-level budget honored, not per-$1 halts.** "Dude, never stop over spending $1, lmao. I gave you a session-level budget… log this as a fix in the roadmap. But anyways, approved." β should treat a granted session budget as the ceiling and stop interrupting under it; only the session ceiling (and the $5 CLAUDE.md line) are real gates. (evidence: prompt 2026-06-01T15:20; routed to roadmap as a fix) **confidence: high**

- **[P-050]** product-routing: **Product-judgment questions route through the Director/Lead persona layer, and the operator actively shapes that org chart.** This window the operator (re)defined the 5-phase lifecycle, made QA report to Dir-of-Product ("QA Lead, not standalone"), split Product Dir / Lead / Designer, and assigned roadmap-org to the Lead. β: "what's next" / prioritization / FTUE-vs-returning-UX are not raw-β calls — compose with the product persona (extends prior DP-gap #31 "compose, don't compete"). (evidence: ≥8 org-design prompts 2026-05-30) **confidence: high**

---

## Confidence Adjustments

- **β `/sprint:full` phase-boundary judgment: (implied high / DECIDE-DIRECTIVE-ESCALATE) → effectively NULL until the stub is replaced.** The verdict stream is canned (P-043), so any confidence the integrator might infer from "910 DECIDEs, sustained" is false signal. Do NOT raise confidence on sprint-phase decisions from this data; treat the path as unmeasured. (reason: 1386 identical-by-phase verdicts = no discriminating judgment exercised)
- **H-002 Security triage: 0.85-ish → hold / no raise.** Only 2 real `security` β records this window, both DECIDE, neither overridden — too thin to move. Keep current. (reason: n=2, insufficient)
- **H-001 Priority sequencing: 0.95 → keep.** 7 `priority` records, 0 overrides, consistent with the load-bearing-dependency template. No change warranted, well-supported. (reason: confirmed, not exceeded)
- **H-008 Default-to-execute on reversible mechanism: 0.9-ish → raise toward 0.95.** P-048 + P-049 add ~5 fresh confirmations (amaze-me, parallel sprints, budget-not-per-$1) with zero pushback on autonomous execution. The only override this window (autonomy-override 2026-05-21, "option b") was the operator choosing a *more* autonomous option than β recommended — bias is toward MORE autonomy, never less. (reason: ≥5 new confirmations, override direction = toward autonomy)
- **Spend/cost gating: lower the interrupt threshold confidence.** β/Alpha currently treat sub-$5 spend conservatively; operator explicitly wants session-budget-level autonomy (P-049). Recommend confidence DOWN on "pause to confirm spend under the session budget." (reason: explicit operator correction)

---

## New Anti-Patterns

- **AP-1: Placeholder β verdict masquerading as judgment.** Emitting a fixed per-phase string ("too risky without review", "focus only on auth scope") as a β consult result. It satisfies the gate's presence-check while exercising zero judgment, and stale content ("auth scope") bleeds across unrelated sprints. (evidence: P-043; this is the failure `/scan:sprint-beta-honesty` was built to detect — the scan exists but the path still emits placeholders → enforcement debt)
- **AP-2: AskUserQuestion before β consult.** Reaching for AskUserQuestion as the first move on a Class-B/C question. (evidence: 66 blocks / 4 days; user corrected behavior is "SendMessage β first")
- **AP-3: `node -e` fs-write reflex.** Still 17× merge-guard-blocked across the window despite the standing CLAUDE.md rule — use Write/Edit or a script file. (evidence: 17–18× `merge-guard-blocked` "node -e with fs write blocked"; LRN audit-pattern 2026-06-02)
- **AP-4: `cd X && cmd` compound construction.** 439× `cd-prefix-stripped` (peaks 209, 110). The guidance ("prefer `git -C`/absolute paths") isn't reaching command-construction time. (evidence: 439× `cd-prefix-stripped`; LRN tool-churn 2026-06-02)
- **AP-5: Turbo used to hand-edit append-only stores.** Turbo's write-jsonl/manifest-edit scopes were used 8× to Edit `events.jsonl` directly — precisely what memory-guard exists to prevent (1,569 `memory-guard-blocked` this window). Turbo should not open a clean path through an append-only invariant. (evidence: 8× `auth-bypass` scope=write-jsonl on events.jsonl; LRN audit-pattern 2026-06-02)
- **AP-6: Long session, no retro.** 22× "500 tool calls but no retro" with zero retro written — aspirational policy, no enforcer firing. (evidence: 22× `no-retro-created`; LRN audit-pattern 2026-06-02)

---

## Persona Gaps

- **G-14: β has no stance on autonomous-run governance.** P-048 ("amaze me, no input") + P-049 (session budget) describe a mode where β's job is to keep a long unattended run inside the safety floor, not to pause for reassurance. No principle covers "how aggressive to be when explicitly told to go heads-down." Needs a Communication-Style / Heuristic entry.
- **G-15: β can't distinguish "operator's verbal new-session" from "physical session boundary."** P-047 — state-rotation decisions (kill stale team, reset turbo TTL, fresh dispatch state) hinge on session identity, but the operator's mental boundary and the session ID diverge. β should weight the operator's verbal "new session" over the unchanged ID when judging team/state-hygiene questions.
- **G-16: No principle for the productized org layer.** P-050 — the Director/Lead/Designer hierarchy and "QA reports to Dir-of-Product / product-priority-over-severity" are now live, but β's persona doesn't encode *which* persona owns *which* class of product call. Extends DP-gap #31.
- **G-17: β has no honesty principle about its own outputs.** Given AP-1 (canned verdicts), β should carry an explicit rule: a consult that didn't actually reason must say so (return UNREASONED/abstain), never emit a confident-looking placeholder. Mirrors the project-wide "harden every enforcer against lying" learning (BC-16).

---

## Decision Policy Gaps

- **DP-gap #32 (spend ceiling semantics — target `paths.currentStage` + `paths.decisionPolicy` rubric).** The policy treats <$5 as freely-autonomous and ≥$5 as ask-first, but the operator grants a *session-level budget* and is annoyed by sub-budget interrupts (P-049). The rubric needs a "session budget granted → that is the ceiling, don't re-ask under it" clause, distinct from the per-action $5 line. Operator-flagged this himself ("log this as a fix").
- **DP-gap #33 (the β-consult path emits placeholders — target: the `/sprint:full` β-consult implementation + `paths.betaEvents` contract).** Policy says "β consultation protocol… log to `paths.betaEvents`," but the logged verdicts are canned (P-043/AP-1). The contract needs: a real reasoned `beta_message`, distinct per consult, with `/scan:sprint-beta-honesty` wired as a release/close gate (it currently audits but the path ships placeholders anyway → enforcement debt). 
- **DP-gap #34 (autonomous-run authorization — target `paths.decisionPolicy`).** No clean Class for "operator said keep going unattended for hours / amaze me." Is each downstream sub-decision Class A by inheritance, or does β re-classify per action? P-048 says treat the standing mandate as pre-authorization within the safety floor — needs an operator ruling and a written rule so β doesn't bounce mid-run.
- **DP-gap #35 (verbal-vs-physical session boundary — target `paths.decisionPolicy` + team-hygiene).** When the operator says "new session" but the session ID persists (P-047), which signal governs state-rotation red lines (orphaning an in-flight builder, killing a team)? Relates to ED-015/ED-016. β currently has no tiebreak rule.
- **DP-gap #36 (AskUserQuestion classification — target `paths.decisionPolicy`).** 88% of AskUserQuestion calls are gate-blocked. The policy should state plainly: AskUserQuestion is reserved for post-ESCALATE surfacing only; any pre-decision use is a β-consult-first violation. Make the red line explicit so it's self-detecting at write-time, not just at the gate.

---

*Mining method note:* `/fixture hook smoke test` prompt bursts and `SP-TEST`/`distinctive-msg`/`synthetic` consult records were excluded from real-signal counts (239 synthetic consults filtered out of 1,625). Frustration regex over real prompts surfaced 5 genuine signals; the dominant evidence base for behavioral anti-patterns is the audit-event tally cross-validated against the 2026-06-02 learnings batch, which independently logged the same numbers (66/17/439/22). Full prior cycles archived in `judgement-model-recommendations-archive.md`.

---
---

# Alex β Mining Recommendations — 2026-06-05

Cycle: **2026-06-05** `/beta:mine` (operator-directed run). Window mined: this session (`s-phaseb-0601` arc continued), a large agent-system build — **Phase D hook-point framework + v0.2 migration foundation** on top of the ADR-0007 org-rewrite that landed on main @9a132af.
Behavioral evidence base: this session's operator prompts + the batched-consult β event stream (`EVT-sp20260531-006-batched-consult-d1..d9`, `EVT-dump-items-124-closure-001` — both show the batched-pre-clearance rhythm in the log) cross-read against the 2026-06-02 cycle (P-043..P-050) so as not to re-derive what's already staged.
Prior cycle (2026-06-02) ran to **P-050 / AP-6 / G-17 / DP-gap #36**; this cycle continues at **P-051 / AP-7 / G-18 / DP-gap #37**.
NOT auto-applied. `/sleep:deep` Phase 4 / `/beta:integrate` reviews these; new principles need an operator ruling.

> Scope discipline per the task: 4 high-value, evidence-backed patterns distilled from THIS session, plus the minimal anti-pattern / persona-gap / decision-policy-gap each one implies. These do NOT touch the judgment model directly — recommendations only.

---

## New Patterns Discovered

- **[P-051]** delegation-shape: **"Bundle blockers, ask once at the end" is an explicit ordering directive, not just an autonomy grant.** Verbatim this session: *"Proceed through all of the work. If there are blockers that need my input, bundle them together and get through what work you can. Only ask me once everything else is done."* This is stronger and more specific than P-029 (AskUserQuestion needs a β pre-consult) and P-048 (amaze-me standing mandate): it dictates the *scheduling* of operator interrupts. β's job during a long run is to (a) keep every blocker that isn't a hard-ceiling/irreversible action OUT of the operator's path, (b) accumulate genuine must-ask items into a single deferred batch, and (c) only force a mid-run surface for a true hard-ceiling event (push, ≥$5, irreversible/outward). The β-side mechanism is exactly the batched-pre-clearance pattern already in the log this session — one consult resolving D1..D9 at once "saved 4 boundary round-trips" (`EVT-dump-items-124-closure-001`). β should *manufacture* that batching proactively rather than consult per-fork. (evidence: explicit batch-blockers prompt; `EVT-sp20260531-006-batched-consult-d1..d9` single-timestamp batch; `EVT-dump-items-124-closure-001` "batched pre-clearance saved 4 boundary round-trips") **confidence: high**

- **[P-052]** land-discipline: **Landing to main is scan-gated, and push is pre-authorized for the whole arc by one explicit line — not re-asked per commit.** This session the operator said *"commit push main, then proceed"* once, mid-session, and expected that single authorization to cover the arc's landings rather than a per-land re-prompt. Paired with the standing engine-sprint close pattern (RI-001: green ship-coverage + framework-purity + relevant scans → `/commit:land` → ff-merge), the operative β rule is: **a land to main is legitimate once the gating scans are green; the operator's one typed push line is the classifier-required authorization for the arc, not for a single commit.** β should treat a green scan-gate as the precondition it actually verifies before any DECIDE on a land (don't DECIDE "ship it" with red/unrun gates — cf. the routing-trace-blind gap, judgment-model DP #22), and should NOT re-escalate push once the operator has typed the arc-level push line — but must still HALT for push when no such line exists (hard ceiling stands; `EVT-sp20260531-006-d6/d9`: "push is hard ceiling — DECIDE does not authorize"). (evidence: "commit push main, then proceed" single authorization; RI-001 close verdicts `EVT-sp20260531-002/003-before-release-prep`; `EVT-sp20260531-006-d9` "operator typed prose 'push and release' is the line the classifier requires") **confidence: high**

- **[P-053]** failure-posture: **Loud-fail-not-silent-fallback is a first-class β invariant — β itself surfaced it this session and the project's whole bug-class history backs it.** When a primitive, path, manifest, or env binding is unavailable, the correct behavior is to fail loudly (non-zero exit, visible halt, explicit "X not found") — never to silently fall through to a default, which masquerades as success and costs hours to diagnose. This is the through-line of the session's foundation work (Phase D hook-points + v0.2 migration both add binding surfaces that *must* fail loud when unresolved) and is independently validated across the project's learning corpus: the `anthropic`→`claude` stale-check bug "silently fell through to defaults, masquerading as a 'save not working' bug for hours" (CLAUDE.md Refactor-Hygiene), the rename-cutover note where a green role↔spec bijection *masked* an un-migrated runtime that "nearly ENOENT-crashed" (`feedback_rename_cutover_covers_both_layers.md`), and the BC-16 "harden every enforcer against lying" class (runner-error→non-zero, malformed→fail-closed). β's standing posture: on any consult about an absent/unresolved binding or a guard/enforcer's failure mode, DIRECTIVE the loud-fail design (fail-closed, non-zero, explicit) over a silent default; treat a "falls through to a sensible default" proposal as the anti-pattern. Extends the project's "fail-closed, not fail-open" design principle (beta-source-data §2.1) from hooks to all binding/resolution code. (evidence: β surfaced loud-fallback this session; CLAUDE.md Refactor-and-Rename-Hygiene `anthropic`→`claude` silent-fall-through; `feedback_rename_cutover_covers_both_layers.md` masked un-migrated runtime; BC-16 enforcer-honesty class; `project_enforcer_falsegreen_gauntlet.md`) **confidence: high**

- **[P-054]** session-shape: **The session-launch ritual is fixed: `/mode:adhoc` + `/session:turbo` + read `DUMP.md` → execute.** The operator opens a work session with this exact sequence and treats it as a single standing intent ("set up the session and go"), not three independent decisions. The `DUMP.md` handoff is *prescriptive context to execute*, not a menu to re-plan from. β implication: at session start, when this ritual fires, treat turbo as active for the whole TTL (lean DECIDE over ESCALATE for Class B — P-025/turbo-active row), treat `DUMP.md` items as already-scoped work (don't re-litigate their inclusion — the work-list is the operator's, β classifies+gates the *how*), and expect the adhoc team (α+β+γ) to be live. This tightens P-025 (turbo skill-chain expectation) and the "operator treats the agent layer as a real company" framing into a named opener. (evidence: this session's `/mode:adhoc` + `/session:turbo` + DUMP-execute opener; consistent with prior turbo-active rows; DUMP-driven execution `EVT-dump-items-124-closure-001`) **confidence: high**

---

## New Anti-Pattern

- **AP-7: Interrupting a "proceed through everything" run with a non-hard-ceiling question.** Surfacing a soft/Class-A/Class-B blocker to the operator mid-run when P-051's batch-blockers directive is in force, instead of routing it around (decide it) or parking it in the deferred end-of-run batch. The only legitimate mid-run interrupts are hard-ceiling/irreversible events (push without a standing line, ≥$5, outward/destructive). Every other "should I…?" either gets a β DECIDE or goes into the batch. (evidence: explicit batch-blockers prompt this session; mirrors the AskUserQuestion-before-β-consult class AP-2/P-044 but is about *timing* of legitimate questions, not the gate — the fix is "defer to the end batch," not "consult β first")

---

## Persona Gap

- **G-18: β has no principle for *scheduling* operator interrupts (the batch-blockers contract).** Existing rows cover *whether* to ask (Class A/B/C, AskUserQuestion-needs-β-consult) and *how aggressive* to be under a standing mandate (G-14 autonomous-run governance), but none covers *when* a legitimately-must-ask item should reach the operator during a long run. P-051 establishes the answer: accumulate must-ask items into a single end-of-run batch; only hard-ceiling events break that ordering. Proposed Communication-Style / Heuristic entry: *"During a declared continuous run, β defers all non-hard-ceiling must-ask items into one end-of-run batch and proactively pre-clears forks in batched consults; mid-run surfaces are reserved for hard ceilings."* Composes with G-14. **Operator must rule** before promoting.

---

## Decision Policy Gap

- **DP-gap #37 (arc-level push authorization semantics — target `paths.decisionPolicy` §Two-gate authority).** P-052: when the operator types one arc-level push line ("commit push main, then proceed"), does that satisfy the classifier's typed-prose requirement for *every* land in the arc, or only the next one? Current policy (Two-gate authority) reads push as a per-action hard ceiling requiring a typed line; the operator's observed intent is arc-level pre-authorization within a session. The policy needs an explicit clause: *a typed arc-level push directive authorizes pushes for the declared arc/session until revoked or until scope changes (e.g., a new outward target); β does not re-escalate push within that window, but a land with red/unrun gating scans still halts on the scan-gate, not the push-gate.* Distinct from the per-action $5 line and from DP-gap #34 (autonomous-run authorization), which it complements. **Operator-flagged adjacent** ("commit push main, then proceed" treated as standing).
