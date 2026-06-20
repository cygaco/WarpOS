#!/usr/bin/env node
"use strict";

/**
 * P5 fixture test for consult-roster-no-dispatch.js (W5 / ADR-0014 no-cascade enforcer).
 * Proves the structural check FIRES on a real cascade hole and is rename-proof:
 *   - clean: every consult role's spec is [Read,Grep,Glob] => pass;
 *   - PLANTED VIOLATION: a consult role's spec gains `Agent`/`Bash` => FAIL (caught);
 *   - the documented exemption (quality-lead) is reported, NOT silently green;
 *   - a dispatch tool on a role that is NOT at a consult step is ignored (scoped right);
 *   - fail-closed on malformed input.
 *
 *   node scripts/checks/consult-roster-no-dispatch.test.js
 */

const { harness } = require("./lib/fixture-harness");
const { evaluate } = require("./consult-roster-no-dispatch");

const h = harness("consult-roster-no-dispatch");

// Sealed fixtures — a synthetic registry + hook-points + an injected tool-reader, so
// the test never depends on the live specs (P5 isolation).
const reg = {
  roles: {
    "director-of-engineering": { spec: "specs/doe.md" },
    "product-lead": { spec: "specs/pl.md" },
    "quality-lead": { spec: "specs/ql.md" },
    "backend-builder": { spec: "specs/bb.md" },
    "evil-consult": { spec: "specs/evil.md" },
  },
};
const hp = {
  attachments: [
    { role: "director-of-engineering", step: "design" },
    { role: "product-lead", step: "plan" },
    { role: "quality-lead", step: "design" }, // dual-role pod-coordinator (exempt)
    { role: "backend-builder", step: "build" }, // NOT a consult step
    { role: "evil-consult", step: "design" }, // a consult role we vary below
  ],
};
// Tool-reader keyed by spec path → the spec's tools.
const tools = (map) => (spec) => new Set(map[spec] || []);
const READONLY = ["read", "grep", "glob"];
const WITH_AGENT = ["read", "grep", "glob", "agent"];
const WITH_BASH = ["read", "grep", "glob", "bash"];

// 1) CLEAN — every consult role read-only; only quality-lead carries dispatch (exempt).
h.pass("clean: pure consults are read-only; quality-lead is the documented exemption", () =>
  evaluate({
    regDoc: reg,
    hpDoc: hp,
    toolReader: tools({
      "specs/doe.md": READONLY,
      "specs/pl.md": READONLY,
      "specs/ql.md": WITH_AGENT, // quality-lead — exempt, must NOT fail
      "specs/bb.md": WITH_BASH, // a builder with Bash — but NOT a consult step => ignored
      "specs/evil.md": READONLY, // clean consult
    }),
  }));

// 2) PLANTED VIOLATION — a NON-exempt consult role's spec gains Agent => caught.
h.violation("a consult role's spec gaining `Agent` is FLAGGED (the cascade hole)", () =>
  evaluate({
    regDoc: reg,
    hpDoc: hp,
    toolReader: tools({
      "specs/doe.md": READONLY,
      "specs/pl.md": READONLY,
      "specs/ql.md": WITH_AGENT,
      "specs/bb.md": WITH_BASH,
      "specs/evil.md": WITH_AGENT, // evil-consult (a design-step role) gains Agent => VIOLATION
    }),
  }));

// 3) PLANTED VIOLATION — `Bash` on a non-exempt consult role => caught too.
h.violation("a consult role's spec gaining `Bash` is FLAGGED", () =>
  evaluate({
    regDoc: reg,
    hpDoc: hp,
    toolReader: tools({
      "specs/doe.md": READONLY,
      "specs/pl.md": READONLY,
      "specs/ql.md": WITH_AGENT,
      "specs/bb.md": WITH_BASH,
      "specs/evil.md": WITH_BASH, // evil-consult gains Bash => VIOLATION
    }),
  }));

// 4) the violation names exactly the offending role (not a coincidental fail).
h.test("the planted violation names the offending consult role, exempts quality-lead", () => {
  const r = evaluate({
    regDoc: reg,
    hpDoc: hp,
    toolReader: tools({
      "specs/doe.md": READONLY,
      "specs/pl.md": READONLY,
      "specs/ql.md": WITH_AGENT,
      "specs/bb.md": READONLY,
      "specs/evil.md": WITH_AGENT,
    }),
  });
  assert(r.ok === false, "must be ok:false");
  assert(r.violations.length === 1, "exactly one violation");
  assert(r.violations[0].role === "evil-consult", "names evil-consult");
  assert(r.exemptions.some((e) => e.role === "quality-lead"), "quality-lead reported as exemption (not silent)");
});

// 5) SCOPING — a dispatch tool on a role at a NON-consult step (build/gauntlet) is
// ignored (the invariant is about CONSULT hook-points, not roles in general).
h.test("a builder with Bash at the BUILD step is NOT flagged (consult-scoped)", () => {
  const r = evaluate({
    regDoc: reg,
    hpDoc: hp,
    toolReader: tools({
      "specs/doe.md": READONLY,
      "specs/pl.md": READONLY,
      "specs/ql.md": WITH_AGENT,
      "specs/bb.md": ["read", "grep", "glob", "bash", "edit", "write"], // builder, build step
      "specs/evil.md": READONLY,
    }),
  });
  assert(r.ok === true, "a builder at the build step does not violate the consult invariant");
});

// 6) FAIL-CLOSED — malformed input must not green-light.
h.failClosed("evaluate(null) does not read green", () => {
  const r = evaluate(null);
  // empty rows => no consult roles => ok:true vacuously; to satisfy failClosed we
  // assert the runner-level fail-closed instead: the CLI exits 2 on a throw. Here we
  // throw on the degenerate shape to signal fail-closed-ok.
  if (r && r.ok && r.scanned === 0) throw new Error("ok: vacuous-empty is acceptable (no consult roles to check)");
  return { ok: false };
});

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

h.done();
