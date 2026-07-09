// One-shot /learn:deep appender (session/2026-06-16). Lives in runtime/ (walk-skipped):
// no manifest churn, no cleanup. Uses the canonical logLearning() helper.
const { logLearning } = require("../scripts/hooks/lib/logger");

const entries = [
  {
    intent: "meta",
    source: "learn:deep:conversation",
    tip: `A handed-off "bug" diagnosis can be WRONG: before applying a fix from a DUMP/handoff/tracker, verify the premise reproduces in canonical. Config that is deeply wired (multi-file + tests + a dedicated class) AND carries a recorded operator rationale is deliberate, not churn fallout — the "fix" would reverse an operator decision on a false premise.`,
    conditions: { why: `ED-055 "design-lead misregistered" was actually the intentional cross_provider_consult_lead (RULE 4); the handoff fix would have torn out load-bearing machinery`, evidence: `ED-055 design-lead session/2026-06-16; converges with verify-canonical-not-downstream-register + stale-percent-without-verify` },
  },
  {
    intent: "agent-tooling",
    source: "learn:deep:conversation",
    tip: `When an advisor "won't dispatch", check the DOOR (route) before assuming misregistration. design-lead (cross_provider_consult_lead) MUST go via scripts/dispatch-agent.js (subprocess); its model:gpt-5.5 frontmatter makes the in-process Agent tool fail BY DESIGN, and record-inprocess correctly refuses the route.`,
    conditions: { why: `the in-process vs subprocess route mismatch looked like a broken setting; it was the system working as designed`, evidence: `ED-055; fix = label-the-door in agent-dispatch-guide §3 + design-lead.md header + clearer epsilon-runtime refusal` },
  },
  {
    intent: "gauntlet",
    source: "learn:deep:retros",
    tip: `A served-page design/visual gauntlet false-greens on a page that never loaded when the server auto-dies racing the headless review. For any served-page gauntlet: run the server with a --review-mode/--no-auto-shutdown keepalive, print the EXACT loopback URL, assert REAL rendered selectors, and treat navigate-fail/blank as FAIL.`,
    conditions: { why: `a gauntlet that "passes" on a blank/unloaded page is a false-green`, evidence: `SP-20260615-002 roadmap-gui visual gauntlet; DUMP 2026-06-15` },
  },
  {
    intent: "build",
    source: "learn:deep:events",
    tip: `Any panel/GUI/served-page feature needs a reachability smoke (boot -> assert ready line + parsed port -> GET 200) as its named enforcer BEFORE claiming done. Do not claim "done" on a server you never booted.`,
    conditions: { why: `roadmap panel churned ~20 edits + 3 operator "can't be reached / where is it" reports because done was claimed without a boot-smoke`, evidence: `events 3d: scripts/panel/roadmap.js 20 edits, 3 not-opening prompts; ED-053 admin:preview live-smoke owed` },
  },
  {
    intent: "worktree-hygiene",
    source: "learn:deep:retros",
    tip: `Tracker-mutating scripts (ticket/checkpoint/advance) must take an explicit --sprint and refuse to resolve sprint from CWD/registry-primary; and NEVER advance tickets by date-substring grep (grep 20260615 matched ALL T-20260615-* across sprints, reverting another sprint's done tickets). Use explicit ids + assertInMainRepo().`,
    conditions: { why: `silent cross-sprint ticket-bleed`, evidence: `retros: SP-001 30+ bleed tickets across >=4 sprints; DUMP date-grep collision 2026-06-15` },
  },
  {
    intent: "meta",
    source: "learn:deep:retros",
    tip: `Every new enforcer/grader ships with passing tests but is often NOT registered as a standing regression class, so future builds do not re-run it and silent breakage goes unnoticed. Register every new enforcer as a regression class (BC-NN) at build time — "every policy needs a named enforcer" applies to the enforcer itself.`,
    conditions: { why: `the enforcer itself needs a watchdog`, evidence: `sessions/2026-05-31 (4 enforcers, only 1 registered); CLAUDE.md Policy-Enforcement-Hygiene` },
  },
  {
    intent: "meta",
    source: "learn:deep:retros",
    tip: `~50 of 62 sprint retros are synthesis_mode:skeleton with <TO FILL> placeholders — /sprint:release writes a skeleton because the skill body never invokes LLM synthesis; the retro->learning loop leaks at the source. Wire LLM synthesis into the release/retrospective skill body (default-on; warn if neither --synthesis nor --no-synth passed).`,
    conditions: { why: `retros are the Phase-C input to learning; skeleton retros starve it`, evidence: `~20+ sprints skeleton; SP-20260513-001 friction + 005 action#5; DUMP 2026-06-09` },
  },
];

let n = 0;
for (const e of entries) {
  const ok = logLearning({ ts: "2026-06-16", status: "logged", score: 0, ...e });
  if (ok) n++;
}
console.log(`logged ${n}/${entries.length} learnings`);
