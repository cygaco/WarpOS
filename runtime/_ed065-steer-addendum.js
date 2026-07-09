// Append a 2026-06-20 addendum to ED-065 recording the lead's "ship-complete-not-debt-for-convenience"
// steer + ε's feasibility verdict. We don't mutate the existing JSONL line (append-only ledger);
// we append a follow-up annotation event that references ED-065.
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const edFile = path.join(ROOT, ".claude/project/memory/enforcement-debt.jsonl");

const addendum = {
  id: "ED-065-addendum-2026-06-20",
  ts: "2026-06-20T00:00:00Z",
  refs: "ED-065",
  policy:
    "ADDENDUM to ED-065 (the two-hop reviewer→builder cascade). Lead steer 2026-06-20 (W5): prefer shipping consult-roster-no-dispatch COMPLETE with the one-hop-reviewer assertion; debt-log ONLY if it genuinely can't land this sprint, not for convenience ('a no-cascade enforcer that can't tell reviewer-fanout from builder-cascade is half the guarantee'). ε feasibility verdict: the COMPLETE one-hop assertion genuinely CANNOT land cleanly within W5 (doctrine-retirement scope), for STRUCTURAL reasons, not convenience.",
  severity: "medium",
  status: "open",
  missing_enforcer:
    "same as ED-065 — a lineage/caller-identity aware one-hop-reviewer assertion (reviewer may dispatch ONLY its pod's leaf reviewers, never the build chain)",
  candidate_enforcers: [
    "VERDICT on candidate [0] (block builder-dispatch unless caller==conductor): NOT LANDABLE — requires a spawn-lineage/caller-identity signal the harness does NOT expose to a PreToolUse hook (re-verified 2026-06-20: dispatch-route-guard sees a single Bash event, no lineage). Hard harness limitation.",
    "VERDICT on candidate [1] (env-marker WARPOS_NO_BUILD_DISPATCH=1 on reviewer spawns, checked in the route-guard Bash branch): FEASIBLE as a FOLLOW-ON, NOT in W5. Confirmed the infra exists — dispatch-agent.js already reads many WARPOS_* env vars (RUN_ID/PHASE_ID/SPRINT_ID/MODE) and shapes spawns via process.env, so an env marker is propagable. BUT landing it is a CROSS-CUTTING change to the reviewer-spawn machinery: (a) set the marker on every reviewer subprocess spawn (ε/quality-lead reviewer dispatch path), (b) add a BLOCK in dispatch-route-guard.js's Bash branch for dispatch-claude.js/dispatch-agent.js <build-role> when the marker is present, (c) prove no false-flag of a reviewer legitimately running tests/checks, (d) its OWN cross-provider gauntlet (it changes how every reviewer spawns — blast-sensitive). That is a self-contained dispatch-machinery sprint, OUTSIDE W5's 'retire ED-041' doctrine scope. THIS IS THE RECOMMENDED ENFORCER for the follow-on.",
    "candidate [2] (remove Bash from reviewers that don't need it): narrows only — reviewers that genuinely run tests keep Bash; does not close.",
    "The W5 enforcer correctly ships the SCOPED guarantee (direct consult→dispatch closed BY CONSTRUCTION) + REPORT-ONLY in /scan:full; BLOCKING-FLIP TRIGGER unchanged (flip once the one-hop assertion [1] lands AND a gauntlet confirms no false-flag).",
  ],
  note:
    "β honesty floor APPLIED, not for convenience: the lead's critique is correct (half the guarantee) — which is EXACTLY why the W5 enforcer claims the SCOPED guarantee, not a blanket 'no-cascade'. The complete one-hop assertion can't land in W5 because the clean form needs a harness lineage signal that does not exist, and the feasible form (env-marker) is a cross-cutting reviewer-spawn-machinery change requiring its own design + blast-sensitive gauntlet — a follow-on sprint, not a doctrine-retirement leg. Recommended next pick alongside the ADR-0013/W3 work. Related: ADR-0014, dispatch-route-guard.js (Agent + Bash branches), dispatch-agent.js (WARPOS_* env reads), the reviewer tool-sets in role-registry.json.",
};

fs.appendFileSync(edFile, JSON.stringify(addendum) + "\n");
console.log("OK appended ED-065-addendum-2026-06-20");
