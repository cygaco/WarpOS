#!/usr/bin/env node
"use strict";

/**
 * consult-roster-no-dispatch.js — the consult-roster no-dispatch enforcer
 * (E-DISPATCH-PERFECT-001 W5 / ADR-0014). The DoD "enforced" item, SCOPED to exactly
 * what a tool-set check can structurally guarantee (β arbitration 2026-06-19): when ε
 * summons the in-process roster directly (any spawn context, per ADR-0014), a role
 * summoned at a CONSULT/author hook-point CANNOT dispatch the build chain BY
 * CONSTRUCTION — its spec carries no Bash/Agent. ε remains the SOLE builder-dispatcher.
 *
 * SCOPE / known residual (β honesty floor — NOT a blanket "no-cascade"): this closes the
 * DIRECT consult→dispatch route. It does NOT close a deeper `lead→reviewer→Bash→
 * dispatch-claude.js builder` cascade — the one documented exemption `quality-lead`
 * retains Agent for its sanctioned one-hop fan-out to leaf reviewers, and reviewers
 * carry Bash BY DESIGN (they run checks). That two-hop reviewer→builder cascade is a
 * PRE-EXISTING reviewer-tool-set property W5 did not introduce; closing it needs a
 * lineage-aware one-hop-reviewer-only assertion (tracked: ED-065). The PreToolUse
 * dispatch-route-guard is a narrow backstop only (it has no spawn lineage — see below).
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
  let raw;
  try {
    raw = fs.readFileSync(abs, "utf8");
  } catch {
    return out; // unreadable → determined:false → fail-closed
  }
  // FRONTMATTER-BOUNDING (gauntlet r2 MEDIUM): parse `tools:` ONLY within the leading
  // YAML frontmatter block (between the first `---` fence pair), so a BODY/prose line
  // like "tools: you may use Bash" can't be read as the role's tool grant. If there is
  // no frontmatter fence, fall back to scanning the head of the file (the `(Tools: …)`
  // agents-list form lives outside frontmatter) — but the inline/block `tools:` forms
  // are matched against the FRONTMATTER ONLY.
  const fm = raw.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  const txt = fm ? fm[1] : raw; // the frontmatter block, or the whole file if unfenced
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
