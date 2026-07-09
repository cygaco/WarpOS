You are a backend/code-quality reviewer RE-REVIEWING the W5 enforcer + docs after a fix-cycle. Your prior review FAILed with 2 HIGH + 3 MEDIUM. Verify each is fixed + check for new defects. BINDING verdict PASS or FAIL.

PRIOR FINDINGS (verify):
- HIGH (missing/unreadable specs + missing registry roles false-pass): FIX = readSpecTools returns {tools, determined}; evaluate FAILS-CLOSED on determined:false (+ on an absent registry entry). Verify.
- HIGH (the fail-closed TEST was theater — a manual throw counted as success): FIX = the test now invokes the CLI as a subprocess with CLAUDE_PROJECT_DIR pointed at an empty dir and asserts exit 2 (real fail-closed). Verify it exercises the actual enforcer, not a wrapper throw.
- MEDIUM (parser): FIX = YAML block-list parse + token-equality setHas + tools:* unsafe. Verify.
- MEDIUM (docs over-credit dispatch-route-guard as the no-deep-cascade check): FIX = epsilon.md + dispatch-contract.json :196/:219 now credit the STRUCTURAL consult-roster-no-dispatch.js as the guarantee, route-guard as a backstop. Verify the wording is accurate.
- MEDIUM (sprint/full.md:116 stale roster — said product-lead/design-lead are in-process Agent calls + req-reviewer): FIX = corrected to GPT-leads-via-subprocess + Claude-roles-in-process + req-reviewer→qa-reviewer. Verify.

Check for new defects in the hardened enforcer code. Output VERDICT: PASS or FAIL + findings.

=== FILE: scripts/checks/consult-roster-no-dispatch.js ===
#!/usr/bin/env node
"use strict";

/**
 * consult-roster-no-dispatch.js — the no-deep-cascade enforcer (E-DISPATCH-PERFECT-001
 * W5 / ADR-0014). The DoD "enforced" item: when ε summons the in-process roster
 * directly (in any spawn context, per ADR-0014), the **spawn-hand stays with the
 * conductor** — a summoned roster CONSULT must NOT be able to dispatch the build chain
 * or cascade further. ε remains the SOLE builder-dispatcher.
 *
 * WHY A STRUCTURAL CHECK, NOT A HOOK (DoE judgment): the dispatch-route-guard PreToolUse
 * hook sees a SINGLE tool call with NO lineage/depth signal, so it cannot distinguish
 * ε's legitimate first-hop summon from a roster member's forbidden second-hop cascade
 * (both are identical single events). The REAL enforcement is STRUCTURAL: a role that
 * is summoned at a CONSULT/author hook-point (sprint step ∈ {plan, design}) must carry
 * a NO-DISPATCH tool-set (no `Bash`, no `Agent`) in its agent spec — then it CANNOT
 * dispatch, by construction, regardless of what its prompt says. The hook's existing
 * in-process-build-chain block is the runtime backstop.
 *
 * WHAT IT FIRES ON (β: "fires, not key-only" — rename-proof): the role's ACTUAL spec
 * frontmatter `tools:` (read from the .md the role-registry `spec` points at), JOINED
 * with the consult hook-points (sprint-hook-points.json × role-registry.json) — NOT a
 * hand-maintained role list a rename could no-op past. A consult role whose real spec
 * lists `Bash`/`Agent` is a violation.
 *
 * THE KNOWN RESIDUAL (β honesty floor — do NOT let it read green silently): `quality-lead`
 * is summoned at the `design` consult step AND carries `[Read,Grep,Glob,Bash,Agent]`
 * (its OTHER job is pod-coordination — fanning out qa-reviewers/design-quality/test-runner
 * to GATHER EVIDENCE, a sanctioned one-hop dispatch). One spec can't be tool-restricted
 * per-hook-point, so its design-consult use is trusted-read-only via the scopeContract
 * (writes-nothing). This is recorded as an EXPLICIT, ED-debt-tracked exemption (ED-065)
 * and REPORTED as a known-exemption line — NOT silently passed. A future-proof one-hop
 * reviewer-dispatch assertion (a summoned pod-coordinator may dispatch ONLY its own
 * pod's reviewers) is the ED-065 follow-up.
 *
 * EXIT: 0 = clean (only the documented exemption present), 1 = a NEW pure-consult role
 * gained a dispatch tool, 2 = runner error (FAIL-CLOSED — a scanner that errors must
 * NOT read green). `--json` for machine output.
 *
 *   node scripts/checks/consult-roster-no-dispatch.js [--json]
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "consult-roster-no-dispatch";

// Consult/author lifecycle steps — a role summoned here is a READ-ONLY advisor.
const CONSULT_STEPS = new Set(["plan", "design"]);
// Dispatch-capable tools — their presence in a consult role's spec = a cascade hole.
const DISPATCH_TOOLS = ["bash", "agent"];
// The ONE documented dual-role exemption (β honesty floor + ED-065). quality-lead's
// design-consult is trusted-read-only (scopeContract); its dispatch tools serve its
// gauntlet pod-coordination. Keyed by EXACT role id — a different role gaining a
// dispatch tool is NOT exempt and fails the gate.
const KNOWN_EXEMPTIONS = new Map([
  // quality-lead is a dual-role pod-coordinator: summoned at the design CONSULT step to
  // author qa-plan/AC-coverage (read-only), it ALSO fans out qa-reviewer/design-quality/
  // visual-review/test-runner via the Agent tool to GATHER EVIDENCE (a sanctioned one-hop
  // pod dispatch the registry lists). W5/gauntlet HIGH-1 fix: `Bash` was REMOVED from its
  // spec (over-granted drift — the registry already had tools:["Agent"], and its body
  // never used Bash), which CLOSES the Bash→dispatch-claude.js cascade route the reviewer
  // found. It keeps ONLY `Agent`, bounded by the dispatch-route-guard in-process
  // build-chain block (it cannot Agent-spawn a builder) — its one-hop is to leaf
  // reviewers. The residual (a precise one-hop-reviewer-only assertion vs this exemption)
  // is ED-065.
  ["quality-lead", "ED-065: dual-role pod-coordinator — design-consult is read-only; retains ONLY Agent (Bash removed, gauntlet HIGH-1) for its sanctioned one-hop fan-out to leaf reviewers (bounded by the dispatch-route-guard in-process build-chain block). Follow-up: a precise one-hop-reviewer-only assertion."],
]);

/** Read a role's ACTUAL spec frontmatter `tools:` as a lowercased token set. Returns
 *  `{ tools:Set, determined:boolean, source, specPath }`. SECURITY (gauntlet HIGH-2 +
 *  MEDIUM): `determined` is FALSE when the tool-set cannot be CONFIRMED — no spec path,
 *  unreadable spec, or no parseable `tools` declaration. The caller FAILS CLOSED on
 *  `determined:false` (an unconfirmable consult role is a violation, never silently
 *  clean — a renamed/moved spec must not read green). Parses three forms: the inline
 *  `tools: Read, Grep, Glob`, an inline bracket `tools: [Read, Grep]`, AND a YAML BLOCK
 *  list (`tools:\n  - Read\n  - Bash`) — the MEDIUM form the same-line regex missed. */
function readSpecTools(specRel) {
  const out = { tools: new Set(), determined: false, source: "none", specPath: specRel };
  if (!specRel) return out; // no spec → can't confirm → fail-closed at the caller
  const abs = path.isAbsolute(specRel) ? specRel : path.join(ROOT, specRel);
  let txt;
  try {
    txt = fs.readFileSync(abs, "utf8");
  } catch {
    return out; // unreadable → determined:false → fail-closed
  }
  const addTokens = (s) => {
    for (const t of String(s).split(/[,\s]+/)) {
      const tok = t.trim().toLowerCase().replace(/[\[\]"'`]/g, "");
      if (tok && tok !== "-") out.tools.add(tok);
    }
  };
  // Form 1+2: an inline `tools:` line (bare CSV OR `[ ... ]`).
  let m = txt.match(/^tools:[ \t]*(\S.*)$/m);
  if (m && m[1].trim()) {
    out.source = "frontmatter-inline";
    out.determined = true;
    addTokens(m[1]);
    return out;
  }
  // Form 3 (MEDIUM): a YAML BLOCK list — `tools:` on its own line, then `  - Item` rows.
  const block = txt.match(/^tools:[ \t]*\r?\n((?:[ \t]*-[ \t]*\S+[ \t]*\r?\n?)+)/m);
  if (block) {
    out.source = "frontmatter-block";
    out.determined = true;
    for (const line of block[1].split(/\r?\n/)) {
      const im = line.match(/^[ \t]*-[ \t]*(.+?)[ \t]*$/);
      if (im) addTokens(im[1]);
    }
    return out;
  }
  // Fallback: the parenthetical `(Tools: Read, Grep, ...)` form some specs/agents-lists use.
  m = txt.match(/\(Tools:\s*([^)]+)\)/i);
  if (m) {
    out.source = "agents-list";
    out.determined = true;
    addTokens(m[1]);
    return out;
  }
  return out; // no parseable tools declaration → determined:false → fail-closed
}

/** PURE CORE: given the registry + hook-points docs, return the consult roles whose
 *  spec carries a dispatch tool, split into { violations, exemptions, scanned }.
 *  Injectable (regDoc, hpDoc, toolReader) for the P5 sealed-fixture test. */
function evaluate(input) {
  const regDoc = (input && input.regDoc) || {};
  const hpDoc = (input && input.hpDoc) || {};
  // The default reader returns the FULL {tools, determined} shape; a test may inject a
  // reader that returns either {tools, determined} OR a bare Set (back-compat).
  const toolReader = (input && input.toolReader) || ((spec) => readSpecTools(spec));

  const roles = regDoc.roles || regDoc;
  const rows = hpDoc.attachments || hpDoc.rows || hpDoc.hook_points || (Array.isArray(hpDoc) ? hpDoc : []);

  // The consult-summonable role ids: any role attached at a CONSULT step.
  const consultRoles = new Set();
  for (const r of Array.isArray(rows) ? rows : []) {
    if (r && r.role && CONSULT_STEPS.has(r.step)) consultRoles.add(r.role);
  }

  const violations = [];
  const exemptions = [];
  let scanned = 0;
  for (const roleId of consultRoles) {
    scanned++;
    const entry = roles[roleId];
    const spec = entry && entry.spec;
    const read = toolReader(spec, roleId);
    // Normalize the reader result to { tools:Set, determined:boolean }.
    const tools = read instanceof Set ? read : (read && read.tools) || new Set();
    const determined = read instanceof Set ? true : !!(read && read.determined);

    // HIGH-2 FAIL-CLOSED: a consult role whose tool-set CANNOT be confirmed (missing from
    // the registry, no spec, unreadable spec, or no parseable `tools` declaration) is a
    // VIOLATION — never silently clean. A renamed/moved spec must read RED, not green.
    if (!entry) {
      violations.push({ role: roleId, tools: ["<unknown-role>"], spec: "(absent from role-registry)", detail: `consult-summonable role '${roleId}' is at a plan/design hook-point but absent from role-registry.json — cannot confirm its tool-set; fail-closed.` });
      continue;
    }
    if (!determined) {
      violations.push({ role: roleId, tools: ["<unconfirmable>"], spec: spec || "(no spec in registry)", detail: `consult-summonable role '${roleId}' has no confirmable tools declaration (missing/unreadable spec, or an unparseable tools field at '${spec || "<none>"}') — cannot prove it carries no dispatch tool; fail-closed (a renamed/moved spec must not read green).` });
      continue;
    }

    const dispatchTools = DISPATCH_TOOLS.filter((t) => setHas(tools, t));
    if (dispatchTools.length === 0) continue; // confirmed clean — no dispatch capability
    if (KNOWN_EXEMPTIONS.has(roleId)) {
      exemptions.push({ role: roleId, tools: dispatchTools, reason: KNOWN_EXEMPTIONS.get(roleId) });
    } else {
      violations.push({
        role: roleId,
        tools: dispatchTools,
        spec: spec || "(no spec in registry)",
        detail:
          `consult-summonable role '${roleId}' (at a plan/design hook-point) carries dispatch tool(s) ` +
          `[${dispatchTools.join(", ")}] — a summoned consult must NOT be able to dispatch the build ` +
          `chain or cascade (ADR-0014 spawn-hand-stays-with-conductor). Remove Bash/Agent from its spec, ` +
          `or (if it is a genuine dual-role pod-coordinator) add an explicit KNOWN_EXEMPTIONS entry + ED debt.`,
      });
    }
  }
  return { ok: violations.length === 0, violations, exemptions, scanned };
}

function setHas(set, v) {
  // TOKEN EQUALITY (gauntlet MEDIUM): never substring — a token like "subagent" must
  // NOT match "agent". Accept a Set OR an array of tokens; compare each token EXACTLY.
  // A `*` (catch-all) token is treated as HAVING the dispatch tool (unsafe for a consult
  // role — a `tools: *` grant includes Bash/Agent, so it must fail the gate).
  const tokens = set instanceof Set ? [...set] : Array.isArray(set) ? set : [];
  for (const t of tokens) {
    const tok = String(t).toLowerCase();
    if (tok === v) return true;
    if (tok === "*") return true; // catch-all grant = has every tool incl. Bash/Agent
  }
  return false;
}

function run() {
  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, ".claude/agents/_org/role-registry.json"), "utf8"));
  const hp = JSON.parse(fs.readFileSync(path.join(ROOT, ".claude/agents/_org/sprint-hook-points.json"), "utf8"));
  return evaluate({ regDoc: reg, hpDoc: hp });
}

module.exports = { evaluate, readSpecTools };

if (require.main === module) {
  const JSON_OUT = process.argv.includes("--json");
  let res;
  try {
    res = run();
  } catch (e) {
    // FAIL-CLOSED (BC-16): a scanner that errors must NOT read green.
    const msg = e && e.message ? e.message : e;
    if (JSON_OUT) console.log(JSON.stringify({ check: NAME, ok: false, error: String(msg) }));
    else console.error(`[${NAME}] runner error (fail-closed): ${msg}`);
    process.exit(2);
  }
  if (JSON_OUT) {
    console.log(JSON.stringify({ check: NAME, ...res }));
  } else if (res.ok) {
    console.log(
      `OK   [${NAME}] no consult-summonable role carries a dispatch tool ` +
        `(${res.scanned} consult role(s) scanned; ${res.exemptions.length} documented exemption(s))`,
    );
    for (const ex of res.exemptions) {
      console.log(`  ~ EXEMPT ${ex.role} [${ex.tools.join(", ")}] — ${ex.reason}`);
    }
  } else {
    console.error(`FAIL [${NAME}] ${res.violations.length} consult-summonable role(s) carry a dispatch tool (cascade hole):`);
    for (const v of res.violations) console.error(`  - ${v.role} [${v.tools.join(", ")}] (${v.spec})\n      ${v.detail}`);
    for (const ex of res.exemptions) console.error(`  ~ EXEMPT ${ex.role} [${ex.tools.join(", ")}] — ${ex.reason}`);
  }
  process.exit(res.ok ? 0 : 1);
}

=== FILE: scripts/checks/consult-roster-no-dispatch.test.js ===
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
=== DIFF: the doc/contract fixes vs the prior fix-cycle commit ===
diff --git a/.claude/agents/_org/dispatch-contract.json b/.claude/agents/_org/dispatch-contract.json
index 7a8ce36c..ac0ec2fb 100644
--- a/.claude/agents/_org/dispatch-contract.json
+++ b/.claude/agents/_org/dispatch-contract.json
@@ -193,7 +193,7 @@
 
   "role_overrides": {
     "_doc": "Per-role exceptions merged LAST (defaults <- class <- override). Empty by design — exceptions are a smell; prefer fixing the class derivation. Documented carve-outs only.",
-    "epsilon": { "allowed_shapes": ["inline"], "_note": "ε is the sprint conductor: runs inline as the session; its own shape is inline. The in-process roster (`in-process-agent`: managers/leads/design-quality/visual-review) is summonable directly by the ε CONDUCTOR in ANY spawn context — top-level (α wearing the ε face) OR a teammate-spawned ε — via the harness Agent tool, each spawn supplying a `scopeContract` (the scope-contract-guard is the real gate). ED-041 ('Agent unavailable inside subagents') is RETIRED as a per-spec misstatement: a Claude subagent HAS the Agent tool iff its spec lists it, and ε's does (ADR-0014; re-verified 2026-06-18 + live-confirmed by the E-TEAMS-MIGRATION-001 teammate-ε). The spawn-hand stays with the conductor — a summoned roster member must NOT dispatch the build chain or cascade further (dispatch-route-guard no-deep-cascade check). A node SCRIPT still cannot call Agent (the ε runtime returns `requires-orchestrator` to hand that spawn to the ε-agent); ε also drives the CLI-routable roster (subprocess-claude builders via dispatch-claude.js, subprocess-cross-provider reviewers via dispatch-agent.js)." }
+    "epsilon": { "allowed_shapes": ["inline"], "_note": "ε is the sprint conductor: runs inline as the session; its own shape is inline. The in-process roster (`in-process-agent`: managers/leads/design-quality/visual-review) is summonable directly by the ε CONDUCTOR in ANY spawn context — top-level (α wearing the ε face) OR a teammate-spawned ε — via the harness Agent tool, each spawn supplying a `scopeContract` (the scope-contract-guard is the real gate). ED-041 ('Agent unavailable inside subagents') is RETIRED as a per-spec misstatement: a Claude subagent HAS the Agent tool iff its spec lists it, and ε's does (ADR-0014; re-verified 2026-06-18 + live-confirmed by the E-TEAMS-MIGRATION-001 teammate-ε). The spawn-hand stays with the conductor — a summoned roster member must NOT dispatch the build chain or cascade further, guaranteed STRUCTURALLY by scripts/checks/consult-roster-no-dispatch.js (a consult role's spec carries no Bash/Agent, so it can't dispatch by construction; the dispatch-route-guard in-process build-chain block is a narrow backstop). A node SCRIPT still cannot call Agent (the ε runtime returns `requires-orchestrator` to hand that spawn to the ε-agent); ε also drives the CLI-routable roster (subprocess-claude builders via dispatch-claude.js, subprocess-cross-provider reviewers via dispatch-agent.js)." }
   },
 
   "mode_profiles": {
@@ -216,7 +216,7 @@
         "manager": ["in-process-agent"]
       },
       "alpha_only_shapes": [],
-      "_alpha_only_note": "ADR-0014: NO shape is α-only. The `in-process-agent` shape (managers/leads/design-quality/visual-review) is summonable by the ε CONDUCTOR in ANY spawn context — top-level (α wearing the ε face) OR a teammate-spawned ε — via the harness Agent tool, each spawn supplying a `scopeContract`. The prior α-only overlay (added in 975ed5c) encoded ED-041 as a doctrine; ED-041 is RETIRED as a per-spec misstatement (a Claude subagent has the Agent tool iff its spec lists it; ε's does — re-verified 2026-06-18 + live-confirmed by the E-TEAMS-MIGRATION-001 teammate-ε). The array is kept (empty) rather than removed so a reversal is a one-line re-add (ADR-0014 reversal plan). The real gate on a roster spawn is the scope-contract-guard (scopeContract required, fail-closed); the spawn-hand stays with the conductor — a summoned roster consult MUST NOT dispatch the build chain or cascade (the dispatch-route-guard no-deep-cascade check; ε remains the sole builder-dispatcher). CARVE-OUT: a non-Claude orchestrator (Codex) has NO harness Agent tool at all — not because of ED-041, but because it is not a Claude-harness agent — so it uses CLI routes only. This annotation does NOT narrow class_shapes."
+      "_alpha_only_note": "ADR-0014: NO shape is α-only. The `in-process-agent` shape (managers/leads/design-quality/visual-review) is summonable by the ε CONDUCTOR in ANY spawn context — top-level (α wearing the ε face) OR a teammate-spawned ε — via the harness Agent tool, each spawn supplying a `scopeContract`. The prior α-only overlay (added in 975ed5c) encoded ED-041 as a doctrine; ED-041 is RETIRED as a per-spec misstatement (a Claude subagent has the Agent tool iff its spec lists it; ε's does — re-verified 2026-06-18 + live-confirmed by the E-TEAMS-MIGRATION-001 teammate-ε). The array is kept (empty) rather than removed so a reversal is a one-line re-add (ADR-0014 reversal plan). The real gate on a roster spawn is the scope-contract-guard (scopeContract required, fail-closed); the spawn-hand stays with the conductor — a summoned roster consult MUST NOT dispatch the build chain or cascade (guaranteed STRUCTURALLY by scripts/checks/consult-roster-no-dispatch.js — a consult role's spec carries no Bash/Agent; the dispatch-route-guard in-process build-chain block is a narrow backstop; ε remains the sole builder-dispatcher). CARVE-OUT: a non-Claude orchestrator (Codex) has NO harness Agent tool at all — not because of ED-041, but because it is not a Claude-harness agent — so it uses CLI routes only. This annotation does NOT narrow class_shapes."
     },
     "oneshot": {
       "_doc": "δ standalone skeleton build. Build-chain via subprocess-claude (isolated worktree); no cross-provider reviewers required for a skeleton run.",
diff --git a/.claude/agents/president/epsilon.md b/.claude/agents/president/epsilon.md
index 03baf54a..acdb7205 100644
--- a/.claude/agents/president/epsilon.md
+++ b/.claude/agents/president/epsilon.md
@@ -144,7 +144,7 @@ The `in-process-agent` shape (managers/leads/design-quality/visual-review) is **
 emptied `mode_profiles.sprint.alpha_only_shapes`). The ε conductor summons it directly **in either
 context**, each spawn supplying a `scopeContract` (the `scope-contract-guard` is the real gate,
 fail-closed without one). The **spawn-hand stays with the conductor**: a summoned roster member must
-NOT dispatch the build chain or cascade further (the `dispatch-route-guard` no-deep-cascade check; ε
+NOT dispatch the build chain or cascade further (the STRUCTURAL `scripts/checks/consult-roster-no-dispatch.js` enforcer — a consult role's spec carries no Bash/Agent — is the guarantee; the `dispatch-route-guard` in-process build-chain block is a narrow backstop; ε
 remains the sole builder-dispatcher). A node SCRIPT still cannot call Agent — the ε runtime returns
 `spawned:false, reason:requires-orchestrator`, which is the hand-off to **the ε-agent** (you), not to
 α. (ADR-0014, operator-authorized 2026-06-19; supersedes the 2026-06-09 α-only ratification.)
@@ -180,7 +180,7 @@ Observed as a 25-minute stall ×3 (WG-6). Enforcer: `scripts/checks/epsilon-live
 - Cross-provider (reviewers, security): `node scripts/dispatch-agent.js <role> <prompt-file>` with inline pre-fetch of all files the agent's prompt references (codex/gemini CLIs pipe stdin; they cannot follow relative file paths).
 - Visual judgment roles (design-quality, visual-review): Agent tool dispatch (multimodal; Claude-pinned; exempt from canonical-Bash rule).
 - Non-build Claude roles (test-runner): raw `claude -p --agent <role> < "$PROMPT_FILE"` is allowed.
-- **In-process roster (managers/leads/directors `claude-agent`; `design-quality`/`visual-review` `agent-tool`):** the node runtime CANNOT spawn these — it returns `requires-orchestrator` (a node SCRIPT can't call Agent). YOU (the ε-agent, top-level OR teammate — ADR-0014) dispatch each via `Agent(subagent_type:<role>, …)` **supplying a `scopeContract`** (an `allowedFiles`/`forbiddenFiles` block on the prompt — the `scope-contract-guard` fails closed without one; for a READ-ONLY consult, a non-empty `forbiddenFiles` signals writes-nothing). The spawn-hand stays with you: a summoned roster consult must NOT dispatch the build chain (the `dispatch-route-guard` no-deep-cascade check; ε is the sole builder-dispatcher). Capture the returned envelope to a file, then write the completion record: `node scripts/sprint/epsilon-runtime.js record-inprocess --sprint <id> --role <role> --step <step> --evidence <file> [--elapsed-ms <n>]`. The record's `ok` is DERIVED FROM the real Agent-return bytes (0-byte → `ok:false`; no evidence file → REFUSED) — the SAME `ok:true` liveness `gauntlet-verify` reads, so an in-process reviewer lane is gated exactly like a CLI lane. **NEVER write the record without the Agent's real return** — there is no `ok:true` without a real spawn behind it (the operator-caught fake-green; ADR-0009 Increment B).
+- **In-process roster (managers/leads/directors `claude-agent`; `design-quality`/`visual-review` `agent-tool`):** the node runtime CANNOT spawn these — it returns `requires-orchestrator` (a node SCRIPT can't call Agent). YOU (the ε-agent, top-level OR teammate — ADR-0014) dispatch each via `Agent(subagent_type:<role>, …)` **supplying a `scopeContract`** (an `allowedFiles`/`forbiddenFiles` block on the prompt — the `scope-contract-guard` fails closed without one; for a READ-ONLY consult, a non-empty `forbiddenFiles` signals writes-nothing). The spawn-hand stays with you: a summoned roster consult must NOT dispatch the build chain — guaranteed STRUCTURALLY by `scripts/checks/consult-roster-no-dispatch.js` (a consult role's spec carries no Bash/Agent, so it can't dispatch by construction), with the `dispatch-route-guard` in-process build-chain block as a narrow backstop; ε is the sole builder-dispatcher. Capture the returned envelope to a file, then write the completion record: `node scripts/sprint/epsilon-runtime.js record-inprocess --sprint <id> --role <role> --step <step> --evidence <file> [--elapsed-ms <n>]`. The record's `ok` is DERIVED FROM the real Agent-return bytes (0-byte → `ok:false`; no evidence file → REFUSED) — the SAME `ok:true` liveness `gauntlet-verify` reads, so an in-process reviewer lane is gated exactly like a CLI lane. **NEVER write the record without the Agent's real return** — there is no `ok:true` without a real spawn behind it (the operator-caught fake-green; ADR-0009 Increment B).
 
 Parse every result via `scripts/hooks/lib/providers.js#parseProviderJson`. Verify output is non-zero bytes and exit was 0 before advancing.
 
diff --git a/.claude/commands/sprint/full.md b/.claude/commands/sprint/full.md
index 0a3f3fd5..6b00b61f 100644
--- a/.claude/commands/sprint/full.md
+++ b/.claude/commands/sprint/full.md
@@ -113,8 +113,12 @@ events to `paths.eventsFile`.
 **When ε-conduct is active** (`epsilonDispatch: true` — the default in sprint sessions, see above),
 Phase 2 routes through ε's hook-point roster rather than a bare scaffold call:
 
-- ε dispatches in-process Agent-tool calls for the design roster (product-lead, design-lead,
-  req-reviewer, and per-phase peers listed in `epsilon.md`'s hook-point registry).
+- ε dispatches the design roster by each role's REGISTRY-DERIVED route, not a single shape: the
+  GPT roles (product-lead, design-lead — `provider: openai`) go via **subprocess** (`dispatch-agent.js`,
+  the `cross_provider_consult_lead` class), while the Claude roles (the directors, `design-quality`)
+  go **in-process via the Agent tool**. (`req-reviewer` no longer exists — it was absorbed into
+  `qa-reviewer`, summoned at the gauntlet, not design.) The per-step set is `epsilon.md`'s hook-point
+  registry.
 - **Agent-tool capability (ADR-0014):** ε — top-level OR teammate-spawned — CAN call the Agent tool
   and summon the in-process roster directly, each spawn supplying a `scopeContract`. The Agent tool
   is a per-spec capability (ε's spec lists it); ADR-0014 retired the old ED-041 "α-only" constraint
=== END ===
