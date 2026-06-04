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
