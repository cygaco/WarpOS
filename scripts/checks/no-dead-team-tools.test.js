#!/usr/bin/env node
"use strict";

/**
 * Isolated P5 test for no-dead-team-tools.js. Proves the pure `evaluate` core:
 *   - CATCHES a planted live TeamCreate( / TeamDelete( directive (a regression),
 *   - EXEMPTS a legitimate historical mention ("removed in v2.1.178") and a
 *     descriptive "surrogate for TeamDelete" line,
 *   - PASSES files with no team-tool reference and the clean migrated Agent shape.
 *
 *   node scripts/checks/no-dead-team-tools.test.js
 */

const assert = require("node:assert");
const { harness } = require("./lib/fixture-harness");
const { evaluate } = require("./no-dead-team-tools");

const h = harness("no-dead-team-tools");

// 1) PLANTED VIOLATION — a live TeamCreate( directive with NO exemption marker.
// h.violation asserts the enforcer result is NOT a pass (ok:false ⇒ caught).
h.violation("a live TeamCreate( directive (no marker) is flagged", () =>
  evaluate({ files: [{ path: "a.md", content: 'Run: TeamCreate(team_name:"x")\n' }] }));

// …and it's EXACTLY the planted line (1 offender), not a coincidental fail.
h.test("the planted TeamCreate( yields exactly one offender on the right line", () => {
  const r = evaluate({ files: [{ path: "a.md", content: 'Run: TeamCreate(team_name:"x")\n' }] });
  assert.strictEqual(r.ok, false, "must be ok:false");
  assert.strictEqual(r.offenders.length, 1, "exactly one offender");
  assert.strictEqual(r.offenders[0].lineno, 1, "offender on line 1");
  assert.ok(/TeamCreate\(/.test(r.offenders[0].text), "offender text quotes the directive");
});

// 2) PLANTED VIOLATION — a live TeamDelete( directive with NO marker.
h.violation("a live TeamDelete( directive (no marker) is flagged", () =>
  evaluate({ files: [{ path: "b.js", content: "cleanup(); TeamDelete(team_name);\n" }] }));

// 3) EXEMPT — a historical mention ("removed in v2.1.178") must pass.
h.pass("historical 'TeamCreate/TeamDelete were removed in v2.1.178' is exempt", () =>
  evaluate({
    files: [
      {
        path: "doc.md",
        content: "Note: TeamCreate/TeamDelete were removed in v2.1.178; use Agent spawn.\n",
      },
    ],
  }));

// 4) EXEMPT — a descriptive 'surrogate for TeamDelete' line must pass.
h.pass("'the Node-side surrogate for TeamDelete' is exempt (surrogate marker)", () =>
  evaluate({
    files: [
      { path: "notes.md", content: "We kept the Node-side surrogate for TeamDelete() during migration.\n" },
    ],
  }));

// 5) PASS — no team-tool reference at all.
h.pass("a file with no team-tool reference passes", () =>
  evaluate({ files: [{ path: "c.js", content: "const x = 1;\nfunction f(){ return x; }\n" }] }));

// 6) PASS — the clean migrated directive (Agent spawn) passes.
h.pass("the clean migrated Agent(run_in_background:true) directive passes", () =>
  evaluate({
    files: [
      {
        path: "mode.md",
        content: 'Spawn: Agent(subagent_type:"epsilon", run_in_background:true, name:"Epsilon")\n',
      },
    ],
  }));

h.done();
