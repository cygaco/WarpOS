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

const fs = require("fs");
const path = require("path");
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

// 1) HONEST-RED — quality-lead's documented exemption is a KNOWN OPEN HOLE, NOT a green pass
// (lead 2026-06-20: "honest-RED beats green-with-exemption; never the latter"). With every OTHER
// consult read-only and ONLY quality-lead carrying Agent: NO new violation, but the exemption
// makes the overall result NON-clean (ok:false) while cleanOfNewViolations stays true.
h.test("honest-RED: quality-lead's exemption is a known-open-hole (ok:false, NOT green-with-exemption)", () => {
  const r = evaluate({
    regDoc: reg,
    hpDoc: hp,
    toolReader: tools({
      "specs/doe.md": READONLY,
      "specs/pl.md": READONLY,
      "specs/ql.md": WITH_AGENT, // quality-lead — exempt, but a KNOWN OPEN HOLE (ED-065)
      "specs/bb.md": WITH_BASH, // a builder with Bash — but NOT a consult step => ignored
      "specs/evil.md": READONLY, // clean consult
    }),
  });
  assert(r.ok === false, "a documented exemption must read RED (ok:false) — never green-with-exemption");
  assert(r.cleanOfNewViolations === true, "no NEW (untracked) cascade hole — only the known one");
  assert(r.violations.length === 0, "no new violations");
  assert(r.knownOpenHoles === 1, "exactly one known open hole (quality-lead)");
  assert(r.exemptions.some((e) => e.role === "quality-lead"), "quality-lead reported as the open hole (not silent)");
});

// 1b) TRULY CLEAN — when NO consult role carries any dispatch tool (not even quality-lead),
// the check is genuinely green. This is the only ok:true shape.
h.pass("truly clean: NO consult role carries a dispatch tool => ok:true (the only green)", () =>
  evaluate({
    regDoc: reg,
    hpDoc: hp,
    toolReader: tools({
      "specs/doe.md": READONLY,
      "specs/pl.md": READONLY,
      "specs/ql.md": READONLY, // even quality-lead read-only here => no open hole => green
      "specs/bb.md": WITH_BASH, // non-consult step => ignored
      "specs/evil.md": READONLY,
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
  // The builder at the BUILD step adds NO consult violation — cleanOfNewViolations stays true.
  // (Overall ok is false only because of the pre-existing quality-lead known-open-hole, which is
  // the honest-RED signal — not anything the build-step builder caused.)
  assert(r.cleanOfNewViolations === true, "a builder at the build step does not add a NEW consult violation");
  assert(r.violations.length === 0, "no consult violations from a build-step role");
});

// ── gauntlet HIGH-2: FAIL-CLOSED on an unconfirmable consult spec (missing role,
// no spec, unreadable spec, unparseable tools) — must NOT read green. Uses the REAL
// readSpecTools via the default reader (no injected toolReader) against synthetic
// registry specs that don't exist on disk.
h.violation("HIGH-2: a consult role pointing at a MISSING spec is FLAGGED (fail-closed, not green)", () =>
  evaluate({
    regDoc: { roles: { "ghost-consult": { spec: "specs/does-not-exist-xyz.md" } } },
    hpDoc: { attachments: [{ role: "ghost-consult", step: "design" }] },
    // no toolReader → uses the real readSpecTools → unreadable → determined:false
  }));
h.violation("HIGH-2: a consult role ABSENT from the registry is FLAGGED (fail-closed)", () =>
  evaluate({
    regDoc: { roles: {} },
    hpDoc: { attachments: [{ role: "unregistered-consult", step: "plan" }] },
  }));
h.violation("HIGH-2: a consult role with NO spec field is FLAGGED (fail-closed)", () =>
  evaluate({
    regDoc: { roles: { "no-spec-consult": {} } },
    hpDoc: { attachments: [{ role: "no-spec-consult", step: "design" }] },
  }));

// ── gauntlet MEDIUM: a YAML BLOCK-list tools form is parsed (the same-line regex
// missed it). Prove via the REAL readSpecTools against a sealed fixture spec.
h.test("MEDIUM: a YAML block-list `tools:` with Bash is detected (not missed)", () => {
  const { readSpecTools } = require("./consult-roster-no-dispatch");
  const fx = h.sealedDir({
    "block.md": "---\nname: x\ntools:\n  - Read\n  - Grep\n  - Bash\n---\n# body\n",
    "inline.md": "---\nname: y\ntools: [Read, Grep, Glob]\n---\n# body\n",
  });
  try {
    const block = readSpecTools(fx.file("block.md"));
    assert(block.determined === true, "block form is determined");
    assert(block.tools.has("bash"), "block-list Bash is detected (MEDIUM fix)");
    const inline = readSpecTools(fx.file("inline.md"));
    assert(inline.determined === true && inline.tools.has("glob") && !inline.tools.has("bash"), "inline bracket form parses");
  } finally {
    fx.cleanup();
  }
});

// ── gauntlet r2 MEDIUM (frontmatter-bounding): a BODY/prose `tools:` line must NOT be
// read as the role's grant — only the YAML frontmatter block counts.
h.test("r2-MEDIUM: a body-prose `tools: Bash` line is IGNORED; only frontmatter tools count", () => {
  const { readSpecTools } = require("./consult-roster-no-dispatch");
  const fx = h.sealedDir({
    "bodytools.md": "---\nname: x\ntools: [Read, Grep, Glob]\n---\n# body\nYou may use tools: Bash and Agent when running checks.\n",
    "fmbash.md": "---\nname: y\ntools: [Read, Grep, Bash]\n---\n# body, no tools line\n",
  });
  try {
    const body = readSpecTools(fx.file("bodytools.md"));
    assert(body.determined === true, "frontmatter present → determined");
    assert(!body.tools.has("bash") && !body.tools.has("agent"), "the BODY tools: Bash/Agent line is NOT read (frontmatter-bounded)");
    const fmbash = readSpecTools(fx.file("fmbash.md"));
    assert(fmbash.tools.has("bash"), "a Bash IN the frontmatter IS read");
  } finally {
    fx.cleanup();
  }
});
// ── gauntlet r3 MEDIUM: an UNFENCED spec (no leading ---...---) with only a body
// `tools:` line must NOT be read as determined (the fallback-to-body defect). It
// stays determined:false → fail-closed at evaluate.
h.test("r3-MEDIUM: an UNFENCED spec with a body `tools:` line is UNCONFIRMABLE (fail-closed), not false-clean", () => {
  const { readSpecTools } = require("./consult-roster-no-dispatch");
  const fx = h.sealedDir({
    "nofm.md": "# A spec with NO frontmatter fence\nSome prose. tools: Read, Grep — but this is the BODY.\n",
    "agentslist.md": "# spec\n(Tools: Read, Grep, Glob)\n", // the distinct agents-list form IS still read (whole file)
  });
  try {
    const nofm = readSpecTools(fx.file("nofm.md"));
    assert(nofm.determined === false, "an unfenced body `tools:` line is NOT a confirmable grant (fail-closed)");
    // and that role, run through evaluate, is a VIOLATION (fail-closed), not clean:
    const r = evaluate({
      regDoc: { roles: { "nofm-consult": { spec: fx.file("nofm.md") } } },
      hpDoc: { attachments: [{ role: "nofm-consult", step: "design" }] },
    });
    assert(r.ok === false, "an unconfirmable unfenced spec at a consult step => violation (fail-closed)");
    // the distinct (Tools: ...) agents-list form is still read from the whole file:
    const al = readSpecTools(fx.file("agentslist.md"));
    assert(al.determined === true && al.tools.has("read") && !al.tools.has("bash"), "the (Tools:) agents-list form parses (whole-file)");
  } finally {
    fx.cleanup();
  }
});

// ── gauntlet MEDIUM (setHas): token EQUALITY, not substring — a tool named "subagent"
// (contains "agent") must NOT be read as the Agent dispatch tool.
h.pass("MEDIUM: a consult role with a tool CONTAINING 'agent' (e.g. 'subagent') is NOT flagged (token equality)", () =>
  evaluate({
    regDoc: { roles: { "sub-consult": { spec: "specs/sc.md" } } },
    hpDoc: { attachments: [{ role: "sub-consult", step: "design" }] },
    toolReader: () => new Set(["read", "grep", "glob", "subagent"]), // 'subagent' must NOT match 'agent'
  }));
// ── gauntlet MEDIUM (`*`): a `tools: *` catch-all grant on a consult role is UNSAFE
// (it includes Bash/Agent) → must be FLAGGED.
h.violation("MEDIUM: a consult role with a `*` catch-all tool-set is FLAGGED (includes Bash/Agent)", () =>
  evaluate({
    regDoc: { roles: { "star-consult": { spec: "specs/star.md" } } },
    hpDoc: { attachments: [{ role: "star-consult", step: "design" }] },
    toolReader: () => new Set(["*"]),
  }));

// FAIL-CLOSED (backend-reviewer HIGH — the prior `evaluate(null)`-throws test was
// THEATER: the harness counts a manual throw as success, proving only that the test
// can throw, not that the ENFORCER fails closed). REAL test: invoke the enforcer's
// CLI as a subprocess with the project root pointed at a dir that has NO registry, so
// run() throws on the readFileSync — and assert the CLI exits 2 (fail-closed integrity),
// NOT 0. This exercises the actual require.main fail-closed path.
h.test("FAIL-CLOSED: the CLI exits 2 (not 0) when run() can't read the registry [real, not theater]", () => {
  const { spawnSync } = require("child_process");
  const os = require("os");
  const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), "no-registry-"));
  try {
    const r = spawnSync(process.execPath, [path.join(__dirname, "consult-roster-no-dispatch.js"), "--json"], {
      env: { ...process.env, CLAUDE_PROJECT_DIR: emptyRoot },
      encoding: "utf8",
      timeout: 15000,
    });
    assert(r.status === 2, `expected fail-closed exit 2, got ${r.status} (a scanner that can't read its inputs must NOT exit 0/green)`);
    const out = JSON.parse(r.stdout || "{}");
    assert(out.ok === false, "fail-closed JSON must report ok:false");
  } finally {
    fs.rmSync(emptyRoot, { recursive: true, force: true });
  }
});
// And the pure core, given an EMPTY hook-points doc, is vacuously clean (no consult
// roles to check) — that is correct, NOT a fail-closed case; the fail-closed concern is
// an UNCONFIRMABLE role (covered by the HIGH-2 violation tests above), not zero roles.
h.pass("evaluate with no consult roles is vacuously clean (zero roles ≠ a hole)", () =>
  evaluate({ regDoc: { roles: {} }, hpDoc: { attachments: [] } }));

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

h.done();
