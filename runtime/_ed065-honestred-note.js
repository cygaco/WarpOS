// Append a 2026-06-20 honest-RED note to the ED-065 thread: the enforcer was changed from
// green-with-exemption to honest-RED per the lead's convergence bound.
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const edFile = path.join(ROOT, ".claude/project/memory/enforcement-debt.jsonl");

const note = {
  id: "ED-065-honestred-2026-06-20",
  ts: "2026-06-20T00:00:00Z",
  refs: "ED-065",
  policy:
    "RESOLUTION-NOTE on the ED-065 thread: the consult-roster-no-dispatch enforcer was changed (commit 16c3ec4c) from GREEN-WITH-EXEMPTION (exit 0 + an 'OK ~ EXEMPT quality-lead' line) to HONEST-RED, per the lead's 2026-06-20 convergence bound ('honest-RED beats green-with-exemption; never the latter'). The DEBT itself (the two-hop reviewer→builder cascade) is UNCHANGED and still open — what changed is that the enforcer now TELLS THE TRUTH about it instead of reading green.",
  severity: "medium",
  status: "open",
  missing_enforcer:
    "unchanged — the lineage-aware one-hop-reviewer assertion (see ED-065 + ED-065-addendum-2026-06-20; the env-marker WARPOS_NO_BUILD_DISPATCH=1 is the recommended follow-on enforcer)",
  candidate_enforcers: [
    "DONE (this note): evaluate() now returns ok:false on a known open hole (NOT clean); cleanOfNewViolations + knownOpenHoles are distinct signals; the output prints 'RED ... KNOWN OPEN HOLE(S) — the guarantee is INCOMPLETE'; a NEW untracked violation ALWAYS hard-fails (exit 1) while the KNOWN hole is REPORT-ONLY exit 0 (does not break /scan:full) with `--enforce` as the blocking-flip ramp (knownOpenHole → exit 1). Test 16/16.",
    "REMAINING (the actual close): the env-marker one-hop-reviewer assertion from ED-065-addendum candidate [1] — set WARPOS_NO_BUILD_DISPATCH=1 on reviewer subprocess spawns + block dispatch-claude.js/dispatch-agent.js <build-role> in the dispatch-route-guard Bash branch when set. Cross-cutting reviewer-spawn-machinery change with its own gauntlet → a follow-on dispatch sprint. Once it lands AND a gauntlet confirms no false-flag of the legit pod fan-out, flip this enforcer to `--enforce` (blocking) so the known hole becomes a hard gate.",
  ],
  note:
    "The decision NOT to do the full quality-lead read-only/coordinator SPLIT in W5 was a blast-radius call: 32 consumers reference quality-lead (role-registry, dispatch-contract, org-map, sprint-hook-points, principles registry, dispatch-guide, mode/sprint, sprint/full, scan/full, both manifests, + design-quality/test-runner/conversion-lead specs; registry tools:['Agent'] is REQUIRED for its reviewer fan-out). Wide-blast → the lead's bound says ship the enforcer flagging the hole honest-RED + ED-065, which is what landed. Related: ADR-0014, consult-roster-no-dispatch.js (16c3ec4c), dispatch-route-guard.js, dispatch-agent.js (WARPOS_* env reads).",
};

fs.appendFileSync(edFile, JSON.stringify(note) + "\n");
console.log("OK appended ED-065-honestred-2026-06-20");
