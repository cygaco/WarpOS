# W5 Implementation — STAGED (pending operator authorization)

**Status:** DESIGNED + GATED. The auto-mode classifier (correctly) blocked the dispatch-config
self-modification edits on 2026-06-18; the operator must explicitly authorize before this lands.
**Canonical design:** ADR-0011 (`.claude/agents/president/_system/policy/adr/0011-epsilon-direct-roster-dispatch.md`,
status: proposed). β ESCALATE'd + endorsed (Class C, 0.88) and recommended ONE grant covering the
WHOLE remaining E-DISPATCH-PERFECT-001 epic (W5 + ADR-0013 repair + W3).

**Substance (one line):** the in-process roster (managers/leads/directors/design-quality/visual-review)
is summonable by the ε CONDUCTOR in ANY spawn context — top-level (α-wearing-ε) OR teammate-ε —
supplying a scopeContract; ED-041 retired as a per-spec misstatement (a subagent has Agent iff its
spec lists it; ε's does); the spawn-hand stays with the conductor (no deep cascade).

---

## Edit surface (Explore map, 2026-06-18 — verified file:line; the non-reconstructable recon)

### A. ED-041 / α-only misstatement occurrences — sweep ALL, key each to ADR-0011
- `.claude/agents/president/epsilon.md` — "Conduct routes by spawn context" table (131–143), STARTUP
  ROUTE SELF-CHECK (145–152), line-168 "When ε is the top-level session face" framing, line-174
  in-process-roster bullet. [α edits this whole file — the table edit is already designed per ADR-0011:
  teammate row "Agent tool? → YES (ε's spec lists Agent)"; self-check reports in-process available in
  both contexts + self-heal fallback; line-168 → "As the conductor (top-level OR teammate)"; line-174 →
  add "supplying a scopeContract".]
- `.claude/agents/_org/dispatch-contract.json` — `role_overrides.epsilon._note` (196) +
  `mode_profiles.sprint.alpha_only_shapes` → `[]` + `_alpha_only_note` rewrite (218–219). [α; exact new
  text per ADR-0011: empty the array, note explains retirement + scopeContract gate + no-cascade axis +
  the Codex carve-out.]
- `scripts/dispatch/dispatch-contract.js` — comment block 510–517 describes alpha_only_shapes as
  "α-ONLY … a teammate-spawned ε cannot call the Agent tool". Reconcile → "retained-but-empty annotation
  per ADR-0011 (no shape is α-only)". KEEP the validation logic (518–526: array-of-known-shapes check).
- `.claude/agents/_system/guides/agent-dispatch-guide.md` — "Teammate-ε conduct routes (ED-041)"
  section: lines 293, 296, 304 (the DEFERRED-to-α row).
- `.claude/commands/mode/sprint.md` — lines 59–60, 68–75, 79 ("Who may call the Agent tool (ED-041)" + α-only).
- `.claude/commands/sprint/full.md` — lines 118, 378 (ED-041 constraint; "teammate-spawned ε uses CLI routes only").
- **CODEX.md line 21** — DO NOT flip to "you can summon the roster": Codex genuinely has NO harness Agent
  tool (it is not a Claude-harness agent). FIX ONLY the rationale — it is not ED-041; the correct reason
  is "a non-Claude orchestrator isn't a Claude-harness agent at all, so it has no Agent tool." Keep "CLI routes only."
- **Reconcile** (mark resolved-by-ADR-0011, don't rewrite history): DISPATCH-ERRORS.md (E2 line 87; ED-041
  lines 165/166/175/199 — incl. the R1 persistent-core proposal), NOTAGAIN.md (73, 184),
  runtime/roadmap-audit/enforcement-debt-honesty.md (87 — untracked, optional).
- **Tracker:** trackers/epics/E-DISPATCH-PERFECT-001-…md line 31 already states the per-spec finding;
  flip S-DP-W5 (line 127) to DONE on land.

### B. Runtime gate — NO logic change needed
- `scripts/sprint/epsilon-runtime.js` `spawnAgent` (487–616), decision at 523–526 returns
  `requires-orchestrator` for CLAUDE_AGENT/AGENT_TOOL routes. This is CORRECT — a node SCRIPT can't call
  Agent; the ε-AGENT does. The reason string already says "ε-the-agent / α". Optional: clarify to
  "the ε-agent (top-level OR teammate)". There is NO α-vs-teammate detection (route is registry-derived).

### C. Real gate — already enforced (scopeContract)
- `scripts/hooks/scope-contract-guard.js` `hasScopeContract` (80) + `extractScopeContract` (97–137):
  requires scopeContract|allowedFiles|forbiddenFiles on roster/build-chain Agent spawns; empty
  allowedFiles + no forbidden = BLOCK (fail-closed). For a READ-ONLY consult, supply `forbiddenFiles`
  to signal writes-nothing — VERIFY the exact read-only-consult form against the guard when implementing.

### D. NEW enforcer (the DoD "enforced" item) — no-deep-cascade / spawn-hand-stays-with-conductor
- `scripts/hooks/dispatch-route-guard.js` (648–667) ALREADY blocks in-process Agent dispatch of
  build-chain roles. NO existing "no deep cascade" check. ADD a check + planted-violation fixture
  asserting a summoned roster consult cannot dispatch the build chain (ε = sole builder-dispatcher);
  wire report-only into scan:full first, then blocking. Fixture pattern = dispatch-contract.test.js P5.

### E. Tests/fixtures to touch
- `scripts/dispatch/dispatch-contract.test.js` — flip any assertion that `alpha_only_shapes` CONTAINS
  in-process-agent → now `[]`; add the W5 planted-violation.
- `scripts/sprint/epsilon-runtime.test.js`, `scripts/hooks/scope-contract-guard.test.js` — add W5 cases.

### F. ADR — 0011 drafted (status proposed; highest prior = 0010). Flip → accepted on land.

---

## Build plan (on authorization)
1. **α (foreground, keystone):** ADR-0011 status → accepted; edit dispatch-contract.json (alpha_only block +
   epsilon._note), epsilon.md (table + self-check + line-168 + line-174), dispatch-contract.js comment,
   CODEX.md rationale-fix. RE-READ each file fresh before editing (Edit discipline).
2. **backend-builder #1 (worktree):** doc-sweep (agent-dispatch-guide.md, mode/sprint.md, sprint/full.md)
   + reconcile DISPATCH-ERRORS.md / NOTAGAIN.md — keyed to ADR-0011.
3. **backend-builder #2 (worktree, parallel):** the no-cascade enforcer + planted-violation fixture + test
   + scan:full report-only wiring.
4. **α:** cross-provider gauntlet (security-reviewer gemini + mandatory GPT 2nd pass; backend-reviewer GPT)
   on the FULL changeset — it caught ~7 false-greens on dispatch-keystone changes this epic, so it is
   non-negotiable; fix-cycle; regen BOTH manifests; commit + push + merge.
5. **Then (same authorization):** ADR-0013 enforce-flip repair (the -w / fixer / normalized-roles fix in
   dispatch-contract.js, currently report-only/reverted) → unblocks **W3** (codex-doer migration: new
   `subprocess-codex` build shape; doers→gpt-5.4, fixers/skeleton→gpt-5.4-mini, security-builder/fixer
   STAY claude, coupled reviewer rebalance).
6. Residuals: ε in-gauntlet multi-pass merged-verdict gate; delta-final-gauntlet.js → dispatch-review.js;
   register the claude-third_pass sanctioned lane BEFORE ADR-0013 re-enforces; deeper-W4 ROADMAP/_requirements
   DOMAIN_VOCAB (judgment — many may be legit product vocab, not leakage; do NOT blind-sweep).
