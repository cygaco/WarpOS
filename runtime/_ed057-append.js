// one-shot: append ED-057 enforcement-debt entry (W2-core skill-shape-vocabulary gap)
const fs = require("fs");
const p = ".claude/project/memory/enforcement-debt.jsonl";
const entry = {
  id: "ED-057",
  ts: "2026-06-16T18:45:00.000Z",
  policy:
    "The shape-door enforce gate cannot refuse a wrong-shape SKILL dispatch: dispatch-skill.js subprocess-spawns skills, but the resolver routes {kind:skill} to inline (skills are not earned-subprocess, §13.6/§13.7), so enforce-for-skills would false-refuse EVERY skill dispatch. dispatch-skill is therefore PINNED report-only.",
  source: "E-DISPATCH-SHAPE-001 W2-core SP-20260616-001 (DoE design-soundness finding C1)",
  missing_enforcer: "resolver-shape-vocabulary",
  candidate_enforcers: [
    "add a subprocess-skill shape to dispatch-shape.js SHAPES + teach resolveSkill/skillExecution to return it for a proven subprocess skill, so dispatch-skill can ride the WARPOS_SHAPE_DOOR enforce ramp like the other 3 wrappers",
    "or keep skills permanently inline-or-pinned and drop the subprocess-skill ambition (decide at the W2 enforce-flip design)",
  ],
  severity: "low",
  status: "open",
  note:
    "W2-core shipped dispatch-skill report-only-PINNED (reportOnlyPin:true): it surfaces the inline-vs-subprocess advisory but never refuses. The other 3 entry points (dispatch-claude, dispatch-agent, epsilon CLAUDE_RAW) ride the WARPOS_SHAPE_DOOR enforce ramp normally. Reconcile when the resolver gains skill-subprocess vocabulary.",
};
const existing = fs.readFileSync(p, "utf8");
if (existing.includes('"ED-057"')) {
  console.log("ED-057 already present — no-op");
} else {
  fs.appendFileSync(p, JSON.stringify(entry) + "\n");
  console.log("ED-057 appended; file now", fs.readFileSync(p, "utf8").trim().split("\n").length, "entries");
}
